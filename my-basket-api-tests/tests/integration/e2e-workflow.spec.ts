import { test, expect } from '../../src/fixtures/api-fixtures';
import { faker } from '@faker-js/faker';

test.describe('End-to-End Integration Workflow', () => {
  const userId = `e2e-user-${faker.string.uuid()}`;
  let productId: string;
  let orderId: string;
  let productData: any;

  test('Integration: Base System Readiness (Health & Browse)', async ({ gatewayApi, productApi }) => {
    await test.step('Verify system health via Gateway', async () => {
      const response = await gatewayApi.getHealth();
      await gatewayApi.assertStatus(response, 200);
    });

    await test.step('Verify product discovery', async () => {
      const response = await productApi.getAllProducts();
      const body = await response.json();
      expect(body.products).toBeDefined();
      expect(body.products.length).toBeGreaterThan(0);
      
      // Select product for subsequent steps
      productId = body.products[0].id;
      productData = body.products[0];
    });
  });

  test('Integration: Checkout Workflow (Cart -> AI -> Order)', async ({ cartApi, aiApi, orderApi }) => {
    test.skip(!productId, 'Product selection required from previous step');

    await test.step('Add product to cart', async () => {
      const response = await cartApi.addItem(userId, productId, 1);
      await cartApi.assertStatus(response, 200);
    });

    await test.step('Verify AI insights for cart content', async () => {
      const response = await aiApi.getGrocerySuggestions([productData.name]);
      const body = await response.json();
      expect(body.suggestions).toBeDefined();
    });

    await test.step('Convert cart to order', async () => {
      const orderPayload = {
        items: [{ ...productData, quantity: 1 }],
        shippingAddress: { 
          street: faker.location.streetAddress(), 
          city: faker.location.city(), 
          state: faker.location.state({ abbreviated: true }), 
          zipCode: faker.location.zipCode(), 
          country: 'Testland' 
        },
        billingAddress: { 
          street: faker.location.streetAddress(), 
          city: faker.location.city(), 
          state: faker.location.state({ abbreviated: true }), 
          zipCode: faker.location.zipCode(), 
          country: 'Testland' 
        },
        paymentMethod: { 
          type: 'credit_card', 
          last4: faker.string.numeric(4), 
          brand: 'Visa' 
        }
      };
      const response = await orderApi.createOrder(userId, orderPayload);
      await orderApi.assertStatus(response, 201);
      const body = await response.json();
      orderId = body.id;
      expect(body.status).toBe('pending');
    });
  });

  test('Integration: Lifecycle Finalization (Verify & Cleanup)', async ({ orderApi, cartApi }) => {
    test.skip(!orderId, 'Order creation required from previous step');

    await test.step('Verify order and cart state', async () => {
      const orderResp = await orderApi.getOrder(userId, orderId);
      await orderApi.assertStatus(orderResp, 200);
      
      const cartSummary = await cartApi.getSummary(userId);
      await cartApi.assertStatus(cartSummary, 200);
      const cartBody = await cartSummary.json();
      expect(cartBody.totalItems).toBe(0); // Cart should be cleared after order
    });

    await test.step('Final Cleanup', async () => {
      await cartApi.clearCart(userId);
    });
  });
});

