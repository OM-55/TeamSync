import express from 'express';
import cors from 'cors';
import { initDb } from '../server/db.js';

import authRoutes from '../server/routes/auth.js';
import profileRoutes from '../server/routes/profiles.js';
import discoverRoutes from '../server/routes/discover.js';
import teamRoutes from '../server/routes/teams.js';
import opportunityRoutes from '../server/routes/opportunities.js';
import notificationRoutes from '../server/routes/notifications.js';
import projectRoutes from '../server/routes/projects.js';
import adminRoutes from '../server/routes/admin.js';

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Database on Vercel Serverless Function Invocation
app.use(async (req, res, next) => {
  try {
    await initDb();
    next();
  } catch (err) {
    console.error('Vercel DB Init Error:', err);
    next();
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/admin', adminRoutes);

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: 'vercel', timestamp: new Date().toISOString() });
});

export default app;
