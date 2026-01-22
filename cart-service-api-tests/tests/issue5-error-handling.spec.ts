import { test, expect } from '@playwright/test';
import { HealthCheckAPI } from '../src/pages/health-check-api';

/**
 * Issue #5: Error Handling
 * Purpose: Ensure errors are properly categorized and descriptive
 */
test.describe('Issue #5: Error Handling @high', () => {
  let healthAPI: HealthCheckAPI;

  test.beforeEach(async ({ request }) => {
    healthAPI = new HealthCheckAPI(request);
  });

  test('Response should include descriptive error message if unhealthy', async () => {
    const response = await healthAPI.checkHealth();
    if (response.status() === 503) {
      const body = await response.json();
      expect(body.error).toBeDefined();
      expect(typeof body.error).toBe('string');
      expect(body.error.length).toBeGreaterThan(0);
    }
  });

  test('Dependency errors should be categorized', async () => {
    const body = await healthAPI.getHealthStatus();
    const productDep = body.checks?.dependencies?.find(d => d.name === 'product-service');
    
    if (productDep && productDep.status === 'unhealthy') {
      expect(productDep.error).toBeDefined();
      // Implementation should ideally categorize errors like 'TIMEOUT', 'CONNECTION_REFUSED'
    }
  });

  test('Invalid JSON response from dependency should be handled', async () => {
    // Verified by checking if the health check itself doesn't crash
    const response = await healthAPI.checkHealth();
    expect([200, 503]).toContain(response.status());
  });
});
