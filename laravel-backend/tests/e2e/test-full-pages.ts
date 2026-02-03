import { chromium } from '@playwright/test';

/**
 * Full comprehensive test with screenshots of all pages
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
  
  console.log('📋 FULL PAGE TEST WITH SCREENSHOTS\n');
  console.log('='.repeat(50) + '\n');
  
  const pages = [
    // Public
    { name: 'Landing', path: '/' },
    { name: 'Features', path: '/features' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Contact', path: '/contact' },
    
    // Dashboard
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Profile', path: '/profile' },
    
    // Devices
    { name: 'Devices', path: '/devices' },
    
    // Finance
    { name: 'Wallet', path: '/wallet' },
    { name: 'Topup', path: '/topup' },
    { name: 'Withdraw', path: '/withdraw' },
    { name: 'Bank Accounts', path: '/bank-accounts' },
    
    // AI
    { name: 'AI Credits', path: '/ai-credits' },
    { name: 'AI Studio', path: '/ai-studio' },
    { name: 'AI Gallery', path: '/ai-studio/gallery' },
    { name: 'AI Scenarios', path: '/ai-studio/scenarios' },
    
    // Workflows
    { name: 'Workflows', path: '/flows' },
    { name: 'Jobs', path: '/jobs' },
    { name: 'Campaigns', path: '/campaigns' },
    
    // Data
    { name: 'Data Collections', path: '/data-collections' },
    { name: 'Media', path: '/media' },
    
    // Marketplace
    { name: 'Marketplace', path: '/marketplace' },
    
    // Tasks
    { name: 'Tasks', path: '/tasks' },
    
    // Packages
    { name: 'Packages', path: '/packages' },
    
    // Other
    { name: 'Notifications', path: '/notifications' },
    { name: 'Error Reports', path: '/error-reports' },
  ];
  
  let count = 0;
  let passed = 0;
  
  for (const pg of pages) {
    count++;
    const num = String(count).padStart(2, '0');
    console.log(`[${count}/${pages.length}] ${pg.name}...`);
    
    try {
      await page.goto(`http://localhost:8001${pg.path}`, { timeout: 15000 });
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      await page.waitForTimeout(800);
      
      // Take screenshot
      await page.screenshot({ 
        path: `./tests/e2e/results/full-${num}-${pg.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        fullPage: true 
      });
      
      console.log(`   ✅ Screenshot saved`);
      passed++;
    } catch (e) {
      console.log(`   ❌ Error`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 DONE: ${passed}/${pages.length} pages captured`);
  console.log('='.repeat(50));
  
  await context.close();
  await browser.close();
  
  console.log('\n🎬 Video saved!');
})();
