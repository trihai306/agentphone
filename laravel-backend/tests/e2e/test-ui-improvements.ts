import { chromium } from '@playwright/test';

/**
 * Test UI improvements
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
  
  console.log('🎨 Testing UI improvements...\n');
  
  // 1. AI Studio with improvements
  console.log('1️⃣ AI Studio with new UI...');
  await page.goto('http://localhost:8001/ai-studio');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: './tests/e2e/results/ui-01-main.png', fullPage: true });
  
  // 2. Focus on prompt textarea (test glow effect)
  console.log('2️⃣ Testing prompt focus glow...');
  const textarea = page.locator('textarea').first();
  if (await textarea.count() > 0) {
    await textarea.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: './tests/e2e/results/ui-02-prompt-focus.png' });
    
    await textarea.fill('A majestic dragon flying over a crystal castle at sunset, cinematic lighting, 4K quality');
    await page.waitForTimeout(500);
    await page.screenshot({ path: './tests/e2e/results/ui-03-prompt-filled.png' });
  }
  
  // 3. Hover on generate button
  console.log('3️⃣ Testing generate button...');
  const generateBtn = page.locator('button:has-text("Tạo ngay"), button:has-text("Generate")').first();
  if (await generateBtn.count() > 0) {
    await generateBtn.hover();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: './tests/e2e/results/ui-04-button-hover.png' });
  }
  
  // 4. Gallery page fixed
  console.log('4️⃣ Gallery page...');
  await page.goto('http://localhost:8001/ai-studio/gallery');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: './tests/e2e/results/ui-05-gallery.png', fullPage: true });
  
  // 5. Scenarios page fixed
  console.log('5️⃣ Scenarios page...');
  await page.goto('http://localhost:8001/ai-studio/scenarios');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: './tests/e2e/results/ui-06-scenarios.png', fullPage: true });
  
  console.log('\n✅ UI test complete!');
  console.log('📁 Screenshots saved to tests/e2e/results/ui-*.png');
  
  await context.close();
  await browser.close();
  
  console.log('🎬 Video saved!');
})();
