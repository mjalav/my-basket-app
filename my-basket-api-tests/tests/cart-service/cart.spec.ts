import { test, expect } from '../../src/fixtures/api-fixtures';

test.describe('Cart Service API Tests', () => {
  const userId = 'test-user-123';
  let productId: string;

  test.beforeAll(async ({ productApi }) => {
    // Get a real product ID to use in cart tests
    const response = await productApi.getAllProducts();
    const body = await response.json();
    if (body.products && body.products.length > 0) {
      productId = body.products[0].id;
    } else {
      // Create a fallback product if none exist
      const newProduct = await productApi.createProduct({
        name: 'Cart Test Product',
        description: 'Temp product for cart testing',
        price: 10.00,
        category: 'Test',
        inStock: true,
        image: 'http://example.com/image.jpg',
        dataAiHint: 'test'
      });
      const body = await newProduct.json();
      productId = body.id;
    }
  });

  test.afterAll(async ({ cartApi }) => {
    // Cleanup: Clear cart after tests
    await cartApi.clearCart(userId);
  });

  test.describe('Cart Operations', () => {
    
    test('should add item to cart', async ({ cartApi }) => {
      const response = await cartApi.addItem(userId, productId, 2);
      await cartApi.assertStatus(response, 200);
      
      const body = await response.json();
      expect(body.userId).toBe(userId);
      expect(body.items.some((item: any) => item.id === productId)).toBeTruthy();
      
      const item = body.items.find((i: any) => i.id === productId);
      expect(item.quantity).toBe(2);
    });

    test('should get user cart', async ({ cartApi }) => {
      const response = await cartApi.getCart(userId);
      await cartApi.assertStatus(response, 200);
      
      const body = await response.json();
      expect(body.userId).toBe(userId);
      expect(body.items.length).toBeGreaterThan(0);
    });

    test('should update item quantity', async ({ cartApi }) => {
      const response = await cartApi.updateItem(userId, productId, 5);
      await cartApi.assertStatus(response, 200);
      
      const body = await response.json();
      const item = body.items.find((i: any) => i.id === productId);
      expect(item.quantity).toBe(5);
    });

    test('should get cart summary', async ({ cartApi }) => {
      const response = await cartApi.getSummary(userId);
      await cartApi.assertStatus(response, 200);
      
      const body = await response.json();
      expect(body.totalItems).toBeDefined();
      expect(body.totalAmount).toBeDefined();
    });

    test('should remove item from cart', async ({ cartApi }) => {
      const response = await cartApi.removeItem(userId, productId);
      await cartApi.assertStatus(response, 200);
      
      const body = await response.json();
      expect(body.items.some((item: any) => item.id === productId)).toBeFalsy();
    });

    test('should clear cart', async ({ cartApi }) => {
      // First add something
      await cartApi.addItem(userId, productId, 1);
      
      const response = await cartApi.clearCart(userId);
      await cartApi.assertStatus(response, 200);
      
      const body = await response.json();
      expect(body.items.length).toBe(0);
    });
  });

  test.describe('Negative Testing', () => {
    
    test('should fail to add item with invalid quantity', async ({ cartApi }) => {
      const response = await cartApi.addItem(userId, productId, -1);
      expect(response.status()).toBe(400);
    });

    test('should return 400 for invalid userId format if applicable', async ({ cartApi }) => {
      // Depending on validation logic
      const response = await cartApi.getCart('');
      expect(response.status()).toBe(404); // or 400
    });

    test('should handle adding non-existent product', async ({ cartApi }) => {
      const response = await cartApi.addItem(userId, 'non-existent-product', 1);
      // This should ideally return 404 or 400 depending on service integration
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});
