import { test, expect } from '../../src/fixtures/api-fixtures';

test.describe('End-to-End Integration Workflow', () => {
  const userId = `e2e-user-${Date.now()}`;
  let productId: string;
  let recommendedProductId: string;
  let orderId: string;
  let productData: any;

  test('should complete a full user journey', async ({ gatewayApi, productApi, cartApi, aiApi, orderApi }) => {
    
    // 1. Check system health
    await test.step('Verify system health', async () => {
      const response = await gatewayApi.getHealth();
      await gatewayApi.assertStatus(response, 200);
    });

    // 2. Browse products and select one
    await test.step('Browse products', async () => {
      const response = await productApi.getAllProducts();
      const body = await response.json();
      expect(body.products).toBeDefined();
      expect(body.products.length).toBeGreaterThan(0);
      productId = body.products[0].id;
      productData = body.products[0];
    });

    // 3. Add to cart
    await test.step('Add product to cart', async () => {
      const response = await cartApi.addItem(userId, productId, 1);
      await cartApi.assertStatus(response, 200);
    });

    // 4. Get AI suggestions based on cart
    await test.step('Get AI recommendations', async () => {
      const response = await aiApi.getGrocerySuggestions(['milk']); // Dummy items for now
      const body = await response.json();
      expect(body.suggestions).toBeDefined();
      // Assume we pick a recommended product if available, or just verify AI works
    });

    // 5. Place order
    await test.step('Place order', async () => {
      const orderPayload = {
        items: [{ ...productData, quantity: 1 }],
        shippingAddress: { street: '123 Test St', city: 'Test City', state: 'TS', zipCode: '12345', country: 'Testland' },
        billingAddress: { street: '123 Test St', city: 'Test City', state: 'TS', zipCode: '12345', country: 'Testland' },
        paymentMethod: { type: 'credit_card', last4: '4242', brand: 'Visa' }
      };
      const response = await orderApi.createOrder(userId, orderPayload);
      await orderApi.assertStatus(response, 201);
      const body = await response.json();
      orderId = body.id;
      expect(body.status).toBe('pending');
    });

    // 6. Verify order summary
    await test.step('Verify order and cart summary', async () => {
      const orderResp = await orderApi.getOrder(userId, orderId);
      await orderApi.assertStatus(orderResp, 200);
      
      const cartSummary = await cartApi.getSummary(userId);
      // Cart should be empty (or cleared) after order placement depending on business logic
      // For now we just check if the summary endpoint works
      await cartApi.assertStatus(cartSummary, 200);
    });

    // 7. Cleanup (optional but good practice)
    await test.step('Cleanup', async () => {
      await cartApi.clearCart(userId);
      // We don't delete the order as it's a historical record
    });
  });
});
