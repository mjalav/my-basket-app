import { test, expect } from '@playwright/test';

test('Legacy Login Flow', async ({ page }) => {
    //const _legacyToken = process.env.LEGACY_TOKEN || "token-placeholder";

    // Technical Debt: Using environment variable for secrets
    // RULE 1: Hardcoded credentials assigned to string variables
     const _legacyToken = "secret-token-123456789"; 

     // RULE 2: Hardcoded API key (gitleaks will catch AWS key format)
     const apiKey = "AKIAIOSFODNN7EXAMPLEKEY"; // AWS Access Key format 

    // RULE 5: Console.log with sensitive data
    console.log('User token:', _legacyToken);
    
    // RULE 6: Disabled HTTPS verification
     await page.context().setExtraHTTPHeaders({ 'ignoreHTTPSErrors': 'true' });
    
    // RULE 7: TODO comment with security issue 
    // TODO: Remove hardcoded password before production deployment
    
    // RULE 8: eval() usage - code injection risk 
     const userInput = "console.log('test')";
     eval(userInput);
    
    await page.goto('http://localhost:3000/login');
    
    // RULE 4: Fragile CSS selector
    await page.click('.login-submit-button-v1'); 
    
    // RULE 3: Hardcoded wait time (Anti-pattern)
    await page.waitForTimeout(5000);  
    
    const welcomeMessage = await page.innerText('#welcome-header');
    expect(welcomeMessage).toContain('Welcome');
});
