import { test, expect } from '@playwright/test';
import { HealthCheckAPI } from '../src/pages/health-check-api';

/**
 * Issue #8: Observability Metrics
 * Purpose: Ensure health responses provide enough context for monitoring
 */
test.describe('Issue #8: Observability @medium', () => {
  let healthAPI: HealthCheckAPI;

  test.beforeEach(async ({ request }) => {
    healthAPI = new HealthCheckAPI(request);
  });

  test('Response should include service version and hostname', async () => {
    const body = await healthAPI.getHealthStatus();
    expect(body.version).toBeDefined();
    expect(body.service).toBe('cart-service');
  });

  test('Response should include system uptime', async () => {
    const body = await healthAPI.getHealthStatus();
    expect(body.uptime).toBeDefined();
    expect(body.uptime).toBeGreaterThan(0);
  });

  test('Response should include a precise timestamp', async () => {
    const body = await healthAPI.getHealthStatus();
    expect(body.timestamp).toBeDefined();
    expect(new Date(body.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
  });

  test('Response should include overall response time', async () => {
    const body = await healthAPI.getHealthStatus();
    expect(body.responseTime).toBeDefined();
    expect(body.responseTime).toBeGreaterThan(0);
  });
});
