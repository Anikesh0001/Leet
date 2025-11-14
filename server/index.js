import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dbModule from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

async function seedAdmin() {
  try {
    const db = await dbModule.getDb();
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'admin123';
    const existing = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', adminUser, adminUser);
    if (!existing) {
      const hash = await bcrypt.hash(adminPass, 10);
      await db.run('INSERT INTO users (username, email, password_hash, is_admin, created_at) VALUES (?, ?, ?, 1, ?)', adminUser, null, hash, new Date().toISOString());
      console.log('Seeded admin user:', adminUser);
    }
  } catch (e) {
    console.error('Failed to seed admin', e);
  }
}

// Seed admin only if explicitly requested via SEED_ADMIN env var or npm run seed script.
// This ensures fresh clones have no credentials until the developer explicitly seeds them.
if (process.env.SEED_ADMIN === 'true') {
  seedAdmin();
}

// Seed some demo logs for fresh clones only when explicitly requested.
async function seedInitialLogs() {
  try {
    const db = await dbModule.getDb();
    const row = await db.get('SELECT COUNT(1) as c FROM suspicious_logs');
    const count = row && row.c ? row.c : 0;
    if (count > 0) return; // already has logs

    // ensure there is a demo non-admin user to attach logs to
    let demo = await db.get('SELECT * FROM users WHERE username = ?', 'test_user');
    if (!demo) {
      const hash = await bcrypt.hash('test123', 10);
      const info = await db.run('INSERT INTO users (username, email, name, password_hash, is_admin, created_at) VALUES (?, ?, ?, ?, 0, ?)', 'test_user', null, 'Demo User', hash, new Date().toISOString());
      demo = { id: info.lastID, username: 'test_user' };
      console.log('Seeded demo user: test_user');
    }

    const now = new Date().toISOString();
    const sampleLogs = [
      {
        user_id: demo.id,
        problem_id: 'demo-problem-1',
        event_type: 'tab_switch',
        payload: JSON.stringify({ reason: 'switched_tab', suspicious: true }),
        timestamp: now,
        received_at: now
      },
      {
        user_id: demo.id,
        problem_id: 'demo-problem-1',
        event_type: 'no_person',
        payload: JSON.stringify({ reason: 'no_person_detected', suspicious: true }),
        timestamp: now,
        received_at: now
      },
      {
        user_id: demo.id,
        problem_id: 'demo-problem-2',
        event_type: 'suspicious_detected',
        payload: JSON.stringify({ details: 'face_not_visible', suspicious: true }),
        timestamp: now,
        received_at: now
      }
    ];

    for (const l of sampleLogs) {
      await db.run('INSERT INTO suspicious_logs (user_id, problem_id, event_type, payload, timestamp, received_at) VALUES (?, ?, ?, ?, ?, ?)', l.user_id, l.problem_id, l.event_type, l.payload, l.timestamp, l.received_at);
    }
    console.log('Seeded initial suspicious_logs entries');
  } catch (e) {
    console.warn('Failed to seed initial logs', e);
  }
}

if (process.env.SEED_SAMPLE_DATA === 'true') {
  // run initial logs seed after admin seed (if both enabled)
  seedInitialLogs();
}

// auth helpers
function createToken(user) {
  return jwt.sign({ id: user.id, username: user.username, is_admin: !!user.is_admin }, JWT_SECRET, { expiresIn: '8h' });
}

async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).send({ ok: false });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).send({ ok: false });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // attach user
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).send({ ok: false });
  }
}

app.post('/api/signup', async (req, res) => {
  try {
    const { username, password, email, name } = req.body;
    if ((!username && !email) || !password) return res.status(400).send({ ok: false, error: 'username/email and password required' });
    const db = await dbModule.getDb();
    const existing = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', username || '', email || '');
    if (existing) return res.status(409).send({ ok: false, error: 'user exists' });
    const hash = await bcrypt.hash(password, 10);
    const info = await db.run('INSERT INTO users (username, email, name, password_hash, is_admin, created_at) VALUES (?, ?, ?, ?, 0, ?)', username || null, email || null, name || null, hash, new Date().toISOString());
    const user = { id: info.lastID, username: username || email, email: email || null, name: name || null, is_admin: 0 };
    const token = createToken(user);
    // also expose token in a header for robust scripting (avoids issues with long token line-wrapping)
    res.setHeader('X-Auth-Token', token);
    res.send({ ok: true, token, user });
  } catch (e) {
    console.error('signup error', e);
    res.status(500).send({ ok: false });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if ((!username && !email) || !password) return res.status(400).send({ ok: false });
    const db = await dbModule.getDb();
    let user = null;
    if (email) {
      user = await db.get('SELECT * FROM users WHERE email = ?', email);
    } else {
      user = await db.get('SELECT * FROM users WHERE username = ?', username);
    }
    if (!user) return res.status(401).send({ ok: false });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).send({ ok: false });
    const token = createToken(user);
    // expose token header to make it easier for CLI scripts to extract the token
    res.setHeader('X-Auth-Token', token);
    res.send({ ok: true, token, user: { id: user.id, username: user.username, email: user.email, name: user.name, is_admin: user.is_admin } });
  } catch (e) {
    console.error('login error', e);
    res.status(500).send({ ok: false });
  }
});

// receive logs (only keep suspicious or important events) - requires auth
app.post('/api/logs', authMiddleware, async (req, res) => {
  try {
    const payload = req.body || {};
    const keepTypes = ['no_person', 'multiple_persons', 'tab_switch', 'split_screen', 'suspicious_detected'];
    const isSuspicious = !!(payload.suspicious || payload.event_type && keepTypes.includes(payload.event_type) || payload.type && keepTypes.includes(payload.type));
    if (!isSuspicious) return res.status(204).send({ ok: true, saved: false });
    const db = await dbModule.getDb();
    const record = {
      user_id: req.user.id,
      problem_id: payload.problem_id || null,
      event_type: payload.event_type || payload.type || 'unknown',
      payload: JSON.stringify(payload),
      timestamp: payload.timestamp ? new Date(payload.timestamp).toISOString() : new Date().toISOString(),
      received_at: new Date().toISOString()
    };
    await db.run('INSERT INTO suspicious_logs (user_id, problem_id, event_type, payload, timestamp, received_at) VALUES (?, ?, ?, ?, ?, ?)', record.user_id, record.problem_id, record.event_type, record.payload, record.timestamp, record.received_at);
    return res.status(201).send({ ok: true, saved: true });
  } catch (e) {
    console.error('Failed to save log', e);
    return res.status(500).send({ ok: false });
  }
});

// admin endpoints
app.get('/api/admin/users', authMiddleware, async (req, res) => {
  try {
    if (!req.user.is_admin) return res.status(403).send({ ok: false });
    const db = await dbModule.getDb();
    const users = await db.all('SELECT id, username, is_admin, created_at FROM users ORDER BY id DESC');
    res.send({ ok: true, users });
  } catch (e) {
    res.status(500).send({ ok: false });
  }
});

// expose predefined admin credentials to admins only (useful for local/dev testing)
app.get('/api/admin/credentials', authMiddleware, async (req, res) => {
  try {
    if (!req.user.is_admin) return res.status(403).send({ ok: false });
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'admin123';
    // only return these for admin users on trusted environments
    res.send({ ok: true, admin_user: adminUser, admin_pass: adminPass });
  } catch (e) {
    res.status(500).send({ ok: false });
  }
});

app.get('/api/admin/users/:id/logs', authMiddleware, async (req, res) => {
  try {
    if (!req.user.is_admin) return res.status(403).send({ ok: false });
    const id = Number(req.params.id);
    const db = await dbModule.getDb();
    const logs = await db.all('SELECT * FROM suspicious_logs WHERE user_id = ? ORDER BY id DESC', id);
    res.send({ ok: true, logs });
  } catch (e) {
    console.error('admin logs error', e);
    res.status(500).send({ ok: false });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
