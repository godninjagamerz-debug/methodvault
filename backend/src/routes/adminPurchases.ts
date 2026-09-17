import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireAdmin);

// List all purchases
router.get('/', async (_req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT p.*, u.email as user_email, m.name as method_name
     FROM purchases p
     JOIN users u ON p.user_id = u.id
     JOIN methods m ON p.method_id = m.id
     ORDER BY p.created_at DESC`
  );
  return res.json(result.rows);
});

export default router;
