import { chromium } from '@playwright/test';

/**
 * Complete Admin Panel Test - With proper session handling
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
  
  console.log('🔧 COMPLETE ADMIN PANEL TEST\n');
  console.log('='.repeat(60) + '\n');
  
  // ==================== LOGIN ====================
  console.log('🔐 Logging into Admin...\n');
  
  await page.goto('http://localhost:8001/admin/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  await page.locator('input[type="email"]').first().fill('admin@example.com');
  await page.locator('input[type="password"]').first().fill('password');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Navigate to a known working page to confirm login
  await page.goto('http://localhost:8001/admin/users');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  const isLoggedIn = page.url().includes('/admin/users');
  console.log(`   Login status: ${isLoggedIn ? '✅ OK' : '❌ Failed'}`);
  await page.screenshot({ path: './tests/e2e/results/admin-complete-01-login.png', fullPage: true });
  
  if (!isLoggedIn) {
    console.log('   Cannot login, aborting...');
    await context.close();
    await browser.close();
    return;
  }
  
  // ==================== RESOURCES ====================
  console.log('\n━'.repeat(60));
  console.log('📊 Testing Admin Resources');
  console.log('━'.repeat(60) + '\n');
  
  const resources = [
    'users', 'devices', 'device-activity-logs', 'campaigns', 'flows',
    'interaction-histories', 'ai-generations', 'ai-scenarios', 
    'ai-credit-packages', 'service-packages', 'user-media',
    'wallets', 'banks', 'transactions', 'activity-logs', 
    'api-logs', 'error-reports', 'job-logs', 'data-collections'
  ];
  
  let resourcesPassed = 0;
  
  for (const r of resources) {
    process.stdout.write(`   ${r}... `);
    
    await page.goto(`http://localhost:8001/admin/${r}`, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
    
    const url = page.url();
    const ok = url.includes(`/admin/${r}`);
    
    if (ok) {
      console.log('✅');
      resourcesPassed++;
    } else {
      console.log('❌');
    }
  }
  
  console.log(`\n   Resources: ${resourcesPassed}/${resources.length} passed`);
  
  // ==================== PAGES ====================
  console.log('\n━'.repeat(60));
  console.log('📄 Testing Admin Pages');
  console.log('━'.repeat(60) + '\n');
  
  const pages = [
    'api-monitor', 'backup-manager', 'device-analytics',
    'notification-center', 'report-builder', 'schedule-manager',
    'service-package-analytics', 'settings', 'system-resources',
    'workflow-analytics'
  ];
  
  let pagesPassed = 0;
  
  for (const p of pages) {
    process.stdout.write(`   ${p}... `);
    
    await page.goto(`http://localhost:8001/admin/${p}`, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
    
    const url = page.url();
    const ok = url.includes(`/admin/${p}`);
    
    if (ok) {
      console.log('✅');
      pagesPassed++;
    } else {
      console.log('❌');
    }
  }
  
  console.log(`\n   Pages: ${pagesPassed}/${pages.length} passed`);
  
  // ==================== SCREENSHOTS ====================
  console.log('\n━'.repeat(60));
  console.log('📸 Taking Screenshots');
  console.log('━'.repeat(60) + '\n');
  
  const screenshotPages = [
    { name: 'Dashboard', path: '/admin' },
    { name: 'Users', path: '/admin/users' },
    { name: 'Devices', path: '/admin/devices' },
    { name: 'AI Generations', path: '/admin/ai-generations' },
    { name: 'Campaigns', path: '/admin/campaigns' },
    { name: 'Settings', path: '/admin/settings' },
    { name: 'Wallets', path: '/admin/wallets' },
    { name: 'Banks', path: '/admin/banks' },
  ];
  
  for (let i = 0; i < screenshotPages.length; i++) {
    const p = screenshotPages[i];
    const num = String(i + 2).padStart(2, '0');
    
    await page.goto(`http://localhost:8001${p.path}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: `./tests/e2e/results/admin-complete-${num}-${p.name.toLowerCase().replace(/\s+/g, '-')}.png`,
      fullPage: true 
    });
    console.log(`   ✅ ${p.name}`);
  }
  
  // ==================== CRUD TEST ====================
  console.log('\n━'.repeat(60));
  console.log('🔧 Testing CRUD');
  console.log('━'.repeat(60) + '\n');
  
  // View user
  await page.goto('http://localhost:8001/admin/users');
  await page.waitForLoadState('networkidle');
  
  const rows = await page.locator('table tbody tr').count();
  console.log(`   Users in table: ${rows}`);
  
  // Edit user
  await page.goto('http://localhost:8001/admin/users/2/edit');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  const form = await page.locator('form').count();
  console.log(`   Edit form: ${form > 0 ? '✅' : '❌'}`);
  await page.screenshot({ path: './tests/e2e/results/admin-complete-edit.png', fullPage: true });
  
  // ==================== SUMMARY ====================
  const total = resourcesPassed + pagesPassed;
  const totalTests = resources.length + pages.length;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 ADMIN TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`\n✅ Resources: ${resourcesPassed}/${resources.length}`);
  console.log(`✅ Pages: ${pagesPassed}/${pages.length}`);
  console.log(`📊 Total: ${total}/${totalTests}`);
  console.log('\n' + '='.repeat(60));
  
  await context.close();
  await browser.close();
  
  console.log('\n🎬 Video saved!');
})();
