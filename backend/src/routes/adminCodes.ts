import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireAdmin);

// Revoke a code
router.post('/:id/revoke', async (req: Request, res: Response) => {
  const result = await pool.query(
    `UPDATE method_codes
     SET status = 'revoked'
     WHERE id = $1 AND status = 'unused'
     RETURNING *`,
    [req.params.id]
  );

  if (!result.rows[0]) {
    const exists = await pool.query('SELECT status FROM method_codes WHERE id = $1', [req.params.id]);
    if (!exists.rows[0]) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Code not found' });
    }
    return res.status(409).json({ code: 'INVALID_STATE', message: `Code is already ${exists.rows[0].status}` });
  }

  return res.json(result.rows[0]);
});

export default router;
