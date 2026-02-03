---
trigger: glob
glob: laravel-backend/tests/**/*.php
description: Testing standards for Laravel backend (PHPUnit/Pest)
---

# TESTING RULES (LARAVEL BACKEND)

**BẮT BUỘC**: Mọi feature quan trọng PHẢI có tests.

## 1. TEST STRUCTURE

```
tests/
├── Feature/           # Integration tests
│   ├── Auth/
│   │   ├── LoginTest.php
│   │   └── RegistrationTest.php
│   ├── Api/
│   │   ├── DeviceTest.php
│   │   └── WorkflowTest.php
│   └── Admin/
│       └── UserManagementTest.php
└── Unit/              # Unit tests
    ├── Services/
    │   ├── CampaignServiceTest.php
    │   └── DeviceServiceTest.php
    └── Models/
        └── UserTest.php
```

## 2. NAMING CONVENTIONS

| Type | Convention | Ví dụ |
|------|------------|-------|
| Test class | `{Feature}Test` | `DeviceTest`, `LoginTest` |
| Test method | `test_{action}_{expected_result}` | `test_user_can_create_device` |
| Alternative | `it_{does_something}` | `it_returns_404_for_missing_device` |

## 3. FEATURE TEST TEMPLATE

```php
<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Device;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeviceTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    /** @test */
    public function test_user_can_list_their_devices()
    {
        // Arrange
        Device::factory()->count(3)->create(['user_id' => $this->user->id]);
        Device::factory()->create(); // Another user's device

        // Act
        $response = $this->actingAs($this->user)
            ->getJson('/api/devices');

        // Assert
        $response->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'status', 'created_at']
                ]
            ]);
    }

    /** @test */
    public function test_user_cannot_access_other_users_device()
    {
        // Arrange
        $otherDevice = Device::factory()->create();

        // Act
        $response = $this->actingAs($this->user)
            ->getJson("/api/devices/{$otherDevice->id}");

        // Assert
        $response->assertForbidden();
    }

    /** @test */
    public function test_guest_cannot_access_devices()
    {
        // Act (no actingAs)
        $response = $this->getJson('/api/devices');

        // Assert
        $response->assertUnauthorized();
    }

    /** @test */
    public function test_user_can_create_device_with_valid_data()
    {
        // Arrange
        $data = [
            'name' => 'My Phone',
            'device_id' => 'abc123',
        ];

        // Act
        $response = $this->actingAs($this->user)
            ->postJson('/api/devices', $data);

        // Assert
        $response->assertCreated()
            ->assertJsonPath('data.name', 'My Phone');

        $this->assertDatabaseHas('devices', [
            'user_id' => $this->user->id,
            'name' => 'My Phone',
        ]);
    }

    /** @test */
    public function test_create_device_fails_with_invalid_data()
    {
        // Act
        $response = $this->actingAs($this->user)
            ->postJson('/api/devices', [
                'name' => '', // Invalid
            ]);

        // Assert
        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }
}
```

## 4. UNIT TEST TEMPLATE

```php
<?php

namespace Tests\Unit\Services;

use App\Models\User;
use App\Models\Campaign;
use App\Services\CampaignService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CampaignServiceTest extends TestCase
{
    use RefreshDatabase;

    protected CampaignService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(CampaignService::class);
    }

    /** @test */
    public function test_get_campaigns_for_user_returns_only_user_campaigns()
    {
        // Arrange
        $user = User::factory()->create();
        Campaign::factory()->count(3)->create(['user_id' => $user->id]);
        Campaign::factory()->count(2)->create(); // Other users

        // Act
        $campaigns = $this->service->getCampaignsForUser($user);

        // Assert
        $this->assertCount(3, $campaigns);
        $campaigns->each(fn($c) => $this->assertEquals($user->id, $c->user_id));
    }

    /** @test */
    public function test_create_campaign_sets_correct_defaults()
    {
        // Arrange
        $user = User::factory()->create();
        $data = ['name' => 'Test Campaign'];

        // Act
        $campaign = $this->service->createCampaign($user, $data);

        // Assert
        $this->assertEquals('pending', $campaign->status);
        $this->assertEquals($user->id, $campaign->user_id);
    }
}
```

## 5. DATABASE TESTING

```php
// ✅ Dùng RefreshDatabase cho tests
use Illuminate\Foundation\Testing\RefreshDatabase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;
    
    // Tests...
}

// ✅ Dùng Factories
$user = User::factory()->create();
$users = User::factory()->count(5)->create();
$admin = User::factory()->admin()->create();

// ✅ Assert database state
$this->assertDatabaseHas('users', ['email' => 'test@example.com']);
$this->assertDatabaseMissing('users', ['email' => 'deleted@example.com']);
$this->assertDatabaseCount('users', 5);
```

## 6. MOCK & FAKE

```php
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Notification;

// ✅ Mock HTTP calls
Http::fake([
    'api.external.com/*' => Http::response(['status' => 'ok'], 200),
]);

// ✅ Fake Queue
Queue::fake();
$this->service->processAsync();
Queue::assertPushed(ProcessJob::class);

// ✅ Fake Notifications
Notification::fake();
$user->notify(new WelcomeNotification());
Notification::assertSentTo($user, WelcomeNotification::class);
```

## 7. AUTHENTICATION IN TESTS

```php
// ✅ Authenticate as user
$this->actingAs($user);

// ✅ Authenticate for API
$this->actingAs($user, 'sanctum');

// ✅ Test as guest (no actingAs)
$response = $this->getJson('/api/profile');
$response->assertUnauthorized();
```

## 8. RUNNING TESTS

```bash
# Run all tests
php artisan test

# Run specific test file
php artisan test tests/Feature/Api/DeviceTest.php

# Run specific test method
php artisan test --filter=test_user_can_create_device

# Run with coverage
php artisan test --coverage

# Run in parallel
php artisan test --parallel
```

## 9. WHAT TO TEST

### PHẢI TEST

| Category | What to test |
|----------|--------------|
| Authentication | Login, logout, registration, password reset |
| Authorization | User can only access own resources |
| CRUD | Create, read, update, delete operations |
| Validation | Invalid input returns 422 |
| Edge cases | Empty data, max length, special characters |
| Business logic | Core service methods |

### KHÔNG CẦN TEST

| Category | Why |
|----------|-----|
| Framework internals | Laravel đã test |
| Simple getters/setters | Quá trivial |
| External APIs | Mock thay vì call thật |

## 10. TEST CHECKLIST

Trước khi merge PR:

- [ ] Feature tests cho mọi API endpoint mới
- [ ] Unit tests cho service methods phức tạp
- [ ] Test cả happy path và error cases
- [ ] Test authorization (403 khi không có quyền)
- [ ] Test validation (422 khi input sai)
- [ ] All tests pass: `php artisan test`

## KHÔNG LÀM

- ❌ Tests phụ thuộc vào nhau (mỗi test phải độc lập)
- ❌ Hardcode IDs trong tests (dùng factories)
- ❌ Call real external APIs (dùng Http::fake())
- ❌ Test quá nhiều trong 1 test method
- ❌ Skip tests vì "nó works trên local"
