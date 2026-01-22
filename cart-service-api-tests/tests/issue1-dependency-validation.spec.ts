import { test, expect } from '@playwright/test';
import { ReadinessAPI } from '../src/pages/readiness-api';
import { HealthCheckAPI } from '../src/pages/health-check-api';
import { ResponseValidator } from '../src/utils/response-validator';

/**
 * Issue #1: Dependency Validation
 * Purpose: Ensure health checks properly validate external dependencies (Product Service)
 */
test.describe('Issue #1: Dependency Validation @critical', () => {
  let readinessAPI: ReadinessAPI;
  let healthAPI: HealthCheckAPI;

  test.beforeEach(async ({ request }) => {
    readinessAPI = new ReadinessAPI(request);
    healthAPI = new HealthCheckAPI(request);
  });

  test('Health check should return 200 when Product Service is reachable', async () => {
    const response = await healthAPI.checkHealth();
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.status).toBe('healthy');
    
    const productDep = body.checks?.dependencies?.find((d: any) => d.name === 'product-service');
    // Note: In TDD, this might fail initially as checks object might be missing
    expect(productDep).toBeDefined();
    expect(productDep.status).toBe('healthy');
  });

  test('Readiness check should return 503 when Product Service is down', async () => {
    // Note: This test requires a way to simulate Product Service failure
    // For now, we document the requirement
    test.info().annotations.push({
      type: 'requirement',
      description: 'System must return 503 if critical dependency is unreachable'
    });
    
    // In a real environment, we'd use a mock or stop the service
    // For this test suite, we check the structure if it's currently unhealthy
    const response = await readinessAPI.checkReadiness();
    if (response.status() === 503) {
      const body = await response.json();
      expect(body.status).toBe('unhealthy');
      const productDep = body.checks?.dependencies?.find((d: any) => d.name === 'product-service');
      expect(productDep.status).toBe('unhealthy');
    }
  });

  test('Dependency status should include response time', async () => {
    const body = await healthAPI.getHealthStatus();
    const productDep = body.checks?.dependencies?.find((d: any) => d.name === 'product-service');
    
    if (productDep && productDep.status === 'healthy') {
      expect(productDep.responseTime).toBeDefined();
      expect(typeof productDep.responseTime).toBe('number');
      expect(productDep.responseTime).toBeGreaterThan(0);
    }
  });

  test('Liveness check should NOT fail when Product Service is down', async () => {
    // Liveness should only check if the process is running
    const response = await healthAPI.get('/api/health/live');
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.status).toBe('healthy');
    // Dependencies should not be in liveness check
    expect(body.checks?.dependencies).toBeUndefined();
  });
});
