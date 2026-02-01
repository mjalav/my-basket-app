# Assignment 07 - 002 - Challenge 2.5.4: Quality Audit Day

## Task Overview
The goal of this task was to perform a quality audit of the existing test suites, score them based on clarity and independence, and refactor the lowest-scoring ones.

## Scoring System
I evaluated the tests on a scale of 1-10, combining two key metrics:
- **Clarity (1-5)**: How easily a developer can understand the test logic and assertions.
- **Independence (1-5)**: How well the test runs in isolation without relying on shared state or execution order.

### Audit Table

| Test Name | Service | Clarity | Independence | Total Score |
| :--- | :--- | :---: | :---: | :---: |
| `should calculate totalAmount correctly with multiple items` | Cart | 3 | 2 | **5/10** |
| `End-to-End Integration Workflow` | Integration | 4 | 1 | **5/10** |
| `should update order status` | Order | 4 | 2 | **6/10** |
| `should update product` | Product | 4 | 2 | **6/10** |

## Audit Prompt
I used the following prompt to guide my audit process:
```markdown
Evaluate the following test file for quality compliance:
1. Identify tests that use hardcoded magic strings/numbers for IDs or data.
2. Look for "Shared State" (global variables modified in one test and used in another).
3. Find monolithic "Journeys" that concatenate multiple logical checks into one 'it' or 'test' block.
4. Score each candidate on Clarity (1-5) and Independence (1-5).
5. Recommend refactoring steps for the lowest-scoring candidates to improve atomicity and data randomization.
```

## Before vs. After: Cart Service Refactor
The `cart-service` calculation test was particularly brittle due to sequential mocking and hardcoded IDs.

### Before
```typescript
    test('should calculate totalAmount correctly with multiple items', async () => {
      // Arrange
      const userId = faker.datatype.uuid();

      mockProductClient.getProduct
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce(mockExpensiveProduct);

      await cartService.addToCart(userId, 'product-1', 2);
      await cartService.addToCart(userId, 'product-2', 1);

      // Act
      const cart = await cartService.updateCartItem(userId, 'product-1', 3);

      // Assert
      expect(cart.items).toHaveLength(2);
      expect(cart.totalAmount).toBe(100.96); // (29.99 * 3) + (10.99 * 1) = 100.96
    });
```

### After
```typescript
    test('should calculate totalAmount correctly with multiple items', async () => {
      // Arrange
      const userId = faker.datatype.uuid();
      
      const product1Id = faker.datatype.uuid();
      const product1Price = parseFloat(faker.commerce.price(10, 50));
      const product1: Product = {
        id: product1Id,
        name: faker.commerce.productName(),
        price: product1Price,
        description: faker.commerce.productDescription(),
        image: faker.image.imageUrl(),
        dataAiHint: faker.lorem.word()
      };

      const product2Id = faker.datatype.uuid();
      const product2Price = parseFloat(faker.commerce.price(5, 20));
      const product2: Product = {
        id: product2Id,
        name: faker.commerce.productName(),
        price: product2Price,
        description: faker.commerce.productDescription(),
        image: faker.image.imageUrl(),
        dataAiHint: faker.lorem.word()
      };

      // Explicitly mock based on product ID to avoid reliance on call order
      mockProductClient.getProduct.mockImplementation(async (id) => {
        if (id === product1Id) return product1;
        if (id === product2Id) return product2;
        throw new Error('Product not found in mock');
      });

      const qty1 = 3;
      const qty2 = 1;
      const newQty1 = 2; // update from 3 to 2

      await cartService.addToCart(userId, product1Id, qty1);
      await cartService.addToCart(userId, product2Id, qty2);

      // Act
      const cart = await cartService.updateCartItem(userId, product1Id, newQty1);

      // Assert
      expect(cart.items).toHaveLength(2);
      
      const expectedTotal = Number(((product1Price * newQty1) + (product2Price * qty2)).toFixed(2));
      expect(cart.totalAmount).toBe(expectedTotal);
      
      const item1 = cart.items.find(i => i.id === product1Id);
      expect(item1?.quantity).toBe(newQty1);
    });
```

---

## Before vs. After: Order Service Refactor
The `order-service` API test was dependent on the success of a previous test and the global `orderId`.

### Before
```typescript
    test('should update order status', async ({ orderApi }) => {
      test.skip(!orderId, 'Skipping as order was not created');
      
      const response = await orderApi.updateOrderStatus(userId, orderId, 'confirmed');
      await orderApi.assertStatus(response, 200);
      
      const body = await response.json();
      expect(body.status).toBe('confirmed');
    });
```

### After
```typescript
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
```

---

## Before vs. After: Product Service Refactor
The `product-service` API test shared state via `beforeAll`, leading to hidden dependencies.

### Before
```typescript
    test('should update product', async ({ productApi }) => {
      test.skip(!createdProductId, 'Skipping as product was not created');
      
      const updateData = {
        price: 34.99,
        inStock: false
      };

      const response = await productApi.updateProduct(createdProductId, updateData);
      await productApi.assertStatus(response, 200);
      
      const body = await response.json();
      expect(body.price).toBe(34.99);
      expect(body.inStock).toBe(false);
    });
```

### After
```typescript
    test('should update product', async ({ productApi }) => {
      // Arrange: Independent setup for this test
      const newProduct = {
        name: `${faker.commerce.productName()} - Update Test`,
        description: 'Test Description',
        price: 10.99,
        category: 'Electronics',
        inStock: true,
        image: 'http://example.com/test.jpg',
        dataAiHint: 'test'
      };
      
      const createResp = await productApi.createProduct(newProduct);
      const createBody = await createResp.json();
      const localProductId = createBody.id;

      const updateData = {
        price: 34.99,
        inStock: false
      };

      // Act
      const response = await productApi.updateProduct(localProductId, updateData);
      await productApi.assertStatus(response, 200);
      
      // Assert
      const body = await response.json();
      expect(body.price).toBe(34.99);
      expect(body.inStock).toBe(false);

      // Cleanup
      await productApi.deleteProduct(localProductId);
    });
```

---

## Before vs. After: Integration E2E Refactor
The monolithic integration workflow was non-atomic and difficult to debug.

### Before
```typescript
  test('should complete a full user journey: Health -> Browse -> Cart -> AI -> Order -> Verify', async ({ gatewayApi, productApi, cartApi, aiApi, orderApi }) => {
    
    // 1. Check system health
    await test.step('Step 1: Verify system health via Gateway', async () => { ... });

    // 2. Browse products and select one
    await test.step('Step 2: Browse products from Product Service', async () => { ... });

    // 3. Add to cart
    await test.step('Step 3: Add selected product to user cart', async () => { ... });

    // 4. Get AI suggestions based on cart
    await test.step('Step 4: Get AI grocery suggestions', async () => { ... });

    // 5. Place order
    await test.step('Step 5: Place order and verify pending status', async () => { ... });

    // 6. Verify order summary
    await test.step('Step 6: Verify order details and cart empty state', async () => { ... });

    // 7. Cleanup
    await test.step('Step 7: Cleanup user cart', async () => { ... });
  });
```

### After
```typescript
  // Broken into 3 atomic, descriptive tests
  test('Integration: Base System Readiness (Health & Browse)', async ({ gatewayApi, productApi }) => { ... });

  test('Integration: Checkout Workflow (Cart -> AI -> Order)', async ({ cartApi, aiApi, orderApi }) => { 
    // Uses Faker for user IDs, address, and payment data
  });

  test('Integration: Lifecycle Finalization (Verify & Cleanup)', async ({ orderApi, cartApi }) => { ... });
```

---

## Pull Request Details

### Feature Name
`feat/test-quality-audit-refactor`

### PR Description
This Pull Request addresses the findings of the **Challenge 2.5.4 Quality Audit**. I have refactored critical tests across the Cart, Order, Product, and Integration suites to improve atomicity, decoupling from shared state, and data reliability using the Faker library.

### Key Changes
- **Cart Service**: Simplified brittle mocks with ID-based `mockImplementation` and randomized product data.
- **Order/Product API**: Refactored tests to be self-sufficient by creating and cleaning up their own test data, removing reliance on `beforeAll` hooks and global variables.
- **Integration Suite**: Modularized a heavy monolithic E2E workflow into three atomic, descriptive integration tests.
- **Infrastructure**: Added `@faker-js/faker` dependency to `my-basket-api-tests`.

## Git Commit Details

### Commit 1: Infrastructure & Cart Service
```bash
git add microservices/cart-service/src/service.test.ts my-basket-api-tests/package.json
git commit -m "test(cart): refactor calculation tests for better independence and add faker to api-tests"
```

### Commit 2: Order & Product API Tests
```bash
git add my-basket-api-tests/tests/order-service/order.spec.ts my-basket-api-tests/tests/product-service/product.spec.ts
git commit -m "test(api): decouple order and product tests from shared state/hooks"
```

### Commit 3: Integration Workflow
```bash
git add my-basket-api-tests/tests/integration/e2e-workflow.spec.ts
git commit -m "test(integration): modularize monolithic E2E journey into atomic steps"
```
