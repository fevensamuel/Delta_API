import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { apiRouter } from './src/backend/routes.js';
import { openApiSpec } from './src/backend/swagger.js';
import { initExchangeRateService } from './src/services/exchangeRateService.js';
import { initDatabase, testConnection } from './src/backend/database.js';
import fs from 'fs';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // ============================================================
  // DATABASE INITIALIZATION
  // ============================================================
  try {
    const connected = await testConnection();
    if (!connected) {
      throw new Error('PostgreSQL connection test failed');
    }
    await initDatabase();
    console.log('✅ Database initialization completed');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('⚠️  Server will continue running so migrations can retry on next request.');
    // Do NOT exit — let the server run so the migration can be retried
    // and so /health and error logs remain accessible.
  }

  // Initialize Exchange Rate Service
  initExchangeRateService();

  // ============================================================
  // CORS
  // ============================================================
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, '')) // strip trailing slash
    .filter(Boolean);

  console.log('🌐 Allowed CORS origins:', allowedOrigins.length ? allowedOrigins : '(none)');

  app.use(
    cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (curl, Postman, server-to-server)
        if (!origin) return callback(null, true);

        // If no origins configured, allow all (useful during setup)
        if (allowedOrigins.length === 0) return callback(null, true);

        const normalizedOrigin = origin.replace(/\/$/, '');
        if (allowedOrigins.includes(normalizedOrigin)) {
          return callback(null, true);
        }

        console.warn('❌ CORS blocked origin:', origin);
        // Do NOT throw — just refuse to add CORS headers.
        // The browser will block the response, but the server won't crash.
        return callback(null, false);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Range'],
      exposedHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges'],
      credentials: true,
    })
  );

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // ============================================================
  // UPLOADS DIRECTORY STRUCTURE
  // ============================================================
  const uploadPath = process.env.UPLOAD_PATH
    ? path.resolve(process.env.UPLOAD_PATH)
    : path.resolve(process.cwd(), 'uploads');

  const videosPath = path.join(uploadPath, 'videos');
  const imagesPath = path.join(uploadPath, 'images');
  const packagesPath = path.join(uploadPath, 'packages');
  const teamPath = path.join(uploadPath, 'team');
  const officePath = path.join(uploadPath, 'office');

  [uploadPath, videosPath, imagesPath, packagesPath, teamPath, officePath].forEach((dir) => {
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
  console.log('👤 Office directory:', officePath);

  // ============================================================
  // STATIC FILE SERVING
  // ============================================================
  const staticCors = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Range'
    );
    res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  };

  const setFileHeaders = (res: express.Response, filePath: string) => {
    if (filePath.endsWith('.mp4')) res.setHeader('Content-Type', 'video/mp4');
    else if (filePath.endsWith('.webm')) res.setHeader('Content-Type', 'video/webm');
    else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg'))
      res.setHeader('Content-Type', 'image/jpeg');
    else if (filePath.endsWith('.png')) res.setHeader('Content-Type', 'image/png');
    else if (filePath.endsWith('.webp')) res.setHeader('Content-Type', 'image/webp');
    else if (filePath.endsWith('.svg')) res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Access-Control-Allow-Origin', '*');
  };

  app.use('/uploads', staticCors);
  app.use('/uploads', express.static(uploadPath, { setHeaders: setFileHeaders }));

  app.use('/uploads/images', staticCors);
  app.use('/uploads/images', express.static(imagesPath, { setHeaders: setFileHeaders }));

  app.use('/uploads/videos', staticCors);
  app.use('/uploads/videos', express.static(videosPath, { setHeaders: setFileHeaders }));

  app.use('/uploads/packages', staticCors);
  app.use('/uploads/packages', express.static(packagesPath, { setHeaders: setFileHeaders }));

  app.use('/uploads/team', staticCors);
  app.use('/uploads/team', express.static(teamPath, { setHeaders: setFileHeaders }));

  app.use('/uploads/office', staticCors);
  app.use('/uploads/office', express.static(officePath, { setHeaders: setFileHeaders }));

  // ============================================================
  // HEALTH CHECKS
  // ============================================================
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Delta Travel API Backend', timestamp: new Date().toISOString() });
  });
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Delta Travel API Backend', timestamp: new Date().toISOString() });
  });

  // ============================================================
  // ROOT ENDPOINT
  // ============================================================
  app.get('/', (req, res) => {
    res.json({
      status: 'online',
      message: 'Delta Travel API is running',
      version: '1.0.0',
      documentation: `${req.protocol}://${req.get('host')}/api-docs`,
      endpoints: {
        public: [
          'GET /api/packages',
          'GET /api/packages/:id',
          'POST /api/packages/:id/click-whatsapp',
          'GET /api/gallery',
          'POST /api/subscribers',
          'POST /api/inquiries',
          'GET /api/exchange-rate',
          'GET /api/faqs',
          'GET /api/social-links',
          'GET /api/team-members',
          'GET /api/office-images',
          'GET /api/testimonials',
          'GET /api/health',
        ],
        auth: ['POST /api/admin/auth/login', 'GET /api/admin/auth/me'],
        admin: [
          'GET /api/admin/packages',
          'POST /api/admin/packages',
          'PUT /api/admin/packages/:id',
          'DELETE /api/admin/packages/:id',
          'GET /api/admin/gallery',
          'POST /api/admin/gallery',
          'POST /api/admin/gallery/bulk',
          'PUT /api/admin/gallery/:id',
          'DELETE /api/admin/gallery/:id',
          'GET /api/admin/inquiries',
          'PUT /api/admin/inquiries/:id',
          'DELETE /api/admin/inquiries/:id',
          'GET /api/admin/subscribers',
          'POST /api/admin/subscribers/bulk',
          'DELETE /api/admin/subscribers/bulk-delete',
          'POST /api/admin/sms/campaign',
          'GET /api/admin/sms/campaigns',
          'GET /api/admin/users',
          'POST /api/admin/users',
          'PUT /api/admin/users/:id',
          'DELETE /api/admin/users/:id',
          'GET /api/admin/exchange-rate',
          'POST /api/admin/exchange-rate',
          'GET /api/admin/dashboard/stats',
          'GET /api/admin/faqs',
          'POST /api/admin/faqs',
          'PUT /api/admin/faqs/:id',
          'DELETE /api/admin/faqs/:id',
          'GET /api/admin/social-links',
          'POST /api/admin/social-links',
          'PUT /api/admin/social-links/:id',
          'DELETE /api/admin/social-links/:id',
          'GET /api/admin/team-members',
          'POST /api/admin/team-members',
          'PUT /api/admin/team-members/:id',
          'DELETE /api/admin/team-members/:id',
          'GET /api/admin/office-images',
          'POST /api/admin/office-images',
          'PUT /api/admin/office-images/:id',
          'DELETE /api/admin/office-images/:id',
          'GET /api/admin/testimonials',
          'POST /api/admin/testimonials',
          'PUT /api/admin/testimonials/:id',
          'DELETE /api/admin/testimonials/:id',
        ],
      },
    });
  });

  // ============================================================
  // API ROUTES
  // ============================================================
  app.use('/api', apiRouter);

  // ============================================================
  // SWAGGER DOCS
  // ============================================================
  app.get('/api-docs/openapi.json', (req, res) => {
    res.json(openApiSpec);
  });
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      swaggerOptions: {
        defaultModelExpandDepth: 3,
        docExpansion: 'list',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    })
  );

  // ============================================================
  // ERROR HANDLING
  // ============================================================
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err?.name === 'MulterError') {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res
          .status(413)
          .json({ success: false, message: 'File too large. Maximum size is 500MB.' });
      }
      return res.status(400).json({ success: false, message: `Multer error: ${err.message}` });
    }
    if (err?.message === 'Only images and videos are allowed') {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  });

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  });

  // ============================================================
  // START SERVER
  // ============================================================
  app.listen(PORT, '0.0.0.0', () => {
    console.log('=======================================================');
    console.log(`✈️ Delta Travel & Tour Server running on http://0.0.0.0:${PORT}`);
    console.log(`📄 Swagger OpenAPI Docs available at http://0.0.0.0:${PORT}/api-docs`);
    console.log(`📊 API Root JSON available at http://0.0.0.0:${PORT}/`);
    console.log(`📁 Uploads directory: ${uploadPath}`);
    console.log('=======================================================');
  });
}

startServer();