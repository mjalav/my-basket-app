import { test, expect } from '../../../src/fixtures/api-fixtures';

/**
 * Issue #7: Docker Health Checks
 * Purpose: Ensure infrastructure can monitor service health
 */
test.describe('Issue #7: Docker Health @high', () => {

  test('Docker health check endpoint /api/cart/health/ready should be accessible', async ({ cartApi }) => {
    const response = await cartApi.getReadiness();
    expect([200, 503]).toContain(response.status());
  });

  test('Readiness check should respond within Docker default timeout (default 5s)', async ({ cartApi }) => {
    const startTime = Date.now();
    await cartApi.getReadiness();
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(5000);
  });
});
