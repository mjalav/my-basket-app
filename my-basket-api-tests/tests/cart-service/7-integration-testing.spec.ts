/**
 * Cart Service API - Integration Testing
 * End-to-end cart workflow. Generated from api-test-reports/cart-service-api-test-plan.md
 */
import { test, expect } from '@playwright/test';

test.describe('Integration Testing', () => {
  const baseUrl = 'http://localhost:3002/api/';
  const userId = 'e2e-user-' + Date.now();

  test('End-to-End cart workflow: get cart, add item, get cart, verify', async ({ request }) => {
    // 1. Get empty cart
    let response = await request.get(`${baseUrl}cart/${userId}`);
    expect(response.status()).toBe(200);
    let cart = await response.json();
    expect(cart.userId).toBe(userId);
    const initialItemCount = cart.items?.length ?? 0;

    // 2. Add item (using product ID 1 which exists in the product service)
    response = await request.post(`${baseUrl}cart/${userId}/items`, {
      data: { productId: '1', quantity: 2 },
    });
    expect(response.status()).toBe(200);
    cart = await response.json();
    expect(cart.items.length).toBeGreaterThanOrEqual(initialItemCount);

    // 3. Get cart again and verify item
    response = await request.get(`${baseUrl}cart/${userId}`);
    expect(response.status()).toBe(200);
    cart = await response.json();
    expect(cart.totalItems).toBeGreaterThanOrEqual(2);
    const item = cart.items.find((i: { id: string }) => i.id === '1');
    expect(item).toBeDefined();
    expect(item.quantity).toBe(2);
  });
});
