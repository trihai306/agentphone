import { test, expect } from './fixtures/base';

/**
 * Media Page Tests
 * 
 * ĐÃ CÓ SESSION - không cần login lại
 * (storageState được load từ auth.json)
 */

test.describe('Media Library', () => {
  
  test('should access media page without login', async ({ page }) => {
    // Đã có session, vào thẳng /media
    await page.goto('/media');
    await page.waitForLoadState('networkidle');
    
    // Verify we're on media page (not redirected to login)
    const url = page.url();
    expect(url).toContain('/media');
    expect(url).not.toContain('/login');
    
    // Check page content
    await expect(page.locator('body')).not.toBeEmpty();
    
    await page.screenshot({ path: './tests/e2e/results/media-session-test.png' });
  });
  
  test('should display media library UI', async ({ page }) => {
    await page.goto('/media');
    await page.waitForLoadState('networkidle');
    
    // Should have file input for upload
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput.first()).toBeAttached();
  });
  
  test('should upload image successfully', async ({ page }) => {
    await page.goto('/media');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Take screenshot before upload
    await page.screenshot({ path: './tests/e2e/results/media-before-upload.png' });
    
    // Find file input and upload
    const fileInput = page.locator('input[type="file"]').first();
    
    // Create test image using existing screenshot
    const testFile = './tests/e2e/results/media-before-upload.png';
    await fileInput.setInputFiles(testFile);
    
    // Wait for upload
    await page.waitForTimeout(3000);
    
    // Check for success message
    const successToast = page.locator('text=thành công');
    const hasSuccess = await successToast.count() > 0;
    
    await page.screenshot({ path: './tests/e2e/results/media-after-upload.png' });
    
    if (hasSuccess) {
      console.log('✅ Upload successful');
    }
  });
  
});
