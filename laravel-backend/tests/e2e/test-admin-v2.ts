import { chromium } from '@playwright/test';

/**
 * Admin Panel Test - Navigate directly to admin after login
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
  
  console.log('🔧 ADMIN PANEL TEST\n');
  
  // Login to Admin
  console.log('🔐 Logging in...');
  await page.goto('http://localhost:8001/admin/login');
  await page.waitForLoadState('networkidle');
  
  await page.locator('input[type="email"]').first().fill('admin@example.com');
  await page.locator('input[type="password"]').first().fill('password');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  // Navigate to admin dashboard directly
  console.log('📍 Navigating to /admin...');
  await page.goto('http://localhost:8001/admin');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log('Current URL:', page.url());
  await page.screenshot({ path: './tests/e2e/results/admin-dashboard.png', fullPage: true });
  
  const content = await page.locator('body').innerHTML();
  
  if (content.length > 1000 && !content.includes('404')) {
    console.log('✅ Admin Dashboard loaded\n');
    results.push({ section: 'Dashboard', test: 'Admin Dashboard', status: '✅' });
  } else {
    console.log('❌ Admin Dashboard failed\n');
    results.push({ section: 'Dashboard', test: 'Admin Dashboard', status: '❌' });
  }
  
  // Get sidebar navigation links
  console.log('🔍 Finding sidebar links...');
  const sidebarLinks = await page.locator('nav a[href*="/admin/"]').all();
  console.log(`Found ${sidebarLinks.length} sidebar links\n`);
  
  // Extract unique paths
  const paths = new Set<string>();
  for (const link of sidebarLinks) {
    const href = await link.getAttribute('href');
    if (href && href.includes('/admin/')) {
      paths.add(href);
    }
  }
  
  console.log('📊 Testing discovered resources...\n');
  
  let count = 0;
  const pathArray = Array.from(paths).slice(0, 15); // Test first 15
  
  for (const path of pathArray) {
    count++;
    const name = path.split('/').pop() || path;
    process.stdout.write(`[${count}/${pathArray.length}] ${name}... `);
    
    try {
      await page.goto(`http://localhost:8001${path}`, { timeout: 10000 });
      await page.waitForLoadState('networkidle', { timeout: 8000 });
      
      const pageContent = await page.locator('body').innerHTML();
      const is404 = pageContent.includes('404') || pageContent.includes('Not Found');
      
      if (!is404 && pageContent.length > 500) {
        console.log('✅');
        results.push({ section: 'Resources', test: name, status: '✅' });
      } else {
        console.log('❌');
        results.push({ section: 'Resources', test: name, status: '❌' });
      }
    } catch (e) {
      console.log('⚠️ Timeout');
      results.push({ section: 'Resources', test: name, status: '⚠️', note: 'Timeout' });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESULTS SUMMARY');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.status === '✅').length;
  const failed = results.filter(r => r.status === '❌').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${results.length}`);
  
  await context.close();
  await browser.close();
  
  console.log('\n🎬 Video saved!');
})();
