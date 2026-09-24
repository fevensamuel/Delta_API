import express, { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { dbOperations as db } from './database.js';
import { getExchangeRate, setAdminOverrideRate } from '../services/exchangeRateService.js';
import {
  galleryUploadFields,
  bulkUpload,
  teamUpload,
  officeUpload,
  packageUpload,
  audioFileUpload,
} from '../config/multer.js';
import {
  authenticateJWT,
  loadAdminContext,
  requirePermission,
  requireSuperAdmin,
  AuthenticatedRequest,
} from './middleware.js';

export const apiRouter = Router();
const JWT_SECRET =
  process.env.JWT_SECRET || 'delta_travel_super_secret_jwt_key_2026_256bit';

// ============================================================
// HELPERS
// ============================================================
const send = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ status: 'success', success: true, data });

const fail = (res: Response, error: unknown, status = 500) =>
  res.status(status).json({
    status: 'error',
    success: false,
    error: error instanceof Error ? error.message : String(error),
  });

const parse = (value: any, fallback: any = []) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const bool = (value: any, fallback = true): boolean => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return value === 'true' || value === 1 || value === '1';
};

const asyncRoute =
  (handler: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: express.NextFunction) =>
    handler(req, res).catch(next);

const fileUrl = (req: Request, field: string, fallback = '') => {
  const file = (req as any).file;
  return file?.filename ? `/uploads/${field}/${file.filename}` : fallback;
};

// ============================================================
// PERMISSION KEY WHITELIST
// ============================================================
// Must stay in sync with Delta-Admin/src/config/permissions.ts.
// Any permission key outside this list is rejected on write — prevents
// the client from inventing arbitrary permission keys.
const VALID_PERMISSION_KEYS = new Set<string>([
  'dashboard',
  'packages',
  'gallery',
  'inquiries',
  'flight-inquiries',
  'subscribers',
  'sms',
  'leads',
  'settings.contact',
  'settings.social',
  'settings.audio',
  'settings.team-members',
  'settings.office-images',
  'settings.testimonials',
  'settings.faqs',
  'settings.price-logs',
]);

const sanitizePermissions = (input: any): string[] => {
  if (!Array.isArray(input)) return [];
  return Array.from(
    new Set(input.filter((k) => typeof k === 'string' && VALID_PERMISSION_KEYS.has(k)))
  );
};

// ============================================================
// RESPONSE SHAPER — never leak password hashes
// ============================================================
const shapeAdmin = (user: any) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
  permissions: Array.isArray(user.permissions) ? user.permissions : [],
  isActive: user.isActive !== false,
  status: user.status || 'Active',
  lastLogin: user.lastLogin || null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// ============================================================
// AUTH
// ============================================================
async function login(req: Request, res: Response) {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  if (!username || !password) {
    return fail(res, 'Username and password are required', 400);
  }

  const user =
    (await db.findAdminUserByUsername(username)) ||
    (await db.findAdminUserByEmail(username));

  if (!user || !user.isActive) {
    return fail(res, 'Invalid credentials', 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return fail(res, 'Invalid credentials', 401);
  }

  await db.updateAdminUserLastLogin(user.id);

  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // ✅ Return the full admin shape the frontend expects, including role
  //    and permissions (SuperAdmins always get the whole permission list).
  const isSuper = user.role === 'SuperAdmin';
  const permissions = isSuper
    ? Array.from(VALID_PERMISSION_KEYS)
    : Array.isArray(user.permissions)
    ? user.permissions
    : [];

  return send(res, {
    token,
    user: {
      ...shapeAdmin(user),
      permissions,
    },
  });
}

apiRouter.post(['/login', '/admin/login', '/auth/login', '/admin/auth/login'], login);

apiRouter.get(
  ['/admin/me', '/admin/auth/me'],
  authenticateJWT,
  loadAdminContext,
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const admin = req.freshAdmin!;
    const isSuper = admin.role === 'SuperAdmin';
    return send(res, {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      permissions: isSuper ? Array.from(VALID_PERMISSION_KEYS) : admin.permissions,
      isActive: admin.isActive,
    });
  })
);

// ============================================================
// ADMIN USERS MANAGEMENT — SuperAdmin only
// ============================================================
apiRouter.get(
  '/admin/users',
  authenticateJWT,
  loadAdminContext,
  requireSuperAdmin,
  asyncRoute(async (_req, res) => {
    const users = await db.getAllAdminUsers();
    return send(res, users.map(shapeAdmin));
  })
);

apiRouter.post(
  '/admin/users',
  authenticateJWT,
  loadAdminContext,
  requireSuperAdmin,
  asyncRoute(async (req, res) => {
    const { username, email, password, role, permissions } = req.body || {};

    if (!username || !email || !password) {
      return fail(res, 'Username, email and password are required', 400);
    }
    if (String(password).length < 6) {
      return fail(res, 'Password must be at least 6 characters', 400);
    }
    if (role && !['Admin', 'SuperAdmin'].includes(role)) {
      return fail(res, 'Role must be "Admin" or "SuperAdmin"', 400);
    }

    const existingUsername = await db.findAdminUserByUsername(username);
    if (existingUsername) {
      return fail(res, 'Username already exists', 409);
    }
    const existingEmail = await db.findAdminUserByEmail(email);
    if (existingEmail) {
      return fail(res, 'Email already exists', 409);
    }

    const finalRole = role === 'SuperAdmin' ? 'SuperAdmin' : 'Admin';
    const finalPermissions =
      finalRole === 'SuperAdmin' ? Array.from(VALID_PERMISSION_KEYS) : sanitizePermissions(permissions);

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await db.createAdminUser({
      username: String(username).trim(),
      email: String(email).trim(),
      passwordHash,
      role: finalRole,
      permissions: finalPermissions,
      isActive: true,
    });

    return send(res, shapeAdmin(created), 201);
  })
);

apiRouter.put(
  '/admin/users/:id',
  authenticateJWT,
  loadAdminContext,
  requireSuperAdmin,
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const target = await db.findAdminUserById(req.params.id);
    if (!target) return fail(res, 'Admin user not found', 404);

    const data: any = {};

    if (req.body.username !== undefined) {
      const newUsername = String(req.body.username).trim();
      if (newUsername && newUsername.toLowerCase() !== target.username.toLowerCase()) {
        const dup = await db.findAdminUserByUsername(newUsername);
        if (dup && dup.id !== target.id) {
          return fail(res, 'Username already exists', 409);
        }
        data.username = newUsername;
      }
    }
    if (req.body.email !== undefined) {
      const newEmail = String(req.body.email).trim();
      if (newEmail && newEmail.toLowerCase() !== target.email.toLowerCase()) {
        const dup = await db.findAdminUserByEmail(newEmail);
        if (dup && dup.id !== target.id) {
          return fail(res, 'Email already exists', 409);
        }
        data.email = newEmail;
      }
    }
    if (req.body.password) {
      if (String(req.body.password).length < 6) {
        return fail(res, 'Password must be at least 6 characters', 400);
      }
      data.passwordHash = await bcrypt.hash(req.body.password, 10);
    }

    // Role change — only allowed if the requester is SuperAdmin (already
    // enforced) and we don't strip the last remaining SuperAdmin.
    if (req.body.role !== undefined && ['Admin', 'SuperAdmin'].includes(req.body.role)) {
      const nextRole = req.body.role;
      if (target.role === 'SuperAdmin' && nextRole === 'Admin') {
        const all = await db.getAllAdminUsers();
        const superCount = all.filter((u) => u.role === 'SuperAdmin').length;
        if (superCount <= 1) {
          return fail(res, 'Cannot demote the last remaining Super Admin.', 400);
        }
      }
      data.role = nextRole;
    }

    if (req.body.permissions !== undefined) {
      data.permissions =
        (data.role || target.role) === 'SuperAdmin'
          ? Array.from(VALID_PERMISSION_KEYS)
          : sanitizePermissions(req.body.permissions);
    }

    if (req.body.isActive !== undefined) {
      // Prevent a SuperAdmin from deactivating themselves
      if (target.id === req.freshAdmin!.id && req.body.isActive === false) {
        return fail(res, "You can't deactivate your own account.", 400);
      }
      data.isActive = bool(req.body.isActive, true);
      data.status = data.isActive ? 'Active' : 'Inactive';
    }

    const updated = await db.updateAdminUser(target.id, data);
    return send(res, shapeAdmin(updated));
  })
);

apiRouter.put(
  '/admin/users/:id/permissions',
  authenticateJWT,
  loadAdminContext,
  requireSuperAdmin,
  asyncRoute(async (req, res) => {
    const target = await db.findAdminUserById(req.params.id);
    if (!target) return fail(res, 'Admin user not found', 404);

    if (target.role === 'SuperAdmin') {
      return fail(res, 'Super Admins always have full access. Demote first.', 400);
    }

    const perms = sanitizePermissions(req.body.permissions);
    const updated = await db.updateAdminPermissions(target.id, perms);
    return send(res, shapeAdmin(updated));
  })
);

apiRouter.put(
  '/admin/users/:id/status',
  authenticateJWT,
  loadAdminContext,
  requireSuperAdmin,
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const target = await db.findAdminUserById(req.params.id);
    if (!target) return fail(res, 'Admin user not found', 404);

    if (target.id === req.freshAdmin!.id && req.body.isActive === false) {
      return fail(res, "You can't deactivate your own account.", 400);
    }

    const isActive = bool(req.body.isActive, true);
    const updated = await db.updateAdminStatus(target.id, isActive);
    return send(res, shapeAdmin(updated));
  })
);

apiRouter.delete(
  '/admin/users/:id',
  authenticateJWT,
  loadAdminContext,
  requireSuperAdmin,
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const target = await db.findAdminUserById(req.params.id);
    if (!target) return fail(res, 'Admin user not found', 404);

    if (target.id === req.freshAdmin!.id) {
      return fail(res, "You can't delete your own account.", 400);
    }

    if (target.role === 'SuperAdmin') {
      const all = await db.getAllAdminUsers();
      const superCount = all.filter((u) => u.role === 'SuperAdmin').length;
      if (superCount <= 1) {
        return fail(res, 'Cannot delete the last remaining Super Admin.', 400);
      }
    }

    await db.deleteAdminUser(target.id);
    return send(res, { message: 'Admin user deleted successfully' });
  })
);

// ============================================================
// EXCHANGE RATE
// ============================================================
apiRouter.get(
  '/exchange-rate',
  asyncRoute(async (_req, res) => send(res, await getExchangeRate()))
);

apiRouter.get(
  '/admin/exchange-rate',
  authenticateJWT,
  loadAdminContext,
  asyncRoute(async (_req, res) => send(res, await getExchangeRate()))
);

apiRouter.post(
  '/admin/exchange-rate',
  authenticateJWT,
  loadAdminContext,
  (req, res) => {
    const rate = Number(req.body.rate);
    if (!rate || rate <= 0) return fail(res, 'Valid rate number is required', 400);
    return send(res, setAdminOverrideRate(rate));
  }
);

// ============================================================
// SOCIAL LINKS
// ============================================================
apiRouter.get(
  '/social-links',
  asyncRoute(async (_req, res) => send(res, await db.getActiveSocialLinks()))
);

apiRouter.get(
  '/admin/social-links',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.social'),
  asyncRoute(async (_req, res) => send(res, await db.getAllSocialLinks()))
);

apiRouter.post(
  '/admin/social-links',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.social'),
  asyncRoute(async (req, res) => {
    if (!req.body.platform || !req.body.url) {
      return fail(res, 'Platform and URL are required', 400);
    }
    return send(
      res,
      await db.createSocialLink({
        ...req.body,
        platform: String(req.body.platform).toLowerCase(),
        icon: req.body.icon || req.body.platform,
      }),
      201
    );
  })
);

apiRouter.put(
  '/admin/social-links/:id',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.social'),
  asyncRoute(async (req, res) => {
    const item = await db.updateSocialLink(req.params.id, req.body);
    if (!item) return fail(res, 'Social Media link not found', 404);
    return send(res, item);
  })
);

apiRouter.delete(
  '/admin/social-links/:id',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.social'),
  asyncRoute(async (req, res) => {
    const item = await db.deleteSocialLink(req.params.id);
    if (!item) return fail(res, 'Social Media link not found', 404);
    return send(res, { message: 'Social Media link deleted successfully' });
  })
);

// ============================================================
// CONTACT SETTINGS
// ============================================================
apiRouter.get(
  '/contact-settings',
  asyncRoute(async (_req, res) => {
    const settings = await db.getActiveContactSettings();
    if (!settings) {
      return send(res, {
        whatsappNumber: null,
        phoneNumber: null,
        smsNumber: null,
      });
    }
    return send(res, {
      whatsappNumber: settings.whatsapp_number ?? settings.whatsappNumber ?? null,
      phoneNumber: settings.phone_number ?? settings.phoneNumber ?? null,
      smsNumber: settings.sms_number ?? settings.smsNumber ?? null,
    });
  })
);

apiRouter.get(
  '/admin/contact-settings',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.contact'),
  asyncRoute(async (_req, res) => {
    const settings = await db.getContactSettings();
    return send(res, {
      id: settings.id,
      whatsappNumber: settings.whatsapp_number ?? settings.whatsappNumber ?? '',
      phoneNumber: settings.phone_number ?? settings.phoneNumber ?? '',
      smsNumber: settings.sms_number ?? settings.smsNumber ?? '',
      isActive: settings.is_active !== undefined ? settings.is_active : settings.isActive,
      createdAt: settings.created_at ?? settings.createdAt,
      updatedAt: settings.updated_at ?? settings.updatedAt,
    });
  })
);

apiRouter.put(
  '/admin/contact-settings',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.contact'),
  asyncRoute(async (req, res) => {
    const updated = await db.updateContactSettings(req.body);
    return send(res, {
      id: updated.id,
      whatsappNumber: updated.whatsapp_number ?? updated.whatsappNumber ?? '',
      phoneNumber: updated.phone_number ?? updated.phoneNumber ?? '',
      smsNumber: updated.sms_number ?? updated.smsNumber ?? '',
      isActive: updated.is_active !== undefined ? updated.is_active : updated.isActive,
      createdAt: updated.created_at ?? updated.createdAt,
      updatedAt: updated.updated_at ?? updated.updatedAt,
    });
  })
);

// ============================================================
// FAQS
// ============================================================
apiRouter.get(
  '/faqs',
  asyncRoute(async (_req, res) => {
    const data = await db.getActiveFaqs();
    return res.json({ status: 'success', success: true, count: data.length, data });
  })
);

apiRouter.get(
  '/admin/faqs',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.faqs'),
  asyncRoute(async (_req, res) => {
    const data = await db.getAllFaqs();
    return res.json({ status: 'success', success: true, count: data.length, data });
  })
);

apiRouter.post(
  '/admin/faqs',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.faqs'),
  asyncRoute(async (req, res) => {
    if (!req.body.question || !req.body.answer) {
      return fail(res, 'Question and answer are required', 400);
    }
    return send(res, await db.createFaq(req.body), 201);
  })
);

apiRouter.put(
  '/admin/faqs/:id',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.faqs'),
  asyncRoute(async (req, res) => {
    const item = await db.updateFaq(req.params.id, req.body);
    if (!item) return fail(res, 'FAQ not found', 404);
    return send(res, item);
  })
);

apiRouter.delete(
  '/admin/faqs/:id',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.faqs'),
  asyncRoute(async (req, res) => {
    const item = await db.deleteFaq(req.params.id);
    if (!item) return fail(res, 'FAQ not found', 404);
    return send(res, { message: 'FAQ deleted successfully' });
  })
);

// ============================================================
// PACKAGES
// ============================================================
const packageInput = (body: any, file?: Express.Multer.File) => ({
  titleEn: body.titleEn,
  titleAr: body.titleAr || '',
  titleAm: body.titleAm || '',
  category: body.category,
  priceUsd: Number(body.priceUsd),
  priceEtb: body.priceEtb === undefined || body.priceEtb === '' ? undefined : Number(body.priceEtb),
  priceSar: body.priceSar === undefined || body.priceSar === '' ? undefined : Number(body.priceSar),
  priceType: body.priceType || 'single',
  priceUsdMin: body.priceUsdMin ? Number(body.priceUsdMin) : undefined,
  priceUsdMax: body.priceUsdMax ? Number(body.priceUsdMax) : undefined,
  priceEtbMin: body.priceEtbMin ? Number(body.priceEtbMin) : undefined,
  priceEtbMax: body.priceEtbMax ? Number(body.priceEtbMax) : undefined,
  priceSarMin: body.priceSarMin ? Number(body.priceSarMin) : undefined,
  priceSarMax: body.priceSarMax ? Number(body.priceSarMax) : undefined,
  durationDays: Number(body.durationDays),
  departureCity: body.departureCity || 'Addis Ababa',
  inclusions: parse(body.inclusions),
  availableDates: parse(body.availableDates),
  itinerary: parse(body.itinerary),
  discounts: parse(body.discounts),
  persons: parse(body.persons),
  imageUrl: file ? `/uploads/packages/${file.filename}` : body.imageUrl,
  isActive: bool(body.isActive, true),
});

apiRouter.get(
  '/packages',
  asyncRoute(async (_req, res) => {
    const rate = (await getExchangeRate()).rate;
    const data = (await db.getActivePackages()).map((item: any) => ({
      ...item,
      priceEtb: item.priceEtb || Math.round(item.priceUsd * rate),
      priceSar: item.priceSar || Math.round(item.priceUsd * 3.75),
    }));
    return res.json({ status: 'success', success: true, count: data.length, data });
  })
);

apiRouter.get(
  '/packages/:id',
  asyncRoute(async (req, res) => {
    const item = await db.findPackageById(req.params.id);
    if (!item || !item.isActive) return fail(res, 'Package not found', 404);
    return send(res, item);
  })
);

apiRouter.post(
  '/packages/:id/click-whatsapp',
  asyncRoute(async (req, res) => {
    const item = await db.incrementPackageWhatsappClicks(req.params.id);
    if (!item) return fail(res, 'Package not found', 404);
    return send(res, { whatsappClicks: item.whatsappClicks });
  })
);

apiRouter.get(
  '/admin/packages',
  authenticateJWT,
  loadAdminContext,
  requirePermission('packages'),
  asyncRoute(async (_req, res) => {
    const data = await db.getAllPackages();
    return res.json({ status: 'success', success: true, count: data.length, data });
  })
);

apiRouter.get(
  '/admin/packages/:id',
  authenticateJWT,
  loadAdminContext,
  requirePermission('packages'),
  asyncRoute(async (req, res) => {
    const item = await db.findPackageById(req.params.id);
    if (!item) return fail(res, 'Package not found', 404);
    return send(res, item);
  })
);

apiRouter.post(
  '/admin/packages',
  authenticateJWT,
  loadAdminContext,
  requirePermission('packages'),
  packageUpload,
  asyncRoute(async (req, res) => {
    const data = await db.createPackage(packageInput(req.body, (req as any).file));
    await db.createPriceLog({
      packageId: data.id,
      priceUsd: data.priceUsd,
      priceEtb: data.priceEtb,
      priceSar: data.priceSar,
      reason: 'Initial package creation',
      updatedBy: 'Admin',
    });
    return send(res, data, 201);
  })
);

apiRouter.put(
  '/admin/packages/:id',
  authenticateJWT,
  loadAdminContext,
  requirePermission('packages'),
  packageUpload,
  asyncRoute(async (req, res) => {
    const existing = await db.findPackageById(req.params.id);
    if (!existing) return fail(res, 'Package not found', 404);
    const data = await db.updatePackage(
      req.params.id,
      packageInput({ ...existing, ...req.body }, (req as any).file),
      req.body.reason
    );
    return send(res, data);
  })
);

apiRouter.delete(
  '/admin/packages/:id',
  authenticateJWT,
  loadAdminContext,
  requirePermission('packages'),
  asyncRoute(async (req, res) => {
    const item = await db.deletePackage(req.params.id);
    if (!item) return fail(res, 'Package not found', 404);
    return send(res, { message: 'Package deleted successfully' });
  })
);

// ============================================================
// GALLERY
// ============================================================
const galleryInput = (body: any, files: any) => ({
  type: body.type === 'video' ? 'video' : 'photo',
  titleEn: body.titleEn || body.title_en || body.title || '',
  titleAr: body.titleAr || body.title_ar || '',
  imageUrl: files?.image?.[0]
    ? `/uploads/images/${files.image[0].filename}`
    : body.imageUrl || body.image_url || '',
  thumbnailUrl: body.thumbnailUrl || '',
  videoUrl: files?.video?.[0]
    ? `/uploads/videos/${files.video[0].filename}`
    : body.videoUrl || body.video_url || '',
  duration: body.duration || '',
  location: body.location || '',
  description: body.description || '',
  isActive: bool(body.isActive, true),
  sortOrder: Number(body.sortOrder || body.sort_order || 0),
});

apiRouter.get(
  '/gallery',
  asyncRoute(async (req, res) => {
    let data: any[] = await db.getActiveGalleryItems();
    if (req.query.type) {
      data = data.filter((item) => item.type === String(req.query.type));
    }
    return res.json({ status: 'success', success: true, count: data.length, data });
  })
);

apiRouter.get(
  '/gallery/:id',
  asyncRoute(async (req, res) => {
    const item = await db.findGalleryItemById(req.params.id);
    if (!item || !item.isActive) return fail(res, 'Gallery item not found', 404);
    return send(res, item);
  })
);

apiRouter.get(
  '/admin/gallery',
  authenticateJWT,
  loadAdminContext,
  requirePermission('gallery'),
  asyncRoute(async (req, res) => {
    let data: any[] = await db.getAllGalleryItems();
    if (req.query.type) {
      data = data.filter((item) => item.type === String(req.query.type));
    }
    return res.json({ status: 'success', success: true, count: data.length, data });
  })
);

apiRouter.post(
  '/admin/gallery',
  authenticateJWT,
  loadAdminContext,
  requirePermission('gallery'),
  galleryUploadFields,
  asyncRoute(async (req, res) =>
    send(res, await db.createGalleryItem(galleryInput(req.body, req.files)), 201)
  )
);

apiRouter.post(
  '/admin/gallery/bulk',
  authenticateJWT,
  loadAdminContext,
  requirePermission('gallery'),
  bulkUpload,
  asyncRoute(async (req, res) => {
    const files = ((req as any).files || []) as Express.Multer.File[];
    const data = await db.createManyGalleryItems(
      files.map((file) => ({
        type: file.mimetype.startsWith('video/') ? 'video' : 'photo',
        titleEn: file.originalname,
        imageUrl: file.mimetype.startsWith('image/')
          ? `/uploads/images/${file.filename}`
          : '',
        videoUrl: file.mimetype.startsWith('video/')
          ? `/uploads/videos/${file.filename}`
          : '',
      }))
    );
    return send(res, data, 201);
  })
);

apiRouter.put(
  '/admin/gallery/:id',
  authenticateJWT,
  loadAdminContext,
  requirePermission('gallery'),
  asyncRoute(async (req, res) => {
    const item = await db.updateGalleryItem(req.params.id, req.body);
    if (!item) return fail(res, 'Gallery item not found', 404);
    return send(res, item);
  })
);

apiRouter.delete(
  '/admin/gallery/:id',
  authenticateJWT,
  loadAdminContext,
  requirePermission('gallery'),
  asyncRoute(async (req, res) => {
    const item = await db.deleteGalleryItem(req.params.id);
    if (!item) return fail(res, 'Gallery item not found', 404);
    return send(res, { message: 'Gallery item deleted successfully' });
  })
);

// ============================================================
// INQUIRIES
// ============================================================
apiRouter.get(
  '/admin/inquiries',
  authenticateJWT,
  loadAdminContext,
  requirePermission('inquiries'),
  asyncRoute(async (_req, res) => send(res, await db.getAllInquiries()))
);

apiRouter.post(
  '/inquiries',
  asyncRoute(async (req, res) => {
    if (!req.body.fullName || !req.body.phone || !req.body.message) {
      return fail(res, 'Name, phone and message are required', 400);
    }
    return send(res, await db.createInquiry(req.body), 201);
  })
);

apiRouter.put(
  '/admin/inquiries/bulk-status',
  authenticateJWT,
  loadAdminContext,
  requirePermission('inquiries'),
  asyncRoute(async (req, res) =>
    send(
      res,
      await db.updateManyInquiryStatus(req.body.ids || [], req.body.status || 'Contacted')
    )
  )
);

apiRouter.put(
  '/admin/inquiries/:id',
  authenticateJWT,
  loadAdminContext,
  requirePermission('inquiries'),
  asyncRoute(async (req, res) => {
    const item = await db.updateInquiryStatus(req.params.id, req.body.status);
    if (!item) return fail(res, 'Inquiry not found', 404);
    return send(res, item);
  })
);

apiRouter.delete(
  '/admin/inquiries/bulk-delete',
  authenticateJWT,
  loadAdminContext,
  requirePermission('inquiries'),
  asyncRoute(async (req, res) =>
    send(res, { deleted: await db.deleteManyInquiries(req.body.ids || []) })
  )
);

apiRouter.delete(
  '/admin/inquiries/:id',
  authenticateJWT,
  loadAdminContext,
  requirePermission('inquiries'),
  asyncRoute(async (req, res) => {
    const item = await db.deleteInquiry(req.params.id);
    if (!item) return fail(res, 'Inquiry not found', 404);
    return send(res, { message: 'Inquiry deleted successfully' });
  })
);

// ============================================================
// FLIGHT INQUIRIES
// ============================================================
apiRouter.post(
  '/flight-inquiries',
  asyncRoute(async (req, res) => {
    const { fullName, phone } = req.body || {};
    if (!fullName || !phone) {
      return fail(res, 'Full name and phone are required', 400);
    }

    const inquiry = await db.createFlightInquiry({
      fullName,
      phone,
      email: req.body.email || '',
      fromCity: req.body.fromCity || '',
      destination: req.body.destination || '',
      departureDate: req.body.departureDate || '',
      returnDate: req.body.returnDate || '',
      tripType: req.body.tripType || (req.body.returnDate ? 'Round Trip' : 'One Way'),
      passengers: req.body.passengers !== undefined ? Number(req.body.passengers) : 1,
      cabinClass: req.body.cabinClass || 'Economy',
      preferredAirline: req.body.preferredAirline || '',
      notes: req.body.notes || '',
      status: 'New',
    });

    return send(res, inquiry, 201);
  })
);

apiRouter.get(
  '/admin/flight-inquiries',
  authenticateJWT,
  loadAdminContext,
  requirePermission('flight-inquiries'),
  asyncRoute(async (_req, res) => {
    const data = await db.getAllFlightInquiries();
    return res.json({ status: 'success', success: true, count: data.length, data });
  })
);

apiRouter.get(
  '/admin/flight-inquiries/:id',
  authenticateJWT,
  loadAdminContext,
  requirePermission('flight-inquiries'),
  asyncRoute(async (req, res) => {
    const item = await db.findFlightInquiryById(req.params.id);
    if (!item) return fail(res, 'Flight inquiry not found', 404);
    return send(res, item);
  })
);

apiRouter.post(
  '/admin/flight-inquiries',
  authenticateJWT,
  loadAdminContext,
  requirePermission('flight-inquiries'),
  asyncRoute(async (req, res) => {
    const { fullName, phone } = req.body || {};
    if (!fullName || !phone) {
      return fail(res, 'Full name and phone are required', 400);
    }

    const inquiry = await db.createFlightInquiry({
      fullName,
      phone,
      email: req.body.email || '',
      fromCity: req.body.fromCity || '',
      destination: req.body.destination || '',
      departureDate: req.body.departureDate || '',
      returnDate: req.body.returnDate || '',
      tripType: req.body.tripType || (req.body.returnDate ? 'Round Trip' : 'One Way'),
      passengers: req.body.passengers !== undefined ? Number(req.body.passengers) : 1,
      cabinClass: req.body.cabinClass || 'Economy',
      preferredAirline: req.body.preferredAirline || '',
      notes: req.body.notes || '',
      status: req.body.status || 'New',
    });

    return send(res, inquiry, 201);
  })
);

apiRouter.put(
  '/admin/flight-inquiries/:id',
  authenticateJWT,
  loadAdminContext,
  requirePermission('flight-inquiries'),
  asyncRoute(async (req, res) => {
    const item = await db.updateFlightInquiry(req.params.id, req.body);
    if (!item) return fail(res, 'Flight inquiry not found', 404);
    return send(res, item);
  })
);

apiRouter.delete(
  '/admin/flight-inquiries/:id',
  authenticateJWT,
  loadAdminContext,
  requirePermission('flight-inquiries'),
  asyncRoute(async (req, res) => {
    const item = await db.deleteFlightInquiry(req.params.id);
    if (!item) return fail(res, 'Flight inquiry not found', 404);
    return send(res, { message: 'Flight inquiry deleted successfully' });
  })
);

// ============================================================
// PRICE LOGS
// ============================================================
apiRouter.get(
  '/admin/price-logs',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.price-logs'),
  asyncRoute(async (_req, res) => send(res, await db.getAllPriceLogs()))
);

apiRouter.post(
  '/admin/price-logs',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.price-logs'),
  asyncRoute(async (req, res) => send(res, await db.createPriceLog(req.body), 201))
);

// ============================================================
// SMS
// ============================================================
apiRouter.post(
  '/admin/sms/campaign',
  authenticateJWT,
  loadAdminContext,
  requirePermission('sms'),
  asyncRoute(async (req, res) => {
    const message = String(req.body.message || '');
    if (!message) return fail(res, 'Message is required', 400);

    const recipientType = req.body.recipientType || 'subscribers';
    let recipients: any[] = [];

    if (recipientType === 'persons') {
      const packages = await db.getAllPackages();
      recipients = packages.flatMap((pkg: any) =>
        (pkg.persons || [])
          .filter((p: any) => p && p.phone)
          .map((p: any) => ({ phone: p.phone, name: p.name || '', packageTitle: pkg.titleEn }))
      );
    } else {
      recipients = await db.getOptedInSubscribers();
    }

    const logs = await Promise.all(
      recipients.map((recipient: any) =>
        db.createSmsLog({
          phone: recipient.phone,
          message,
          campaignName: req.body.campaignName,
          status: 'Delivered',
        })
      )
    );

    return send(res, {
      sent: logs.length,
      recipientType,
      recipientsCount: recipients.length,
      logs,
    });
  })
);

const smsLogs = asyncRoute(async (_req, res) => send(res, await db.getAllSmsLogs()));
apiRouter.get('/admin/sms/logs', authenticateJWT, loadAdminContext, requirePermission('sms'), smsLogs);
apiRouter.get('/admin/sms/campaigns', authenticateJWT, loadAdminContext, requirePermission('sms'), smsLogs);

// ============================================================
// DASHBOARD
// ============================================================
apiRouter.get(
  '/admin/dashboard/stats',
  authenticateJWT,
  loadAdminContext,
  requirePermission('dashboard'),
  asyncRoute(async (_req, res) => send(res, await db.getDashboardStats()))
);

// ============================================================
// TEAM MEMBERS
// ============================================================
const uploadBody = (req: Request, field: string, fallback = '') =>
  fileUrl(req, field, req.body.imageUrl || fallback);

apiRouter.get(
  '/team-members',
  asyncRoute(async (_req, res) => send(res, await db.getActiveTeamMembers()))
);

apiRouter.get(
  '/admin/team-members',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.team-members'),
  asyncRoute(async (_req, res) => send(res, await db.getAllTeamMembers()))
);

apiRouter.post(
  '/admin/team-members',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.team-members'),
  teamUpload,
  asyncRoute(async (req, res) => {
    const member = await db.createTeamMember({
      name: req.body.name,
      role: req.body.role,
      bio: req.body.bio,
      imageUrl: uploadBody(req, 'team'),
      order: Number(req.body.order || 0),
      isActive: bool(req.body.isActive, true),
    });
    return send(res, member, 201);
  })
);

apiRouter.put(
  '/admin/team-members/:id',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.team-members'),
  teamUpload,
  asyncRoute(async (req, res) => {
    const updateData: any = {
      name: req.body.name,
      role: req.body.role,
      bio: req.body.bio,
      image_url: uploadBody(req, 'team', req.body.imageUrl),
      sort_order: Number(req.body.order || 0),
      is_active:
        req.body.isActive === undefined ? undefined : bool(req.body.isActive, true),
    };

    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const item = await db.updateTeamMember(req.params.id, updateData);
    if (!item) return fail(res, 'Team member not found', 404);
    return send(res, item);
  })
);

apiRouter.delete(
  '/admin/team-members/:id',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.team-members'),
  asyncRoute(async (req, res) => {
    const item = await db.deleteTeamMember(req.params.id);
    if (!item) return fail(res, 'Team member not found', 404);
    return send(res, { message: 'Team member deleted successfully' });
  })
);

// ============================================================
// OFFICE IMAGES
// ============================================================
apiRouter.get(
  '/office-images',
  asyncRoute(async (_req, res) => send(res, await db.getActiveOfficeImages()))
);

apiRouter.get(
  '/admin/office-images',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.office-images'),
  asyncRoute(async (_req, res) => send(res, await db.getAllOfficeImages()))
);

apiRouter.post(
  '/admin/office-images',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.office-images'),
  officeUpload,
  asyncRoute(async (req, res) => {
    const image = await db.createOfficeImage({
      title: req.body.title || '',
      imageUrl: uploadBody(req, 'office'),
      description: req.body.description || '',
      order: Number(req.body.order || 0),
      isActive: bool(req.body.isActive, true),
    });
    return send(res, image, 201);
  })
);

apiRouter.put(
  '/admin/office-images/:id',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.office-images'),
  officeUpload,
  asyncRoute(async (req, res) => {
    const updateData: any = {
      title: req.body.title,
      image_url: uploadBody(req, 'office', req.body.imageUrl),
      description: req.body.description,
      sort_order: Number(req.body.order || 0),
      is_active:
        req.body.isActive === undefined ? undefined : bool(req.body.isActive, true),
    };

    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const item = await db.updateOfficeImage(req.params.id, updateData);
    if (!item) return fail(res, 'Office image not found', 404);
    return send(res, item);
  })
);

apiRouter.delete(
  '/admin/office-images/:id',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.office-images'),
  asyncRoute(async (req, res) => {
    const item = await db.deleteOfficeImage(req.params.id);
    if (!item) return fail(res, 'Office image not found', 404);
    return send(res, { message: 'Office image deleted successfully' });
  })
);

// ============================================================
// TESTIMONIALS
// ============================================================
apiRouter.get(
  '/testimonials',
  asyncRoute(async (_req, res) => send(res, await db.getActiveTestimonials()))
);

apiRouter.get(
  '/admin/testimonials',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.testimonials'),
  asyncRoute(async (_req, res) => send(res, await db.getAllTestimonials()))
);

apiRouter.post(
  '/admin/testimonials',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.testimonials'),
  asyncRoute(async (req, res) => send(res, await db.createTestimonial(req.body), 201))
);

apiRouter.put(
  '/admin/testimonials/:id',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.testimonials'),
  asyncRoute(async (req, res) => {
    const item = await db.updateTestimonial(req.params.id, req.body);
    if (!item) return fail(res, 'Testimonial not found', 404);
    return send(res, item);
  })
);

apiRouter.delete(
  '/admin/testimonials/:id',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.testimonials'),
  asyncRoute(async (req, res) => {
    const item = await db.deleteTestimonial(req.params.id);
    if (!item) return fail(res, 'Testimonial not found', 404);
    return send(res, { message: 'Testimonial deleted successfully' });
  })
);

// ============================================================
// SUBSCRIBERS
// ============================================================
apiRouter.get(
  '/admin/subscribers',
  authenticateJWT,
  loadAdminContext,
  requirePermission('subscribers'),
  asyncRoute(async (_req, res) => send(res, await db.getAllSubscribers()))
);

apiRouter.post(
  '/subscribers',
  asyncRoute(async (req, res) => {
    if (!req.body.phone) return fail(res, 'Phone is required', 400);
    return send(res, await db.createSubscriber(req.body), 201);
  })
);

apiRouter.post(
  '/admin/subscribers',
  authenticateJWT,
  loadAdminContext,
  requirePermission('subscribers'),
  asyncRoute(async (req, res) => send(res, await db.createSubscriber(req.body), 201))
);

apiRouter.delete(
  '/admin/subscribers/bulk-delete',
  authenticateJWT,
  loadAdminContext,
  requirePermission('subscribers'),
  asyncRoute(async (req, res) =>
    send(res, {
      deleted: await db.deleteSubscribers(req.body.ids || [], req.body.phones || []),
    })
  )
);

apiRouter.delete(
  '/admin/subscribers/:id',
  authenticateJWT,
  loadAdminContext,
  requirePermission('subscribers'),
  asyncRoute(async (req, res) => {
    const item = await db.deleteSubscriber(req.params.id);
    if (!item) return fail(res, 'Subscriber not found', 404);
    return send(res, { message: 'Subscriber deleted successfully' });
  })
);

apiRouter.put(
  '/admin/subscribers/:id',
  authenticateJWT,
  loadAdminContext,
  requirePermission('subscribers'),
  asyncRoute(async (req, res) => {
    const item = await db.updateSubscriber(req.params.id, req.body);
    if (!item) return fail(res, 'Subscriber not found', 404);
    return send(res, item);
  })
);

apiRouter.post(
  '/admin/subscribers/bulk',
  authenticateJWT,
  loadAdminContext,
  requirePermission('subscribers'),
  asyncRoute(async (req, res) =>
    send(res, await db.bulkImportSubscribers(req.body.subscribers || req.body), 201)
  )
);

// ============================================================
// AUDIO TRACKS
// ============================================================
apiRouter.get(
  '/audio',
  asyncRoute(async (_req, res) => {
    const data = await db.getActiveAudioTracks();
    return res.json({ status: 'success', success: true, count: data.length, data });
  })
);

apiRouter.get(
  '/admin/audio',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.audio'),
  asyncRoute(async (_req, res) => {
    const data = await db.getAllAudioTracks();
    return res.json({ status: 'success', success: true, count: data.length, data });
  })
);

apiRouter.get(
  '/admin/audio/:id',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.audio'),
  asyncRoute(async (req, res) => {
    const item = await db.findAudioTrackById(req.params.id);
    if (!item) return fail(res, 'Audio track not found', 404);
    return send(res, item);
  })
);

apiRouter.post(
  '/admin/audio/upload',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.audio'),
  audioFileUpload,
  asyncRoute(async (req, res) => {
    const file = (req as any).file;
    if (!file) return fail(res, 'No audio file uploaded', 400);
    return send(res, { audioUrl: `/uploads/audio/${file.filename}` }, 201);
  })
);

apiRouter.post(
  '/admin/audio',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.audio'),
  audioFileUpload,
  asyncRoute(async (req, res) => {
    const file = (req as any).file;
    if (!req.body.titleEn) return fail(res, 'English title is required', 400);

    const audioUrl = file ? `/uploads/audio/${file.filename}` : req.body.audioUrl;
    if (!audioUrl) return fail(res, 'Audio file or audioUrl is required', 400);

    const track = await db.createAudioTrack({
      titleEn: req.body.titleEn,
      titleAm: req.body.titleAm || '',
      titleAr: req.body.titleAr || '',
      audioUrl,
      duration: req.body.duration ? Number(req.body.duration) : 0,
      sortOrder: req.body.sortOrder !== undefined ? Number(req.body.sortOrder) : 0,
      isActive: bool(req.body.isActive, true),
    });

    return send(res, track, 201);
  })
);

apiRouter.put(
  '/admin/audio/:id',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.audio'),
  audioFileUpload,
  asyncRoute(async (req, res) => {
    const file = (req as any).file;

    const updateData: any = {
      titleEn: req.body.titleEn,
      titleAm: req.body.titleAm,
      titleAr: req.body.titleAr,
      audioUrl: file ? `/uploads/audio/${file.filename}` : req.body.audioUrl,
      duration: req.body.duration !== undefined ? Number(req.body.duration) : undefined,
      sortOrder: req.body.sortOrder !== undefined ? Number(req.body.sortOrder) : undefined,
      isActive: req.body.isActive === undefined ? undefined : bool(req.body.isActive, true),
    };

    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const item = await db.updateAudioTrack(req.params.id, updateData);
    if (!item) return fail(res, 'Audio track not found', 404);
    return send(res, item);
  })
);

apiRouter.patch(
  '/admin/audio/:id/status',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.audio'),
  asyncRoute(async (req, res) => {
    const item = await db.updateAudioTrack(req.params.id, {
      isActive: bool(req.body.isActive, true),
    });
    if (!item) return fail(res, 'Audio track not found', 404);
    return send(res, item);
  })
);

apiRouter.patch(
  '/admin/audio/reorder',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.audio'),
  asyncRoute(async (req, res) => {
    const ids: string[] = req.body.ids || [];
    if (!Array.isArray(ids) || ids.length === 0) {
      return fail(res, 'An array of track ids is required', 400);
    }
    await db.reorderAudioTracks(ids);
    return send(res, { reordered: ids.length });
  })
);

apiRouter.delete(
  '/admin/audio/:id',
  authenticateJWT,
  loadAdminContext,
  requirePermission('settings.audio'),
  asyncRoute(async (req, res) => {
    const item = await db.deleteAudioTrack(req.params.id);
    if (!item) return fail(res, 'Audio track not found', 404);
    return send(res, { message: 'Audio track deleted successfully' });
  })
);