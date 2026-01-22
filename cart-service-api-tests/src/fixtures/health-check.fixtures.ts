import { HealthCheckResponse, DependencyHealth, ResourceHealth } from '../types/health-check.types';

/**
 * Test Fixtures
 * Provides reusable test data for health check tests
 */

export const healthCheckFixtures = {
  /**
   * Valid healthy response
   */
  healthyResponse: {
    status: 'healthy' as const,
    service: 'cart-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: 3600,
    checks: {
      dependencies: [
        {
          name: 'product-service',
          status: 'healthy' as const,
          responseTime: 45,
        },
      ],
      resources: [
        {
          name: 'memory',
          status: 'healthy' as const,
          value: 128,
          limit: 512,
          percentage: 25,
          unit: 'MB',
        },
        {
          name: 'carts',
          status: 'healthy' as const,
          value: 150,
          limit: 10000,
          percentage: 1,
          unit: 'count',
        },
      ],
    },
    responseTime: 52,
  } as HealthCheckResponse,

  /**
   * Unhealthy response (dependency down)
   */
  unhealthyResponseDependencyDown: {
    status: 'unhealthy' as const,
    service: 'cart-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: 3600,
    checks: {
      dependencies: [
        {
          name: 'product-service',
          status: 'unhealthy' as const,
          error: 'Connection refused',
        },
      ],
      resources: [
        {
          name: 'memory',
          status: 'healthy' as const,
          value: 128,
          limit: 512,
          percentage: 25,
          unit: 'MB',
        },
      ],
    },
    responseTime: 2050,
  } as HealthCheckResponse,

  /**
   * Degraded response (high memory usage)
   */
  degradedResponseHighMemory: {
    status: 'degraded' as const,
    service: 'cart-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: 3600,
    checks: {
      dependencies: [
        {
          name: 'product-service',
          status: 'healthy' as const,
          responseTime: 45,
        },
      ],
      resources: [
        {
          name: 'memory',
          status: 'degraded' as const,
          value: 450,
          limit: 512,
          percentage: 88,
          unit: 'MB',
        },
        {
          name: 'carts',
          status: 'healthy' as const,
          value: 150,
          limit: 10000,
          percentage: 1,
          unit: 'count',
        },
      ],
    },
    responseTime: 52,
  } as HealthCheckResponse,

  /**
   * Degraded response (high cart count)
   */
  degradedResponseHighCartCount: {
    status: 'degraded' as const,
    service: 'cart-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: 3600,
    checks: {
      dependencies: [
        {
          name: 'product-service',
          status: 'healthy' as const,
          responseTime: 45,
        },
      ],
      resources: [
        {
          name: 'memory',
          status: 'healthy' as const,
          value: 128,
          limit: 512,
          percentage: 25,
          unit: 'MB',
        },
        {
          name: 'carts',
          status: 'degraded' as const,
          value: 11000,
          limit: 10000,
          percentage: 110,
          unit: 'count',
        },
      ],
    },
    responseTime: 52,
  } as HealthCheckResponse,
};

export const dependencyFixtures = {
  /**
   * Healthy dependency
   */
  healthyDependency: {
    name: 'product-service',
    status: 'healthy' as const,
    responseTime: 45,
  } as DependencyHealth,

  /**
   * Unhealthy dependency (connection refused)
   */
  unhealthyDependencyConnectionRefused: {
    name: 'product-service',
    status: 'unhealthy' as const,
    error: 'Connection refused (ECONNREFUSED)',
  } as DependencyHealth,

  /**
   * Unhealthy dependency (timeout)
   */
  unhealthyDependencyTimeout: {
    name: 'product-service',
    status: 'unhealthy' as const,
    error: 'Request timeout after 2000ms',
  } as DependencyHealth,

  /**
   * Unhealthy dependency (500 error)
   */
  unhealthyDependencyServerError: {
    name: 'product-service',
    status: 'unhealthy' as const,
    error: 'Server error (500)',
  } as DependencyHealth,
};

export const resourceFixtures = {
  /**
   * Healthy memory
   */
  healthyMemory: {
    name: 'memory',
    status: 'healthy' as const,
    value: 128,
    limit: 512,
    percentage: 25,
    unit: 'MB',
  } as ResourceHealth,

  /**
   * Degraded memory (80%+)
   */
  degradedMemory: {
    name: 'memory',
    status: 'degraded' as const,
    value: 450,
    limit: 512,
    percentage: 88,
    unit: 'MB',
  } as ResourceHealth,

  /**
   * Unhealthy memory (95%+)
   */
  unhealthyMemory: {
    name: 'memory',
    status: 'unhealthy' as const,
    value: 500,
    limit: 512,
    percentage: 98,
    unit: 'MB',
  } as ResourceHealth,

  /**
   * Healthy cart count
   */
  healthyCartCount: {
    name: 'carts',
    status: 'healthy' as const,
    value: 150,
    limit: 10000,
    percentage: 1,
    unit: 'count',
  } as ResourceHealth,

  /**
   * Degraded cart count (over limit)
   */
  degradedCartCount: {
    name: 'carts',
    status: 'degraded' as const,
    value: 11000,
    limit: 10000,
    percentage: 110,
    unit: 'count',
  } as ResourceHealth,
};

export const timeoutValues = {
  productServiceTimeout: 5000, // 5 seconds
  healthCheckTimeout: 2000, // 2 seconds
  livenessTimeout: 1000, // 1 second
  readinessTimeout: 10000, // 10 seconds
  cacheTimeout: 30000, // 30 seconds
  livenessCacheTimeout: 60000, // 60 seconds
};

export const errorMessages = {
  connectionRefused: 'Connection refused (ECONNREFUSED)',
  timeout: 'Request timeout',
  serverError: 'Server error',
  notFound: 'Not found',
  networkError: 'Network error',
};
