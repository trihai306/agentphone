import { chromium } from '@playwright/test';

/**
 * Real Flow Test - Nạp tiền và mua credits thực tế
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
  
  console.log('💰 REAL FLOW TEST - Nạp tiền & Mua Credits\n');
  console.log('='.repeat(50) + '\n');
  
  // 1. Check current wallet balance
  console.log('1️⃣ Kiểm tra số dư hiện tại...');
  await page.goto('http://localhost:8001/wallet');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: './tests/e2e/results/real-01-wallet.png' });
  console.log('   ✅ Wallet page loaded\n');
  
  // 2. Go to Topup page
  console.log('2️⃣ Vào trang Nạp tiền...');
  await page.goto('http://localhost:8001/topup');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: './tests/e2e/results/real-02-topup.png' });
  
  // 3. Select a package (50K)
  console.log('3️⃣ Chọn gói nạp 50K...');
  const package50k = page.locator('text=Gói 50K, text=50.000').first();
  if (await package50k.count() > 0) {
    await package50k.click();
    await page.waitForTimeout(500);
    console.log('   ✅ Đã chọn gói 50K');
  } else {
    // Try clicking on the card
    const packageCard = page.locator('[class*="cursor-pointer"]:has-text("50K")').first();
    if (await packageCard.count() > 0) {
      await packageCard.click();
      await page.waitForTimeout(500);
    }
  }
  await page.screenshot({ path: './tests/e2e/results/real-03-select-package.png' });
  
  // 4. Select payment method
  console.log('4️⃣ Chọn phương thức thanh toán...');
  const bankOption = page.locator('text=Chuyển khoản, text=ngân hàng, [value="bank"]').first();
  if (await bankOption.count() > 0) {
    await bankOption.click();
    await page.waitForTimeout(500);
    console.log('   ✅ Đã chọn chuyển khoản ngân hàng');
  }
  await page.screenshot({ path: './tests/e2e/results/real-04-payment-method.png' });
  
  // 5. Click checkout/proceed
  console.log('5️⃣ Tiến hành thanh toán...');
  const checkoutBtn = page.locator('button:has-text("Thanh toán"), button:has-text("Nạp"), button:has-text("Tiếp tục"), button[type="submit"]').first();
  if (await checkoutBtn.count() > 0) {
    await checkoutBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('   ✅ Đã click thanh toán');
  }
  await page.screenshot({ path: './tests/e2e/results/real-05-checkout.png', fullPage: true });
  
  // 6. Check if payment page loaded
  console.log('6️⃣ Kiểm tra trang thanh toán...');
  const currentUrl = page.url();
  console.log(`   URL: ${currentUrl}`);
  await page.screenshot({ path: './tests/e2e/results/real-06-payment-page.png', fullPage: true });
  
  // 7. Go to AI Credits
  console.log('\n7️⃣ Vào trang AI Credits...');
  await page.goto('http://localhost:8001/ai-credits');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: './tests/e2e/results/real-07-ai-credits.png', fullPage: true });
  
  // 8. Try to buy credits
  console.log('8️⃣ Thử mua AI Credits...');
  const buyBtn = page.locator('button:has-text("Mua"), button:has-text("Buy")').first();
  if (await buyBtn.count() > 0) {
    const isDisabled = await buyBtn.isDisabled();
    if (isDisabled) {
      console.log('   ⚠️ Nút mua bị disabled (không đủ số dư ví)');
    } else {
      await buyBtn.click();
      await page.waitForTimeout(1000);
      console.log('   ✅ Đã click mua credits');
    }
  }
  await page.screenshot({ path: './tests/e2e/results/real-08-buy-credits.png', fullPage: true });
  
  // 9. Check history
  console.log('9️⃣ Kiểm tra lịch sử giao dịch...');
  await page.goto('http://localhost:8001/topup/history');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: './tests/e2e/results/real-09-history.png', fullPage: true });
  
  // 10. Check AI Credits history
  console.log('🔟 Kiểm tra lịch sử AI Credits...');
  await page.goto('http://localhost:8001/ai-credits/history');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: './tests/e2e/results/real-10-credits-history.png', fullPage: true });
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Real flow test completed!');
  console.log('='.repeat(50));
  
  await context.close();
  await browser.close();
  
  console.log('\n🎬 Video saved!');
})();
