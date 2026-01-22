import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cart Service API',
      version: '1.0.0',
      description: 'API documentation for the Shopping Cart microservice',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Development server',
      },
      {
        url: 'http://localhost:3000',
        description: 'API Gateway',
      },
    ],
    tags: [
      {
        name: 'Cart',
        description: 'Shopping cart management endpoints',
      },
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
    ],
    components: {
      schemas: {
        CartItem: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'prod_123' },
            name: { type: 'string', example: 'Organic Bananas' },
            price: { type: 'number', example: 2.99 },
            description: { type: 'string', example: 'Fresh organic bananas' },
            image: { type: 'string', example: 'https://example.com/images/banana.jpg' },
            dataAiHint: { type: 'string', example: 'fruit, organic' },
            quantity: { type: 'number', example: 2 },
            addedAt: { type: 'string', format: 'date-time' },
          },
        },
        Cart: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cart_123' },
            userId: { type: 'string', example: 'user_123' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/CartItem' },
            },
            totalAmount: { type: 'number', example: 45.99 },
            totalItems: { type: 'number', example: 10 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AddToCartRequest: {
          type: 'object',
          required: ['productId'],
          properties: {
            productId: { type: 'string', example: 'prod_123' },
            quantity: { type: 'number', example: 1, default: 1 },
          },
        },
        UpdateCartItemRequest: {
          type: 'object',
          required: ['quantity'],
          properties: {
            quantity: { type: 'number', minimum: 0, example: 3 },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'array', items: { type: 'object' } },
          },
        },
        HealthCheckResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'unhealthy', 'degraded'] },
            service: { type: 'string' },
            version: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
            checks: {
              type: 'object',
              properties: {
                dependencies: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/DependencyHealth' },
                },
                resources: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ResourceHealth' },
                },
              },
            },
            responseTime: { type: 'number' },
            error: { type: 'string' },
          },
        },
        DependencyHealth: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            status: { type: 'string', enum: ['healthy', 'unhealthy', 'degraded'] },
            responseTime: { type: 'number' },
            error: { type: 'string' },
          },
        },
        ResourceHealth: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            status: { type: 'string', enum: ['healthy', 'unhealthy', 'degraded'] },
            value: { type: 'number' },
            limit: { type: 'number' },
            percentage: { type: 'number' },
            unit: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/routes.ts', './src/index.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Cart Service API Docs',
  }));
  
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
