import { chromium } from '@playwright/test';

/**
 * All Parts Combined - Detailed Feature Test
 */
(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    recordVideo: { dir: './tests/e2e/results/', size: { width: 1280, height: 720 } }
  });
  const page = await context.newPage();
  
  console.log('🔬 COMPLETE DETAILED ADMIN TEST\n');
  console.log('='.repeat(60) + '\n');
  
  // Login
  await page.goto('http://localhost:8001/admin/login');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').first().fill('admin@example.com');
  await page.locator('input[type="password"]').first().fill('password');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  console.log('✅ Logged in\n');
  
  // ==================== PART 1: USERS & DEVICES ====================
  console.log('━'.repeat(60));
  console.log('📍 PART 1: USERS & DEVICES');
  console.log('━'.repeat(60) + '\n');
  
  await page.goto('http://localhost:8001/admin/users');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('   ✅ Users List');
  await page.screenshot({ path: './tests/e2e/results/all-01-users.png', fullPage: true });
  
  await page.goto('http://localhost:8001/admin/users/2');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  console.log('   ✅ User Detail');
  await page.screenshot({ path: './tests/e2e/results/all-02-user-detail.png', fullPage: true });
  
  await page.goto('http://localhost:8001/admin/users/2/edit');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  console.log('   ✅ Edit User');
  await page.screenshot({ path: './tests/e2e/results/all-03-user-edit.png', fullPage: true });
  
  await page.goto('http://localhost:8001/admin/users/create');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  console.log('   ✅ Create User');
  await page.screenshot({ path: './tests/e2e/results/all-04-user-create.png', fullPage: true });
  
  await page.goto('http://localhost:8001/admin/devices');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  console.log('   ✅ Devices List');
  await page.screenshot({ path: './tests/e2e/results/all-05-devices.png', fullPage: true });
  
  await page.goto('http://localhost:8001/admin/device-activity-logs');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  console.log('   ✅ Device Logs');
  await page.screenshot({ path: './tests/e2e/results/all-06-device-logs.png', fullPage: true });
  
  // ==================== PART 2: AI FEATURES ====================
  console.log('\n━'.repeat(60));
  console.log('📍 PART 2: AI FEATURES');
  console.log('━'.repeat(60) + '\n');
  
  await page.goto('http://localhost:8001/admin/ai-generations');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  console.log('   ✅ AI Generations');
  await page.screenshot({ path: './tests/e2e/results/all-07-ai-gen.png', fullPage: true });
  
  await page.goto('http://localhost:8001/admin/ai-scenarios');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  console.log('   ✅ AI Scenarios');
  await page.screenshot({ path: './tests/e2e/results/all-08-ai-scenarios.png', fullPage: true });
  
  await page.goto('http://localhost:8001/admin/ai-scenarios/create');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  console.log('   ✅ Create Scenario');
  await page.screenshot({ path: './tests/e2e/results/all-09-scenario-create.png', fullPage: true });
  
  await page.goto('http://localhost:8001/admin/ai-credit-packages');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  console.log('   ✅ Credit Packages');
  await page.screenshot({ path: './tests/e2e/results/all-10-credit-pkg.png', fullPage: true });
  
  await page.goto('http://localhost:8001/admin/service-packages');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  console.log('   ✅ Service Packages');
  await page.screenshot({ path: './tests/e2e/results/all-11-service-pkg.png', fullPage: true });
  
  // ==================== PART 3: FINANCE ====================
  console.log('\n━'.repeat(60));
  console.log('📍 PART 3: FINANCE & BANKING');
  console.log('━'.repeat(60) + '\n');
  
  await page.goto('http://localhost:8001/admin/wallets');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  console.log('   ✅ Wallets');
  await page.screenshot({ path: './tests/e2e/results/all-12-wallets.png', fullPage: true });
  
  await page.goto('http://localhost:8001/admin/transactions');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  console.log('   ✅ Transactions');
  await page.screenshot({ path: './tests/e2e/results/all-13-transactions.png', fullPage: true });
  
  await page.goto('http://localhost:8001/admin/banks');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  console.log('   ✅ Banks');
  await page.screenshot({ path: './tests/e2e/results/all-14-banks.png', fullPage: true });
  
  await page.goto('http://localhost:8001/admin/banks/create');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  console.log('   ✅ Create Bank');
  await page.screenshot({ path: './tests/e2e/results/all-15-bank-create.png', fullPage: true });
  
  // ==================== PART 4: CAMPAIGNS & SYSTEM ====================
  console.log('\n━'.repeat(60));
  console.log('📍 PART 4: CAMPAIGNS & SYSTEM');
  console.log('━'.repeat(60) + '\n');
  
  await page.goto('http://localhost:8001/admin/campaigns');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  console.log('   ✅ Campaigns');
  await page.screenshot({ path: './tests/e2e/results/all-16-campaigns.png', fullPage: true });
  
  await page.goto('http://localhost:8001/admin/campaigns/create');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  console.log('   ✅ Create Campaign');
  await page.screenshot({ path: './tests/e2e/results/all-17-campaign-create.png', fullPage: true });
  
  await page.goto('http://localhost:8001/admin/flows');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  console.log('   ✅ Workflows');
  await page.screenshot({ path: './tests/e2e/results/all-18-flows.png', fullPage: true });
  
  await page.goto('http://localhost:8001/admin/settings');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  console.log('   ✅ Settings');
  await page.screenshot({ path: './tests/e2e/results/all-19-settings.png', fullPage: true });
  
  await page.goto('http://localhost:8001/admin/system-resources');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  console.log('   ✅ System Resources');
  await page.screenshot({ path: './tests/e2e/results/all-20-system.png', fullPage: true });
  
  await page.goto('http://localhost:8001/admin/activity-logs');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  console.log('   ✅ Activity Logs');
  await page.screenshot({ path: './tests/e2e/results/all-21-activity.png', fullPage: true });
  
  await page.goto('http://localhost:8001/admin/api-logs');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  console.log('   ✅ API Logs');
  await page.screenshot({ path: './tests/e2e/results/all-22-api-logs.png', fullPage: true });
  
  await page.goto('http://localhost:8001/admin/error-reports');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  console.log('   ✅ Error Reports');
  await page.screenshot({ path: './tests/e2e/results/all-23-errors.png', fullPage: true });
  
  await page.goto('http://localhost:8001/admin/job-logs');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  console.log('   ✅ Job Logs');
  await page.screenshot({ path: './tests/e2e/results/all-24-jobs.png', fullPage: true });
  
  await page.goto('http://localhost:8001/admin/data-collections');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  console.log('   ✅ Data Collections');
  await page.screenshot({ path: './tests/e2e/results/all-25-data.png', fullPage: true });
  
  await page.goto('http://localhost:8001/admin/user-media');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  console.log('   ✅ User Media');
  await page.screenshot({ path: './tests/e2e/results/all-26-media.png', fullPage: true });
  
  // ==================== SUMMARY ====================
  console.log('\n' + '='.repeat(60));
  console.log('🎉 COMPLETE! 26 pages tested & captured');
  console.log('='.repeat(60));
  
  await context.close();
  await browser.close();
  
  console.log('\n🎬 Video saved!');
})();
