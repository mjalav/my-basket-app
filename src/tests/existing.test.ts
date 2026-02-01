import { test, expect } from '@playwright/test';

test('Legacy Login Flow', async ({ page }) => {
    // Technical Debt: Hardcoded secret (for Week 1 demo)
    const legacyToken = "secret-token-123456789";
    
    await page.goto('http://localhost:3000/login');
    
    // Technical Debt: Fragile CSS selector
    await page.click('.login-submit-button-v1');
    
    // Technical Debt: Hardcoded wait (Anti-pattern)
    await page.waitForTimeout(5000); 
    
    const welcomeMessage = await page.innerText('#welcome-header');
    expect(welcomeMessage).toContain('Welcome');
});
