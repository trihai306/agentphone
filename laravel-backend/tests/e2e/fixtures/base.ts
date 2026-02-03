import { test as base, expect, Page } from '@playwright/test';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Custom Playwright fixtures for CLICKAI
 * 
 * Tuân thủ test-web.md rules:
 * - Check Laravel logs BEFORE opening browser
 * - Single browser session only
 */

// Extend base test with custom fixtures
export const test = base.extend<{
  // Auto-check Laravel logs before each test
  laravelLogsClean: void;
}>({
  // Check Laravel logs before each test
  laravelLogsClean: [async ({}, use) => {
    const logPath = path.join(__dirname, '../../storage/logs/laravel.log');
    
    // Check if log file exists
    if (fs.existsSync(logPath)) {
      const logContent = fs.readFileSync(logPath, 'utf-8');
      const lastLines = logContent.split('\n').slice(-100).join('\n');
      
      // Check for recent errors
      const errorPatterns = [
        /\[.*\] production\.ERROR/,
        /\[.*\] local\.ERROR/,
        /SQLSTATE\[/,
        /Undefined variable/,
        /Class .* not found/,
      ];
      
      const hasRecentErrors = errorPatterns.some(pattern => pattern.test(lastLines));
      
      if (hasRecentErrors) {
        console.warn('⚠️  Laravel log có errors gần đây. Kiểm tra trước khi test.');
        console.warn('   Run: tail -n 50 storage/logs/laravel.log | grep -i error');
      }
    }
    
    await use();
  }, { auto: true }],
});

export { expect };

/**
 * Page Object Base Class
 */
export class BasePage {
  constructor(protected page: Page) {}
  
  async goto(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }
  
  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded');
  }
  
  async screenshot(name: string) {
    await this.page.screenshot({ 
      path: `tests/e2e/results/${name}.png`,
      fullPage: true 
    });
  }
}

/**
 * Helper: Check Laravel logs for errors
 */
export function checkLaravelLogs(): { hasErrors: boolean; errors: string[] } {
  const logPath = path.join(__dirname, '../../storage/logs/laravel.log');
  const errors: string[] = [];
  
  if (!fs.existsSync(logPath)) {
    return { hasErrors: false, errors };
  }
  
  try {
    const result = execSync(
      `tail -n 100 "${logPath}" | grep -i "error\\|exception\\|fatal" || true`,
      { encoding: 'utf-8' }
    );
    
    if (result.trim()) {
      errors.push(...result.trim().split('\n'));
    }
  } catch (e) {
    // grep returns 1 if no matches
  }
  
  return { hasErrors: errors.length > 0, errors };
}
