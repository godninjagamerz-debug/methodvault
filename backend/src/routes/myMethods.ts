import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import pool from '../db/pool';
import { authenticate, requireUser } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireUser);

const redeemLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { code: 'TOO_MANY_REQUESTS', message: 'Too many redemption attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// List user's owned methods
router.get('/', async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT m.id, m.name, m.description, m.category, m.price, m.thumbnail_url, m.published, um.source, um.created_at as unlocked_at
     FROM user_methods um
     JOIN methods m ON um.method_id = m.id
     WHERE um.user_id = $1
     ORDER BY um.created_at DESC`,
    [req.user!.id]
  );
  return res.json(result.rows);
});

// Get full method content (only if owned)
router.get('/:id', async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT m.*, um.source, um.created_at as unlocked_at
     FROM user_methods um
     JOIN methods m ON um.method_id = m.id
     WHERE um.user_id = $1 AND um.method_id = $2`,
    [req.user!.id, req.params.id]
  );

  if (!result.rows[0]) {
    const methodExists = await pool.query('SELECT id FROM methods WHERE id = $1', [req.params.id]);
    if (!methodExists.rows[0]) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Method not found' });
    }
    return res.status(403).json({ code: 'FORBIDDEN', message: 'You do not own this method' });
  }

  return res.json(result.rows[0]);
});

// Redeem a code
router.post('/redeem', redeemLimiter, async (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Code is required' });
  }

  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{24}$/.test(normalized)) {
    return res.status(400).json({ code: 'INVALID_FORMAT', message: 'Code must be exactly 24 uppercase alphanumeric characters' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Atomic redemption - only succeeds if status = 'unused'
    const redeemResult = await client.query(
      `UPDATE method_codes
       SET status = 'redeemed', redeemed_by = $1, redeemed_at = NOW()
       WHERE code = $2 AND status = 'unused'
       RETURNING id, method_id`,
      [req.user!.id, normalized]
    );

    if (!redeemResult.rows[0]) {
      // Check why it failed
      const codeRow = await client.query('SELECT status FROM method_codes WHERE code = $1', [normalized]);
      await client.query('ROLLBACK');

      if (!codeRow.rows[0]) {
        return res.status(404).json({ code: 'CODE_NOT_FOUND', message: 'Code not found' });
      }
      return res.status(409).json({ code: 'CODE_ALREADY_USED', message: `Code has already been ${codeRow.rows[0].status}` });
    }

    const { method_id } = redeemResult.rows[0];

    // Grant ownership (idempotent via UNIQUE constraint)
    await client.query(
      `INSERT INTO user_methods (user_id, method_id, source)
       VALUES ($1, $2, 'code')
       ON CONFLICT (user_id, method_id) DO NOTHING`,
      [req.user!.id, method_id]
    );

    const method = await client.query(
      'SELECT id, name, description, category, thumbnail_url FROM methods WHERE id = $1',
      [method_id]
    );

    await client.query('COMMIT');

    return res.json({
      message: 'Code redeemed successfully',
      method: method.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

export default router;
