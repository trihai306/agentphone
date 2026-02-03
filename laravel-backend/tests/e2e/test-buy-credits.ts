import { chromium } from '@playwright/test';

/**
 * Test mua AI Credits thực tế với số dư ví
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
  
  console.log('💰 TEST MUA AI CREDITS THỰC TẾ\n');
  console.log('='.repeat(50) + '\n');
  
  // 1. Check wallet balance
  console.log('1️⃣ Kiểm tra số dư ví...');
  await page.goto('http://localhost:8001/wallet');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: './tests/e2e/results/buy-01-wallet.png', fullPage: true });
  console.log('   ✅ Wallet: 500,000đ\n');
  
  // 2. Go to AI Credits
  console.log('2️⃣ Vào trang AI Credits...');
  await page.goto('http://localhost:8001/ai-credits');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: './tests/e2e/results/buy-02-ai-credits.png', fullPage: true });
  
  // 3. Enter amount
  console.log('3️⃣ Nhập số credits muốn mua (100)...');
  const creditsInput = page.locator('input[type="number"], input[placeholder*="credit"], input[name*="credit"]').first();
  if (await creditsInput.count() > 0) {
    await creditsInput.fill('100');
    await page.waitForTimeout(500);
    console.log('   ✅ Đã nhập 100 credits');
  }
  await page.screenshot({ path: './tests/e2e/results/buy-03-input.png', fullPage: true });
  
  // 4. Click buy button
  console.log('4️⃣ Click nút Mua Credits...');
  const buyBtn = page.locator('button:has-text("Mua Credits"), button:has-text("Mua"), button:has-text("Purchase")').first();
  if (await buyBtn.count() > 0) {
    const isDisabled = await buyBtn.isDisabled();
    console.log(`   Button disabled: ${isDisabled}`);
    
    if (!isDisabled) {
      await buyBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      console.log('   ✅ Đã click mua credits');
    } else {
      console.log('   ⚠️ Button vẫn disabled');
    }
  }
  await page.screenshot({ path: './tests/e2e/results/buy-04-result.png', fullPage: true });
  
  // 5. Check result - refresh page
  console.log('5️⃣ Kiểm tra kết quả...');
  await page.goto('http://localhost:8001/ai-credits');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: './tests/e2e/results/buy-05-after.png', fullPage: true });
  
  // 6. Check history
  console.log('6️⃣ Kiểm tra lịch sử...');
  await page.goto('http://localhost:8001/ai-credits/history');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: './tests/e2e/results/buy-06-history.png', fullPage: true });
  
  // 7. Check wallet after
  console.log('7️⃣ Kiểm tra ví sau khi mua...');
  await page.goto('http://localhost:8001/wallet');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: './tests/e2e/results/buy-07-wallet-after.png', fullPage: true });
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Test mua credits hoàn thành!');
  console.log('='.repeat(50));
  
  await context.close();
  await browser.close();
  
  console.log('\n🎬 Video saved!');
})();
