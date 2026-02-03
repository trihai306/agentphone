import { chromium } from '@playwright/test';

/**
 * Test & Screenshot AI Studio for UI review
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
  
  console.log('🎨 Testing AI Studio...');
  
  // 1. Main AI Studio page
  console.log('📍 1. AI Studio Index');
  await page.goto('http://localhost:8001/ai-studio');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: './tests/e2e/results/ai-01-studio-index.png', fullPage: true });
  
  // 2. Look for tabs/sections
  console.log('📍 2. Exploring UI elements...');
  
  // Click on different tabs if they exist
  const tabs = page.locator('[role="tab"], button[class*="tab"]');
  const tabCount = await tabs.count();
  console.log(`   Found ${tabCount} tabs`);
  
  // 3. Check generation form
  console.log('📍 3. Generation form...');
  const promptInput = page.locator('textarea, input[placeholder*="prompt"], input[placeholder*="mô tả"]').first();
  if (await promptInput.count() > 0) {
    await promptInput.click();
    await page.screenshot({ path: './tests/e2e/results/ai-02-prompt-input.png' });
  }
  
  // 4. Model selector
  console.log('📍 4. Model selector...');
  const modelSelector = page.locator('[class*="model"], select, [role="listbox"]').first();
  if (await modelSelector.count() > 0) {
    await modelSelector.click().catch(() => {});
    await page.waitForTimeout(500);
    await page.screenshot({ path: './tests/e2e/results/ai-03-model-selector.png' });
    await page.keyboard.press('Escape');
  }
  
  // 5. Gallery page
  console.log('📍 5. AI Gallery...');
  await page.goto('http://localhost:8001/ai-studio/gallery');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: './tests/e2e/results/ai-04-gallery.png', fullPage: true });
  
  // 6. Scenarios page
  console.log('📍 6. Scenarios...');
  await page.goto('http://localhost:8001/ai-studio/scenarios');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: './tests/e2e/results/ai-05-scenarios.png', fullPage: true });
  
  // 7. Back to main and try generate
  console.log('📍 7. Try generate flow...');
  await page.goto('http://localhost:8001/ai-studio');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  // Fill prompt if available
  const textarea = page.locator('textarea').first();
  if (await textarea.count() > 0) {
    await textarea.fill('A beautiful sunset over the ocean with vibrant colors');
    await page.waitForTimeout(500);
    await page.screenshot({ path: './tests/e2e/results/ai-06-with-prompt.png' });
  }
  
  // Check for generate button
  const generateBtn = page.locator('button:has-text("Tạo"), button:has-text("Generate"), button:has-text("Bắt đầu")').first();
  if (await generateBtn.count() > 0) {
    console.log('   Found generate button');
    await page.screenshot({ path: './tests/e2e/results/ai-07-generate-btn.png' });
  }
  
  // 8. Final full page screenshot
  console.log('📍 8. Final overview...');
  await page.screenshot({ path: './tests/e2e/results/ai-08-final.png', fullPage: true });
  
  console.log('\n✅ AI Studio screenshots saved!');
  console.log('📁 Check: tests/e2e/results/ai-*.png');
  
  await context.close();
  await browser.close();
})();
