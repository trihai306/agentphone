import { test, expect, checkLaravelLogs } from './fixtures/base';

/**
 * Smoke Tests
 * 
 * Quick sanity check cho các pages chính
 * Chạy đầu tiên để verify app hoạt động
 */

test.describe('Smoke Tests', () => {
  
  test.beforeAll(() => {
    // MANDATORY: Check Laravel logs
    const { hasErrors, errors } = checkLaravelLogs();
    if (hasErrors) {
      console.warn('⚠️  Laravel errors detected! Fix before testing.');
      throw new Error('Laravel has backend errors. Check logs first.');
    }
  });
  
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Page should not be blank
    const content = await page.locator('body').innerHTML();
    expect(content.length).toBeGreaterThan(100);
    
    // Should have some recognizable content
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    
    // Screenshot for verification
    await page.screenshot({ path: 'tests/e2e/results/smoke-homepage.png' });
  });
  
  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Check for login form
    const emailField = page.locator('input[type="email"], input[name="email"]');
    await expect(emailField.first()).toBeVisible({ timeout: 10000 });
  });
  
  test('admin login page loads', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');
    
    // Check for login form
    const emailField = page.locator('input[type="email"], input[name="email"]');
    await expect(emailField.first()).toBeVisible({ timeout: 10000 });
  });
  
  test('API health check', async ({ request }) => {
    // Check if API responds
    const response = await request.get('/api/health');
    
    // Either 200 OK or endpoint doesn't exist (404)
    expect([200, 404]).toContain(response.status());
  });
  
});
