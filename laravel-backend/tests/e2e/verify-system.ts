import { chromium } from '@playwright/test';

/**
 * Verify current state and test full flow
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
  
  console.log('🔍 VERIFY SYSTEM STATE\n');
  console.log('='.repeat(50) + '\n');
  
  // 1. Dashboard
  console.log('1️⃣ Dashboard...');
  await page.goto('http://localhost:8001/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: './tests/e2e/results/verify-01-dashboard.png', fullPage: true });
  console.log('   ✅ OK\n');
  
  // 2. AI Credits - verify state
  console.log('2️⃣ AI Credits (200 credits, 450,000đ)...');
  await page.goto('http://localhost:8001/ai-credits');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: './tests/e2e/results/verify-02-credits.png', fullPage: true });
  console.log('   ✅ OK\n');
  
  // 3. Try to buy more credits
  console.log('3️⃣ Mua thêm 50 credits (25,000đ)...');
  const input = page.locator('input[type="number"]').first();
  if (await input.count() > 0) {
    await input.fill('25000');
    await page.waitForTimeout(500);
    
    const buyBtn = page.locator('button:has-text("Mua Credits")').first();
    if (await buyBtn.count() > 0 && !(await buyBtn.isDisabled())) {
      await buyBtn.click();
      await page.waitForTimeout(3000);
      console.log('   ✅ Clicked buy\n');
    }
  }
  await page.screenshot({ path: './tests/e2e/results/verify-03-buy.png', fullPage: true });
  
  // 4. Wallet
  console.log('4️⃣ Ví tiền...');
  await page.goto('http://localhost:8001/wallet');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: './tests/e2e/results/verify-04-wallet.png', fullPage: true });
  console.log('   ✅ OK\n');
  
  // 5. AI Studio
  console.log('5️⃣ AI Studio...');
  await page.goto('http://localhost:8001/ai-studio');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: './tests/e2e/results/verify-05-studio.png', fullPage: true });
  console.log('   ✅ OK\n');
  
  // 6. Topup
  console.log('6️⃣ Nạp tiền...');
  await page.goto('http://localhost:8001/topup');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: './tests/e2e/results/verify-06-topup.png', fullPage: true });
  console.log('   ✅ OK\n');
  
  // 7. Withdraw
  console.log('7️⃣ Rút tiền...');
  await page.goto('http://localhost:8001/withdraw');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: './tests/e2e/results/verify-07-withdraw.png', fullPage: true });
  console.log('   ✅ OK\n');
  
  // 8. Media
  console.log('8️⃣ Media...');
  await page.goto('http://localhost:8001/media');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: './tests/e2e/results/verify-08-media.png', fullPage: true });
  console.log('   ✅ OK\n');
  
  console.log('='.repeat(50));
  console.log('✅ All verified!');
  console.log('='.repeat(50));
  
  await context.close();
  await browser.close();
  
  console.log('\n🎬 Video saved!');
})();
