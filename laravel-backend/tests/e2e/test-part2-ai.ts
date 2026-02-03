import { chromium } from '@playwright/test';

/**
 * Part 2: AI Features Detailed Test
 */
(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    recordVideo: { dir: './tests/e2e/results/', size: { width: 1280, height: 720 } }
  });
  const page = await context.newPage();
  
  console.log('🎨 PART 2: AI FEATURES\n');
  
  // Login
  await page.goto('http://localhost:8001/admin/login');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').first().fill('admin@example.com');
  await page.locator('input[type="password"]').first().fill('password');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // ===== AI GENERATIONS =====
  console.log('━'.repeat(50));
  console.log('🎨 AI GENERATIONS');
  console.log('━'.repeat(50) + '\n');
  
  await page.goto('http://localhost:8001/admin/ai-generations');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('1. AI Generations List');
  await page.screenshot({ path: './tests/e2e/results/p2-01-ai-generations.png', fullPage: true });
  
  // View detail
  const genRow = page.locator('table tbody tr').first();
  if (await genRow.count() > 0) {
    await genRow.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    console.log('2. Generation Detail');
    await page.screenshot({ path: './tests/e2e/results/p2-02-ai-gen-detail.png', fullPage: true });
  }
  
  // ===== AI SCENARIOS =====
  console.log('\n━'.repeat(50));
  console.log('🎬 AI SCENARIOS');
  console.log('━'.repeat(50) + '\n');
  
  await page.goto('http://localhost:8001/admin/ai-scenarios');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('1. AI Scenarios List');
  await page.screenshot({ path: './tests/e2e/results/p2-03-ai-scenarios.png', fullPage: true });
  
  // Create
  await page.goto('http://localhost:8001/admin/ai-scenarios/create');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('2. Create Scenario Form');
  await page.screenshot({ path: './tests/e2e/results/p2-04-scenario-create.png', fullPage: true });
  
  // ===== AI CREDIT PACKAGES =====
  console.log('\n━'.repeat(50));
  console.log('💎 AI CREDIT PACKAGES');
  console.log('━'.repeat(50) + '\n');
  
  await page.goto('http://localhost:8001/admin/ai-credit-packages');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('1. Credit Packages List');
  await page.screenshot({ path: './tests/e2e/results/p2-05-credit-packages.png', fullPage: true });
  
  // Create
  await page.goto('http://localhost:8001/admin/ai-credit-packages/create');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('2. Create Package Form');
  await page.screenshot({ path: './tests/e2e/results/p2-06-package-create.png', fullPage: true });
  
  // ===== SERVICE PACKAGES =====
  console.log('\n━'.repeat(50));
  console.log('📦 SERVICE PACKAGES');
  console.log('━'.repeat(50) + '\n');
  
  await page.goto('http://localhost:8001/admin/service-packages');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('1. Service Packages List');
  await page.screenshot({ path: './tests/e2e/results/p2-07-service-packages.png', fullPage: true });
  
  console.log('\n✅ Part 2 Complete!');
  
  await context.close();
  await browser.close();
})();
