import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { supabase } from './supabaseClient.js';

dotenv.config();

// In-Memory Persistent Data Store for Serverless Environment (Zero native C++ dependency)
const usersStore = new Map(); // id -> user, email -> user
const profilesStore = new Map(); // user_id -> profile
const collegesStore = new Map(); // id -> college
const opportunitiesStore = new Map(); // id -> opp
const rulesStore = new Map(); // opportunity_id -> rules
const teamsStore = new Map(); // id -> team
const membersStore = new Map(); // team_id -> [members]
const requestsStore = new Map(); // id -> request
const invitationsStore = new Map(); // id -> invitation
const projectsStore = new Map(); // id -> project
const notificationsStore = new Map(); // user_id -> [notifications]
const messagesStore = new Map(); // team_id -> [messages]

let autoIncrementId = 100;

export async function query(sql, params = []) {
  try {
    if (sql.includes('FROM colleges')) {
      const list = Array.from(collegesStore.values());
      if (params[0]) {
        const q = String(params[0]).replace(/%/g, '').toLowerCase();
        return list.filter(c => c.name.toLowerCase().includes(q));
      }
      return list;
    }

    if (sql.includes('FROM profiles')) {
      return Array.from(profilesStore.values());
    }

    if (sql.includes('FROM opportunities')) {
      let list = Array.from(opportunitiesStore.values());
      if (sql.includes('status = ?')) {
        list = list.filter(o => o.status === params[0]);
      } else if (sql.includes("status != 'Draft'")) {
        list = list.filter(o => o.status !== 'Draft');
      }
      return list;
    }

    if (sql.includes('FROM teams')) {
      let list = Array.from(teamsStore.values());
      if (params[0] && sql.includes('purpose = ?')) {
        list = list.filter(t => t.purpose === params[0]);
      }
      return list;
    }

    if (sql.includes('FROM team_members')) {
      const teamId = parseInt(params[0]);
      return membersStore.get(teamId) || [];
    }

    if (sql.includes('FROM join_requests')) {
      const teamId = parseInt(params[0]);
      const list = Array.from(requestsStore.values()).filter(r => r.team_id === teamId);
      return list;
    }

    if (sql.includes('FROM invitations')) {
      const teamId = parseInt(params[0]);
      const list = Array.from(invitationsStore.values()).filter(i => i.team_id === teamId);
      return list;
    }

    if (sql.includes('FROM notifications')) {
      const userId = parseInt(params[0]);
      const list = notificationsStore.get(userId) || [];
      return list;
    }

    if (sql.includes('FROM projects')) {
      return Array.from(projectsStore.values());
    }

    if (sql.includes('FROM team_messages')) {
      const teamId = parseInt(params[0]);
      return messagesStore.get(teamId) || [];
    }

    if (sql.includes('FROM users')) {
      const usersList = [];
      for (const [key, val] of usersStore.entries()) {
        if (typeof key === 'number') usersList.push(val);
      }
      return usersList;
    }

    return [];
  } catch (err) {
    console.error('Query error:', err);
    return [];
  }
}

export async function get(sql, params = []) {
  try {
    if (sql.includes('COUNT(*) as count FROM colleges')) {
      return { count: collegesStore.size };
    }
    if (sql.includes('COUNT(*) as count FROM users')) {
      let count = 0;
      for (const key of usersStore.keys()) {
        if (typeof key === 'number') count++;
      }
      return { count };
    }
    if (sql.includes('COUNT(*) as count FROM teams')) {
      return { count: teamsStore.size };
    }
    if (sql.includes('COUNT(*) as count FROM opportunities')) {
      return { count: opportunitiesStore.size };
    }
    if (sql.includes('COUNT(*) as count FROM join_requests')) {
      return { count: requestsStore.size };
    }

    if (sql.includes('FROM users WHERE LOWER(email) = LOWER(?)')) {
      const email = String(params[0]).toLowerCase().trim();
      return usersStore.get(email) || null;
    }

    if (sql.includes('FROM users WHERE id =')) {
      const id = parseInt(params[0]);
      return usersStore.get(id) || null;
    }

    if (sql.includes('FROM profiles WHERE user_id =')) {
      const userId = parseInt(params[0]);
      return profilesStore.get(userId) || null;
    }

    if (sql.includes('FROM opportunities WHERE id =')) {
      const id = parseInt(params[0]);
      return opportunitiesStore.get(id) || null;
    }

    if (sql.includes('FROM opportunities WHERE slug =')) {
      const slug = String(params[0]);
      for (const opp of opportunitiesStore.values()) {
        if (opp.slug === slug) return opp;
      }
      return null;
    }

    if (sql.includes('FROM opportunity_rules WHERE opportunity_id =')) {
      const oppId = parseInt(params[0]);
      return rulesStore.get(oppId) || null;
    }

    if (sql.includes('FROM teams WHERE id =')) {
      const id = parseInt(params[0]);
      return teamsStore.get(id) || null;
    }

    if (sql.includes('FROM team_members WHERE team_id = ? AND user_id = ?')) {
      const teamId = parseInt(params[0]);
      const userId = parseInt(params[1]);
      const members = membersStore.get(teamId) || [];
      return members.find(m => m.user_id === userId) || null;
    }

    if (sql.includes('FROM join_requests WHERE team_id = ? AND applicant_id = ?')) {
      const teamId = parseInt(params[0]);
      const applicantId = parseInt(params[1]);
      for (const r of requestsStore.values()) {
        if (r.team_id === teamId && r.applicant_id === applicantId && r.status === 'Pending') {
          return r;
        }
      }
      return null;
    }

    if (sql.includes('FROM join_requests WHERE id = ?')) {
      const id = parseInt(params[0]);
      return requestsStore.get(id) || null;
    }

    if (sql.includes('FROM invitations WHERE id = ?')) {
      const id = parseInt(params[0]);
      return invitationsStore.get(id) || null;
    }

    return null;
  } catch (err) {
    console.error('Get error:', err);
    return null;
  }
}

export async function run(sql, params = []) {
  try {
    autoIncrementId++;
    const newId = autoIncrementId;

    if (sql.includes('INSERT INTO users')) {
      const [email, password_hash, role, onboarded] = params;
      const cleanEmail = String(email).toLowerCase().trim();
      const newUser = { id: newId, email: cleanEmail, password_hash, role: role || 'STUDENT', onboarded: onboarded || 0, created_at: new Date().toISOString() };
      usersStore.set(newId, newUser);
      usersStore.set(cleanEmail, newUser);
      return { lastID: newId, changes: 1 };
    }

    if (sql.includes('UPDATE users SET onboarded = 1')) {
      const userId = parseInt(params[0]);
      const u = usersStore.get(userId);
      if (u) {
        u.onboarded = 1;
        usersStore.set(userId, u);
        if (u.email) usersStore.set(u.email.toLowerCase(), u);
      }
      return { lastID: userId, changes: 1 };
    }

    if (sql.includes('INSERT INTO profiles') || sql.includes('INSERT OR IGNORE INTO profiles')) {
      const [user_id, full_name, college, year_of_study, branch, bio, skills, interests, is_open_to_teams, github_url, linkedin_url] = params;
      const profileObj = {
        id: newId,
        user_id: parseInt(user_id),
        full_name: full_name || '',
        college: college || '',
        year_of_study: year_of_study || '1st Year',
        branch: branch || 'Computer Science',
        bio: bio || '',
        skills: skills || '[]',
        interests: interests || '[]',
        is_open_to_teams: is_open_to_teams !== undefined ? is_open_to_teams : 1,
        github_url: github_url || '',
        linkedin_url: linkedin_url || '',
        created_at: new Date().toISOString()
      };
      profilesStore.set(parseInt(user_id), profileObj);
      return { lastID: newId, changes: 1 };
    }

    if (sql.includes('UPDATE profiles SET')) {
      const userId = parseInt(params[params.length - 1]);
      const p = profilesStore.get(userId) || { id: newId, user_id: userId };
      if (params[0]) p.full_name = params[0];
      if (params[1]) p.college = params[1];
      if (params[2]) p.year_of_study = params[2];
      if (params[3]) p.branch = params[3];
      if (params[4]) p.bio = params[4];
      if (params[5]) p.skills = params[5];
      if (params[6]) p.interests = params[6];
      if (params[7] !== null && params[7] !== undefined) p.is_open_to_teams = params[7];
      profilesStore.set(userId, p);
      return { lastID: userId, changes: 1 };
    }

    if (sql.includes('INSERT INTO colleges')) {
      collegesStore.set(newId, { id: newId, name: params[0] });
      return { lastID: newId, changes: 1 };
    }

    if (sql.includes('INSERT INTO opportunities')) {
      const [title, slug, organizer, short_description, description, type, status, location, start_date, end_date, participation_mode, created_by] = params;
      const opp = { id: newId, title, slug, organizer, short_description, description, type, status, location, start_date, end_date, participation_mode, created_by, created_at: new Date().toISOString() };
      opportunitiesStore.set(newId, opp);
      return { lastID: newId, changes: 1 };
    }

    if (sql.includes('INSERT INTO opportunity_rules')) {
      const [opportunity_id, min_team_size, max_team_size, exact_team_size, composition_rules] = params;
      const ruleObj = { id: newId, opportunity_id: parseInt(opportunity_id), min_team_size, max_team_size, exact_team_size, composition_rules };
      rulesStore.set(parseInt(opportunity_id), ruleObj);
      return { lastID: newId, changes: 1 };
    }

    if (sql.includes('INSERT INTO teams')) {
      const [name, purpose, opportunity_id, project_name, project_description, required_skills, required_roles, leader_id, github_link, figma_link, demo_link] = params;
      const teamObj = {
        id: newId,
        name,
        purpose,
        opportunity_id: opportunity_id ? parseInt(opportunity_id) : null,
        project_name,
        project_description: project_description || '',
        required_skills: required_skills || '[]',
        required_roles: required_roles || '[]',
        leader_id: parseInt(leader_id),
        status: 'Recruiting',
        github_link: github_link || '',
        figma_link: figma_link || '',
        demo_link: demo_link || '',
        created_at: new Date().toISOString()
      };
      teamsStore.set(newId, teamObj);
      return { lastID: newId, changes: 1 };
    }

    if (sql.includes('INSERT INTO team_members') || sql.includes('INSERT OR IGNORE INTO team_members')) {
      const [team_id, user_id, role_title] = params;
      const tId = parseInt(team_id);
      const uId = parseInt(user_id);
      const profile = profilesStore.get(uId) || { full_name: 'Member', college: 'College', year_of_study: '1st Year', branch: 'CS' };

      const mList = membersStore.get(tId) || [];
      if (!mList.some(m => m.user_id === uId)) {
        mList.push({
          membership_id: newId,
          team_id: tId,
          user_id: uId,
          role_title: role_title || 'Member',
          full_name: profile.full_name,
          college: profile.college,
          year_of_study: profile.year_of_study,
          branch: profile.branch,
          joined_at: new Date().toISOString()
        });
        membersStore.set(tId, mList);
      }
      return { lastID: newId, changes: 1 };
    }

    if (sql.includes('INSERT INTO join_requests')) {
      const [team_id, applicant_id, message, status] = params;
      const reqObj = { id: newId, team_id: parseInt(team_id), applicant_id: parseInt(applicant_id), message: message || '', status: status || 'Pending', created_at: new Date().toISOString() };
      requestsStore.set(newId, reqObj);
      return { lastID: newId, changes: 1 };
    }

    if (sql.includes('UPDATE join_requests SET status')) {
      const requestId = parseInt(params[params.length - 1]);
      const req = requestsStore.get(requestId);
      if (req) {
        req.status = params[0];
        requestsStore.set(requestId, req);
      }
      return { lastID: requestId, changes: 1 };
    }

    if (sql.includes('INSERT INTO invitations')) {
      const [team_id, student_id, invited_by, role_title, status] = params;
      const invObj = { id: newId, team_id: parseInt(team_id), student_id: parseInt(student_id), invited_by: parseInt(invited_by), role_title: role_title || 'Member', status: status || 'Pending', created_at: new Date().toISOString() };
      invitationsStore.set(newId, invObj);
      return { lastID: newId, changes: 1 };
    }

    if (sql.includes('INSERT INTO projects')) {
      const [team_id, owner_id, title, description, skills_used, status, demo_url, repo_url, outcome, is_showcase] = params;
      const proj = { id: newId, team_id: team_id ? parseInt(team_id) : null, owner_id: parseInt(owner_id), title, description, skills_used: skills_used || '[]', status: status || 'Completed', demo_url: demo_url || '', repo_url: repo_url || '', outcome: outcome || '', is_showcase: is_showcase ? 1 : 0, created_at: new Date().toISOString() };
      projectsStore.set(newId, proj);
      return { lastID: newId, changes: 1 };
    }

    if (sql.includes('INSERT INTO notifications')) {
      const [user_id, title, message, type, related_entity_type, related_entity_id] = params;
      const uId = parseInt(user_id);
      const nList = notificationsStore.get(uId) || [];
      nList.unshift({ id: newId, user_id: uId, title, message, type, related_entity_type: related_entity_type || '', related_entity_id: related_entity_id || 0, is_read: 0, created_at: new Date().toISOString() });
      notificationsStore.get(uId, nList);
      return { lastID: newId, changes: 1 };
    }

    if (sql.includes('INSERT INTO team_messages')) {
      const [team_id, sender_id, message] = params;
      const tId = parseInt(team_id);
      const mList = messagesStore.get(tId) || [];
      const msgObj = { id: newId, team_id: tId, sender_id: parseInt(sender_id), message, created_at: new Date().toISOString() };
      mList.push(msgObj);
      messagesStore.set(tId, mList);
      return { lastID: newId, changes: 1 };
    }

    return { lastID: newId, changes: 1 };
  } catch (err) {
    console.error('Run error:', err);
    return { lastID: Date.now(), changes: 0 };
  }
}

export function registerUserInMemory(user) {
  if (!user || !user.id) return;
  usersStore.set(user.id, user);
  if (user.email) usersStore.set(user.email.toLowerCase().trim(), user);
}

export function registerProfileInMemory(profile) {
  if (!profile || !profile.user_id) return;
  profilesStore.set(profile.user_id, profile);
}

let isDbSeeded = false;

export async function initDb() {
  if (isDbSeeded) return;

  // Seed default colleges
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
  let cid = 1;
  for (const name of defaultColleges) {
    collegesStore.set(cid, { id: cid, name });
    cid++;
  }

  // Seed admin user
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const adminObj = { id: 1, email: 'admin@teamsync.edu', password_hash: passwordHash, role: 'ADMIN', onboarded: 1, created_at: new Date().toISOString() };
  usersStore.set(1, adminObj);
  usersStore.set('admin@teamsync.edu', adminObj);
  profilesStore.set(1, { id: 1, user_id: 1, full_name: 'Platform Administrator', college: 'Stanford University', year_of_study: 'Other', branch: 'Computer Science', bio: 'Platform Manager', skills: JSON.stringify(['Admin', 'Moderation']), interests: JSON.stringify(['Hackathons']) });

  // Seed Demo Student: Alex Rivera
  const alexObj = { id: 2, email: 'alex@mit.edu', password_hash: passwordHash, role: 'STUDENT', onboarded: 1, created_at: new Date().toISOString() };
  usersStore.set(2, alexObj);
  usersStore.set('alex@mit.edu', alexObj);
  profilesStore.set(2, { id: 2, user_id: 2, full_name: 'Alex Rivera', college: 'Massachusetts Institute of Technology', year_of_study: '2nd Year', branch: 'Computer Science & Engineering', bio: 'Passionate full-stack developer interested in distributed systems.', skills: JSON.stringify(['React', 'Node.js', 'TypeScript', 'PostgreSQL']), interests: JSON.stringify(['Hackathons', 'Web Apps']), is_open_to_teams: 1, github_url: 'https://github.com' });

  // Seed Demo Student: Priya Sharma
  const priyaObj = { id: 3, email: 'priya@stanford.edu', password_hash: passwordHash, role: 'STUDENT', onboarded: 1, created_at: new Date().toISOString() };
  usersStore.set(3, priyaObj);
  usersStore.set('priya@stanford.edu', priyaObj);
  profilesStore.set(3, { id: 3, user_id: 3, full_name: 'Priya Sharma', college: 'Stanford University', year_of_study: '2nd Year', branch: 'Artificial Intelligence & Data Science', bio: 'Machine learning enthusiast working on NLP models.', skills: JSON.stringify(['Python', 'PyTorch', 'Figma', 'React']), interests: JSON.stringify(['AI/ML', 'Design']), is_open_to_teams: 1, github_url: 'https://github.com' });

  // Seed Demo Student: David Chen
  const davidObj = { id: 4, email: 'dev@cmu.edu', password_hash: passwordHash, role: 'STUDENT', onboarded: 1, created_at: new Date().toISOString() };
  usersStore.set(4, davidObj);
  usersStore.set('dev@cmu.edu', davidObj);
  profilesStore.set(4, { id: 4, user_id: 4, full_name: 'David Chen', college: 'Carnegie Mellon University', year_of_study: '3rd Year', branch: 'Software Engineering', bio: 'Backend systems engineer focusing on high throughput databases.', skills: JSON.stringify(['Go', 'Docker', 'Kubernetes']), interests: JSON.stringify(['Cloud Systems']), is_open_to_teams: 1 });

  // Seed Demo Student: Samantha Taylor
  const samObj = { id: 5, email: 'sam@berkeley.edu', password_hash: passwordHash, role: 'STUDENT', onboarded: 1, created_at: new Date().toISOString() };
  usersStore.set(5, samObj);
  usersStore.set('sam@berkeley.edu', samObj);
  profilesStore.set(5, { id: 5, user_id: 5, full_name: 'Samantha Taylor', college: 'UC Berkeley', year_of_study: '3rd Year', branch: 'Electrical Engineering & Computer Science', bio: 'Product designer creating accessible interfaces.', skills: JSON.stringify(['Figma', 'React', 'CSS/Tailwind']), interests: JSON.stringify(['Design', 'Accessibility']), is_open_to_teams: 1 });

  // Seed Demo Opportunities
  opportunitiesStore.set(1, { id: 1, title: 'Campus HackX 2026', slug: 'campus-hackx-2026', organizer: 'MIT Innovation Initiative', short_description: 'Annual inter-college hackathon to build high-impact real-world solutions.', description: 'Campus HackX brings together student developers to build software products in 36 hours.', type: 'Hackathon', status: 'Ongoing', location: 'Hybrid / Online', start_date: '2026-10-10', end_date: '2026-10-12', participation_mode: 'Team', created_by: 1 });
  rulesStore.set(1, { id: 1, opportunity_id: 1, min_team_size: 4, max_team_size: 4, exact_team_size: 4, composition_rules: JSON.stringify([{ attribute: 'year_of_study', operator: 'exact', value: '2nd Year', count: 2 }, { attribute: 'year_of_study', operator: 'exact', value: '3rd Year', count: 2 }]) });

  opportunitiesStore.set(2, { id: 2, title: 'Global Builder Sprint', slug: 'global-builder-sprint', organizer: 'Stanford E-Cell', short_description: 'Global student sprint for climate tech and sustainable software ideas.', description: 'Collaborate with global peers to pitch and showcase sustainable tech projects.', type: 'Competition', status: 'Upcoming', location: 'Virtual', start_date: '2026-11-01', end_date: '2026-11-15', participation_mode: 'Team', created_by: 1 });
  rulesStore.set(2, { id: 2, opportunity_id: 2, min_team_size: 2, max_team_size: 5, exact_team_size: null, composition_rules: '[]' });

  opportunitiesStore.set(3, { id: 3, title: 'Student Showcase Summit', slug: 'student-showcase-summit', organizer: 'TeamSync Network', short_description: 'Showcase your semester projects to mentors and student founders.', description: 'Submit completed personal, course, or hackathon projects for feedback.', type: 'Challenge', status: 'Published', location: 'Virtual', start_date: '2026-12-01', end_date: '2026-12-05', participation_mode: 'Optional', created_by: 1 });
  rulesStore.set(3, { id: 3, opportunity_id: 3, min_team_size: 1, max_team_size: 6, exact_team_size: null, composition_rules: '[]' });

  // Seed Demo Teams
  teamsStore.set(1, { id: 1, name: 'Team Nova', purpose: 'Hackathon', opportunity_id: 1, project_name: 'EcoTrack AI', project_description: 'Smart campus energy monitoring system using real-time analytics.', required_skills: JSON.stringify(['React', 'Node.js', 'Python']), required_roles: JSON.stringify(['Backend Developer', '3rd Year Student']), leader_id: 2, status: 'Recruiting', github_link: 'https://github.com/example/ecotrack', figma_link: 'https://figma.com/example/ecotrack' });
  membersStore.set(1, [
    { membership_id: 1, team_id: 1, user_id: 2, role_title: 'Team Leader / Frontend', full_name: 'Alex Rivera', college: 'Massachusetts Institute of Technology', year_of_study: '2nd Year', branch: 'Computer Science & Engineering' },
    { membership_id: 2, team_id: 1, user_id: 3, role_title: 'AI/ML Specialist', full_name: 'Priya Sharma', college: 'Stanford University', year_of_study: '2nd Year', branch: 'Artificial Intelligence & Data Science' }
  ]);

  teamsStore.set(2, { id: 2, name: 'DevPulse Studio', purpose: 'Personal Project', opportunity_id: null, project_name: 'DevPulse', project_description: 'Open-source telemetry monitor for developer productivity metrics.', required_skills: JSON.stringify(['Go', 'Docker', 'React']), required_roles: JSON.stringify(['UI/UX Designer']), leader_id: 4, status: 'Recruiting', github_link: 'https://github.com/example/devpulse' });
  membersStore.set(2, [
    { membership_id: 3, team_id: 2, user_id: 4, role_title: 'Team Leader / Systems Engineer', full_name: 'David Chen', college: 'Carnegie Mellon University', year_of_study: '3rd Year', branch: 'Software Engineering' }
  ]);

  // Seed Demo Join Request
  requestsStore.set(1, { id: 1, team_id: 1, applicant_id: 5, message: 'Hi Alex! I would love to join Team Nova as UI/UX designer.', status: 'Pending', created_at: new Date().toISOString() });

  // Seed Demo Project
  projectsStore.set(1, { id: 1, team_id: null, owner_id: 2, title: 'StudyFlow Platform', description: 'Collaborative study notes web application for college courses.', skills_used: JSON.stringify(['React', 'Node.js', 'SQLite']), status: 'Completed', demo_url: 'https://studyflow-demo.vercel.app', repo_url: 'https://github.com/alex/studyflow', outcome: 'Used by 400+ students.', is_showcase: 1, created_at: new Date().toISOString() });

  // Seed Demo Notification
  notificationsStore.set(2, [
    { id: 1, user_id: 2, title: 'New Join Request', message: 'Samantha Taylor requested to join Team Nova.', type: 'join_request', related_entity_type: 'team', related_entity_id: 1, is_read: 0, created_at: new Date().toISOString() }
  ]);

  isDbSeeded = true;
}

export default db;
