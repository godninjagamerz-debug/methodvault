import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import pool from '../db/pool';
import { authenticate, requireUser } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireUser);

// Create Razorpay order
router.post('/orders', async (req: Request, res: Response) => {
  const { method_id } = req.body;

  if (!method_id) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'method_id is required' });
  }

  // Fetch price server-side — never trust client
  const methodResult = await pool.query(
    'SELECT id, name, price FROM methods WHERE id = $1 AND published = true',
    [method_id]
  );
  const method = methodResult.rows[0];
  if (!method) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Method not found' });
  }

  // Check if user already owns it
  const owned = await pool.query(
    'SELECT id FROM user_methods WHERE user_id = $1 AND method_id = $2',
    [req.user!.id, method_id]
  );
  if (owned.rows[0]) {
    return res.status(409).json({ code: 'ALREADY_OWNED', message: 'You already own this method' });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return res.status(503).json({
      code: 'PAYMENT_NOT_CONFIGURED',
      message: 'Payment gateway is not configured. Please contact the administrator.',
    });
  }

  // Create Razorpay order via their REST API
  const orderPayload = {
    amount: method.price,
    currency: 'INR',
    receipt: `mv_${Date.now()}`,
  };

  const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const rzResponse = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderPayload),
  });

  if (!rzResponse.ok) {
    const err = await rzResponse.json();
    console.error('Razorpay order creation failed:', err);
    return res.status(502).json({ code: 'PAYMENT_ERROR', message: 'Failed to create payment order' });
  }

  const rzOrder = await rzResponse.json() as { id: string; amount: number; currency: string };

  // Insert purchase record
  const purchase = await pool.query(
    `INSERT INTO purchases (user_id, method_id, amount, currency, status, razorpay_order_id)
     VALUES ($1, $2, $3, $4, 'created', $5)
     RETURNING id, razorpay_order_id, amount, currency, status`,
    [req.user!.id, method_id, rzOrder.amount, rzOrder.currency, rzOrder.id]
  );

  return res.status(201).json({
    ...purchase.rows[0],
    key_id: keyId, // Only the PUBLIC key goes to frontend
  });
});

// Verify Razorpay payment - server-side HMAC check
router.post('/verify', async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Missing payment verification fields' });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return res.status(503).json({ code: 'PAYMENT_NOT_CONFIGURED', message: 'Payment gateway not configured' });
  }

  // Server-side HMAC verification
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const signatureValid = crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(razorpay_signature, 'hex')
  );

  if (!signatureValid) {
    await pool.query(
      `UPDATE purchases SET status = 'failed', razorpay_payment_id = $1, razorpay_signature = $2
       WHERE razorpay_order_id = $3 AND user_id = $4`,
      [razorpay_payment_id, razorpay_signature, razorpay_order_id, req.user!.id]
    );
    return res.status(400).json({ code: 'INVALID_SIGNATURE', message: 'Razorpay signature verification failed' });
  }

  // Signature valid — grant access
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const purchaseResult = await client.query(
      `UPDATE purchases SET status = 'paid', razorpay_payment_id = $1, razorpay_signature = $2
       WHERE razorpay_order_id = $3 AND user_id = $4 AND status = 'created'
       RETURNING method_id`,
      [razorpay_payment_id, razorpay_signature, razorpay_order_id, req.user!.id]
    );

    if (!purchaseResult.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ code: 'PURCHASE_NOT_FOUND', message: 'Purchase record not found or already processed' });
    }

    const { method_id } = purchaseResult.rows[0];

    await client.query(
      `INSERT INTO user_methods (user_id, method_id, source)
       VALUES ($1, $2, 'purchase')
       ON CONFLICT (user_id, method_id) DO NOTHING`,
      [req.user!.id, method_id]
    );

    await client.query('COMMIT');

    return res.json({ message: 'Payment verified and method unlocked', method_id });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// List user's purchases
router.get('/', async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT p.id, p.method_id, p.amount, p.currency, p.status, p.razorpay_order_id, p.created_at, m.name as method_name
     FROM purchases p
     JOIN methods m ON p.method_id = m.id
     WHERE p.user_id = $1
     ORDER BY p.created_at DESC`,
    [req.user!.id]
  );
  return res.json(result.rows);
});

export default router;
