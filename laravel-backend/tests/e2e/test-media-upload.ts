import { chromium } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Test upload ảnh trang /media
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
  
  // Listen for console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console error: ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    errors.push(`Page error: ${err.message}`);
  });
  
  console.log('🎬 Test upload ảnh /media...');
  
  // 1. Login first
  console.log('🔐 Đăng nhập...');
  await page.goto('http://localhost:8001/login');
  await page.waitForLoadState('networkidle');
  
  await page.locator('input[type="email"]').first().fill('admin@example.com');
  await page.locator('input[type="password"]').first().fill('password');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log(`📍 After login: ${page.url()}`);
  
  // 2. Navigate to /media
  console.log('📂 Truy cập /media...');
  await page.goto('http://localhost:8001/media');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: './tests/e2e/results/media-01-page.png' });
  console.log('📸 Screenshot: media page');
  
  // Check if page loaded properly
  const bodyContent = await page.locator('body').innerHTML();
  if (bodyContent.length < 200) {
    console.log('⚠️ Page có thể blank hoặc lỗi');
  }
  
  // 3. Look for upload button/input
  console.log('🔍 Tìm nút upload...');
  
  // Common upload selectors
  const uploadSelectors = [
    'input[type="file"]',
    '[data-testid="upload"]',
    'button:has-text("Upload")',
    'button:has-text("Tải lên")',
    '.upload-button',
    '[class*="upload"]',
    'label[for*="file"]'
  ];
  
  let uploadFound = false;
  for (const selector of uploadSelectors) {
    const el = page.locator(selector).first();
    if (await el.count() > 0) {
      console.log(`✅ Tìm thấy: ${selector}`);
      uploadFound = true;
      
      // If it's a file input, try to upload
      if (selector === 'input[type="file"]') {
        // Create a test image
        const testImagePath = './tests/e2e/results/test-upload.png';
        if (!fs.existsSync(testImagePath)) {
          // Use an existing screenshot as test file
          fs.copyFileSync('./tests/e2e/results/media-01-page.png', testImagePath);
        }
        
        console.log('📤 Thử upload ảnh...');
        await el.setInputFiles(testImagePath);
        await page.waitForTimeout(3000);
        
        await page.screenshot({ path: './tests/e2e/results/media-02-after-upload.png' });
        console.log('📸 Screenshot: after upload');
      }
      break;
    }
  }
  
  if (!uploadFound) {
    console.log('❌ Không tìm thấy input upload');
    
    // Screenshot current state
    await page.screenshot({ path: './tests/e2e/results/media-no-upload.png', fullPage: true });
    
    // Log page structure
    const buttons = await page.locator('button').allTextContents();
    console.log('Buttons trên page:', buttons.slice(0, 10));
  }
  
  // 4. Check for any errors
  if (errors.length > 0) {
    console.log('\n❌ Errors detected:');
    errors.forEach(e => console.log(`   ${e}`));
  } else {
    console.log('\n✅ Không có JavaScript errors');
  }
  
  // Final screenshot
  await page.screenshot({ path: './tests/e2e/results/media-final.png', fullPage: true });
  
  await context.close();
  await browser.close();
  
  console.log('\n🎬 Video đã lưu!');
  console.log('📁 Screenshots: tests/e2e/results/media-*.png');
})();
