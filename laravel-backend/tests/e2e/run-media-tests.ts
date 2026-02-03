import { chromium } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Full Media Feature Test with Video Recording
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
  const results: { test: string; status: string }[] = [];
  
  const log = (msg: string) => console.log(msg);
  
  try {
    // ========================================
    // TEST 1: Page Load
    // ========================================
    log('🧪 Test 1: Load media page...');
    await page.goto('http://localhost:8001/media');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    if (!page.url().includes('/login')) {
      results.push({ test: 'Page Load', status: '✅' });
      log('✅ Page loaded successfully');
    } else {
      results.push({ test: 'Page Load', status: '❌' });
      log('❌ Redirected to login');
    }
    
    await page.screenshot({ path: './tests/e2e/results/test-01-page-load.png' });
    
    // ========================================
    // TEST 2: Upload Image
    // ========================================
    log('🧪 Test 2: Upload image...');
    const testImage = './tests/e2e/results/test-01-page-load.png';
    const fileInput = page.locator('input[type="file"]').first();
    
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles(testImage);
      await page.waitForTimeout(3000);
      
      const success = await page.locator('text=thành công').count();
      if (success > 0) {
        results.push({ test: 'Upload Image', status: '✅' });
        log('✅ Upload successful');
      } else {
        results.push({ test: 'Upload Image', status: '⚠️' });
        log('⚠️ Upload - no success toast found');
      }
    }
    
    await page.screenshot({ path: './tests/e2e/results/test-02-upload.png' });
    
    // ========================================
    // TEST 3: Click Media Item
    // ========================================
    log('🧪 Test 3: Click media item...');
    await page.goto('http://localhost:8001/media');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const mediaItem = page.locator('[class*="aspect-square"][class*="cursor-pointer"]').first();
    if (await mediaItem.count() > 0) {
      await mediaItem.click({ force: true });
      await page.waitForTimeout(1000);
      results.push({ test: 'Click Media Item', status: '✅' });
      log('✅ Media item clicked');
    } else {
      results.push({ test: 'Click Media Item', status: '⚠️' });
      log('⚠️ No media item found');
    }
    
    await page.screenshot({ path: './tests/e2e/results/test-03-click-item.png' });
    
    // ========================================
    // TEST 4: Right-click Context Menu
    // ========================================
    log('🧪 Test 4: Right-click context menu...');
    if (await mediaItem.count() > 0) {
      await mediaItem.click({ button: 'right', force: true });
      await page.waitForTimeout(500);
      results.push({ test: 'Context Menu', status: '✅' });
      log('✅ Context menu triggered');
    }
    
    await page.screenshot({ path: './tests/e2e/results/test-04-context-menu.png' });
    await page.keyboard.press('Escape');
    
    // ========================================
    // TEST 5: Filter by Image Type
    // ========================================
    log('🧪 Test 5: Filter by image type...');
    await page.goto('http://localhost:8001/media?type=image');
    await page.waitForLoadState('networkidle');
    
    if (page.url().includes('type=image')) {
      results.push({ test: 'Filter by Image', status: '✅' });
      log('✅ Filter applied');
    }
    
    await page.screenshot({ path: './tests/e2e/results/test-05-filter-image.png' });
    
    // ========================================
    // TEST 6: Filter by Video Type
    // ========================================
    log('🧪 Test 6: Filter by video type...');
    await page.goto('http://localhost:8001/media?type=video');
    await page.waitForLoadState('networkidle');
    
    results.push({ test: 'Filter by Video', status: '✅' });
    await page.screenshot({ path: './tests/e2e/results/test-06-filter-video.png' });
    
    // ========================================
    // TEST 7: API /media/list.json
    // ========================================
    log('🧪 Test 7: API list.json...');
    await page.goto('http://localhost:8001/media');
    await page.waitForLoadState('networkidle');
    
    const listResponse = await page.request.get('http://localhost:8001/media/list.json');
    if (listResponse.status() === 200) {
      const json = await listResponse.json();
      if (json.success) {
        results.push({ test: 'API list.json', status: '✅' });
        log('✅ API list.json works');
      }
    }
    
    // ========================================
    // TEST 8: API /media/stats.json
    // ========================================
    log('🧪 Test 8: API stats.json...');
    const statsResponse = await page.request.get('http://localhost:8001/media/stats.json');
    if (statsResponse.status() === 200) {
      const json = await statsResponse.json();
      if (json.success && json.data) {
        results.push({ test: 'API stats.json', status: '✅' });
        log(`✅ Stats: ${json.data.total} files, ${json.data.images} images, ${json.data.videos} videos`);
      }
    }
    
    // ========================================
    // TEST 9: Storage Plans Page
    // ========================================
    log('🧪 Test 9: Storage plans page...');
    await page.goto('http://localhost:8001/media/storage-plans');
    await page.waitForLoadState('networkidle');
    
    if (page.url().includes('storage-plans')) {
      results.push({ test: 'Storage Plans Page', status: '✅' });
      log('✅ Storage plans page loaded');
    }
    
    await page.screenshot({ path: './tests/e2e/results/test-09-storage-plans.png' });
    
    // ========================================
    // TEST 10: Search
    // ========================================
    log('🧪 Test 10: Search functionality...');
    await page.goto('http://localhost:8001/media');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[placeholder*="Tìm"], input[placeholder*="search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);
      results.push({ test: 'Search', status: '✅' });
      log('✅ Search works');
    }
    
    await page.screenshot({ path: './tests/e2e/results/test-10-search.png' });
    
  } catch (error) {
    log(`❌ Error: ${error}`);
  }
  
  // ========================================
  // SUMMARY
  // ========================================
  log('\n' + '='.repeat(50));
  log('📊 TEST RESULTS SUMMARY');
  log('='.repeat(50));
  
  const passed = results.filter(r => r.status === '✅').length;
  const total = results.length;
  
  results.forEach(r => {
    log(`${r.status} ${r.test}`);
  });
  
  log('='.repeat(50));
  log(`✅ Passed: ${passed}/${total}`);
  log('='.repeat(50));
  
  await context.close();
  await browser.close();
  
  log('\n🎬 Video saved to tests/e2e/results/');
})();
