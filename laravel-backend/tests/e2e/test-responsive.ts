import { chromium } from '@playwright/test';

/**
 * Responsive Design Test - Test pages at different viewports
 */
(async () => {
  const browser = await chromium.launch({ headless: false });
  
  const viewports = [
    { name: 'Mobile', width: 375, height: 812 },   // iPhone X
    { name: 'Tablet', width: 768, height: 1024 },  // iPad
    { name: 'Desktop', width: 1440, height: 900 }, // MacBook
  ];
  
  const pages = [
    { name: 'Landing', path: '/', public: true },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Wallet', path: '/wallet' },
    { name: 'Topup', path: '/topup' },
    { name: 'AI Credits', path: '/ai-credits' },
    { name: 'AI Studio', path: '/ai-studio' },
    { name: 'Media', path: '/media' },
    { name: 'Profile', path: '/profile' },
  ];
  
  console.log('📱 RESPONSIVE DESIGN TEST\n');
  console.log('='.repeat(60) + '\n');
  
  for (const vp of viewports) {
    console.log('━'.repeat(60));
    console.log(`📐 ${vp.name.toUpperCase()} (${vp.width}x${vp.height})`);
    console.log('━'.repeat(60) + '\n');
    
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      recordVideo: {
        dir: './tests/e2e/results/',
        size: { width: vp.width, height: vp.height }
      },
      storageState: './tests/e2e/auth.json'
    });
    
    const page = await context.newPage();
    
    for (const pg of pages) {
      const safeName = pg.name.toLowerCase().replace(/\s+/g, '-');
      const filename = `responsive-${vp.name.toLowerCase()}-${safeName}.png`;
      
      await page.goto(`http://localhost:8001${pg.path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(800);
      
      // Check for layout issues
      const body = await page.locator('body');
      const bodyWidth = await body.evaluate(el => el.scrollWidth);
      const viewportWidth = vp.width;
      
      const hasHorizontalScroll = bodyWidth > viewportWidth + 10;
      const status = hasHorizontalScroll ? '⚠️ Overflow' : '✅';
      
      console.log(`   ${status} ${pg.name} ${hasHorizontalScroll ? `(${bodyWidth}px > ${viewportWidth}px)` : ''}`);
      
      await page.screenshot({ 
        path: `./tests/e2e/results/${filename}`,
        fullPage: true 
      });
    }
    
    await context.close();
    console.log('');
  }
  
  console.log('='.repeat(60));
  console.log('🎉 Responsive test complete!');
  console.log('='.repeat(60));
  
  await browser.close();
  
  console.log('\n📸 Screenshots saved to tests/e2e/results/responsive-*.png');
})();
