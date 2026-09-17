import express from 'express';
import { get, query, run } from '../db.js';
import { requireAuth } from '../authMiddleware.js';
import { evaluateTeamRules } from '../ruleEngine.js';

const router = express.Router();

// List / filter public teams
router.get('/', async (req, res) => {
  try {
    const { purpose, opportunity_id, recruiting } = req.query;
    let sql = `
      SELECT t.*, o.title as opportunity_title, p.full_name as leader_name, p.college as leader_college
      FROM teams t
      LEFT JOIN opportunities o ON t.opportunity_id = o.id
      JOIN users u ON t.leader_id = u.id
      JOIN profiles p ON u.id = p.user_id
      WHERE 1=1
    `;
    const params = [];

    if (purpose) {
      sql += ` AND t.purpose = ?`;
      params.push(purpose);
    }
    if (opportunity_id) {
      sql += ` AND t.opportunity_id = ?`;
      params.push(opportunity_id);
    }
    if (recruiting === 'true') {
      sql += ` AND t.status = 'Recruiting'`;
    }

    sql += ` ORDER BY t.created_at DESC`;
    const teams = await query(sql, params);

    const result = [];
    for (const t of teams) {
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

      result.push({
        ...t,
        required_skills,
        required_roles,
        members,
        member_count: members.length,
        ruleEvaluation
      });
    }

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching teams' });
  }
});

// Get teams for current user
router.get('/my', requireAuth, async (req, res) => {
  try {
    const teams = await query(
      `SELECT t.*, tm.role_title as my_role, o.title as opportunity_title
       FROM team_members tm
       JOIN teams t ON tm.team_id = t.id
       LEFT JOIN opportunities o ON t.opportunity_id = o.id
       WHERE tm.user_id = ?
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );

    const result = [];
    for (const t of teams) {
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

      result.push({
        ...t,
        required_skills,
        required_roles,
        members,
        member_count: members.length,
        ruleEvaluation,
        isLeader: t.leader_id === req.user.id
      });
    }

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching user teams' });
  }
});

// Get detailed team page info
router.get('/:id', async (req, res) => {
  try {
    const teamId = req.params.id;
    const team = await get(
      `SELECT t.*, o.title as opportunity_title, o.slug as opportunity_slug, p.full_name as leader_name
       FROM teams t
       LEFT JOIN opportunities o ON t.opportunity_id = o.id
       JOIN users u ON t.leader_id = u.id
       JOIN profiles p ON u.id = p.user_id
       WHERE t.id = ?`,
      [teamId]
    );

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    let required_skills = [];
    let required_roles = [];
    try { required_skills = JSON.parse(team.required_skills || '[]'); } catch (e) {}
    try { required_roles = JSON.parse(team.required_roles || '[]'); } catch (e) {}

    // Members with profile details
    const members = await query(
      `SELECT tm.id as membership_id, tm.user_id, tm.role_title, tm.joined_at, p.full_name, p.college, p.year_of_study, p.branch, p.avatar_url
       FROM team_members tm
       JOIN profiles p ON tm.user_id = p.user_id
       WHERE tm.team_id = ? ORDER BY tm.joined_at ASC`,
      [teamId]
    );

    // Rule engine evaluation
    const ruleEvaluation = await evaluateTeamRules(teamId);

    // Pending join requests
    const pendingRequests = await query(
      `SELECT jr.*, p.full_name, p.college, p.year_of_study, p.branch
       FROM join_requests jr
       JOIN profiles p ON jr.applicant_id = p.user_id
       WHERE jr.team_id = ? AND jr.status = 'Pending'
       ORDER BY jr.created_at DESC`,
      [teamId]
    );

    // Sent invitations
    const pendingInvitations = await query(
      `SELECT inv.*, p.full_name, p.college, p.year_of_study
       FROM invitations inv
       JOIN profiles p ON inv.student_id = p.user_id
       WHERE inv.team_id = ? AND inv.status = 'Pending'
       ORDER BY inv.created_at DESC`,
      [teamId]
    );

    return res.json({
      ...team,
      required_skills,
      required_roles,
      members,
      member_count: members.length,
      ruleEvaluation,
      pendingRequests,
      pendingInvitations
    });
  } catch (err) {
    console.error('Fetch team error:', err);
    return res.status(500).json({ error: 'Error loading team details' });
  }
});

// Create a new Team
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      name,
      purpose, // 'Hackathon', 'Special Event', 'Personal Project'
      opportunity_id,
      project_name,
      project_description,
      required_skills,
      required_roles,
      leader_role_title,
      github_link,
      figma_link,
      demo_link
    } = req.body;

    if (!name || !purpose || !project_name) {
      return res.status(400).json({ error: 'Team Name, Purpose, and Project Name are required' });
    }

    const skillsJson = Array.isArray(required_skills) ? JSON.stringify(required_skills) : required_skills || '[]';
    const rolesJson = Array.isArray(required_roles) ? JSON.stringify(required_roles) : required_roles || '[]';

    const result = await run(
      `INSERT INTO teams (
        name, purpose, opportunity_id, project_name, project_description,
        required_skills, required_roles, leader_id, status, github_link, figma_link, demo_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Recruiting', ?, ?, ?)`,
      [
        name,
        purpose,
        opportunity_id ? parseInt(opportunity_id) : null,
        project_name,
        project_description || '',
        skillsJson,
        rolesJson,
        req.user.id,
        github_link || '',
        figma_link || '',
        demo_link || ''
      ]
    );

    const teamId = result.lastID;

    // Add Leader as first team member
    await run(
      `INSERT INTO team_members (team_id, user_id, role_title) VALUES (?, ?, ?)`,
      [teamId, req.user.id, leader_role_title || 'Team Leader']
    );

    // Initial rule check
    const ruleEval = await evaluateTeamRules(teamId);

    return res.status(201).json({
      message: 'Team created successfully',
      teamId,
      ruleEvaluation: ruleEval
    });
  } catch (err) {
    console.error('Create team error:', err);
    return res.status(500).json({ error: 'Failed to create team' });
  }
});

// Request to Join Team (Student -> Team Leader)
router.post('/:id/request', requireAuth, async (req, res) => {
  try {
    const teamId = req.params.id;
    const { message } = req.body;

    const team = await get('SELECT * FROM teams WHERE id = ?', [teamId]);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check if user is already a member
    const existingMember = await get('SELECT id FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, req.user.id]);
    if (existingMember) {
      return res.status(400).json({ error: 'You are already a member of this team' });
    }

    // Check if active pending request exists
    const existingReq = await get(
      `SELECT id FROM join_requests WHERE team_id = ? AND applicant_id = ? AND status = 'Pending'`,
      [teamId, req.user.id]
    );
    if (existingReq) {
      return res.status(400).json({ error: 'You already have a pending request to join this team' });
    }

    const result = await run(
      `INSERT INTO join_requests (team_id, applicant_id, message, status) VALUES (?, ?, ?, 'Pending')`,
      [teamId, req.user.id, message || '']
    );

    // Fetch applicant profile for notification message
    const applicantProfile = await get('SELECT full_name FROM profiles WHERE user_id = ?', [req.user.id]);
    const applicantName = applicantProfile ? applicantProfile.full_name : 'A student';

    // Send Notification to Team Leader
    await run(
      `INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
       VALUES (?, ?, ?, 'join_request', 'team', ?)`,
      [
        team.leader_id,
        'New Join Request',
        `${applicantName} requested to join ${team.name}.`,
        teamId
      ]
    );

    return res.status(201).json({
      message: 'Join request sent successfully',
      requestId: result.lastID
    });
  } catch (err) {
    console.error('Join request error:', err);
    return res.status(500).json({ error: 'Failed to send join request' });
  }
});

// Review Join Request (Accept / Reject) - Leader Only
router.put('/:id/requests/:requestId', requireAuth, async (req, res) => {
  try {
    const { id: teamId, requestId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    const team = await get('SELECT * FROM teams WHERE id = ?', [teamId]);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    if (team.leader_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the team leader can review join requests' });
    }

    const joinReq = await get('SELECT * FROM join_requests WHERE id = ? AND team_id = ?', [requestId, teamId]);
    if (!joinReq || joinReq.status !== 'Pending') {
      return res.status(404).json({ error: 'Pending join request not found' });
    }

    if (action === 'accept') {
      // Check capacity / rules
      await run(`UPDATE join_requests SET status = 'Accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [requestId]);

      // Add to team_members
      await run(
        `INSERT OR IGNORE INTO team_members (team_id, user_id, role_title) VALUES (?, ?, 'Member')`,
        [teamId, joinReq.applicant_id]
      );

      // Recalculate dynamic eligibility
      const ruleEval = await evaluateTeamRules(teamId);

      // Notify Applicant
      await run(
        `INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
         VALUES (?, ?, ?, 'request_accepted', 'team', ?)`,
        [
          joinReq.applicant_id,
          'Request Accepted!',
          `Your request to join ${team.name} was accepted!`,
          teamId
        ]
      );

      return res.json({
        message: 'Join request accepted',
        ruleEvaluation: ruleEval
      });
    } else if (action === 'reject') {
      await run(`UPDATE join_requests SET status = 'Rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [requestId]);

      // Notify Applicant
      await run(
        `INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
         VALUES (?, ?, ?, 'request_rejected', 'team', ?)`,
        [
          joinReq.applicant_id,
          'Request Declined',
          `Your request to join ${team.name} was declined.`,
          teamId
        ]
      );

      return res.json({ message: 'Join request rejected' });
    } else {
      return res.status(400).json({ error: 'Invalid action. Must be accept or reject' });
    }
  } catch (err) {
    console.error('Review request error:', err);
    return res.status(500).json({ error: 'Failed to process join request' });
  }
});

// Leader Invites Student to Team
router.post('/:id/invite', requireAuth, async (req, res) => {
  try {
    const teamId = req.params.id;
    const { student_id, role_title } = req.body;

    const team = await get('SELECT * FROM teams WHERE id = ?', [teamId]);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    if (team.leader_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the team leader can invite students' });
    }

    const existingMember = await get('SELECT id FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, student_id]);
    if (existingMember) {
      return res.status(400).json({ error: 'Student is already a member of this team' });
    }

    const existingInv = await get(
      `SELECT id FROM invitations WHERE team_id = ? AND student_id = ? AND status = 'Pending'`,
      [teamId, student_id]
    );
    if (existingInv) {
      return res.status(400).json({ error: 'An invitation is already pending for this student' });
    }

    const result = await run(
      `INSERT INTO invitations (team_id, student_id, invited_by, role_title, status) VALUES (?, ?, ?, ?, 'Pending')`,
      [teamId, student_id, req.user.id, role_title || 'Member']
    );

    // Notify Student
    await run(
      `INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
       VALUES (?, ?, ?, 'invitation', 'team', ?)`,
      [
        student_id,
        'Team Invitation',
        `You have been invited to join ${team.name} as ${role_title || 'Member'}.`,
        teamId
      ]
    );

    return res.status(201).json({
      message: 'Invitation sent successfully',
      invitationId: result.lastID
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// Student Accepts/Rejects Invitation
router.put('/invitations/:invitationId', requireAuth, async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    const inv = await get('SELECT * FROM invitations WHERE id = ?', [invitationId]);
    if (!inv || inv.student_id !== req.user.id || inv.status !== 'Pending') {
      return res.status(404).json({ error: 'Pending invitation not found' });
    }

    const team = await get('SELECT * FROM teams WHERE id = ?', [inv.team_id]);

    if (action === 'accept') {
      await run(`UPDATE invitations SET status = 'Accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [invitationId]);
      await run(
        `INSERT OR IGNORE INTO team_members (team_id, user_id, role_title) VALUES (?, ?, ?)`,
        [inv.team_id, req.user.id, inv.role_title || 'Member']
      );

      const ruleEval = await evaluateTeamRules(inv.team_id);

      // Notify Leader
      if (team) {
        await run(
          `INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
           VALUES (?, ?, ?, 'team_update', 'team', ?)`,
          [
            team.leader_id,
            'Invitation Accepted',
            `A student accepted your invitation to join ${team.name}.`,
            team.id
          ]
        );
      }

      return res.json({ message: 'Invitation accepted', ruleEvaluation: ruleEval });
    } else {
      await run(`UPDATE invitations SET status = 'Rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [invitationId]);
      return res.json({ message: 'Invitation declined' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Failed to process invitation' });
  }
});

// Update Team & Member Roles (Leader Only)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const teamId = req.params.id;
    const team = await get('SELECT * FROM teams WHERE id = ?', [teamId]);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    if (team.leader_id !== req.user.id) {
      return res.status(403).json({ error: 'Only team leader can update team settings' });
    }

    const {
      name,
      purpose,
      project_name,
      project_description,
      required_skills,
      required_roles,
      status,
      github_link,
      figma_link,
      demo_link
    } = req.body;

    const skillsJson = Array.isArray(required_skills) ? JSON.stringify(required_skills) : required_skills || team.required_skills;
    const rolesJson = Array.isArray(required_roles) ? JSON.stringify(required_roles) : required_roles || team.required_roles;

    await run(
      `UPDATE teams SET
        name = COALESCE(?, name),
        purpose = COALESCE(?, purpose),
        project_name = COALESCE(?, project_name),
        project_description = COALESCE(?, project_description),
        required_skills = ?,
        required_roles = ?,
        status = COALESCE(?, status),
        github_link = COALESCE(?, github_link),
        figma_link = COALESCE(?, figma_link),
        demo_link = COALESCE(?, demo_link),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name,
        purpose,
        project_name,
        project_description,
        skillsJson,
        rolesJson,
        status,
        github_link,
        figma_link,
        demo_link,
        teamId
      ]
    );

    return res.json({ message: 'Team updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update team' });
  }
});

// Transfer Leadership (Required if Leader wants to leave or reassign)
router.post('/:id/transfer-leadership', requireAuth, async (req, res) => {
  try {
    const teamId = req.params.id;
    const { new_leader_id } = req.body;

    const team = await get('SELECT * FROM teams WHERE id = ?', [teamId]);
    if (!team || team.leader_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the current team leader can transfer leadership' });
    }

    const newLeaderMember = await get('SELECT id FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, new_leader_id]);
    if (!newLeaderMember) {
      return res.status(400).json({ error: 'New leader must be an existing member of the team' });
    }

    await run('UPDATE teams SET leader_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [new_leader_id, teamId]);
    await run(`UPDATE team_members SET role_title = 'Team Leader' WHERE team_id = ? AND user_id = ?`, [teamId, new_leader_id]);

    // Notify New Leader
    await run(
      `INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
       VALUES (?, ?, ?, 'team_update', 'team', ?)`,
      [
        new_leader_id,
        'Leadership Transferred',
        `You are now the team leader of ${team.name}.`,
        teamId
      ]
    );

    return res.json({ message: 'Leadership transferred successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to transfer leadership' });
  }
});

// Team Chat Messages
router.get('/:id/messages', requireAuth, async (req, res) => {
  try {
    const teamId = req.params.id;
    const isMember = await get('SELECT id FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, req.user.id]);
    if (!isMember) {
      return res.status(403).json({ error: 'Must be a team member to access chat' });
    }

    const messages = await query(
      `SELECT tm.*, p.full_name as sender_name, p.avatar_url as sender_avatar
       FROM team_messages tm
       JOIN profiles p ON tm.sender_id = p.user_id
       WHERE tm.team_id = ?
       ORDER BY tm.created_at ASC LIMIT 100`,
      [teamId]
    );

    return res.json(messages);
  } catch (err) {
    return res.status(500).json({ error: 'Error loading team messages' });
  }
});

router.post('/:id/messages', requireAuth, async (req, res) => {
  try {
    const teamId = req.params.id;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message text cannot be empty' });
    }

    const isMember = await get('SELECT id FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, req.user.id]);
    if (!isMember) {
      return res.status(403).json({ error: 'Must be a team member to send chat messages' });
    }

    const result = await run(
      `INSERT INTO team_messages (team_id, sender_id, message) VALUES (?, ?, ?)`,
      [teamId, req.user.id, message.trim()]
    );

    const senderProfile = await get('SELECT full_name, avatar_url FROM profiles WHERE user_id = ?', [req.user.id]);

    return res.status(201).json({
      id: result.lastID,
      team_id: teamId,
      sender_id: req.user.id,
      message: message.trim(),
      sender_name: senderProfile ? senderProfile.full_name : 'Member',
      sender_avatar: senderProfile ? senderProfile.avatar_url : '',
      created_at: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
