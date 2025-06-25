import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import { serviceConfig } from './config';
import { HealthCheckService } from './health';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const healthCheckService = new HealthCheckService();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(limiter);

// Only parse JSON for non-proxied routes
app.use((req, res, next) => {
  // Skip JSON parsing for proxied routes
  const isProxiedRoute = serviceConfig.some(service => req.path.startsWith(service.path));
  if (isProxiedRoute) {
    return next();
  }
  return express.json()(req, res, next);
});

// Health check endpoint
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

// Gateway info endpoint
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
  console.log(`Setting up proxy for ${service.name}: ${service.path} -> ${service.url}`);
  
  const proxyOptions = {
    target: service.url,
    changeOrigin: true,
    logLevel: 'debug' as const,
    pathRewrite: (path: string, req: any) => {
      console.log(`Proxying ${service.name}: ${path} -> ${service.url}${path}`);
      return path;
    },
    onError: (err: any, req: any, res: any) => {
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
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Available services:');
  serviceConfig.forEach(service => {
    console.log(`- ${service.name}: ${service.path} -> ${service.url}`);
  });
  console.log(`Health check: http://localhost:${PORT}/health`);
});
