import { test, expect } from '../../src/fixtures/api-fixtures';
import { faker } from '@faker-js/faker';

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

    test('should update order status', async ({ orderApi, productApi, cartApi }) => {
      // Arrange: Independent setup for this test
      const localUserId = `order-update-test-${faker.string.uuid()}`;
      const prodResp = await productApi.getAllProducts();
      const prodBody = await prodResp.json();
      const localProduct = prodBody.products[0];
      
      await cartApi.addItem(localUserId, localProduct.id, 1);
      
      const orderPayload = {
        items: [{ ...localProduct, quantity: 1 }],
        shippingAddress: address,
        billingAddress: address,
        paymentMethod: paymentMethod
      };
      
      const createResp = await orderApi.createOrder(localUserId, orderPayload);
      const createBody = await createResp.json();
      const localOrderId = createBody.id;

      // Act
      const response = await orderApi.updateOrderStatus(localUserId, localOrderId, 'confirmed');
      await orderApi.assertStatus(response, 200);
      
      // Assert
      const body = await response.json();
      expect(body.status).toBe('confirmed');

      // Cleanup
      await cartApi.clearCart(localUserId);
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

  test.describe('Challenge 1.3.4 - Data Integrity Checks (1.3.4Challenge)', () => {
    const challengeUser = 'challenge-1-3-4-user';

    test.afterEach(async ({ cartApi }) => {
      await cartApi.clearCart(challengeUser);
    });

    test('1.3.4Challenge - reject when order total does not match cart total', async ({ productApi, cartApi, orderApi }) => {
      // Setup: use an existing product and add to challenge user's cart
      const prodResp = await productApi.getAllProducts();
      const prodBody = await prodResp.json();
      const prod = prodBody.products[0];

      await cartApi.addItem(challengeUser, prod.id, 1);

      // Craft order payload with mismatched price (cart has prod.price, we send different price)
      const badOrder = {
        items: [{ ...prod, quantity: 1, price: (prod.price || 0) + 1.00 }],
        shippingAddress: address,
        billingAddress: address,
        paymentMethod
      };

      const response = await orderApi.createOrder(challengeUser, badOrder);
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);

      const body = await response.json().catch(() => ({}));
      expect(body.message || body.error || '').toContain('Data integrity');

      // Cart should remain unchanged
      const cartResp = await cartApi.getCart(challengeUser);
      await cartApi.assertStatus?.(cartResp, 200);
      const cartBody = await cartResp.json();
      expect(Array.isArray(cartBody.items) ? cartBody.items.length : (cartBody.items || []).length).toBeGreaterThan(0);
    });

    test('1.3.4Challenge - rounding to cents succeeds when totals match (0.3333 example)', async ({ productApi, cartApi, orderApi }) => {
      // Create product with price 0.3333
      const created = await productApi.createProduct({
        name: 'frac-product-3333',
        description: 'Fractional price test product',
        price: 0.3333,
        category: 'Test',
        inStock: true,
        image: 'http://example.com/frac.png',
        dataAiHint: 'fraction',
        sku: 'FP3333'
      });
      await productApi.assertStatus(created, 201);
      const createdBody = await created.json();
      const prodId = createdBody.id;

      await cartApi.addItem(challengeUser, prodId, 3);

      // priceCents = Math.round(0.3333 * 100) = 33, totalCents = 33 * 3 = 99 => 0.99
      const orderPayload = {
        items: [{ ...createdBody, quantity: 3 }],
        shippingAddress: address,
        billingAddress: address,
        paymentMethod
      };

      const resp = await orderApi.createOrder(challengeUser, orderPayload);
      await orderApi.assertStatus(resp, 201);
      const body = await resp.json();
      expect(body.totalAmount).toBeCloseTo(0.99, 2);
    });

    test('1.3.4Challenge - reject when order item price mismatches cart item price', async ({ productApi, cartApi, orderApi }) => {
      const prodResp = await productApi.getAllProducts();
      const prodBody = await prodResp.json();
      const prod = prodBody.products[0];

      await cartApi.addItem(challengeUser, prod.id, 1);

      const orderPayload = {
        items: [{ ...prod, quantity: 1, price: (prod.price || 0) - 0.01 }],
        shippingAddress: address,
        billingAddress: address,
        paymentMethod
      };

      const response = await orderApi.createOrder(challengeUser, orderPayload);
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);
      const body = await response.json().catch(() => ({}));
      expect(body.message || body.error || '').toContain('Data integrity');
    });

    test('1.3.4Challenge - reject order with zero quantity', async ({ productApi, cartApi, orderApi }) => {
      const prodResp = await productApi.getAllProducts();
      const prodBody = await prodResp.json();
      const prod = prodBody.products[0];

      await cartApi.addItem(challengeUser, prod.id, 1);

      const orderPayload = {
        items: [{ ...prod, quantity: 0 }],
        shippingAddress: address,
        billingAddress: address,
        paymentMethod
      };

      const response = await orderApi.createOrder(challengeUser, orderPayload);
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);
    });
  
    test.describe('Challenge 1.3.4 - Extras (automation)', () => {
      test.afterEach(async ({ cartApi }) => {
        await cartApi.clearCart('extra-user');
        await cartApi.clearCart('single-user');
        await cartApi.clearCart('smallfrac-user');
        await cartApi.clearCart('negprice-user');
        await cartApi.clearCart('roundfail-user');
        await cartApi.clearCart('fail-clear-user');
        await cartApi.clearCart('race-user');
        await cartApi.clearCart('bigvals-user');
      });

      test('P-01: Successful order creation with two items (happy path)', async ({ productApi, cartApi, orderApi }) => {
        const prodsResp = await productApi.getAllProducts();
        const prods = await prodsResp.json();
        const a = prods.products[0];
        const b = prods.products[1] || prods.products[0];

        await cartApi.addItem('extra-user', a.id, 2);
        await cartApi.addItem('extra-user', b.id, 1);

        const payload = {
          items: [ { ...a, quantity: 2 }, { ...b, quantity: 1 } ],
          shippingAddress: address,
          billingAddress: address,
          paymentMethod
        };

        const resp = await orderApi.createOrder('extra-user', payload);
        await orderApi.assertStatus(resp, 201);
        const body = await resp.json();
        expect(body.id).toBeDefined();
        // Cart cleared
        const cart = await cartApi.getCart('extra-user');
        await cartApi.assertStatus(cart, 200);
        const cartBody = await cart.json();
        expect(cartBody.totalItems).toBe(0);
      });

      test('P-03: Single-item cart order succeeds', async ({ productApi, cartApi, orderApi }) => {
        const prodResp = await productApi.getAllProducts();
        const pb = await prodResp.json();
        const prod = pb.products[0];

        await cartApi.addItem('single-user', prod.id, 1);

        const payload = { items: [{ ...prod, quantity: 1 }], shippingAddress: address, billingAddress: address, paymentMethod };
        const resp = await orderApi.createOrder('single-user', payload);
        await orderApi.assertStatus(resp, 201);
      });

      test('P-05: Very small fractional prices aggregate correctly', async ({ productApi, cartApi, orderApi }) => {
        const p1 = await productApi.createProduct({ name: 'small-0-01', description: 'p1', price: 0.01, category: 'T', inStock: true, image: 'http://example.com/img.png', dataAiHint: 'x', sku: 's1' });
        await productApi.assertStatus(p1, 201);
        const b1 = await p1.json();
        const p2 = await productApi.createProduct({ name: 'small-0-02', description: 'p2', price: 0.02, category: 'T', inStock: true, image: 'http://example.com/img.png', dataAiHint: 'x', sku: 's2' });
        await productApi.assertStatus(p2, 201);
        const b2 = await p2.json();

        await cartApi.addItem('smallfrac-user', b1.id, 1);
        await cartApi.addItem('smallfrac-user', b2.id, 2);

        const payload = { items: [{ ...b1, quantity: 1 }, { ...b2, quantity: 2 }], shippingAddress: address, billingAddress: address, paymentMethod };
        const resp = await orderApi.createOrder('smallfrac-user', payload);
        await orderApi.assertStatus(resp, 201);
        const body = await resp.json();
        expect(body.totalAmount).toBeCloseTo(0.05, 2);
      });

      test('N-04: Order rejected when an order item price is negative', async ({ productApi, cartApi, orderApi }) => {
        const prodResp = await productApi.getAllProducts();
        const pb = await prodResp.json();
        const prod = pb.products[0];

        await cartApi.addItem('negprice-user', prod.id, 1);

        const payload = { items: [{ ...prod, quantity: 1, price: -1.00 }], shippingAddress: address, billingAddress: address, paymentMethod };
        const resp = await orderApi.createOrder('negprice-user', payload);
        expect(resp.status()).toBeGreaterThanOrEqual(400);
        expect(resp.status()).toBeLessThan(500);
      });

      test('N-05: Rounding discrepancy causes rejection (.105 example)', async ({ productApi, cartApi, orderApi }) => {
        const created = await productApi.createProduct({ name: 'round-105', description: 'r105', price: 0.105, category: 'T', inStock: true, image: 'http://example.com/img.png', dataAiHint: 'x', sku: 'r105' });
        await productApi.assertStatus(created, 201);
        const cb = await created.json();
        await cartApi.addItem('roundfail-user', cb.id, 1);

        // Cart priceCents = Math.round(0.105*100)=11 => 0.11. We send 0.10 to force failure.
        const payload = { items: [{ ...cb, quantity: 1, price: 0.10 }], shippingAddress: address, billingAddress: address, paymentMethod };
        const resp = await orderApi.createOrder('roundfail-user', payload);
        expect(resp.status()).toBeGreaterThanOrEqual(400);
        expect(resp.status()).toBeLessThan(500);
        const body = await resp.json().catch(() => ({}));
        expect((body.message || body.error || '')).toContain('Data integrity');
      });

      test('N-06: Cart-clear failure after order creation should roll back the order', async ({ productApi, cartApi, orderApi }) => {
        // Using special user id to trigger simulated clearCart failure in order-service
        const created = await productApi.createProduct({ name: 'rollback-prod', description: 'rb', price: 1.00, category: 'T', inStock: true, image: 'http://example.com/img.png', dataAiHint: 'x', sku: 'rb1' });
        await productApi.assertStatus(created, 201);
        const cb = await created.json();
        const uid = 'fail-clear-user';
        await cartApi.addItem(uid, cb.id, 1);

        const payload = { items: [{ ...cb, quantity: 1 }], shippingAddress: address, billingAddress: address, paymentMethod };
        const resp = await orderApi.createOrder(uid, payload);
        // clearCart simulated failure should cause an error and rollback
        expect(resp.status()).toBeGreaterThanOrEqual(400);
        // Verify no order persisted
        const list = await orderApi.getUserOrders(uid);
        await orderApi.assertStatus(list, 200);
        const lb = await list.json();
        expect(Array.isArray(lb.orders) ? lb.orders.length : 0).toBe(0);
      });

      test('E-01: Concurrency - cart changed between getCart and order submit', async ({ productApi, cartApi, orderApi }) => {
        const prodResp = await productApi.getAllProducts();
        const pb = await prodResp.json();
        const prod = pb.products[0];
        const uid = 'race-user';
        await cartApi.addItem(uid, prod.id, 1);

        // Build an order payload based on current cart
        const payload = { items: [{ ...prod, quantity: 1 }], shippingAddress: address, billingAddress: address, paymentMethod };

        // Simulate another client removing the item before we submit
        await cartApi.removeItem(uid, prod.id);

        const resp = await orderApi.createOrder(uid, payload);
        expect(resp.status()).toBeGreaterThanOrEqual(400);
        expect(resp.status()).toBeLessThan(500);
      });

      test('E-02: Very large quantities/prices (overflow risk) - environment dependent', async ({ productApi, cartApi, orderApi }) => {
        const created = await productApi.createProduct({ name: 'big-price', description: 'big', price: 1000000, category: 'T', inStock: true, image: 'http://example.com/big.png', dataAiHint: 'x', sku: 'big1' });
        await productApi.assertStatus(created, 201);
        const cb = await created.json();
        const uid = 'bigvals-user';
        // Use a large quantity
        await cartApi.addItem(uid, cb.id, 1000);

        const payload = { items: [{ ...cb, quantity: 1000 }], shippingAddress: address, billingAddress: address, paymentMethod };
        const resp = await orderApi.createOrder(uid, payload);
        // Accept either success or explicit failure, but ensure response well-formed
        const status = resp.status();
        expect([201].includes(status) || (status >= 400 && status < 600)).toBeTruthy();
        if (status === 201) {
          const body = await resp.json();
          expect(body.totalAmount).toBeDefined();
        } else {
          const body = await resp.json().catch(() => ({}));
          expect(body.error || body.message || '').toBeDefined();
        }
      });

      test('E-06: Observability - failed integrity check surfaces helpful message', async ({ productApi, cartApi, orderApi }) => {
        const prodResp = await productApi.getAllProducts();
        const pb = await prodResp.json();
        const prod = pb.products[0];
        const uid = 'obs-user';
        await cartApi.addItem(uid, prod.id, 1);

        const payload = { items: [{ ...prod, quantity: 1, price: (prod.price || 0) + 5 }], shippingAddress: address, billingAddress: address, paymentMethod };
        const resp = await orderApi.createOrder(uid, payload);
        expect(resp.status()).toBeGreaterThanOrEqual(400);
        const body = await resp.json().catch(() => ({}));
        expect((body.error || body.message || '')).toContain('Data integrity');
      });
    });
  });
});
