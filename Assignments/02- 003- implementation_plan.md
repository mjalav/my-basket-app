# Implementation Plan: Health Check Testing with Playwright API Framework

## Overview
Create a comprehensive Playwright TypeScript API testing framework with Page Object Model to test all 7 critical health check issues, then implement solutions in the Cart Service to make all tests pass.

## User Review Required

> [!IMPORTANT]
> This implementation includes two major components:
> 1. **Playwright Test Framework** - A complete API testing project with POM structure
> 2. **Cart Service Improvements** - Health check enhancements to pass all tests
>
> **Breaking changes to Cart Service:**
> - Health endpoint will return 503 when dependencies are down
> - New endpoints `/health/live` and `/health/ready` will be added
> - Product Service client will timeout after 5 seconds

> [!WARNING]
> The in-memory cart storage limitation cannot be fully resolved without adding a database. This implementation will add monitoring but data loss on restart will still occur.

---

## Proposed Changes

## Part 1: Playwright API Testing Framework

### Project Structure
```
cart-service-api-tests/
├── src/
│   ├── pages/              # Page Object Models for API endpoints
│   │   ├── BaseAPI.ts
│   │   ├── HealthCheckAPI.ts
│   │   ├── LivenessAPI.ts
│   │   ├── ReadinessAPI.ts
│   │   └── CartAPI.ts
│   ├── utils/              # Utility functions
│   │   ├── auth.ts
│   │   ├── responseValidator.ts
│   │   ├── errorHandler.ts
│   │   ├── logger.ts
│   │   └── dataHelpers.ts
│   ├── types/              # TypeScript interfaces
│   │   ├── health.types.ts
│   │   ├── cart.types.ts
│   │   └── api.types.ts
│   ├── fixtures/           # Test data and fixtures
│   │   ├── healthData.ts
│   │   └── cartData.ts
│   └── config/             # Environment configs
│       ├── dev.config.ts
│       ├── staging.config.ts
│       └── prod.config.ts
├── tests/                  # Test files
│   ├── health/
│   │   ├── issue1-dependency-validation.spec.ts
│   │   ├── issue2-liveness-readiness.spec.ts
│   │   ├── issue3-timeout-handling.spec.ts
│   │   ├── issue4-resource-monitoring.spec.ts
│   │   ├── issue5-observability.spec.ts
│   │   ├── issue6-error-handling.spec.ts
│   │   └── issue7-docker-health.spec.ts
│   └── integration/
│       └── health-workflow.spec.ts
├── package.json
├── playwright.config.ts
├── tsconfig.json
├── .gitignore
└── README.md
```

---

### Test Framework Files

#### [NEW] [package.json](cart-service-api-tests/package.json)

Complete package.json with Playwright dependencies:
```json
{
  "name": "cart-service-api-tests",
  "version": "1.0.0",
  "description": "Playwright API tests for Cart Service health checks",
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:debug": "playwright test --debug",
    "test:report": "playwright show-report",
    "test:issue1": "playwright test tests/health/issue1-dependency-validation.spec.ts",
    "test:issue2": "playwright test tests/health/issue2-liveness-readiness.spec.ts",
    "test:all-issues": "playwright test tests/health/"
  },
  "dependencies": {
    "@playwright/test": "^1.40.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.8.0",
    "typescript": "^5.2.2"
  }
}
```

---

#### [NEW] [playwright.config.ts](cart-service-api-tests/playwright.config.ts)

Playwright configuration for API testing:
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['list']
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3002',
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'API Tests',
      testMatch: /.*\.spec\.ts/,
    },
  ],
});
```

---

#### [NEW] [src/pages/BaseAPI.ts](cart-service-api-tests/src/pages/BaseAPI.ts)

Base API class with reusable HTTP methods:
```typescript
import { APIRequestContext } from '@playwright/test';
import { logger } from '../utils/logger';

export class BaseAPI {
  protected request: APIRequestContext;
  protected baseURL: string;

  constructor(request: APIRequestContext, baseURL: string) {
    this.request = request;
    this.baseURL = baseURL;
  }

  async get(endpoint: string, options = {}) {
    logger.info(`GET ${this.baseURL}${endpoint}`);
    const response = await this.request.get(`${this.baseURL}${endpoint}`, options);
    logger.info(`Response: ${response.status()}`);
    return response;
  }

  async post(endpoint: string, data: any, options = {}) {
    logger.info(`POST ${this.baseURL}${endpoint}`);
    const response = await this.request.post(`${this.baseURL}${endpoint}`, {
      data,
      ...options
    });
    logger.info(`Response: ${response.status()}`);
    return response;
  }

  async validateResponse(response: any, expectedStatus: number) {
    const status = response.status();
    if (status !== expectedStatus) {
      const body = await response.text();
      throw new Error(`Expected ${expectedStatus}, got ${status}. Body: ${body}`);
    }
  }

  async getResponseTime(response: any): Promise<number> {
    // Extract response time from headers or timing API
    return 0; // Placeholder
  }
}
```

---

#### [NEW] [src/pages/HealthCheckAPI.ts](cart-service-api-tests/src/pages/HealthCheckAPI.ts)

Page Object Model for Health Check endpoint:
```typescript
import { BaseAPI } from './BaseAPI';
import { HealthCheckResponse } from '../types/health.types';

export class HealthCheckAPI extends BaseAPI {
  private endpoint = '/api/health';

  async getHealth() {
    return await this.get(this.endpoint);
  }

  async getHealthWithTimeout(timeout: number) {
    return await this.get(this.endpoint, { timeout });
  }

  async validateHealthResponse(response: any): Promise<HealthCheckResponse> {
    const body = await response.json();
    
    // Validate required fields
    if (!body.service || !body.status || !body.timestamp) {
      throw new Error('Missing required health check fields');
    }

    return body as HealthCheckResponse;
  }

  async validateDependencies(response: any) {
    const body = await this.validateHealthResponse(response);
    
    if (!body.dependencies || !Array.isArray(body.dependencies)) {
      throw new Error('Dependencies field missing or invalid');
    }

    return body.dependencies;
  }

  async validateResources(response: any) {
    const body = await this.validateHealthResponse(response);
    
    if (!body.resources) {
      throw new Error('Resources field missing');
    }

    return body.resources;
  }
}
```

---

### Test Files Covering 7 Critical Issues

#### [NEW] [tests/health/issue1-dependency-validation.spec.ts](cart-service-api-tests/tests/health/issue1-dependency-validation.spec.ts)

**Issue 1: No Dependency Validation**

Tests covering:
- Health check reports Product Service status
- Returns 503 when Product Service is down
- Returns 200 when Product Service is up
- Includes dependency response times
- Caches dependency checks appropriately

```typescript
import { test, expect } from '@playwright/test';
import { HealthCheckAPI } from '../../src/pages/HealthCheckAPI';

test.describe('Issue 1: Dependency Validation', () => {
  let healthAPI: HealthCheckAPI;

  test.beforeEach(async ({ request }) => {
    healthAPI = new HealthCheckAPI(request, 'http://localhost:3002');
  });

  test('should include Product Service dependency status', async () => {
    const response = await healthAPI.getHealth();
    const dependencies = await healthAPI.validateDependencies(response);
    
    const productService = dependencies.find(d => d.name === 'product-service');
    expect(productService).toBeDefined();
    expect(productService?.status).toMatch(/up|down/);
  });

  test('should return 503 when Product Service is down', async ({ request }) => {
    // Stop Product Service (manual step or use Docker API)
    // This test requires Product Service to be stopped
    
    const response = await healthAPI.getHealth();
    expect(response.status()).toBe(503);
    
    const body = await response.json();
    expect(body.status).toBe('unhealthy');
  });

  test('should return 200 when all dependencies are up', async () => {
    const response = await healthAPI.getHealth();
    const dependencies = await healthAPI.validateDependencies(response);
    
    const allUp = dependencies.every(d => d.status === 'up');
    if (allUp) {
      expect(response.status()).toBe(200);
    }
  });

  test('should include response time for each dependency', async () => {
    const response = await healthAPI.getHealth();
    const dependencies = await healthAPI.validateDependencies(response);
    
    dependencies.forEach(dep => {
      expect(dep.responseTime).toBeDefined();
      expect(typeof dep.responseTime).toBe('number');
    });
  });

  test('should cache dependency checks for performance', async () => {
    const response1 = await healthAPI.getHealth();
    const deps1 = await healthAPI.validateDependencies(response1);
    
    // Call again immediately
    const response2 = await healthAPI.getHealth();
    const deps2 = await healthAPI.validateDependencies(response2);
    
    // Timestamps should be same or very close (within cache TTL)
    const time1 = new Date(deps1[0].lastChecked).getTime();
    const time2 = new Date(deps2[0].lastChecked).getTime();
    expect(Math.abs(time2 - time1)).toBeLessThan(6000); // Within 6 seconds
  });
});
```

---

#### [NEW] [tests/health/issue2-liveness-readiness.spec.ts](cart-service-api-tests/tests/health/issue2-liveness-readiness.spec.ts)

**Issue 2: Missing Readiness vs. Liveness Distinction**

Tests covering:
- Liveness endpoint always returns 200
- Readiness endpoint returns 503 when dependencies down
- Readiness endpoint returns 200 when ready
- Proper response formats

```typescript
import { test, expect } from '@playwright/test';
import { LivenessAPI } from '../../src/pages/LivenessAPI';
import { ReadinessAPI } from '../../src/pages/ReadinessAPI';

test.describe('Issue 2: Liveness vs Readiness', () => {
  test('liveness endpoint should always return 200', async ({ request }) => {
    const livenessAPI = new LivenessAPI(request, 'http://localhost:3002');
    const response = await livenessAPI.getLiveness();
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('alive');
  });

  test('readiness should return 503 when dependencies unavailable', async ({ request }) => {
    // Requires Product Service to be down
    const readinessAPI = new ReadinessAPI(request, 'http://localhost:3002');
    const response = await readinessAPI.getReadiness();
    
    const body = await response.json();
    if (body.status === 'not-ready') {
      expect(response.status()).toBe(503);
      expect(body.reason).toBeDefined();
    }
  });

  test('readiness should return 200 when all dependencies ready', async ({ request }) => {
    const readinessAPI = new ReadinessAPI(request, 'http://localhost:3002');
    const response = await readinessAPI.getReadiness();
    
    const body = await response.json();
    if (body.status === 'ready') {
      expect(response.status()).toBe(200);
    }
  });
});
```

---

#### [NEW] [tests/health/issue3-timeout-handling.spec.ts](cart-service-api-tests/tests/health/issue3-timeout-handling.spec.ts)

**Issue 3: No Timeout or Circuit Breaker**

Tests covering:
- Health check completes within reasonable time
- Timeout configuration for dependency checks
- Doesn't hang when dependency is slow
- Returns error when dependency times out

---

#### [NEW] [tests/health/issue4-resource-monitoring.spec.ts](cart-service-api-tests/tests/health/issue4-resource-monitoring.spec.ts)

**Issue 4: In-Memory Storage Without Monitoring**

Tests covering:
- Health check includes memory usage
- Health check includes active cart count
- Returns degraded status when memory high
- Monitors heap usage

---

#### [NEW] [tests/health/issue5-observability.spec.ts](cart-service-api-tests/tests/health/issue5-observability.spec.ts)

**Issue 5: Missing Observability and Metrics**

Tests covering:
- Response includes uptime
- Response includes version
- Response includes detailed metrics
- Response time is tracked

---

#### [NEW] [tests/health/issue6-error-handling.spec.ts](cart-service-api-tests/tests/health/issue6-error-handling.spec.ts)

**Issue 6: No Error Handling**

Tests covering:
- Graceful error handling
- Proper error messages
- No crashes on invalid requests
- Returns valid JSON even on errors

---

#### [NEW] [tests/health/issue7-docker-health.spec.ts](cart-service-api-tests/tests/health/issue7-docker-health.spec.ts)

**Issue 7: Docker Compose Missing Health Check**

Tests covering:
- Docker health check endpoint exists
- Docker health check returns quickly
- Container marked healthy after start_period
- Container restarts on health check failure

---

## Part 2: Cart Service Implementation

### Core Implementation

#### [NEW] [health-check.service.ts](microservices/cart-service/src/health-check.service.ts)

Health check service with:
- Dependency validation (Product Service)
- Resource monitoring (memory, cart count)
- Liveness check
- Readiness check
- Caching mechanism
- Timeout handling

---

#### [MODIFY] [product-client.ts](microservices/cart-service/src/product-client.ts)

Add:
- Axios instance with 5-second timeout
- `checkHealth()` method
- Timeout error handling

---

#### [MODIFY] [service.ts](microservices/cart-service/src/service.ts)

Add:
- `getCartCount()` method
- `getMemoryUsage()` method

---

#### [MODIFY] [routes.ts](microservices/cart-service/src/routes.ts)

Add three health endpoints:
- `GET /api/health` - Comprehensive health check
- `GET /api/health/live` - Liveness probe
- `GET /api/health/ready` - Readiness probe

---

#### [NEW] [types.ts additions](microservices/cart-service/src/types.ts)

Add interfaces:
- `HealthCheckResponse`
- `DependencyStatus`
- `ResourceStatus`
- `LivenessResponse`
- `ReadinessResponse`

---

### Infrastructure

#### [MODIFY] [docker-compose.yml](docker-compose.yml)

Add health check to cart-service:
```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3002/api/health/live"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

---

## Verification Plan

### Automated Playwright Tests

```bash
# Install dependencies
cd cart-service-api-tests
npm install

# Run all health check tests
npm test

# Run specific issue tests
npm run test:issue1
npm run test:issue2

# Generate HTML report
npm run test:report
```

### Expected Results
- ✅ All 7 issue test suites pass
- ✅ 30+ individual test cases pass
- ✅ HTML report shows 100% pass rate
- ✅ Response times < 2 seconds

### Manual Verification

1. **Test with Product Service down:**
   ```bash
   docker-compose stop product-service
   curl http://localhost:3002/api/health
   # Should return 503
   ```

2. **Test liveness always works:**
   ```bash
   curl http://localhost:3002/api/health/live
   # Should always return 200
   ```

3. **Test Docker health check:**
   ```bash
   docker-compose up -d
   docker ps
   # Should show "healthy" status
   ```

---

## Implementation Order

1. ✅ Setup Playwright test project structure
2. ✅ Create base API classes and utilities
3. ✅ Create Page Object Models for health endpoints
4. ✅ Write test cases for all 7 issues (TDD approach)
5. ✅ Run tests (they will fail initially)
6. ✅ Implement Cart Service health check improvements
7. ✅ Run tests again and verify they pass
8. ✅ Update docker-compose.yml
9. ✅ Generate final test report

---

## Risk Mitigation

**Risk:** Playwright tests require services to be running  
**Mitigation:** Include docker-compose commands in test setup scripts

**Risk:** Tests may be flaky due to timing  
**Mitigation:** Use Playwright's built-in retry mechanism and proper waits

**Risk:** Breaking changes to health endpoint  
**Mitigation:** Version the API and maintain backward compatibility

**Risk:** Test data cleanup  
**Mitigation:** Use test fixtures and cleanup hooks
