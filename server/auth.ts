import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { db, UserRecord } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'uzx_production_secret_key_cairo_finance_2026_secure';
const JWT_EXPIRES_IN = '7d';

export interface AuthTokenPayload {
  userId: string;
  username: string;
  role: 'admin' | 'agent';
  agentId?: string;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export function generateAuthToken(user: UserRecord): string {
  const payload: AuthTokenPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    agentId: user.agentId,
    name: user.name,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch (err) {
    return null;
  }
}

export async function verifyUserPassword(plainPassword: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      authenticated: false,
      rejected: true,
      error: 'Authorization token required. Please login.',
    });
    return;
  }

  const token = authHeader.split(' ')[1].trim();
  const payload = verifyAuthToken(token);

  if (!payload) {
    res.status(401).json({
      authenticated: false,
      rejected: true,
      error: 'Invalid or expired session token. Please re-authenticate.',
    });
    return;
  }

  req.user = payload;
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      error: 'Forbidden: Administrator privileges required.',
    });
    return;
  }
  next();
}
