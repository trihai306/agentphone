---
description: Quy trình tạo test cases cho Laravel Backend (PHPUnit/Pest)
---

# Quy Trình Tạo Test

## Cấu Trúc Test

```
tests/
├── Feature/           # Integration tests
│   ├── Api/
│   │   ├── DeviceTest.php
│   │   └── WorkflowTest.php
│   └── Auth/
│       └── LoginTest.php
└── Unit/              # Unit tests
    └── Services/
        └── DeviceServiceTest.php
```

---

## Các Bước

### 1. Tạo Feature Test

```bash
# turbo
php artisan make:test Feature/Api/ExampleTest
```

```php
// tests/Feature/Api/ExampleTest.php
<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Example;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    /** @test */
    public function test_user_can_list_examples()
    {
        // Arrange
        Example::factory()->count(3)->create(['user_id' => $this->user->id]);

        // Act
        $response = $this->actingAs($this->user)
            ->getJson('/api/examples');

        // Assert
        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    /** @test */
    public function test_user_can_create_example()
    {
        // Arrange
        $data = [
            'name' => 'Test Example',
            'description' => 'Test description',
        ];

        // Act
        $response = $this->actingAs($this->user)
            ->postJson('/api/examples', $data);

        // Assert
        $response->assertCreated()
            ->assertJsonPath('data.name', 'Test Example');

        $this->assertDatabaseHas('examples', [
            'user_id' => $this->user->id,
            'name' => 'Test Example',
        ]);
    }

    /** @test */
    public function test_create_fails_with_invalid_data()
    {
        // Act
        $response = $this->actingAs($this->user)
            ->postJson('/api/examples', [
                'name' => '', // Invalid
            ]);

        // Assert
        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    /** @test */
    public function test_user_cannot_access_others_example()
    {
        // Arrange
        $otherExample = Example::factory()->create();

        // Act
        $response = $this->actingAs($this->user)
            ->getJson("/api/examples/{$otherExample->id}");

        // Assert
        $response->assertForbidden();
    }

    /** @test */
    public function test_guest_cannot_access_api()
    {
        // Act (no actingAs)
        $response = $this->getJson('/api/examples');

        // Assert
        $response->assertUnauthorized();
    }
}
```

### 2. Tạo Unit Test

```bash
# turbo
php artisan make:test Unit/Services/ExampleServiceTest
```

```php
// tests/Unit/Services/ExampleServiceTest.php
<?php

namespace Tests\Unit\Services;

use App\Models\User;
use App\Models\Example;
use App\Services\ExampleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleServiceTest extends TestCase
{
    use RefreshDatabase;

    protected ExampleService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(ExampleService::class);
    }

    /** @test */
    public function test_get_examples_for_user_returns_only_user_examples()
    {
        // Arrange
        $user = User::factory()->create();
        Example::factory()->count(3)->create(['user_id' => $user->id]);
        Example::factory()->count(2)->create(); // Other users

        // Act
        $examples = $this->service->getExamplesForUser($user);

        // Assert
        $this->assertCount(3, $examples);
    }

    /** @test */
    public function test_create_example_sets_user_id()
    {
        // Arrange
        $user = User::factory()->create();
        $data = ['name' => 'Test'];

        // Act
        $example = $this->service->createExample($user, $data);

        // Assert
        $this->assertEquals($user->id, $example->user_id);
    }
}
```

### 3. Chạy Tests

```bash
# Chạy tất cả
// turbo
php artisan test

# Chạy file cụ thể
// turbo
php artisan test tests/Feature/Api/ExampleTest.php

# Chạy method cụ thể
// turbo
php artisan test --filter=test_user_can_create_example

# Với coverage
php artisan test --coverage
```

---

## Test Assertions Thường Dùng

### HTTP Response
```php
$response->assertOk();              // 200
$response->assertCreated();         // 201
$response->assertNoContent();       // 204
$response->assertUnauthorized();    // 401
$response->assertForbidden();       // 403
$response->assertNotFound();        // 404
$response->assertUnprocessable();   // 422
```

### JSON Response
```php
$response->assertJson(['key' => 'value']);
$response->assertJsonPath('data.name', 'Expected');
$response->assertJsonCount(3, 'data');
$response->assertJsonStructure(['data' => ['id', 'name']]);
$response->assertJsonValidationErrors(['name']);
```

### Database
```php
$this->assertDatabaseHas('table', ['column' => 'value']);
$this->assertDatabaseMissing('table', ['column' => 'value']);
$this->assertDatabaseCount('table', 5);
$this->assertSoftDeleted('table', ['id' => 1]);
```

---

## Mocking

```php
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;

// Mock HTTP
Http::fake([
    'api.external.com/*' => Http::response(['status' => 'ok'], 200),
]);

// Fake Queue
Queue::fake();
// ... code that dispatches job
Queue::assertPushed(MyJob::class);

// Fake Notification
Notification::fake();
$user->notify(new WelcomeNotification());
Notification::assertSentTo($user, WelcomeNotification::class);
```

---

## Checklist

- [ ] Test happy path (success cases)
- [ ] Test validation errors (422)
- [ ] Test authorization (403)
- [ ] Test authentication (401)
- [ ] Test edge cases
- [ ] All tests pass: `php artisan test`

---

## Naming Conventions

```php
// Method name format
test_{action}_{expected_result}

// Examples
test_user_can_create_example()
test_create_fails_with_invalid_data()
test_guest_cannot_access_api()
test_user_cannot_access_others_example()
```

// turbo-all
