import dbModule from '../server/db.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  try {
    console.log('🌱 Seeding database...');
    const db = await dbModule.getDb();

    // Seed admin user
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'admin123';
    const existing = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', adminUser, adminUser);
    if (!existing) {
      const hash = await bcrypt.hash(adminPass, 10);
      await db.run('INSERT INTO users (username, email, password_hash, is_admin, created_at) VALUES (?, ?, ?, 1, ?)', adminUser, null, hash, new Date().toISOString());
      console.log(`✅ Created admin user: ${adminUser} (password: ${adminPass})`);
    } else {
      console.log(`⏭️  Admin user already exists: ${adminUser}`);
    }

    // Optionally seed sample logs if requested
    if (process.env.SEED_SAMPLE_DATA === 'true') {
      const row = await db.get('SELECT COUNT(1) as c FROM suspicious_logs');
      const count = row && row.c ? row.c : 0;
      if (count === 0) {
        // ensure there is a demo non-admin user to attach logs to
        let demo = await db.get('SELECT * FROM users WHERE username = ?', 'test_user');
        if (!demo) {
          const hash = await bcrypt.hash('test123', 10);
          const info = await db.run('INSERT INTO users (username, email, name, password_hash, is_admin, created_at) VALUES (?, ?, ?, ?, 0, ?)', 'test_user', null, 'Demo User', hash, new Date().toISOString());
          demo = { id: info.lastID, username: 'test_user' };
          console.log(`✅ Created demo user: test_user (password: test123)`);
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
        console.log(`✅ Seeded ${sampleLogs.length} sample log entries`);
      } else {
        console.log(`⏭️  Sample logs already exist`);
      }
    }

    console.log('\n✨ Database seeding complete!');
  } catch (e) {
    console.error('❌ Seeding failed:', e.message);
    process.exit(1);
  }
}

seed();
