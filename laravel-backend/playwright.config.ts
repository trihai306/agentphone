import { defineConfig, devices } from '@playwright/test';

/**
 * CLICKAI Playwright Configuration
 * 
 * Tuân thủ rules từ .agent/rules/test-web.md:
 * - Single browser session only
 * - Check Laravel logs trước khi test
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in parallel */
  fullyParallel: false, // Single session rule
  
  /* Fail the build on CI if you accidentally left test.only */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Single worker to follow single session rule */
  workers: 1,
  
  /* Reporter */
  reporter: [
    ['html', { outputFolder: 'tests/e2e/reports' }],
    ['list']
  ],
  
  /* Shared settings */
  use: {
    baseURL: 'http://localhost:8001',
    
    /* Collect trace on failure */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video recording */
    video: 'on-first-retry',
  },

  /* Configure projects */
  projects: [
    // Setup project - chạy trước để tạo auth.json
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    
    // Tests không cần login
    {
      name: 'chromium-noauth',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /smoke\.spec\.ts/,
    },
    
    // Tests cần login - dùng saved session
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './tests/e2e/auth.json',
      },
      dependencies: ['setup'],
      testIgnore: /smoke\.spec\.ts/,
    },
  ],

  /* Web server - optional, comment out if running manually */
  // webServer: {
  //   command: 'php artisan serve --port=8001',
  //   url: 'http://localhost:8001',
  //   reuseExistingServer: !process.env.CI,
  // },

  /* Output folder for test artifacts */
  outputDir: 'tests/e2e/results',
});
