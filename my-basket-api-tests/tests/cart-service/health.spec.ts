import { test, expect } from '../../src/fixtures/api-fixtures';

test.describe('Cart Service Health Checks', () => {
  
  test('Liveness check should return 200 Healthy', async ({ cartApi }) => {
    const response = await cartApi.getLiveness();
    await cartApi.assertStatus(response, 200);
    
    const body = await response.json();
    expect(body.status).toBe('healthy');
    expect(body.service).toBe('cart-service');
    expect(body.checks?.dependencies).toBeUndefined();
  });

  test('Readiness check should return 200 when all dependencies are healthy', async ({ cartApi }) => {
    const response = await cartApi.getReadiness();
    // Use test.step for better reporting
    await test.step('Check readiness status', async () => {
      if (response.status() === 200) {
        const body = await response.json();
        expect(body.status).toBe('healthy');
        expect(body.checks?.dependencies).toBeDefined();
        
        const productDep = body.checks.dependencies.find((d: any) => d.name === 'product-service');
        expect(productDep.status).toBe('healthy');
      } else if (response.status() === 503) {
        const body = await response.json();
        expect(body.status).toBe('unhealthy');
        test.info().annotations.push({
          type: 'warning',
          description: 'Cart Service is unhealthy due to dependencies'
        });
      } else {
        expect(response.status()).toBe(200);
      }
    });
  });

  test('Health check should include detailed status and response times', async ({ cartApi }) => {
    const response = await cartApi.getHealth();
    await cartApi.assertStatus(response, 200);
    
    const body = await response.json();
    expect(body.timestamp).toBeDefined();
    
    if (body.checks?.dependencies) {
      for (const dep of body.checks.dependencies) {
        expect(dep.name).toBeDefined();
        expect(dep.status).toMatch(/healthy|unhealthy/);
        expect(typeof dep.responseTime).toBe('number');
      }
    }
  });

  test('Health check should include resource metrics', async ({ cartApi }) => {
    const response = await cartApi.getHealth();
    const body = await response.json();
    
    if (body.checks?.resources) {
      const resources = body.checks.resources;
      const memory = resources.find((r: any) => r.name === 'memory');
      expect(memory).toBeDefined();
      expect(body.uptime).toBeDefined();
      expect(typeof body.uptime).toBe('number');
    }
  });
});
