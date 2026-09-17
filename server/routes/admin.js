import express from 'express';
import { get, query } from '../db.js';
import { requireAuth, requireAdmin } from '../authMiddleware.js';
import { evaluateTeamRules } from '../ruleEngine.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

// Admin Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const totalStudents = await get(`SELECT COUNT(*) as count FROM users WHERE role = 'STUDENT'`);
    const totalTeams = await get(`SELECT COUNT(*) as count FROM teams`);
    const recruitingTeams = await get(`SELECT COUNT(*) as count FROM teams WHERE status = 'Recruiting'`);
    const totalOpportunities = await get(`SELECT COUNT(*) as count FROM opportunities`);
    const openOpportunities = await get(`SELECT COUNT(*) as count FROM opportunities WHERE status IN ('Published', 'Ongoing', 'Upcoming')`);
    const pendingRequests = await get(`SELECT COUNT(*) as count FROM join_requests WHERE status = 'Pending'`);

    // Check all teams for rule compliance
    const allTeams = await query('SELECT id, name, opportunity_id FROM teams WHERE opportunity_id IS NOT NULL');
    let nonCompliantTeamsCount = 0;
    for (const t of allTeams) {
      const evalRes = await evaluateTeamRules(t.id, t.opportunity_id);
      if (!evalRes.isCompliant) {
        nonCompliantTeamsCount++;
      }
    }

    return res.json({
      stats: {
        totalStudents: totalStudents.count,
        totalTeams: totalTeams.count,
        recruitingTeams: recruitingTeams.count,
        totalOpportunities: totalOpportunities.count,
        openOpportunities: openOpportunities.count,
        pendingRequests: pendingRequests.count,
        nonCompliantTeamsCount
      }
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    return res.status(500).json({ error: 'Failed to load admin dashboard stats' });
  }
});

// Inspect Students
router.get('/students', async (req, res) => {
  try {
    const students = await query(
      `SELECT u.id as user_id, u.email, u.created_at, p.full_name, p.college, p.year_of_study, p.branch, p.is_open_to_teams
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.role = 'STUDENT'
       ORDER BY u.created_at DESC`
    );

    const result = [];
    for (const s of students) {
      const teamsCount = await get('SELECT COUNT(*) as count FROM team_members WHERE user_id = ?', [s.user_id]);
      result.push({
        ...s,
        teamsCount: teamsCount ? teamsCount.count : 0
      });
    }

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching student directory' });
  }
});

// Inspect Teams and their dynamic rule eligibility
router.get('/teams', async (req, res) => {
  try {
    const teams = await query(
      `SELECT t.*, o.title as opportunity_title, p.full_name as leader_name, p.college as leader_college
       FROM teams t
       LEFT JOIN opportunities o ON t.opportunity_id = o.id
       JOIN users u ON t.leader_id = u.id
       JOIN profiles p ON u.id = p.user_id
       ORDER BY t.created_at DESC`
    );

    const decorated = [];
    for (const t of teams) {
      const members = await query(
        `SELECT tm.user_id, tm.role_title, p.full_name, p.year_of_study, p.college
         FROM team_members tm
         JOIN profiles p ON tm.user_id = p.user_id
         WHERE tm.team_id = ?`,
        [t.id]
      );
      const ruleEvaluation = await evaluateTeamRules(t.id);
      decorated.push({
        ...t,
        members,
        member_count: members.length,
        ruleEvaluation
      });
    }

    return res.json(decorated);
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching teams inspector' });
  }
});

export default router;
