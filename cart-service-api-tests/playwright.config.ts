import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Playwright configuration for Cart Service API tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './tests',
  
  // Maximum time one test can run
  timeout: 30 * 1000,
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for API requests
    baseURL: process.env.CART_SERVICE_URL || 'http://localhost:3002',
    
    // API request timeout
    actionTimeout: 10 * 1000,
    
    // Collect trace on failure
    trace: 'on-first-retry',
    
    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },

  // Configure projects for different environments
  projects: [
    {
      name: 'dev',
      use: {
        baseURL: process.env.CART_SERVICE_URL || 'http://localhost:3002',
      },
    },
    {
      name: 'staging',
      use: {
        baseURL: process.env.STAGING_CART_SERVICE_URL || 'http://staging:3002',
      },
    },
    {
      name: 'prod',
      use: {
        baseURL: process.env.PROD_CART_SERVICE_URL || 'http://prod:3002',
      },
    },
  ],

  // Global setup/teardown
  globalSetup: undefined,
  globalTeardown: undefined,
});
