import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import { serviceConfig } from './config';
import { HealthCheckService } from './health';
import { setupSwagger } from './swagger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const healthCheckService = new HealthCheckService();

// Rate limiting - relaxed for development, strict for production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 1000 : 1000000, // Effectively unlimited for development/testing
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(limiter);

// Setup Swagger documentation
setupSwagger(app);

// Only parse JSON for non-proxied routes
app.use((req, res, next) => {
  // Skip JSON parsing for proxied routes
  const isProxiedRoute = serviceConfig.some(service => req.path.startsWith(service.path));
  if (isProxiedRoute) {
    return next();
  }
  // Placeholder for request body validation (future endpoints)
  // Example: if (req.body) { /* validate with Zod or similar */ }
  return express.json()(req, res, next);
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check for all services
 *     description: Check the health status of the API Gateway and all microservices
 *     tags: [Gateway]
 *     responses:
 *       200:
 *         description: All services are healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthStatus'
 *       503:
 *         description: One or more services are unhealthy
 */
app.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    const healthStatus = await healthCheckService.checkAllServices();
    res.status(healthStatus.status === 'healthy' ? 200 : 503).json(healthStatus);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      gateway: 'api-gateway',
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date(),
    });
  }
});

/**
 * @swagger
 * /info:
 *   get:
 *     summary: Gateway information
 *     description: Get information about the API Gateway and available services
 *     tags: [Gateway]
 *     responses:
 *       200:
 *         description: Gateway information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GatewayInfo'
 */
app.get('/info', (req: express.Request, res: express.Response) => {
  res.json({
    gateway: 'api-gateway',
    version: '1.0.0',
    services: serviceConfig.map(service => ({
      name: service.name,
      path: service.path,
    })),
    timestamp: new Date(),
  });
});

// Proxy setup for each service
serviceConfig.forEach(service => {
  // Avoid logging full URLs and paths to prevent potential PII leakage
  console.log(`Setting up proxy for ${service.name}`);
  
  const proxyOptions = {
    target: service.url,
    changeOrigin: true,
    logLevel: 'debug' as const,
    pathRewrite: (path: string, req: any) => {
      // Avoid logging full proxy paths
      console.log(`Proxying request for ${service.name}`);
      return path;
    },
    onError: (err: any, req: any, res: any) => {
      // Log only error message, not full error object
      console.error(`Proxy error for ${service.name}:`, err.message);
      if (!res.headersSent) {
        res.status(503).json({
          error: 'Service temporarily unavailable',
          service: service.name,
          message: err.message,
        });
      }
    },
    timeout: 30000,
  };

  app.use(service.path, createProxyMiddleware(proxyOptions));
  console.log(`Proxy middleware registered for path: ${service.path}`);
});

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    availableServices: serviceConfig.map(service => service.path),
  });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Log only error message, not full error object
  console.error('Global error handler:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  // Avoid logging full URLs and paths to prevent potential PII leakage
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Available services:');
  serviceConfig.forEach(service => {
    console.log(`- ${service.name}`);
  });
  console.log(`Health check: /health`);
  console.log(`API Docs: /api-docs`);
});
