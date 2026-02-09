/**
 * Cart Service API - GET /api/cart/{userId}
 * Generated from api-test-reports/cart-service-api-test-plan.md
 */
import { test, expect } from '@playwright/test';

test.describe('GET /api/cart/{userId}', () => {
  const baseUrl = 'http://localhost:3002/api/';

  test('get__api_cart__userId_ - Happy Path', async ({ request }) => {
    const userId = 'test-user-001';
    const response = await request.get(`${baseUrl}cart/${userId}`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('userId', userId);
    expect(body).toHaveProperty('items');
    expect(body).toHaveProperty('totalAmount');
    expect(body).toHaveProperty('totalItems');
    expect(body).toHaveProperty('id');
    expect(Array.isArray(body.items)).toBe(true);
  });

  test('GET - returns cart for numeric userId (creates empty cart)', async ({ request }) => {
    // Cart API returns 200 with empty cart for any valid userId, not 404
    const response = await request.get(`${baseUrl}cart/99999`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('userId', '99999');
    expect(body.items).toEqual([]);
    expect(body.totalItems).toBe(0);
    expect(body.totalAmount).toBe(0);
  });
});
