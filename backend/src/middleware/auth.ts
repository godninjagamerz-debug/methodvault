import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' });
    return;
  }

  const token = header.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Server misconfiguration' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as AuthUser;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Admin access required' });
    return;
  }
  next();
}

export function requireUser(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    return;
  }
  next();
}
