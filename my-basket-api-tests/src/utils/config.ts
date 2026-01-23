import dotenv from 'dotenv';
import path from 'path';

// Load .env file from the root of the test project
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  endpoints: {
    gateway: '',
    product: '/api/products',
    cart: '/api/cart',
    order: '/api/orders',
    ai: '/api/recommendations',
  },
  services: {
    product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001',
    cart: process.env.CART_SERVICE_URL || 'http://localhost:3002',
    order: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
    ai: process.env.AI_SERVICE_URL || 'http://localhost:3004',
  },
  timeout: parseInt(process.env.TIMEOUT || '30000', 10),
};
