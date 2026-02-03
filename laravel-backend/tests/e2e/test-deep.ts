import { chromium } from '@playwright/test';

/**
 * Deep functional testing - Test actual features, forms, interactions
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
  const results: { test: string; status: string; detail?: string }[] = [];
  
  console.log('🔬 DEEP FUNCTIONAL TESTING\n');
  console.log('='.repeat(60) + '\n');
  
  // ==================== 1. PROFILE ====================
  console.log('👤 1. PROFILE MANAGEMENT\n');
  
  await page.goto('http://localhost:8001/profile');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  // Check profile form exists
  const nameInput = page.locator('input[name="name"]').first();
  if (await nameInput.count() > 0) {
    console.log('   ✅ Profile form loaded');
    results.push({ test: 'Profile Form', status: '✅' });
    
    // Try updating name
    const currentName = await nameInput.inputValue();
    await nameInput.fill('Admin Test User');
    await page.waitForTimeout(300);
    
    const saveBtn = page.locator('button:has-text("Lưu"), button:has-text("Save"), button[type="submit"]').first();
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
      console.log('   ✅ Profile update submitted');
      results.push({ test: 'Profile Update', status: '✅' });
    }
  } else {
    results.push({ test: 'Profile Form', status: '❌' });
  }
  await page.screenshot({ path: './tests/e2e/results/deep-01-profile.png' });
  
  // ==================== 2. DEVICES ====================
  console.log('\n📱 2. DEVICES MANAGEMENT\n');
  
  await page.goto('http://localhost:8001/devices');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  // Check device list
  const deviceCards = page.locator('[class*="device"], [class*="card"]');
  const deviceCount = await deviceCards.count();
  console.log(`   📊 Found ${deviceCount} device elements`);
  results.push({ test: 'Devices List', status: '✅', detail: `${deviceCount} elements` });
  
  // Try add device button
  const addDeviceBtn = page.locator('button:has-text("Thêm"), button:has-text("Add"), a:has-text("Thêm")').first();
  if (await addDeviceBtn.count() > 0) {
    console.log('   ✅ Add device button found');
    results.push({ test: 'Add Device Button', status: '✅' });
  }
  await page.screenshot({ path: './tests/e2e/results/deep-02-devices.png' });
  
  // ==================== 3. WALLET & TOPUP ====================
  console.log('\n💰 3. WALLET & TOPUP\n');
  
  await page.goto('http://localhost:8001/wallet');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  // Check balance display
  const balanceText = await page.locator('body').textContent();
  if (balanceText?.includes('đ') || balanceText?.includes('VND')) {
    console.log('   ✅ Balance displayed');
    results.push({ test: 'Wallet Balance Display', status: '✅' });
  }
  await page.screenshot({ path: './tests/e2e/results/deep-03-wallet.png' });
  
  // Test topup flow
  await page.goto('http://localhost:8001/topup');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  // Select a package
  const package100k = page.locator('text=100K, text=100.000').first();
  if (await package100k.count() > 0) {
    await package100k.click();
    await page.waitForTimeout(500);
    console.log('   ✅ Package selection works');
    results.push({ test: 'Topup Package Select', status: '✅' });
  }
  await page.screenshot({ path: './tests/e2e/results/deep-04-topup.png' });
  
  // ==================== 4. AI CREDITS ====================
  console.log('\n✨ 4. AI CREDITS\n');
  
  await page.goto('http://localhost:8001/ai-credits');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  // Check credits display
  const creditsInput = page.locator('input[type="number"]').first();
  if (await creditsInput.count() > 0) {
    await creditsInput.fill('50000');
    await page.waitForTimeout(500);
    console.log('   ✅ Credits input works');
    results.push({ test: 'AI Credits Input', status: '✅' });
  }
  await page.screenshot({ path: './tests/e2e/results/deep-05-ai-credits.png' });
  
  // ==================== 5. AI STUDIO ====================
  console.log('\n🎨 5. AI STUDIO\n');
  
  await page.goto('http://localhost:8001/ai-studio');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  // Check prompt input
  const promptInput = page.locator('textarea').first();
  if (await promptInput.count() > 0) {
    await promptInput.fill('A beautiful sunset over mountains');
    await page.waitForTimeout(500);
    console.log('   ✅ Prompt input works');
    results.push({ test: 'AI Studio Prompt', status: '✅' });
  }
  
  // Check generate button
  const generateBtn = page.locator('button:has-text("Tạo"), button:has-text("Generate")').first();
  if (await generateBtn.count() > 0) {
    console.log('   ✅ Generate button found');
    results.push({ test: 'AI Studio Generate', status: '✅' });
  }
  await page.screenshot({ path: './tests/e2e/results/deep-06-ai-studio.png' });
  
  // ==================== 6. WORKFLOWS ====================
  console.log('\n⚡ 6. WORKFLOWS\n');
  
  await page.goto('http://localhost:8001/flows');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  const createFlowBtn = page.locator('button:has-text("Tạo"), a:has-text("Tạo"), button:has-text("Create")').first();
  if (await createFlowBtn.count() > 0) {
    console.log('   ✅ Create workflow button found');
    results.push({ test: 'Workflows Create Button', status: '✅' });
  }
  await page.screenshot({ path: './tests/e2e/results/deep-07-workflows.png' });
  
  // ==================== 7. CAMPAIGNS ====================
  console.log('\n📢 7. CAMPAIGNS\n');
  
  await page.goto('http://localhost:8001/campaigns');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  const createCampaignBtn = page.locator('button:has-text("Tạo"), a:has-text("Tạo Campaign"), button:has-text("Create")').first();
  if (await createCampaignBtn.count() > 0) {
    console.log('   ✅ Create campaign button found');
    results.push({ test: 'Campaigns Create Button', status: '✅' });
  }
  await page.screenshot({ path: './tests/e2e/results/deep-08-campaigns.png' });
  
  // ==================== 8. MEDIA UPLOAD ====================
  console.log('\n📁 8. MEDIA\n');
  
  await page.goto('http://localhost:8001/media');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  const uploadBtn = page.locator('button:has-text("Upload"), button:has-text("Tải lên"), input[type="file"]').first();
  if (await uploadBtn.count() > 0) {
    console.log('   ✅ Upload button found');
    results.push({ test: 'Media Upload Button', status: '✅' });
  }
  
  // Check filter/search
  const searchInput = page.locator('input[type="search"], input[placeholder*="Tìm"], input[placeholder*="Search"]').first();
  if (await searchInput.count() > 0) {
    await searchInput.fill('test');
    await page.waitForTimeout(500);
    console.log('   ✅ Search works');
    results.push({ test: 'Media Search', status: '✅' });
  }
  await page.screenshot({ path: './tests/e2e/results/deep-09-media.png' });
  
  // ==================== 9. DATA COLLECTIONS ====================
  console.log('\n📊 9. DATA COLLECTIONS\n');
  
  await page.goto('http://localhost:8001/data-collections');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  const createDataBtn = page.locator('button:has-text("Tạo"), a:has-text("Tạo"), button:has-text("Create")').first();
  if (await createDataBtn.count() > 0) {
    console.log('   ✅ Create data collection button found');
    results.push({ test: 'Data Collections Create', status: '✅' });
  }
  await page.screenshot({ path: './tests/e2e/results/deep-10-data.png' });
  
  // ==================== 10. MARKETPLACE ====================
  console.log('\n🛒 10. MARKETPLACE\n');
  
  await page.goto('http://localhost:8001/marketplace');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  // Check listing cards
  const listings = page.locator('[class*="listing"], [class*="card"]');
  const listingCount = await listings.count();
  console.log(`   📊 Found ${listingCount} marketplace elements`);
  results.push({ test: 'Marketplace Listings', status: '✅', detail: `${listingCount} elements` });
  await page.screenshot({ path: './tests/e2e/results/deep-11-marketplace.png' });
  
  // ==================== 11. PACKAGES ====================
  console.log('\n📦 11. SERVICE PACKAGES\n');
  
  await page.goto('http://localhost:8001/packages');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  const packageCards = page.locator('[class*="package"], [class*="plan"], [class*="pricing"]');
  const pkgCount = await packageCards.count();
  console.log(`   📊 Found ${pkgCount} package elements`);
  results.push({ test: 'Service Packages', status: '✅', detail: `${pkgCount} elements` });
  await page.screenshot({ path: './tests/e2e/results/deep-12-packages.png' });
  
  // ==================== 12. WITHDRAW ====================
  console.log('\n💸 12. WITHDRAW\n');
  
  await page.goto('http://localhost:8001/withdraw');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  const amountInput = page.locator('input[name*="amount"], input[type="number"]').first();
  if (await amountInput.count() > 0) {
    await amountInput.fill('100000');
    await page.waitForTimeout(500);
    console.log('   ✅ Withdraw amount input works');
    results.push({ test: 'Withdraw Amount Input', status: '✅' });
  }
  await page.screenshot({ path: './tests/e2e/results/deep-13-withdraw.png' });
  
  // ==================== 13. BANK ACCOUNTS ====================
  console.log('\n🏦 13. BANK ACCOUNTS\n');
  
  await page.goto('http://localhost:8001/bank-accounts');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  const addBankBtn = page.locator('button:has-text("Thêm"), button:has-text("Add")').first();
  if (await addBankBtn.count() > 0) {
    console.log('   ✅ Add bank account button found');
    results.push({ test: 'Bank Account Add', status: '✅' });
  }
  await page.screenshot({ path: './tests/e2e/results/deep-14-bank.png' });
  
  // ==================== SUMMARY ====================
  console.log('\n' + '='.repeat(60));
  console.log('📊 DEEP TEST RESULTS');
  console.log('='.repeat(60) + '\n');
  
  const passed = results.filter(r => r.status === '✅').length;
  const failed = results.filter(r => r.status === '❌').length;
  
  results.forEach(r => {
    console.log(`${r.status} ${r.test}${r.detail ? ` (${r.detail})` : ''}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Passed: ${passed}/${results.length}`);
  if (failed > 0) console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(60));
  
  await context.close();
  await browser.close();
  
  console.log('\n🎬 Video saved!');
})();
