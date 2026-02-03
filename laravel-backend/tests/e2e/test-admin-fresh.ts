import { chromium } from '@playwright/test';

/**
 * Filament Admin Panel Test - Fresh login with clear session
 */
(async () => {
  const browser = await chromium.launch({ headless: false });
  // Create fresh context without stored state
  const context = await browser.newContext({
    recordVideo: {
      dir: './tests/e2e/results/',
      size: { width: 1280, height: 720 }
    }
  });
  
  const page = await context.newPage();
  
  console.log('🔧 FILAMENT ADMIN PANEL TEST\n');
  console.log('='.repeat(60) + '\n');
  
  // ==================== FRESH LOGIN ====================
  console.log('🔐 Fresh login to Admin Panel...\n');
  
  // Clear cookies first
  await context.clearCookies();
  
  // Go directly to admin login
  await page.goto('http://localhost:8001/admin/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  console.log(`   Login page: ${page.url()}`);
  await page.screenshot({ path: './tests/e2e/results/admin-00-login.png' });
  
  // Fill login
  await page.locator('input[type="email"]').first().fill('admin@example.com');
  await page.locator('input[type="password"]').first().fill('password');
  
  // Submit form - use form submit instead of button click
  await page.locator('form').first().locator('button[type="submit"]').click();
  
  // Wait for navigation
  await page.waitForURL(/.*/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  const afterLoginUrl = page.url();
  console.log(`   After login: ${afterLoginUrl}`);
  
  // If redirected to horizon, go back to admin
  if (afterLoginUrl.includes('/horizon')) {
    console.log('   ⚠️ Redirected to /horizon, navigating to /admin...');
    await page.goto('http://localhost:8001/admin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    console.log(`   After redirect: ${page.url()}`);
  }
  
  await page.screenshot({ path: './tests/e2e/results/admin-01-after-login.png', fullPage: true });
  
  // Check if in admin panel
  const currentUrl = page.url();
  const bodyContent = await page.locator('body').innerHTML();
  const hasFilament = bodyContent.includes('filament') || bodyContent.includes('Filament') || bodyContent.includes('fi-');
  
  console.log(`\n   URL: ${currentUrl}`);
  console.log(`   Has Filament classes: ${hasFilament}`);
  console.log(`   Content length: ${bodyContent.length}`);
  
  // If still on horizon or not admin, check issue
  if (currentUrl.includes('/horizon') || !hasFilament) {
    console.log('\n   ⚠️ Cannot access Filament admin properly');
    console.log('   Checking if it\'s a redirect issue...\n');
    
    // Try going directly to a resource
    await page.goto('http://localhost:8001/admin/users', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    console.log(`   /admin/users URL: ${page.url()}`);
    await page.screenshot({ path: './tests/e2e/results/admin-02-users-direct.png', fullPage: true });
  }
  
  // ==================== TEST RESOURCES ====================
  console.log('\n━'.repeat(60));
  console.log('📊 Testing Admin Resources');
  console.log('━'.repeat(60) + '\n');
  
  const resources = [
    { name: 'Users', path: '/admin/users' },
    { name: 'Devices', path: '/admin/devices' },
    { name: 'Campaigns', path: '/admin/campaigns' },
    { name: 'AI Generations', path: '/admin/ai-generations' },
    { name: 'Wallet Transactions', path: '/admin/wallet-transactions' },
    { name: 'Banks', path: '/admin/banks' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const r of resources) {
    process.stdout.write(`   ${r.name}... `);
    
    try {
      await page.goto(`http://localhost:8001${r.path}`, { timeout: 10000 });
      await page.waitForLoadState('networkidle', { timeout: 8000 });
      await page.waitForTimeout(300);
      
      const content = await page.locator('body').innerHTML();
      const hasContent = content.length > 1000;
      const is404 = content.includes('404') && content.includes('Not Found');
      const hasTable = content.includes('<table') || content.includes('fi-ta');
      
      if (hasContent && !is404 && hasTable) {
        console.log('✅');
        passed++;
      } else if (hasContent && !is404) {
        console.log('⚠️ (no table)');
        passed++;
      } else {
        console.log('❌');
        failed++;
      }
    } catch (e) {
      console.log('❌ Timeout');
      failed++;
    }
  }
  
  // ==================== SUMMARY ====================
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTS');
  console.log('='.repeat(60));
  console.log(`\n✅ Passed: ${passed}/${resources.length}`);
  console.log(`❌ Failed: ${failed}/${resources.length}\n`);
  
  await context.close();
  await browser.close();
  
  console.log('🎬 Video saved!');
})();
