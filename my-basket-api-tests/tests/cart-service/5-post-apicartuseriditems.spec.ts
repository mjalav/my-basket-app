/**
 * Cart Service API - POST /api/cart/{userId}/items
 * Generated from api-test-reports/cart-service-api-test-plan.md
 */
import { test, expect } from '@playwright/test';

test.describe('POST /api/cart/{userId}/items', () => {
  const baseUrl = 'http://localhost:3002/api/';
  
  // Use unique userId per test run to avoid state conflicts
  const getUniqueUserId = () => `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  test('post__api_cart__userId__items - Happy Path', async ({ request }) => {
    const userId = getUniqueUserId();
    
    const response = await request.post(`${baseUrl}cart/${userId}/items`, {
      data: { productId: '1', quantity: 1 },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('userId', userId);
    expect(body).toHaveProperty('items');
    expect(body.items.length).toBeGreaterThanOrEqual(1);
    const item = body.items.find((i: { id: string }) => i.id === '1');
    expect(item).toBeDefined();
    expect(item.quantity).toBe(1);
  });

  test('POST - Invalid Request Data', async ({ request }) => {
    const userId = getUniqueUserId();
    
    const response = await request.post(`${baseUrl}cart/${userId}/items`, {
      data: { invalid: 'data' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(body.error).toMatch(/invalid/i);
  });

  test('POST - Empty Payload', async ({ request }) => {
    const userId = getUniqueUserId();
    
    const response = await request.post(`${baseUrl}cart/${userId}/items`, {
      data: {},
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('POST - Large Payload', async ({ request }) => {
    const userId = getUniqueUserId();
    
    const largeField = 'x'.repeat(5000);
    const response = await request.post(`${baseUrl}cart/${userId}/items`, {
      data: { productId: '1', quantity: 1, largeField },
    });
    // API may accept (200) or reject (413/400) - cart service accepts extra fields
    expect([200, 400, 413]).toContain(response.status());
  });

  test('POST - Product not found returns 404', async ({ request }) => {
    const userId = getUniqueUserId();
    
    const response = await request.post(`${baseUrl}cart/${userId}/items`, {
      data: { productId: 'nonexistent_prod_99999', quantity: 1 },
    });
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(body.error).toMatch(/product not found/i);
  });
});

