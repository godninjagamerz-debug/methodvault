import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/pool';
import { authenticate } from '../middleware/auth';

const router = Router();
const BCRYPT_ROUNDS = 12;

router.post('/register', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Email and password are required' });
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Invalid email format' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters' });
  }

  const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existingUser.rows.length > 0) {
    return res.status(409).json({ code: 'EMAIL_TAKEN', message: 'Email is already registered' });
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const result = await pool.query(
    'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
    [email.toLowerCase(), password_hash, 'user']
  );
  const user = result.rows[0];

  const secret = process.env.JWT_SECRET!;
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, secret, { expiresIn: '7d' });

  return res.status(201).json({ token, user });
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Email and password are required' });
  }

  const result = await pool.query(
    'SELECT id, email, role, password_hash, created_at FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  const user = result.rows[0];

  if (!user) {
    return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
  }

  const secret = process.env.JWT_SECRET!;
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, secret, { expiresIn: '7d' });

  const { password_hash, ...userWithoutPassword } = user;
  return res.status(200).json({ token, user: userWithoutPassword });
});

router.get('/me', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query(
    'SELECT id, email, role, created_at FROM users WHERE id = $1',
    [req.user!.id]
  );
  if (!result.rows[0]) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'User not found' });
  }
  return res.json(result.rows[0]);
});

export default router;
