import express from 'express';
import bcrypt from 'bcryptjs';
import { get, run, cacheUser, cacheProfile } from '../db.js';
import { generateToken, requireAuth } from '../authMiddleware.js';

const router = express.Router();

// Sign up endpoint
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existingUser = await get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [cleanEmail]);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await run(
      `INSERT INTO users (email, password_hash, role, onboarded) VALUES (?, ?, 'STUDENT', 0)`,
      [cleanEmail, passwordHash]
    );

    const userId = result.lastID;

    // Initialize default profile shell
    await run(
      `INSERT OR IGNORE INTO profiles (user_id, full_name, college, year_of_study, branch) VALUES (?, ?, ?, ?, ?)`,
      [userId, cleanEmail.split('@')[0], 'Select College', '1st Year', 'Computer Science']
    );

    const newUser = { id: userId, email: cleanEmail, role: 'STUDENT', onboarded: 0 };
    const newProfile = await get('SELECT * FROM profiles WHERE user_id = ?', [userId]);

    // Cache user and profile in persistent memory
    cacheUser(newUser);
    cacheProfile(newProfile);

    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: newUser,
      profile: newProfile
    });
  } catch (err) {
    console.error('Signup server error:', err);
    return res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await get('SELECT id, email, password_hash, role, onboarded FROM users WHERE LOWER(email) = LOWER(?)', [cleanEmail]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const profile = await get('SELECT * FROM profiles WHERE user_id = ?', [user.id]);

    const sessionUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      onboarded: user.onboarded
    };

    cacheUser(sessionUser);
    cacheProfile(profile);

    const token = generateToken(sessionUser);
    return res.json({
      message: 'Logged in successfully',
      token,
      user: sessionUser,
      profile
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user session
router.get('/me', requireAuth, async (req, res) => {
  try {
    const profile = await get('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    cacheUser(req.user);
    cacheProfile(profile);
    return res.json({
      user: req.user,
      profile
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching session user' });
  }
});

export default router;
