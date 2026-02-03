import { chromium } from '@playwright/test';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('🔐 Refreshing auth session...');
  
  await page.goto('http://localhost:8001/login');
  await page.waitForLoadState('networkidle');
  
  await page.locator('input[type="email"]').first().fill('admin@example.com');
  await page.locator('input[type="password"]').first().fill('password');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  if (!page.url().includes('/login')) {
    await context.storageState({ path: './tests/e2e/auth.json' });
    console.log('✅ Auth refreshed!');
  } else {
    console.log('❌ Login failed');
  }
  
  await browser.close();
})();
