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
import { authenticateJWT, AuthenticatedRequest } from './middleware.js';

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

  return send(res, {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      status: user.status,
    },
  });
}

apiRouter.post(['/login', '/admin/login', '/auth/login', '/admin/auth/login'], login);

apiRouter.get(
  ['/admin/me', '/admin/auth/me'],
  authenticateJWT,
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const user = req.user && (await db.findAdminUserById(req.user.id));
    if (!user) return fail(res, 'User not found', 404);
    return send(res, {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      status: user.status,
    });
  })
);

// Admin users management
apiRouter.get(
  '/admin/users',
  authenticateJWT,
  asyncRoute(async (_req, res) => send(res, await db.getAllAdminUsers()))
);

apiRouter.post(
  '/admin/users',
  authenticateJWT,
  asyncRoute(async (req, res) => {
    if (!req.body.username || !req.body.email || !req.body.password) {
      return fail(res, 'Username, email and password are required', 400);
    }
    const passwordHash = await bcrypt.hash(req.body.password, 10);
    return send(res, await db.createAdminUser({ ...req.body, passwordHash }), 201);
  })
);

apiRouter.put(
  '/admin/users/:id',
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const data = { ...req.body };
    if (data.password) {
      data.passwordHash = await bcrypt.hash(data.password, 10);
      delete data.password;
    }
    const item = await db.updateAdminUser(req.params.id, data);
    if (!item) return fail(res, 'Admin user not found', 404);
    return send(res, item);
  })
);

apiRouter.delete(
  '/admin/users/:id',
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await db.deleteAdminUser(req.params.id);
    if (!item) return fail(res, 'Admin user not found', 404);
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
  asyncRoute(async (_req, res) => send(res, await getExchangeRate()))
);

apiRouter.post('/admin/exchange-rate', authenticateJWT, (req, res) => {
  const rate = Number(req.body.rate);
  if (!rate || rate <= 0) return fail(res, 'Valid rate number is required', 400);
  return send(res, setAdminOverrideRate(rate));
});

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
  asyncRoute(async (_req, res) => send(res, await db.getAllSocialLinks()))
);

apiRouter.post(
  '/admin/social-links',
  authenticateJWT,
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
  asyncRoute(async (req, res) => {
    const item = await db.updateSocialLink(req.params.id, req.body);
    if (!item) return fail(res, 'Social Media link not found', 404);
    return send(res, item);
  })
);

apiRouter.delete(
  '/admin/social-links/:id',
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await db.deleteSocialLink(req.params.id);
    if (!item) return fail(res, 'Social Media link not found', 404);
    return send(res, { message: 'Social Media link deleted successfully' });
  })
);

// ============================================================
// CONTACT SETTINGS
// ============================================================

// Public — get active contact settings (returns camelCase for frontend)
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

// Admin — get full settings
apiRouter.get(
  '/admin/contact-settings',
  authenticateJWT,
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

// Admin — update settings
apiRouter.put(
  '/admin/contact-settings',
  authenticateJWT,
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
  asyncRoute(async (_req, res) => {
    const data = await db.getAllFaqs();
    return res.json({ status: 'success', success: true, count: data.length, data });
  })
);

apiRouter.post(
  '/admin/faqs',
  authenticateJWT,
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
  asyncRoute(async (req, res) => {
    const item = await db.updateFaq(req.params.id, req.body);
    if (!item) return fail(res, 'FAQ not found', 404);
    return send(res, item);
  })
);

apiRouter.delete(
  '/admin/faqs/:id',
  authenticateJWT,
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
  asyncRoute(async (_req, res) => {
    const data = await db.getAllPackages();
    return res.json({ status: 'success', success: true, count: data.length, data });
  })
);

apiRouter.get(
  '/admin/packages/:id',
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await db.findPackageById(req.params.id);
    if (!item) return fail(res, 'Package not found', 404);
    return send(res, item);
  })
);

apiRouter.post(
  '/admin/packages',
  authenticateJWT,
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
  galleryUploadFields,
  asyncRoute(async (req, res) =>
    send(res, await db.createGalleryItem(galleryInput(req.body, req.files)), 201)
  )
);

apiRouter.post(
  '/admin/gallery/bulk',
  authenticateJWT,
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
  asyncRoute(async (req, res) => {
    const item = await db.updateGalleryItem(req.params.id, req.body);
    if (!item) return fail(res, 'Gallery item not found', 404);
    return send(res, item);
  })
);

apiRouter.delete(
  '/admin/gallery/:id',
  authenticateJWT,
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
  asyncRoute(async (req, res) => {
    const item = await db.updateInquiryStatus(req.params.id, req.body.status);
    if (!item) return fail(res, 'Inquiry not found', 404);
    return send(res, item);
  })
);

apiRouter.delete(
  '/admin/inquiries/bulk-delete',
  authenticateJWT,
  asyncRoute(async (req, res) =>
    send(res, { deleted: await db.deleteManyInquiries(req.body.ids || []) })
  )
);

apiRouter.delete(
  '/admin/inquiries/:id',
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await db.deleteInquiry(req.params.id);
    if (!item) return fail(res, 'Inquiry not found', 404);
    return send(res, { message: 'Inquiry deleted successfully' });
  })
);

// ============================================================
// PRICE LOGS
// ============================================================
apiRouter.get(
  '/admin/price-logs',
  authenticateJWT,
  asyncRoute(async (_req, res) => send(res, await db.getAllPriceLogs()))
);

apiRouter.post(
  '/admin/price-logs',
  authenticateJWT,
  asyncRoute(async (req, res) => send(res, await db.createPriceLog(req.body), 201))
);

// ============================================================
// SMS
// ============================================================
apiRouter.post(
  '/admin/sms/campaign',
  authenticateJWT,
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
apiRouter.get('/admin/sms/logs', authenticateJWT, smsLogs);
apiRouter.get('/admin/sms/campaigns', authenticateJWT, smsLogs);

// ============================================================
// DASHBOARD
// ============================================================
apiRouter.get(
  '/admin/dashboard/stats',
  authenticateJWT,
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
  asyncRoute(async (_req, res) => send(res, await db.getAllTeamMembers()))
);

apiRouter.post(
  '/admin/team-members',
  authenticateJWT,
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

    // Remove undefined so updateEntity skips them
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
  asyncRoute(async (_req, res) => send(res, await db.getAllOfficeImages()))
);

apiRouter.post(
  '/admin/office-images',
  authenticateJWT,
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
  asyncRoute(async (_req, res) => send(res, await db.getAllTestimonials()))
);

apiRouter.post(
  '/admin/testimonials',
  authenticateJWT,
  asyncRoute(async (req, res) => send(res, await db.createTestimonial(req.body), 201))
);

apiRouter.put(
  '/admin/testimonials/:id',
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await db.updateTestimonial(req.params.id, req.body);
    if (!item) return fail(res, 'Testimonial not found', 404);
    return send(res, item);
  })
);

apiRouter.delete(
  '/admin/testimonials/:id',
  authenticateJWT,
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
  asyncRoute(async (req, res) => send(res, await db.createSubscriber(req.body), 201))
);

// ⚠️ BULK DELETE must be BEFORE the :id route
apiRouter.delete(
  '/admin/subscribers/bulk-delete',
  authenticateJWT,
  asyncRoute(async (req, res) =>
    send(res, {
      deleted: await db.deleteSubscribers(req.body.ids || [], req.body.phones || []),
    })
  )
);

apiRouter.delete(
  '/admin/subscribers/:id',
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await db.deleteSubscriber(req.params.id);
    if (!item) return fail(res, 'Subscriber not found', 404);
    return send(res, { message: 'Subscriber deleted successfully' });
  })
);

apiRouter.put(
  '/admin/subscribers/:id',
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await db.updateSubscriber(req.params.id, req.body);
    if (!item) return fail(res, 'Subscriber not found', 404);
    return send(res, item);
  })
);

apiRouter.post(
  '/admin/subscribers/bulk',
  authenticateJWT,
  asyncRoute(async (req, res) =>
    send(res, await db.bulkImportSubscribers(req.body.subscribers || req.body), 201)
  )
);

// ============================================================
// AUDIO TRACKS (Nasheed / Quran Player)
// ============================================================

// Public — get all active tracks (ordered)
apiRouter.get(
  '/audio',
  asyncRoute(async (_req, res) => {
    const data = await db.getActiveAudioTracks();
    return res.json({ status: 'success', success: true, count: data.length, data });
  })
);

// Admin — get all tracks (including inactive)
apiRouter.get(
  '/admin/audio',
  authenticateJWT,
  asyncRoute(async (_req, res) => {
    const data = await db.getAllAudioTracks();
    return res.json({ status: 'success', success: true, count: data.length, data });
  })
);

// Admin — get single track
apiRouter.get(
  '/admin/audio/:id',
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await db.findAudioTrackById(req.params.id);
    if (!item) return fail(res, 'Audio track not found', 404);
    return send(res, item);
  })
);

// Admin — upload audio file → returns the URL
apiRouter.post(
  '/admin/audio/upload',
  authenticateJWT,
  audioFileUpload,
  asyncRoute(async (req, res) => {
    const file = (req as any).file;
    if (!file) return fail(res, 'No audio file uploaded', 400);
    return send(res, { audioUrl: `/uploads/audio/${file.filename}` }, 201);
  })
);

// Admin — create track
apiRouter.post(
  '/admin/audio',
  authenticateJWT,
  audioFileUpload,
  asyncRoute(async (req, res) => {
    const file = (req as any).file;

    if (!req.body.titleEn) {
      return fail(res, 'English title is required', 400);
    }

    const audioUrl = file
      ? `/uploads/audio/${file.filename}`
      : req.body.audioUrl;

    if (!audioUrl) {
      return fail(res, 'Audio file or audioUrl is required', 400);
    }

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

// Admin — update track
apiRouter.put(
  '/admin/audio/:id',
  authenticateJWT,
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

// Admin — toggle active status
apiRouter.patch(
  '/admin/audio/:id/status',
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await db.updateAudioTrack(req.params.id, {
      isActive: bool(req.body.isActive, true),
    });
    if (!item) return fail(res, 'Audio track not found', 404);
    return send(res, item);
  })
);

// Admin — reorder tracks (body: { ids: string[] } in desired order)
apiRouter.patch(
  '/admin/audio/reorder',
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const ids: string[] = req.body.ids || [];
    if (!Array.isArray(ids) || ids.length === 0) {
      return fail(res, 'An array of track ids is required', 400);
    }
    await db.reorderAudioTracks(ids);
    return send(res, { reordered: ids.length });
  })
);

// Admin — delete track
apiRouter.delete(
  '/admin/audio/:id',
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await db.deleteAudioTrack(req.params.id);
    if (!item) return fail(res, 'Audio track not found', 404);
    return send(res, { message: 'Audio track deleted successfully' });
  })
);

// ============================================================
// FLIGHT INQUIRIES (Flight Quote Requests)
// ============================================================

// Public — save a new flight inquiry from the website form
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

// Admin — list all flight inquiries
apiRouter.get(
  '/admin/flight-inquiries',
  authenticateJWT,
  asyncRoute(async (_req, res) => {
    const data = await db.getAllFlightInquiries();
    return res.json({ status: 'success', success: true, count: data.length, data });
  })
);

// Admin — get single
apiRouter.get(
  '/admin/flight-inquiries/:id',
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await db.findFlightInquiryById(req.params.id);
    if (!item) return fail(res, 'Flight inquiry not found', 404);
    return send(res, item);
  })
);

// Admin — create manually
apiRouter.post(
  '/admin/flight-inquiries',
  authenticateJWT,
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

// Admin — update
apiRouter.put(
  '/admin/flight-inquiries/:id',
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await db.updateFlightInquiry(req.params.id, req.body);
    if (!item) return fail(res, 'Flight inquiry not found', 404);
    return send(res, item);
  })
);

// Admin — delete
apiRouter.delete(
  '/admin/flight-inquiries/:id',
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await db.deleteFlightInquiry(req.params.id);
    if (!item) return fail(res, 'Flight inquiry not found', 404);
    return send(res, { message: 'Flight inquiry deleted successfully' });
  })
);