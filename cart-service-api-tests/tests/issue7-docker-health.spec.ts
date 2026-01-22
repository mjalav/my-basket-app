import { test, expect } from '@playwright/test';
import { ReadinessAPI } from '../src/pages/readiness-api';

/**
 * Issue #7: Docker Health Checks
 * Purpose: Ensure infrastructure can monitor service health
 */
test.describe('Issue #7: Docker Health @high', () => {
  let readinessAPI: ReadinessAPI;

  test.beforeEach(async ({ request }) => {
    readinessAPI = new ReadinessAPI(request);
  });

  test('Docker health check endpoint /api/health/ready should be accessible', async () => {
    const response = await readinessAPI.checkReadiness();
    expect([200, 503]).toContain(response.status());
  });

  test('Readiness check should respond within Docker default timeout (default 5s)', async () => {
    const startTime = Date.now();
    await readinessAPI.checkReadiness();
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(5000);
  });

  test('Service should report healthy during normal operation', async () => {
    const body = await readinessAPI.getReadinessStatus();
    expect(body.status).toBe('healthy');
  });
});
