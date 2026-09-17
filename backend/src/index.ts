import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth';
import adminMethodsRouter from './routes/adminMethods';
import adminCodesRouter from './routes/adminCodes';
import adminUsersRouter from './routes/adminUsers';
import adminPurchasesRouter from './routes/adminPurchases';
import myMethodsRouter from './routes/myMethods';
import marketplaceRouter from './routes/marketplace';
import purchasesRouter from './routes/purchases';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));

// Global error handler for async routes
function asyncHandler(fn: express.RequestHandler): express.RequestHandler {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Routes
app.use('/auth', authRoutes);
app.use('/admin/methods', adminMethodsRouter);
app.use('/admin/codes', adminCodesRouter);
app.use('/admin/users', adminUsersRouter);
app.use('/admin/purchases', adminPurchasesRouter);
app.use('/me/methods', myMethodsRouter);
app.use('/marketplace', marketplaceRouter);
app.use('/purchases', purchasesRouter);

// Redeem endpoint lives under /me/redeem per Postman collection
app.post('/me/redeem', (req, res, next) => {
  req.url = '/redeem';
  myMethodsRouter(req, res, next);
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ code: 'INTERNAL_ERROR', message: 'An internal server error occurred' });
});

app.listen(PORT, () => {
  console.log(`MethodVault backend running on http://localhost:${PORT}`);
});

export default app;
