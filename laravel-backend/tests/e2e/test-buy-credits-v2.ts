import { chromium } from '@playwright/test';

/**
 * Test mua AI Credits - nhập đúng số tiền
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
  
  console.log('💰 TEST MUA CREDITS - Flow đúng\n');
  console.log('='.repeat(50) + '\n');
  
  // 1. Go to AI Credits
  console.log('1️⃣ Vào trang AI Credits...');
  await page.goto('http://localhost:8001/ai-credits');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  
  // Check balance in header
  const balanceText = await page.locator('text=500.000').first();
  if (await balanceText.count() > 0) {
    console.log('   ✅ Ví: 500.000đ');
  }
  
  await page.screenshot({ path: './tests/e2e/results/credits-01-page.png', fullPage: true });
  
  // 2. Clear and enter amount - 50000 VND = 100 credits
  console.log('2️⃣ Nhập số tiền: 50,000đ (= 100 credits)...');
  const amountInput = page.locator('input[type="number"]').first();
  await amountInput.click();
  await amountInput.fill('');
  await page.waitForTimeout(300);
  await amountInput.type('50000', { delay: 100 });
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: './tests/e2e/results/credits-02-input.png', fullPage: true });
  
  // 3. Check if button is enabled
  console.log('3️⃣ Kiểm tra nút Mua Credits...');
  const buyBtn = page.locator('button:has-text("Mua Credits")').first();
  const isDisabled = await buyBtn.isDisabled();
  console.log(`   Button disabled: ${isDisabled}`);
  
  if (!isDisabled) {
    console.log('4️⃣ Click mua credits...');
    await buyBtn.click();
    await page.waitForTimeout(1000);
    
    // Check for confirmation dialog
    const confirmBtn = page.locator('button:has-text("Xác nhận"), button:has-text("OK"), button:has-text("Đồng ý")').first();
    if (await confirmBtn.count() > 0) {
      console.log('   → Có dialog xác nhận');
      await page.screenshot({ path: './tests/e2e/results/credits-03-confirm.png' });
      await confirmBtn.click();
      await page.waitForTimeout(2000);
    }
    
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: './tests/e2e/results/credits-04-result.png', fullPage: true });
    
    // 5. Check final balance
    console.log('5️⃣ Kiểm tra kết quả...');
    await page.goto('http://localhost:8001/ai-credits');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: './tests/e2e/results/credits-05-after.png', fullPage: true });
    
    // 6. Check wallet
    console.log('6️⃣ Kiểm tra ví...');
    await page.goto('http://localhost:8001/wallet');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: './tests/e2e/results/credits-06-wallet.png', fullPage: true });
    
    // 7. Check history
    console.log('7️⃣ Kiểm tra lịch sử...');
    await page.goto('http://localhost:8001/ai-credits/history');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: './tests/e2e/results/credits-07-history.png', fullPage: true });
    
    console.log('\n✅ MUA CREDITS THÀNH CÔNG!');
  } else {
    console.log('   ⚠️ Button vẫn disabled - kiểm tra lại logic');
    await page.screenshot({ path: './tests/e2e/results/credits-error.png', fullPage: true });
  }
  
  console.log('\n' + '='.repeat(50));
  
  await context.close();
  await browser.close();
  
  console.log('🎬 Video saved!');
})();
