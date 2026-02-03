import { chromium } from '@playwright/test';

/**
 * Test Wallet, Topup, Withdraw, AI Credits features
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
  const results: { feature: string; status: string; note?: string }[] = [];
  
  console.log('💰 TESTING WALLET & CREDITS FEATURES\n');
  console.log('='.repeat(50) + '\n');
  
  // 1. Wallet page
  console.log('1️⃣ Wallet (Ví Tiền)...');
  await page.goto('http://localhost:8001/wallet');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  let content = await page.locator('body').innerHTML();
  if (content.length > 500 && !content.includes('404')) {
    console.log('   ✅ Wallet page loaded');
    results.push({ feature: 'Wallet Page', status: '✅' });
  } else {
    console.log('   ❌ Wallet page failed');
    results.push({ feature: 'Wallet Page', status: '❌' });
  }
  await page.screenshot({ path: './tests/e2e/results/wallet-01-index.png', fullPage: true });
  
  // 2. Topup page (Nạp tiền)
  console.log('2️⃣ Topup (Nạp Tiền)...');
  await page.goto('http://localhost:8001/topup');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  content = await page.locator('body').innerHTML();
  if (content.length > 500 && !content.includes('404')) {
    console.log('   ✅ Topup page loaded');
    results.push({ feature: 'Topup Page', status: '✅' });
  } else {
    console.log('   ❌ Topup page failed');
    results.push({ feature: 'Topup Page', status: '❌' });
  }
  await page.screenshot({ path: './tests/e2e/results/wallet-02-topup.png', fullPage: true });
  
  // 3. Topup history
  console.log('3️⃣ Topup History...');
  await page.goto('http://localhost:8001/topup/history');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  content = await page.locator('body').innerHTML();
  if (content.length > 500 && !content.includes('404')) {
    console.log('   ✅ Topup history loaded');
    results.push({ feature: 'Topup History', status: '✅' });
  } else {
    console.log('   ❌ Topup history failed');
    results.push({ feature: 'Topup History', status: '❌' });
  }
  await page.screenshot({ path: './tests/e2e/results/wallet-03-topup-history.png', fullPage: true });
  
  // 4. Withdraw page (Rút tiền)
  console.log('4️⃣ Withdraw (Rút Tiền)...');
  await page.goto('http://localhost:8001/withdraw');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  content = await page.locator('body').innerHTML();
  if (content.length > 500 && !content.includes('404')) {
    console.log('   ✅ Withdraw page loaded');
    results.push({ feature: 'Withdraw Page', status: '✅' });
  } else {
    console.log('   ❌ Withdraw page failed');
    results.push({ feature: 'Withdraw Page', status: '❌' });
  }
  await page.screenshot({ path: './tests/e2e/results/wallet-04-withdraw.png', fullPage: true });
  
  // 5. AI Credits page
  console.log('5️⃣ AI Credits...');
  await page.goto('http://localhost:8001/ai-credits');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  content = await page.locator('body').innerHTML();
  if (content.length > 500 && !content.includes('404')) {
    console.log('   ✅ AI Credits page loaded');
    results.push({ feature: 'AI Credits Page', status: '✅' });
  } else {
    console.log('   ❌ AI Credits page failed');
    results.push({ feature: 'AI Credits Page', status: '❌' });
  }
  await page.screenshot({ path: './tests/e2e/results/wallet-05-ai-credits.png', fullPage: true });
  
  // 6. AI Credits packages
  console.log('6️⃣ AI Credits Packages...');
  await page.goto('http://localhost:8001/ai-credits/packages');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  content = await page.locator('body').innerHTML();
  if (content.length > 500 && !content.includes('404')) {
    console.log('   ✅ AI Credits packages loaded');
    results.push({ feature: 'AI Credits Packages', status: '✅' });
  } else {
    console.log('   ❌ AI Credits packages failed');
    results.push({ feature: 'AI Credits Packages', status: '❌' });
  }
  await page.screenshot({ path: './tests/e2e/results/wallet-06-ai-packages.png', fullPage: true });
  
  // 7. AI Credits history
  console.log('7️⃣ AI Credits History...');
  await page.goto('http://localhost:8001/ai-credits/history');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  content = await page.locator('body').innerHTML();
  if (content.length > 500 && !content.includes('404')) {
    console.log('   ✅ AI Credits history loaded');
    results.push({ feature: 'AI Credits History', status: '✅' });
  } else {
    console.log('   ❌ AI Credits history failed');
    results.push({ feature: 'AI Credits History', status: '❌' });
  }
  await page.screenshot({ path: './tests/e2e/results/wallet-07-ai-history.png', fullPage: true });
  
  // 8. Bank accounts
  console.log('8️⃣ Bank Accounts (Tài Khoản NH)...');
  await page.goto('http://localhost:8001/bank-accounts');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  content = await page.locator('body').innerHTML();
  if (content.length > 500 && !content.includes('404')) {
    console.log('   ✅ Bank accounts page loaded');
    results.push({ feature: 'Bank Accounts', status: '✅' });
  } else {
    console.log('   ❌ Bank accounts page failed');
    results.push({ feature: 'Bank Accounts', status: '❌' });
  }
  await page.screenshot({ path: './tests/e2e/results/wallet-08-bank-accounts.png', fullPage: true });
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESULTS');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.status === '✅').length;
  results.forEach(r => console.log(`${r.status} ${r.feature}`));
  
  console.log('='.repeat(50));
  console.log(`✅ ${passed}/${results.length} passed`);
  
  await context.close();
  await browser.close();
  
  console.log('\n🎬 Video saved!');
})();
