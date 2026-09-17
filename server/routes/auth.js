import express from 'express';
import bcrypt from 'bcryptjs';
import { get, run } from '../db.js';
import { generateToken, requireAuth } from '../authMiddleware.js';

const router = express.Router();

// Sign up endpoint
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existingUser = await get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await run(
      `INSERT INTO users (email, password_hash, role, onboarded) VALUES (?, ?, 'STUDENT', 0)`,
      [email.toLowerCase().trim(), passwordHash]
    );

    const newUser = { id: result.lastID, email: email.toLowerCase().trim(), role: 'STUDENT', onboarded: 0 };
    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Signup error:', err);
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

    const user = await get('SELECT id, email, password_hash, role, onboarded FROM users WHERE LOWER(email) = LOWER(?)', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const profile = await get('SELECT * FROM profiles WHERE user_id = ?', [user.id]);

    const token = generateToken(user);
    return res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        onboarded: user.onboarded
      },
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
    return res.json({
      user: req.user,
      profile
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching session user' });
  }
});

export default router;
