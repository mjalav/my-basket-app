/**
 * Cart Service API - GET /api/cart/health/live
 * Generated from api-test-reports/cart-service-api-test-plan.md
 */
import { test, expect } from '@playwright/test';

test.describe('GET /api/cart/health/live', () => {
  const baseUrl = 'http://localhost:3002/api/';

  test('get__api_cart_health_live - Happy Path', async ({ request }) => {
    const response = await request.get(`${baseUrl}cart/health/live`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('status');
  });
});
