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

  // API Routes
  app.use('/api', apiRouter);

  // Swagger Documentation
  app.get('/api-docs/openapi.json', (req, res) => {
    res.json(openApiSpec);
  });
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

  // Vite middleware for SPA development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`✈️ Delta Travel & Tour Server running on http://0.0.0.0:${PORT}`);
    console.log(`📄 Swagger OpenAPI Docs available at http://0.0.0.0:${PORT}/api-docs`);
    console.log(`=======================================================`);
  });
}

startServer();
