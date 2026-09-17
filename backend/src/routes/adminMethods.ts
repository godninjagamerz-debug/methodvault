import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import pool from '../db/pool';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireAdmin);

// List all methods (including unpublished)
router.get('/', async (_req: Request, res: Response) => {
  const result = await pool.query(
    'SELECT id, name, description, category, price, thumbnail_url, published, marketplace_listed, created_at, updated_at FROM methods ORDER BY created_at DESC'
  );
  return res.json(result.rows);
});

// Create method
router.post('/', async (req: Request, res: Response) => {
  const { name, description, category, price, thumbnail_url, content, published, marketplace_listed } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Name is required' });
  }
  if (price === undefined || !Number.isInteger(price) || price < 0) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Price must be a non-negative integer (paise)' });
  }

  const result = await pool.query(
    `INSERT INTO methods (name, description, category, price, thumbnail_url, content, published, marketplace_listed)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      name.trim(),
      description || '',
      category || '',
      price,
      thumbnail_url || null,
      content || '',
      published === true,
      marketplace_listed === true,
    ]
  );
  return res.status(201).json(result.rows[0]);
});

// Get single method (with content)
router.get('/:id', async (req: Request, res: Response) => {
  const result = await pool.query('SELECT * FROM methods WHERE id = $1', [req.params.id]);
  if (!result.rows[0]) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Method not found' });
  }
  return res.json(result.rows[0]);
});

// Update method
router.patch('/:id', async (req: Request, res: Response) => {
  const existing = await pool.query('SELECT * FROM methods WHERE id = $1', [req.params.id]);
  if (!existing.rows[0]) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Method not found' });
  }

  const current = existing.rows[0];
  const updates: Record<string, unknown> = {};

  const allowed = ['name', 'description', 'category', 'price', 'thumbnail_url', 'content', 'published', 'marketplace_listed'];
  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (updates.price !== undefined && (!Number.isInteger(updates.price) || (updates.price as number) < 0)) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Price must be a non-negative integer (paise)' });
  }

  if (Object.keys(updates).length === 0) {
    return res.json(current);
  }

  const setClauses = Object.keys(updates).map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = [req.params.id, ...Object.values(updates)];

  const result = await pool.query(
    `UPDATE methods SET ${setClauses} WHERE id = $1 RETURNING *`,
    values
  );
  return res.json(result.rows[0]);
});

// Delete method
router.delete('/:id', async (req: Request, res: Response) => {
  const result = await pool.query('DELETE FROM methods WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows[0]) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Method not found' });
  }
  return res.status(204).send();
});

// Generate codes for a method
router.post('/:id/codes', async (req: Request, res: Response) => {
  const method = await pool.query('SELECT id FROM methods WHERE id = $1', [req.params.id]);
  if (!method.rows[0]) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Method not found' });
  }

  const { count } = req.body;
  const validCounts = [1, 5, 10, 50, 100];
  if (!count || !validCounts.includes(count)) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Count must be one of: 1, 5, 10, 50, 100' });
  }

  const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const CODE_LENGTH = 24;

  function generateCode(): string {
    const bytes = crypto.randomBytes(CODE_LENGTH);
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CHARSET[bytes[i] % CHARSET.length];
    }
    return code;
  }

  const codes: string[] = [];
  let attempts = 0;
  const maxAttempts = count * 10;

  while (codes.length < count && attempts < maxAttempts) {
    attempts++;
    const code = generateCode();
    const exists = await pool.query('SELECT id FROM method_codes WHERE code = $1', [code]);
    if (!exists.rows[0]) {
      codes.push(code);
    }
  }

  if (codes.length < count) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: 'Failed to generate unique codes' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const insertedCodes = [];
    for (const code of codes) {
      const result = await client.query(
        'INSERT INTO method_codes (code, method_id) VALUES ($1, $2) RETURNING *',
        [code, req.params.id]
      );
      insertedCodes.push(result.rows[0]);
    }
    await client.query('COMMIT');
    return res.status(201).json(insertedCodes);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// List codes for a method
router.get('/:id/codes', async (req: Request, res: Response) => {
  const method = await pool.query('SELECT id FROM methods WHERE id = $1', [req.params.id]);
  if (!method.rows[0]) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Method not found' });
  }

  const result = await pool.query(
    `SELECT mc.*, u.email as redeemed_by_email
     FROM method_codes mc
     LEFT JOIN users u ON mc.redeemed_by = u.id
     WHERE mc.method_id = $1
     ORDER BY mc.created_at DESC`,
    [req.params.id]
  );
  return res.json(result.rows);
});

export default router;
