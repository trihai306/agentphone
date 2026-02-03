import { chromium } from '@playwright/test';

/**
 * Login recording script
 * Quay video đăng nhập user
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
  
  console.log('🎬 Bắt đầu quay video login...');
  
  // 1. Vào trang login
  console.log('📍 Truy cập login page');
  await page.goto('http://localhost:8001/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Screenshot login page
  await page.screenshot({ path: './tests/e2e/results/01-login-page.png' });
  console.log('📸 Screenshot: login page');
  
  // 2. Điền form
  console.log('📝 Điền thông tin đăng nhập');
  
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  
  await emailInput.fill('admin@example.com');
  await page.waitForTimeout(500);
  await passwordInput.fill('password');
  await page.waitForTimeout(500);
  
  // Screenshot filled form
  await page.screenshot({ path: './tests/e2e/results/02-form-filled.png' });
  console.log('📸 Screenshot: form filled');
  
  // 3. Click submit
  console.log('🚀 Click đăng nhập');
  const submitBtn = page.locator('button[type="submit"]').first();
  await submitBtn.click();
  
  // Wait for navigation
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Screenshot result
  await page.screenshot({ path: './tests/e2e/results/03-login-result.png' });
  console.log('📸 Screenshot: login result');
  
  const currentUrl = page.url();
  console.log(`📍 Current URL: ${currentUrl}`);
  
  if (!currentUrl.includes('login')) {
    console.log('✅ Login thành công!');
  } else {
    console.log('❌ Vẫn ở trang login - kiểm tra credentials');
  }
  
  // Close để save video
  await context.close();
  await browser.close();
  
  console.log('🎬 Video đã lưu tại: ./tests/e2e/results/');
})();
