import { test, expect } from '@playwright/test';
import { LivenessAPI } from '../src/pages/liveness-api';
import { ReadinessAPI } from '../src/pages/readiness-api';

/**
 * Issue #2: Liveness vs Readiness Distinction
 * Purpose: Ensure service differentiates between "alive" and "ready to handle traffic"
 */
test.describe('Issue #2: Liveness vs Readiness @critical', () => {
  let livenessAPI: LivenessAPI;
  let readinessAPI: ReadinessAPI;

  test.beforeEach(async ({ request }) => {
    livenessAPI = new LivenessAPI(request);
    readinessAPI = new ReadinessAPI(request);
  });

  test('Liveness endpoint /api/health/live should exist and return 200', async () => {
    const response = await livenessAPI.checkLiveness();
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.service).toBe('cart-service');
    expect(body.status).toBe('healthy');
  });

  test('Readiness endpoint /api/health/ready should exist', async () => {
    const response = await readinessAPI.checkReadiness();
    // In healthy state it's 200, in unhealthy it's 503
    expect([200, 503]).toContain(response.status());
  });

  test('Liveness should be lightweight (no dependency checks)', async () => {
    const body = await livenessAPI.getLivenessStatus();
    expect(body.checks?.dependencies).toBeUndefined();
    expect(body.checks?.resources).toBeUndefined();
  });

  test('Readiness should include comprehensive checks', async () => {
    const body = await readinessAPI.getReadinessStatus();
    expect(body.checks).toBeDefined();
    expect(body.checks?.dependencies).toBeDefined();
    expect(body.checks?.resources).toBeDefined();
  });

  test('Readiness check response should include uptime and version', async () => {
    const body = await readinessAPI.getReadinessStatus();
    expect(body.uptime).toBeDefined();
    expect(body.version).toBeDefined();
  });
});
