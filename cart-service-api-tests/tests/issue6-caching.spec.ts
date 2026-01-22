import { test, expect } from '@playwright/test';
import { ReadinessAPI } from '../src/pages/readiness-api';

/**
 * Issue #6: Caching Mechanism
 * Purpose: Ensure health checks don't overwhelm dependencies
 */
test.describe('Issue #6: Caching Mechanism @high', () => {
  let readinessAPI: ReadinessAPI;

  test.beforeEach(async ({ request }) => {
    readinessAPI = new ReadinessAPI(request);
  });

  test('Consecutive health checks should return cached results', async () => {
    const firstResponse = await readinessAPI.getReadinessStatus();
    const firstTimestamp = firstResponse.timestamp;
    
    // Immediate second check
    const secondResponse = await readinessAPI.getReadinessStatus();
    const secondTimestamp = secondResponse.timestamp;
    
    // Timestamps should be identical if cached
    expect(secondTimestamp).toBe(firstTimestamp);
  });

  test('Cache should expire after 30 seconds', async () => {
    test.setTimeout(40000); // Increase test timeout
    
    const firstResponse = await readinessAPI.getReadinessStatus();
    const firstTimestamp = firstResponse.timestamp;
    
    console.log('Waiting 31s for cache expiry...');
    await new Promise(resolve => setTimeout(resolve, 31000));
    
    const thirdResponse = await readinessAPI.getReadinessStatus();
    const thirdTimestamp = thirdResponse.timestamp;
    
    // Timestamps should differ after expiry
    expect(thirdTimestamp).not.toBe(firstTimestamp);
  });
});
