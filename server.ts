import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { apiRouter } from './src/backend/routes.js';
import { openApiSpec } from './src/backend/swagger.js';
import { initExchangeRateService } from './src/services/exchangeRateService.js';
import multer from 'multer';
import fs from 'fs';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize Exchange Rate Service
  initExchangeRateService();

  // Security & Permissive CORS
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) 
    : [
      'http://localhost:5173',
      'http://localhost:5174',           
      'http://localhost:3000',
      'https://delta-admin-beta.vercel.app',        
      'https://delta-public-website.vercel.app',    
      'https://delta-travel-backend.onrender.com'
      ];
  
  // CORS for API routes
  app.use(cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('❌ Blocked by CORS:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Range'],
    exposedHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges'],
    credentials: true
  }));
  
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // ============================================================
  // UPLOADS DIRECTORY STRUCTURE
  // ============================================================
  const uploadPath = path.resolve(process.env.UPLOAD_PATH || './uploads');
  const videosPath = path.join(uploadPath, 'videos');
  const imagesPath = path.join(uploadPath, 'images');
  const packagesPath = path.join(uploadPath, 'packages');
  const teamPath = path.join(uploadPath, 'team');

  // Create all directories
[uploadPath, videosPath, imagesPath, packagesPath, teamPath].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

  console.log('📁 Uploads directory:', uploadPath);
  console.log('📹 Videos directory:', videosPath);
  console.log('🖼️ Images directory:', imagesPath);
  console.log('📦 Packages directory:', packagesPath);
  console.log('👤 Team directory:', teamPath);

  // ============================================================
  // CORS MIDDLEWARE FOR STATIC FILES
  // ============================================================
  const staticCors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
    res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  };

  // ============================================================
  // STATIC FILE SERVING
  // ============================================================
  
  // Main uploads folder
  app.use('/uploads', staticCors);
app.use('/uploads', express.static(uploadPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.mp4')) res.setHeader('Content-Type', 'video/mp4');
    else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) res.setHeader('Content-Type', 'image/jpeg');
    else if (filePath.endsWith('.png')) res.setHeader('Content-Type', 'image/png');
    else if (filePath.endsWith('.webp')) res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// Images folder
app.use('/uploads/images', staticCors);
app.use('/uploads/images', express.static(imagesPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) res.setHeader('Content-Type', 'image/jpeg');
    else if (filePath.endsWith('.png')) res.setHeader('Content-Type', 'image/png');
    else if (filePath.endsWith('.webp')) res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// Videos folder
app.use('/uploads/videos', staticCors);
app.use('/uploads/videos', express.static(videosPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.mp4')) res.setHeader('Content-Type', 'video/mp4');
    else if (filePath.endsWith('.webm')) res.setHeader('Content-Type', 'video/webm');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// Packages folder
app.use('/uploads/packages', staticCors);
app.use('/uploads/packages', express.static(packagesPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) res.setHeader('Content-Type', 'image/jpeg');
    else if (filePath.endsWith('.png')) res.setHeader('Content-Type', 'image/png');
    else if (filePath.endsWith('.webp')) res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// Team folder - ADD THIS
app.use('/uploads/team', staticCors);
app.use('/uploads/team', express.static(teamPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) res.setHeader('Content-Type', 'image/jpeg');
    else if (filePath.endsWith('.png')) res.setHeader('Content-Type', 'image/png');
    else if (filePath.endsWith('.webp')) res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

  //Logo
app.use('/uploads', staticCors);
app.use('/uploads', express.static(uploadPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.png')) res.setHeader('Content-Type', 'image/png');
    else if (filePath.endsWith('.svg')) res.setHeader('Content-Type', 'image/svg+xml');
    else if (filePath.endsWith('.webp')) res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

  // ============================================================
  // MULTER CONFIGURATION
  // ============================================================
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Use mimetype to determine destination
      if (file.mimetype.startsWith('video/')) {
        console.log(`🎬 Saving video to: ${videosPath}`);
        cb(null, videosPath);
      } else if (file.mimetype.startsWith('image/')) {
        console.log(`🖼️ Saving image to: ${imagesPath}`);
        cb(null, imagesPath);
      } else {
        console.log(`📁 Saving to default: ${imagesPath}`);
        cb(null, imagesPath);
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_');
      cb(null, uniqueSuffix + '-' + sanitizedName);
    }
  });

  const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only images and videos are allowed'));
      }
    }
  });

  // Make upload available in routes
  app.use((req, res, next) => {
    (req as any).upload = upload;
    next();
  });

  // Health checks
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Delta Travel API Backend', timestamp: new Date().toISOString() });
  });
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Delta Travel API Backend', timestamp: new Date().toISOString() });
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      status: "online",
      message: "Delta Travel API is running",
      version: "1.0.0",
      documentation: `${req.protocol}://${req.get('host')}/api-docs`,
      endpoints: {
        public: [
          "GET /api/packages",
          "GET /api/packages/:id",
          "POST /api/packages/:id/click-whatsapp",
          "GET /api/gallery",
          "POST /api/subscribers",
          "POST /api/inquiries",
          "GET /api/exchange-rate",
          "GET /api/faqs",
          "GET /api/social-links",
          "GET /api/team-members",
          "GET /api/health"
        ],
        auth: [
          "POST /api/admin/auth/login",
          "GET /api/admin/auth/me"
        ],
        admin: [
          "GET /api/admin/packages",
          "POST /api/admin/packages",
          "PUT /api/admin/packages/:id",
          "DELETE /api/admin/packages/:id",
          "GET /api/admin/gallery",
          "POST /api/admin/gallery",
          "POST /api/admin/gallery/bulk",
          "PUT /api/admin/gallery/:id",
          "DELETE /api/admin/gallery/:id",
          "GET /api/admin/inquiries",
          "PUT /api/admin/inquiries/:id",
          "DELETE /api/admin/inquiries/:id",
          "GET /api/admin/subscribers",
          "POST /api/admin/subscribers/bulk",
          "DELETE /api/admin/subscribers/bulk-delete",
          "POST /api/admin/sms/campaign",
          "GET /api/admin/sms/campaigns",
          "GET /api/admin/users",
          "POST /api/admin/users",
          "PUT /api/admin/users/:id",
          "DELETE /api/admin/users/:id",
          "GET /api/admin/exchange-rate",
          "POST /api/admin/exchange-rate",
          "GET /api/admin/dashboard/stats",
          "GET /api/admin/faqs",
          "POST /api/admin/faqs",
          "PUT /api/admin/faqs/:id",
          "DELETE /api/admin/faqs/:id",
          "GET /api/admin/social-links",
          "POST /api/admin/social-links",
          "PUT /api/admin/social-links/:id",
          "DELETE /api/admin/social-links/:id",
          "GET /api/admin/team-members",
          "POST /api/admin/team-members",
          "PUT /api/admin/team-members/:id",
          "DELETE /api/admin/team-members/:id"
        ]
      }
    });
  });

  // API Routes
  app.use('/api', apiRouter);

  // Swagger Documentation - UPDATED with better Swagger UI options
  app.get('/api-docs/openapi.json', (req, res) => {
    res.json(openApiSpec);
  });
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
    swaggerOptions: {
      defaultModelExpandDepth: 3,
      docExpansion: 'list',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      persistAuthorization: true,
      displayRequestDuration: true
    }
  }));

  // Error handling middleware for multer
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'FILE_TOO_LARGE') {
        return res.status(413).json({ success: false, message: 'File too large. Maximum size is 500MB.' });
      }
      return res.status(400).json({ success: false, message: `Multer error: ${err.message}` });
    }
    if (err.message === 'Only images and videos are allowed') {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  });

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`✈️ Delta Travel & Tour Server running on http://0.0.0.0:${PORT}`);
    console.log(`📄 Swagger OpenAPI Docs available at http://0.0.0.0:${PORT}/api-docs`);
    console.log(`📊 API Root JSON available at http://0.0.0.0:${PORT}/`);
    console.log(`📁 Uploads directory: ${uploadPath}`);
    console.log(`📹 Videos directory: ${videosPath}`);
    console.log(`🖼️ Images directory: ${imagesPath}`);
    console.log(`📦 Packages directory: ${packagesPath}`);
    console.log(`👤 Team directory: ${teamPath}`);
    console.log(`=======================================================`);
  });
}

startServer();