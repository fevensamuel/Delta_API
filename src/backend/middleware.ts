import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { AdminRole, AuthTokenPayload } from '../types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'delta_travel_super_secret_jwt_key_2026_256bit';

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

/**
 * Verify JWT Token Middleware
 */
export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Access denied. No Authorization header provided.' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access denied. Malformed token format.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired authorization token.' });
  }
};

/**
 * Simple In-Memory Rate Limiting Helper
 */
const requestLog: Map<string, { count: number; resetTime: number }> = new Map();

export const customRateLimiter = (maxRequests: number, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();
    const record = requestLog.get(ip);

    if (!record || now > record.resetTime) {
      requestLog.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: `Too many requests from this IP. Limit is ${maxRequests} requests per ${Math.round(windowMs / 60000)} minutes.`
      });
    }

    record.count += 1;
    next();
  };
};