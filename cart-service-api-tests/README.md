# Cart Service API Test Framework

Comprehensive Playwright TypeScript API testing framework for Cart Service health check implementation.

## 📋 Overview

This test framework validates all 10 identified issues in the Cart Service health check implementation using:
- **Playwright** for API testing
- **TypeScript** for type safety
- **Page Object Model (POM)** architecture
- **Test-Driven Development (TDD)** approach

## 🏗️ Project Structure

```
cart-service-api-tests/
├── src/
│   ├── pages/              # Page Object Models for API endpoints
│   │   ├── base-api.ts
│   │   ├── health-check-api.ts
│   │   ├── liveness-api.ts
│   │   └── readiness-api.ts
│   ├── utils/              # Utility functions
│   │   ├── response-validator.ts
│   │   ├── error-handler.ts
│   │   ├── logger.ts
│   │   └── data-helpers.ts
│   ├── types/              # TypeScript interfaces
│   │   └── health-check.types.ts
│   ├── fixtures/           # Test data and fixtures
│   │   └── health-check.fixtures.ts
│   └── config/             # Environment configs
│       ├── dev.config.ts
│       ├── staging.config.ts
│       └── prod.config.ts
├── tests/                  # Test files organized by issue
│   ├── issue1-dependency-validation.spec.ts
│   ├── issue2-liveness-readiness.spec.ts
│   ├── issue3-timeout-handling.spec.ts
│   ├── issue4-resource-monitoring.spec.ts
│   ├── issue5-error-handling.spec.ts
│   ├── issue6-caching.spec.ts
│   ├── issue7-docker-health.spec.ts
│   ├── issue8-observability.spec.ts
│   └── integration-workflow.spec.ts
├── package.json
├── playwright.config.ts
├── tsconfig.json
├── .gitignore
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Cart Service running locally or in Docker
- Product Service running (for dependency tests)

### Installation

```bash
# Navigate to test project
cd cart-service-api-tests

# Install dependencies
npm install

# Verify installation
npx playwright --version
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- issue1-dependency-validation.spec.ts

# Run with UI mode (interactive)
npm test -- --ui

# Run in headed mode (see browser - not applicable for API tests)
npm test -- --headed

# Run tests in parallel
npm test -- --workers=4

# Run tests with specific tag
npm test -- --grep @critical

# Run tests and update snapshots
npm test -- --update-snapshots
```

### Generate Reports

```bash
# Generate HTML report
npm run test:report

# Open HTML report in browser
npm run test:report:open

# Generate JSON report
npm run test:json

# Generate JUnit XML report (for CI/CD)
npm run test:junit
```

### Debug Tests

```bash
# Run tests in debug mode
npm run test:debug

# Run specific test in debug mode
npm run test:debug -- issue1-dependency-validation.spec.ts

# Use Playwright Inspector
PWDEBUG=1 npm test
```

## 📝 Test Coverage

### Issue #1: Dependency Validation (5 tests)
- ✅ Health check returns 200 when Product Service healthy
- ✅ Health check returns 503 when Product Service down
- ✅ Health check includes Product Service status in response
- ✅ Readiness check fails when dependency unhealthy
- ✅ Liveness check succeeds even when dependency down

### Issue #2: Liveness vs Readiness (5 tests)
- ✅ Liveness endpoint exists at `/api/health/live`
- ✅ Readiness endpoint exists at `/api/health/ready`
- ✅ Liveness always returns 200 (unless critical failure)
- ✅ Readiness returns 503 when dependencies down
- ✅ Liveness and readiness have different response structures

### Issue #3: Timeout Handling (5 tests)
- ✅ Product Service calls timeout after 5 seconds
- ✅ Health check calls timeout after 2 seconds
- ✅ Timeout errors are properly categorized
- ✅ Health check returns 503 on timeout
- ✅ Timeout errors include proper error messages

### Issue #4: Resource Monitoring (5 tests)
- ✅ Health check includes memory usage
- ✅ Health check includes cart count
- ✅ Returns unhealthy when memory > 80%
- ✅ Returns degraded when cart count > 10,000
- ✅ Resource metrics have proper units and percentages

### Issue #5: Error Handling (5 tests)
- ✅ Network errors are properly categorized
- ✅ HTTP 500 errors are categorized as SERVER_ERROR
- ✅ HTTP 404 errors are categorized as NOT_FOUND
- ✅ Connection refused errors are categorized
- ✅ Error messages are descriptive and actionable

### Issue #6: Caching Mechanism (5 tests)
- ✅ Health check results are cached for 30 seconds
- ✅ Subsequent calls within 30s return cached result
- ✅ Cache expires after 30 seconds
- ✅ Cache can be manually invalidated
- ✅ Liveness cache (60s) and readiness cache (30s) are separate

### Issue #7: Docker Health Check (4 tests)
- ✅ Docker health check endpoint responds
- ✅ Health check works with wget command
- ✅ Health check respects start_period
- ✅ Container marked unhealthy after retries exhausted

### Issue #8: Observability (5 tests)
- ✅ Health response includes version
- ✅ Health response includes uptime
- ✅ Health response includes response time
- ✅ Health response includes detailed checks
- ✅ Health response includes timestamp

### Integration Workflow (5 tests)
- ✅ End-to-end health check flow
- ✅ API Gateway can check Cart Service health
- ✅ Cart Service validates Product Service
- ✅ Health check works in Docker Compose
- ✅ Orchestration uses readiness endpoint

**Total Tests:** 44 test cases

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the test project root:

```env
# Cart Service URL
CART_SERVICE_URL=http://localhost:3002

# Product Service URL
PRODUCT_SERVICE_URL=http://localhost:3001

# API Gateway URL
API_GATEWAY_URL=http://localhost:3000

# Test environment
TEST_ENV=dev

# Timeouts
DEFAULT_TIMEOUT=30000
API_TIMEOUT=10000

# Logging
LOG_LEVEL=info
LOG_TO_FILE=true
```

### Playwright Configuration

Edit `playwright.config.ts` to customize:
- Test timeout
- Retry strategy
- Parallel execution
- Reporter options
- Base URL

## 📊 Test Reports

### HTML Report
- **Location:** `playwright-report/index.html`
- **Features:** Interactive UI, screenshots, traces, video recordings
- **Open:** `npm run test:report:open`

### JSON Report
- **Location:** `test-results/results.json`
- **Features:** Machine-readable, CI/CD integration
- **Generate:** `npm run test:json`

### JUnit XML Report
- **Location:** `test-results/junit.xml`
- **Features:** CI/CD integration (Jenkins, GitLab CI, etc.)
- **Generate:** `npm run test:junit`

## 🐛 Troubleshooting

### Tests Failing

1. **Check services are running:**
```bash
curl http://localhost:3002/api/health
curl http://localhost:3001/api/health
```

2. **Check environment variables:**
```bash
cat .env
```

3. **Run tests in debug mode:**
```bash
npm run test:debug
```

### Connection Refused Errors

- Ensure Cart Service is running on port 3002
- Ensure Product Service is running on port 3001
- Check firewall settings

### Timeout Errors

- Increase timeout in `playwright.config.ts`
- Check service response times
- Verify network connectivity

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: npm ci
      - name: Start services
        run: docker-compose up -d
      - name: Wait for services
        run: sleep 10
      - name: Run tests
        run: npm test
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### GitLab CI

```yaml
test:
  image: mcr.microsoft.com/playwright:v1.40.0
  stage: test
  services:
    - docker:dind
  script:
    - npm ci
    - docker-compose up -d
    - sleep 10
    - npm test
  artifacts:
    when: always
    paths:
      - playwright-report/
    reports:
      junit: test-results/junit.xml
```

## 📚 Writing New Tests

### Example Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { HealthCheckAPI } from '../src/pages/health-check-api';

test.describe('Feature Name', () => {
  let healthCheckAPI: HealthCheckAPI;

  test.beforeEach(async ({ request }) => {
    healthCheckAPI = new HealthCheckAPI(request);
  });

  test('should do something @tag', async () => {
    // Arrange
    const expectedStatus = 'healthy';

    // Act
    const response = await healthCheckAPI.checkHealth();

    // Assert
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe(expectedStatus);
  });
});
```

## 🎯 Best Practices

1. **Use Page Object Model:** Encapsulate API logic in page objects
2. **Follow AAA Pattern:** Arrange, Act, Assert
3. **Descriptive Test Names:** Use clear, descriptive test names
4. **Use Tags:** Tag tests for easy filtering (@critical, @smoke, etc.)
5. **Clean Up:** Use afterEach/afterAll for cleanup
6. **Async/Await:** Always use async/await for asynchronous operations
7. **Type Safety:** Use TypeScript types for all API responses
8. **Error Handling:** Handle errors gracefully in tests
9. **Logging:** Use logger utility for debugging
10. **DRY Principle:** Reuse fixtures and utilities

## 📖 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [API Testing Best Practices](https://playwright.dev/docs/api-testing)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests following best practices
4. Run tests locally
5. Submit a pull request

## 📄 License

MIT License

## 👥 Authors

- Senior QA Partner
- Development Team

## 📞 Support

For issues or questions:
- Create an issue in the repository
- Contact the QA team
- Check the troubleshooting section

---

**Last Updated:** 2026-01-23  
**Version:** 1.0.0  
**Status:** ✅ Ready for Use
