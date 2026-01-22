/**
 * Health Check Type Definitions
 * TypeScript interfaces for Cart Service health check API responses
 */

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
  version?: string;
  timestamp: string;
  uptime?: number;
  checks?: {
    dependencies?: DependencyHealth[];
    resources?: ResourceHealth[];
  };
  responseTime?: number;
  error?: string;
}

export interface LivenessResponse {
  status: HealthStatus;
  service: string;
  timestamp: string;
  uptime?: number;
}

export interface ReadinessResponse extends HealthCheckResponse {
  // Readiness has same structure as full health check
}

export type ErrorCategory = 
  | 'TIMEOUT' 
  | 'CONNECTION_REFUSED' 
  | 'NETWORK_TIMEOUT' 
  | 'SERVER_ERROR' 
  | 'NOT_FOUND' 
  | 'UNKNOWN';

export interface ErrorResponse {
  error: string;
  category?: ErrorCategory;
  details?: any;
}

export interface TestConfig {
  cartServiceUrl: string;
  productServiceUrl: string;
  apiGatewayUrl: string;
  timeout: number;
  apiTimeout: number;
  logLevel: string;
}

export interface CacheTestData {
  timestamp: number;
  response: HealthCheckResponse;
  ttl: number;
}
