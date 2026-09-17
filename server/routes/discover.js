import express from 'express';
import { query } from '../db.js';
import { evaluateTeamRules } from '../ruleEngine.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const q = req.query.query ? req.query.query.trim().toLowerCase() : '';
    const typeFilter = req.query.type || 'all'; // 'all', 'people', 'teams', 'projects', 'opportunities'
    const collegeFilter = req.query.college || '';
    const yearFilter = req.query.year || '';
    const branchFilter = req.query.branch || '';
    const skillFilter = req.query.skill ? req.query.skill.toLowerCase() : '';
    const openToTeamsOnly = req.query.openToTeams === 'true';

    const results = {
      people: [],
      teams: [],
      projects: [],
      opportunities: []
    };

    // 1. Search People
    if (typeFilter === 'all' || typeFilter === 'people') {
      let peopleSql = `
        SELECT p.*, u.email
        FROM profiles p
        JOIN users u ON p.user_id = u.id
        WHERE u.role = 'STUDENT'
      `;
      const params = [];

      if (q) {
        peopleSql += ` AND (LOWER(p.full_name) LIKE ? OR LOWER(p.bio) LIKE ? OR LOWER(p.skills) LIKE ? OR LOWER(p.college) LIKE ? OR LOWER(p.branch) LIKE ?)`;
        params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
      }
      if (collegeFilter) {
        peopleSql += ` AND LOWER(p.college) = LOWER(?)`;
        params.push(collegeFilter);
      }
      if (yearFilter) {
        peopleSql += ` AND p.year_of_study = ?`;
        params.push(yearFilter);
      }
      if (branchFilter) {
        peopleSql += ` AND LOWER(p.branch) = LOWER(?)`;
        params.push(branchFilter);
      }
      if (skillFilter) {
        peopleSql += ` AND LOWER(p.skills) LIKE ?`;
        params.push(`%${skillFilter}%`);
      }
      if (openToTeamsOnly) {
        peopleSql += ` AND p.is_open_to_teams = 1`;
      }

      peopleSql += ` ORDER BY p.created_at DESC LIMIT 30`;
      const peopleList = await query(peopleSql, params);
      results.people = peopleList.map(p => {
        let skills = [];
        let interests = [];
        try { skills = JSON.parse(p.skills || '[]'); } catch (e) {}
        try { interests = JSON.parse(p.interests || '[]'); } catch (e) {}
        return { ...p, skills, interests };
      });
    }

    // 2. Search Teams
    if (typeFilter === 'all' || typeFilter === 'teams') {
      let teamsSql = `
        SELECT t.*, o.title as opportunity_title, p.full_name as leader_name, p.college as leader_college
        FROM teams t
        LEFT JOIN opportunities o ON t.opportunity_id = o.id
        JOIN users u ON t.leader_id = u.id
        JOIN profiles p ON u.id = p.user_id
        WHERE 1=1
      `;
      const params = [];

      if (q) {
        teamsSql += ` AND (LOWER(t.name) LIKE ? OR LOWER(t.project_name) LIKE ? OR LOWER(t.project_description) LIKE ? OR LOWER(t.required_skills) LIKE ? OR LOWER(t.required_roles) LIKE ?)`;
        params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
      }
      if (skillFilter) {
        teamsSql += ` AND LOWER(t.required_skills) LIKE ?`;
        params.push(`%${skillFilter}%`);
      }
      if (req.query.purpose) {
        teamsSql += ` AND t.purpose = ?`;
        params.push(req.query.purpose);
      }

      teamsSql += ` ORDER BY t.created_at DESC LIMIT 30`;
      const rawTeams = await query(teamsSql, params);

      const decoratedTeams = [];
      for (const t of rawTeams) {
        let required_skills = [];
        let required_roles = [];
        try { required_skills = JSON.parse(t.required_skills || '[]'); } catch (e) {}
        try { required_roles = JSON.parse(t.required_roles || '[]'); } catch (e) {}

        const members = await query(
          `SELECT tm.user_id, tm.role_title, p.full_name, p.year_of_study, p.college
           FROM team_members tm
           JOIN profiles p ON tm.user_id = p.user_id
           WHERE tm.team_id = ?`,
          [t.id]
        );

        const ruleEvaluation = await evaluateTeamRules(t.id);

        decoratedTeams.push({
          ...t,
          required_skills,
          required_roles,
          members,
          member_count: members.length,
          ruleEvaluation
        });
      }
      results.teams = decoratedTeams;
    }

    // 3. Search Projects
    if (typeFilter === 'all' || typeFilter === 'projects') {
      let projectsSql = `
        SELECT pr.*, p.full_name as owner_name, p.college as owner_college
        FROM projects pr
        JOIN users u ON pr.owner_id = u.id
        JOIN profiles p ON u.id = p.user_id
        WHERE 1=1
      `;
      const params = [];

      if (q) {
        projectsSql += ` AND (LOWER(pr.title) LIKE ? OR LOWER(pr.description) LIKE ? OR LOWER(pr.skills_used) LIKE ?)`;
        params.push(`%${q}%`, `%${q}%`, `%${q}%`);
      }

      projectsSql += ` ORDER BY pr.created_at DESC LIMIT 30`;
      const projectsList = await query(projectsSql, params);
      results.projects = projectsList.map(pr => {
        let skills_used = [];
        try { skills_used = JSON.parse(pr.skills_used || '[]'); } catch (e) {}
        return { ...pr, skills_used };
      });
    }

    // 4. Search Opportunities
    if (typeFilter === 'all' || typeFilter === 'opportunities') {
      let oppSql = `SELECT * FROM opportunities WHERE status != 'Draft'`;
      const params = [];

      if (q) {
        oppSql += ` AND (LOWER(title) LIKE ? OR LOWER(short_description) LIKE ? OR LOWER(organizer) LIKE ? OR LOWER(type) LIKE ?)`;
        params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
      }

      oppSql += ` ORDER BY created_at DESC LIMIT 30`;
      const oppList = await query(oppSql, params);

      const decoratedOpps = [];
      for (const opp of oppList) {
        const rules = await query('SELECT * FROM opportunity_rules WHERE opportunity_id = ?', [opp.id]);
        decoratedOpps.push({
          ...opp,
          rules: rules[0] || null
        });
      }
      results.opportunities = decoratedOpps;
    }

    return res.json(results);
  } catch (err) {
    console.error('Discover API error:', err);
    return res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
