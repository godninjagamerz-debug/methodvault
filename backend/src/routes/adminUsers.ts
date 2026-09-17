import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireAdmin);

// List all users
router.get('/', async (_req: Request, res: Response) => {
  const result = await pool.query(
    'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC'
  );
  return res.json(result.rows);
});

export default router;
