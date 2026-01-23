# Comprehensive API Testing Framework

Expand the existing testing infrastructure into a full-scale Playwright TypeScript project with POM for all microservices.

## User Review Required

> [!IMPORTANT]
> - New Project Name: `my-basket-api-tests`
> - Base URL: `http://localhost:3000` (API Gateway)
> - Authentication: None (currently using `userId` in paths)
> - **Existing tests will be migrated and preserved.**

## Proposed Changes

### [NEW] [my-basket-api-tests/](../my-basket-api-tests/)

#### Project Setup
- `package.json`: Dependencies for Playwright, TypeScript, and utilities.
- `playwright.config.ts`: Configuration for multi-environment support.
- `tsconfig.json`: TypeScript compiler options.
- `README.md`: Instructions for setup and execution.

#### Framework Components
- `src/pages/BaseAPI.ts`: Core class with reusable HTTP methods.
- `src/pages/GatewayAPI.ts`, `ProductAPI.ts`, `CartAPI.ts`, `OrderAPI.ts`, `AIAPI.ts`: Page Object Models.
- `src/utils/`: Response validation, data helpers, logging, and error handling.
- `src/types/`: TypeScript definitions for API responses and requests.
- `src/fixtures/`: Test data and custom fixtures.
- `config/`: Environment-specific configs (dev, staging, prod).

#### Test Suites
- `tests/product-service/`: Comprehensive tests for product management.
- `tests/cart-service/`: Comprehensive tests for cart operations (migrated from existing tests).
- `tests/order-service/`: Checkout and order history tests.
- `tests/ai-service/`: Recommendation and suggestion tests.
- `tests/integration/`: End-to-end workflows (Cart -> Checkout -> Order).

## Verification Plan

### Automated Tests
- Run `npm test` in the new project directory.
- Verify all 5 microservices are covered and passing.
- Generate HTML report for inspection.

### Manual Verification
- Verify that the project structure follows the requested POM pattern.
- Ensure old tests are correctly integrated and still passing.
