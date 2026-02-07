# MyBasket Lite - API & UI Testing Guide

## Quick Start

### Prerequisites
Ensure all services are running before executing tests:

```bash
# Terminal 1: Start microservices
npm run microservices:start

# Terminal 2: Start frontend (optional for API tests)
npm run dev

# Verify all services are healthy
npm run microservices:health
```

### Install Test Dependencies
```bash
npm install --save-dev @playwright/test
```

## Running Tests

### All Tests
```bash
npm test                      # Runs all test projects (api, ui-chromium, ui-firefox)
```

### API Tests Only
```bash
npm run test:api              # Run all API tests
npm run test:api -- --headed  # Run with visible output
```

### Specific Cart Service Tests
```bash
npm run test:api -- tests/microservices/cart-service/
npm run test:api -- tests/microservices/cart-service/cart.api.spec.ts
```

### UI Tests (When Available)
```bash
npm run test:ui               # Run UI tests on Chromium
npm run test:ui:firefox       # Run UI tests on Firefox
npm run test:ui:all           # Run UI tests on both browsers
npm run test:ui:watch         # Watch mode (rebuild on file changes)
```

### Debug & Development
```bash
npm run test:debug            # Debug mode with inspector
npm run test:headed           # See browser (for UI tests)
npm run test:codegen          # Record test interactions on frontend
npm run test:report           # View HTML test report
```

### With Filters & Options
```bash
npm run test:api -- --grep "should add single item"  # Filter by test name
npm run test:api -- --workers=4                      # Use 4 parallel workers
npm run test:api -- --trace on                       # Record detailed traces
npm run test:api -- -g "cart"                        # Filter by pattern
```

## Test Structure

### Directory Layout
```
tests/
├── shared/
│   └── base.api.ts                    # BaseAPI class for all API tests
├── microservices/
│   └── cart-service/
│       ├── apis/
│       │   └── cart.api.ts            # CartAPI class (extends BaseAPI)
│       ├── fixtures/
│       │   ├── schemas.ts             # Zod validation schemas
│       │   └── test-data.ts           # Test data factories
│       └── cart.api.spec.ts           # Actual test cases
└── tsconfig.json                      # TypeScript config for tests
```

### Test Naming Conventions
- **API Tests**: `*.api.spec.ts` files
- **UI Tests**: `*.ui.spec.ts` files
- **Shared Utilities**: `*.api.ts` or `*.ts` in shared/

## Cart Service API Tests

### Coverage
The `tests/microservices/cart-service/cart.api.spec.ts` file includes:

**GET Endpoints**
- `GET /api/cart/:userId` - Retrieve user's cart
- `GET /api/cart/:userId/summary` - Get cart summary (totals)

**POST Endpoints**
- `POST /api/cart/:userId/items` - Add product to cart

**PUT Endpoints**
- `PUT /api/cart/:userId/items/:productId` - Update item quantity

**DELETE Endpoints**
- `DELETE /api/cart/:userId/items/:productId` - Remove item from cart
- `DELETE /api/cart/:userId` - Clear entire cart

### Test Categories
1. **Basic Operations** - Single item add/update/remove
2. **Multiple Items** - Managing carts with multiple products
3. **Quantity Management** - Incrementing, updating, removing based on quantity
4. **Error Handling** - Invalid inputs, non-existent products, validation
5. **State Management** - Cart persistence across operations
6. **Integration Tests** - Complete shopping workflows

### Example Test
```typescript
test('should add single item to empty cart', async () => {
  // Arrange
  const { userId } = createTestUser();
  const { productId, quantity } = createTestProduct('1');

  // Act
  const cart = await cartAPI.addToCart(userId, productId, quantity);

  // Assert
  expect(cart.items).toHaveLength(1);
  expect(cart.items[0].id).toBe(productId);
  expect(cart.items[0].quantity).toBe(quantity);
});
```

## Writing New API Tests

### 1. Create API Client (if needed)
```typescript
// tests/microservices/my-service/apis/my-service.api.ts
import { BaseAPI } from '../../../shared/base.api';
import { APIRequestContext } from '@playwright/test';

export class MyServiceAPI extends BaseAPI {
  async getResource(id: string) {
    return this.get(`/api/resource/${id}`, MyResourceSchema);
  }
}
```

### 2. Create Schemas for Validation
```typescript
// tests/microservices/my-service/fixtures/schemas.ts
import { z } from 'zod';

export const MyResourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  // ... more fields
});
```

### 3. Create Test Data Factories
```typescript
// tests/microservices/my-service/fixtures/test-data.ts
export function createTestResource() {
  return {
    name: `test-${Date.now()}`,
    description: 'Test resource',
  };
}
```

### 4. Write Tests
```typescript
// tests/microservices/my-service/my-service.api.spec.ts
import { test, expect } from '@playwright/test';
import { MyServiceAPI } from './apis/my-service.api';

test.describe('My Service API', () => {
  let api: MyServiceAPI;

  test.beforeAll(async ({ playwright }) => {
    const request = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
    });
    api = new MyServiceAPI(request, '');
  });

  test('should get resource', async () => {
    const resource = await api.getResource('id-123');
    expect(resource.name).toBeDefined();
  });
});
```

## Environment Variables

### Test Configuration
Create `.env.test` (git-ignored) for test-specific settings:

```bash
# API Gateway & Microservices
API_GATEWAY_URL=http://localhost:3000
PRODUCT_SERVICE_URL=http://localhost:3001
CART_SERVICE_URL=http://localhost:3002
ORDER_SERVICE_URL=http://localhost:3003
AI_SERVICE_URL=http://localhost:3004

# Frontend
NEXT_PUBLIC_APP_URL=http://localhost:9002

# CI/CD
CI=false
```

The `playwright.config.ts` reads from environment variables:
- `API_GATEWAY_URL` - Base URL for API tests (routes through gateway)
- `NEXT_PUBLIC_APP_URL` - Base URL for UI tests
- `CI` - Set to 'true' in CI pipelines

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  api-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      
      - run: npm ci
      - run: npm run microservices:install
      - run: npm run microservices:start &
      - run: sleep 10  # Wait for services to start
      - run: npm run test:api
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: api-test-results
          path: test-results/
```

## Troubleshooting

### Tests Timeout
**Problem**: Tests hang or timeout
**Solution**:
```bash
# Check if services are running
npm run microservices:health

# Verify ports are available
lsof -i :3000-3004

# Increase timeout in test
test.setTimeout(60000); // 60 seconds
```

### Port Conflicts
**Problem**: Services fail to start with "port already in use"
**Solution**:
```bash
# Find and kill process on port
lsof -i :3000
kill -9 <PID>

# Restart services
npm run microservices:stop
npm run microservices:start
```

### Tests Pass Locally but Fail in CI
**Problem**: Different environment behavior
**Solution**:
- Verify environment variables are set in CI
- Check service startup timing (add delays if needed)
- Use `--trace on` to capture failure details
- Check for OS-specific issues (file paths, line endings)

### Connection Refused
**Problem**: Cannot connect to services
**Solution**:
```bash
# Ensure services are running
npm run microservices:start

# Check service health
curl http://localhost:3000/health

# Check for firewalls/proxies blocking localhost
```

## Best Practices

1. **Isolation**: Each test should be independent
   ```typescript
   test('test 1', async () => {
     const { userId } = createTestUser(); // Unique user for each test
     // ...
   });
   ```

2. **Cleanup**: Use `beforeEach()`/`afterEach()` for setup/teardown
   ```typescript
   test.beforeEach(async () => {
     // Setup test data
   });

   test.afterEach(async () => {
     // Cleanup
   });
   ```

3. **Meaningful Names**: Describe what you're testing
   ```typescript
   test('should reject adding non-existent product', async () => { ... });
   // Good: describes behavior and outcome
   ```

4. **Arrange-Act-Assert**: Structure your tests clearly
   ```typescript
   // Arrange: Setup
   const { userId } = createTestUser();

   // Act: Execute
   const cart = await cartAPI.addToCart(userId, productId, 1);

   // Assert: Verify
   expect(cart.items).toHaveLength(1);
   ```

5. **Validate Responses**: Always check both status and data
   ```typescript
   expect(response.status).toBe(200);
   expect(response.items).toBeDefined();
   expect(response.items).toBeInstanceOf(Array);
   ```

## Viewing Test Results

### HTML Report
```bash
npm run test:report
```
Opens an interactive HTML report showing all test results, timing, and artifacts.

### Console Output
```bash
npm run test:api -- --reporter=list
```

### JSON Results
Test results are saved to `test-results/results.json` for CI/CD integration.

## References

- [Playwright Test Documentation](https://playwright.dev/docs/test-intro)
- [API Testing Guide](https://playwright.dev/docs/api-testing)
- [Zod Documentation](https://zod.dev)
- [Project Copilot Instructions](/.github/copilot-instructions.md)
