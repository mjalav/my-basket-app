import { test, expect } from '@playwright/test';
import { HealthCheckAPI } from '../src/pages/health-check-api';

/**
 * Issue #4: Resource Monitoring
 * Purpose: Ensure service monitors its own resource consumption
 */
test.describe('Issue #4: Resource Monitoring @high', () => {
  let healthAPI: HealthCheckAPI;

  test.beforeEach(async ({ request }) => {
    healthAPI = new HealthCheckAPI(request);
  });

  test('Health check should include memory metrics', async () => {
    const body = await healthAPI.getHealthStatus();
    const memoryRes = body.checks?.resources?.find(r => r.name === 'memory');
    
    expect(memoryRes).toBeDefined();
    expect(memoryRes?.value).toBeDefined();
    expect(memoryRes?.limit).toBeDefined();
    expect(memoryRes?.unit).toBe('MB');
  });

  test('Health check should include cart count', async () => {
    const body = await healthAPI.getHealthStatus();
    const cartRes = body.checks?.resources?.find(r => r.name === 'carts');
    
    expect(cartRes).toBeDefined();
    expect(cartRes?.value).toBeGreaterThanOrEqual(0);
    expect(cartRes?.limit).toBeDefined();
  });

  test('Service should report unhealthy if memory exceeds 80%', async () => {
    const body = await healthAPI.getHealthStatus();
    const memoryRes = body.checks?.resources?.find(r => r.name === 'memory');
    
    if (memoryRes && memoryRes.percentage > 80) {
      expect(memoryRes.status).toBe('unhealthy');
      expect(body.status).toBe('unhealthy');
    } else if (memoryRes) {
      expect(memoryRes.status).toBe('healthy');
    }
  });

  test('Service should report degraded if cart count exceeds limit', async () => {
    const body = await healthAPI.getHealthStatus();
    const cartRes = body.checks?.resources?.find(r => r.name === 'carts');
    
    if (cartRes && cartRes.value > cartRes.limit) {
      expect(['degraded', 'unhealthy']).toContain(cartRes.status);
    }
  });
});
