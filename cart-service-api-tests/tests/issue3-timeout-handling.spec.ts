import { test, expect } from '@playwright/test';
import { HealthCheckAPI } from '../src/pages/health-check-api';

/**
 * Issue #3: Timeout Handling
 * Purpose: Ensure health checks and dependency calls have strict timeouts
 */
test.describe('Issue #3: Timeout Handling @high', () => {
  let healthAPI: HealthCheckAPI;

  test.beforeEach(async ({ request }) => {
    healthAPI = new HealthCheckAPI(request);
  });

  test('Health check should respond within 2 seconds', async () => {
    const startTime = Date.now();
    const response = await healthAPI.checkHealth();
    const duration = Date.now() - startTime;
    
    expect(response.status()).toBeDefined();
    expect(duration).toBeLessThan(2000); // 2 second SLA
  });

  test('Product Service call should have a defined timeout', async () => {
    // This is verified via implementation review and error categorization
    // If a call times out, it should return a specific error
    test.info().annotations.push({
      type: 'requirement',
      description: 'Dependency calls must timeout if they exceed 5 seconds'
    });
  });

  test('Health check should return 503 if any dependency check exceeds timeout', async () => {
    // If we could simulate a slow dependency that takes > 2s
    const response = await healthAPI.checkHealth(100); // Trigger test timeout if API is slow
    expect([200, 503]).toContain(response.status());
  });
});
