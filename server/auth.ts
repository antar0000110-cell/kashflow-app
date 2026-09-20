import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction, Router } from 'express';
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

export function generateAuthToken(user: UserRecord | AuthTokenPayload): string {
  const payload: AuthTokenPayload = {
    userId: 'userId' in user ? user.userId : user.id,
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

/**
 * Controller/Endpoint handler for POST /api/auth/refresh:
 * Validates the current JWT token and issues a new one if it is still active,
 * without requiring user credentials.
 */
export function handleRefreshToken(req: AuthenticatedRequest, res: Response): void {
  // Extract token from authorization header or request body
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1].trim();
  } else if (req.body && typeof req.body.token === 'string') {
    token = req.body.token.trim();
  }

  if (!token) {
    res.status(401).json({
      success: false,
      authenticated: false,
      rejected: true,
      error: 'Authorization token required to refresh session.',
      message: 'Authorization token required to refresh session.',
    });
    return;
  }

  // Validate the current JWT token
  const payload = verifyAuthToken(token);
  if (!payload) {
    res.status(401).json({
      success: false,
      authenticated: false,
      rejected: true,
      error: 'Invalid or expired session token. Please re-authenticate.',
      message: 'Invalid or expired session token. Please re-authenticate.',
    });
    return;
  }

  // Look up user in db to ensure account still exists and is active
  const user = db.findUserByUsername(payload.username);
  if (!user) {
    res.status(401).json({
      success: false,
      authenticated: false,
      rejected: true,
      error: 'User account no longer exists.',
      message: 'User account no longer exists.',
    });
    return;
  }

  if (user.status === 'suspended') {
    res.status(403).json({
      success: false,
      authenticated: false,
      rejected: true,
      error: 'User account has been suspended.',
      message: 'User account has been suspended.',
    });
    return;
  }

  // Issue a fresh active token (7-day validity) without needing credentials
  const newToken = generateAuthToken(user);

  let agentDetails = null;
  if (user.role === 'agent' && user.agentId) {
    agentDetails = db.getAgentById(user.agentId);
  }

  res.json({
    success: true,
    authenticated: true,
    token: newToken,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      agentId: user.agentId,
      agentName: agentDetails?.name || user.name,
      email: user.email,
    },
  });
}

/**
 * Express router exporting the POST /api/auth/refresh and POST /refresh endpoints
 */
export const authRouter = Router();
authRouter.post('/refresh', handleRefreshToken);
authRouter.post('/auth/refresh', handleRefreshToken);


