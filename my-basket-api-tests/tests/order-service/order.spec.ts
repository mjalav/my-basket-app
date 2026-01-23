import { test, expect } from '../../src/fixtures/api-fixtures';

test.describe('Order Service API Tests', () => {
  const userId = 'order-test-user';
  let productId: string;
  let orderId: string;
  let productData: any;

  const address = {
    street: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    country: 'Testland'
  };

  const paymentMethod = {
    type: 'credit_card',
    last4: '4242',
    brand: 'Visa'
  };

  test.beforeAll(async ({ productApi, cartApi }) => {
    // 1. Get a product
    const prodResp = await productApi.getAllProducts();
    const body = await prodResp.json();
    productId = body.products[0].id;
    productData = body.products[0];

    // 2. Add to cart to ensure order can be created
    await cartApi.addItem(userId, productId, 1);
  });

  test.afterAll(async ({ cartApi }) => {
    await cartApi.clearCart(userId);
  });

  test.describe('Order Lifecycle', () => {
    
    test('should create order from cart', async ({ orderApi }) => {
      const orderPayload = {
        items: [{
          ...productData,
          quantity: 1
        }],
        shippingAddress: address,
        billingAddress: address,
        paymentMethod: paymentMethod
      };
      
      const response = await orderApi.createOrder(userId, orderPayload);
      await orderApi.assertStatus(response, 201);
      
      const body = await response.json();
      expect(body.id).toBeDefined();
      expect(body.userId).toBe(userId);
      expect(body.status).toBe('pending');
      orderId = body.id;
    });

    test('should get user orders', async ({ orderApi }) => {
      const response = await orderApi.getUserOrders(userId);
      await orderApi.assertStatus(response, 200);
      
      const body = await response.json();
      expect(body.orders).toBeDefined();
      expect(Array.isArray(body.orders)).toBeTruthy();
      expect(body.orders.some((o: any) => o.id === orderId)).toBeTruthy();
    });

    test('should get specific order', async ({ orderApi }) => {
      test.skip(!orderId, 'Skipping as order was not created');
      
      const response = await orderApi.getOrder(userId, orderId);
      await orderApi.assertStatus(response, 200);
      
      const body = await response.json();
      expect(body.id).toBe(orderId);
    });

    test('should update order status', async ({ orderApi }) => {
      test.skip(!orderId, 'Skipping as order was not created');
      
      const response = await orderApi.updateOrderStatus(userId, orderId, 'confirmed');
      await orderApi.assertStatus(response, 200);
      
      const body = await response.json();
      expect(body.status).toBe('confirmed');
    });

    test('should cancel order', async ({ orderApi }) => {
      test.skip(!orderId, 'Skipping as order was not created');
      
      const response = await orderApi.cancelOrder(userId, orderId);
      await orderApi.assertStatus(response, 200);
      
      const body = await response.json();
      expect(body.status).toBe('cancelled');
    });
  });

  test.describe('Negative Testing', () => {
    test('should return 404 for non-existent order', async ({ orderApi }) => {
      const response = await orderApi.getOrder(userId, 'non-existent-order');
      expect(response.status()).toBe(404);
    });

    test('should fail to update status to invalid value', async ({ orderApi }) => {
      test.skip(!orderId, 'Skipping as order was not created');
      
      const response = await orderApi.updateOrderStatus(userId, orderId, 'INVALID_STATUS');
      expect(response.status()).toBe(400);
    });
  });
});
