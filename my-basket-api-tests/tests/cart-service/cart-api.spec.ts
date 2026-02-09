import { test, expect, APIRequestContext } from '@playwright/test';

const BASE_URL = 'http://localhost:3002/api';

// Utility for creating a cart item
async function addCartItem(apiRequest: APIRequestContext, productId = 'prod-12345', quantity = 2) {
  const response = await apiRequest.post(`${BASE_URL}/cart/items`, {
    data: { productId, quantity },
  });
  return response;
}

test.describe('Cart Service API', () => {
  test('POST /cart/items - success', async ({ request }) => {
    const response = await addCartItem(request);
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.productId).toBe('prod-12345');
    expect(body.quantity).toBe(2);
    expect(body.itemId).toBeTruthy();
    expect(body.addedAt).toBeTruthy();
  });

  test('POST /cart/items - invalid input', async ({ request }) => {
    const response = await addCartItem(request, '', -1);
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message || body.error).toMatch(/invalid/i);
  });

  test('GET /cart/items - success', async ({ request }) => {
    await addCartItem(request);
    const response = await request.get(`${BASE_URL}/cart/items?userId=test-user`);
    expect(response.status()).toBe(200);
    const items = await response.json();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  test('GET /cart/items - missing userId', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/cart/items`);
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message || body.error).toMatch(/userId/i);
  });

  test('PUT /cart/items/{itemId} - success', async ({ request }) => {
    const addRes = await addCartItem(request);
    const { itemId } = await addRes.json();
    const response = await request.put(`${BASE_URL}/cart/items/${itemId}`, {
      data: { quantity: 5 },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.quantity).toBe(5);
    expect(body.updatedAt).toBeTruthy();
  });

  test('PUT /cart/items/{itemId} - invalid quantity', async ({ request }) => {
    const addRes = await addCartItem(request);
    const { itemId } = await addRes.json();
    const response = await request.put(`${BASE_URL}/cart/items/${itemId}`, {
      data: { quantity: 0 },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message || body.error).toMatch(/quantity/i);
  });

  test('DELETE /cart/items/{itemId} - success', async ({ request }) => {
    const addRes = await addCartItem(request);
    const { itemId } = await addRes.json();
    const response = await request.delete(`${BASE_URL}/cart/items/${itemId}`);
    expect(response.status()).toBe(204);
  });

  test('DELETE /cart/items/{itemId} - not found', async ({ request }) => {
    const response = await request.delete(`${BASE_URL}/cart/items/nonexistent-item`);
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.message || body.error).toMatch(/not found/i);
  });

  test('GET /cart/summary - success', async ({ request }) => {
    await addCartItem(request);
    const response = await request.get(`${BASE_URL}/cart/summary?userId=test-user`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.totalItems).toBeGreaterThanOrEqual(1);
    expect(body.totalQuantity).toBeGreaterThanOrEqual(1);
    expect(body.totalPrice).toBeGreaterThanOrEqual(0);
  });

  test('GET /cart/summary - missing userId', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/cart/summary`);
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message || body.error).toMatch(/userId/i);
  });
});
