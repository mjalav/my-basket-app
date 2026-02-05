# RCTC Prompt: Generate API Integration Tests (Playwright)

**ROLE**
As a Senior Test Automation Engineer for "MyBasket Lite", create comprehensive Playwright API tests using the Service Object Model pattern.

**CONTEXT**
-   **Architecture**: Microservices-based API (Cart, Product, Order, AI services)
-   **Testing Framework**: Playwright with TypeScript
-   **Pattern**: Service Object Model (SOM) - each API has dedicated service class
-   **Standards**: Follow `.agent/skills/testing_framework/SKILL.md` Procedure B
-   **Project Location**: `/my-basket-api-tests/`
-   **Key Classes**: Service Objects extend `BaseAPI` (e.g., `CartAPI`, `ProductAPI`)

**TASK**
Generate a complete API test file for **[TARGET_API_SERVICE]** covering:
1.  All CRUD operations (if applicable)
2.  Service Object class (extends BaseAPI)
3.  Happy path, error scenarios, and edge cases
4.  The 11-point API testing checklist (see Constraints)
5.  Proper setup/teardown with data cleanup

**CONSTRAINTS (Follow Exactly - Aligned with testing_framework Skill)**

### 1. Service Object Model (Mandatory)
-   **File Structure**:
    -   Service Object: `/src/pages/[Service]API.ts`
    -   Test Spec: `/tests/[service-name]/[feature].spec.ts`
-   **Pattern**:
    ```typescript
    import { APIRequestContext, APIResponse } from '@playwright/test';
    import { BaseAPI } from './BaseAPI';
    
    export class [Service]API extends BaseAPI {
      constructor(request: APIRequestContext, baseUrl: string) {
        super(request, baseUrl);
      }
      
      async getResource(id: string): Promise<APIResponse> {
        return this.get(`/api/[service]/${id}`);
      }
      
      async createResource(data: any): Promise<APIResponse> {
        return this.post('/api/[service]', data);
      }
    }
    ```
-   **Never** use raw `request.get()` in tests - always use Service Object methods

### 2. Test Structure
-   Use `test.describe('[Service] API Tests', () => { ... })`
-   Use `test('should [action]', async ({ [service]Api }) => { ... })`
-   Setup: `test.beforeAll()` for prerequisite data creation
-   Cleanup: `test.afterAll()` for data deletion
-   Nested describes for feature grouping

### 3. 11-Point API Testing Checklist (Per Endpoint)
Every endpoint MUST have tests covering:
1.  ✅ **Valid Request**: Happy path with all required fields
2.  ✅ **Optional Fields**: Verify functionality with/without optional fields
3.  ✅ **Auth Scenarios**: Test with invalid/missing auth tokens
4.  ✅ **Missing Fields**: 400 Bad Request for required field omission
5.  ✅ **Invalid Types**: 400 for wrong data types (string instead of number)
6.  ✅ **Boundary Values**: Max string length, min/max numbers, array limits
7.  ✅ **Large Payload**: Test size limits and performance
8.  ✅ **Concurrency**: Race conditions (parallel requests)
9.  ✅ **Rate Limiting**: Verify throttling behavior (if applicable)
10. ✅ **Error Validation**: Assert error message content and structure
11. ✅ **Integration**: Multi-step workflows (Create → Get → Update → Delete)

### 4. Assertions (Playwright Standards)
-   **Status Code**: `await [service]Api.assertStatus(response, 200)` OR `expect(response.status()).toBe(200)`
-   **Body Validation**: Parse JSON and validate structure
    ```typescript
    const body = await response.json();
    expect(body.id).toBeDefined();
    expect(body.name).toBe(expectedName);
    ```
-   **Schema Check**: Validate all required fields are present
-   **Type Safety**: Use TypeScript interfaces for request/response bodies

### 5. Configuration (Environment-Based)
-   **NO hardcoded URLs**: Use `process.env.BASE_URL` from `playwright.config.ts`
-   **Example**:
    ```typescript
    export default defineConfig({
      use: {
        baseURL: process.env.BASE_URL || 'http://localhost:9002',
      },
    });
    ```
-   **NO hardcoded credentials**: Use environment variables or fixtures
-   **Parallel Execution**: Use unique test data identifiers to avoid conflicts

### 6. Data Management
-   **Setup**: Create prerequisite resources in `test.beforeAll()`
-   **Cleanup**: Delete test data in `test.afterAll()`
-   **Unique IDs**: Use timestamps or UUIDs: `test-user-${Date.now()}`
-   **Isolation**: Each test should be runnable independently

### 7. What NOT to Do (Critical)
-   ❌ NO `page.waitForTimeout()` or hardcoded delays
-   ❌ NO raw `request.get()` in test files (use Service Objects)
-   ❌ NO hardcoded URLs, ports, or credentials
-   ❌ NO test interdependencies (test A requires test B)
-   ❌ NO shared mutable state between tests
-   ❌ NO implicit assertions (always use `expect()`)
- Test boundary conditions and edge cases

### 8. Best Practices
- Keep tests isolated and independent
- Avoid test interdependencies
- Use descriptive test names that explain the scenario
- No hard waits - rely on Playwright's auto-waiting
- Handle async operations properly with `await`

## Example Template

```typescript
import { test, expect } from '../../src/fixtures/api-fixtures';

test.describe('Service Name API Tests', () => {
  const testUserId = 'test-user-' + Date.now();
  let resourceId: string;

  test.beforeAll(async ({ dependencyApi }) => {
    // Setup: Create prerequisite resources
    const response = await dependencyApi.createResource({
      name: 'Test Resource',
      description: 'For integration testing'
    });
    const body = await response.json();
    resourceId = body.id;
  });

  test.afterAll(async ({ serviceApi }) => {
    // Cleanup: Remove test data
    if (resourceId) {
      await serviceApi.deleteResource(resourceId);
    }
  });

  test.describe('Feature: Resource Operations', () => {
    
    test('should create resource with valid data', async ({ serviceApi }) => {
      // Arrange
      const payload = {
        name: 'New Resource',
        value: 100,
        active: true
      };

      // Act
      const response = await serviceApi.createResource(payload);
      
      // Assert
      await serviceApi.assertStatus(response, 201);
      
      const body = await response.json();
      expect(body.id).toBeDefined();
      expect(body.name).toBe(payload.name);
      expect(body.value).toBe(payload.value);
      expect(body.active).toBe(payload.active);
    });

    test('should retrieve resource by id', async ({ serviceApi }) => {
      // Act
      const response = await serviceApi.getResource(resourceId);
      
      // Assert
      await serviceApi.assertStatus(response, 200);
      
      const body = await response.json();
      expect(body.id).toBe(resourceId);
      expect(body.name).toBeDefined();
    });

    test('should update resource successfully', async ({ serviceApi }) => {
      // Arrange
      const updatePayload = {
        name: 'Updated Resource',
        value: 200
      };

      // Act
      const response = await serviceApi.updateResource(resourceId, updatePayload);
      
      // Assert
      await serviceApi.assertStatus(response, 200);
      
      const body = await response.json();
      expect(body.name).toBe(updatePayload.name);
      expect(body.value).toBe(updatePayload.value);
    });

    test('should return 404 when resource not found', async ({ serviceApi }) => {
      // Act
      const response = await serviceApi.getResource('non-existent-id');
      
      // Assert
      await serviceApi.assertStatus(response, 404);
    });

    test('should validate required fields', async ({ serviceApi }) => {
      // Arrange
      const invalidPayload = {
        // Missing required 'name' field
        value: 100
      };

      // Act
      const response = await serviceApi.createResource(invalidPayload);
      
      // Assert
      await serviceApi.assertStatus(response, 400);
      
      const body = await response.json();
      expect(body.error).toBeDefined();
    });
  });

  test.describe('Feature: Edge Cases', () => {
    
    test('should handle empty list gracefully', async ({ serviceApi }) => {
      // Act
      const response = await serviceApi.listResources({ filter: 'nonexistent' });
      
      // Assert
      await serviceApi.assertStatus(response, 200);
      
      const body = await response.json();
      expect(Array.isArray(body.items)).toBeTruthy();
      expect(body.items.length).toBe(0);
    });

    test('should handle concurrent requests', async ({ serviceApi }) => {
      // Arrange
      const requests = Array(5).fill(null).map((_, i) => 
        serviceApi.createResource({ name: `Concurrent-${i}`, value: i })
      );

      // Act
      const responses = await Promise.all(requests);
      
      // Assert
      responses.forEach(async (response) => {
        await serviceApi.assertStatus(response, 201);
      });
    });
  });
});
```

## Service API Class Example

```typescript
import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseAPI } from './BaseAPI';

export class ServiceAPI extends BaseAPI {
  constructor(request: APIRequestContext, baseUrl: string) {
    super(request, baseUrl);
  }

  async getResource(id: string): Promise<APIResponse> {
    return this.get(`/api/resources/${id}`);
  }

  async createResource(data: any): Promise<APIResponse> {
    return this.post('/api/resources', data);
  }

  async updateResource(id: string, data: any): Promise<APIResponse> {
    return this.put(`/api/resources/${id}`, data);
  }

  async deleteResource(id: string): Promise<APIResponse> {
    return this.delete(`/api/resources/${id}`);
  }

  async listResources(params?: any): Promise<APIResponse> {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.get(`/api/resources${query}`);
  }
}
```

## Checklist Before Submitting

- [ ] Tests follow Service Object Model pattern
- [ ] All API calls use service class methods (no raw `request.get()`)
- [ ] No hardcoded URLs or configuration
- [ ] Proper setup/teardown with beforeAll/afterAll
- [ ] All assertions use `expect()` explicitly
- [ ] Status codes are verified for all responses
- [ ] Response body structure is validated
- [ ] Error scenarios are tested
- [ ] Tests can run in parallel without conflicts
- [ ] Test names are descriptive and meaningful
- [ ] TypeScript types are used for request/response

## Playwright Configuration Reference

Key settings in playwright.config.ts:
```typescript
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Adjust based on test isolation
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:9002',
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
});
```

## Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/cart-service/cart.spec.ts

# Run with UI mode
npx playwright test --ui

# Run in headed mode
npx playwright test --headed

# Generate HTML report
npx playwright show-report
```

## What NOT to Do

- ❌ No `page.waitForTimeout()` or hardcoded delays
- ❌ No raw selectors or locators in API tests
- ❌ No test interdependencies (test A requires test B to run first)
- ❌ No hardcoded credentials or sensitive data
- ❌ No duplicate test setup code (use fixtures/beforeAll)
- ❌ No implicit assertions (always use `expect()`)
