import { chromium } from '@playwright/test';

/**
 * Verify AI Studio bug fixes
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
  const results: { test: string; status: string; note?: string }[] = [];
  
  console.log('🔧 Verifying AI Studio bug fixes...\n');
  
  // Test 1: Main page
  console.log('1️⃣ AI Studio Index...');
  await page.goto('http://localhost:8001/ai-studio');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  if (!page.url().includes('/login') && (await page.locator('body').innerHTML()).length > 500) {
    results.push({ test: 'AI Studio Index', status: '✅' });
    console.log('   ✅ OK');
  } else {
    results.push({ test: 'AI Studio Index', status: '❌' });
    console.log('   ❌ Failed');
  }
  await page.screenshot({ path: './tests/e2e/results/fix-01-index.png' });
  
  // Test 2: Gallery (was 404)
  console.log('2️⃣ AI Studio Gallery...');
  await page.goto('http://localhost:8001/ai-studio/gallery');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  const galleryContent = await page.locator('body').innerHTML();
  const is404 = galleryContent.includes('404') || galleryContent.includes('NOT FOUND');
  
  if (!is404 && galleryContent.length > 500) {
    results.push({ test: 'Gallery Page', status: '✅', note: 'Fixed!' });
    console.log('   ✅ Fixed!');
  } else {
    results.push({ test: 'Gallery Page', status: '❌', note: 'Still 404' });
    console.log('   ❌ Still broken');
  }
  await page.screenshot({ path: './tests/e2e/results/fix-02-gallery.png' });
  
  // Test 3: Scenarios (was blank)
  console.log('3️⃣ AI Studio Scenarios...');
  await page.goto('http://localhost:8001/ai-studio/scenarios');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  const scenariosContent = await page.locator('body').innerHTML();
  const isBlank = scenariosContent.length < 500;
  
  if (!isBlank) {
    results.push({ test: 'Scenarios Page', status: '✅', note: 'Fixed!' });
    console.log('   ✅ Fixed!');
  } else {
    results.push({ test: 'Scenarios Page', status: '❌', note: 'Still blank' });
    console.log('   ❌ Still blank');
  }
  await page.screenshot({ path: './tests/e2e/results/fix-03-scenarios.png' });
  
  // Test 4: Generations (should work)
  console.log('4️⃣ AI Studio Generations...');
  await page.goto('http://localhost:8001/ai-studio/generations');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  const genContent = await page.locator('body').innerHTML();
  if (genContent.length > 500) {
    results.push({ test: 'Generations Page', status: '✅' });
    console.log('   ✅ OK');
  } else {
    results.push({ test: 'Generations Page', status: '❌' });
    console.log('   ❌ Failed');
  }
  await page.screenshot({ path: './tests/e2e/results/fix-04-generations.png' });
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 BUG FIX RESULTS');
  console.log('='.repeat(50));
  
  results.forEach(r => {
    const note = r.note ? ` (${r.note})` : '';
    console.log(`${r.status} ${r.test}${note}`);
  });
  
  const passed = results.filter(r => r.status === '✅').length;
  console.log('='.repeat(50));
  console.log(`✅ ${passed}/${results.length} passed`);
  
  await context.close();
  await browser.close();
  
  console.log('\n🎬 Video saved!');
})();
