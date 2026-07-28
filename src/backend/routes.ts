import express, { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { getExchangeRate, setAdminOverrideRate } from '../services/exchangeRateService.js';
import { upload } from '../config/multer.js';
import type {
  AdminRole,
  AdminUser,
  GalleryItem,
  GalleryType,
  Inquiry,
  InquiryStatus,
  PackageCategory,
  Subscriber,
  TravelPackage
} from '../types.js';

export const apiRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'delta_travel_super_secret_jwt_key_2026_256bit';

// Authentication Middleware
export const authenticateToken = (req: Request, res: Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ status: 'error', success: false, error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ status: 'error', success: false, error: 'Invalid or expired token' });
    }
    (req as any).user = user;
    next();
  });
};

// Optional Authentication Middleware
export const optionalAuthToken = (req: Request, res: Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (!err) {
        (req as any).user = user;
      }
      next();
    });
  } else {
    next();
  }
};

/* ==========================================================================
   1. REAL-TIME EXCHANGE RATE API
   ========================================================================== */

/**
 * GET /api/exchange-rate
 * Returns real-time USD to ETB exchange rate
 */
apiRouter.get('/exchange-rate', async (req: Request, res: Response) => {
  try {
    const rateData = await getExchangeRate();
    res.json({
      status: 'success',
      success: true,
      data: {
        rate: rateData.rate,
        updatedAt: rateData.updatedAt,
        source: rateData.source,
        isFallback: rateData.isFallback
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      success: false,
      error: 'Failed to fetch exchange rate',
      details: error.message
    });
  }
});

/**
 * POST /api/admin/exchange-rate
 * Admin override for exchange rate
 */
apiRouter.post('/admin/exchange-rate', authenticateToken, (req: Request, res: Response) => {
  const { rate } = req.body;
  if (!rate || isNaN(Number(rate)) || Number(rate) <= 0) {
    return res.status(400).json({
      status: 'error',
      success: false,
      error: 'Valid rate number is required'
    });
  }

  const updatedData = setAdminOverrideRate(Number(rate));

  res.json({
    status: 'success',
    success: true,
    message: 'Exchange rate updated successfully',
    data: updatedData
  });
});

/* ==========================================================================
   2. AUTHENTICATION ENDPOINTS
   ========================================================================== */

/**
 * POST /api/admin/login or POST /api/login
 * Standardized Login Response
 */
const handleLogin = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      status: 'error',
      success: false,
      error: 'Username and password are required'
    });
  }

  const user = db.adminUsers.find(
    u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()
  );

  if (!user || !user.isActive) {
    return res.status(401).json({
      status: 'error',
      success: false,
      error: 'Invalid credentials or inactive account'
    });
  }

  const isPasswordValid = user.passwordHash
    ? bcrypt.compareSync(password, user.passwordHash)
    : password === 'admin123';

  if (!isPasswordValid) {
    return res.status(401).json({
      status: 'error',
      success: false,
      error: 'Invalid username or password'
    });
  }

  // Update last login
  user.lastLogin = new Date().toISOString();

  const tokenPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: (process.env.JWT_EXPIRY || '24h') as any });

  return res.json({
    status: 'success',
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: String(user.id),
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive !== undefined ? user.isActive : true,
      status: user.status || 'Active'
    }
  });
};

apiRouter.post('/login', handleLogin);
apiRouter.post('/admin/login', handleLogin);
apiRouter.post('/auth/login', handleLogin);

/**
 * GET /api/admin/me
 */
apiRouter.get('/admin/me', authenticateToken, (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  const user = db.adminUsers.find(u => String(u.id) === String(reqUser.id));

  if (!user) {
    return res.status(404).json({ status: 'error', success: false, error: 'User not found' });
  }

  const userData = {
    id: String(user.id),
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive !== undefined ? user.isActive : true,
    status: user.status || 'Active'
  };

  res.json({
    status: 'success',
    success: true,
    data: userData,
    user: userData
  });
});

/* ==========================================================================
   3. PACKAGES ENDPOINTS (USD Stored, ETB Calculated Real-time)
   ========================================================================== */

/**
 * GET /api/packages
 * List active packages (with real-time ETB prices)
 */
apiRouter.get('/packages', optionalAuthToken, async (req: Request, res: Response) => {
  try {
    const rateData = await getExchangeRate();
    const rate = rateData.rate;

    const isAdmin = Boolean((req as any).user);
    const showAll = req.query.all === 'true' && isAdmin;

    const packagesList = showAll
      ? db.packages
      : db.packages.filter(p => p.isActive);

    const data = packagesList.map(pkg => ({
      id: String(pkg.id),
      titleEn: pkg.titleEn,
      titleAr: pkg.titleAr,
      titleAm: pkg.titleAm || '',
      category: pkg.category,
      priceUsd: pkg.priceUsd,
      priceEtb: Math.round(pkg.priceUsd * rate),
      durationDays: pkg.durationDays,
      departureCity: pkg.departureCity || 'Addis Ababa',
      inclusions: pkg.inclusions || [],
      availableDates: pkg.availableDates || [],
      itinerary: pkg.itinerary || [],
      imageUrl: pkg.imageUrl,
      isActive: pkg.isActive,
      whatsappClicks: pkg.whatsappClicks || 0,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt
    }));

    res.json({
      status: 'success',
      success: true,
      count: data.length,
      data
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', success: false, error: err.message });
  }
});

/**
 * GET /api/packages/:id
 * Get package details with real-time ETB price
 */
apiRouter.get('/packages/:id', async (req: Request, res: Response) => {
  const pkg = db.packages.find(p => String(p.id) === String(req.params.id));

  if (!pkg) {
    return res.status(404).json({ status: 'error', success: false, error: 'Package not found' });
  }

  const rateData = await getExchangeRate();
  const rate = rateData.rate;

  const data = {
    id: String(pkg.id),
    titleEn: pkg.titleEn,
    titleAr: pkg.titleAr,
    titleAm: pkg.titleAm || '',
    category: pkg.category,
    priceUsd: pkg.priceUsd,
    priceEtb: Math.round(pkg.priceUsd * rate),
    durationDays: pkg.durationDays,
    departureCity: pkg.departureCity || 'Addis Ababa',
    inclusions: pkg.inclusions || [],
    availableDates: pkg.availableDates || [],
    itinerary: pkg.itinerary || [],
    imageUrl: pkg.imageUrl,
    isActive: pkg.isActive,
    whatsappClicks: pkg.whatsappClicks || 0,
    createdAt: pkg.createdAt,
    updatedAt: pkg.updatedAt
  };

  res.json({
    status: 'success',
    success: true,
    data
  });
});

/**
 * POST /api/packages/:id/click-whatsapp
 * Increment WhatsApp click counter for package
 */
apiRouter.post('/packages/:id/click-whatsapp', (req: Request, res: Response) => {
  const pkg = db.packages.find(p => String(p.id) === String(req.params.id));

  if (!pkg) {
    return res.status(404).json({ status: 'error', success: false, error: 'Package not found' });
  }

  pkg.whatsappClicks = (pkg.whatsappClicks || 0) + 1;
  pkg.updatedAt = new Date().toISOString();

  res.json({
    status: 'success',
    success: true,
    data: {
      id: String(pkg.id),
      whatsappClicks: pkg.whatsappClicks
    }
  });
});

/**
 * GET /api/admin/packages/stats
 */
apiRouter.get('/admin/packages/stats', authenticateToken, (req: Request, res: Response) => {
  const stats = db.packages.map(p => ({
    id: String(p.id),
    titleEn: p.titleEn,
    category: p.category,
    whatsappClicks: p.whatsappClicks || 0
  }));

  res.json({
    status: 'success',
    success: true,
    data: stats
  });
});

/**
 * POST /api/admin/packages
 * Create new package (USD price stored in database)
 */
apiRouter.post('/admin/packages', authenticateToken, (req: Request, res: Response) => {
  const {
    titleEn,
    titleAr,
    titleAm,
    category,
    priceUsd,
    durationDays,
    departureCity,
    inclusions,
    availableDates,
    itinerary,
    imageUrl,
    isActive
  } = req.body;

  if (!titleEn || !titleAr || !category || priceUsd === undefined || !durationDays || !imageUrl) {
    return res.status(400).json({
      status: 'error',
      success: false,
      error: 'Missing required fields (titleEn, titleAr, category, priceUsd, durationDays, imageUrl)'
    });
  }

  // Ensure category does NOT allow Hajj
  const validCategories: PackageCategory[] = ['Economy', 'Standard', 'Premium', 'VIP'];
  if (!validCategories.includes(category as PackageCategory)) {
    return res.status(400).json({
      status: 'error',
      success: false,
      error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
    });
  }

  const now = new Date().toISOString();
  const newPkg: TravelPackage = {
    id: `pkg-${Date.now()}`,
    titleEn,
    titleAr,
    titleAm: titleAm || '',
    category: category as PackageCategory,
    priceUsd: Number(priceUsd),
    durationDays: Number(durationDays),
    departureCity: departureCity || 'Addis Ababa',
    inclusions: Array.isArray(inclusions) ? inclusions : [],
    availableDates: Array.isArray(availableDates) ? availableDates : [],
    itinerary: Array.isArray(itinerary) ? itinerary : [],
    imageUrl,
    isActive: isActive !== undefined ? Boolean(isActive) : true,
    whatsappClicks: 0,
    createdAt: now,
    updatedAt: now
  };

  db.packages.unshift(newPkg);

  res.status(201).json({
    status: 'success',
    success: true,
    message: 'Package created successfully',
    data: newPkg
  });
});

/**
 * PUT /api/admin/packages/:id
 * Update package
 */
apiRouter.put('/admin/packages/:id', authenticateToken, (req: Request, res: Response) => {
  const index = db.packages.findIndex(p => String(p.id) === String(req.params.id));

  if (index === -1) {
    return res.status(404).json({ status: 'error', success: false, error: 'Package not found' });
  }

  const existing = db.packages[index];
  const {
    titleEn,
    titleAr,
    titleAm,
    category,
    priceUsd,
    durationDays,
    departureCity,
    inclusions,
    availableDates,
    itinerary,
    imageUrl,
    isActive
  } = req.body;

  if (category && !['Economy', 'Standard', 'Premium', 'VIP'].includes(category)) {
    return res.status(400).json({
      status: 'error',
      success: false,
      error: 'Invalid category. Category Hajj is no longer supported.'
    });
  }

  const updatedPkg: TravelPackage = {
    ...existing,
    titleEn: titleEn !== undefined ? titleEn : existing.titleEn,
    titleAr: titleAr !== undefined ? titleAr : existing.titleAr,
    titleAm: titleAm !== undefined ? titleAm : existing.titleAm,
    category: category ? (category as PackageCategory) : existing.category,
    priceUsd: priceUsd !== undefined ? Number(priceUsd) : existing.priceUsd,
    durationDays: durationDays !== undefined ? Number(durationDays) : existing.durationDays,
    departureCity: departureCity !== undefined ? departureCity : existing.departureCity,
    inclusions: inclusions !== undefined ? inclusions : existing.inclusions,
    availableDates: availableDates !== undefined ? availableDates : existing.availableDates,
    itinerary: itinerary !== undefined ? itinerary : existing.itinerary,
    imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
    isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
    updatedAt: new Date().toISOString()
  };

  db.packages[index] = updatedPkg;

  res.json({
    status: 'success',
    success: true,
    message: 'Package updated successfully',
    data: updatedPkg
  });
});

/**
 * DELETE /api/admin/packages/:id
 */
apiRouter.delete('/admin/packages/:id', authenticateToken, (req: Request, res: Response) => {
  const index = db.packages.findIndex(p => String(p.id) === String(req.params.id));

  if (index === -1) {
    return res.status(404).json({ status: 'error', success: false, error: 'Package not found' });
  }

  db.packages.splice(index, 1);

  res.json({
    status: 'success',
    success: true,
    message: 'Package deleted successfully'
  });
});

/* ==========================================================================
   4. GALLERY ENDPOINTS (File Upload Support + Multi-Format + Single GET)
   ========================================================================== */

/**
 * GET /api/gallery
 * Returns active gallery items (Public) or all gallery items (Admin)
 */
apiRouter.get('/gallery', optionalAuthToken, (req: Request, res: Response) => {
  const isAdmin = Boolean((req as any).user);
  const showAll = req.query.all === 'true' && isAdmin;
  const typeFilter = req.query.type ? String(req.query.type).toLowerCase() : null;

  let items = showAll
    ? db.gallery
    : db.gallery.filter(g => g.isActive);

  if (typeFilter === 'photo' || typeFilter === 'video') {
    items = items.filter(g => g.type === typeFilter);
  }

  // Sort by sortOrder ascending
  const sorted = [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  res.json({
    status: 'success',
    success: true,
    count: sorted.length,
    data: sorted
  });
});

/**
 * GET /api/gallery/:id
 * Get single gallery item
 */
apiRouter.get('/gallery/:id', optionalAuthToken, (req: Request, res: Response) => {
  const isAdmin = Boolean((req as any).user);
  const item = db.gallery.find(g => String(g.id) === String(req.params.id));

  if (!item || (!item.isActive && !isAdmin)) {
    return res.status(404).json({ status: 'error', success: false, error: 'Gallery item not found' });
  }

  res.json({
    status: 'success',
    success: true,
    data: item
  });
});

const galleryUploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]);

/**
 * POST /api/admin/gallery
 * Create gallery item with file upload or JSON payload
 */
apiRouter.post('/admin/gallery', authenticateToken, galleryUploadFields, (req: Request, res: Response) => {
  const body = req.body || {};
  const type = (body.type === 'video' ? 'video' : 'photo') as GalleryType;
  const titleEn = body.titleEn || body.title_en || body.title;
  const titleAr = body.titleAr || body.title_ar || '';
  const duration = body.duration || '';
  const location = body.location || 'Makkah Al-Mukarramah';
  const description = body.description || '';
  const isActive = body.isActive !== undefined ? (String(body.isActive) === 'true' || body.isActive === true) : true;
  const sortOrder = body.sortOrder !== undefined ? Number(body.sortOrder) : (body.sort_order !== undefined ? Number(body.sort_order) : 0);

  let imageUrl = body.imageUrl || body.image_url || '';
  let videoUrl = body.videoUrl || body.video_url || '';

  if (req.files) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files.image && files.image[0]) {
      imageUrl = `/uploads/thumbnails/${files.image[0].filename}`;
    } else if (files.thumbnail && files.thumbnail[0]) {
      imageUrl = `/uploads/thumbnails/${files.thumbnail[0].filename}`;
    }
    if (files.video && files.video[0]) {
      videoUrl = `/uploads/gallery/${files.video[0].filename}`;
    }
  }

  if (!titleEn) {
    return res.status(400).json({
      status: 'error',
      success: false,
      error: 'titleEn is required'
    });
  }

  if (type === 'video' && !videoUrl && !body.videoUrl) {
    return res.status(400).json({
      status: 'error',
      success: false,
      error: 'Video file or videoUrl is required for video type'
    });
  }

  if (!imageUrl) {
    return res.status(400).json({
      status: 'error',
      success: false,
      error: 'Image file, thumbnail, or imageUrl is required'
    });
  }

  const now = new Date().toISOString();
  const newItem: GalleryItem = {
    id: `gal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    titleEn,
    titleAr,
    imageUrl,
    videoUrl,
    duration,
    location,
    description,
    isActive,
    sortOrder,
    createdAt: now,
    updatedAt: now
  };

  db.gallery.unshift(newItem);

  res.status(201).json({
    status: 'success',
    success: true,
    message: 'Gallery item created successfully',
    data: newItem
  });
});

/**
 * POST /api/admin/gallery/bulk
 * Bulk upload gallery items (supports JSON or multipart form-data)
 */
apiRouter.post('/admin/gallery/bulk', authenticateToken, upload.any(), (req: Request, res: Response) => {
  let rawItems = req.body.items;

  if (typeof rawItems === 'string') {
    try {
      rawItems = JSON.parse(rawItems);
    } catch (e) {
      return res.status(400).json({ status: 'error', success: false, error: 'Invalid JSON in items field' });
    }
  }

  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return res.status(400).json({
      status: 'error',
      success: false,
      error: 'Request body must contain an "items" array with gallery item definitions'
    });
  }

  const files = (req.files as Express.Multer.File[]) || [];
  const now = new Date().toISOString();
  const createdItems: GalleryItem[] = [];

  for (let i = 0; i < rawItems.length; i++) {
    const rawItem = rawItems[i];
    let imageUrl = rawItem.imageUrl || rawItem.image_url || '';
    let videoUrl = rawItem.videoUrl || rawItem.video_url || '';

    // If matching uploaded file exists at index i
    if (files[i]) {
      if (files[i].mimetype.startsWith('video/')) {
        videoUrl = `/uploads/gallery/${files[i].filename}`;
      } else {
        imageUrl = `/uploads/thumbnails/${files[i].filename}`;
      }
    }

    if (!imageUrl) {
      imageUrl = 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=1200&q=80';
    }

    const newItem: GalleryItem = {
      id: `gal-bulk-${Date.now()}-${Math.floor(Math.random() * 10000)}-${i}`,
      type: rawItem.type === 'video' ? 'video' : 'photo',
      titleEn: rawItem.titleEn || rawItem.title_en || rawItem.title || 'Holy Moment',
      titleAr: rawItem.titleAr || rawItem.title_ar || '',
      imageUrl,
      videoUrl,
      duration: rawItem.duration || '',
      location: rawItem.location || 'Makkah Al-Mukarramah',
      description: rawItem.description || '',
      isActive: rawItem.isActive !== undefined ? (String(rawItem.isActive) === 'true' || rawItem.isActive === true) : true,
      sortOrder: rawItem.sortOrder !== undefined ? Number(rawItem.sortOrder) : i,
      createdAt: now,
      updatedAt: now
    };

    db.gallery.unshift(newItem);
    createdItems.push(newItem);
  }

  res.status(201).json({
    status: 'success',
    success: true,
    message: `${createdItems.length} gallery items uploaded successfully`,
    count: createdItems.length,
    data: createdItems
  });
});

/**
 * PUT /api/admin/gallery/:id
 * Update gallery item with file upload or JSON payload
 */
apiRouter.put('/admin/gallery/:id', authenticateToken, galleryUploadFields, (req: Request, res: Response) => {
  const index = db.gallery.findIndex(g => String(g.id) === String(req.params.id));

  if (index === -1) {
    return res.status(404).json({ status: 'error', success: false, error: 'Gallery item not found' });
  }

  const existing = db.gallery[index];
  const body = req.body || {};

  let imageUrl = body.imageUrl || body.image_url || existing.imageUrl;
  let videoUrl = body.videoUrl || body.video_url || existing.videoUrl;

  if (req.files) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files.image && files.image[0]) {
      imageUrl = `/uploads/thumbnails/${files.image[0].filename}`;
    } else if (files.thumbnail && files.thumbnail[0]) {
      imageUrl = `/uploads/thumbnails/${files.thumbnail[0].filename}`;
    }
    if (files.video && files.video[0]) {
      videoUrl = `/uploads/gallery/${files.video[0].filename}`;
    }
  }

  const updatedItem: GalleryItem = {
    ...existing,
    type: body.type !== undefined ? (body.type === 'video' ? 'video' : 'photo') : existing.type,
    titleEn: body.titleEn || body.title_en || existing.titleEn,
    titleAr: body.titleAr !== undefined ? body.titleAr : (body.title_ar !== undefined ? body.title_ar : existing.titleAr),
    imageUrl,
    videoUrl,
    duration: body.duration !== undefined ? body.duration : existing.duration,
    location: body.location !== undefined ? body.location : existing.location,
    description: body.description !== undefined ? body.description : existing.description,
    isActive: body.isActive !== undefined ? (String(body.isActive) === 'true' || body.isActive === true) : existing.isActive,
    sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : (body.sort_order !== undefined ? Number(body.sort_order) : existing.sortOrder),
    updatedAt: new Date().toISOString()
  };

  db.gallery[index] = updatedItem;

  res.json({
    status: 'success',
    success: true,
    message: 'Gallery item updated successfully',
    data: updatedItem
  });
});

/**
 * DELETE /api/admin/gallery/:id
 */
apiRouter.delete('/admin/gallery/:id', authenticateToken, (req: Request, res: Response) => {
  const index = db.gallery.findIndex(g => String(g.id) === String(req.params.id));

  if (index === -1) {
    return res.status(404).json({ status: 'error', success: false, error: 'Gallery item not found' });
  }

  db.gallery.splice(index, 1);

  res.json({
    status: 'success',
    success: true,
    message: 'Gallery item deleted successfully'
  });
});

/* ==========================================================================
   5. SUBSCRIBERS ENDPOINTS (Opt-In Status + Bulk Import)
   ========================================================================== */

/**
 * GET /api/admin/subscribers
 */
apiRouter.get('/admin/subscribers', authenticateToken, (req: Request, res: Response) => {
  res.json({
    status: 'success',
    success: true,
    count: db.subscribers.length,
    data: db.subscribers
  });
});

/**
 * POST /api/subscribers or POST /api/subscribe
 */
const handleSubscribe = (req: Request, res: Response) => {
  const { phone, email, name, channel, packageInterestId } = req.body;

  if (!phone) {
    return res.status(400).json({ status: 'error', success: false, error: 'Phone number is required' });
  }

  const existing = db.subscribers.find(s => s.phone === phone);

  if (existing) {
    existing.optInStatus = true;
    if (email) existing.email = email;
    if (name) existing.name = name;
    if (channel) existing.channel = channel;
    if (packageInterestId) existing.packageInterestId = packageInterestId;
    existing.updatedAt = new Date().toISOString();

    return res.json({
      status: 'success',
      success: true,
      message: 'Subscription updated successfully',
      data: existing
    });
  }

  const now = new Date().toISOString();
  const newSub: Subscriber = {
    id: `sub-${Date.now()}`,
    phone,
    email: email || '',
    name: name || '',
    channel: channel || 'Web Form',
    packageInterestId: packageInterestId || null,
    optInStatus: true,
    createdAt: now,
    updatedAt: now
  };

  db.subscribers.unshift(newSub);

  res.status(201).json({
    status: 'success',
    success: true,
    message: 'Subscribed successfully',
    data: newSub
  });
};

apiRouter.post('/subscribers', handleSubscribe);
apiRouter.post('/subscribe', handleSubscribe);

/**
 * POST /api/admin/subscribers/bulk
 * Bulk Import Subscribers
 */
apiRouter.post('/admin/subscribers/bulk', authenticateToken, (req: Request, res: Response) => {
  const { subscribers, items } = req.body;
  const listToImport = Array.isArray(subscribers) ? subscribers : Array.isArray(items) ? items : [];

  if (listToImport.length === 0) {
    return res.status(400).json({
      status: 'error',
      success: false,
      error: 'Request body must contain "subscribers" or "items" array'
    });
  }

  const now = new Date().toISOString();
  const imported: Subscriber[] = [];

  for (const item of listToImport) {
    if (!item.phone) continue;

    const existingIndex = db.subscribers.findIndex(s => s.phone === item.phone);
    if (existingIndex !== -1) {
      db.subscribers[existingIndex].optInStatus = item.optInStatus !== undefined ? Boolean(item.optInStatus) : true;
      if (item.email) db.subscribers[existingIndex].email = item.email;
      if (item.name) db.subscribers[existingIndex].name = item.name;
      db.subscribers[existingIndex].updatedAt = now;
      imported.push(db.subscribers[existingIndex]);
    } else {
      const newSub: Subscriber = {
        id: `sub-bulk-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        phone: item.phone,
        email: item.email || '',
        name: item.name || '',
        channel: item.channel || 'Bulk Import',
        packageInterestId: item.packageInterestId || null,
        optInStatus: item.optInStatus !== undefined ? Boolean(item.optInStatus) : true,
        createdAt: now,
        updatedAt: now
      };
      db.subscribers.unshift(newSub);
      imported.push(newSub);
    }
  }

  res.status(201).json({
    status: 'success',
    success: true,
    message: `${imported.length} subscribers imported successfully`,
    count: imported.length,
    data: imported
  });
});

/* ==========================================================================
   6. INQUIRIES ENDPOINTS (Status: New, Contacted, Resolved)
   ========================================================================== */

/**
 * GET /api/admin/inquiries
 */
apiRouter.get('/admin/inquiries', authenticateToken, (req: Request, res: Response) => {
  res.json({
    status: 'success',
    success: true,
    count: db.inquiries.length,
    data: db.inquiries
  });
});

/**
 * POST /api/inquiries
 */
apiRouter.post('/inquiries', (req: Request, res: Response) => {
  const { fullName, phone, email, subject, message, source } = req.body;

  if (!fullName || !phone || !message) {
    return res.status(400).json({
      status: 'error',
      success: false,
      error: 'Missing required fields (fullName, phone, message)'
    });
  }

  const now = new Date().toISOString();
  const newInquiry: Inquiry = {
    id: `inq-${Date.now()}`,
    fullName,
    phone,
    email: email || '',
    subject: subject || 'Umrah Tour Inquiry',
    message,
    source: source || 'Contact Form',
    status: 'New',
    createdAt: now,
    updatedAt: now
  };

  db.inquiries.unshift(newInquiry);

  res.status(201).json({
    status: 'success',
    success: true,
    message: 'Inquiry submitted successfully',
    data: newInquiry
  });
});

/**
 * PUT /api/admin/inquiries/:id/status
 */
const handleUpdateInquiryStatus = (req: Request, res: Response) => {
  const inquiry = db.inquiries.find(i => String(i.id) === String(req.params.id));

  if (!inquiry) {
    return res.status(404).json({ status: 'error', success: false, error: 'Inquiry not found' });
  }

  const { status } = req.body;
  const validStatuses: InquiryStatus[] = ['New', 'Contacted', 'Resolved'];

  if (!status || !validStatuses.includes(status as InquiryStatus)) {
    return res.status(400).json({
      status: 'error',
      success: false,
      error: `Status must be one of: ${validStatuses.join(', ')}`
    });
  }

  inquiry.status = status as InquiryStatus;
  inquiry.updatedAt = new Date().toISOString();

  res.json({
    status: 'success',
    success: true,
    message: 'Inquiry status updated',
    data: inquiry
  });
};

apiRouter.put('/admin/inquiries/:id/status', authenticateToken, handleUpdateInquiryStatus);
apiRouter.put('/admin/inquiries/:id', authenticateToken, handleUpdateInquiryStatus);

/* ==========================================================================
   7. SMS CAMPAIGN ENDPOINT (Filtering)
   ========================================================================== */

/**
 * POST /api/admin/sms/campaign
 * Recipient Selection Filters: message, channelFilter, packageInterestId, sendToAll
 */
apiRouter.post('/admin/sms/campaign', authenticateToken, (req: Request, res: Response) => {
  const { message, recipientFilter, channelFilter, packageInterestId, sendToAll } = req.body;

  if (!message) {
    return res.status(400).json({ status: 'error', success: false, error: 'Message content is required' });
  }

  // Filter subscribers who have optInStatus === true
  let recipients = db.subscribers.filter(s => s.optInStatus);

  if (recipientFilter && typeof recipientFilter === 'string') {
    if (recipientFilter.startsWith('channel:')) {
      const channel = recipientFilter.replace('channel:', '');
      recipients = recipients.filter(s => s.channel.toLowerCase() === channel.toLowerCase());
    } else if (recipientFilter.startsWith('package:')) {
      const pkgId = recipientFilter.replace('package:', '');
      recipients = recipients.filter(s => String(s.packageInterestId) === String(pkgId));
    }
  } else if (sendToAll === false) {
    if (channelFilter) {
      recipients = recipients.filter(s => s.channel === channelFilter);
    }
    if (packageInterestId) {
      recipients = recipients.filter(s => String(s.packageInterestId) === String(packageInterestId));
    }
  }

  const recipientsCount = recipients.length;
  const sentCount = recipientsCount;
  const failedCount = 0;
  const campaignId = `camp_${Date.now()}`;

  // Log SMS
  const now = new Date().toISOString();
  recipients.forEach((rec, idx) => {
    db.smsLogs.unshift({
      id: `sms-${Date.now()}-${idx}`,
      phone: rec.phone,
      message,
      status: 'Delivered',
      campaignName: campaignId,
      sentAt: now
    });
  });

  res.json({
    status: 'success',
    success: true,
    message: 'SMS campaign sent successfully',
    data: {
      recipientsCount,
      recipients: recipientsCount,
      sentCount,
      failedCount,
      campaignId,
      sentAt: now,
      status: 'Delivered'
    }
  });
});

/**
 * GET /api/admin/sms/logs
 */
apiRouter.get('/admin/sms/logs', authenticateToken, (req: Request, res: Response) => {
  res.json({
    status: 'success',
    success: true,
    count: db.smsLogs.length,
    data: db.smsLogs
  });
});

/* ==========================================================================
   8. ADMIN USERS MANAGEMENT
   ========================================================================== */

apiRouter.get('/admin/users', authenticateToken, (req: Request, res: Response) => {
  const users = db.adminUsers.map(u => ({
    id: String(u.id),
    username: u.username,
    email: u.email,
    role: u.role,
    lastLogin: u.lastLogin,
    isActive: u.isActive,
    status: u.status || 'Active',
    createdAt: u.createdAt
  }));

  res.json({ status: 'success', success: true, count: users.length, data: users });
});

apiRouter.post('/admin/users', authenticateToken, (req: Request, res: Response) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({ status: 'error', success: false, error: 'Missing required fields' });
  }

  const existing = db.adminUsers.find(u => u.username === username || u.email === email);
  if (existing) {
    return res.status(400).json({ status: 'error', success: false, error: 'User already exists' });
  }

  const now = new Date().toISOString();
  const newUser: AdminUser = {
    id: `usr-${Date.now()}`,
    username,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: role as AdminRole,
    lastLogin: null,
    isActive: true,
    status: 'Active',
    createdAt: now,
    updatedAt: now
  };

  db.adminUsers.push(newUser);

  res.status(201).json({
    status: 'success',
    success: true,
    message: 'Admin user created successfully',
    data: {
      id: String(newUser.id),
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      status: 'Active'
    }
  });
});

/* ==========================================================================
   9. DASHBOARD STATS ENDPOINT
   ========================================================================== */

/**
 * GET /api/admin/dashboard/stats
 * Overview analytics for Admin Dashboard
 */
apiRouter.get('/admin/dashboard/stats', authenticateToken, (req: Request, res: Response) => {
  const totalPackages = db.packages.length;
  const activePackages = db.packages.filter(p => p.isActive).length;
  const totalGalleryItems = db.gallery.length;
  const totalInquiries = db.inquiries.length;
  const totalSubscribers = db.subscribers.length;
  const totalWhatsappClicks = db.packages.reduce((acc, p) => acc + (p.whatsappClicks || 0), 0);
  const smsSentThisMonth = db.smsLogs.length;

  const categories: PackageCategory[] = ['Economy', 'Standard', 'Premium', 'VIP'];
  const clicksByCategory = categories.map(cat => ({
    category: cat,
    clicks: db.packages
      .filter(p => p.category === cat)
      .reduce((acc, p) => acc + (p.whatsappClicks || 0), 0)
  }));

  const recentInquiries = db.inquiries.slice(0, 5).map(inq => ({
    id: String(inq.id),
    fullName: inq.fullName,
    phone: inq.phone,
    email: inq.email,
    subject: inq.subject,
    status: inq.status,
    createdAt: inq.createdAt
  }));

  const recentGalleryUploads = db.gallery.slice(0, 5).map(gal => ({
    id: String(gal.id),
    titleEn: gal.titleEn,
    imageUrl: gal.imageUrl,
    type: gal.type,
    createdAt: gal.createdAt
  }));

  res.json({
    status: 'success',
    success: true,
    data: {
      totalPackages,
      activePackages,
      totalGalleryItems,
      totalInquiries,
      totalSubscribers,
      totalWhatsappClicks,
      smsSentThisMonth,
      clicksByCategory,
      recentInquiries,
      recentGalleryUploads
    }
  });
});
