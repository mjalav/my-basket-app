import { ServiceConfig } from './types';

export const serviceConfig: ServiceConfig[] = [
  {
    name: 'product-service',
    url: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001',
    path: '/api/products',
    healthCheck: '/api/products/health',
  },
  {
    name: 'product-service',
    url: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001',
    path: '/api/categories',
    healthCheck: '/api/products/health',
  },
  {
    name: 'cart-service',
    url: process.env.CART_SERVICE_URL || 'http://localhost:3002',
    path: '/api/cart',
    healthCheck: '/api/cart/health',
  },
  {
    name: 'order-service',
    url: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
    path: '/api/orders',
    healthCheck: '/api/orders/health',
  },
  {
    name: 'ai-service',
    url: process.env.AI_SERVICE_URL || 'http://localhost:3004',
    path: '/api/recommendations',
    healthCheck: '/api/recommendations/health',
  },
];

export const getServiceByPath = (path: string): ServiceConfig | undefined => {
  return serviceConfig.find(service => path.startsWith(service.path));
};

export const getAllServices = (): ServiceConfig[] => {
  return serviceConfig;
};
