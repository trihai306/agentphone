import { chromium } from '@playwright/test';

/**
 * Debug Admin Login
 */
(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    recordVideo: {
      dir: './tests/e2e/results/',
      size: { width: 1280, height: 720 }
    }
  });
  
  const page = await context.newPage();
  
  console.log('🔐 Testing Admin Login...');
  
  await page.goto('http://localhost:8001/admin/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  console.log('Current URL:', page.url());
  await page.screenshot({ path: './tests/e2e/results/admin-login-page.png' });
  
  // Fill form
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  
  if (await emailInput.count() > 0) {
    await emailInput.fill('admin@example.com');
    await passwordInput.fill('password');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: './tests/e2e/results/admin-login-filled.png' });
    
    // Find and click submit button
    const submitBtn = page.locator('button[type="submit"]').first();
    console.log('Submit button found:', await submitBtn.count() > 0);
    
    await submitBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('After login URL:', page.url());
    await page.screenshot({ path: './tests/e2e/results/admin-login-result.png' });
    
    // Check for errors
    const errorMsg = page.locator('[class*="danger"], [class*="error"], .fi-fo-field-wrp-error');
    if (await errorMsg.count() > 0) {
      const errorText = await errorMsg.first().textContent();
      console.log('Error message:', errorText);
    }
  } else {
    console.log('Email input not found');
  }
  
  await context.close();
  await browser.close();
})();
