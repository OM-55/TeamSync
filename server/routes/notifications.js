import express from 'express';
import { query, run } from '../db.js';
import { requireAuth } from '../authMiddleware.js';

const router = express.Router();

// Get persistent notifications for logged in user
router.get('/', requireAuth, async (req, res) => {
  try {
    const list = await query(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );

    const unreadCountRow = await query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [req.user.id]
    );

    return res.json({
      notifications: list,
      unreadCount: unreadCountRow[0] ? unreadCountRow[0].count : 0
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching notifications' });
  }
});

// Mark single notification read
router.put('/:id/read', requireAuth, async (req, res) => {
  try {
    await run(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id]);
    return res.json({ message: 'Notification marked as read' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all notifications read
router.put('/read-all', requireAuth, async (req, res) => {
  try {
    await run(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [req.user.id]);
    return res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update notifications' });
  }
});

export default router;
