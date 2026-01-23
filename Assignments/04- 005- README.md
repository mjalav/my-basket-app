# My Basket API Testing Framework

A comprehensive Playwright TypeScript framework for testing the My Basket App microservices.

## Project Structure

- `src/pages/`: Page Object Models (POM) for each microservice.
- `src/fixtures/`: Playwright fixtures for easy API client injection.
- `src/types/`: TypeScript interfaces for API requests and responses.
- `src/utils/`: Common utilities (logger, config).
- `tests/`: Automated test suites organized by service.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configuration:
   Create a `.env` file in this directory based on `.env.example` (if provided) or use defaults in `src/utils/config.ts`.

## Running Tests

All tests:
```bash
npx playwright test
```

> [!TIP]
> If running in a resource-constrained environment (like local Docker), use `--workers=1` to ensure service stability and avoid intermittent health check failures.
> ```bash
> npx playwright test --workers=1
> ```

Specific service:
```bash
npx playwright test tests/product-service/
```

With UI:
```bash
npx playwright test --ui
```

Generate Report:
```bash
npx playwright show-report
```

## Features

- **POM Architecture**: Clean separation of API logic and test cases.
- **Detailed Logging**: Every request and response is logged for easier debugging.
- **Environment Driven**: Configurable base URLs and timeouts.
- **Type Safety**: Full TypeScript support for API entities.
- **E2E Workflows**: Integration tests covering cross-service scenarios.
