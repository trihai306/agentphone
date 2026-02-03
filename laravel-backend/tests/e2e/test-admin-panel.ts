import { chromium } from '@playwright/test';

/**
 * Filament Admin Panel Full Test
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
  
  console.log('🔧 FILAMENT ADMIN PANEL TEST\n');
  console.log('='.repeat(60) + '\n');
  
  // ==================== LOGIN ====================
  console.log('🔐 Logging into Admin Panel...\n');
  
  await page.goto('http://localhost:8001/admin/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: './tests/e2e/results/admin-01-login.png' });
  
  // Fill login form
  await page.locator('input[type="email"]').first().fill('admin@example.com');
  await page.locator('input[type="password"]').first().fill('password');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log(`   Current URL: ${page.url()}`);
  
  // Navigate directly to admin
  await page.goto('http://localhost:8001/admin');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  console.log(`   Admin URL: ${page.url()}`);
  await page.screenshot({ path: './tests/e2e/results/admin-02-dashboard.png', fullPage: true });
  
  // Check if we're in admin
  const isAdmin = page.url().includes('/admin') && !page.url().includes('/login');
  if (!isAdmin) {
    console.log('   ❌ Cannot access admin panel');
    await context.close();
    await browser.close();
    return;
  }
  console.log('   ✅ Admin panel loaded\n');
  
  // ==================== GET SIDEBAR LINKS ====================
  console.log('📋 Discovering admin resources...\n');
  
  // Get all sidebar navigation links
  const sidebarLinks = page.locator('nav a, aside a, [class*="sidebar"] a, [class*="navigation"] a');
  const linkCount = await sidebarLinks.count();
  console.log(`   Found ${linkCount} navigation links`);
  
  // Extract admin paths
  const adminPaths: string[] = [];
  for (let i = 0; i < linkCount; i++) {
    const href = await sidebarLinks.nth(i).getAttribute('href');
    if (href && href.includes('/admin/') && !adminPaths.includes(href)) {
      adminPaths.push(href);
    }
  }
  console.log(`   Unique admin paths: ${adminPaths.length}\n`);
  
  // ==================== TEST RESOURCES ====================
  const resources = [
    { name: 'Dashboard', path: '/admin' },
    { name: 'Users', path: '/admin/users' },
    { name: 'Devices', path: '/admin/devices' },
    { name: 'Campaigns', path: '/admin/campaigns' },
    { name: 'Flows', path: '/admin/flows' },
    { name: 'AI Generations', path: '/admin/ai-generations' },
    { name: 'AI Scenarios', path: '/admin/ai-scenarios' },
    { name: 'AI Credit Packages', path: '/admin/ai-credit-packages' },
    { name: 'Service Packages', path: '/admin/service-packages' },
    { name: 'User Media', path: '/admin/user-media' },
    { name: 'Wallet Transactions', path: '/admin/wallet-transactions' },
    { name: 'Topup Transactions', path: '/admin/topup-transactions' },
    { name: 'Activity Logs', path: '/admin/activity-logs' },
    { name: 'Error Reports', path: '/admin/error-reports' },
    { name: 'Banks', path: '/admin/banks' },
    { name: 'Jobs', path: '/admin/job-logs' },
  ];
  
  console.log('━'.repeat(60));
  console.log('📊 Testing Admin Resources');
  console.log('━'.repeat(60) + '\n');
  
  let passed = 0;
  let failed = 0;
  
  for (let i = 0; i < resources.length; i++) {
    const r = resources[i];
    const num = String(i + 1).padStart(2, '0');
    process.stdout.write(`[${num}/${resources.length}] ${r.name}... `);
    
    try {
      await page.goto(`http://localhost:8001${r.path}`, { timeout: 10000 });
      await page.waitForLoadState('networkidle', { timeout: 8000 });
      await page.waitForTimeout(500);
      
      const content = await page.locator('body').innerHTML();
      const is404 = content.includes('404') && content.includes('Not Found');
      const isError = content.includes('500') && content.includes('Server Error');
      
      if (!is404 && !isError && content.length > 500) {
        console.log('✅');
        passed++;
        
        // Take screenshot for key pages
        if (i < 8) {
          await page.screenshot({ 
            path: `./tests/e2e/results/admin-${num}-${r.name.toLowerCase().replace(/\s+/g, '-')}.png`,
            fullPage: true 
          });
        }
      } else {
        console.log('❌');
        failed++;
      }
    } catch (e) {
      console.log('⚠️ Timeout');
      failed++;
    }
  }
  
  // ==================== TEST CRUD ====================
  console.log('\n━'.repeat(60));
  console.log('🔧 Testing CRUD Operations');
  console.log('━'.repeat(60) + '\n');
  
  // Test Users list
  await page.goto('http://localhost:8001/admin/users');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  // Check table
  const table = page.locator('table');
  if (await table.count() > 0) {
    const rows = await page.locator('table tbody tr').count();
    console.log(`   ✅ Users table: ${rows} rows`);
  }
  await page.screenshot({ path: './tests/e2e/results/admin-users-list.png', fullPage: true });
  
  // Try view user
  const viewBtn = page.locator('a[href*="/admin/users/"]').first();
  if (await viewBtn.count() > 0) {
    await viewBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    console.log(`   ✅ User detail: ${page.url()}`);
    await page.screenshot({ path: './tests/e2e/results/admin-user-detail.png', fullPage: true });
  }
  
  // Test Create form
  await page.goto('http://localhost:8001/admin/users/create');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  const form = page.locator('form');
  if (await form.count() > 0) {
    console.log('   ✅ Create user form available');
    await page.screenshot({ path: './tests/e2e/results/admin-user-create.png', fullPage: true });
  }
  
  // ==================== TEST PAGES ====================
  console.log('\n━'.repeat(60));
  console.log('📄 Testing Admin Pages');
  console.log('━'.repeat(60) + '\n');
  
  const adminPages = [
    { name: 'Settings', path: '/admin/settings' },
    { name: 'API Monitor', path: '/admin/api-monitor' },
    { name: 'System Resources', path: '/admin/system-resources' },
  ];
  
  for (const pg of adminPages) {
    process.stdout.write(`   ${pg.name}... `);
    try {
      await page.goto(`http://localhost:8001${pg.path}`, { timeout: 8000 });
      await page.waitForLoadState('networkidle', { timeout: 5000 });
      
      const content = await page.locator('body').innerHTML();
      if (content.length > 500 && !content.includes('404')) {
        console.log('✅');
        passed++;
      } else {
        console.log('❌');
        failed++;
      }
    } catch (e) {
      console.log('⚠️');
      failed++;
    }
  }
  
  // ==================== SUMMARY ====================
  console.log('\n' + '='.repeat(60));
  console.log('📊 ADMIN PANEL TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}\n`);
  
  await context.close();
  await browser.close();
  
  console.log('🎬 Video saved!');
})();
