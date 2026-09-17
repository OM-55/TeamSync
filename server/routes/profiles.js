import express from 'express';
import { get, query, run, cacheUser, cacheProfile } from '../db.js';
import { requireAuth } from '../authMiddleware.js';

const router = express.Router();

// Get searchable colleges list
router.get('/colleges', async (req, res) => {
  try {
    const { q } = req.query;
    let colleges;
    if (q) {
      colleges = await query('SELECT * FROM colleges WHERE LOWER(name) LIKE ? ORDER BY name ASC LIMIT 20', [`%${q.toLowerCase()}%`]);
    } else {
      colleges = await query('SELECT * FROM colleges ORDER BY name ASC');
    }
    return res.json(colleges);
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching colleges' });
  }
});

// Complete Required Onboarding
router.post('/onboard', requireAuth, async (req, res) => {
  try {
    const { full_name, college, year_of_study, branch } = req.body;

    if (!full_name || !college || !year_of_study || !branch) {
      return res.status(400).json({ error: 'Full Name, College, Year of Study, and Branch are required' });
    }

    const existingProfile = await get('SELECT id FROM profiles WHERE user_id = ?', [req.user.id]);
    if (existingProfile) {
      await run(
        `UPDATE profiles SET full_name = ?, college = ?, year_of_study = ?, branch = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
        [full_name, college, year_of_study, branch, req.user.id]
      );
    } else {
      await run(
        `INSERT INTO profiles (user_id, full_name, college, year_of_study, branch) VALUES (?, ?, ?, ?, ?)`,
        [req.user.id, full_name, college, year_of_study, branch]
      );
    }

    await run('UPDATE users SET onboarded = 1 WHERE id = ?', [req.user.id]);

    const updatedUser = await get('SELECT id, email, role, onboarded FROM users WHERE id = ?', [req.user.id]) || {
      ...req.user,
      onboarded: 1
    };
    const updatedProfile = await get('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);

    cacheUser(updatedUser);
    cacheProfile(updatedProfile);

    return res.json({
      message: 'Onboarding completed successfully',
      user: updatedUser,
      profile: updatedProfile
    });
  } catch (err) {
    console.error('Onboarding error:', err);
    return res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

// Update Profile details
router.put('/me', requireAuth, async (req, res) => {
  try {
    const {
      full_name,
      college,
      year_of_study,
      branch,
      bio,
      skills,
      interests,
      is_open_to_teams,
      github_url,
      linkedin_url,
      portfolio_url
    } = req.body;

    const skillsJson = Array.isArray(skills) ? JSON.stringify(skills) : skills || '[]';
    const interestsJson = Array.isArray(interests) ? JSON.stringify(interests) : interests || '[]';

    await run(
      `UPDATE profiles SET
        full_name = COALESCE(?, full_name),
        college = COALESCE(?, college),
        year_of_study = COALESCE(?, year_of_study),
        branch = COALESCE(?, branch),
        bio = COALESCE(?, bio),
        skills = ?,
        interests = ?,
        is_open_to_teams = COALESCE(?, is_open_to_teams),
        github_url = COALESCE(?, github_url),
        linkedin_url = COALESCE(?, linkedin_url),
        portfolio_url = COALESCE(?, portfolio_url),
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [
        full_name,
        college,
        year_of_study,
        branch,
        bio,
        skillsJson,
        interestsJson,
        is_open_to_teams !== undefined ? (is_open_to_teams ? 1 : 0) : null,
        github_url,
        linkedin_url,
        portfolio_url,
        req.user.id
      ]
    );

    const updatedProfile = await get('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    cacheProfile(updatedProfile);
    return res.json(updatedProfile);
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get public Student profile by userId
router.get('/:userId', async (req, res) => {
  try {
    const profile = await get('SELECT * FROM profiles WHERE user_id = ?', [req.params.userId]);
    if (!profile) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const showcaseProjects = await query(
      'SELECT * FROM projects WHERE owner_id = ? ORDER BY created_at DESC',
      [req.params.userId]
    );

    const teams = await query(
      `SELECT t.id, t.name, t.purpose, t.project_name, tm.role_title, t.status
       FROM team_members tm
       JOIN teams t ON tm.team_id = t.id
       WHERE tm.user_id = ?`,
      [req.params.userId]
    );

    return res.json({
      profile,
      projects: showcaseProjects,
      teams
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching profile' });
  }
});

export default router;
