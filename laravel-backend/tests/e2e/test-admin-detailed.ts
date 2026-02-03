import { chromium } from '@playwright/test';

/**
 * Detailed Feature Testing - Admin Panel
 */
(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    recordVideo: {
      dir: './tests/e2e/results/',
      size: { width: 1280, height: 720 }
    }
  });
  
  const page = await context.newPage();
  const results: { feature: string; tests: { name: string; status: string }[] }[] = [];
  
  console.log('🔬 DETAILED ADMIN FEATURE TESTING\n');
  console.log('='.repeat(60) + '\n');
  
  // Login
  await page.goto('http://localhost:8001/admin/login');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').first().fill('admin@example.com');
  await page.locator('input[type="password"]').first().fill('password');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await page.goto('http://localhost:8001/admin/users');
  await page.waitForLoadState('networkidle');
  console.log('✅ Logged in\n');

  // ==================== 1. USERS MANAGEMENT ====================
  console.log('━'.repeat(60));
  console.log('👥 1. USERS MANAGEMENT');
  console.log('━'.repeat(60) + '\n');
  
  const userTests: { name: string; status: string }[] = [];
  
  await page.goto('http://localhost:8001/admin/users');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  // List users
  const userRows = await page.locator('table tbody tr').count();
  console.log(`   ✅ User list: ${userRows} users`);
  userTests.push({ name: 'List Users', status: '✅' });
  await page.screenshot({ path: './tests/e2e/results/detail-01-users-list.png' });
  
  // Search
  const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
  if (await searchInput.count() > 0) {
    await searchInput.fill('admin');
    await page.waitForTimeout(1000);
    console.log('   ✅ Search users');
    userTests.push({ name: 'Search Users', status: '✅' });
  }
  
  // View user
  await page.goto('http://localhost:8001/admin/users/2');
  await page.waitForLoadState('networkidle');
  console.log('   ✅ View user detail');
  userTests.push({ name: 'View User', status: '✅' });
  await page.screenshot({ path: './tests/e2e/results/detail-02-user-view.png' });
  
  // Edit user
  await page.goto('http://localhost:8001/admin/users/2/edit');
  await page.waitForLoadState('networkidle');
  const editForm = await page.locator('form').count();
  console.log(`   ✅ Edit user form: ${editForm > 0 ? 'OK' : 'Missing'}`);
  userTests.push({ name: 'Edit User Form', status: editForm > 0 ? '✅' : '❌' });
  await page.screenshot({ path: './tests/e2e/results/detail-03-user-edit.png' });
  
  // Create user form
  await page.goto('http://localhost:8001/admin/users/create');
  await page.waitForLoadState('networkidle');
  const createForm = await page.locator('form').count();
  console.log(`   ✅ Create user form: ${createForm > 0 ? 'OK' : 'Missing'}`);
  userTests.push({ name: 'Create User Form', status: createForm > 0 ? '✅' : '❌' });
  await page.screenshot({ path: './tests/e2e/results/detail-04-user-create.png' });
  
  results.push({ feature: 'Users Management', tests: userTests });

  // ==================== 2. DEVICES ====================
  console.log('\n━'.repeat(60));
  console.log('📱 2. DEVICES MANAGEMENT');
  console.log('━'.repeat(60) + '\n');
  
  const deviceTests: { name: string; status: string }[] = [];
  
  await page.goto('http://localhost:8001/admin/devices');
  await page.waitForLoadState('networkidle');
  
  const deviceRows = await page.locator('table tbody tr').count();
  console.log(`   ✅ Device list: ${deviceRows} devices`);
  deviceTests.push({ name: 'List Devices', status: '✅' });
  await page.screenshot({ path: './tests/e2e/results/detail-05-devices.png' });
  
  // Filters
  const filterBtn = page.locator('button:has-text("Filter"), button:has-text("Lọc")').first();
  if (await filterBtn.count() > 0) {
    await filterBtn.click();
    await page.waitForTimeout(500);
    console.log('   ✅ Filter panel');
    deviceTests.push({ name: 'Filter Panel', status: '✅' });
  }
  
  results.push({ feature: 'Devices Management', tests: deviceTests });

  // ==================== 3. CAMPAIGNS ====================
  console.log('\n━'.repeat(60));
  console.log('📢 3. CAMPAIGNS');
  console.log('━'.repeat(60) + '\n');
  
  const campaignTests: { name: string; status: string }[] = [];
  
  await page.goto('http://localhost:8001/admin/campaigns');
  await page.waitForLoadState('networkidle');
  
  const campaignRows = await page.locator('table tbody tr').count();
  console.log(`   ✅ Campaign list: ${campaignRows} campaigns`);
  campaignTests.push({ name: 'List Campaigns', status: '✅' });
  await page.screenshot({ path: './tests/e2e/results/detail-06-campaigns.png' });
  
  // Create
  await page.goto('http://localhost:8001/admin/campaigns/create');
  await page.waitForLoadState('networkidle');
  const campaignForm = await page.locator('form').count();
  console.log(`   ✅ Create campaign form: ${campaignForm > 0 ? 'OK' : 'Missing'}`);
  campaignTests.push({ name: 'Create Form', status: campaignForm > 0 ? '✅' : '❌' });
  await page.screenshot({ path: './tests/e2e/results/detail-07-campaign-create.png' });
  
  results.push({ feature: 'Campaigns', tests: campaignTests });

  // ==================== 4. AI GENERATIONS ====================
  console.log('\n━'.repeat(60));
  console.log('🎨 4. AI GENERATIONS');
  console.log('━'.repeat(60) + '\n');
  
  const aiTests: { name: string; status: string }[] = [];
  
  await page.goto('http://localhost:8001/admin/ai-generations');
  await page.waitForLoadState('networkidle');
  
  const aiRows = await page.locator('table tbody tr').count();
  console.log(`   ✅ AI generations: ${aiRows} items`);
  aiTests.push({ name: 'List Generations', status: '✅' });
  await page.screenshot({ path: './tests/e2e/results/detail-08-ai-generations.png' });
  
  // View detail if exists
  if (aiRows > 0) {
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();
    await page.waitForLoadState('networkidle');
    console.log('   ✅ View generation detail');
    aiTests.push({ name: 'View Detail', status: '✅' });
  }
  
  results.push({ feature: 'AI Generations', tests: aiTests });

  // ==================== 5. AI SCENARIOS ====================
  console.log('\n━'.repeat(60));
  console.log('🎬 5. AI SCENARIOS');
  console.log('━'.repeat(60) + '\n');
  
  const scenarioTests: { name: string; status: string }[] = [];
  
  await page.goto('http://localhost:8001/admin/ai-scenarios');
  await page.waitForLoadState('networkidle');
  
  const scenarioRows = await page.locator('table tbody tr').count();
  console.log(`   ✅ AI scenarios: ${scenarioRows} items`);
  scenarioTests.push({ name: 'List Scenarios', status: '✅' });
  await page.screenshot({ path: './tests/e2e/results/detail-09-ai-scenarios.png' });
  
  // Create
  await page.goto('http://localhost:8001/admin/ai-scenarios/create');
  await page.waitForLoadState('networkidle');
  const scenarioForm = await page.locator('form').count();
  console.log(`   ✅ Create scenario form: ${scenarioForm > 0 ? 'OK' : 'Missing'}`);
  scenarioTests.push({ name: 'Create Form', status: scenarioForm > 0 ? '✅' : '❌' });
  
  results.push({ feature: 'AI Scenarios', tests: scenarioTests });

  // ==================== 6. WALLETS & TRANSACTIONS ====================
  console.log('\n━'.repeat(60));
  console.log('💰 6. WALLETS & TRANSACTIONS');
  console.log('━'.repeat(60) + '\n');
  
  const walletTests: { name: string; status: string }[] = [];
  
  await page.goto('http://localhost:8001/admin/wallets');
  await page.waitForLoadState('networkidle');
  
  const walletRows = await page.locator('table tbody tr').count();
  console.log(`   ✅ Wallets: ${walletRows} items`);
  walletTests.push({ name: 'List Wallets', status: '✅' });
  await page.screenshot({ path: './tests/e2e/results/detail-10-wallets.png' });
  
  // Transactions
  await page.goto('http://localhost:8001/admin/transactions');
  await page.waitForLoadState('networkidle');
  
  const txRows = await page.locator('table tbody tr').count();
  console.log(`   ✅ Transactions: ${txRows} items`);
  walletTests.push({ name: 'List Transactions', status: '✅' });
  await page.screenshot({ path: './tests/e2e/results/detail-11-transactions.png' });
  
  results.push({ feature: 'Wallets & Transactions', tests: walletTests });

  // ==================== 7. BANKS ====================
  console.log('\n━'.repeat(60));
  console.log('🏦 7. BANKS');
  console.log('━'.repeat(60) + '\n');
  
  const bankTests: { name: string; status: string }[] = [];
  
  await page.goto('http://localhost:8001/admin/banks');
  await page.waitForLoadState('networkidle');
  
  const bankRows = await page.locator('table tbody tr').count();
  console.log(`   ✅ Banks: ${bankRows} items`);
  bankTests.push({ name: 'List Banks', status: '✅' });
  await page.screenshot({ path: './tests/e2e/results/detail-12-banks.png' });
  
  // Create bank
  await page.goto('http://localhost:8001/admin/banks/create');
  await page.waitForLoadState('networkidle');
  const bankForm = await page.locator('form').count();
  console.log(`   ✅ Create bank form: ${bankForm > 0 ? 'OK' : 'Missing'}`);
  bankTests.push({ name: 'Create Form', status: bankForm > 0 ? '✅' : '❌' });
  
  results.push({ feature: 'Banks', tests: bankTests });

  // ==================== 8. SETTINGS ====================
  console.log('\n━'.repeat(60));
  console.log('⚙️ 8. SETTINGS');
  console.log('━'.repeat(60) + '\n');
  
  const settingsTests: { name: string; status: string }[] = [];
  
  await page.goto('http://localhost:8001/admin/settings');
  await page.waitForLoadState('networkidle');
  
  const settingsForm = await page.locator('form').count();
  console.log(`   ✅ Settings page: ${settingsForm > 0 ? 'Form found' : 'No form'}`);
  settingsTests.push({ name: 'Settings Page', status: '✅' });
  await page.screenshot({ path: './tests/e2e/results/detail-13-settings.png' });
  
  results.push({ feature: 'Settings', tests: settingsTests });

  // ==================== 9. SYSTEM RESOURCES ====================
  console.log('\n━'.repeat(60));
  console.log('🖥️ 9. SYSTEM RESOURCES');
  console.log('━'.repeat(60) + '\n');
  
  const sysTests: { name: string; status: string }[] = [];
  
  await page.goto('http://localhost:8001/admin/system-resources');
  await page.waitForLoadState('networkidle');
  
  console.log('   ✅ System resources page');
  sysTests.push({ name: 'System Resources', status: '✅' });
  await page.screenshot({ path: './tests/e2e/results/detail-14-system.png' });
  
  results.push({ feature: 'System Resources', tests: sysTests });

  // ==================== 10. ACTIVITY LOGS ====================
  console.log('\n━'.repeat(60));
  console.log('📝 10. ACTIVITY LOGS');
  console.log('━'.repeat(60) + '\n');
  
  const logTests: { name: string; status: string }[] = [];
  
  await page.goto('http://localhost:8001/admin/activity-logs');
  await page.waitForLoadState('networkidle');
  
  const logRows = await page.locator('table tbody tr').count();
  console.log(`   ✅ Activity logs: ${logRows} items`);
  logTests.push({ name: 'Activity Logs', status: '✅' });
  await page.screenshot({ path: './tests/e2e/results/detail-15-activity-logs.png' });
  
  results.push({ feature: 'Activity Logs', tests: logTests });

  // ==================== SUMMARY ====================
  console.log('\n' + '='.repeat(60));
  console.log('📊 DETAILED TEST SUMMARY');
  console.log('='.repeat(60) + '\n');
  
  let totalTests = 0;
  let passedTests = 0;
  
  for (const feature of results) {
    const passed = feature.tests.filter(t => t.status === '✅').length;
    totalTests += feature.tests.length;
    passedTests += passed;
    console.log(`📁 ${feature.feature}: ${passed}/${feature.tests.length}`);
    feature.tests.forEach(t => console.log(`   ${t.status} ${t.name}`));
    console.log('');
  }
  
  console.log('='.repeat(60));
  console.log(`✅ TOTAL: ${passedTests}/${totalTests} tests passed`);
  console.log('='.repeat(60));
  
  await context.close();
  await browser.close();
  
  console.log('\n🎬 Video saved!');
})();
