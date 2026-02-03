import { chromium } from '@playwright/test';

/**
 * Part 4: Campaigns, Flows & System Detailed Test
 */
(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    recordVideo: { dir: './tests/e2e/results/', size: { width: 1280, height: 720 } }
  });
  const page = await context.newPage();
  
  console.log('⚡ PART 4: CAMPAIGNS, FLOWS & SYSTEM\n');
  
  // Login
  await page.goto('http://localhost:8001/admin/login');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').first().fill('admin@example.com');
  await page.locator('input[type="password"]').first().fill('password');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // ===== CAMPAIGNS =====
  console.log('━'.repeat(50));
  console.log('📢 CAMPAIGNS');
  console.log('━'.repeat(50) + '\n');
  
  await page.goto('http://localhost:8001/admin/campaigns');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('1. Campaigns List');
  await page.screenshot({ path: './tests/e2e/results/p4-01-campaigns.png', fullPage: true });
  
  await page.goto('http://localhost:8001/admin/campaigns/create');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('2. Create Campaign Form');
  await page.screenshot({ path: './tests/e2e/results/p4-02-campaign-create.png', fullPage: true });
  
  // ===== FLOWS =====
  console.log('\n━'.repeat(50));
  console.log('⚡ WORKFLOWS');
  console.log('━'.repeat(50) + '\n');
  
  await page.goto('http://localhost:8001/admin/flows');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('1. Flows List');
  await page.screenshot({ path: './tests/e2e/results/p4-03-flows.png', fullPage: true });
  
  // ===== SETTINGS =====
  console.log('\n━'.repeat(50));
  console.log('⚙️ SETTINGS');
  console.log('━'.repeat(50) + '\n');
  
  await page.goto('http://localhost:8001/admin/settings');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('1. Settings Page');
  await page.screenshot({ path: './tests/e2e/results/p4-04-settings.png', fullPage: true });
  
  // ===== SYSTEM RESOURCES =====
  console.log('\n━'.repeat(50));
  console.log('🖥️ SYSTEM RESOURCES');
  console.log('━'.repeat(50) + '\n');
  
  await page.goto('http://localhost:8001/admin/system-resources');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('1. System Resources');
  await page.screenshot({ path: './tests/e2e/results/p4-05-system.png', fullPage: true });
  
  // ===== ACTIVITY LOGS =====
  console.log('\n━'.repeat(50));
  console.log('📝 ACTIVITY LOGS');
  console.log('━'.repeat(50) + '\n');
  
  await page.goto('http://localhost:8001/admin/activity-logs');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('1. Activity Logs');
  await page.screenshot({ path: './tests/e2e/results/p4-06-activity-logs.png', fullPage: true });
  
  // ===== API LOGS =====
  console.log('\n━'.repeat(50));
  console.log('🔌 API LOGS');
  console.log('━'.repeat(50) + '\n');
  
  await page.goto('http://localhost:8001/admin/api-logs');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('1. API Logs');
  await page.screenshot({ path: './tests/e2e/results/p4-07-api-logs.png', fullPage: true });
  
  // ===== ERROR REPORTS =====
  console.log('\n━'.repeat(50));
  console.log('🐛 ERROR REPORTS');
  console.log('━'.repeat(50) + '\n');
  
  await page.goto('http://localhost:8001/admin/error-reports');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('1. Error Reports');
  await page.screenshot({ path: './tests/e2e/results/p4-08-errors.png', fullPage: true });
  
  // ===== JOB LOGS =====
  console.log('\n━'.repeat(50));
  console.log('📋 JOB LOGS');
  console.log('━'.repeat(50) + '\n');
  
  await page.goto('http://localhost:8001/admin/job-logs');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('1. Job Logs');
  await page.screenshot({ path: './tests/e2e/results/p4-09-job-logs.png', fullPage: true });
  
  console.log('\n✅ Part 4 Complete!');
  
  await context.close();
  await browser.close();
})();
