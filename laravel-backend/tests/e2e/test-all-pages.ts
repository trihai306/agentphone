import { chromium } from '@playwright/test';

/**
 * Comprehensive test for ALL pages
 */
(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    recordVideo: {
      dir: './tests/e2e/results/',
      size: { width: 1280, height: 720 }
    },
    storageState: './tests/e2e/auth.json'
  });
  
  const page = await context.newPage();
  const results: { page: string; status: string }[] = [];
  
  console.log('📋 COMPREHENSIVE PAGE TEST\n');
  console.log('='.repeat(50) + '\n');
  
  const pages = [
    // Public pages
    { name: 'Landing', path: '/', public: true },
    { name: 'Features', path: '/features', public: true },
    { name: 'Pricing', path: '/pricing', public: true },
    { name: 'About', path: '/about', public: true },
    { name: 'Contact', path: '/contact', public: true },
    
    // Auth pages (already tested)
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Profile', path: '/profile' },
    
    // Devices
    { name: 'Devices', path: '/devices' },
    
    // Packages
    { name: 'Packages', path: '/packages' },
    
    // Wallet/Finance (already tested)
    { name: 'Wallet', path: '/wallet' },
    { name: 'Topup', path: '/topup' },
    { name: 'Topup History', path: '/topup/history' },
    { name: 'Withdraw', path: '/withdraw' },
    { name: 'Bank Accounts', path: '/bank-accounts' },
    
    // AI (already tested)
    { name: 'AI Credits', path: '/ai-credits' },
    { name: 'AI Credits History', path: '/ai-credits/history' },
    { name: 'AI Studio', path: '/ai-studio' },
    { name: 'AI Gallery', path: '/ai-studio/gallery' },
    { name: 'AI Scenarios', path: '/ai-studio/scenarios' },
    { name: 'AI Generations', path: '/ai-studio/generations' },
    
    // Workflows
    { name: 'Workflows', path: '/flows' },
    { name: 'Jobs', path: '/jobs' },
    { name: 'Campaigns', path: '/campaigns' },
    
    // Data
    { name: 'Data Collections', path: '/data-collections' },
    { name: 'Media', path: '/media' },
    
    // Marketplace
    { name: 'Marketplace', path: '/marketplace' },
    { name: 'My Listings', path: '/marketplace/my-listings' },
    
    // Tasks
    { name: 'Tasks', path: '/tasks' },
    { name: 'My Tasks', path: '/tasks/my' },
    
    // Notifications
    { name: 'Notifications', path: '/notifications' },
    
    // Error Reports
    { name: 'Error Reports', path: '/error-reports' },
  ];
  
  let count = 0;
  for (const pg of pages) {
    count++;
    process.stdout.write(`[${count}/${pages.length}] ${pg.name}... `);
    
    try {
      await page.goto(`http://localhost:8001${pg.path}`, { timeout: 10000 });
      await page.waitForLoadState('networkidle', { timeout: 8000 });
      await page.waitForTimeout(300);
      
      const content = await page.locator('body').innerHTML();
      const is404 = content.includes('404') && content.includes('Not Found');
      const isError = content.includes('Server Error') && content.includes('500');
      
      if (!is404 && !isError && content.length > 300) {
        console.log('✅');
        results.push({ page: pg.name, status: '✅' });
      } else if (is404) {
        console.log('❌ 404');
        results.push({ page: pg.name, status: '❌ 404' });
      } else if (isError) {
        console.log('❌ Error');
        results.push({ page: pg.name, status: '❌ Error' });
      } else {
        console.log('⚠️');
        results.push({ page: pg.name, status: '⚠️' });
      }
    } catch (e) {
      console.log('❌ Timeout');
      results.push({ page: pg.name, status: '❌ Timeout' });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESULTS SUMMARY');
  console.log('='.repeat(50) + '\n');
  
  const passed = results.filter(r => r.status === '✅').length;
  const failed = results.filter(r => r.status.includes('❌'));
  
  console.log(`✅ Passed: ${passed}/${results.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed pages:');
    failed.forEach(f => console.log(`   - ${f.page}: ${f.status}`));
  }
  
  console.log('\n' + '='.repeat(50));
  
  await context.close();
  await browser.close();
  
  console.log('\n🎬 Video saved!');
})();
