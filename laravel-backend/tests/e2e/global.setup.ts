import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup - chạy trước tất cả tests
 * Login và lưu session vào auth.json
 */
async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const baseURL = config.projects[0].use?.baseURL || 'http://localhost:8001';
  
  console.log('🔐 [Setup] Đăng nhập...');
  
  await page.goto(`${baseURL}/login`);
  await page.waitForLoadState('networkidle');
  
  await page.locator('input[type="email"]').first().fill('admin@example.com');
  await page.locator('input[type="password"]').first().fill('password');
  await page.locator('button[type="submit"]').first().click();
  
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  const currentUrl = page.url();
  
  if (!currentUrl.includes('login')) {
    await context.storageState({ path: './tests/e2e/auth.json' });
    console.log('✅ [Setup] Session saved to auth.json');
  } else {
    console.log('❌ [Setup] Login failed!');
    throw new Error('Login failed during setup');
  }
  
  await browser.close();
}

export default globalSetup;
