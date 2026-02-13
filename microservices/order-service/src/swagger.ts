import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Order Service API',
      version: '1.0.0',
      description: 'API documentation for the Order Management microservice',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3003',
        description: 'Development server',
      },
      {
        url: 'http://localhost:3000',
        description: 'API Gateway',
      },
    ],
    tags: [
      {
        name: 'Orders',
        description: 'Order management endpoints',
      },
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
    ],
    components: {
      schemas: {
        Address: {
          type: 'object',
          required: ['street', 'city', 'state', 'zipCode', 'country'],
          properties: {
            street: { type: 'string', example: '123 Main St' },
            city: { type: 'string', example: 'New York' },
            state: { type: 'string', example: 'NY' },
            zipCode: { type: 'string', example: '10001' },
            country: { type: 'string', example: 'USA' },
          },
        },
        PaymentMethod: {
          type: 'object',
          required: ['type'],
          properties: {
            type: {
              type: 'string',
              enum: ['credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay'],
              example: 'credit_card',
            },
            last4: { type: 'string', example: '4242' },
            brand: { type: 'string', example: 'Visa' },
          },
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'prod_123' },
            name: { type: 'string', example: 'Organic Bananas' },
            price: { type: 'number', example: 2.99 },
            quantity: { type: 'number', example: 2 },
            image: { type: 'string' },
            description: { type: 'string' },
            dataAiHint: { type: 'string' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'order_123' },
            userId: { type: 'string', example: 'user_123' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/OrderItem' },
            },
            totalAmount: { type: 'number', example: 45.99 },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
              example: 'pending',
            },
            shippingAddress: { $ref: '#/components/schemas/Address' },
            billingAddress: { $ref: '#/components/schemas/Address' },
            paymentMethod: { $ref: '#/components/schemas/PaymentMethod' },
            trackingNumber: { type: 'string' },
            estimatedDelivery: { type: 'string', format: 'date-time' },
            actualDelivery: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateOrderRequest: {
          type: 'object',
          required: ['items', 'shippingAddress', 'billingAddress', 'paymentMethod'],
          properties: {
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/OrderItem' },
            },
            shippingAddress: { $ref: '#/components/schemas/Address' },
            billingAddress: { $ref: '#/components/schemas/Address' },
            paymentMethod: { $ref: '#/components/schemas/PaymentMethod' },
          },
        },
        OrderList: {
          type: 'object',
          properties: {
            orders: {
              type: 'array',
              items: { $ref: '#/components/schemas/Order' },
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                page: { type: 'number' },
                limit: { type: 'number' },
                totalPages: { type: 'number' },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'array', items: { type: 'object' } },
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
    customSiteTitle: 'Order Service API Docs',
  }));
  
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
