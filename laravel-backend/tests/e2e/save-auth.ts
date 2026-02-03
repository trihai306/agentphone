import { chromium } from '@playwright/test';

/**
 * Lưu session sau khi login
 * Chạy 1 lần, sau đó các tests khác reuse session
 */
(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('🔐 Đăng nhập để lưu session...');
  
  await page.goto('http://localhost:8001/login');
  await page.waitForLoadState('networkidle');
  
  await page.locator('input[type="email"]').first().fill('admin@example.com');
  await page.locator('input[type="password"]').first().fill('password');
  await page.locator('button[type="submit"]').first().click();
  
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  const currentUrl = page.url();
  console.log(`📍 Current URL: ${currentUrl}`);
  
  if (!currentUrl.includes('login')) {
    // Save session to file
    await context.storageState({ path: './tests/e2e/auth.json' });
    console.log('✅ Session đã lưu vào: tests/e2e/auth.json');
  } else {
    console.log('❌ Login failed - không lưu session');
  }
  
  await browser.close();
})();
