import { test, expect } from '../../src/fixtures/api-fixtures';

test.describe('Service Discovery & Gateway Health', () => {
  
  test('Gateway health should aggregate all services', async ({ gatewayApi }) => {
    const response = await gatewayApi.getHealth();
    await gatewayApi.assertStatus(response, 200);
    
    const body = await response.json();
    expect(body.gateway).toBe('api-gateway');
    expect(body.status).toBe('healthy');
    expect(body.services).toBeDefined();
    expect(Array.isArray(body.services)).toBeTruthy();
  });

  test('Gateway info should return version and service list', async ({ gatewayApi }) => {
    const response = await gatewayApi.getInfo();
    await gatewayApi.assertStatus(response, 200);
    
    const body = await response.json();
    expect(body.version).toBeDefined();
    expect(body.services).toBeDefined();
    
    const expectedServices = ['product-service', 'cart-service', 'order-service', 'ai-service'];
    const actualServices = body.services.map((s: any) => s.name);
    
    for (const service of expectedServices) {
      expect(actualServices).toContain(service);
    }
  });
});
