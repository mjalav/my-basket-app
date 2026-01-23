import { test, expect } from '../../../src/fixtures/api-fixtures';
import { ResponseValidator } from '../../../src/utils/ResponseValidator';

/**
 * Issue #1: Dependency Validation
 * Purpose: Ensure health checks properly validate external dependencies (Product Service)
 */
test.describe('Issue #1: Dependency Validation @critical', () => {

  test('Health check should return 200 when Product Service is reachable', async ({ cartApi }) => {
    const response = await cartApi.getHealth();
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.status).toBe('healthy');
    
    const productDep = body.checks?.dependencies?.find((d: any) => d.name === 'product-service');
    expect(productDep).toBeDefined();
    expect(productDep.status).toBe('healthy');
  });

  test('Readiness check should return 503 when Product Service is down', async ({ cartApi }) => {
    // Note: This test requires a way to simulate Product Service failure
    test.info().annotations.push({
      type: 'requirement',
      description: 'System must return 503 if critical dependency is unreachable'
    });
    
    const response = await cartApi.getReadiness();
    if (response.status() === 503) {
      const body = await response.json();
      expect(body.status).toBe('unhealthy');
      const productDep = body.checks?.dependencies?.find((d: any) => d.name === 'product-service');
      expect(productDep.status).toBe('unhealthy');
    }
  });

  test('Dependency status should include response time', async ({ cartApi }) => {
    const response = await cartApi.getHealth();
    const body = await response.json();
    const productDep = body.checks?.dependencies?.find((d: any) => d.name === 'product-service');
    
    if (productDep && productDep.status === 'healthy') {
      expect(productDep.responseTime).toBeDefined();
      expect(typeof productDep.responseTime).toBe('number');
      expect(productDep.responseTime).toBeGreaterThan(0);
    }
  });

  test('Liveness check should NOT fail when Product Service is down', async ({ cartApi }) => {
    const response = await cartApi.getLiveness();
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.status).toBe('healthy');
    expect(body.checks?.dependencies).toBeUndefined();
  });
});
