import { test, expect } from '../../../src/fixtures/api-fixtures';

/**
 * Issue #6: Caching Mechanism
 * Purpose: Ensure health checks don't overwhelm dependencies
 */
test.describe('Issue #6: Caching Mechanism @high', () => {

  test('Consecutive health checks should return cached results', async ({ cartApi }) => {
    const firstResp = await cartApi.getReadiness();
    const firstBody = await firstResp.json();
    const firstTimestamp = firstBody.timestamp;
    
    // Immediate second check
    const secondResp = await cartApi.getReadiness();
    const secondBody = await secondResp.json();
    const secondTimestamp = secondBody.timestamp;
    
    // Timestamps should be identical if cached
    expect(secondTimestamp).toBe(firstTimestamp);
  });

  test('Cache should expire after 30 seconds', async ({ cartApi }) => {
    test.setTimeout(45000); 
    
    const firstResp = await cartApi.getReadiness();
    const firstBody = await firstResp.json();
    const firstTimestamp = firstBody.timestamp;
    
    console.log('Waiting 31s for cache expiry...');
    await new Promise(resolve => setTimeout(resolve, 31000));
    
    const thirdResp = await cartApi.getReadiness();
    const thirdBody = await thirdResp.json();
    const thirdTimestamp = thirdBody.timestamp;
    
    // Timestamps should differ after expiry
    expect(thirdTimestamp).not.toBe(firstTimestamp);
  });
});
