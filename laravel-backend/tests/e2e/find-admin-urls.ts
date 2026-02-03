import { chromium } from '@playwright/test';

/**
 * Quick test to find correct admin page URLs
 */
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Login
  await page.goto('http://localhost:8001/admin/login');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').first().fill('admin@example.com');
  await page.locator('input[type="password"]').first().fill('password');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  // Go to users to confirm logged in
  await page.goto('http://localhost:8001/admin/users');
  await page.waitForLoadState('networkidle');
  
  const testUrls = [
    // Pages with defined slugs
    '/admin/api-monitor',
    '/admin/device-analytics',
    '/admin/service-package-analytics',
    '/admin/system-resources',
    '/admin/workflow-analytics',
    '/admin/backup-manager',
    '/admin/schedule-manager',
    '/admin/report-builder',
    
    // Pages without slug (use class name)
    '/admin/settings',
    '/admin/notification-center',
    '/admin/transaction-dashboard',
    
    // Resources
    '/admin/transactions',
    '/admin/media-storage-plans',
  ];
  
  console.log('Testing admin URLs:\n');
  
  for (const url of testUrls) {
    await page.goto(`http://localhost:8001${url}`, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(300);
    
    const content = await page.locator('body').innerHTML();
    const is404 = content.includes('404');
    const hasFilament = content.includes('fi-');
    
    const status = !is404 && hasFilament ? '✅' : '❌';
    console.log(`${status} ${url}`);
  }
  
  await browser.close();
})();
