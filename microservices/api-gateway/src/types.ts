export interface ServiceConfig {
  name: string;
  url: string;
  path: string;
  healthCheck?: string;
}

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
}

export interface GatewayStatus {
  gateway: string;
  status: 'healthy' | 'unhealthy';
  services: HealthCheckResult[];
  timestamp: Date;
}
