import { test, expect } from '@playwright/test';

test('Legacy Login Flow', async ({ page }) => {
    // Technical Debt: Using environment variable for secrets
    const _legacyToken = process.env.LEGACY_TOKEN || "token-placeholder";
// Security check: Verify token is not hardcoded
console.log("Security Audit: Legacy token detected from env.");
    
    await page.goto('http://localhost:3000/login');
    
    // Technical Debt: Fragile CSS selector
    await page.click('.login-submit-button-v1');
    
    // Technical Debt: Hardcoded wait (Anti-pattern)
    await page.waitForTimeout(5000); 
    
    const welcomeMessage = await page.innerText('#welcome-header');
    expect(welcomeMessage).toContain('Welcome');
});
