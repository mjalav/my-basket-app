// Health Check Types
export type HealthStatus = 'healthy' | 'unhealthy' | 'degraded';

export interface DependencyHealth {
  name: string;
  status: HealthStatus;
  responseTime?: number;
  error?: string;
}

export interface ResourceHealth {
  name: string;
  status: HealthStatus;
  value: number;
  limit: number;
  percentage: number;
  unit: string;
}

export interface HealthCheckResponse {
  status: HealthStatus;
  service: string;
  version: string;
  timestamp: string;
  uptime: number;
  checks?: {
    dependencies?: DependencyHealth[];
    resources?: ResourceHealth[];
  };
  responseTime?: number;
  error?: string;
}

export type ErrorCategory = 
  | 'TIMEOUT' 
  | 'CONNECTION_REFUSED' 
  | 'NETWORK_TIMEOUT' 
  | 'SERVER_ERROR' 
  | 'NOT_FOUND' 
  | 'UNKNOWN';

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  dataAiHint: string;
}

export interface CartItem extends Product {
  quantity: number;
  addedAt: Date;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddToCartRequest {
  productId: string;
  quantity?: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CartSummary {
  totalItems: number;
  totalAmount: number;
  itemCount: number;
}
