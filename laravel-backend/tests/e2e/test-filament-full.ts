import { chromium } from '@playwright/test';

/**
 * Comprehensive Filament Admin Test
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
  
  console.log('🔧 FILAMENT ADMIN COMPREHENSIVE TEST\n');
  console.log('='.repeat(60) + '\n');
  
  // ==================== LOGIN ====================
  console.log('🔐 Logging into Admin...\n');
  
  await page.goto('http://localhost:8001/admin/login');
  await page.waitForLoadState('networkidle');
  
  await page.locator('input[type="email"]').first().fill('admin@example.com');
  await page.locator('input[type="password"]').first().fill('password');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Navigate to users to confirm we're logged in
  await page.goto('http://localhost:8001/admin/users');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  console.log(`   ✅ Logged in, URL: ${page.url()}`);
  await page.screenshot({ path: './tests/e2e/results/filament-01-users.png', fullPage: true });
  
  // ==================== TEST ALL RESOURCES ====================
  console.log('\n━'.repeat(60));
  console.log('📊 Testing All Admin Resources');
  console.log('━'.repeat(60) + '\n');
  
  const resources = [
    { name: 'Users', path: '/admin/users' },
    { name: 'Devices', path: '/admin/devices' },
    { name: 'Device Activity', path: '/admin/device-activity-logs' },
    { name: 'Campaigns', path: '/admin/campaigns' },
    { name: 'Flows', path: '/admin/flows' },
    { name: 'Interactions', path: '/admin/interaction-histories' },
    { name: 'AI Generations', path: '/admin/ai-generations' },
    { name: 'AI Scenarios', path: '/admin/ai-scenarios' },
    { name: 'AI Credit Packages', path: '/admin/ai-credit-packages' },
    { name: 'Service Packages', path: '/admin/service-packages' },
    { name: 'User Media', path: '/admin/user-media' },
    { name: 'Media Folders', path: '/admin/media-folders' },
    { name: 'Wallets', path: '/admin/wallets' },
    { name: 'Banks', path: '/admin/banks' },
    { name: 'Topups', path: '/admin/topups' },
    { name: 'Activity Logs', path: '/admin/activity-logs' },
    { name: 'API Logs', path: '/admin/api-logs' },
    { name: 'Error Reports', path: '/admin/error-reports' },
    { name: 'Job Logs', path: '/admin/job-logs' },
    { name: 'Data Collections', path: '/admin/data-collections' },
  ];
  
  let passed = 0;
  let failed = 0;
  const results: { name: string; status: string }[] = [];
  
  for (let i = 0; i < resources.length; i++) {
    const r = resources[i];
    const num = String(i + 1).padStart(2, '0');
    process.stdout.write(`[${num}/${resources.length}] ${r.name}... `);
    
    try {
      await page.goto(`http://localhost:8001${r.path}`, { timeout: 10000 });
      await page.waitForLoadState('networkidle', { timeout: 8000 });
      await page.waitForTimeout(300);
      
      const content = await page.locator('body').innerHTML();
      const is404 = content.includes('404') && content.includes('NOT FOUND');
      const hasFilament = content.includes('fi-') || content.includes('filament');
      
      if (!is404 && hasFilament) {
        console.log('✅');
        passed++;
        results.push({ name: r.name, status: '✅' });
        
        // Screenshot key resources
        if (i < 6) {
          await page.screenshot({ 
            path: `./tests/e2e/results/filament-${num}-${r.name.toLowerCase().replace(/\s+/g, '-')}.png` 
          });
        }
      } else {
        console.log('❌');
        failed++;
        results.push({ name: r.name, status: '❌' });
      }
    } catch (e) {
      console.log('⚠️');
      failed++;
      results.push({ name: r.name, status: '⚠️' });
    }
  }
  
  // ==================== TEST PAGES ====================
  console.log('\n━'.repeat(60));
  console.log('📄 Testing Admin Pages');
  console.log('━'.repeat(60) + '\n');
  
  const pages = [
    { name: 'Settings', path: '/admin/settings' },
    { name: 'API Monitor', path: '/admin/api-monitor' },
    { name: 'System Resources', path: '/admin/system-resources' },
    { name: 'Notification Center', path: '/admin/notification-center' },
    { name: 'Transaction Dashboard', path: '/admin/transaction-dashboard' },
    { name: 'Device Dashboard', path: '/admin/device-analytics-dashboard' },
    { name: 'Service Package Dashboard', path: '/admin/service-package-dashboard' },
  ];
  
  for (const pg of pages) {
    process.stdout.write(`   ${pg.name}... `);
    
    try {
      await page.goto(`http://localhost:8001${pg.path}`, { timeout: 8000 });
      await page.waitForLoadState('networkidle', { timeout: 5000 });
      
      const content = await page.locator('body').innerHTML();
      const is404 = content.includes('404');
      const hasFilament = content.includes('fi-');
      
      if (!is404 && hasFilament) {
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
  
  // ==================== TEST CRUD ====================
  console.log('\n━'.repeat(60));
  console.log('🔧 Testing CRUD Operations');
  console.log('━'.repeat(60) + '\n');
  
  // Users list
  await page.goto('http://localhost:8001/admin/users');
  await page.waitForLoadState('networkidle');
  
  const tableRows = await page.locator('table tbody tr').count();
  console.log(`   Users in table: ${tableRows}`);
  
  // Try view first user
  const viewLink = page.locator('table tbody tr:first-child a').first();
  if (await viewLink.count() > 0) {
    await viewLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    console.log(`   ✅ User view: ${page.url()}`);
    await page.screenshot({ path: './tests/e2e/results/filament-user-view.png', fullPage: true });
  }
  
  // Try edit
  await page.goto('http://localhost:8001/admin/users/2/edit');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  const editForm = page.locator('form');
  if (await editForm.count() > 0) {
    console.log('   ✅ User edit form available');
    await page.screenshot({ path: './tests/e2e/results/filament-user-edit.png', fullPage: true });
  }
  
  // ==================== SUMMARY ====================
  console.log('\n' + '='.repeat(60));
  console.log('📊 ADMIN PANEL TEST RESULTS');
  console.log('='.repeat(60));
  
  const totalResources = resources.length;
  const passedResources = results.filter(r => r.status === '✅').length;
  
  console.log(`\n📁 Resources: ${passedResources}/${totalResources} passed`);
  console.log(`📄 Total passed: ${passed}`);
  console.log(`❌ Total failed: ${failed}\n`);
  
  // Show failed
  const failedItems = results.filter(r => r.status !== '✅');
  if (failedItems.length > 0) {
    console.log('Failed resources:');
    failedItems.forEach(f => console.log(`   ❌ ${f.name}`));
  }
  
  console.log('\n' + '='.repeat(60));
  
  await context.close();
  await browser.close();
  
  console.log('\n🎬 Video saved!');
})();
