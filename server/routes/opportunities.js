import express from 'express';
import { get, query, run } from '../db.js';
import { requireAuth, requireAdmin } from '../authMiddleware.js';
import { evaluateTeamRules } from '../ruleEngine.js';

const router = express.Router();

// Get public opportunities
router.get('/', async (req, res) => {
  try {
    const { status, type } = req.query;
    let sql = `SELECT * FROM opportunities WHERE 1=1`;
    const params = [];

    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    } else {
      sql += ` AND status != 'Draft'`;
    }

    if (type) {
      sql += ` AND type = ?`;
      params.push(type);
    }

    sql += ` ORDER BY created_at DESC`;
    const list = await query(sql, params);

    const result = [];
    for (const opp of list) {
      const rules = await get('SELECT * FROM opportunity_rules WHERE opportunity_id = ?', [opp.id]);
      let compRules = [];
      try { compRules = JSON.parse(rules?.composition_rules || '[]'); } catch (e) {}

      // Count participating teams
      const teamCount = await get('SELECT COUNT(*) as count FROM teams WHERE opportunity_id = ?', [opp.id]);

      result.push({
        ...opp,
        rules: rules ? { ...rules, composition_rules: compRules } : null,
        participatingTeamsCount: teamCount ? teamCount.count : 0
      });
    }

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching opportunities' });
  }
});

// Get Opportunity details + participating teams + dynamic rules
router.get('/:idOrSlug', async (req, res) => {
  try {
    const param = req.params.idOrSlug;
    let opp;
    if (/^\d+$/.test(param)) {
      opp = await get('SELECT * FROM opportunities WHERE id = ?', [param]);
    } else {
      opp = await get('SELECT * FROM opportunities WHERE slug = ?', [param]);
    }

    if (!opp) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    const rules = await get('SELECT * FROM opportunity_rules WHERE opportunity_id = ?', [opp.id]);
    let compRules = [];
    try { compRules = JSON.parse(rules?.composition_rules || '[]'); } catch (e) {}

    // Participating teams with member count and rule validation
    const teams = await query(
      `SELECT t.*, p.full_name as leader_name, p.college as leader_college
       FROM teams t
       JOIN users u ON t.leader_id = u.id
       JOIN profiles p ON u.id = p.user_id
       WHERE t.opportunity_id = ?
       ORDER BY t.created_at DESC`,
      [opp.id]
    );

    const decoratedTeams = [];
    for (const t of teams) {
      const members = await query(
        `SELECT tm.user_id, tm.role_title, p.full_name, p.year_of_study, p.college
         FROM team_members tm
         JOIN profiles p ON tm.user_id = p.user_id
         WHERE tm.team_id = ?`,
        [t.id]
      );
      const ruleEval = await evaluateTeamRules(t.id, opp.id);
      decoratedTeams.push({
        ...t,
        members,
        member_count: members.length,
        ruleEvaluation: ruleEval
      });
    }

    return res.json({
      ...opp,
      rules: rules ? { ...rules, composition_rules: compRules } : null,
      participatingTeams: decoratedTeams
    });
  } catch (err) {
    console.error('Fetch opportunity details error:', err);
    return res.status(500).json({ error: 'Error loading opportunity details' });
  }
});

// Admin Endpoint: Create Opportunity with Configurable Rules
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      organizer,
      short_description,
      description,
      type, // 'Hackathon', 'Competition', 'Challenge', 'Special Event'
      status, // 'Draft', 'Published', 'Ongoing', 'Upcoming', 'Past', 'Closed'
      location,
      start_date,
      end_date,
      participation_mode, // 'Individual', 'Team', 'Optional'
      // Rules configuration
      min_team_size,
      max_team_size,
      exact_team_size,
      composition_rules // Array of rule objects e.g. [{ attribute: 'year_of_study', operator: 'exact', value: '2nd Year', count: 2 }]
    } = req.body;

    if (!title || !organizer || !short_description || !description) {
      return res.status(400).json({ error: 'Title, Organizer, Short Description, and Description are required' });
    }

    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now();

    const result = await run(
      `INSERT INTO opportunities (
        title, slug, organizer, short_description, description, type, status,
        location, start_date, end_date, participation_mode, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        slug,
        organizer,
        short_description,
        description,
        type || 'Hackathon',
        status || 'Published',
        location || 'Virtual',
        start_date || '',
        end_date || '',
        participation_mode || 'Team',
        req.user.id
      ]
    );

    const opportunityId = result.lastID;

    // Save Opportunity Rules
    const compRulesJson = Array.isArray(composition_rules) ? JSON.stringify(composition_rules) : composition_rules || '[]';
    await run(
      `INSERT INTO opportunity_rules (
        opportunity_id, min_team_size, max_team_size, exact_team_size, composition_rules
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        opportunityId,
        min_team_size !== undefined ? parseInt(min_team_size) : 1,
        max_team_size !== undefined ? parseInt(max_team_size) : 10,
        exact_team_size ? parseInt(exact_team_size) : null,
        compRulesJson
      ]
    );

    return res.status(201).json({
      message: 'Opportunity created successfully',
      opportunityId,
      slug
    });
  } catch (err) {
    console.error('Create opportunity error:', err);
    return res.status(500).json({ error: 'Failed to create opportunity' });
  }
});

// Admin Endpoint: Update Opportunity & Rules
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const opportunityId = req.params.id;
    const {
      title,
      organizer,
      short_description,
      description,
      type,
      status,
      location,
      start_date,
      end_date,
      participation_mode,
      min_team_size,
      max_team_size,
      exact_team_size,
      composition_rules
    } = req.body;

    const existing = await get('SELECT id FROM opportunities WHERE id = ?', [opportunityId]);
    if (!existing) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    await run(
      `UPDATE opportunities SET
        title = COALESCE(?, title),
        organizer = COALESCE(?, organizer),
        short_description = COALESCE(?, short_description),
        description = COALESCE(?, description),
        type = COALESCE(?, type),
        status = COALESCE(?, status),
        location = COALESCE(?, location),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        participation_mode = COALESCE(?, participation_mode)
       WHERE id = ?`,
      [title, organizer, short_description, description, type, status, location, start_date, end_date, participation_mode, opportunityId]
    );

    // Update Rules if provided
    if (min_team_size !== undefined || max_team_size !== undefined || exact_team_size !== undefined || composition_rules !== undefined) {
      const compRulesJson = Array.isArray(composition_rules) ? JSON.stringify(composition_rules) : composition_rules;

      const ruleRow = await get('SELECT id FROM opportunity_rules WHERE opportunity_id = ?', [opportunityId]);
      if (ruleRow) {
        await run(
          `UPDATE opportunity_rules SET
            min_team_size = COALESCE(?, min_team_size),
            max_team_size = COALESCE(?, max_team_size),
            exact_team_size = ?,
            composition_rules = COALESCE(?, composition_rules)
           WHERE opportunity_id = ?`,
          [min_team_size, max_team_size, exact_team_size ? parseInt(exact_team_size) : null, compRulesJson, opportunityId]
        );
      } else {
        await run(
          `INSERT INTO opportunity_rules (opportunity_id, min_team_size, max_team_size, exact_team_size, composition_rules) VALUES (?, ?, ?, ?, ?)`,
          [opportunityId, min_team_size || 1, max_team_size || 10, exact_team_size ? parseInt(exact_team_size) : null, compRulesJson || '[]']
        );
      }
    }

    return res.json({ message: 'Opportunity updated successfully' });
  } catch (err) {
    console.error('Update opportunity error:', err);
    return res.status(500).json({ error: 'Failed to update opportunity' });
  }
});

export default router;
