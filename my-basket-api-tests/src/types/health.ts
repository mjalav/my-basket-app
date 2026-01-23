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
