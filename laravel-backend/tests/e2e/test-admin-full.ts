import { chromium } from '@playwright/test';

/**
 * Comprehensive Admin Panel Test
 * Tests all Filament resources and pages
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
  const results: { section: string; test: string; status: string; note?: string }[] = [];
  
  console.log('🔧 ADMIN PANEL COMPREHENSIVE TEST\n');
  console.log('='.repeat(60) + '\n');
  
  // Login to Admin
  console.log('🔐 Logging into Admin Panel...');
  await page.goto('http://localhost:8001/admin/login');
  await page.waitForLoadState('networkidle');
  
  await page.locator('input[type="email"]').first().fill('admin@example.com');
  await page.locator('input[type="password"]').first().fill('password');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  if (page.url().includes('/admin') || page.url().includes('/horizon')) {
    console.log('✅ Admin login successful\n');
    results.push({ section: 'Auth', test: 'Admin Login', status: '✅' });
  } else {
    console.log('❌ Admin login failed\n');
    results.push({ section: 'Auth', test: 'Admin Login', status: '❌' });
    await context.close();
    await browser.close();
    return;
  }
  
  await page.screenshot({ path: './tests/e2e/results/admin-01-dashboard.png', fullPage: true });
  
  // Test Resources
  const resources = [
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
    { name: 'Activity Logs', path: '/admin/activity-logs' },
    { name: 'Error Reports', path: '/admin/error-reports' },
    { name: 'API Logs', path: '/admin/api-logs' },
  ];
  
  console.log('📊 TESTING RESOURCES (' + resources.length + ' items)\n');
  
  let resourceCount = 0;
  for (const resource of resources) {
    resourceCount++;
    process.stdout.write(`[${resourceCount}/${resources.length}] ${resource.name}... `);
    
    try {
      await page.goto(`http://localhost:8001${resource.path}`, { timeout: 15000 });
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      await page.waitForTimeout(500);
      
      const content = await page.locator('body').innerHTML();
      const is404 = content.includes('404') || content.includes('Not Found');
      const isError = content.includes('Error') && content.length < 1000;
      const isBlank = content.length < 500;
      
      if (!is404 && !isError && !isBlank) {
        console.log('✅');
        results.push({ section: 'Resources', test: resource.name, status: '✅' });
      } else if (is404) {
        console.log('❌ 404');
        results.push({ section: 'Resources', test: resource.name, status: '❌', note: '404' });
      } else {
        console.log('⚠️ Issue');
        results.push({ section: 'Resources', test: resource.name, status: '⚠️', note: 'Check manually' });
      }
    } catch (e) {
      console.log('❌ Timeout/Error');
      results.push({ section: 'Resources', test: resource.name, status: '❌', note: 'Timeout' });
    }
  }
  
  // Screenshot some key pages
  await page.goto('http://localhost:8001/admin/users');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: './tests/e2e/results/admin-02-users.png' });
  
  await page.goto('http://localhost:8001/admin/devices');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: './tests/e2e/results/admin-03-devices.png' });
  
  // Test Pages
  const pages = [
    { name: 'Dashboard', path: '/admin' },
    { name: 'Settings', path: '/admin/settings' },
    { name: 'API Monitor', path: '/admin/api-monitor' },
    { name: 'Workflow Dashboard', path: '/admin/workflow-dashboard' },
    { name: 'Transaction Dashboard', path: '/admin/transaction-dashboard' },
    { name: 'System Resources', path: '/admin/system-resources' },
    { name: 'Notification Center', path: '/admin/notification-center' },
  ];
  
  console.log('\n📄 TESTING PAGES (' + pages.length + ' items)\n');
  
  let pageCount = 0;
  for (const pg of pages) {
    pageCount++;
    process.stdout.write(`[${pageCount}/${pages.length}] ${pg.name}... `);
    
    try {
      await page.goto(`http://localhost:8001${pg.path}`, { timeout: 15000 });
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      await page.waitForTimeout(500);
      
      const content = await page.locator('body').innerHTML();
      const is404 = content.includes('404') || content.includes('Not Found');
      const isBlank = content.length < 500;
      
      if (!is404 && !isBlank) {
        console.log('✅');
        results.push({ section: 'Pages', test: pg.name, status: '✅' });
      } else {
        console.log('❌');
        results.push({ section: 'Pages', test: pg.name, status: '❌', note: is404 ? '404' : 'Blank' });
      }
    } catch (e) {
      console.log('❌ Timeout');
      results.push({ section: 'Pages', test: pg.name, status: '❌', note: 'Timeout' });
    }
  }
  
  // Test CRUD operations on Users
  console.log('\n🔧 TESTING CRUD OPERATIONS\n');
  
  // View user
  console.log('Testing User View...');
  await page.goto('http://localhost:8001/admin/users');
  await page.waitForLoadState('networkidle');
  
  const viewBtn = page.locator('a[href*="/admin/users/"][href*="/view"], button:has-text("View")').first();
  if (await viewBtn.count() > 0) {
    await viewBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    if (page.url().includes('/view') || page.url().match(/\/users\/\d+/)) {
      console.log('✅ User View');
      results.push({ section: 'CRUD', test: 'User View', status: '✅' });
    }
    await page.screenshot({ path: './tests/e2e/results/admin-04-user-view.png' });
  }
  
  // Test create form access
  console.log('Testing Create Forms...');
  await page.goto('http://localhost:8001/admin/users/create');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  const createForm = page.locator('form');
  if (await createForm.count() > 0) {
    console.log('✅ User Create Form');
    results.push({ section: 'CRUD', test: 'User Create Form', status: '✅' });
    await page.screenshot({ path: './tests/e2e/results/admin-05-user-create.png' });
  } else {
    console.log('❌ User Create Form');
    results.push({ section: 'CRUD', test: 'User Create Form', status: '❌' });
  }
  
  // Final screenshot
  await page.goto('http://localhost:8001/admin');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: './tests/e2e/results/admin-final.png', fullPage: true });
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 ADMIN TEST RESULTS SUMMARY');
  console.log('='.repeat(60) + '\n');
  
  const sections = [...new Set(results.map(r => r.section))];
  
  for (const section of sections) {
    const sectionResults = results.filter(r => r.section === section);
    const passed = sectionResults.filter(r => r.status === '✅').length;
    console.log(`📁 ${section}: ${passed}/${sectionResults.length} passed`);
    
    // Show failures
    const failures = sectionResults.filter(r => r.status !== '✅');
    failures.forEach(f => {
      console.log(`   ❌ ${f.test} ${f.note ? `(${f.note})` : ''}`);
    });
  }
  
  const totalPassed = results.filter(r => r.status === '✅').length;
  console.log('\n' + '='.repeat(60));
  console.log(`✅ TOTAL: ${totalPassed}/${results.length} passed`);
  console.log('='.repeat(60));
  
  await context.close();
  await browser.close();
  
  console.log('\n🎬 Video saved to tests/e2e/results/');
})();
