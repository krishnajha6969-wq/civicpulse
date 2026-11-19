import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db';

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

const JWT_SECRET = process.env.JWT_SECRET || 'civicpulse_dev_jwt_secret';

/**
 * Middleware: Verify JWT from cookie or Authorization header
 */
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const token =
    req.cookies?.civicpulse_token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null);

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware: Require specific role(s)
 */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

/**
 * Middleware: Optional auth — attaches user if token present, doesn't block if absent
 */
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token =
    req.cookies?.civicpulse_token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null);

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
      req.user = decoded;
    } catch {
      // Token invalid, continue without user
    }
  }
  next();
}

/**
 * Generate JWT token for a user
 */
export function generateToken(user: { id: string; email: string; role: string }): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role } as jwt.JwtPayload,
    JWT_SECRET as jwt.Secret,
    { expiresIn }
  );
}
