import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db.js';

import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import discoverRoutes from './routes/discover.js';
import teamRoutes from './routes/teams.js';
import opportunityRoutes from './routes/opportunities.js';
import notificationRoutes from './routes/notifications.js';
import projectRoutes from './routes/projects.js';
import adminRoutes from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend build in production
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'API route not found' });
  }
});

async function startServer() {
  try {
    await initDb();
    console.log('Database initialized successfully.');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`TeamSync API Server running on http://127.0.0.1:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize database or start server:', err);
    process.exit(1);
  }
}

startServer();
