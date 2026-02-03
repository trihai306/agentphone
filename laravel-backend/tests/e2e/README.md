# E2E Testing với Playwright

## Quick Start

```bash
# Chạy tất cả tests
npm run test:e2e

# Chạy với UI (recommended cho debug)
npm run test:e2e:ui

# Chạy với browser visible
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# Xem report
npm run test:e2e:report
```

## Trước khi test

⚠️ **MANDATORY** theo rules trong `.agent/rules/test-web.md`:

1. **Check Laravel logs TRƯỚC**:
   ```bash
   tail -n 50 storage/logs/laravel.log | grep -i error
   ```

2. **Server phải đang chạy**:
   ```bash
   php artisan serve --port=8001
   ```

3. **Blank page = Backend error** → Fix Laravel trước, không retry browser.

## Cấu trúc

```
tests/e2e/
├── fixtures/         # Custom fixtures & base classes
│   └── base.ts       # BasePage, test extensions
├── pages/            # Page Object Models
│   └── login.page.ts # Login page object
├── smoke.spec.ts     # Smoke tests (chạy đầu tiên)
├── auth.spec.ts      # Authentication tests
├── results/          # Screenshots & artifacts
└── reports/          # HTML reports
```

## Viết test mới

### 1. Tạo Page Object (nếu cần)

```typescript
// tests/e2e/pages/dashboard.page.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from '../fixtures/base';

export class DashboardPage extends BasePage {
  readonly welcomeMessage: Locator;
  
  constructor(page: Page) {
    super(page);
    this.welcomeMessage = page.locator('[data-testid="welcome"]');
  }
  
  async gotoDashboard() {
    await this.goto('/dashboard');
  }
}
```

### 2. Viết test

```typescript
// tests/e2e/dashboard.spec.ts
import { test, expect, checkLaravelLogs } from './fixtures/base';
import { DashboardPage } from './pages/dashboard.page';

test.describe('Dashboard', () => {
  
  test.beforeAll(() => {
    const { hasErrors } = checkLaravelLogs();
    if (hasErrors) {
      throw new Error('Fix Laravel errors first!');
    }
  });
  
  test('should display welcome message', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.gotoDashboard();
    
    await expect(dashboard.welcomeMessage).toBeVisible();
  });
  
});
```

## Commands hữu ích

```bash
# Chạy specific test file
npx playwright test auth.spec.ts

# Chạy specific test
npx playwright test -g "should login"

# Record video
npx playwright test --video on

# Generate test từ actions
npx playwright codegen localhost:8001
```

## Recording tests

Dùng codegen để record:

```bash
npx playwright codegen http://localhost:8001
```

Click qua app, Playwright sẽ generate code tự động.

## Credentials

Xem `ADMIN_CREDENTIALS.md` cho login info:
- Admin: admin@example.com / password
- User: test@example.com / password
