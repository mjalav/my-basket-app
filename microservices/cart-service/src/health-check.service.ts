import { HealthCheckResponse, DependencyHealth, ResourceHealth, HealthStatus } from './types';
import { ProductServiceClient } from './product-client';
import { CartService } from './service';
import os from 'os';

export class HealthCheckService {
  private productClient: ProductServiceClient;
  private readonly version: string = '1.0.0';
  private readonly appStartTime: number;
  
  // Cache for health check results
  private cache: {
    readiness?: { timestamp: number; data: HealthCheckResponse };
    liveness?: { timestamp: number; data: HealthCheckResponse };
  } = {};
  
  private readonly CACHE_TTL_READINESS = 30000; // 30 seconds
  private readonly CACHE_TTL_LIVENESS = 60000; // 60 seconds

  constructor() {
    this.productClient = new ProductServiceClient();
    this.appStartTime = Date.now();
  }

  /**
   * Simple liveness check
   */
  async checkLiveness(): Promise<HealthCheckResponse> {
    const now = Date.now();
    if (this.cache.liveness && (now - this.cache.liveness.timestamp < this.CACHE_TTL_LIVENESS)) {
      return this.cache.liveness.data;
    }

    const response: HealthCheckResponse = {
      status: 'healthy',
      service: 'cart-service',
      version: this.version,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((now - this.appStartTime) / 1000),
    };

    this.cache.liveness = { timestamp: now, data: response };
    return response;
  }

  /**
   * Readiness check with dependencies and resources
   */
  async checkReadiness(cartService: CartService): Promise<HealthCheckResponse> {
    const now = Date.now();
    if (this.cache.readiness && (now - this.cache.readiness.timestamp < this.CACHE_TTL_READINESS)) {
      return this.cache.readiness.data;
    }

    const startTime = Date.now();
    const dependencies: DependencyHealth[] = [];
    const resources: ResourceHealth[] = [];
    let overallStatus: HealthStatus = 'healthy';

    // 1. Check Product Service Dependency
    const productHealthStartTime = Date.now();
    try {
      const isProductHealthy = await this.productClient.checkHealth();
      const productHealth: DependencyHealth = {
        name: 'product-service',
        status: isProductHealthy ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - productHealthStartTime,
      };
      if (!isProductHealthy) {
        productHealth.error = 'Product service unreachable or unhealthy';
        overallStatus = 'unhealthy';
      }
      dependencies.push(productHealth);
    } catch (error: any) {
      dependencies.push({
        name: 'product-service',
        status: 'unhealthy',
        responseTime: Date.now() - productHealthStartTime,
        error: error.message,
      });
      overallStatus = 'unhealthy';
    }

    // 2. Check Resources - Memory
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = process.memoryUsage().heapUsed;
    const heapLimit = process.memoryUsage().heapTotal;
    const memPercentage = Math.round((usedMem / heapLimit) * 100);

    const memoryHealth: ResourceHealth = {
      name: 'memory',
      status: memPercentage > 90 ? 'unhealthy' : (memPercentage > 80 ? 'degraded' : 'healthy'),
      value: Math.round(usedMem / 1024 / 1024),
      limit: Math.round(heapLimit / 1024 / 1024),
      percentage: memPercentage,
      unit: 'MB',
    };
    if (memoryHealth.status === 'unhealthy') overallStatus = 'unhealthy';
    else if (memoryHealth.status === 'degraded' && overallStatus === 'healthy') overallStatus = 'degraded';
    resources.push(memoryHealth);

    // 3. Check Resources - Cart Count
    // For this demonstration, we'll assume a limit of 10000 carts
    const cartCount = (cartService as any).carts?.size || 0;
    const cartLimit = 10000;
    const cartPercentage = Math.round((cartCount / cartLimit) * 100);

    const cartHealth: ResourceHealth = {
      name: 'carts',
      status: cartCount > cartLimit ? 'degraded' : 'healthy',
      value: cartCount,
      limit: cartLimit,
      percentage: cartPercentage,
      unit: 'count',
    };
    if (cartHealth.status === 'degraded' && overallStatus === 'healthy') overallStatus = 'degraded';
    resources.push(cartHealth);

    const response: HealthCheckResponse = {
      status: overallStatus,
      service: 'cart-service',
      version: this.version,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((now - this.appStartTime) / 1000),
      checks: {
        dependencies,
        resources,
      },
      responseTime: Date.now() - startTime,
    };

    this.cache.readiness = { timestamp: now, data: response };
    return response;
  }

  /**
   * Comprehensive health check (same as readiness for now)
   */
  async checkHealth(cartService: CartService): Promise<HealthCheckResponse> {
    return this.checkReadiness(cartService);
  }
}
