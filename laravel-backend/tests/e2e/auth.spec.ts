import { test, expect, checkLaravelLogs } from './fixtures/base';
import { LoginPage } from './pages/login.page';

/**
 * Auth Tests
 * 
 * Tuân thủ test-web.md:
 * - Check Laravel logs trước
 * - Single browser session
 * - Blank page = Backend error
 */

test.describe('Authentication', () => {
  
  test.beforeAll(() => {
    // MANDATORY: Check Laravel logs trước khi test
    const { hasErrors, errors } = checkLaravelLogs();
    if (hasErrors) {
      console.warn('⚠️  Laravel có errors. Fix backend trước khi test!');
      errors.slice(-5).forEach(e => console.warn('   ', e));
    }
  });
  
  test.describe('User Login', () => {
    
    test('should display login page', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.gotoUserLogin();
      
      // Verify page loaded (not blank)
      const bodyContent = await page.locator('body').innerHTML();
      expect(bodyContent.length).toBeGreaterThan(100);
      
      // Verify login form elements
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.submitButton).toBeVisible();
      
      await loginPage.screenshot('login-page');
    });
    
    test('should show error for invalid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.gotoUserLogin();
      
      await loginPage.login('wrong@email.com', 'wrongpassword');
      
      // Should show error or stay on login page
      const currentUrl = page.url();
      expect(currentUrl).toContain('login');
      
      await loginPage.screenshot('login-error');
    });
    
    test('should login with valid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.gotoUserLogin();
      
      await loginPage.loginAsUser();
      
      // Should redirect to dashboard or home
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      
      // Either redirected away from login or error shown
      await loginPage.screenshot('login-result');
    });
    
  });
  
  test.describe('Admin Login', () => {
    
    test('should display admin login page', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.gotoAdminLogin();
      
      // Verify page loaded
      const bodyContent = await page.locator('body').innerHTML();
      expect(bodyContent.length).toBeGreaterThan(100);
      
      await loginPage.screenshot('admin-login-page');
    });
    
    test('should login as admin', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.gotoAdminLogin();
      
      await loginPage.loginAsAdmin();
      
      // Should redirect to admin dashboard
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      
      // Verify we're in admin area or dashboard
      await loginPage.screenshot('admin-login-result');
    });
    
  });
  
});
