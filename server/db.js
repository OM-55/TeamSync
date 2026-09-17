import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { supabase, checkSupabaseConnection } from './supabaseClient.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = Boolean(process.env.VERCEL);
const dbPath = isVercel ? '/tmp/teamsync.db' : path.resolve(__dirname, '../teamsync.db');

const verboseSqlite = sqlite3.verbose();
const db = new verboseSqlite.Database(dbPath);

// Global memory persistence maps for Vercel serverless function lifecycle
const memoryUsers = new Map();
const memoryProfiles = new Map();

export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) resolve([]);
      else resolve(rows || []);
    });
  });
};

export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) resolve({ lastID: Date.now(), changes: 1 });
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const get = async (sql, params = []) => {
  // Check memory persistence for User queries by Email
  if (sql.includes('FROM users WHERE LOWER(email) = LOWER(?)')) {
    const emailKey = String(params[0]).toLowerCase().trim();
    if (memoryUsers.has(emailKey)) {
      return memoryUsers.get(emailKey);
    }
  }

  // Check memory persistence for User queries by ID
  if (sql.includes('FROM users WHERE id =')) {
    const userId = parseInt(params[0]);
    for (const u of memoryUsers.values()) {
      if (u.id === userId) return u;
    }
  }

  // Check memory persistence for Profile queries by user_id
  if (sql.includes('FROM profiles WHERE user_id =')) {
    const userId = parseInt(params[0]);
    if (memoryProfiles.has(userId)) {
      return memoryProfiles.get(userId);
    }
  }

  return new Promise((resolve) => {
    db.get(sql, params, (err, row) => {
      if (err) resolve(null);
      else resolve(row || null);
    });
  });
};

export function registerUserInMemory(user) {
  if (!user) return;
  if (user.email) {
    memoryUsers.set(user.email.toLowerCase().trim(), user);
  }
  if (user.id) {
    memoryUsers.set(`id_${user.id}`, user);
  }
}

export function registerProfileInMemory(profile) {
  if (!profile || !profile.user_id) return;
  memoryProfiles.set(profile.user_id, profile);
}

let isInitialized = false;

export async function initDb() {
  if (isInitialized) return;

  await run('PRAGMA foreign_keys = ON;');
  await checkSupabaseConnection();

  // Users Table
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'STUDENT',
      onboarded INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Profiles Table
  await run(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      college TEXT NOT NULL,
      year_of_study TEXT NOT NULL,
      branch TEXT NOT NULL,
      bio TEXT DEFAULT '',
      skills TEXT DEFAULT '[]',
      interests TEXT DEFAULT '[]',
      is_open_to_teams INTEGER DEFAULT 1,
      avatar_url TEXT DEFAULT '',
      github_url TEXT DEFAULT '',
      linkedin_url TEXT DEFAULT '',
      portfolio_url TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Colleges Table
  await run(`
    CREATE TABLE IF NOT EXISTS colleges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      city TEXT DEFAULT '',
      state TEXT DEFAULT ''
    );
  `);

  // Opportunities Table
  await run(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      organizer TEXT NOT NULL,
      short_description TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Published',
      location TEXT DEFAULT 'Virtual',
      start_date TEXT DEFAULT '',
      end_date TEXT DEFAULT '',
      participation_mode TEXT NOT NULL DEFAULT 'Team',
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Opportunity Rules Table
  await run(`
    CREATE TABLE IF NOT EXISTS opportunity_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opportunity_id INTEGER NOT NULL UNIQUE,
      min_team_size INTEGER DEFAULT 1,
      max_team_size INTEGER DEFAULT 10,
      exact_team_size INTEGER,
      composition_rules TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
    );
  `);

  // Teams Table
  await run(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      purpose TEXT NOT NULL,
      opportunity_id INTEGER,
      project_name TEXT NOT NULL,
      project_description TEXT DEFAULT '',
      required_skills TEXT DEFAULT '[]',
      required_roles TEXT DEFAULT '[]',
      leader_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Recruiting',
      github_link TEXT DEFAULT '',
      figma_link TEXT DEFAULT '',
      demo_link TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(leader_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(opportunity_id) REFERENCES opportunities(id) ON DELETE SET NULL
    );
  `);

  // Team Members Table
  await run(`
    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role_title TEXT NOT NULL DEFAULT 'Member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(team_id, user_id),
      FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Join Requests Table
  await run(`
    CREATE TABLE IF NOT EXISTS join_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      applicant_id INTEGER NOT NULL,
      message TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY(applicant_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Invitations Table
  await run(`
    CREATE TABLE IF NOT EXISTS invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      invited_by INTEGER NOT NULL,
      role_title TEXT DEFAULT 'Member',
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(invited_by) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Projects Table
  await run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER,
      owner_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      skills_used TEXT DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'Building',
      demo_url TEXT DEFAULT '',
      repo_url TEXT DEFAULT '',
      outcome TEXT DEFAULT '',
      is_showcase INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Notifications Table
  await run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      related_entity_type TEXT DEFAULT '',
      related_entity_id INTEGER DEFAULT 0,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Team Messages Table
  await run(`
    CREATE TABLE IF NOT EXISTS team_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await seedData();
  isInitialized = true;
}

async function seedData() {
  const existingColleges = await get('SELECT COUNT(*) as count FROM colleges');
  if (!existingColleges || existingColleges.count === 0) {
    const defaultColleges = [
      'Stanford University',
      'Massachusetts Institute of Technology',
      'Carnegie Mellon University',
      'UC Berkeley',
      'Harvard University',
      'Indian Institute of Technology Bombay',
      'Indian Institute of Technology Delhi',
      'National University of Singapore',
      'Georgia Institute of Technology',
      'University of Oxford',
      'Thadomal Shahani Engineering College'
    ];
    for (const name of defaultColleges) {
      await run('INSERT INTO colleges (name) VALUES (?)', [name]);
    }
  }

  const existingUsers = await get('SELECT COUNT(*) as count FROM users');
  if (!existingUsers || existingUsers.count === 0) {
    const passwordHash = await bcrypt.hash('Password123!', 10);

    // Admin user
    const adminResult = await run(
      `INSERT INTO users (email, password_hash, role, onboarded) VALUES (?, ?, ?, ?)`,
      ['admin@teamsync.edu', passwordHash, 'ADMIN', 1]
    );
    const adminObj = { id: adminResult.lastID, email: 'admin@teamsync.edu', password_hash: passwordHash, role: 'ADMIN', onboarded: 1 };
    registerUserInMemory(adminObj);

    await run(
      `INSERT INTO profiles (user_id, full_name, college, year_of_study, branch, bio, skills, interests) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        adminResult.lastID,
        'Platform Administrator',
        'Stanford University',
        'Other',
        'Computer Science',
        'TeamSync Platform Manager',
        JSON.stringify(['Administration', 'Moderation', 'Event Management']),
        JSON.stringify(['Hackathons', 'Student Building'])
      ]
    );

    // Demo Students
    const student1 = await run(
      `INSERT INTO users (email, password_hash, role, onboarded) VALUES (?, ?, ?, ?)`,
      ['alex@mit.edu', passwordHash, 'STUDENT', 1]
    );
    const s1Obj = { id: student1.lastID, email: 'alex@mit.edu', password_hash: passwordHash, role: 'STUDENT', onboarded: 1 };
    registerUserInMemory(s1Obj);

    await run(
      `INSERT INTO profiles (user_id, full_name, college, year_of_study, branch, bio, skills, interests, is_open_to_teams, github_url, linkedin_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student1.lastID,
        'Alex Rivera',
        'Massachusetts Institute of Technology',
        '2nd Year',
        'Computer Science & Engineering',
        'Passionate full-stack developer interested in distributed systems and hackathons.',
        JSON.stringify(['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Express']),
        JSON.stringify(['Hackathons', 'Web Apps', 'Open Source']),
        1,
        'https://github.com',
        'https://linkedin.com'
      ]
    );

    const student2 = await run(
      `INSERT INTO users (email, password_hash, role, onboarded) VALUES (?, ?, ?, ?)`,
      ['priya@stanford.edu', passwordHash, 'STUDENT', 1]
    );
    const s2Obj = { id: student2.lastID, email: 'priya@stanford.edu', password_hash: passwordHash, role: 'STUDENT', onboarded: 1 };
    registerUserInMemory(s2Obj);

    await run(
      `INSERT INTO profiles (user_id, full_name, college, year_of_study, branch, bio, skills, interests, is_open_to_teams, github_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student2.lastID,
        'Priya Sharma',
        'Stanford University',
        '2nd Year',
        'Artificial Intelligence & Data Science',
        'Machine learning enthusiast working on NLP models and UI design.',
        JSON.stringify(['Python', 'PyTorch', 'Figma', 'React', 'FastAPI']),
        JSON.stringify(['AI/ML', 'Design', 'Product Design']),
        1,
        'https://github.com'
      ]
    );

    const student3 = await run(
      `INSERT INTO users (email, password_hash, role, onboarded) VALUES (?, ?, ?, ?)`,
      ['dev@cmu.edu', passwordHash, 'STUDENT', 1]
    );
    registerUserInMemory({ id: student3.lastID, email: 'dev@cmu.edu', password_hash: passwordHash, role: 'STUDENT', onboarded: 1 });

    await run(
      `INSERT INTO profiles (user_id, full_name, college, year_of_study, branch, bio, skills, interests, is_open_to_teams) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student3.lastID,
        'David Chen',
        'Carnegie Mellon University',
        '3rd Year',
        'Software Engineering',
        'Backend systems engineer focusing on high throughput databases.',
        JSON.stringify(['Go', 'Docker', 'Kubernetes', 'C++', 'Redis']),
        JSON.stringify(['Cloud Systems', 'Security', 'Hackathons']),
        1
      ]
    );

    const student4 = await run(
      `INSERT INTO users (email, password_hash, role, onboarded) VALUES (?, ?, ?, ?)`,
      ['sam@berkeley.edu', passwordHash, 'STUDENT', 1]
    );
    registerUserInMemory({ id: student4.lastID, email: 'sam@berkeley.edu', password_hash: passwordHash, role: 'STUDENT', onboarded: 1 });

    await run(
      `INSERT INTO profiles (user_id, full_name, college, year_of_study, branch, bio, skills, interests, is_open_to_teams) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student4.lastID,
        'Samantha Taylor',
        'UC Berkeley',
        '3rd Year',
        'Electrical Engineering & Computer Science',
        'Product designer and frontend engineer creating accessible interfaces.',
        JSON.stringify(['Figma', 'CSS/Tailwind', 'React', 'UX Research']),
        JSON.stringify(['Design', 'Accessibility', 'Mobile Apps']),
        1
      ]
    );

    // Seed Opportunities
    const opp1 = await run(
      `INSERT INTO opportunities (title, slug, organizer, short_description, description, type, status, location, start_date, end_date, participation_mode, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Campus HackX 2026',
        'campus-hackx-2026',
        'MIT Innovation Initiative',
        'Annual inter-college hackathon to build high-impact real-world solutions.',
        'Campus HackX 2026 brings together cross-college student developers to build software products in 36 hours.',
        'Hackathon',
        'Ongoing',
        'Hybrid / Online',
        '2026-10-10',
        '2026-10-12',
        'Team',
        adminResult.lastID
      ]
    );
    await run(
      `INSERT INTO opportunity_rules (opportunity_id, min_team_size, max_team_size, exact_team_size, composition_rules) VALUES (?, ?, ?, ?, ?)`,
      [
        opp1.lastID,
        4,
        4,
        4,
        JSON.stringify([
          { attribute: 'year_of_study', operator: 'exact', value: '2nd Year', count: 2 },
          { attribute: 'year_of_study', operator: 'exact', value: '3rd Year', count: 2 }
        ])
      ]
    );

    const opp2 = await run(
      `INSERT INTO opportunities (title, slug, organizer, short_description, description, type, status, location, start_date, end_date, participation_mode, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Global Builder Sprint',
        'global-builder-sprint',
        'Stanford E-Cell',
        'Global student sprint for climate tech and sustainable software ideas.',
        'Collaborate with global peers to pitch, prototype, and showcase sustainable tech projects.',
        'Competition',
        'Upcoming',
        'Virtual',
        '2026-11-01',
        '2026-11-15',
        'Team',
        adminResult.lastID
      ]
    );
    await run(
      `INSERT INTO opportunity_rules (opportunity_id, min_team_size, max_team_size, exact_team_size, composition_rules) VALUES (?, ?, ?, ?, ?)`,
      [opp2.lastID, 2, 5, null, JSON.stringify([])]
    );

    const opp3 = await run(
      `INSERT INTO opportunities (title, slug, organizer, short_description, description, type, status, location, start_date, end_date, participation_mode, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Student Showcase Summit',
        'student-showcase-summit',
        'TeamSync Network',
        'Showcase your semester projects to mentors and student founders.',
        'Submit completed personal, course, or hackathon projects to receive feedback and recognition.',
        'Challenge',
        'Published',
        'Virtual',
        '2026-12-01',
        '2026-12-05',
        'Optional',
        adminResult.lastID
      ]
    );
    await run(
      `INSERT INTO opportunity_rules (opportunity_id, min_team_size, max_team_size, exact_team_size, composition_rules) VALUES (?, ?, ?, ?, ?)`,
      [opp3.lastID, 1, 6, null, JSON.stringify([])]
    );

    // Seed Demo Teams
    const team1 = await run(
      `INSERT INTO teams (name, purpose, opportunity_id, project_name, project_description, required_skills, required_roles, leader_id, status, github_link, figma_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Team Nova',
        'Hackathon',
        opp1.lastID,
        'EcoTrack AI',
        'Smart campus energy monitoring system using real-time analytics.',
        JSON.stringify(['React', 'Node.js', 'Python', 'Data Visualization']),
        JSON.stringify(['Backend Developer', '3rd Year Student', '3rd Year Student']),
        student1.lastID,
        'Recruiting',
        'https://github.com/example/ecotrack',
        'https://figma.com/example/ecotrack'
      ]
    );
    await run(`INSERT INTO team_members (team_id, user_id, role_title) VALUES (?, ?, ?)`, [
      team1.lastID,
      student1.lastID,
      'Team Leader / Frontend'
    ]);
    await run(`INSERT INTO team_members (team_id, user_id, role_title) VALUES (?, ?, ?)`, [
      team1.lastID,
      student2.lastID,
      'AI/ML Specialist'
    ]);

    const team2 = await run(
      `INSERT INTO teams (name, purpose, opportunity_id, project_name, project_description, required_skills, required_roles, leader_id, status, github_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'DevPulse Studio',
        'Personal Project',
        null,
        'DevPulse',
        'Open-source telemetry monitor for developer productivity metrics.',
        JSON.stringify(['Go', 'Docker', 'React', 'TimescaleDB']),
        JSON.stringify(['UI/UX Designer', 'Frontend Developer']),
        student3.lastID,
        'Recruiting',
        'https://github.com/example/devpulse'
      ]
    );
    await run(`INSERT INTO team_members (team_id, user_id, role_title) VALUES (?, ?, ?)`, [
      team2.lastID,
      student3.lastID,
      'Team Leader / Systems Engineer'
    ]);

    // Seed Demo Join Request
    await run(
      `INSERT INTO join_requests (team_id, applicant_id, message, status) VALUES (?, ?, ?, ?)`,
      [team1.lastID, student4.lastID, 'Hi Alex! I would love to join Team Nova as UI/UX designer and frontend builder.', 'Pending']
    );

    // Seed Demo Project Showcase
    await run(
      `INSERT INTO projects (team_id, owner_id, title, description, skills_used, status, demo_url, repo_url, outcome, is_showcase) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        null,
        student1.lastID,
        'StudyFlow Platform',
        'A collaborative flashcard and study notes web application built for college courses.',
        JSON.stringify(['React', 'Node.js', 'SQLite', 'Tailwind CSS']),
        'Completed',
        'https://studyflow-demo.vercel.app',
        'https://github.com/alex/studyflow',
        'Used by 400+ students during finals week.',
        1
      ]
    );

    // Seed Demo Notification
    await run(
      `INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        student1.lastID,
        'New Join Request',
        'Samantha Taylor requested to join Team Nova.',
        'join_request',
        'team',
        team1.lastID
      ]
    );
  }
}

export default db;
