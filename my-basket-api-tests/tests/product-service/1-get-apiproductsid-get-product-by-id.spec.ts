/**
 * Product Service - GET /api/products/:id
 * Generated for: Get product by ID (happy path + 404).
 */
import { test, expect } from '../../src/fixtures/api-fixtures';

test.describe('GET /api/products/{id} - Get product by ID', () => {
  let existingProductId: string;

  test.beforeAll(async ({ productApi }) => {
    const listResponse = await productApi.getAllProducts();
    expect(listResponse.ok()).toBeTruthy();
    const body = await listResponse.json();
    expect(body.products).toBeDefined();
    expect(body.products.length).toBeGreaterThan(0);
    existingProductId = body.products[0].id;
  });

  test('Happy Path - Get existing product', async ({ productApi }) => {
    const response = await productApi.getProduct(existingProductId);
    await productApi.assertStatus(response, 200);

    const body = await response.json();
    expect(body).toHaveProperty('id', existingProductId);
    expect(body).toHaveProperty('name');
    expect(body).toHaveProperty('price');
    expect(body).toHaveProperty('description');
  });

  test('GET - Resource Not Found', async ({ productApi }) => {
    const response = await productApi.getProduct('non-existent-id-99999');
    expect(response.status()).toBe(404);
  });
});
