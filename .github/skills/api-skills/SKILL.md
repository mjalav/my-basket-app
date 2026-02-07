---
name: api-testing
description: Write Playwright API tests for microservices using BaseAPI pattern, request fixtures, and Zod validation. Use this skill when creating tests for REST endpoints in product-service, cart-service, order-service, or ai-service.
---
# API Testing Skill
**BEFORE generating ANY API tests**, verify the project is properly configured:

### Pre-Flight Checklist (Execute in Order)

- [ ] **Playwright installed**: `npm list @playwright/test` (if missing: `npm install --save-dev @playwright/test`)
- [ ] **playwright.config.ts exists**: `ls playwright.config.ts` (if missing: see [PLAYWRIGHT_SETUP.md](../.github/PLAYWRIGHT_SETUP.md))
- [ ] **Test folder structure exists**: `ls -la tests/microservices/` (if missing: create per [PLAYWRIGHT_SETUP.md](../.github/PLAYWRIGHT_SETUP.md))
- [ ] **Base API class exists**: `ls tests/shared/base.api.ts` (if missing: create per [PLAYWRIGHT_SETUP.md](../.github/PLAYWRIGHT_SETUP.md))
- [ ] **TypeScript config exists**: `ls tests/tsconfig.json` (if missing: create per [PLAYWRIGHT_SETUP.md](../.github/PLAYWRIGHT_SETUP.md))
- [ ] **Test scripts in package.json**: `grep "test:api" package.json` (if missing: add per [PLAYWRIGHT_SETUP.md](../.github/PLAYWRIGHT_SETUP.md))

**If ANY check fails, refer to [.github/PLAYWRIGHT_SETUP.md](.github/PLAYWRIGHT_SETUP.md) Phase 2 to create missing infrastructure FIRST.**

---

## Overview
This skill guides you through writing Playwright API tests for MyBasket Lite microservices. Tests use the **Page Object Model** pattern adapted for APIs via a `BaseAPI` class that encapsulates request logic, base URLs, and common operations.

## When to Use This Skill
- Creating new API test suites for microservices (product, cart, order, AI services)
- Writing integration tests that validate service-to-service communication
- Setting up test fixtures and mock data for API testing
- Debugging API failures and validating response schemas

## Architecture Pattern

### BaseAPI Class (Shared Foundation)
Located in `tests/shared/base.api.ts`, provides:
- Constructor takes `baseURL` (service URL from environment)
- Helper methods: `get()`, `post()`, `patch()`, `delete()`, `put()`
- Built-in error handling and response JSON parsing
- Configurable headers (Authorization, Content-Type)
- Request timeout configuration

**Example structure:**
```typescript
// tests/shared/base.api.ts
import { APIRequestContext } from '@playwright/test';
import { z } from 'zod';

export class BaseAPI {
  protected request: APIRequestContext;
  protected baseURL: string;

  constructor(request: APIRequestContext, baseURL: string) {
    this.request = request;
    this.baseURL = baseURL;
  }

  async get<T>(endpoint: string, schema?: z.ZodSchema<T>): Promise<T> {
    const response = await this.request.get(`${this.baseURL}${endpoint}`);
    const json = await response.json();
    return schema ? schema.parse(json) : json;
  }

  async post<T>(endpoint: string, data: any, schema?: z.ZodSchema<T>): Promise<T> {
    const response = await this.request.post(`${this.baseURL}${endpoint}`, { data });
    const json = await response.json();
    return schema ? schema.parse(json) : json;
  }
  // ... patch, put, delete methods similarly
}
```

### Service-Specific API Classes
Each microservice has its own API class extending `BaseAPI`:

**Example: ProductAPI**
```typescript
// tests/microservices/product-service/apis/product.api.ts
import { z } from 'zod';
import { BaseAPI } from '../../../shared/base.api';
import { ProductSchema, ProductListSchema } from '../fixtures/schemas';

export class ProductAPI extends BaseAPI {
  async getAllProducts(filters?: any): Promise<z.infer<typeof ProductListSchema>> {
    const queryParams = new URLSearchParams(filters).toString();
    return this.get(`/api/products?${queryParams}`, ProductListSchema);
  }

  async getProductById(id: string): Promise<z.infer<typeof ProductSchema>> {
    return this.get(`/api/products/${id}`, ProductSchema);
  }

  async createProduct(data: any): Promise<z.infer<typeof ProductSchema>> {
    return this.post('/api/products', data, ProductSchema);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.request.delete(`${this.baseURL}/api/products/${id}`);
  }
}
```

## Test File Pattern

### Basic API Test Structure
```typescript
// tests/microservices/product-service/product.api.spec.ts
import { test, expect } from '@playwright/test';
import { ProductAPI } from './apis/product.api';
import { createTestProduct } from './fixtures/test-data';

test.describe('Product Service API', () => {
  let productAPI: ProductAPI;

  test.beforeAll(async ({ playwright }) => {
    const request = await playwright.request.newContext({
      baseURL: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001',
    });
    productAPI = new ProductAPI(request);
  });

  test.describe('GET /api/products', () => {
    test('should return paginated list of products', async () => {
      const result = await productAPI.getAllProducts({ page: 1, limit: 10 });
      
      expect(result).toHaveProperty('products');
      expect(Array.isArray(result.products)).toBe(true);
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
    });

    test('should filter products by category', async () => {
      const result = await productAPI.getAllProducts({ category: 'fruits' });
      
      expect(result.products.length).toBeGreaterThan(0);
      result.products.forEach(product => {
        expect(product.category).toBe('fruits');
      });
    });

    test('should return empty array when no products match filter', async () => {
      const result = await productAPI.getAllProducts({ search: 'nonexistent' });
      
      expect(result.products).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  test.describe('POST /api/products', () => {
    test('should create a new product', async () => {
      const testData = createTestProduct();
      const created = await productAPI.createProduct(testData);
      
      expect(created.id).toBeDefined();
      expect(created.name).toBe(testData.name);
      expect(created.price).toBe(testData.price);
    });

    test('should reject invalid product data', async () => {
      const invalid = { name: 'Test' }; // Missing required fields
      
      const response = await productAPI.request.post(
        `${productAPI.baseURL}/api/products`,
        { data: invalid }
      );
      
      expect(response.status()).toBe(400);
    });
  });

  test.afterAll(async () => {
    await productAPI.dispose();
  });
});
```

## Key Playwright API Testing Features

### 1. Configuration with `baseURL`
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'api',
      testMatch: '**/*.api.spec.ts',
      use: {
        baseURL: 'http://localhost:3000', // API Gateway
      },
    },
  ],
});
```

### 2. Request Fixture Usage
- Use `request` fixture from `test()` or `beforeAll()` for automatic context management
- Request automatically respects `baseURL` and `extraHTTPHeaders`
- Automatically retries on transient failures

### 3. Response Validation with Zod
```typescript
// Define schemas for type safety
const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  price: z.number().positive(),
  description: z.string(),
  image: z.string().url(),
});

// Validate responses
const product = await productAPI.get('/api/products/123', ProductSchema);
```

### 4. Setup & Teardown
```typescript
test.beforeAll(async () => {
  // Create test data via API
  await productAPI.createProduct(testData);
});

test.beforeEach(async () => {
  // Run before each test
});

test.afterEach(async () => {
  // Cleanup after each test
});

test.afterAll(async () => {
  // Delete all test data
  await productAPI.dispose();
});
```

### 5. Error Testing
```typescript
test('should handle 404 errors', async () => {
  const response = await productAPI.request.get(
    `${productAPI.baseURL}/api/products/invalid-id`
  );
  
  expect(response.status()).toBe(404);
  const error = await response.json();
  expect(error).toHaveProperty('error');
});

test('should handle service unavailable', async () => {
  const response = await productAPI.request.get(
    'http://nonexistent:9999/api/health'
  );
  
  expect(response.status()).not.toBe(200);
});
```

## Running API Tests

```bash
# Run all API tests
npx playwright test --project=api

# Run single service tests
npx playwright test tests/microservices/product-service/

# Run with debug mode
npx playwright test --project=api --debug

# Run with trace recording (useful for CI failures)
npx playwright test --project=api --trace on
```

## Best Practices for API Testing

1. **Isolation**: Each test should be independent - don't rely on test execution order
2. **Clean Data**: Use `beforeEach()` and `afterEach()` to ensure test data doesn't leak
3. **Meaningful Assertions**: Test both success and failure scenarios
4. **Response Validation**: Always validate response schema and status codes
5. **No Manual Assertions**: Use `expect()` with web-first assertions, not manual checks
6. **Mock External Dependencies**: Use `page.route()` in UI tests calling APIs; don't test real third-party services
7. **Timeout Configuration**: Set appropriate timeouts for slow services in config
8. **Error Messages**: Include descriptive error messages in assertions for debugging

## Common Patterns

### Testing Service-to-Service Communication
```typescript
test('cart service should call product service for pricing', async () => {
  // Setup: Create cart with product
  const cart = await cartAPI.createCart('user-123');
  await cartAPI.addItem(cart.id, { productId: 'prod-1', quantity: 2 });
  
  // Verify product details were fetched via product service
  const items = await cartAPI.getCart(cart.id);
  expect(items[0]).toHaveProperty('price'); // Came from product service
});
```

### Testing Error Handling
```typescript
test('should gracefully handle product service unavailability', async () => {
  // Mock product service as unavailable
  // Then cart service should still work or return appropriate error
  const response = await cartAPI.addItem(cartId, { productId: 'prod-1', quantity: 1 });
  expect(response.status()).toBeLessThan(500); // Not a server error from cart service
});
```

## Debugging API Tests

- **Use `--debug` flag**: `npx playwright test --debug` opens the Inspector
- **Check trace**: `npx playwright show-report` displays trace with network requests
- **Log responses**: Add `console.log(await response.json())` before assertions
- **Use Swagger UI**: Test endpoints manually at `http://localhost:300X/api-docs` first

## References
- [Playwright API Testing Guide](https://playwright.dev/docs/api-testing)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [BaseAPI and POM Pattern](https://playwright.dev/docs/pom)
