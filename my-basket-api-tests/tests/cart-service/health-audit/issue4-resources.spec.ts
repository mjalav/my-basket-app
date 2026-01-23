import { test, expect } from '../../../src/fixtures/api-fixtures';

/**
 * Issue #4: Resource Monitoring
 * Purpose: Ensure service monitors its own resource consumption
 */
test.describe('Issue #4: Resource Monitoring @high', () => {

  test('Health check should include memory metrics', async ({ cartApi }) => {
    const response = await cartApi.getHealth();
    const body = await response.json();
    const memoryRes = body.checks?.resources?.find((r: any) => r.name === 'memory');
    
    expect(memoryRes).toBeDefined();
    expect(memoryRes?.value).toBeDefined();
    expect(memoryRes?.limit).toBeDefined();
    expect(memoryRes?.unit).toBe('MB');
  });

  test('Health check should include cart count', async ({ cartApi }) => {
    const response = await cartApi.getHealth();
    const body = await response.json();
    const cartRes = body.checks?.resources?.find((r: any) => r.name === 'carts');
    
    expect(cartRes).toBeDefined();
    expect(cartRes?.value).toBeGreaterThanOrEqual(0);
    expect(cartRes?.limit).toBeDefined();
  });

  test('Service should report unhealthy if memory exceeds threshold', async ({ cartApi }) => {
    const response = await cartApi.getHealth();
    const body = await response.json();
    const memoryRes = body.checks?.resources?.find((r: any) => r.name === 'memory');
    
    // threshold is now 98% for unhealthy, 95% for degraded
    if (memoryRes && memoryRes.percentage > 98) {
      expect(memoryRes.status).toBe('unhealthy');
      expect(body.status).toBe('unhealthy');
    } else if (memoryRes && memoryRes.percentage > 95) {
      expect(memoryRes.status).toBe('degraded');
      expect(body.status).toBe('degraded');
    } else if (memoryRes) {
      expect(memoryRes.status).toBe('healthy');
    }
  });
});
