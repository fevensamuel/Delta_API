import express, { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { db } from './db.js';
import { getExchangeRate, setAdminOverrideRate } from '../services/exchangeRateService.js';
import { upload, galleryUploadFields, bulkUpload, uploadPaths } from '../config/multer.js';
import type {
  AdminRole,
  GalleryItem,
  GalleryType,
  InquiryStatus,
  PackageCategory
} from '../types.js';

export const apiRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'delta_travel_super_secret_jwt_key_2026_256bit';

// ===== AUTH MIDDLEWARE =====
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

export const optionalAuthToken = (req: Request, res: Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (!err) (req as any).user = user;
      next();
    });
  } else {
    next();
  }
};

// ===== PACKAGE MULTER =====
const packageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const packagesPath = uploadPaths.packagesPath;
    if (!fs.existsSync(packagesPath)) fs.mkdirSync(packagesPath, { recursive: true });
    cb(null, packagesPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_');
    cb(null, uniqueSuffix + '-' + sanitizedName);
  }
});

const packageUploadMiddleware = multer({
  storage: packageStorage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed for package thumbnail'));
  }
}).single('packageImage');

// ============================================================
// EXCHANGE RATE
// ============================================================
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
    res.status(500).json({ status: 'error', success: false, error: 'Failed to fetch exchange rate', details: error.message });
  }
});

apiRouter.get('/admin/exchange-rate', authenticateToken, async (req: Request, res: Response) => {
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
    res.status(500).json({ status: 'error', success: false, error: 'Failed to fetch exchange rate', details: error.message });
  }
});

apiRouter.post('/admin/exchange-rate', authenticateToken, (req: Request, res: Response) => {
  const { rate } = req.body;
  if (!rate || isNaN(Number(rate)) || Number(rate) <= 0) {
    return res.status(400).json({ status: 'error', success: false, error: 'Valid rate number is required' });
  }
  const updatedData = setAdminOverrideRate(Number(rate));
  res.json({
    status: 'success',
    success: true,
    message: 'Exchange rate updated successfully',
    data: updatedData
  });
});

// ============================================================
// AUTH
// ============================================================
const handleLogin = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ status: 'error', success: false, error: 'Username and password are required' });
  }
  const user = db.adminUsers.find(
    u => u.username.toLowerCase() === username.toLowerCase() ||
         u.email.toLowerCase() === username.toLowerCase()
  );
  if (!user) {
    return res.status(401).json({ status: 'error', success: false, error: 'Invalid credentials or inactive account' });
  }
  if (!user.isActive) {
    return res.status(401).json({ status: 'error', success: false, error: 'Account is inactive. Contact administrator.' });
  }
  const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ status: 'error', success: false, error: 'Invalid credentials or inactive account' });
  }
  user.lastLogin = new Date().toISOString();
  const tokenPayload = { id: user.id, username: user.username, email: user.email, role: user.role };
  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });
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
      isActive: user.isActive,
      status: user.status || 'Active'
    }
  });
};

apiRouter.post('/login', handleLogin);
apiRouter.post('/admin/login', handleLogin);
apiRouter.post('/auth/login', handleLogin);
apiRouter.post('/admin/auth/login', handleLogin);

const handleGetMe = async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  const user = db.adminUsers.find(u => u.id === reqUser.id);
  if (!user) {
    return res.status(404).json({ status: 'error', success: false, error: 'User not found' });
  }
  const userData = {
    id: String(user.id),
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    status: user.status || 'Active'
  };
  res.json({
    status: 'success',
    success: true,
    data: userData,
    user: userData
  });
};

apiRouter.get('/admin/me', authenticateToken, handleGetMe);
apiRouter.get('/admin/auth/me', authenticateToken, handleGetMe);

// ============================================================
// PACKAGES (with SAR)
// ============================================================
apiRouter.get('/packages', optionalAuthToken, async (req: Request, res: Response) => {
  try {
    const rateData = await getExchangeRate();
    const rate = rateData.rate;
    const isAdmin = Boolean((req as any).user);
    const showAll = req.query.all === 'true' && isAdmin;
    const packagesList = showAll ? db.packages : db.packages.filter(p => p.isActive);
    const data = packagesList.map(pkg => ({
      id: String(pkg.id),
      titleEn: pkg.titleEn,
      titleAr: pkg.titleAr,
      titleAm: pkg.titleAm || '',
      category: pkg.category,
      priceUsd: pkg.priceUsd,
      priceEtb: Math.round(pkg.priceUsd * rate),
      priceSar: Math.round(pkg.priceUsd * 3.75),
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

apiRouter.get('/admin/packages', authenticateToken, (req: Request, res: Response) => {
  const data = db.packages.map(pkg => ({
    id: String(pkg.id),
    titleEn: pkg.titleEn,
    titleAr: pkg.titleAr,
    titleAm: pkg.titleAm || '',
    category: pkg.category,
    priceUsd: pkg.priceUsd,
    priceEtb: Math.round(pkg.priceUsd * 159.98),
    priceSar: Math.round(pkg.priceUsd * 3.75),
    durationDays: pkg.durationDays,
    departureCity: pkg.departureCity || 'Addis Ababa',
    inclusions: pkg.inclusions || [],
    availableDates: pkg.availableDates || [],
    itinerary: pkg.itinerary || [],
    imageUrl: pkg.imageUrl,
    isActive: pkg.isActive,
    status: pkg.isActive ? 'Active' : 'Archived',
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
});

apiRouter.get('/admin/packages/:id', authenticateToken, (req: Request, res: Response) => {
  const pkg = db.packages.find(p => String(p.id) === String(req.params.id));
  if (!pkg) {
    return res.status(404).json({ status: 'error', success: false, error: 'Package not found' });
  }
  const data = {
    id: String(pkg.id),
    titleEn: pkg.titleEn,
    titleAr: pkg.titleAr,
    titleAm: pkg.titleAm || '',
    category: pkg.category,
    priceUsd: pkg.priceUsd,
    priceEtb: Math.round(pkg.priceUsd * 159.98),
    priceSar: Math.round(pkg.priceUsd * 3.75),
    durationDays: pkg.durationDays,
    departureCity: pkg.departureCity || 'Addis Ababa',
    inclusions: pkg.inclusions || [],
    availableDates: pkg.availableDates || [],
    itinerary: pkg.itinerary || [],
    imageUrl: pkg.imageUrl,
    isActive: pkg.isActive,
    status: pkg.isActive ? 'Active' : 'Archived',
    whatsappClicks: pkg.whatsappClicks || 0,
    createdAt: pkg.createdAt,
    updatedAt: pkg.updatedAt
  };
  res.json({ status: 'success', success: true, data });
});

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
    priceSar: Math.round(pkg.priceUsd * 3.75),
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
  res.json({ status: 'success', success: true, data });
});

const handlePackageClickWhatsapp = (req: Request, res: Response) => {
  const pkg = db.packages.find(p => String(p.id) === String(req.params.id));
  if (!pkg) {
    return res.status(404).json({ status: 'error', success: false, error: 'Package not found' });
  }
  pkg.whatsappClicks = (pkg.whatsappClicks || 0) + 1;
  pkg.updatedAt = new Date().toISOString();
  res.json({
    status: 'success',
    success: true,
    data: { id: String(pkg.id), whatsappClicks: pkg.whatsappClicks }
  });
};

apiRouter.post('/packages/:id/click-whatsapp', handlePackageClickWhatsapp);
apiRouter.post('/packages/:id/track-click', handlePackageClickWhatsapp);

apiRouter.get('/admin/packages/stats', authenticateToken, (req: Request, res: Response) => {
  const stats = db.packages.map(p => ({
    id: String(p.id),
    titleEn: p.titleEn,
    category: p.category,
    whatsappClicks: p.whatsappClicks || 0
  }));
  res.json({ status: 'success', success: true, data: stats });
});

// ===== CREATE PACKAGE =====
apiRouter.post('/admin/packages', authenticateToken, (req: Request, res: Response) => {
  packageUploadMiddleware(req, res, async (err: any) => {
    if (err) {
      console.error('❌ Multer error:', err);
      return res.status(400).json({ status: 'error', success: false, error: err.message || 'File upload failed' });
    }
    try {
      const {
        titleEn, titleAr, titleAm, category, priceUsd, durationDays,
        departureCity, inclusions, availableDates, itinerary, isActive
      } = req.body;

      const parsedInclusions = typeof inclusions === 'string' ? JSON.parse(inclusions) : inclusions;
      const parsedAvailableDates = typeof availableDates === 'string' ? JSON.parse(availableDates) : availableDates;
      const parsedItinerary = typeof itinerary === 'string' ? JSON.parse(itinerary) : itinerary;

      const file = (req as any).file;
      let imageUrl = '';
      if (file) {
        imageUrl = `/uploads/packages/${file.filename}`;
        console.log(`📦 Package image uploaded: ${file.filename} -> ${imageUrl}`);
      } else if (req.body.imageUrl) {
        imageUrl = req.body.imageUrl;
      }

      if (!titleEn || !titleEn.trim()) return res.status(400).json({ status: 'error', success: false, error: 'English Title is required.' });
      if (!category) return res.status(400).json({ status: 'error', success: false, error: 'Category is required.' });
      if (!priceUsd || Number(priceUsd) <= 0) return res.status(400).json({ status: 'error', success: false, error: 'Valid price is required.' });
      if (!durationDays || Number(durationDays) <= 0) return res.status(400).json({ status: 'error', success: false, error: 'Duration must be at least 1 day.' });
      if (!imageUrl) return res.status(400).json({ status: 'error', success: false, error: 'Image is required.' });

      const validCategories: PackageCategory[] = ['Economy', 'Standard', 'Premium', 'VIP'];
      if (!validCategories.includes(category as PackageCategory)) {
        return res.status(400).json({ status: 'error', success: false, error: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
      }

      const now = new Date().toISOString();
      const newPkg = {
        id: `pkg-${Date.now()}`,
        titleEn: titleEn.trim(),
        titleAr: (titleAr || '').trim(),
        titleAm: (titleAm || '').trim(),
        category: category as PackageCategory,
        priceUsd: Number(priceUsd),
        durationDays: Number(durationDays),
        departureCity: departureCity || 'Addis Ababa',
        inclusions: Array.isArray(parsedInclusions) ? parsedInclusions : [],
        availableDates: Array.isArray(parsedAvailableDates) ? parsedAvailableDates : [],
        itinerary: Array.isArray(parsedItinerary) ? parsedItinerary : [],
        imageUrl: imageUrl.trim(),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        whatsappClicks: 0,
        createdAt: now,
        updatedAt: now
      };

      db.packages.unshift(newPkg);
      db.saveToFile();
      res.status(201).json({ status: 'success', success: true, message: 'Package created successfully', data: newPkg });
    } catch (err: any) {
      console.error('Error creating package:', err);
      res.status(500).json({ status: 'error', success: false, error: 'Something went wrong while creating the package.' });
    }
  });
});

// ===== UPDATE PACKAGE =====
apiRouter.put('/admin/packages/:id', authenticateToken, (req: Request, res: Response) => {
  packageUploadMiddleware(req, res, async (err: any) => {
    if (err) {
      console.error('❌ Multer error on update:', err);
      return res.status(400).json({ status: 'error', success: false, error: err.message || 'File upload failed' });
    }
    try {
      const index = db.packages.findIndex(p => String(p.id) === String(req.params.id));
      if (index === -1) {
        return res.status(404).json({ status: 'error', success: false, error: 'Package not found' });
      }

      const existing = db.packages[index];
      const {
        titleEn, titleAr, titleAm, category, priceUsd, durationDays,
        departureCity, inclusions, availableDates, itinerary, isActive
      } = req.body;

      const file = (req as any).file;
      let imageUrl = existing.imageUrl;
      if (file) {
        imageUrl = `/uploads/packages/${file.filename}`;
        console.log(`📦 Package image updated: ${file.filename} -> ${imageUrl}`);
      } else if (req.body.imageUrl) {
        imageUrl = req.body.imageUrl;
      }

      if (category && !['Economy', 'Standard', 'Premium', 'VIP'].includes(category)) {
        return res.status(400).json({ status: 'error', success: false, error: 'Invalid category. Must be Economy, Standard, Premium, or VIP.' });
      }

      const updatedPkg = {
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
        imageUrl: imageUrl,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        updatedAt: new Date().toISOString()
      };

      db.packages[index] = updatedPkg;
      db.saveToFile();
      res.json({ status: 'success', success: true, message: 'Package updated successfully', data: updatedPkg });
    } catch (err: any) {
      console.error('Error updating package:', err);
      res.status(500).json({ status: 'error', success: false, error: 'Something went wrong while updating the package.' });
    }
  });
});

apiRouter.delete('/admin/packages/:id', authenticateToken, (req: Request, res: Response) => {
  const index = db.packages.findIndex(p => String(p.id) === String(req.params.id));
  if (index === -1) {
    return res.status(404).json({ status: 'error', success: false, error: 'Package not found' });
  }
  db.packages.splice(index, 1);
  db.saveToFile();
  res.json({ status: 'success', success: true, message: 'Package deleted successfully' });
});

// ============================================================
// GALLERY (with video thumbnail generation)
// ============================================================
apiRouter.get('/gallery', optionalAuthToken, (req: Request, res: Response) => {
  const isAdmin = Boolean((req as any).user);
  const showAll = req.query.all === 'true' && isAdmin;
  const typeFilter = req.query.type ? String(req.query.type).toLowerCase() : null;
  let items = showAll ? db.gallery : db.gallery.filter(g => g.isActive);
  if (typeFilter === 'photo' || typeFilter === 'video') {
    items = items.filter(g => g.type === typeFilter);
  }
  const sorted = [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  res.json({ status: 'success', success: true, count: sorted.length, data: sorted });
});

apiRouter.get('/gallery/:id', optionalAuthToken, (req: Request, res: Response) => {
  const isAdmin = Boolean((req as any).user);
  const item = db.gallery.find(g => String(g.id) === String(req.params.id));
  if (!item || (!item.isActive && !isAdmin)) {
    return res.status(404).json({ status: 'error', success: false, error: 'Gallery item not found' });
  }
  res.json({ status: 'success', success: true, data: item });
});

// ===== CREATE GALLERY ITEM =====
apiRouter.post('/admin/gallery', authenticateToken, galleryUploadFields, async (req: Request, res: Response) => {
  try {
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
    let thumbnailUrl = '';

    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (files.image && files.image[0]) {
        const file = files.image[0];
        imageUrl = `/uploads/images/${file.filename}`;
        console.log(`🖼️ Image uploaded: ${file.filename} -> ${imageUrl}`);
      }
      if (files.video && files.video[0]) {
        const file = files.video[0];
        videoUrl = `/uploads/videos/${file.filename}`;
        console.log(`🎬 Video uploaded: ${file.filename} -> ${videoUrl}`);

        // Generate thumbnail from video
        const videoPath = path.join(uploadPaths.videosPath, file.filename);
        const thumbnailFilename = `thumb-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
        const thumbnailPath = path.join(uploadPaths.imagesPath, thumbnailFilename);
        try {
          await new Promise((resolve, reject) => {
            ffmpeg(videoPath)
              .screenshots({
                timestamps: [1],
                filename: thumbnailFilename,
                folder: uploadPaths.imagesPath,
                size: '320x180'
              })
              .on('end', resolve)
              .on('error', reject);
          });
          thumbnailUrl = `/uploads/images/${thumbnailFilename}`;
          imageUrl = thumbnailUrl;
          console.log(`🎬 Thumbnail generated: ${thumbnailFilename}`);
        } catch (ffmpegErr) {
          console.error('❌ Failed to generate video thumbnail:', ffmpegErr);
        }
      }
    }

    if (!titleEn) {
      return res.status(400).json({ status: 'error', success: false, error: 'Title (English) is required.' });
    }
    if (type === 'photo' && !imageUrl) {
      return res.status(400).json({ status: 'error', success: false, error: 'Image file is required for photo type.' });
    }
    if (type === 'video' && !videoUrl) {
      return res.status(400).json({ status: 'error', success: false, error: 'Video file or URL is required for video type.' });
    }

    const now = new Date().toISOString();
    const newItem: GalleryItem = {
      id: `gal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      titleEn,
      titleAr,
      imageUrl: imageUrl || '',
      thumbnailUrl: thumbnailUrl || imageUrl || '',
      videoUrl: videoUrl || '',
      duration,
      location,
      description,
      isActive,
      sortOrder,
      uploadDate: now.substring(0, 10),
      createdAt: now,
      updatedAt: now
    };

    db.gallery.unshift(newItem);
    db.saveToFile();
    res.status(201).json({ status: 'success', success: true, message: 'Gallery item created successfully', data: newItem });
  } catch (err: any) {
    console.error('Error creating gallery item:', err);
    res.status(500).json({ status: 'error', success: false, error: 'Failed to create gallery item.' });
  }
});

// ===== BULK GALLERY UPLOAD =====
apiRouter.post('/admin/gallery/bulk', authenticateToken, bulkUpload, async (req: Request, res: Response) => {
  try {
    console.log('📤 Bulk upload request received');
    const files = (req.files as Express.Multer.File[]) || [];
    console.log(`📁 Files received: ${files.length}`);

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

    const createdItems: GalleryItem[] = [];

    for (let i = 0; i < rawItems.length; i++) {
      const rawItem = rawItems[i];
      let imageUrl = rawItem.imageUrl || rawItem.image_url || '';
      let videoUrl = rawItem.videoUrl || rawItem.video_url || '';
      let thumbnailUrl = '';

      if (files[i]) {
        const file = files[i];
        if (file.mimetype.startsWith('video/')) {
          videoUrl = `/uploads/videos/${file.filename}`;
          imageUrl = '';
          console.log(`🎬 Video file ${i+1}: ${file.originalname} -> ${videoUrl}`);

          // Generate thumbnail
          const videoPath = path.join(uploadPaths.videosPath, file.filename);
          const thumbnailFilename = `thumb-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
          try {
            await new Promise((resolve, reject) => {
              ffmpeg(videoPath)
                .screenshots({
                  timestamps: [1],
                  filename: thumbnailFilename,
                  folder: uploadPaths.imagesPath,
                  size: '320x180'
                })
                .on('end', resolve)
                .on('error', reject);
            });
            thumbnailUrl = `/uploads/images/${thumbnailFilename}`;
            imageUrl = thumbnailUrl;
            console.log(`🎬 Thumbnail generated for bulk item ${i+1}: ${thumbnailFilename}`);
          } catch (ffmpegErr) {
            console.error('❌ Failed to generate thumbnail for bulk video:', ffmpegErr);
          }
        } else {
          imageUrl = `/uploads/images/${file.filename}`;
          console.log(`🖼️ Image file ${i+1}: ${file.originalname} -> ${imageUrl}`);
        }
      }

      const isVideo = rawItem.type === 'video' || (files[i] && files[i].mimetype.startsWith('video/'));
      if (!isVideo && !imageUrl) {
        console.warn(`⚠️ Skipping item ${i} because no image file or URL provided.`);
        continue;
      }
      if (isVideo && !videoUrl) {
        console.warn(`⚠️ Skipping item ${i} because no video file or URL provided.`);
        continue;
      }

      const now = new Date().toISOString();
      const newItem: GalleryItem = {
        id: `gal-bulk-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        type: isVideo ? 'video' : 'photo',
        titleEn: rawItem.titleEn || rawItem.title_en || rawItem.title || 'Untitled',
        titleAr: rawItem.titleAr || rawItem.title_ar || '',
        imageUrl: imageUrl || '',
        thumbnailUrl: thumbnailUrl || imageUrl || '',
        videoUrl: videoUrl || '',
        duration: rawItem.duration || '',
        location: rawItem.location || 'Makkah Al-Mukarramah',
        description: rawItem.description || '',
        isActive: rawItem.isActive !== undefined ? Boolean(rawItem.isActive) : true,
        sortOrder: rawItem.sortOrder !== undefined ? Number(rawItem.sortOrder) : i,
        uploadDate: now.substring(0, 10),
        createdAt: now,
        updatedAt: now
      };

      db.gallery.unshift(newItem);
      createdItems.push(newItem);
    }

    db.saveToFile();
    console.log(`✅ Bulk upload successful: ${createdItems.length} items created`);
    res.status(201).json({
      status: 'success',
      success: true,
      message: `${createdItems.length} gallery items uploaded successfully`,
      count: createdItems.length,
      data: createdItems
    });
  } catch (err: any) {
    console.error('❌ Bulk upload error:', err);
    res.status(500).json({
      status: 'error',
      success: false,
      error: 'Failed to process bulk upload.'
    });
  }
});

// ===== UPDATE GALLERY ITEM =====
apiRouter.put('/admin/gallery/:id', authenticateToken, galleryUploadFields, async (req: Request, res: Response) => {
  try {
    const index = db.gallery.findIndex(g => String(g.id) === String(req.params.id));
    if (index === -1) {
      return res.status(404).json({ status: 'error', success: false, error: 'Gallery item not found' });
    }

    const existing = db.gallery[index];
    const body = req.body || {};

    let imageUrl = body.imageUrl || body.image_url || existing.imageUrl;
    let videoUrl = body.videoUrl || body.video_url || existing.videoUrl;
    let thumbnailUrl = body.thumbnailUrl || existing.thumbnailUrl || imageUrl;

    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (files.image && files.image[0]) {
        const file = files.image[0];
        imageUrl = `/uploads/images/${file.filename}`;
        console.log(`🖼️ Image updated: ${file.filename} -> ${imageUrl}`);
        thumbnailUrl = imageUrl;
      }
      if (files.video && files.video[0]) {
        const file = files.video[0];
        videoUrl = `/uploads/videos/${file.filename}`;
        console.log(`🎬 Video updated: ${file.filename} -> ${videoUrl}`);
        // Regenerate thumbnail
        const videoPath = path.join(uploadPaths.videosPath, file.filename);
        const thumbnailFilename = `thumb-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
        try {
          await new Promise((resolve, reject) => {
            ffmpeg(videoPath)
              .screenshots({
                timestamps: [1],
                filename: thumbnailFilename,
                folder: uploadPaths.imagesPath,
                size: '320x180'
              })
              .on('end', resolve)
              .on('error', reject);
          });
          thumbnailUrl = `/uploads/images/${thumbnailFilename}`;
          imageUrl = thumbnailUrl;
          console.log(`🎬 Thumbnail regenerated: ${thumbnailFilename}`);
        } catch (ffmpegErr) {
          console.error('❌ Failed to regenerate thumbnail:', ffmpegErr);
        }
      }
    }

    const updatedItem: GalleryItem = {
      ...existing,
      type: body.type !== undefined ? (body.type === 'video' ? 'video' : 'photo') : existing.type,
      titleEn: body.titleEn || body.title_en || existing.titleEn,
      titleAr: body.titleAr !== undefined ? body.titleAr : (body.title_ar !== undefined ? body.title_ar : existing.titleAr),
      imageUrl: imageUrl || '',
      thumbnailUrl: thumbnailUrl || imageUrl || '',
      videoUrl: videoUrl || '',
      duration: body.duration !== undefined ? body.duration : existing.duration,
      location: body.location !== undefined ? body.location : existing.location,
      description: body.description !== undefined ? body.description : existing.description,
      isActive: body.isActive !== undefined ? (String(body.isActive) === 'true' || body.isActive === true) : existing.isActive,
      sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : (body.sort_order !== undefined ? Number(body.sort_order) : existing.sortOrder),
      updatedAt: new Date().toISOString()
    };

    db.gallery[index] = updatedItem;
    db.saveToFile();
    res.json({ status: 'success', success: true, message: 'Gallery item updated successfully', data: updatedItem });
  } catch (err: any) {
    console.error('Update gallery error:', err);
    res.status(500).json({ status: 'error', success: false, error: 'Failed to update gallery item.' });
  }
});

// ===== DELETE GALLERY ITEM =====
apiRouter.delete('/admin/gallery/:id', authenticateToken, (req: Request, res: Response) => {
  const index = db.gallery.findIndex(g => String(g.id) === String(req.params.id));
  if (index === -1) {
    return res.status(404).json({ status: 'error', success: false, error: 'Gallery item not found' });
  }
  db.gallery.splice(index, 1);
  db.saveToFile();
  res.json({ status: 'success', success: true, message: 'Gallery item deleted successfully' });
});

// ============================================================
// SUBSCRIBERS
// ============================================================
apiRouter.get('/admin/subscribers', authenticateToken, (req: Request, res: Response) => {
  res.json({
    status: 'success',
    success: true,
    count: db.subscribers.length,
    data: db.subscribers
  });
});

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
    db.saveToFile();

    return res.json({
      status: 'success',
      success: true,
      message: 'Subscription updated successfully',
      subscriberId: existing.id,
      data: existing
    });
  }

  const now = new Date().toISOString();
  const newSub = {
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
  db.saveToFile();

  res.status(201).json({
    status: 'success',
    success: true,
    message: 'Subscribed successfully',
    subscriberId: newSub.id,
    data: newSub
  });
};

apiRouter.post('/subscribers', handleSubscribe);
apiRouter.post('/subscribe', handleSubscribe);

const handleBulkSubscriberImport = (req: Request, res: Response) => {
  const { subscribers, items } = req.body;
  const listToImport = Array.isArray(subscribers) ? subscribers : Array.isArray(items) ? items : [];

  if (listToImport.length === 0) {
    return res.status(400).json({
      status: 'error',
      success: false,
      error: 'Request body must contain "subscribers" or "items" array'
    });
  }

  const imported: any[] = [];

  for (const item of listToImport) {
    if (!item.phone) continue;

    const existing = db.subscribers.find(s => s.phone === item.phone);

    if (existing) {
      existing.optInStatus = item.optInStatus !== undefined ? Boolean(item.optInStatus) : true;
      if (item.email) existing.email = item.email;
      if (item.name) existing.name = item.name;
      existing.updatedAt = new Date().toISOString();
      imported.push(existing);
    } else {
      const newSub = {
        id: `sub-bulk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        phone: item.phone,
        email: item.email || '',
        name: item.name || '',
        channel: item.channel || 'Bulk Import',
        packageInterestId: item.packageInterestId || null,
        optInStatus: item.optInStatus !== undefined ? Boolean(item.optInStatus) : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.subscribers.unshift(newSub);
      imported.push(newSub);
    }
  }

  db.saveToFile();

  res.status(201).json({
    status: 'success',
    success: true,
    message: `${imported.length} subscribers imported successfully`,
    count: imported.length,
    data: imported
  });
};

apiRouter.post('/admin/subscribers/bulk', authenticateToken, handleBulkSubscriberImport);
apiRouter.post('/admin/subscribers/bulk-import', authenticateToken, handleBulkSubscriberImport);

const handleBulkSubscriberDelete = (req: Request, res: Response) => {
  const { ids, subscriberIds, phoneNumbers } = req.body;
  const targetIds = Array.isArray(ids) ? ids : Array.isArray(subscriberIds) ? subscriberIds : [];
  const targetPhones = Array.isArray(phoneNumbers) ? phoneNumbers : [];

  if (targetIds.length === 0 && targetPhones.length === 0) {
    return res.status(400).json({
      status: 'error',
      success: false,
      error: 'Provide an array of "ids" or "phoneNumbers" to delete'
    });
  }

  const initialCount = db.subscribers.length;

  if (targetIds.length > 0) {
    db.subscribers = db.subscribers.filter(s => !targetIds.includes(s.id));
  }
  if (targetPhones.length > 0) {
    db.subscribers = db.subscribers.filter(s => !targetPhones.includes(s.phone));
  }

  const deletedCount = initialCount - db.subscribers.length;
  db.saveToFile();

  res.json({
    status: 'success',
    success: true,
    message: `${deletedCount} subscribers deleted successfully`,
    deletedCount
  });
};

apiRouter.delete('/admin/subscribers/bulk-delete', authenticateToken, handleBulkSubscriberDelete);
apiRouter.post('/admin/subscribers/bulk-delete', authenticateToken, handleBulkSubscriberDelete);

// ============================================================
// INQUIRIES
// ============================================================
apiRouter.get('/admin/inquiries', authenticateToken, (req: Request, res: Response) => {
  res.json({
    status: 'success',
    success: true,
    count: db.inquiries.length,
    data: db.inquiries
  });
});

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
  const newInquiry = {
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
  db.saveToFile();

  res.status(201).json({
    status: 'success',
    success: true,
    message: 'Inquiry submitted successfully',
    data: newInquiry
  });
});

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
  db.saveToFile();

  res.json({
    status: 'success',
    success: true,
    message: 'Inquiry status updated',
    data: inquiry
  });
};

apiRouter.put('/admin/inquiries/:id/status', authenticateToken, handleUpdateInquiryStatus);
apiRouter.put('/admin/inquiries/:id', authenticateToken, handleUpdateInquiryStatus);

// ============================================================
// SMS CAMPAIGNS
// ============================================================
apiRouter.post('/admin/sms/campaign', authenticateToken, (req: Request, res: Response) => {
  const { message, recipientFilter, channelFilter, packageInterestId, sendToAll } = req.body;

  if (!message) {
    return res.status(400).json({ status: 'error', success: false, error: 'Message content is required' });
  }

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
  const campaignId = `camp_${Date.now()}`;

  recipients.forEach((rec, idx) => {
    db.smsLogs.unshift({
      id: `sms-${Date.now()}-${idx}`,
      phone: rec.phone,
      message,
      status: 'Delivered',
      campaignName: campaignId,
      sentAt: new Date().toISOString()
    });
  });

  db.saveToFile();

  res.json({
    status: 'success',
    success: true,
    message: 'SMS campaign sent successfully',
    data: {
      recipientsCount,
      recipients: recipientsCount,
      sentCount: recipientsCount,
      failedCount: 0,
      campaignId,
      sentAt: new Date().toISOString(),
      status: 'Delivered'
    }
  });
});

const handleGetSmsLogs = (req: Request, res: Response) => {
  res.json({
    status: 'success',
    success: true,
    count: db.smsLogs.length,
    data: db.smsLogs
  });
};

apiRouter.get('/admin/sms/logs', authenticateToken, handleGetSmsLogs);
apiRouter.get('/admin/sms/campaigns', authenticateToken, handleGetSmsLogs);

// ============================================================
// DASHBOARD STATS
// ============================================================
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

export default apiRouter;