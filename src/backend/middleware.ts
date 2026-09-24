import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { AdminRole, AuthTokenPayload } from '../types.js';
import { dbOperations as db } from './database.js';

const JWT_SECRET =
  process.env.JWT_SECRET || 'delta_travel_super_secret_jwt_key_2026_256bit';

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
  // Filled in by loadAdminContext after fetching from DB — never trusted
  // from the JWT alone, because permissions can be revoked at any time.
  freshAdmin?: {
    id: string;
    username: string;
    email: string;
    role: AdminRole;
    permissions: string[];
    isActive: boolean;
  };
}

// ============================================================
// 1. VERIFY JWT TOKEN (existing)
// ============================================================
export const authenticateJWT = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, error: 'Access denied. No Authorization header provided.' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: 'Access denied. Malformed token format.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    req.user = decoded;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, error: 'Invalid or expired authorization token.' });
  }
};

// ============================================================
// 2. LOAD FRESH ADMIN FROM DB
// ============================================================
// Runs after authenticateJWT on every protected route. It re-reads the
// admin record from the database and attaches a `freshAdmin` object to the
// request. This guarantees that:
//   - a deactivated account is locked out immediately
//   - a revoked permission takes effect on the very next request
//   - the frontend can never trick the backend by sending a fake role/permissions
export const loadAdminContext = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, error: 'Not authenticated.' });
  }

  try {
    const admin = await db.findAdminUserById(req.user.id);
    if (!admin) {
      return res.status(401).json({ success: false, error: 'Admin account not found.' });
    }
    if (admin.isActive === false) {
      return res
        .status(403)
        .json({ success: false, error: 'Account is disabled. Contact a Super Admin.' });
    }

    req.freshAdmin = {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role as AdminRole,
      permissions: Array.isArray(admin.permissions) ? admin.permissions : [],
      isActive: admin.isActive !== false,
    };

    next();
  } catch (err) {
    console.error('❌ loadAdminContext error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};

// ============================================================
// 3. REQUIRE SUPER ADMIN
// ============================================================
// Use on routes that only SuperAdmins may hit (managing other admins).
// IMPORTANT: must be placed AFTER loadAdminContext.
export const requireSuperAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const admin = req.freshAdmin;
  if (!admin) {
    return res.status(401).json({ success: false, error: 'Not authenticated.' });
  }
  if (admin.role !== 'SuperAdmin') {
    return res
      .status(403)
      .json({ success: false, error: 'Super Admin access required for this action.' });
  }
  next();
};

// ============================================================
// 4. REQUIRE A SPECIFIC PERMISSION KEY
// ============================================================
// SuperAdmin always passes. Regular Admin must have the key in their
// permissions array. Must be placed AFTER loadAdminContext.
//
// Usage example:
//   apiRouter.delete('/admin/packages/:id',
//     authenticateJWT, loadAdminContext, requirePermission('packages'),
//     handler);
export const requirePermission = (permissionKey: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const admin = req.freshAdmin;
    if (!admin) {
      return res.status(401).json({ success: false, error: 'Not authenticated.' });
    }

    // SuperAdmins bypass all permission checks
    if (admin.role === 'SuperAdmin') {
      return next();
    }

    if (!admin.permissions.includes(permissionKey)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. You don't have the "${permissionKey}" permission.`,
      });
    }

    next();
  };
};

// ============================================================
// 5. RATE LIMITING (existing)
// ============================================================
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
        error: `Too many requests from this IP. Limit is ${maxRequests} requests per ${Math.round(windowMs / 60000)} minutes.`,
      });
    }

    record.count += 1;
    next();
  };
};