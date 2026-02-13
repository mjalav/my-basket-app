import { test, expect, APIRequestContext } from '@playwright/test';

const BASE_URL = 'http://localhost:3002/api';
const TEST_USER_ID = 'test-user';

// Utility for creating a cart item
async function addCartItem(apiRequest: APIRequestContext, userId = TEST_USER_ID, productId = '1', quantity = 2) {
  const response = await apiRequest.post(`${BASE_URL}/cart/${userId}/items`, {
    data: { productId, quantity },
  });
  return response;
}

test.describe('Cart Service API', () => {
  test('POST /cart/:userId/items - success', async ({ request }) => {
    const response = await addCartItem(request);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.userId).toBe(TEST_USER_ID);
    expect(body.items).toBeDefined();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
  });

  test('POST /cart/:userId/items - invalid input', async ({ request }) => {
    const response = await addCartItem(request, TEST_USER_ID, '', -1);
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/invalid/i);
  });

  test('GET /cart/:userId - success', async ({ request }) => {
    await addCartItem(request);
    const response = await request.get(`${BASE_URL}/cart/${TEST_USER_ID}`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.userId).toBe(TEST_USER_ID);
    expect(Array.isArray(body.items)).toBe(true);
  });

  test('GET /cart/:userId - invalid userId', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/cart/`);
    expect(response.status()).toBe(404);
  });

  test('PUT /cart/:userId/items/:productId - success', async ({ request }) => {
    await addCartItem(request, TEST_USER_ID, '1', 2);
    const response = await request.put(`${BASE_URL}/cart/${TEST_USER_ID}/items/1`, {
      data: { quantity: 5 },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.items).toBeDefined();
    const item = body.items.find((i: any) => i.id === '1');
    expect(item).toBeDefined();
    expect(item.quantity).toBe(5);
  });

  test('PUT /cart/:userId/items/:productId - invalid quantity', async ({ request }) => {
    await addCartItem(request, TEST_USER_ID, '1', 2);
    const response = await request.put(`${BASE_URL}/cart/${TEST_USER_ID}/items/1`, {
      data: { quantity: -1 },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/invalid/i);
  });

  test('DELETE /cart/:userId/items/:productId - success', async ({ request }) => {
    await addCartItem(request, TEST_USER_ID, '1', 2);
    const response = await request.delete(`${BASE_URL}/cart/${TEST_USER_ID}/items/1`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.userId).toBe(TEST_USER_ID);
  });

  test('DELETE /cart/:userId/items/:productId - not found', async ({ request }) => {
    const response = await request.delete(`${BASE_URL}/cart/${TEST_USER_ID}/items/nonexistent-item`);
    expect(response.status()).toBe(200); // Cart service returns 200 even if item not found
  });

  test('GET /cart/:userId/summary - success', async ({ request }) => {
    await addCartItem(request, TEST_USER_ID, '1', 2);
    const response = await request.get(`${BASE_URL}/cart/${TEST_USER_ID}/summary`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.itemCount).toBeGreaterThanOrEqual(0);
    expect(body.totalItems).toBeGreaterThanOrEqual(0);
    expect(body.totalAmount).toBeGreaterThanOrEqual(0);
  });

  test('GET /cart/:userId/summary - invalid userId', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/cart//summary`);
    expect(response.status()).toBe(404);
  });
});
