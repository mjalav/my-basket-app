# Playwright Project Setup Guide for Agent Skills

This document defines the complete pre-flight checks and setup procedures that **MUST** be performed before generating test files. Agent Skills reference this to ensure autonomous test generation.

## Phase 1: Pre-Flight Checks

Before generating ANY test files, verify:

### 1.1 Check Playwright Installation
```bash
npm list @playwright/test
```

**If NOT installed**, run:
```bash
npm install --save-dev @playwright/test
```

**Expected output after install:**
```
my-basket-app@0.1.0
└── @playwright/test@1.40.0 (or higher)
```

### 1.2 Check playwright.config.ts Exists
```bash
ls playwright.config.ts
```

**If NOT found**, create it (see Phase 2 below)

### 1.3 Check Test Folder Structure
```bash
ls -la tests/
```

**Expected structure:**
```
tests/
├── app/              # UI tests for Next.js pages
│   ├── pages/        # Page Object classes
│   ├── fixtures/     # Test data and factories
│   └── *.ui.spec.ts  # Test specifications
├── microservices/    # API tests for services
│   ├── shared/       # Shared API utilities (base.api.ts)
│   └── */
│       ├── apis/
│       ├── fixtures/
│       └── *.api.spec.ts
└── shared/           # Shared test utilities
    ├── base.page.ts  # UI page object base class
    ├── base.api.ts   # API client base class
    └── common.ts     # Shared utilities
```

**If missing**, create structure (see Phase 2 below)

### 1.4 Check TypeScript Configuration for Tests
```bash
ls tests/tsconfig.json
```

**If NOT found**, create it (see Phase 2 below)

### 1.5 Check npm Test Scripts
```bash
grep "test:ui\|test:api\|test:all" package.json
```

**Expected scripts:**
```json
{
  "scripts": {
    "test:ui": "playwright test --project=ui",
    "test:api": "playwright test --project=api",
    "test:all": "playwright test",
    "test:ui:headed": "playwright test --project=ui --headed",
    "test:ui:debug": "playwright test --project=ui --debug",
    "test:report": "playwright show-report"
  }
}
```

---

## Phase 2: Setup & Create Missing Infrastructure

If any checks from Phase 1 failed, perform the corresponding setup:

### 2.1 Install Playwright (if needed)
```bash
npm install --save-dev @playwright/test @playwright/test
```

### 2.2 Create playwright.config.ts (if missing)

**Location:** Root of project

**Content:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  
  // Single config with two projects (api + ui)
  projects: [
    {
      name: 'api',
      testMatch: '**/*.api.spec.ts',
      use: {
        baseURL: 'http://localhost:3000', // API Gateway
        httpCredentials: undefined,
      },
    },
    {
      name: 'ui',
      testMatch: '**/*.ui.spec.ts',
      use: {
        baseURL: 'http://localhost:9002', // Next.js frontend
        ...devices['chromium'],
      },
    },
  ],

  // Global configuration
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],

  timeout: 30 * 1000, // 30 seconds per test
  expect: { timeout: 5 * 1000 }, // 5 seconds for assertions
});
```

### 2.3 Create Test Folder Structure (if missing)

```bash
# UI test structure
mkdir -p tests/app/pages
mkdir -p tests/app/fixtures

# API test structure
mkdir -p tests/microservices/shared
mkdir -p tests/microservices/product-service/{apis,fixtures}
mkdir -p tests/microservices/cart-service/{apis,fixtures}
mkdir -p tests/microservices/order-service/{apis,fixtures}
mkdir -p tests/microservices/ai-service/{apis,fixtures}

# Shared test utilities
mkdir -p tests/shared
```

### 2.4 Create tests/tsconfig.json (if missing)

**Location:** `/tests/tsconfig.json`

**Content:**
```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "outDir": "../.test-dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "types": ["@playwright/test", "node"]
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 2.5 Update package.json Scripts (if missing)

Add these scripts to package.json:

```json
{
  "scripts": {
    "test:ui": "playwright test --project=ui",
    "test:api": "playwright test --project=api",
    "test:all": "playwright test",
    "test:ui:headed": "playwright test --project=ui --headed",
    "test:ui:debug": "playwright test --project=ui --debug",
    "test:report": "playwright show-report"
  }
}
```

### 2.6 Create tests/.gitignore (if missing)

**Location:** `/tests/.gitignore`

**Content:**
```
# Playwright
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/

# OS
.DS_Store
*.swp
*.swo

# IDE
.vscode
.idea
```

### 2.7 Create tests/shared/base.api.ts (if missing)

**Location:** `tests/shared/base.api.ts`

**Content:**
```typescript
import { APIRequestContext, expect } from '@playwright/test';
import { z } from 'zod';

export interface APIClientOptions {
  request: APIRequestContext;
  baseURL: string;
}

/**
 * BaseAPI - Shared base class for all API client classes
 * Provides common HTTP methods with Zod schema validation
 */
export class BaseAPI {
  protected request: APIRequestContext;
  protected baseURL: string;

  constructor(options: APIClientOptions) {
    this.request = options.request;
    this.baseURL = options.baseURL;
  }

  /**
   * GET request with optional Zod validation
   */
  protected async get<T>(
    endpoint: string,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    const response = await this.request.get(`${this.baseURL}${endpoint}`);
    
    if (!response.ok()) {
      throw new Error(
        `GET ${endpoint} failed: ${response.status()} ${response.statusText()}`
      );
    }

    const json = await response.json();
    return schema ? schema.parse(json) : json;
  }

  /**
   * POST request with optional Zod validation
   */
  protected async post<T>(
    endpoint: string,
    data: any,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    const response = await this.request.post(`${this.baseURL}${endpoint}`, {
      data,
    });

    if (!response.ok()) {
      throw new Error(
        `POST ${endpoint} failed: ${response.status()} ${response.statusText()}`
      );
    }

    const json = await response.json();
    return schema ? schema.parse(json) : json;
  }

  /**
   * PATCH request with optional Zod validation
   */
  protected async patch<T>(
    endpoint: string,
    data: any,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    const response = await this.request.patch(`${this.baseURL}${endpoint}`, {
      data,
    });

    if (!response.ok()) {
      throw new Error(
        `PATCH ${endpoint} failed: ${response.status()} ${response.statusText()}`
      );
    }

    const json = await response.json();
    return schema ? schema.parse(json) : json;
  }

  /**
   * PUT request with optional Zod validation
   */
  protected async put<T>(
    endpoint: string,
    data: any,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    const response = await this.request.put(`${this.baseURL}${endpoint}`, {
      data,
    });

    if (!response.ok()) {
      throw new Error(
        `PUT ${endpoint} failed: ${response.status()} ${response.statusText()}`
      );
    }

    const json = await response.json();
    return schema ? schema.parse(json) : json;
  }

  /**
   * DELETE request
   */
  protected async delete(endpoint: string): Promise<void> {
    const response = await this.request.delete(`${this.baseURL}${endpoint}`);

    if (!response.ok()) {
      throw new Error(
        `DELETE ${endpoint} failed: ${response.status()} ${response.statusText()}`
      );
    }
  }

  /**
   * Health check
   */
  async health(): Promise<{ status: string; service: string }> {
    return this.get('/health');
  }
}
```

### 2.8 Create tests/shared/common.ts (if missing)

**Location:** `tests/shared/common.ts`

**Content:**
```typescript
import { Page } from '@playwright/test';

/**
 * Common test utilities shared across all tests
 */

/**
 * Wait for all network requests to complete
 */
export async function waitForNetworkIdle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
}

/**
 * Clear browser storage
 */
export async function clearBrowserStorage(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Mock API endpoint with response
 */
export async function mockEndpoint(
  page: Page,
  pattern: string,
  response: any,
  status: number = 200
): Promise<void> {
  await page.route(pattern, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Unmock API endpoint
 */
export async function unmockEndpoint(page: Page, pattern: string): Promise<void> {
  await page.unroute(pattern);
}
```

---

## Phase 3: Verify Setup Complete

Run verification commands:

```bash
# Check Playwright is installed
npm list @playwright/test

# Check config exists
ls -la playwright.config.ts

# Check folder structure
tree tests/ -L 2

# Verify npm scripts
npm run test:ui -- --help
npm run test:api -- --help
```

**All should pass without errors.**

---

## Phase 4: Generate Test Files

Only after Phase 1-3 complete, generate test files:

- Use **UI Testing Skill** to create `*.ui.spec.ts` files
- Use **API Testing Skill** to create `*.api.spec.ts` files
- Use **Test Data Management Skill** to create factories and fixtures

---

## Agent Instructions

**When an agent encounters a request to generate tests:**

1. **Execute Phase 1** (Pre-Flight Checks)
   - Check each requirement
   - Report what's missing

2. **Execute Phase 2** (Setup)
   - For each missing component, create it
   - Install packages if needed
   - Create folders and files

3. **Verify Phase 3** (Verification)
   - Run checks to confirm everything is ready

4. **Then and ONLY THEN** (Phase 4)
   - Generate the actual test files
   - Reference appropriate Skills
   - Report what was created

---

## Quick Reference: Complete Setup (Single Command)

If starting from scratch, execute this complete setup:

```bash
# 1. Install Playwright
npm install --save-dev @playwright/test

# 2. Create playwright.config.ts
cat > playwright.config.ts << 'EOF'
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  projects: [
    { name: 'api', testMatch: '**/*.api.spec.ts', use: { baseURL: 'http://localhost:3000' } },
    { name: 'ui', testMatch: '**/*.ui.spec.ts', use: { baseURL: 'http://localhost:9002' } },
  ],
  fullyParallel: true,
  retries: 0,
  reporter: ['html'],
  timeout: 30000,
});
EOF

# 3. Create folder structure
mkdir -p tests/{app/{pages,fixtures},microservices/shared,shared}

# 4. Update package.json with test scripts
# (Add manually or use npm commands)
```

---

## Critical Notes

- **All checks MUST pass** before test generation
- **Playwright must be installed** in the frontend package.json
- **playwright.config.ts must exist** at project root
- **Test folder structure must exist** before files are created
- **TypeScript configuration must be correct** for imports to work
- **Shared base classes must exist** before service-specific tests are created
