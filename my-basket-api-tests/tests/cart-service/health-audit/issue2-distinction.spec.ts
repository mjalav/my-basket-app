import { test, expect } from '../../../src/fixtures/api-fixtures';

/**
 * Issue #2: Liveness vs Readiness Distinction
 * Purpose: Ensure service differentiates between "alive" and "ready to handle traffic"
 */
test.describe('Issue #2: Liveness vs Readiness @critical', () => {

  test('Liveness endpoint /api/cart/health/live should exist and return 200', async ({ cartApi }) => {
    const response = await cartApi.getLiveness();
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.service).toBe('cart-service');
    expect(body.status).toBe('healthy');
  });

  test('Readiness endpoint /api/cart/health/ready should exist', async ({ cartApi }) => {
    const response = await cartApi.getReadiness();
    expect([200, 503]).toContain(response.status());
  });

  test('Liveness should be lightweight (no dependency checks)', async ({ cartApi }) => {
    const response = await cartApi.getLiveness();
    const body = await response.json();
    expect(body.checks?.dependencies).toBeUndefined();
    expect(body.checks?.resources).toBeUndefined();
  });

  test('Readiness should include comprehensive checks', async ({ cartApi }) => {
    const response = await cartApi.getReadiness();
    const body = await response.json();
    expect(body.checks).toBeDefined();
    expect(body.checks?.dependencies).toBeDefined();
    expect(body.checks?.resources).toBeDefined();
  });
});
