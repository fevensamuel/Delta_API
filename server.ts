import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/backend/routes.js';
import { openApiSpec } from './src/backend/swagger.js';
import { initExchangeRateService } from './src/services/exchangeRateService.js';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize Exchange Rate Service (Initial fetch + 1-hour background refresh timer)
  initExchangeRateService();

  // Security & Permissive CORS for external frontend integration
  const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : '*';
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
  app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Health checks
  const uploadPath = path.resolve(process.env.UPLOAD_PATH || './uploads');
  app.use('/uploads', express.static(uploadPath));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Delta Travel API Backend', timestamp: new Date().toISOString() });
  });
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Delta Travel API Backend', timestamp: new Date().toISOString() });
  });

  // ============================================
  // ROOT ENDPOINT - JSON API Response
  // ============================================
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
          "GET /api/admin/dashboard/stats"
        ]
      }
    });
  });

  // API Routes
  app.use('/api', apiRouter);

  // Swagger Documentation
  app.get('/api-docs/openapi.json', (req, res) => {
    res.json(openApiSpec);
  });
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

  // ============================================
  // REMOVED: Vite middleware and static SPA serving
  // The root route now returns JSON instead of HTML
  // ============================================

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`✈️ Delta Travel & Tour Server running on http://0.0.0.0:${PORT}`);
    console.log(`📄 Swagger OpenAPI Docs available at http://0.0.0.0:${PORT}/api-docs`);
    console.log(`📊 API Root JSON available at http://0.0.0.0:${PORT}/`);
    console.log(`=======================================================`);
  });
}

startServer();