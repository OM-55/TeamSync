import express from 'express';
import { get, query, run } from '../db.js';
import { requireAuth } from '../authMiddleware.js';

const router = express.Router();

// Get showcase projects
router.get('/', async (req, res) => {
  try {
    const list = await query(
      `SELECT pr.*, p.full_name as owner_name, p.college as owner_college, p.avatar_url as owner_avatar
       FROM projects pr
       JOIN users u ON pr.owner_id = u.id
       JOIN profiles p ON u.id = p.user_id
       ORDER BY pr.is_showcase DESC, pr.created_at DESC`
    );

    const decorated = list.map(item => {
      let skills_used = [];
      try { skills_used = JSON.parse(item.skills_used || '[]'); } catch (e) {}
      return { ...item, skills_used };
    });

    return res.json(decorated);
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching projects' });
  }
});

// Create project / showcase item
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, skills_used, status, demo_url, repo_url, outcome, is_showcase, team_id } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and Description are required' });
    }

    const skillsJson = Array.isArray(skills_used) ? JSON.stringify(skills_used) : skills_used || '[]';

    const result = await run(
      `INSERT INTO projects (
        team_id, owner_id, title, description, skills_used, status, demo_url, repo_url, outcome, is_showcase
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        team_id || null,
        req.user.id,
        title,
        description,
        skillsJson,
        status || 'Completed',
        demo_url || '',
        repo_url || '',
        outcome || '',
        is_showcase ? 1 : 0
      ]
    );

    return res.status(201).json({
      message: 'Project saved successfully',
      projectId: result.lastID
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save project' });
  }
});

export default router;
