import { chromium } from '@playwright/test';

/**
 * Part 1: Users & Devices Detailed Test
 */
(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    recordVideo: { dir: './tests/e2e/results/', size: { width: 1280, height: 720 } }
  });
  const page = await context.newPage();
  
  console.log('👥 PART 1: USERS & DEVICES\n');
  
  // Login
  await page.goto('http://localhost:8001/admin/login');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').first().fill('admin@example.com');
  await page.locator('input[type="password"]').first().fill('password');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // ===== USERS =====
  console.log('━'.repeat(50));
  console.log('👥 USERS MANAGEMENT');
  console.log('━'.repeat(50) + '\n');
  
  // List
  await page.goto('http://localhost:8001/admin/users');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('1. User List');
  await page.screenshot({ path: './tests/e2e/results/p1-01-users-list.png', fullPage: true });
  
  // Search
  const search = page.locator('input[type="search"]').first();
  if (await search.count() > 0) {
    await search.fill('admin');
    await page.waitForTimeout(1500);
    console.log('2. Search: "admin"');
    await page.screenshot({ path: './tests/e2e/results/p1-02-users-search.png' });
    await search.fill('');
    await page.waitForTimeout(500);
  }
  
  // View user
  await page.goto('http://localhost:8001/admin/users/2');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('3. View User #2');
  await page.screenshot({ path: './tests/e2e/results/p1-03-user-view.png', fullPage: true });
  
  // Edit user
  await page.goto('http://localhost:8001/admin/users/2/edit');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('4. Edit User Form');
  await page.screenshot({ path: './tests/e2e/results/p1-04-user-edit.png', fullPage: true });
  
  // Try update name
  const nameInput = page.locator('input[name*="name"], input').first();
  if (await nameInput.count() > 0) {
    await nameInput.click();
    await page.waitForTimeout(500);
  }
  
  // Create user
  await page.goto('http://localhost:8001/admin/users/create');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('5. Create User Form');
  await page.screenshot({ path: './tests/e2e/results/p1-05-user-create.png', fullPage: true });
  
  // ===== DEVICES =====
  console.log('\n━'.repeat(50));
  console.log('📱 DEVICES MANAGEMENT');
  console.log('━'.repeat(50) + '\n');
  
  await page.goto('http://localhost:8001/admin/devices');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('1. Device List');
  await page.screenshot({ path: './tests/e2e/results/p1-06-devices-list.png', fullPage: true });
  
  // Open filter
  const filterBtn = page.locator('button:has-text("Filter"), button:has-text("Lọc"), [class*="filter"]').first();
  if (await filterBtn.count() > 0) {
    await filterBtn.click();
    await page.waitForTimeout(1000);
    console.log('2. Filter Panel');
    await page.screenshot({ path: './tests/e2e/results/p1-07-devices-filter.png' });
  }
  
  // Device activity logs
  await page.goto('http://localhost:8001/admin/device-activity-logs');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('3. Device Activity Logs');
  await page.screenshot({ path: './tests/e2e/results/p1-08-device-logs.png', fullPage: true });
  
  console.log('\n✅ Part 1 Complete!');
  
  await context.close();
  await browser.close();
})();
