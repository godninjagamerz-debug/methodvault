import { Router, Request, Response } from 'express';
import pool from '../db/pool';

const router = Router();

// List all published marketplace methods (no content exposed)
router.get('/methods', async (_req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT id, name, description, category, price, thumbnail_url, created_at
     FROM methods
     WHERE published = true AND marketplace_listed = true
     ORDER BY created_at DESC`
  );
  return res.json(result.rows);
});

// Get single published method (no content)
router.get('/methods/:id', async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT id, name, description, category, price, thumbnail_url, created_at
     FROM methods
     WHERE id = $1 AND published = true AND marketplace_listed = true`,
    [req.params.id]
  );
  if (!result.rows[0]) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Method not found' });
  }
  return res.json(result.rows[0]);
});

export default router;
