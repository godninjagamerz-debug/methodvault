/**
 * MethodVault — Create Admin User Seed Script
 *
 * Usage:
 *   cd backend
 *   DATABASE_URL=postgresql://... ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=yourpass ts-node src/seed.ts
 */

import 'dotenv/config';
import bcrypt from 'bcrypt';
import pool from './db/pool';

async function seed() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD env vars');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters');
    process.exit(1);
  }

  const existing = await pool.query('SELECT id, role FROM users WHERE email = $1', [email.toLowerCase()]);

  if (existing.rows[0]) {
    if (existing.rows[0].role === 'admin') {
      console.log(`Admin already exists: ${email}`);
      process.exit(0);
    }
    // Upgrade to admin
    await pool.query('UPDATE users SET role = $1 WHERE email = $2', ['admin', email.toLowerCase()]);
    console.log(`✓ Upgraded ${email} to admin`);
  } else {
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [email.toLowerCase(), hash, 'admin']
    );
    console.log('✓ Admin created:', result.rows[0]);
  }

  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
