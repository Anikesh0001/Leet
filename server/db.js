import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'logs', 'proctor.db');

export async function getDb() {
  const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
  // initialize schema
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT,
      name TEXT,
      password_hash TEXT,
      is_admin INTEGER DEFAULT 0,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS suspicious_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      problem_id TEXT,
      event_type TEXT,
      payload TEXT,
      timestamp TEXT,
      received_at TEXT
    );
  `);
  // ensure older DBs get the `email` and `name` columns if created before we added them
  try {
    const cols = await db.all("PRAGMA table_info('users')");
    const hasEmail = cols.some(c => c.name === 'email');
    if (!hasEmail) {
      await db.exec("ALTER TABLE users ADD COLUMN email TEXT");
    }
    const hasName = cols.some(c => c.name === 'name');
    if (!hasName) {
      await db.exec("ALTER TABLE users ADD COLUMN name TEXT");
    }
  } catch (e) {
    // non-fatal; proceed
    console.warn('DB schema migration check failed', e);
  }
  return db;
}

export default { getDb };
