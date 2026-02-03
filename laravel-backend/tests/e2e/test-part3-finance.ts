import { chromium } from '@playwright/test';

/**
 * Part 3: Finance & Banking Detailed Test
 */
(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    recordVideo: { dir: './tests/e2e/results/', size: { width: 1280, height: 720 } }
  });
  const page = await context.newPage();
  
  console.log('💰 PART 3: FINANCE & BANKING\n');
  
  // Login
  await page.goto('http://localhost:8001/admin/login');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').first().fill('admin@example.com');
  await page.locator('input[type="password"]').first().fill('password');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // ===== WALLETS =====
  console.log('━'.repeat(50));
  console.log('💳 WALLETS');
  console.log('━'.repeat(50) + '\n');
  
  await page.goto('http://localhost:8001/admin/wallets');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('1. Wallets List');
  await page.screenshot({ path: './tests/e2e/results/p3-01-wallets.png', fullPage: true });
  
  // View wallet
  const walletRow = page.locator('table tbody tr').first();
  if (await walletRow.count() > 0) {
    await walletRow.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    console.log('2. Wallet Detail');
    await page.screenshot({ path: './tests/e2e/results/p3-02-wallet-detail.png', fullPage: true });
  }
  
  // ===== TRANSACTIONS =====
  console.log('\n━'.repeat(50));
  console.log('📊 TRANSACTIONS');
  console.log('━'.repeat(50) + '\n');
  
  await page.goto('http://localhost:8001/admin/transactions');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('1. Transactions List');
  await page.screenshot({ path: './tests/e2e/results/p3-03-transactions.png', fullPage: true });
  
  // Filter
  const filterBtn = page.locator('button:has-text("Filter")').first();
  if (await filterBtn.count() > 0) {
    await filterBtn.click();
    await page.waitForTimeout(1000);
    console.log('2. Transaction Filters');
    await page.screenshot({ path: './tests/e2e/results/p3-04-tx-filter.png' });
  }
  
  // ===== BANKS =====
  console.log('\n━'.repeat(50));
  console.log('🏦 BANKS');
  console.log('━'.repeat(50) + '\n');
  
  await page.goto('http://localhost:8001/admin/banks');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('1. Banks List');
  await page.screenshot({ path: './tests/e2e/results/p3-05-banks.png', fullPage: true });
  
  // Create bank
  await page.goto('http://localhost:8001/admin/banks/create');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('2. Create Bank Form');
  await page.screenshot({ path: './tests/e2e/results/p3-06-bank-create.png', fullPage: true });
  
  // Edit bank
  await page.goto('http://localhost:8001/admin/banks/1/edit');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('3. Edit Bank Form');
  await page.screenshot({ path: './tests/e2e/results/p3-07-bank-edit.png', fullPage: true });
  
  console.log('\n✅ Part 3 Complete!');
  
  await context.close();
  await browser.close();
})();
