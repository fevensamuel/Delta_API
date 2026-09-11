import express, { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { db } from './db.js';
import { getExchangeRate, setAdminOverrideRate } from '../services/exchangeRateService.js';
import { upload, galleryUploadFields, bulkUpload, uploadPaths, teamUpload, officeUpload } from '../config/multer.js';
import { authenticateJWT, AuthenticatedRequest } from './middleware.js';
import type {
  AdminRole,
  GalleryItem,
  GalleryType,
  InquiryStatus,
  PackageCategory,
  SocialLink,
  PriceLog,
  FAQItem,
  TeamMember,
  OfficeImage,
  Testimonial
} from '../types.js';

export const apiRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'delta_travel_super_secret_jwt_key_2026_256bit';

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

apiRouter.get('/admin/exchange-rate', authenticateJWT, async (req: Request, res: Response) => {
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

apiRouter.post('/admin/exchange-rate', authenticateJWT, (req: Request, res: Response) => {
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
    return res.status(400).json({ 
      status: 'error', 
      success: false, 
      error: 'Username and password are required' 
    });
  }
  
  // Find user by username or email
  const user = db.adminUsers.find(
    u => u.username.toLowerCase() === username.toLowerCase() ||
         u.email.toLowerCase() === username.toLowerCase()
  );
  
  if (!user) {
    return res.status(401).json({ 
      status: 'error', 
      success: false, 
      error: 'Invalid credentials' 
    });
  }
  
  if (!user.isActive) {
    return res.status(401).json({ 
      status: 'error', 
      success: false, 
      error: 'Account is inactive. Contact administrator.' 
    });
  }
  
  const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ 
      status: 'error', 
      success: false, 
      error: 'Invalid credentials' 
    });
  }
  
  // Update last login
  user.lastLogin = new Date().toISOString();
  db.saveToFile();
  
  // Create token
  const tokenPayload = { 
    id: user.id, 
    username: user.username, 
    email: user.email, 
    role: user.role 
  };
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

const handleGetMe = async (req: AuthenticatedRequest, res: Response) => {
  const reqUser = req.user;
  if (!reqUser) {
    return res.status(401).json({ status: 'error', success: false, error: 'Unauthorized' });
  }
  
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

apiRouter.get('/admin/me', authenticateJWT, handleGetMe);
apiRouter.get('/admin/auth/me', authenticateJWT, handleGetMe);

// ============================================================
// SOCIAL MEDIA LINKS
// ============================================================
apiRouter.get('/admin/social-links', authenticateJWT, (req: Request, res: Response) => {
  res.json({
    status: 'success',
    success: true,
    data: db.socialLinks
  });
});

apiRouter.post('/admin/social-links', authenticateJWT, (req: Request, res: Response) => {
  const { platform, url, isActive, icon } = req.body;

  if (!platform || !url) {
    return res.status(400).json({
      status: 'error',
      success: false,
      error: 'Platform and URL are required'
    });
  }

  // Check if platform already exists
  const existing = db.socialLinks.find(s => s.platform.toLowerCase() === platform.toLowerCase());
  if (existing) {
    return res.status(400).json({
      status: 'error',
      success: false,
      error: `Platform "${platform}" already exists`
    });
  }

  const newLink: SocialLink = {
    id: `sl-${Date.now()}`,
    platform: platform.toLowerCase(),
    url: url.trim(),
    isActive: isActive !== undefined ? isActive : true,
    icon: icon || platform.charAt(0).toUpperCase() + platform.slice(1)
  };

  db.addSocialLink(newLink);
  res.status(201).json({
    status: 'success',
    success: true,
    message: 'Social Media link added successfully',
    data: newLink
  });
});

apiRouter.put('/admin/social-links/:id', authenticateJWT, (req: Request, res: Response) => {
  const index = db.socialLinks.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ status: 'error', success: false, error: 'Social Media link not found' });
  }

  const { url, isActive } = req.body;
  const existing = db.socialLinks[index];
  const updated: SocialLink = {
    ...existing,
    url: url !== undefined ? url : existing.url,
    isActive: isActive !== undefined ? isActive : existing.isActive
  };

  db.updateSocialLink(index, updated);
  res.json({
    status: 'success',
    success: true,
    message: 'Social Media link updated successfully',
    data: updated
  });
});

apiRouter.delete('/admin/social-links/:id', authenticateJWT, (req: Request, res: Response) => {
  const index = db.socialLinks.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ status: 'error', success: false, error: 'Social Media link not found' });
  }

  db.deleteSocialLink(index);
  res.json({
    status: 'success',
    success: true,
    message: 'Social Media link deleted successfully'
  });
});

apiRouter.get('/social-links', (req: Request, res: Response) => {
  res.json({
    status: 'success',
    success: true,
    data: db.socialLinks.filter(s => s.isActive !== false)
  });
});

// ============================================================
// STANDALONE FAQS
// ============================================================

// Public endpoint - Get all FAQs
apiRouter.get('/faqs', (req: Request, res: Response) => {
  res.json({
    status: 'success',
    success: true,
    count: db.faqs.length,
    data: db.faqs
  });
});

// Admin endpoints
apiRouter.get('/admin/faqs', authenticateJWT, (req: Request, res: Response) => {
  res.json({
    status: 'success',
    success: true,
    count: db.faqs.length,
    data: db.faqs
  });
});

apiRouter.post('/admin/faqs', authenticateJWT, (req: Request, res: Response) => {
  const { question, answer } = req.body;

  if (!question || !answer) {
    return res.status(400).json({
      status: 'error',
      success: false,
      error: 'Question and answer are required'
    });
  }

  // Check if question already exists
  const existing = db.faqs.find(f => f.question.toLowerCase() === question.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({
      status: 'error',
      success: false,
      error: 'A FAQ with this question already exists'
    });
  }

  const newFaq: FAQItem = {
    id: `faq-${Date.now()}`,
    question: question.trim(),
    answer: answer.trim()
  };

  db.addFaq(newFaq);
  res.status(201).json({
    status: 'success',
    success: true,
    message: 'FAQ added successfully',
    data: newFaq
  });
});

apiRouter.put('/admin/faqs/:id', authenticateJWT, (req: Request, res: Response) => {
  const index = db.faqs.findIndex(f => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ status: 'error', success: false, error: 'FAQ not found' });
  }

  const { question, answer } = req.body;
  const existing = db.faqs[index];
  
  // Check if question already exists (excluding current)
  const duplicate = db.faqs.find(f => 
    f.question.toLowerCase() === question?.trim().toLowerCase() && 
    f.id !== req.params.id
  );
  if (duplicate) {
    return res.status(400).json({
      status: 'error',
      success: false,
      error: 'A FAQ with this question already exists'
    });
  }

  const updated: FAQItem = {
    id: existing.id,
    question: question !== undefined ? question.trim() : existing.question,
    answer: answer !== undefined ? answer.trim() : existing.answer
  };

  db.updateFaq(index, updated);
  res.json({
    status: 'success',
    success: true,
    message: 'FAQ updated successfully',
    data: updated
  });
});

apiRouter.delete('/admin/faqs/:id', authenticateJWT, (req: Request, res: Response) => {
  const index = db.faqs.findIndex(f => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ status: 'error', success: false, error: 'FAQ not found' });
  }

  db.deleteFaq(index);
  res.json({
    status: 'success',
    success: true,
    message: 'FAQ deleted successfully'
  });
});

// ============================================================
// PRICE LOGS
// ============================================================
apiRouter.get('/admin/price-logs', authenticateJWT, (req: Request, res: Response) => {
  const sortedLogs = [...db.priceLogs].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  
  // Get package titles for context
  const logsWithDetails = sortedLogs.map(log => {
    const pkg = db.packages.find(p => p.id === log.packageId);
    return {
      ...log,
      packageTitle: pkg ? pkg.titleEn : 'Unknown Package',
      packageCategory: pkg ? pkg.category : 'Unknown',
      packageIsActive: pkg ? pkg.isActive : false
    };
  });
  
  res.json({
    status: 'success',
    success: true,
    count: logsWithDetails.length,
    data: logsWithDetails
  });
});

apiRouter.post('/admin/price-logs', authenticateJWT, (req: Request, res: Response) => {
  const { packageId, priceUsd, priceEtb, priceSar, previousPriceUsd, previousPriceEtb, previousPriceSar, reason, updatedBy } = req.body;

  if (!packageId) {
    return res.status(400).json({ status: 'error', success: false, error: 'Package ID is required' });
  }

  const log: PriceLog = {
    id: `pl-${Date.now()}`,
    packageId,
    priceUsd,
    priceEtb,
    priceSar,
    previousPriceUsd,
    previousPriceEtb,
    previousPriceSar,
    reason: reason || 'Manual price update',
    updatedBy: updatedBy || 'Admin',
    updatedAt: new Date().toISOString()
  };

  db.addPriceLog(log);
  res.status(201).json({
    status: 'success',
    success: true,
    message: 'Price log created successfully',
    data: log
  });
});

// ============================================================
// PACKAGES
// ============================================================

// PUBLIC - Get all active packages (ONLY isActive: true)
apiRouter.get('/packages', async (req: Request, res: Response) => {
  try {
    const rateData = await getExchangeRate();
    const rate = rateData.rate;
    const packagesList = db.packages.filter(p => p.isActive === true);
    
    const data = packagesList.map(pkg => ({
      id: String(pkg.id),
      titleEn: pkg.titleEn,
      titleAr: pkg.titleAr,
      titleAm: pkg.titleAm || '',
      category: pkg.category,
      priceUsd: pkg.priceUsd,
      priceEtb: pkg.priceEtb || Math.round(pkg.priceUsd * rate),
      priceSar: pkg.priceSar || Math.round(pkg.priceUsd * 3.75),
      priceType: pkg.priceType || 'single',
      priceUsdMin: pkg.priceUsdMin || null,
      priceUsdMax: pkg.priceUsdMax || null,
      priceEtbMin: pkg.priceEtbMin || null,
      priceEtbMax: pkg.priceEtbMax || null,
      priceSarMin: pkg.priceSarMin || null,
      priceSarMax: pkg.priceSarMax || null,
      discounts: pkg.discounts || [], // <-- This includes discountType
      persons: pkg.persons || [],
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
    console.error('❌ Error fetching packages:', err);
    res.status(500).json({ status: 'error', success: false, error: err.message });
  }
});

// PUBLIC - Get single package
apiRouter.get('/packages/:id', async (req: Request, res: Response) => {
  try {
    const pkg = db.packages.find(p => String(p.id) === String(req.params.id));
    if (!pkg || pkg.isActive === false) {
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
      priceEtb: pkg.priceEtb || Math.round(pkg.priceUsd * rate),
      priceSar: pkg.priceSar || Math.round(pkg.priceUsd * 3.75),
      priceType: pkg.priceType || 'single',
      priceUsdMin: pkg.priceUsdMin || null,
      priceUsdMax: pkg.priceUsdMax || null,
      priceEtbMin: pkg.priceEtbMin || null,
      priceEtbMax: pkg.priceEtbMax || null,
      priceSarMin: pkg.priceSarMin || null,
      priceSarMax: pkg.priceSarMax || null,
      discounts: pkg.discounts || [],
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
  } catch (err: any) {
    console.error('❌ Error fetching package:', err);
    res.status(500).json({ status: 'error', success: false, error: err.message });
  }
});

// PUBLIC - Track WhatsApp click
apiRouter.post('/packages/:id/click-whatsapp', async (req: Request, res: Response) => {
  try {
    const index = db.packages.findIndex(p => String(p.id) === String(req.params.id));
    if (index === -1) {
      return res.status(404).json({ status: 'error', success: false, error: 'Package not found' });
    }
    
    const pkg = db.packages[index];
    const updatedPkg = {
      ...pkg,
      whatsappClicks: (pkg.whatsappClicks || 0) + 1,
      updatedAt: new Date().toISOString()
    };
    
    db.updatePackage(index, updatedPkg);
    
    res.json({
      status: 'success',
      success: true,
      message: 'WhatsApp click tracked',
      data: { whatsappClicks: updatedPkg.whatsappClicks }
    });
  } catch (err: any) {
    console.error('❌ Error tracking WhatsApp click:', err);
    res.status(500).json({ status: 'error', success: false, error: err.message });
  }
});

// ============================================================
// ADMIN PACKAGES
// ============================================================

// ADMIN - Get all packages
apiRouter.get('/admin/packages', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const rateData = await getExchangeRate();
    const rate = rateData.rate;
    const packagesList = db.packages;
    
    const data = packagesList.map(pkg => ({
      id: String(pkg.id),
      titleEn: pkg.titleEn,
      titleAr: pkg.titleAr,
      titleAm: pkg.titleAm || '',
      category: pkg.category,
      priceUsd: pkg.priceUsd,
      priceEtb: pkg.priceEtb || Math.round(pkg.priceUsd * rate),
      priceSar: pkg.priceSar || Math.round(pkg.priceUsd * 3.75),
      priceType: pkg.priceType || 'single',
      priceUsdMin: pkg.priceUsdMin || null,
      priceUsdMax: pkg.priceUsdMax || null,
      priceEtbMin: pkg.priceEtbMin || null,
      priceEtbMax: pkg.priceEtbMax || null,
      priceSarMin: pkg.priceSarMin || null,
      priceSarMax: pkg.priceSarMax || null,
      discounts: pkg.discounts || [],
      persons: pkg.persons || [],  // ✅ IMPORTANT: Include persons
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
    console.error('❌ Error fetching admin packages:', err);
    res.status(500).json({ status: 'error', success: false, error: err.message });
  }
});

// ADMIN - Get single package by ID
apiRouter.get('/admin/packages/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
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
      priceEtb: pkg.priceEtb || Math.round(pkg.priceUsd * rate),
      priceSar: pkg.priceSar || Math.round(pkg.priceUsd * 3.75),
      priceType: pkg.priceType || 'single',
      priceUsdMin: pkg.priceUsdMin || null,
      priceUsdMax: pkg.priceUsdMax || null,
      priceEtbMin: pkg.priceEtbMin || null,
      priceEtbMax: pkg.priceEtbMax || null,
      priceSarMin: pkg.priceSarMin || null,
      priceSarMax: pkg.priceSarMax || null,
      discounts: pkg.discounts || [],
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
  } catch (err: any) {
    console.error('❌ Error fetching package:', err);
    res.status(500).json({ status: 'error', success: false, error: err.message });
  }
});

// ADMIN - CREATE PACKAGE (FIXED)
apiRouter.post('/admin/packages', authenticateJWT, (req: Request, res: Response) => {
  packageUploadMiddleware(req, res, async (err: any) => {
    if (err) {
      console.error('❌ Multer error:', err);
      return res.status(400).json({ status: 'error', success: false, error: err.message || 'File upload failed' });
    }
    try {
      const {
        titleEn, titleAr, titleAm, category,
        priceUsd, priceEtb, priceSar,
        priceType,
        priceUsdMin, priceUsdMax, priceEtbMin, priceEtbMax, priceSarMin, priceSarMax,
        discounts,
        persons,
        durationDays, departureCity,
        inclusions, availableDates, itinerary, isActive
      } = req.body;

      // Parse JSON fields safely
      const parsedInclusions = typeof inclusions === 'string' ? JSON.parse(inclusions) : (inclusions || []);
      const parsedAvailableDates = typeof availableDates === 'string' ? JSON.parse(availableDates) : (availableDates || []);
      const parsedItinerary = typeof itinerary === 'string' ? JSON.parse(itinerary) : (itinerary || []);
      const parsedDiscounts = typeof discounts === 'string' ? JSON.parse(discounts) : (discounts || []);
      const parsedPersons = typeof persons === 'string' ? JSON.parse(persons) : (persons || []);

      const file = (req as any).file;
      let imageUrl = '';
      if (file) {
        imageUrl = `/uploads/packages/${file.filename}`;
        console.log(`📦 Package image uploaded: ${file.filename} -> ${imageUrl}`);
      } else if (req.body.imageUrl) {
        imageUrl = req.body.imageUrl;
      }

      // Validation
      if (!titleEn || !titleEn.trim()) {
        return res.status(400).json({ status: 'error', success: false, error: 'English Title is required.' });
      }
      if (!category) {
        return res.status(400).json({ status: 'error', success: false, error: 'Category is required.' });
      }
      if (!priceUsd || Number(priceUsd) <= 0) {
        return res.status(400).json({ status: 'error', success: false, error: 'Valid USD price is required.' });
      }
      if (!durationDays || Number(durationDays) <= 0) {
        return res.status(400).json({ status: 'error', success: false, error: 'Duration must be at least 1 day.' });
      }
      if (!imageUrl) {
        return res.status(400).json({ status: 'error', success: false, error: 'Image is required.' });
      }

      const validCategories: PackageCategory[] = ['Economy', 'Standard', 'Premium', 'VIP'];
      if (!validCategories.includes(category as PackageCategory)) {
        return res.status(400).json({ 
          status: 'error', 
          success: false, 
          error: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
        });
      }

      const validPriceTypes: PriceType[] = ['single', 'range'];
      const finalPriceType = (priceType && validPriceTypes.includes(priceType)) ? priceType : 'single';

      const now = new Date().toISOString();
      const priceUsdNum = Number(priceUsd);
      const rate = 159.98;

      // Build the package object
      const newPkg: any = {
        id: `pkg-${Date.now()}`,
        titleEn: titleEn.trim(),
        titleAr: (titleAr || '').trim(),
        titleAm: (titleAm || '').trim(),
        category: category as PackageCategory,
        priceUsd: priceUsdNum,
        priceEtb: priceEtb ? Number(priceEtb) : Math.round(priceUsdNum * rate),
        priceSar: priceSar ? Number(priceSar) : Math.round(priceUsdNum * 3.75),
        priceType: finalPriceType,
        durationDays: Number(durationDays),
        departureCity: departureCity || 'Addis Ababa',
        inclusions: Array.isArray(parsedInclusions) ? parsedInclusions : [],
        availableDates: Array.isArray(parsedAvailableDates) ? parsedAvailableDates : [],
        itinerary: Array.isArray(parsedItinerary) ? parsedItinerary : [],
        imageUrl: imageUrl.trim(),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        status: isActive !== undefined ? (Boolean(isActive) ? 'Active' : 'Inactive') : 'Active',
        whatsappClicks: 0,
        createdAt: now,
        updatedAt: now,
        discounts: [],
        persons: []
      };

      // Add price range if priceType is 'range'
      if (finalPriceType === 'range') {
        newPkg.priceUsdMin = priceUsdMin ? Number(priceUsdMin) : priceUsdNum;
        newPkg.priceUsdMax = priceUsdMax ? Number(priceUsdMax) : priceUsdNum;
        newPkg.priceEtbMin = priceEtbMin ? Number(priceEtbMin) : Math.round(priceUsdNum * rate);
        newPkg.priceEtbMax = priceEtbMax ? Number(priceEtbMax) : Math.round(priceUsdNum * rate);
        newPkg.priceSarMin = priceSarMin ? Number(priceSarMin) : Math.round(priceUsdNum * 3.75);
        newPkg.priceSarMax = priceSarMax ? Number(priceSarMax) : Math.round(priceUsdNum * 3.75);
      }

      // Add discounts if provided
      if (Array.isArray(parsedDiscounts) && parsedDiscounts.length > 0) {
        newPkg.discounts = parsedDiscounts.map((d: any) => ({
          ...d,
          id: d.id || `disc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          isActive: d.isActive !== undefined ? d.isActive : true
        }));
      }

      // Add persons if provided
      if (Array.isArray(parsedPersons) && parsedPersons.length > 0) {
        newPkg.persons = parsedPersons.map((p: any) => ({
          id: p.id || `person-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: p.name || '',
          email: p.email || '',
          phone: p.phone || '',
          age: p.age || undefined,
          gender: p.gender || undefined
        }));
      }

      db.addPackage(newPkg);

      // Create initial price log
      const log: PriceLog = {
        id: `pl-${Date.now()}`,
        packageId: newPkg.id,
        priceUsd: newPkg.priceUsd,
        priceEtb: newPkg.priceEtb,
        priceSar: newPkg.priceSar,
        previousPriceUsd: null,
        previousPriceEtb: null,
        previousPriceSar: null,
        reason: 'Initial package creation',
        updatedBy: 'Admin',
        updatedAt: now
      };
      db.addPriceLog(log);

      res.status(201).json({
        status: 'success',
        success: true,
        message: 'Package created successfully',
        data: newPkg
      });
    } catch (err: any) {
      console.error('❌ Error creating package:', err);
      res.status(500).json({ 
        status: 'error', 
        success: false, 
        error: 'Something went wrong while creating the package.',
        details: err.message 
      });
    }
  });
});

// ADMIN - UPDATE PACKAGE (FIXED)
apiRouter.put('/admin/packages/:id', authenticateJWT, (req: Request, res: Response) => {
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
        titleEn, titleAr, titleAm, category,
        priceUsd, priceEtb, priceSar,
        priceType,
        priceUsdMin, priceUsdMax, priceEtbMin, priceEtbMax, priceSarMin, priceSarMax,
        discounts,
        persons,
        durationDays, departureCity,
        inclusions, availableDates, itinerary, isActive,
        reason
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
        return res.status(400).json({ 
          status: 'error', 
          success: false, 
          error: 'Invalid category. Must be Economy, Standard, Premium, or VIP.' 
        });
      }

      const validPriceTypes: PriceType[] = ['single', 'range'];
      const finalPriceType = (priceType && validPriceTypes.includes(priceType)) ? priceType : (existing.priceType || 'single');

      // Parse JSON fields safely
      const parsedInclusions = typeof inclusions === 'string' ? JSON.parse(inclusions) : (inclusions !== undefined ? inclusions : existing.inclusions);
      const parsedAvailableDates = typeof availableDates === 'string' ? JSON.parse(availableDates) : (availableDates !== undefined ? availableDates : existing.availableDates);
      const parsedItinerary = typeof itinerary === 'string' ? JSON.parse(itinerary) : (itinerary !== undefined ? itinerary : existing.itinerary);
      const parsedDiscounts = typeof discounts === 'string' ? JSON.parse(discounts) : (discounts !== undefined ? discounts : existing.discounts || []);
      const parsedPersons = typeof persons === 'string' ? JSON.parse(persons) : (persons !== undefined ? persons : existing.persons || []);

      const rate = 159.98;
      const priceUsdNew = priceUsd !== undefined ? Number(priceUsd) : existing.priceUsd;
      const priceEtbNew = priceEtb !== undefined ? Number(priceEtb) : (existing.priceEtb || Math.round(priceUsdNew * rate));
      const priceSarNew = priceSar !== undefined ? Number(priceSar) : (existing.priceSar || Math.round(priceUsdNew * 3.75));

      // Build updated package - PRESERVE all existing data
      const updatedPkg: any = {
        ...existing,
        titleEn: titleEn !== undefined ? titleEn.trim() : existing.titleEn,
        titleAr: titleAr !== undefined ? titleAr.trim() : existing.titleAr,
        titleAm: titleAm !== undefined ? titleAm.trim() : existing.titleAm,
        category: category ? (category as PackageCategory) : existing.category,
        priceUsd: priceUsdNew,
        priceEtb: priceEtbNew,
        priceSar: priceSarNew,
        priceType: finalPriceType,
        durationDays: durationDays !== undefined ? Number(durationDays) : existing.durationDays,
        departureCity: departureCity !== undefined ? departureCity : existing.departureCity,
        inclusions: Array.isArray(parsedInclusions) ? parsedInclusions : [],
        availableDates: Array.isArray(parsedAvailableDates) ? parsedAvailableDates : [],
        itinerary: Array.isArray(parsedItinerary) ? parsedItinerary : [],
        imageUrl: imageUrl,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        status: isActive !== undefined ? (Boolean(isActive) ? 'Active' : 'Inactive') : existing.status,
        updatedAt: new Date().toISOString(),
        discounts: Array.isArray(parsedDiscounts) ? parsedDiscounts : (existing.discounts || []),
        persons: Array.isArray(parsedPersons) ? parsedPersons : (existing.persons || [])
      };

      // Handle price range
      if (finalPriceType === 'range') {
        if (existing.priceType !== 'range') {
          updatedPkg.priceUsdMin = priceUsdMin !== undefined ? Number(priceUsdMin) : existing.priceUsd;
          updatedPkg.priceUsdMax = priceUsdMax !== undefined ? Number(priceUsdMax) : existing.priceUsd;
          updatedPkg.priceEtbMin = priceEtbMin !== undefined ? Number(priceEtbMin) : (existing.priceEtb || Math.round(existing.priceUsd * rate));
          updatedPkg.priceEtbMax = priceEtbMax !== undefined ? Number(priceEtbMax) : (existing.priceEtb || Math.round(existing.priceUsd * rate));
          updatedPkg.priceSarMin = priceSarMin !== undefined ? Number(priceSarMin) : (existing.priceSar || Math.round(existing.priceUsd * 3.75));
          updatedPkg.priceSarMax = priceSarMax !== undefined ? Number(priceSarMax) : (existing.priceSar || Math.round(existing.priceUsd * 3.75));
        } else {
          updatedPkg.priceUsdMin = priceUsdMin !== undefined ? Number(priceUsdMin) : (existing.priceUsdMin || existing.priceUsd);
          updatedPkg.priceUsdMax = priceUsdMax !== undefined ? Number(priceUsdMax) : (existing.priceUsdMax || existing.priceUsd);
          updatedPkg.priceEtbMin = priceEtbMin !== undefined ? Number(priceEtbMin) : (existing.priceEtbMin || Math.round(existing.priceUsd * rate));
          updatedPkg.priceEtbMax = priceEtbMax !== undefined ? Number(priceEtbMax) : (existing.priceEtbMax || Math.round(existing.priceUsd * rate));
          updatedPkg.priceSarMin = priceSarMin !== undefined ? Number(priceSarMin) : (existing.priceSarMin || Math.round(existing.priceUsd * 3.75));
          updatedPkg.priceSarMax = priceSarMax !== undefined ? Number(priceSarMax) : (existing.priceSarMax || Math.round(existing.priceUsd * 3.75));
        }
      } else {
        delete updatedPkg.priceUsdMin;
        delete updatedPkg.priceUsdMax;
        delete updatedPkg.priceEtbMin;
        delete updatedPkg.priceEtbMax;
        delete updatedPkg.priceSarMin;
        delete updatedPkg.priceSarMax;
      }

      // Check if prices changed for logging
      const priceChanged = priceUsdNew !== existing.priceUsd || 
                          priceEtbNew !== existing.priceEtb || 
                          priceSarNew !== existing.priceSar;

      const updateReason = reason || (priceChanged ? 'Price updated via admin' : 'Package details updated');

      // Update the package
      db.updatePackage(index, updatedPkg, updateReason);
      console.log(`✅ Package ${existing.id} updated successfully`);

      res.json({
        status: 'success',
        success: true,
        message: 'Package updated successfully',
        data: updatedPkg
      });
    } catch (err: any) {
      console.error('❌ Error updating package:', err);
      res.status(500).json({ 
        status: 'error', 
        success: false, 
        error: 'Something went wrong while updating the package.',
        details: err.message 
      });
    }
  });
});

// ADMIN - DELETE PACKAGE
apiRouter.delete('/admin/packages/:id', authenticateJWT, (req: Request, res: Response) => {
  const index = db.packages.findIndex(p => String(p.id) === String(req.params.id));
  if (index === -1) {
    return res.status(404).json({ status: 'error', success: false, error: 'Package not found' });
  }
  
  const pkg = db.packages[index];
  db.deletePackage(index);
  console.log(`🗑️ Package ${pkg.id} (${pkg.titleEn}) deleted`);
  
  res.json({ 
    status: 'success', 
    success: true, 
    message: 'Package deleted successfully' 
  });
});

// ADMIN - Get price logs with full details
apiRouter.get('/admin/price-logs', authenticateJWT, (req: Request, res: Response) => {
  const sortedLogs = [...db.priceLogs].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  
  // Get package titles for context
  const logsWithDetails = sortedLogs.map(log => {
    const pkg = db.packages.find(p => p.id === log.packageId);
    return {
      ...log,
      packageTitle: pkg ? pkg.titleEn : log.packageTitle || 'Unknown Package',
      packageCategory: pkg ? pkg.category : 'Unknown',
      packageIsActive: pkg ? pkg.isActive : false
    };
  });
  
  res.json({
    status: 'success',
    success: true,
    count: logsWithDetails.length,
    data: logsWithDetails
  });
});

// ============================================================
// GALLERY (with video support)
// ============================================================
// Helper function to extract YouTube video ID
function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1]?.split('?')[0] || null;
  }
  if (url.includes('watch?v=')) {
    return url.split('watch?v=')[1]?.split('&')[0] || null;
  }
  if (url.includes('youtube.com/embed/')) {
    return url.split('youtube.com/embed/')[1]?.split('?')[0] || null;
  }
  if (url.includes('youtube.com/v/')) {
    return url.split('youtube.com/v/')[1]?.split('?')[0] || null;
  }
  if (url.includes('youtube.com/shorts/')) {
    return url.split('youtube.com/shorts/')[1]?.split('?')[0] || null;
  }
  
  return null;
}

apiRouter.get('/gallery', (req: Request, res: Response) => {
  let items = db.gallery.filter(g => g.isActive !== false);
  const typeFilter = req.query.type ? String(req.query.type).toLowerCase() : null;
  if (typeFilter === 'photo' || typeFilter === 'video') {
    items = items.filter(g => g.type === typeFilter);
  }
  const sorted = [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  
  const formattedItems = sorted.map(item => {
    let thumbnailUrl = item.thumbnailUrl || '';
    let imageUrl = item.imageUrl || '';
    
    if (item.type === 'video') {
      if (!thumbnailUrl && imageUrl) {
        thumbnailUrl = imageUrl;
      }
      if (!thumbnailUrl) {
        thumbnailUrl = '';
      }
    }
    
    return {
      ...item,
      thumbnailUrl: thumbnailUrl,
      imageUrl: imageUrl,
    };
  });
  
  res.json({ 
    status: 'success', 
    success: true, 
    count: formattedItems.length, 
    data: formattedItems 
  });
});

apiRouter.get('/gallery/:id', (req: Request, res: Response) => {
  const item = db.gallery.find(g => String(g.id) === String(req.params.id));
  if (!item || !item.isActive) {
    return res.status(404).json({ status: 'error', success: false, error: 'Gallery item not found' });
  }
  res.json({ status: 'success', success: true, data: item });
});

apiRouter.get('/admin/gallery', authenticateJWT, (req: Request, res: Response) => {
  const typeFilter = req.query.type ? String(req.query.type).toLowerCase() : null;
  let items = db.gallery;
  if (typeFilter === 'photo' || typeFilter === 'video') {
    items = items.filter(g => g.type === typeFilter);
  }
  const sorted = [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  res.json({ status: 'success', success: true, count: sorted.length, data: sorted });
});

// CREATE GALLERY ITEM
apiRouter.post('/admin/gallery', authenticateJWT, galleryUploadFields, async (req: Request, res: Response) => {
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
    let thumbnailUrl = body.thumbnailUrl || '';

    // Handle file uploads
    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (files.image && files.image[0]) {
        const file = files.image[0];
        imageUrl = `/uploads/images/${file.filename}`;
        if (type === 'photo') {
          thumbnailUrl = imageUrl;
        }
        console.log(`🖼️ Image uploaded: ${file.filename} -> ${imageUrl}`);
      }
      if (files.video && files.video[0]) {
        const file = files.video[0];
        videoUrl = `/uploads/videos/${file.filename}`;
        console.log(`🎬 Video uploaded: ${file.filename} -> ${videoUrl}`);

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
          console.log(`🎬 Thumbnail generated: ${thumbnailFilename}`);
        } catch (ffmpegErr) {
          console.error('❌ Failed to generate video thumbnail:', ffmpegErr);
          thumbnailUrl = '';
        }
      }
    }

    // If video URL is provided, check if it's YouTube and get thumbnail
    if (type === 'video' && videoUrl) {
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        const videoId = extractYouTubeVideoId(videoUrl);
        if (videoId) {
          thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          imageUrl = thumbnailUrl;
          console.log(`🎬 YouTube thumbnail set: ${thumbnailUrl}`);
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

    db.addGalleryItem(newItem);
    res.status(201).json({ 
      status: 'success', 
      success: true, 
      message: 'Gallery item created successfully', 
      data: newItem 
    });
  } catch (err: any) {
    console.error('Error creating gallery item:', err);
    res.status(500).json({ status: 'error', success: false, error: 'Failed to create gallery item.' });
  }
});

// BULK UPLOAD GALLERY ITEMS
apiRouter.post('/admin/gallery/bulk', authenticateJWT, bulkUpload, async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const body = req.body || {};
    
    let items: any[] = [];
    try {
      if (body.items) {
        items = typeof body.items === 'string' ? JSON.parse(body.items) : body.items;
      }
    } catch (e) {
      console.error('Failed to parse items:', e);
      return res.status(400).json({ status: 'error', success: false, error: 'Invalid items data' });
    }

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const itemData = items[i] || {};
        
        const isVideo = file.mimetype.startsWith('video/');
        const type = isVideo ? 'video' : 'photo';
        
        let imageUrl = '';
        let videoUrl = '';
        let thumbnailUrl = '';
        
        if (isVideo) {
          videoUrl = `/uploads/videos/${file.filename}`;
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
            console.log(`🎬 Thumbnail generated for bulk upload: ${thumbnailFilename}`);
          } catch (ffmpegErr) {
            console.error('❌ Failed to generate video thumbnail:', ffmpegErr);
            thumbnailUrl = '';
          }
        } else {
          imageUrl = `/uploads/images/${file.filename}`;
          thumbnailUrl = imageUrl;
        }
        
        // Check if it's a YouTube URL for video URL input
        const isYouTube = itemData.videoUrl && (itemData.videoUrl.includes('youtube.com') || itemData.videoUrl.includes('youtu.be'));
        if (isYouTube) {
          const videoId = extractYouTubeVideoId(itemData.videoUrl);
          if (videoId) {
            thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            imageUrl = thumbnailUrl;
          }
        }
        
        const now = new Date().toISOString();
        const newItem: GalleryItem = {
          id: `gal-${Date.now()}-${Math.floor(Math.random() * 1000)}-${i}`,
          type: type as GalleryType,
          titleEn: itemData.titleEn || file.originalname || `Untitled ${type}`,
          titleAr: itemData.titleAr || '',
          imageUrl: imageUrl || '',
          thumbnailUrl: thumbnailUrl || imageUrl || '',
          videoUrl: isVideo ? videoUrl : (itemData.videoUrl || ''),
          duration: itemData.duration || '',
          location: itemData.location || 'Makkah Al-Mukarramah',
          description: itemData.description || '',
          isActive: itemData.isActive !== undefined ? itemData.isActive : true,
          sortOrder: itemData.sortOrder || 0,
          uploadDate: now.substring(0, 10),
          createdAt: now,
          updatedAt: now
        };
        
        db.addGalleryItem(newItem);
        items[i] = newItem;
      }
      
      res.status(201).json({
        status: 'success',
        success: true,
        message: `Successfully uploaded ${files.length} items`,
        data: items
      });
    } else {
      const createdItems = [];
      for (const itemData of items) {
        const isYouTube = itemData.videoUrl && (itemData.videoUrl.includes('youtube.com') || itemData.videoUrl.includes('youtu.be'));
        let thumbnailUrl = '';
        let imageUrl = '';
        
        if (isYouTube) {
          const videoId = extractYouTubeVideoId(itemData.videoUrl);
          if (videoId) {
            thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            imageUrl = thumbnailUrl;
          }
        }
        
        const now = new Date().toISOString();
        const newItem: GalleryItem = {
          id: `gal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          type: itemData.type || 'video',
          titleEn: itemData.titleEn || 'Untitled',
          titleAr: itemData.titleAr || '',
          imageUrl: imageUrl || itemData.imageUrl || '',
          thumbnailUrl: thumbnailUrl || itemData.thumbnailUrl || imageUrl || '',
          videoUrl: itemData.videoUrl || '',
          duration: itemData.duration || '',
          location: itemData.location || 'Makkah Al-Mukarramah',
          description: itemData.description || '',
          isActive: itemData.isActive !== undefined ? itemData.isActive : true,
          sortOrder: itemData.sortOrder || 0,
          uploadDate: now.substring(0, 10),
          createdAt: now,
          updatedAt: now
        };
        
        db.addGalleryItem(newItem);
        createdItems.push(newItem);
      }
      
      res.status(201).json({
        status: 'success',
        success: true,
        message: `Successfully created ${createdItems.length} items`,
        data: createdItems
      });
    }
  } catch (err: any) {
    console.error('Error in bulk upload:', err);
    res.status(500).json({ status: 'error', success: false, error: 'Failed to bulk upload gallery items.' });
  }
});

// DELETE GALLERY ITEM
apiRouter.delete('/admin/gallery/:id', authenticateJWT, (req: Request, res: Response) => {
  const index = db.gallery.findIndex(g => String(g.id) === String(req.params.id));
  if (index === -1) {
    return res.status(404).json({ status: 'error', success: false, error: 'Gallery item not found' });
  }
  db.deleteGalleryItem(index);
  res.json({ status: 'success', success: true, message: 'Gallery item deleted successfully' });
});

apiRouter.delete('/admin/gallery/:id', authenticateJWT, (req: Request, res: Response) => {
  const index = db.gallery.findIndex(g => String(g.id) === String(req.params.id));
  if (index === -1) {
    return res.status(404).json({ status: 'error', success: false, error: 'Gallery item not found' });
  }
  db.deleteGalleryItem(index);
  res.json({ status: 'success', success: true, message: 'Gallery item deleted successfully' });
});

// ============================================================
// INQUIRIES
// ============================================================

// GET all inquiries
apiRouter.get('/admin/inquiries', authenticateJWT, (req: Request, res: Response) => {
  try {
    const sorted = [...db.inquiries].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json({ 
      status: 'success', 
      success: true, 
      count: sorted.length, 
      data: sorted 
    });
  } catch (error) {
    console.error('❌ Error fetching inquiries:', error);
    res.status(500).json({ status: 'error', success: false, error: 'Failed to fetch inquiries' });
  }
});

// CREATE inquiry (public)
apiRouter.post('/inquiries', (req: Request, res: Response) => {
  try {
    const { fullName, phone, email, subject, message, source } = req.body;
    if (!fullName || !phone || !message) {
      return res.status(400).json({ status: 'error', success: false, error: 'Missing required fields' });
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
      status: 'New' as InquiryStatus,
      dateReceived: now,
      createdAt: now,
      updatedAt: now
    };
    db.inquiries.unshift(newInquiry);
    db.saveToFile();
    res.status(201).json({ status: 'success', success: true, message: 'Inquiry submitted', data: newInquiry });
  } catch (error) {
    console.error('❌ Error creating inquiry:', error);
    res.status(500).json({ status: 'error', success: false, error: 'Failed to create inquiry' });
  }
});

// ⚠️ IMPORTANT: BULK STATUS MUST COME BEFORE THE :id ROUTE ⚠️
// BULK UPDATE INQUIRIES
apiRouter.put('/admin/inquiries/bulk-status', authenticateJWT, (req: Request, res: Response) => {
  console.log('🔥 BULK STATUS ENDPOINT HIT!');
  console.log('📥 Request body:', req.body);
  
  try {
    const { ids, status } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        status: 'error', 
        success: false, 
        error: 'No inquiry IDs provided' 
      });
    }
    
    const validStatuses: InquiryStatus[] = ['New', 'Contacted', 'Resolved'];
    if (!status || !validStatuses.includes(status as InquiryStatus)) {
      return res.status(400).json({ 
        status: 'error', 
        success: false, 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }
    
    let updatedCount = 0;
    const updatedInquiries = [];
    
    for (const id of ids) {
      const inquiry = db.inquiries.find(i => String(i.id) === String(id));
      if (inquiry) {
        inquiry.status = status as InquiryStatus;
        inquiry.updatedAt = new Date().toISOString();
        updatedCount++;
        updatedInquiries.push(inquiry);
      }
    }
    
    db.saveToFile();
    
    console.log(`✅ Updated ${updatedCount} inquiries to ${status}`);
    
    res.json({
      status: 'success',
      success: true,
      message: `Updated ${updatedCount} inquiries to ${status}`,
      data: {
        updatedCount,
        updatedInquiries
      }
    });
  } catch (error: any) {
    console.error('❌ Bulk status update error:', error);
    res.status(500).json({ 
      status: 'error', 
      success: false, 
      error: 'Failed to update inquiry statuses' 
    });
  }
});

// UPDATE single inquiry
apiRouter.put('/admin/inquiries/:id', authenticateJWT, (req: Request, res: Response) => {
  try {
    const inquiry = db.inquiries.find(i => String(i.id) === String(req.params.id));
    if (!inquiry) {
      return res.status(404).json({ status: 'error', success: false, error: 'Inquiry not found' });
    }
    const { status } = req.body;
    const validStatuses: InquiryStatus[] = ['New', 'Contacted', 'Resolved'];
    if (!status || !validStatuses.includes(status as InquiryStatus)) {
      return res.status(400).json({ status: 'error', success: false, error: 'Invalid status' });
    }
    inquiry.status = status as InquiryStatus;
    inquiry.updatedAt = new Date().toISOString();
    db.saveToFile();
    res.json({ status: 'success', success: true, message: 'Inquiry updated', data: inquiry });
  } catch (error) {
    console.error('❌ Error updating inquiry:', error);
    res.status(500).json({ status: 'error', success: false, error: 'Failed to update inquiry' });
  }
});

// DELETE single inquiry
apiRouter.delete('/admin/inquiries/:id', authenticateJWT, (req: Request, res: Response) => {
  try {
    const index = db.inquiries.findIndex(i => String(i.id) === String(req.params.id));
    if (index === -1) {
      return res.status(404).json({ status: 'error', success: false, error: 'Inquiry not found' });
    }
    db.deleteInquiry(index);
    res.json({ status: 'success', success: true, message: 'Inquiry deleted' });
  } catch (error) {
    console.error('❌ Error deleting inquiry:', error);
    res.status(500).json({ status: 'error', success: false, error: 'Failed to delete inquiry' });
  }
});

// BULK DELETE INQUIRIES
apiRouter.delete('/admin/inquiries/bulk-delete', authenticateJWT, (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: 'error', success: false, error: 'No inquiry IDs provided' });
    }
    let deletedCount = 0;
    for (let i = db.inquiries.length - 1; i >= 0; i--) {
      if (ids.includes(String(db.inquiries[i].id))) {
        db.inquiries.splice(i, 1);
        deletedCount++;
      }
    }
    db.saveToFile();
    res.json({ status: 'success', success: true, message: `Deleted ${deletedCount} inquiries` });
  } catch (error) {
    console.error('❌ Error bulk deleting inquiries:', error);
    res.status(500).json({ status: 'error', success: false, error: 'Failed to delete inquiries' });
  }
});

// ============================================================
// SMS CAMPAIGNS
// ============================================================
apiRouter.post('/admin/sms/campaign', authenticateJWT, (req: Request, res: Response) => {
  const { message, recipientFilter, channelFilter, packageInterestId, sendToAll, recipientType, packageId } = req.body;

  if (!message) {
    return res.status(400).json({ status: 'error', success: false, error: 'Message content is required' });
  }

  let recipients: any[] = [];
  let recipientPhones: string[] = [];
  let recipientTypeLabel = '';

  // Determine recipient type
  const recType = recipientType || 'subscribers';

  if (recType === 'persons') {
    // Get persons from packages
    recipientTypeLabel = 'Persons on Package';
    
    if (packageId) {
      // Get persons from specific package
      const pkg = db.packages.find(p => String(p.id) === String(packageId));
      if (pkg && pkg.persons && Array.isArray(pkg.persons)) {
        recipients = pkg.persons.map((p: any) => ({
          phone: p.phone,
          name: p.name || '',
          email: p.email || '',
          packageTitle: pkg.titleEn
        }));
        recipientPhones = recipients.map(r => r.phone);
        console.log(`📱 Found ${recipients.length} persons in package "${pkg.titleEn}"`);
      }
    } else {
      // Get all persons from all packages
      db.packages.forEach(pkg => {
        if (pkg.persons && Array.isArray(pkg.persons)) {
          pkg.persons.forEach((p: any) => {
            if (p.phone) {
              recipients.push({
                phone: p.phone,
                name: p.name || '',
                email: p.email || '',
                packageTitle: pkg.titleEn
              });
            }
          });
        }
      });
      recipientPhones = recipients.map(r => r.phone);
      console.log(`📱 Found ${recipients.length} total persons across all packages`);
    }
  } else {
    // Default: Get subscribers
    recipientTypeLabel = 'SMS Subscribers';
    let subscribers = db.subscribers.filter(s => s.optInStatus === 'Active' || s.optInStatus === true);

    if (recipientFilter && typeof recipientFilter === 'string') {
      if (recipientFilter.startsWith('channel:')) {
        const channel = recipientFilter.replace('channel:', '');
        subscribers = subscribers.filter(s => s.channel?.toLowerCase() === channel.toLowerCase());
      } else if (recipientFilter.startsWith('package:')) {
        const pkgId = recipientFilter.replace('package:', '');
        subscribers = subscribers.filter(s => String(s.packageInterestId) === String(pkgId));
      } else if (recipientFilter.startsWith('Package:')) {
        const pkgTitle = recipientFilter.replace('Package:', '').trim();
        subscribers = subscribers.filter(s => 
          s.packageInterest && s.packageInterest.toLowerCase().includes(pkgTitle.toLowerCase())
        );
      }
    } else if (sendToAll === false) {
      if (channelFilter) {
        subscribers = subscribers.filter(s => s.channel === channelFilter);
      }
      if (packageInterestId) {
        subscribers = subscribers.filter(s => String(s.packageInterestId) === String(packageInterestId));
      }
    }

    recipients = subscribers.map((s: any) => ({
      phone: s.phone,
      name: s.name || '',
      email: s.email || '',
      packageInterest: s.packageInterest || ''
    }));
    recipientPhones = recipients.map(r => r.phone);
  }

  const recipientsCount = recipientPhones.length;
  const campaignId = `camp_${Date.now()}`;

  // Log each recipient
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
      status: 'Delivered',
      recipientType: recipientTypeLabel,
      recipientPhones: recipientPhones.slice(0, 10) // Return first 10 for preview
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

apiRouter.get('/admin/sms/logs', authenticateJWT, handleGetSmsLogs);
apiRouter.get('/admin/sms/campaigns', authenticateJWT, handleGetSmsLogs);

// ============================================================
// DASHBOARD STATS
// ============================================================
apiRouter.get('/admin/dashboard/stats', authenticateJWT, (req: Request, res: Response) => {
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

// ============================================================
// TEAM MEMBERS
// ============================================================

// Public endpoint - Get all active team members
apiRouter.get('/team-members', (req: Request, res: Response) => {
  const activeMembers = db.teamMembers
    .filter(m => m.isActive !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  res.json({
    status: 'success',
    success: true,
    count: activeMembers.length,
    data: activeMembers
  });
});

// Admin endpoints
apiRouter.get('/admin/team-members', authenticateJWT, (req: Request, res: Response) => {
  const sorted = [...db.teamMembers].sort((a, b) => (a.order || 0) - (b.order || 0));
  res.json({
    status: 'success',
    success: true,
    count: sorted.length,
    data: sorted
  });
});

// CREATE Team Member with image upload
apiRouter.post('/admin/team-members', authenticateJWT, teamUpload, (req: Request, res: Response) => {
  try {
    console.log('📥 POST /admin/team-members - Request received');
    console.log('📋 Body:', req.body);
    console.log('📁 File:', (req as any).file);

    const { name, role, bio, order, isActive } = req.body;
    const file = (req as any).file;

    // Check if image was uploaded
    let imageUrl = '';
    if (file) {
      imageUrl = `/uploads/team/${file.filename}`;
      console.log(`👤 Team member image uploaded: ${file.filename} -> ${imageUrl}`);
    }

    // Validate required fields
    if (!name || !role || !bio) {
      console.error('❌ Missing required fields:', { name, role, bio });
      return res.status(400).json({
        status: 'error',
        success: false,
        error: 'Name, role, and bio are required'
      });
    }

    if (!imageUrl) {
      console.error('❌ No image uploaded');
      return res.status(400).json({
        status: 'error',
        success: false,
        error: 'Image is required. Please upload a photo.'
      });
    }

    // Check if name already exists
    const existing = db.teamMembers.find(m => m.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({
        status: 'error',
        success: false,
        error: 'A team member with this name already exists'
      });
    }

    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      name: name.trim(),
      role: role.trim(),
      bio: bio.trim(),
      imageUrl: imageUrl,
      order: order !== undefined ? Number(order) : db.teamMembers.length + 1,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.addTeamMember(newMember);
    console.log('✅ Team member created:', newMember);
    res.status(201).json({
      status: 'success',
      success: true,
      message: 'Team member added successfully',
      data: newMember
    });
  } catch (err: any) {
    console.error('❌ Error creating team member:', err);
    res.status(500).json({
      status: 'error',
      success: false,
      error: 'Failed to create team member: ' + err.message
    });
  }
});

// UPDATE Team Member with optional image upload
apiRouter.put('/admin/team-members/:id', authenticateJWT, teamUpload, (req: Request, res: Response) => {
  try {
    console.log(`📥 PUT /admin/team-members/${req.params.id}`);
    
    const index = db.teamMembers.findIndex(m => m.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ status: 'error', success: false, error: 'Team member not found' });
    }

    const { name, role, bio, order, isActive } = req.body;
    const file = (req as any).file;
    const existing = db.teamMembers[index];

    // Check if new image was uploaded
    let imageUrl = existing.imageUrl;
    if (file) {
      imageUrl = `/uploads/team/${file.filename}`;
      console.log(`👤 Team member image updated: ${file.filename} -> ${imageUrl}`);
    }

    // Check if name already exists (excluding current)
    if (name) {
      const duplicate = db.teamMembers.find(m => 
        m.name.toLowerCase() === name.trim().toLowerCase() && 
        m.id !== req.params.id
      );
      if (duplicate) {
        return res.status(400).json({
          status: 'error',
          success: false,
          error: 'A team member with this name already exists'
        });
      }
    }

    const updated: TeamMember = {
      id: existing.id,
      name: name !== undefined ? name.trim() : existing.name,
      role: role !== undefined ? role.trim() : existing.role,
      bio: bio !== undefined ? bio.trim() : existing.bio,
      imageUrl: imageUrl,
      order: order !== undefined ? Number(order) : existing.order,
      isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString()
    };

    db.updateTeamMember(index, updated);
    res.json({
      status: 'success',
      success: true,
      message: 'Team member updated successfully',
      data: updated
    });
  } catch (err: any) {
    console.error('❌ Error updating team member:', err);
    res.status(500).json({
      status: 'error',
      success: false,
      error: 'Failed to update team member: ' + err.message
    });
  }
});

apiRouter.delete('/admin/team-members/:id', authenticateJWT, (req: Request, res: Response) => {
  const index = db.teamMembers.findIndex(m => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ status: 'error', success: false, error: 'Team member not found' });
  }

  db.deleteTeamMember(index);
  res.json({
    status: 'success',
    success: true,
    message: 'Team member deleted successfully'
  });
});

// ============================================================
// OFFICE IMAGES (with file upload)
// ============================================================

// Public endpoint - Get all active office images
apiRouter.get('/office-images', (req: Request, res: Response) => {
  try {
    const activeImages = db.officeImages
      .filter(img => img.isActive !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Format response - title is optional
    const formattedData = activeImages.map(img => ({
      id: img.id,
      title: img.title || '',
      imageUrl: img.imageUrl,
      description: img.description || '',
      order: img.order || 0,
      isActive: img.isActive,
      createdAt: img.createdAt,
      updatedAt: img.updatedAt
    }));

    res.json({
      status: 'success',
      success: true,
      count: formattedData.length,
      data: formattedData
    });
  } catch (error: any) {
    console.error('❌ Error fetching office images:', error);
    res.status(500).json({
      status: 'error',
      success: false,
      error: 'Failed to fetch office images'
    });
  }
});

// Admin endpoints
apiRouter.get('/admin/office-images', authenticateJWT, (req: Request, res: Response) => {
  const sorted = [...db.officeImages].sort((a, b) => (a.order || 0) - (b.order || 0));
  
  const formattedData = sorted.map(img => ({
    id: img.id,
    title: img.title || '',
    imageUrl: img.imageUrl,
    description: img.description || '',
    order: img.order || 0,
    isActive: img.isActive,
    createdAt: img.createdAt,
    updatedAt: img.updatedAt
  }));

  res.json({
    status: 'success',
    success: true,
    count: formattedData.length,
    data: formattedData
  });
});

// CREATE Office Image with file upload - Title is optional
apiRouter.post('/admin/office-images', authenticateJWT, officeUpload, (req: Request, res: Response) => {
  try {
    const { title, description, order, isActive } = req.body;
    const file = (req as any).file;

    let imageUrl = '';
    if (file) {
      // FIXED: Use /uploads/office/ path instead of /uploads/images/
      imageUrl = `/uploads/office/${file.filename}`;
      console.log(`📁 Office image uploaded: ${file.filename} -> ${imageUrl}`);
    }

    // Only imageUrl is required, title is optional
    if (!imageUrl) {
      return res.status(400).json({
        status: 'error',
        success: false,
        error: 'Image is required'
      });
    }

    const newImage: OfficeImage = {
      id: `office-${Date.now()}`,
      title: title || '',
      imageUrl: imageUrl,
      description: description || '',
      order: order !== undefined ? Number(order) : db.officeImages.length + 1,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.addOfficeImage(newImage);
    res.status(201).json({
      status: 'success',
      success: true,
      message: 'Office image added successfully',
      data: newImage
    });
  } catch (err: any) {
    console.error('❌ Error creating office image:', err);
    res.status(500).json({
      status: 'error',
      success: false,
      error: 'Failed to create office image: ' + err.message
    });
  }
});

// UPDATE Office Image - Title is optional
apiRouter.put('/admin/office-images/:id', authenticateJWT, (req: Request, res: Response) => {
  try {
    const index = db.officeImages.findIndex(img => img.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ status: 'error', success: false, error: 'Office image not found' });
    }

    const { title, description, order, isActive } = req.body;
    const existing = db.officeImages[index];

    const updated: OfficeImage = {
      id: existing.id,
      title: title !== undefined ? title : existing.title,
      imageUrl: existing.imageUrl,
      description: description !== undefined ? description : existing.description,
      order: order !== undefined ? Number(order) : existing.order,
      isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString()
    };

    db.updateOfficeImage(index, updated);
    res.json({
      status: 'success',
      success: true,
      message: 'Office image updated successfully',
      data: updated
    });
  } catch (err: any) {
    console.error('❌ Error updating office image:', err);
    res.status(500).json({
      status: 'error',
      success: false,
      error: 'Failed to update office image: ' + err.message
    });
  }
});

apiRouter.delete('/admin/office-images/:id', authenticateJWT, (req: Request, res: Response) => {
  const index = db.officeImages.findIndex(img => img.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ status: 'error', success: false, error: 'Office image not found' });
  }

  db.deleteOfficeImage(index);
  res.json({
    status: 'success',
    success: true,
    message: 'Office image deleted successfully'
  });
});

// ============================================================
// TESTIMONIALS
// ============================================================

// Public endpoint - Get all active testimonials
apiRouter.get('/testimonials', (req: Request, res: Response) => {
  try {
    console.log('📥 GET /testimonials - Fetching testimonials');
    
    const activeTestimonials = db.testimonials
      .filter(t => t.isActive !== false)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Format data WITHOUT avatar
    const formattedData = activeTestimonials.map(t => ({
      id: t.id || `test-${Date.now()}`,
      name: t.name || 'Anonymous',
      location: t.location || '',
      rating: t.rating || 5,
      text: t.text || '',
      textAr: t.textAr || t.text || '',
      date: t.date || new Date().toISOString().split('T')[0],
      isActive: t.isActive !== undefined ? t.isActive : true,
      createdAt: t.createdAt || new Date().toISOString(),
      updatedAt: t.updatedAt || new Date().toISOString()
    }));

    res.json({
      status: 'success',
      success: true,
      count: formattedData.length,
      data: formattedData
    });
  } catch (error: any) {
    console.error('❌ Error fetching testimonials:', error);
    res.status(500).json({
      status: 'error',
      success: false,
      error: 'Failed to fetch testimonials',
      details: error.message
    });
  }
});

// Admin endpoints
apiRouter.get('/admin/testimonials', authenticateJWT, (req: Request, res: Response) => {
  const sorted = [...db.testimonials].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // Format data WITHOUT avatar
  const formattedData = sorted.map(t => ({
    id: t.id,
    name: t.name,
    location: t.location || '',
    rating: t.rating || 5,
    text: t.text,
    textAr: t.textAr || t.text,
    date: t.date,
    isActive: t.isActive,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt
  }));
  
  res.json({
    status: 'success',
    success: true,
    count: formattedData.length,
    data: formattedData
  });
});

apiRouter.post('/admin/testimonials', authenticateJWT, (req: Request, res: Response) => {
  const { name, location, rating, text, textAr, date, isActive } = req.body;

  if (!name || !text || !rating) {
    return res.status(400).json({
      status: 'error',
      success: false,
      error: 'Name, text, and rating are required'
    });
  }

  const newTestimonial: Testimonial = {
    id: `test-${Date.now()}`,
    name: name.trim(),
    location: location || '',
    rating: Number(rating),
    text: text.trim(),
    textAr: textAr || text.trim(),
    // avatar: '', // REMOVED
    date: date || new Date().toISOString().split('T')[0],
    isActive: isActive !== undefined ? Boolean(isActive) : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.addTestimonial(newTestimonial);
  res.status(201).json({
    status: 'success',
    success: true,
    message: 'Testimonial added successfully',
    data: newTestimonial
  });
});

apiRouter.put('/admin/testimonials/:id', authenticateJWT, (req: Request, res: Response) => {
  const index = db.testimonials.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ status: 'error', success: false, error: 'Testimonial not found' });
  }

  const { name, location, rating, text, textAr, date, isActive } = req.body;
  const existing = db.testimonials[index];

  const updated: Testimonial = {
    id: existing.id,
    name: name !== undefined ? name.trim() : existing.name,
    location: location !== undefined ? location : existing.location,
    rating: rating !== undefined ? Number(rating) : existing.rating,
    text: text !== undefined ? text.trim() : existing.text,
    textAr: textAr !== undefined ? textAr.trim() : (existing.textAr || existing.text),
    // avatar: existing.avatar, // REMOVED
    date: date !== undefined ? date : existing.date,
    isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString()
  };

  db.updateTestimonial(index, updated);
  res.json({
    status: 'success',
    success: true,
    message: 'Testimonial updated successfully',
    data: updated
  });
});

apiRouter.delete('/admin/testimonials/:id', authenticateJWT, (req: Request, res: Response) => {
  const index = db.testimonials.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ status: 'error', success: false, error: 'Testimonial not found' });
  }

  db.deleteTestimonial(index);
  res.json({
    status: 'success',
    success: true,
    message: 'Testimonial deleted successfully'
  });
});

// ============================================================
// SUBSCRIBERS
// ============================================================

// GET all subscribers (admin)
apiRouter.get('/admin/subscribers', authenticateJWT, (req: Request, res: Response) => {
  try {
    const sorted = [...db.subscribers].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json({
      status: 'success',
      success: true,
      count: sorted.length,
      data: sorted
    });
  } catch (error) {
    console.error('❌ Error fetching subscribers:', error);
    res.status(500).json({ status: 'error', success: false, error: 'Failed to fetch subscribers' });
  }
});

// CREATE subscriber (public - for website signups)
apiRouter.post('/subscribers', (req: Request, res: Response) => {
  try {
    const { phone, email, name, channel, packageInterestId, optInStatus } = req.body;

    if (!phone) {
      return res.status(400).json({
        status: 'error',
        success: false,
        error: 'Phone number is required'
      });
    }

    const existing = db.subscribers.find(s => s.phone === phone);
    if (existing) {
      existing.email = email || existing.email;
      existing.name = name || existing.name;
      existing.channel = channel || existing.channel;
      existing.packageInterestId = packageInterestId || existing.packageInterestId;
      existing.optInStatus = true;
      existing.updatedAt = new Date().toISOString();
      db.saveToFile();
      
      return res.json({
        status: 'success',
        success: true,
        message: 'Subscriber updated successfully',
        data: existing
      });
    }

    const now = new Date().toISOString();
    const newSubscriber = {
      id: `sub-${Date.now()}`,
      phone,
      email: email || '',
      name: name || '',
      channel: channel || 'Web Banner', // Default for website signups
      packageInterestId: packageInterestId || null,
      optInStatus: optInStatus !== undefined ? optInStatus : true,
      dateSubscribed: now,
      createdAt: now,
      updatedAt: now
    };

    db.subscribers.unshift(newSubscriber);
    db.saveToFile();

    res.status(201).json({
      status: 'success',
      success: true,
      message: 'Subscriber created successfully',
      data: newSubscriber
    });
  } catch (error) {
    console.error('❌ Error creating subscriber:', error);
    res.status(500).json({ status: 'error', success: false, error: 'Failed to create subscriber' });
  }
});

// CREATE subscriber (admin - for manual addition)
apiRouter.post('/admin/subscribers', authenticateJWT, (req: Request, res: Response) => {
  try {
    const { phone, email, name, channel, packageInterestId, optInStatus } = req.body;

    if (!phone) {
      return res.status(400).json({
        status: 'error',
        success: false,
        error: 'Phone number is required'
      });
    }

    const existing = db.subscribers.find(s => s.phone === phone);
    if (existing) {
      return res.status(400).json({
        status: 'error',
        success: false,
        error: 'Subscriber with this phone number already exists'
      });
    }

    const now = new Date().toISOString();
    const newSubscriber = {
      id: `sub-${Date.now()}`,
      phone,
      email: email || '',
      name: name || '',
      channel: channel || 'Others', // Default for admin added
      packageInterestId: packageInterestId || null,
      optInStatus: optInStatus !== undefined ? optInStatus : true,
      dateSubscribed: now,
      createdAt: now,
      updatedAt: now
    };

    db.subscribers.unshift(newSubscriber);
    db.saveToFile();

    res.status(201).json({
      status: 'success',
      success: true,
      message: 'Subscriber added successfully',
      data: newSubscriber
    });
  } catch (error) {
    console.error('❌ Error creating subscriber:', error);
    res.status(500).json({ status: 'error', success: false, error: 'Failed to create subscriber' });
  }
});

// ⚠️⚠️⚠️ BULK DELETE SUBSCRIBERS - MUST COME BEFORE SINGLE DELETE ⚠️⚠️⚠️
apiRouter.delete('/admin/subscribers/bulk-delete', authenticateJWT, (req: Request, res: Response) => {
  console.log('🔥🔥🔥 BULK DELETE SUBSCRIBERS ENDPOINT HIT! 🔥🔥🔥');
  console.log('📥 Request body:', req.body);
  
  try {
    // Accept both 'ids' and 'id' from request body
    const { ids, id } = req.body;
    
    // Handle both single ID and array of IDs
    let idsToDelete: string[] = [];
    if (ids && Array.isArray(ids)) {
      idsToDelete = ids;
    } else if (id) {
      idsToDelete = [id];
    } else {
      return res.status(400).json({ 
        status: 'error', 
        success: false, 
        error: 'No subscriber IDs provided' 
      });
    }
    
    console.log('📥 IDs to delete:', idsToDelete);
    console.log('📊 Current subscribers:', db.subscribers.map(s => ({ id: s.id, phone: s.phone })));
    
    let deletedCount = 0;
    const deletedIds = [];

    // Loop through subscribers backwards to safely delete
    for (let i = db.subscribers.length - 1; i >= 0; i--) {
      const subscriber = db.subscribers[i];
      const subscriberId = String(subscriber.id);
      
      // Check if this ID is in the delete list
      const shouldDelete = idsToDelete.some((idToDelete: string) => String(idToDelete) === subscriberId);
      
      if (shouldDelete) {
        console.log(`🗑️ Deleting subscriber: ${subscriberId} - ${subscriber.phone}`);
        deletedIds.push(subscriberId);
        db.subscribers.splice(i, 1);
        deletedCount++;
      }
    }

    db.saveToFile();

    console.log(`✅ Deleted ${deletedCount} subscribers`);

    if (deletedCount === 0) {
      return res.status(404).json({ 
        status: 'error', 
        success: false, 
        error: 'No matching subscribers found to delete' 
      });
    }

    res.json({
      status: 'success',
      success: true,
      message: `Deleted ${deletedCount} subscribers`,
      data: { 
        deletedCount,
        deletedIds 
      }
    });
  } catch (error) {
    console.error('❌ Error bulk deleting subscribers:', error);
    res.status(500).json({ 
      status: 'error', 
      success: false, 
      error: 'Failed to bulk delete subscribers' 
    });
  }
});

// DELETE single subscriber - MUST COME AFTER bulk-delete
apiRouter.delete('/admin/subscribers/:id', authenticateJWT, (req: Request, res: Response) => {
  try {
    const index = db.subscribers.findIndex(s => String(s.id) === String(req.params.id));
    if (index === -1) {
      return res.status(404).json({ status: 'error', success: false, error: 'Subscriber not found' });
    }

    db.deleteSubscriber(index);
    res.json({
      status: 'success',
      success: true,
      message: 'Subscriber deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting subscriber:', error);
    res.status(500).json({ status: 'error', success: false, error: 'Failed to delete subscriber' });
  }
});

// UPDATE subscriber
apiRouter.put('/admin/subscribers/:id', authenticateJWT, (req: Request, res: Response) => {
  try {
    const subscriber = db.subscribers.find(s => String(s.id) === String(req.params.id));
    if (!subscriber) {
      return res.status(404).json({ status: 'error', success: false, error: 'Subscriber not found' });
    }

    const { optInStatus, email, name, channel, packageInterestId } = req.body;

    if (optInStatus !== undefined) subscriber.optInStatus = optInStatus;
    if (email !== undefined) subscriber.email = email;
    if (name !== undefined) subscriber.name = name;
    if (channel !== undefined) subscriber.channel = channel;
    if (packageInterestId !== undefined) subscriber.packageInterestId = packageInterestId;
    
    subscriber.updatedAt = new Date().toISOString();
    db.saveToFile();

    res.json({
      status: 'success',
      success: true,
      message: 'Subscriber updated successfully',
      data: subscriber
    });
  } catch (error) {
    console.error('❌ Error updating subscriber:', error);
    res.status(500).json({ status: 'error', success: false, error: 'Failed to update subscriber' });
  }
});

// BULK IMPORT subscribers
apiRouter.post('/admin/subscribers/bulk', authenticateJWT, (req: Request, res: Response) => {
  try {
    const { subscribers } = req.body;
    
    if (!subscribers || !Array.isArray(subscribers) || subscribers.length === 0) {
      return res.status(400).json({
        status: 'error',
        success: false,
        error: 'No subscribers provided for import'
      });
    }

    let addedCount = 0;
    let updatedCount = 0;
    const now = new Date().toISOString();

    for (const sub of subscribers) {
      if (!sub.phone) continue;

      const existing = db.subscribers.find(s => s.phone === sub.phone);
      
      if (existing) {
        existing.email = sub.email || existing.email;
        existing.name = sub.name || existing.name;
        existing.channel = sub.channel || existing.channel;
        existing.packageInterestId = sub.packageInterestId || existing.packageInterestId;
        existing.optInStatus = true;
        existing.updatedAt = now;
        updatedCount++;
      } else {
        const newSubscriber = {
          id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          phone: sub.phone,
          email: sub.email || '',
          name: sub.name || '',
          channel: sub.channel || 'Bulk Import',
          packageInterestId: sub.packageInterestId || null,
          optInStatus: true,
          dateSubscribed: now,
          createdAt: now,
          updatedAt: now
        };
        db.subscribers.unshift(newSubscriber);
        addedCount++;
      }
    }

    db.saveToFile();

    res.json({
      status: 'success',
      success: true,
      message: `Imported ${addedCount} new subscribers, updated ${updatedCount} existing`,
      data: {
        added: addedCount,
        updated: updatedCount
      }
    });
  } catch (error) {
    console.error('❌ Error bulk importing subscribers:', error);
    res.status(500).json({ status: 'error', success: false, error: 'Failed to bulk import subscribers' });
  }
});

export default apiRouter;