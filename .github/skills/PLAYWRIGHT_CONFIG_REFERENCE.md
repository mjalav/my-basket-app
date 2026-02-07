# Playwright Configuration Reference

This file documents the recommended `playwright.config.ts` configuration for MyBasket Lite testing setup.

## Single Project vs Multiple Projects

Based on your requirements and Playwright best practices, here's the **recommended configuration**:

## Recommended: Single Config with Dual Projects

This approach allows shared settings while keeping API and UI tests organized:

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

/**
 * API Gateway base URL - all API tests route through the gateway
 */
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000';

/**
 * Frontend base URL for UI tests
 */
const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

/**
 * Microservices URLs for direct testing (optional)
 */
const MICROSERVICE_URLS = {
  productService: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001',
  cartService: process.env.CART_SERVICE_URL || 'http://localhost:3002',
  orderService: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
  aiService: process.env.AI_SERVICE_URL || 'http://localhost:3004',
};

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  /**
   * Global test setup (optional)
   * Useful for creating mock servers or database state
   */
  // globalSetup: require.resolve('./tests/global-setup.ts'),
  // globalTeardown: require.resolve('./tests/global-teardown.ts'),

  projects: [
    /**
     * API Testing Project
     * - Tests all microservices via API Gateway
     * - Single browser (Chromium) for speed
     * - Runs tests in parallel within project
     * - Matches files: *.api.spec.ts
     */
    {
      name: 'api',
      testMatch: '**/*.api.spec.ts',
      use: {
        baseURL: API_GATEWAY_URL,
        // Optional: Add headers for all API requests
        extraHTTPHeaders: {
          'User-Agent': 'MyBasket-Tests/1.0',
        },
      },
    },

    /**
     * UI Testing - Chromium
     * - Tests Next.js frontend
     * - Desktop Chromium browser
     * - Matches files: *.ui.spec.ts
     */
    {
      name: 'ui-chromium',
      testMatch: '**/*.ui.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: FRONTEND_URL,
        // Increase timeout for slow networks
        navigationTimeout: 30000,
        actionTimeout: 10000,
      },
    },

    /**
     * UI Testing - Firefox
     * - Same tests, different browser
     * - Useful for browser compatibility
     */
    {
      name: 'ui-firefox',
      testMatch: '**/*.ui.spec.ts',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: FRONTEND_URL,
      },
    },

    /**
     * Optional: Mobile testing
     * - Test responsive UI on mobile
     * - Uncomment to enable
     */
    // {
    //   name: 'ui-mobile',
    //   testMatch: '**/*.ui.spec.ts',
    //   use: {
    //     ...devices['Pixel 5'],
    //     baseURL: FRONTEND_URL,
    //   },
    // },
  ],

  /**
   * Web server configuration
   * Automatically starts Next.js server before tests
   * Only needed if you want Playwright to manage the server
   */
  webServer: [
    {
      command: 'npm run dev',
      url: FRONTEND_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    // Optional: Start microservices
    // {
    //   command: 'npm run microservices:start',
    //   url: API_GATEWAY_URL,
    //   reuseExistingServer: !process.env.CI,
    //   timeout: 120 * 1000,
    // },
  ],
});
```

## Alternative: Separate Projects (If You Need Different Settings)

If API and UI tests need different configurations (timeouts, retries, etc.):

```typescript
// playwright.config.ts (alternative approach)
export default defineConfig({
  testDir: './tests',

  projects: [
    /**
     * API Project - Fast, headless, minimal config
     */
    {
      name: 'api',
      testMatch: 'tests/microservices/**/*.api.spec.ts',
      timeout: 30000,
      expect: { timeout: 5000 },
      use: {
        baseURL: 'http://localhost:3000',
        httpCredentials: process.env.API_TOKEN ? {
          username: 'token',
          password: process.env.API_TOKEN,
        } : undefined,
      },
    },

    /**
     * UI Project - Slower, may need more time
     */
    {
      name: 'ui',
      testMatch: 'tests/app/**/*.ui.spec.ts',
      timeout: 60000,
      expect: { timeout: 10000 },
      use: {
        baseURL: 'http://localhost:9002',
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
```

## Environment Variables

Create `.env.test` (git-ignored) for test-specific configuration:

```bash
# API Gateway & Microservices
API_GATEWAY_URL=http://localhost:3000
PRODUCT_SERVICE_URL=http://localhost:3001
CART_SERVICE_URL=http://localhost:3002
ORDER_SERVICE_URL=http://localhost:3003
AI_SERVICE_URL=http://localhost:3004

# Frontend
NEXT_PUBLIC_APP_URL=http://localhost:9002

# Optional: Authentication
API_TOKEN=test-token-123

# CI/CD
CI=false
```

Load in config:
```typescript
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
```

## Running Tests

### All Tests
```bash
npm run test                    # Runs all projects (api, ui-chromium, ui-firefox)
```

### By Project
```bash
npm run test -- --project=api                # API tests only
npm run test -- --project=ui-chromium        # UI Chromium only
npm run test -- --project=ui-firefox         # UI Firefox only
```

### By File Pattern
```bash
npm run test -- tests/microservices/product-service/
npm run test -- tests/app/home.ui.spec.ts
```

### With Options
```bash
npm run test -- --debug                      # Debug mode
npm run test -- --headed                     # See browser
npm run test -- --ui                         # UI mode (watch mode)
npm run test -- --headed --ui                # UI mode in headed browser
npm run test -- --trace on                   # Record traces
npm run test -- --grep "checkout"            # Filter by name
npx playwright test --workers=4              # Parallel workers
```

### View Results
```bash
npx playwright show-report                   # View HTML report
```

## CI/CD Integration

### GitHub Actions Example
```yaml
# .github/workflows/test.yml
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
      - run: npm run microservices:start &
      - run: sleep 10  # Wait for services
      - run: npm run test -- --project=api
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: api-test-results
          path: test-results/

  ui-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build &
      - run: npm start &
      - run: sleep 5  # Wait for server
      - run: npm run test -- --project=ui-chromium
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: ui-test-results
          path: test-results/
```

## Package.json Scripts

Add these scripts for convenience:

```json
{
  "scripts": {
    "test": "playwright test",
    "test:api": "playwright test --project=api",
    "test:ui": "playwright test --project=ui-chromium",
    "test:ui:firefox": "playwright test --project=ui-firefox",
    "test:ui:all": "playwright test --project=ui-chromium --project=ui-firefox",
    "test:debug": "playwright test --debug",
    "test:headed": "playwright test --headed",
    "test:ui:watch": "playwright test --project=ui-chromium --ui",
    "test:report": "playwright show-report",
    "test:codegen": "playwright codegen localhost:9002"
  }
}
```

## Common Configuration Patterns

### Skip Tests in CI
```typescript
test.skip(!!process.env.CI, 'Skipped in CI');
```

### Increase Timeout for Slow Services
```typescript
test.setTimeout(60000); // 60 seconds for this test
```

### Only Run on Specific Browser
```typescript
test.skip(
  process.env.BROWSER !== 'chromium',
  'Chrome-specific test'
);
```

### Mock Network for Offline Testing
```typescript
test('works offline', async ({ page }) => {
  await page.context().setOffline(true);
  // Test behavior
  await page.context().setOffline(false);
});
```

## Troubleshooting

### Tests timing out
- Increase `timeout` in project config or specific test
- Check if services are running (`npm run microservices:health`)
- Verify baseURL is correct

### Port conflicts
```bash
lsof -i :3000-3004  # Find processes on ports
kill -9 <PID>       # Kill if needed
npm run microservices:start  # Restart services
```

### Tests pass locally but fail in CI
- Check environment variables in CI
- Verify services are started before tests
- Check for OS-specific issues (paths, line endings)
- Use `trace: 'on'` to capture failure details

### Slow tests
- Use `test.describe.configure({ mode: 'parallel' })` for independent tests
- Run with `--workers=4` for more parallelization
- Check for `page.waitForTimeout()` and replace with web-first assertions

## References
- [Playwright Configuration Reference](https://playwright.dev/docs/test-configuration)
- [Projects](https://playwright.dev/docs/test-projects)
- [Reporters](https://playwright.dev/docs/test-reporters)
- [Web Server](https://playwright.dev/docs/test-webserver)
