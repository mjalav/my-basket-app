# RCTC Prompt: Generate Unit Tests (Jest)

**ROLE**
As a Senior QA Engineer for "MyBasket Lite", create comprehensive Jest unit tests for TypeScript microservices following strict team standards.

**CONTEXT**
-   **Project**: Microservices architecture (Cart Service, Product Service, Order Service, etc.)
-   **Testing Framework**: Jest with TypeScript (`ts-jest`)
-   **Pattern**: AAA (Arrange, Act, Assert) with comprehensive mocking
-   **Quality Standard**: 100% coverage of public methods, edge cases, and error scenarios
-   **Test Location**: Co-located with source files (`src/[module].test.ts`)

**TASK**
Generate a complete Jest test file for **[TARGET_CLASS_OR_MODULE]** that:
1.  Tests all public methods
2.  Mocks all external dependencies
3.  Covers happy path, edge cases, and error scenarios
4.  Uses faker for realistic test data
5.  Follows AAA pattern with clear comments

**CONSTRAINTS (Must Follow Exactly)**

### 1. Test Structure
-   Use `describe` blocks to group tests by class/method
-   Use `test` (never `it`) for individual test cases
-   Follow AAA pattern with comments: `// Arrange`, `// Act`, `// Assert`
-   Import from `@jest/globals`: `{ jest, describe, test, expect, beforeEach }`

### 2. Mocking Strategy (Mandatory)
-   Mock ALL external dependencies using `jest.mock('[path]')`
-   Use typed mocks: `jest.Mocked<DependencyType>`
-   Clear all mocks in `beforeEach` with `jest.clearAllMocks()`
-   Set mock return values per test (not globally)
-   Example:
    ```typescript
    jest.mock('./dependency');
    const mockDep = new Dependency() as jest.Mocked<Dependency>;
    mockDep.method = jest.fn();
    ```

### 3. Test Data
-   Use `@faker-js/faker` for dynamic data generation
-   Create reusable mock objects at describe block level
-   Use descriptive names: `mockProduct`, `mockValidUser`, `mockErrorResponse`
-   Include edge case data: empty strings, null, undefined, boundary values

### 4. Assertions
-   Use specific Jest matchers: `toBe`, `toEqual`, `toHaveLength`, `toBeInstanceOf`
-   Verify mock calls: `expect(mockFn).toHaveBeenCalledWith(expectedArgs)`
-   Test error scenarios: `await expect(fn()).rejects.toThrow('Expected message')`
-   Assert on all important state changes

### 5. Coverage Checklist (Every Test File Must Include)
-   ✅ Happy path for each public method
-   ✅ Edge cases: empty input, null, undefined, zero, negative values
-   ✅ Error scenarios: dependency failures, validation errors, timeouts
-   ✅ Business logic: calculations, transformations, state updates
-   ✅ Concurrent operations if applicable

### 6. File Configuration
-   **Location**: Same directory as source file (e.g., `src/service.ts` → `src/service.test.ts`)
-   **Naming**: `[module].test.ts` suffix
-   **Jest Config**: Ensure `jest.config.js` includes:
    ```javascript
    module.exports = {
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['**/src/**/*.test.ts'],
      clearMocks: true,
      resetMocks: true,
      restoreMocks: true,
    };
    ```

### 7. Code Quality Standards
-   Tests are isolated and independent (no shared state)
-   One logical assertion per test (or clearly related assertions)
-   Descriptive test names: `'should [expected behavior] when [condition]'`
-   No test interdependencies (tests can run in any order)
-   Avoid hardcoded values (use constants or faker)

## Example Template

```typescript
import { faker } from '@faker-js/faker';
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { ServiceClass } from './service';
import { DependencyClass } from './dependency';
import { Type1, Type2 } from './types';

// Mock external dependencies
jest.mock('./dependency');

describe('ServiceClass', () => {
  let service: ServiceClass;
  let mockDependency: jest.Mocked<DependencyClass>;

  // Mock data
  const mockData: Type1 = {
    id: 'test-id',
    name: 'Test Name',
    value: 100
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mocked instance
    mockDependency = new DependencyClass() as jest.Mocked<DependencyClass>;
    mockDependency.method = jest.fn();

    // Initialize service with mocked dependencies
    service = new ServiceClass(mockDependency);
  });

  describe('methodName', () => {
    test('should perform action successfully', async () => {
      // Arrange
      const input = faker.datatype.uuid();
      mockDependency.method.mockResolvedValue(mockData);

      // Act
      const result = await service.methodName(input);

      // Assert
      expect(mockDependency.method).toHaveBeenCalledWith(input);
      expect(result.id).toBe(mockData.id);
      expect(result.name).toBe(mockData.name);
    });

    test('should handle error when dependency fails', async () => {
      // Arrange
      const input = faker.datatype.uuid();
      mockDependency.method.mockRejectedValue(new Error('Dependency error'));

      // Act & Assert
      await expect(service.methodName(input)).rejects.toThrow('Dependency error');
    });

    test('should handle edge case with empty input', async () => {
      // Arrange
      const emptyInput = '';

      // Act & Assert
      await expect(service.methodName(emptyInput)).rejects.toThrow('Invalid input');
    });
  });
});
```

## Checklist Before Submitting

- [ ] All public methods have test coverage
- [ ] Mocks are properly typed and cleared between tests
- [ ] Test data uses faker or descriptive constants
- [ ] AAA pattern is followed in each test
- [ ] Edge cases and error scenarios are covered
- [ ] Test names clearly describe the scenario
- [ ] No hardcoded values that should be configurable
- [ ] All assertions use specific Jest matchers
- [ ] Tests are independent and can run in any order

## Jest Configuration Reference

Expected jest.config.js:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.test.ts'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- service.test.ts
```
