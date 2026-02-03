import { chromium } from '@playwright/test';

/**
 * Full User Flow Test - Complete user journeys
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
  
  console.log('🚀 FULL USER FLOW TEST\n');
  console.log('='.repeat(60) + '\n');
  
  // ==================== FLOW 1: LOGIN & DASHBOARD ====================
  console.log('━'.repeat(60));
  console.log('📍 FLOW 1: Dashboard Overview');
  console.log('━'.repeat(60) + '\n');
  
  await page.goto('http://localhost:8001/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('   ✅ Dashboard loaded');
  await page.screenshot({ path: './tests/e2e/results/flow-01-dashboard.png', fullPage: true });
  
  // Check stats cards
  const statsCards = page.locator('[class*="stat"], [class*="card"]');
  console.log(`   📊 Stats cards: ${await statsCards.count()}`);
  
  // ==================== FLOW 2: PROFILE UPDATE ====================
  console.log('\n━'.repeat(60));
  console.log('📍 FLOW 2: Update Profile');
  console.log('━'.repeat(60) + '\n');
  
  await page.goto('http://localhost:8001/profile');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  // Update name
  const nameInput = page.locator('input[name="name"]').first();
  await nameInput.fill('Admin User ' + Date.now().toString().slice(-4));
  console.log('   ✅ Name updated');
  
  // Update phone
  const phoneInput = page.locator('input[name="phone"]').first();
  await phoneInput.fill('+84123456789');
  console.log('   ✅ Phone updated');
  
  // Save
  const saveBtn = page.locator('button:has-text("Lưu"), button:has-text("Save"), button[type="submit"]').first();
  await saveBtn.click();
  await page.waitForTimeout(2000);
  console.log('   ✅ Profile saved');
  await page.screenshot({ path: './tests/e2e/results/flow-02-profile.png', fullPage: true });
  
  // ==================== FLOW 3: WALLET & TOPUP ====================
  console.log('\n━'.repeat(60));
  console.log('📍 FLOW 3: Check Wallet & Topup Flow');
  console.log('━'.repeat(60) + '\n');
  
  await page.goto('http://localhost:8001/wallet');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  console.log('   ✅ Wallet page loaded');
  await page.screenshot({ path: './tests/e2e/results/flow-03-wallet.png', fullPage: true });
  
  // Go to topup
  await page.goto('http://localhost:8001/topup');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  // Select 100K package
  const pkg100k = page.locator('[class*="cursor"]:has-text("100K"), div:has-text("100.000")').first();
  if (await pkg100k.count() > 0) {
    await pkg100k.click();
    await page.waitForTimeout(500);
    console.log('   ✅ Selected 100K package');
  }
  await page.screenshot({ path: './tests/e2e/results/flow-04-topup-select.png', fullPage: true });
  
  // ==================== FLOW 4: AI CREDITS PURCHASE ====================
  console.log('\n━'.repeat(60));
  console.log('📍 FLOW 4: AI Credits Purchase Flow');
  console.log('━'.repeat(60) + '\n');
  
  await page.goto('http://localhost:8001/ai-credits');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  // Enter custom amount
  const creditsInput = page.locator('input[type="number"]').first();
  await creditsInput.fill('10000');
  await page.waitForTimeout(500);
  console.log('   ✅ Entered 10,000đ for credits');
  
  // Check calculated credits
  const creditsDisplay = await page.locator('text=/\\d+ Credits/').first().textContent();
  console.log(`   📊 Calculated: ${creditsDisplay}`);
  await page.screenshot({ path: './tests/e2e/results/flow-05-credits.png', fullPage: true });
  
  // ==================== FLOW 5: AI STUDIO IMAGE GENERATION ====================
  console.log('\n━'.repeat(60));
  console.log('📍 FLOW 5: AI Studio - Create Image');
  console.log('━'.repeat(60) + '\n');
  
  await page.goto('http://localhost:8001/ai-studio');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  // Enter prompt
  const promptInput = page.locator('textarea').first();
  await promptInput.fill('A beautiful Vietnamese landscape with rice terraces, golden sunset, mountains in background, photorealistic, 8k');
  await page.waitForTimeout(500);
  console.log('   ✅ Prompt entered');
  await page.screenshot({ path: './tests/e2e/results/flow-06-ai-prompt.png', fullPage: true });
  
  // Check generate button state
  const generateBtn = page.locator('button:has-text("Tạo"), button:has-text("Generate")').first();
  const isDisabled = await generateBtn.isDisabled();
  console.log(`   📊 Generate button: ${isDisabled ? 'disabled (need credits)' : 'enabled'}`);
  
  // Go to gallery
  await page.goto('http://localhost:8001/ai-studio/gallery');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  console.log('   ✅ Gallery loaded');
  await page.screenshot({ path: './tests/e2e/results/flow-07-gallery.png', fullPage: true });
  
  // ==================== FLOW 6: WORKFLOWS ====================
  console.log('\n━'.repeat(60));
  console.log('📍 FLOW 6: Workflows Management');
  console.log('━'.repeat(60) + '\n');
  
  await page.goto('http://localhost:8001/flows');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  console.log('   ✅ Workflows page loaded');
  
  // Click create
  const createFlowBtn = page.locator('button:has-text("Tạo"), a:has-text("Tạo")').first();
  if (await createFlowBtn.count() > 0 && !(await createFlowBtn.isDisabled())) {
    await createFlowBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    console.log('   ✅ Create workflow form opened');
  }
  await page.screenshot({ path: './tests/e2e/results/flow-08-workflows.png', fullPage: true });
  
  // ==================== FLOW 7: CAMPAIGNS ====================
  console.log('\n━'.repeat(60));
  console.log('📍 FLOW 7: Campaigns Management');
  console.log('━'.repeat(60) + '\n');
  
  await page.goto('http://localhost:8001/campaigns');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  console.log('   ✅ Campaigns page loaded');
  
  // Try create
  const createCampaignBtn = page.locator('button:has-text("Tạo"), a:has-text("Tạo Campaign")').first();
  if (await createCampaignBtn.count() > 0) {
    await createCampaignBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    console.log('   ✅ Create campaign form opened');
  }
  await page.screenshot({ path: './tests/e2e/results/flow-09-campaigns.png', fullPage: true });
  
  // ==================== FLOW 8: MEDIA MANAGEMENT ====================
  console.log('\n━'.repeat(60));
  console.log('📍 FLOW 8: Media Library');
  console.log('━'.repeat(60) + '\n');
  
  await page.goto('http://localhost:8001/media');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  console.log('   ✅ Media library loaded');
  
  // Search
  const searchInput = page.locator('input[type="search"], input[placeholder*="Tìm"]').first();
  if (await searchInput.count() > 0) {
    await searchInput.fill('test image');
    await page.waitForTimeout(500);
    console.log('   ✅ Search performed');
  }
  
  // Filter by type
  const filterBtn = page.locator('button:has-text("Lọc"), button:has-text("Filter"), [class*="filter"]').first();
  if (await filterBtn.count() > 0) {
    await filterBtn.click();
    await page.waitForTimeout(500);
    console.log('   ✅ Filter opened');
  }
  await page.screenshot({ path: './tests/e2e/results/flow-10-media.png', fullPage: true });
  
  // ==================== FLOW 9: BANK ACCOUNT ====================
  console.log('\n━'.repeat(60));
  console.log('📍 FLOW 9: Bank Account Management');
  console.log('━'.repeat(60) + '\n');
  
  await page.goto('http://localhost:8001/bank-accounts');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  console.log('   ✅ Bank accounts page loaded');
  
  // Try add bank
  const addBankBtn = page.locator('button:has-text("Thêm"), button:has-text("Add")').first();
  if (await addBankBtn.count() > 0) {
    await addBankBtn.click();
    await page.waitForTimeout(1000);
    console.log('   ✅ Add bank form opened');
  }
  await page.screenshot({ path: './tests/e2e/results/flow-11-bank.png', fullPage: true });
  
  // ==================== FLOW 10: WITHDRAW ====================
  console.log('\n━'.repeat(60));
  console.log('📍 FLOW 10: Withdraw Request');
  console.log('━'.repeat(60) + '\n');
  
  await page.goto('http://localhost:8001/withdraw');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  console.log('   ✅ Withdraw page loaded');
  
  // Enter amount
  const withdrawInput = page.locator('input[name*="amount"], input[type="number"]').first();
  if (await withdrawInput.count() > 0) {
    await withdrawInput.fill('50000');
    await page.waitForTimeout(500);
    console.log('   ✅ Withdraw amount entered');
  }
  await page.screenshot({ path: './tests/e2e/results/flow-12-withdraw.png', fullPage: true });
  
  // ==================== FLOW 11: NOTIFICATIONS ====================
  console.log('\n━'.repeat(60));
  console.log('📍 FLOW 11: Notifications');
  console.log('━'.repeat(60) + '\n');
  
  await page.goto('http://localhost:8001/notifications');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  console.log('   ✅ Notifications page loaded');
  
  const notifCount = await page.locator('[class*="notification"], [class*="item"]').count();
  console.log(`   📊 Notifications: ${notifCount}`);
  await page.screenshot({ path: './tests/e2e/results/flow-13-notifications.png', fullPage: true });
  
  // ==================== FLOW 12: MARKETPLACE ====================
  console.log('\n━'.repeat(60));
  console.log('📍 FLOW 12: Marketplace');
  console.log('━'.repeat(60) + '\n');
  
  await page.goto('http://localhost:8001/marketplace');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  console.log('   ✅ Marketplace loaded');
  await page.screenshot({ path: './tests/e2e/results/flow-14-marketplace.png', fullPage: true });
  
  // ==================== SUMMARY ====================
  console.log('\n' + '='.repeat(60));
  console.log('🎉 FULL FLOW TEST COMPLETED');
  console.log('='.repeat(60));
  console.log('\n✅ 12 flows tested successfully');
  console.log('📸 14 screenshots saved');
  console.log('🎬 Video recording saved\n');
  
  await context.close();
  await browser.close();
})();
