import { Page, Locator } from '@playwright/test';
import { BasePage } from '../fixtures/base';

/**
 * Login Page Object
 * 
 * Dùng cho cả:
 * - User login (/login)
 * - Admin login (/admin/login)
 */
export class LoginPage extends BasePage {
  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  
  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('input[type="email"], input[name="email"]').first();
    this.passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    this.submitButton = page.locator('button[type="submit"]').first();
    this.errorMessage = page.locator('[role="alert"], .text-danger, .text-red-500').first();
  }
  
  async gotoUserLogin() {
    await this.goto('/login');
  }
  
  async gotoAdminLogin() {
    await this.goto('/admin/login');
  }
  
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }
  
  async loginAsAdmin() {
    await this.login('admin@example.com', 'password');
  }
  
  async loginAsUser(email = 'test@example.com', password = 'password') {
    await this.login(email, password);
  }
  
  async getErrorMessage(): Promise<string | null> {
    if (await this.errorMessage.isVisible()) {
      return await this.errorMessage.textContent();
    }
    return null;
  }
}
