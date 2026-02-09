/**
 * Cart Service API - Main orchestration / smoke tests
 * Full coverage: see 1-get-apicarthealth.spec.ts through 7-integration-testing.spec.ts
 * Generated from api-test-reports/cart-service-api-test-plan.md via api_generator MCP
 */
import { test, expect } from '@playwright/test';

const baseUrl = 'http://localhost:3002/api/';

test.describe('Cart Service API', () => {
  test('health check responds 200', async ({ request }) => {
    const response = await request.get(`${baseUrl}cart/health`);
    expect(response.status()).toBe(200);
  });

  test('get cart for user returns 200', async ({ request }) => {
    const response = await request.get(`${baseUrl}cart/smoke-user`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('userId');
    expect(body).toHaveProperty('items');
  });
});
