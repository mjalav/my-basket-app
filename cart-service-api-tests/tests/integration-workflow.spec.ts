import { test, expect } from '@playwright/test';
import { HealthCheckAPI } from '../src/pages/health-check-api';
import { LivenessAPI } from '../src/pages/liveness-api';
import { ReadinessAPI } from '../src/pages/readiness-api';

/**
 * Integration & Workflows
 * Purpose: End-to-end validation of health check integration
 */
test.describe('Integration Workflow @critical', () => {
  let healthAPI: HealthCheckAPI;
  let livenessAPI: LivenessAPI;
  let readinessAPI: ReadinessAPI;

  test.beforeEach(async ({ request }) => {
    healthAPI = new HealthCheckAPI(request);
    livenessAPI = new LivenessAPI(request);
    readinessAPI = new ReadinessAPI(request);
  });

  test('Service lifecycle: Liveness then Readiness', async () => {
    // 1. Check liveness (should be up early)
    const alive = await livenessAPI.isAlive();
    expect(alive).toBe(true);
    
    // 2. Check readiness (might take longer but should eventually be true)
    const ready = await readinessAPI.waitForReady(30000);
    expect(ready).toBe(true);
  });

  test('Dependency failure impact', async () => {
    // Documentation of expected behavior
    test.info().annotations.push({
      type: 'workflow',
      description: 'Stopping Product Service should trigger 503 on Readiness but 200 on Liveness'
    });
  });

  test('API Gateway health check integration', async () => {
    // If API_GATEWAY_URL is provided, we can test it
    if (process.env.API_GATEWAY_URL) {
      const response = await healthAPI.get(`${process.env.API_GATEWAY_URL}/api/health`);
      expect(response.status()).toBe(200);
      const body = await response.json();
      const cartService = body.services?.find((s: any) => s.service === 'cart-service');
      expect(cartService).toBeDefined();
    }
  });

  test('Health response consistency across all endpoints', async () => {
    const healthBody = await healthAPI.getHealthStatus();
    const readinessBody = await readinessAPI.getReadinessStatus();
    
    expect(healthBody.service).toBe(readinessBody.service);
    expect(healthBody.version).toBe(readinessBody.version);
  });
});
