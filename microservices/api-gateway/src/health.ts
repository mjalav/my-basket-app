import axios from 'axios';
import { ServiceConfig, HealthCheckResult, GatewayStatus } from './types';
import { getAllServices } from './config';

export class HealthCheckService {
  async checkService(service: ServiceConfig): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const healthUrl = `${service.url}${service.healthCheck}`;
      const response = await axios.get(healthUrl, { timeout: 5000 });
      const responseTime = Date.now() - startTime;
      
      return {
        service: service.name,
        status: response.status === 200 ? 'healthy' : 'unhealthy',
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        service: service.name,
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async checkAllServices(): Promise<GatewayStatus> {
    const services = getAllServices();
    const healthChecks = await Promise.all(
      services.map(service => this.checkService(service))
    );

    const allHealthy = healthChecks.every(check => check.status === 'healthy');

    return {
      gateway: 'api-gateway',
      status: allHealthy ? 'healthy' : 'unhealthy',
      services: healthChecks,
      timestamp: new Date(),
    };
  }
}
