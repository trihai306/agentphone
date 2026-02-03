---
trigger: glob
glob: laravel-backend/database/**/*.php
description: Database design patterns and best practices
---

# DATABASE DESIGN RULES

**BẮT BUỘC**: Mọi database changes PHẢI tuân theo các quy tắc này.

## 1. MIGRATION NAMING

```bash
# ✅ ĐÚNG: Mô tả rõ action
php artisan make:migration create_devices_table
php artisan make:migration add_status_to_devices_table
php artisan make:migration create_device_user_pivot_table
php artisan make:migration drop_legacy_column_from_users_table

# ❌ SAI
php artisan make:migration update_table        # ❌ Không rõ ràng
php artisan make:migration fix                 # ❌ Quá chung chung
php artisan make:migration changes             # ❌ Không specific
```

## 2. TABLE NAMING CONVENTIONS

| Type | Convention | Example |
|------|------------|---------|
| Tables | Plural, snake_case | `users`, `workflow_jobs` |
| Pivot tables | Singular, alphabetical | `device_user`, `campaign_workflow` |
| Foreign keys | Singular model + `_id` | `user_id`, `device_id` |
| Timestamps | `*_at` | `created_at`, `verified_at` |
| Booleans | `is_*` or `has_*` | `is_active`, `has_verified` |

## 3. COLUMN TYPES

```php
// ✅ Chọn đúng type
Schema::create('devices', function (Blueprint $table) {
    $table->id();                              // BIGINT UNSIGNED AUTO_INCREMENT
    $table->uuid('uuid')->unique();            // UUID cho external reference
    $table->foreignId('user_id')->constrained(); // FK với constraint
    
    // Strings
    $table->string('name');                    // VARCHAR(255)
    $table->string('code', 50);                // VARCHAR(50)
    $table->text('description');               // TEXT (long content)
    $table->longText('content');               // LONGTEXT (very long)
    
    // Numbers
    $table->integer('count');                  // INT
    $table->unsignedInteger('order');          // UNSIGNED INT
    $table->decimal('price', 10, 2);           // DECIMAL(10,2)
    $table->float('percentage');               // FLOAT
    
    // Booleans
    $table->boolean('is_active')->default(true);
    
    // Dates
    $table->timestamp('verified_at')->nullable();
    $table->date('birth_date');
    $table->dateTime('scheduled_at');
    
    // JSON
    $table->json('metadata')->nullable();
    
    // Enums (dùng string thay vì enum để flexibility)
    $table->string('status')->default('pending');
    
    $table->timestamps();                       // created_at, updated_at
    $table->softDeletes();                      // deleted_at
});
```

## 4. INDEXES

```php
Schema::create('workflow_jobs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('workflow_id')->constrained()->cascadeOnDelete();
    $table->foreignId('device_id')->nullable()->constrained()->nullOnDelete();
    $table->string('status');
    $table->timestamp('scheduled_at')->nullable();
    $table->timestamps();

    // ✅ Index cho columns hay query
    $table->index('status');                           // Single column
    $table->index(['user_id', 'status']);              // Composite
    $table->index(['status', 'scheduled_at']);         // Cho filtering + sorting
});

// ✅ Khi nào cần index:
// - Foreign keys (tự động khi dùng foreignId)
// - Columns trong WHERE clauses
// - Columns trong ORDER BY
// - Columns trong JOIN conditions
// - Columns có cardinality cao (nhiều unique values)

// ❌ Không cần index:
// - Boolean columns với ít variation
// - Columns ít khi query
// - Tables nhỏ (< 1000 rows)
```

## 5. FOREIGN KEY CONSTRAINTS

```php
// ✅ Định nghĩa rõ ràng cascade behavior
$table->foreignId('user_id')
    ->constrained()
    ->cascadeOnDelete();     // Xóa user → xóa devices

$table->foreignId('category_id')
    ->constrained()
    ->nullOnDelete();        // Xóa category → set null

$table->foreignId('parent_id')
    ->nullable()
    ->constrained('categories')
    ->cascadeOnDelete();     // Self-referencing

// ❌ KHÔNG để dangling references
$table->unsignedBigInteger('user_id'); // ❌ Không có constraint
```

## 6. SOFT DELETES

```php
// Migration
Schema::create('campaigns', function (Blueprint $table) {
    $table->id();
    // ...
    $table->softDeletes();  // Adds deleted_at column
});

// Model
class Campaign extends Model
{
    use SoftDeletes;
}

// ✅ Khi nào dùng soft deletes:
// - Cần audit trail
// - Data có thể restore
// - Related data vẫn reference được

// ❌ Khi nào KHÔNG dùng:
// - Logs, temporary data
// - Privacy concerns (GDPR - cần hard delete)
```

## 7. MIGRATION BEST PRACTICES

### 7.1 Safe Migrations

```php
// ✅ ĐÚNG: Có cả up và down
public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->string('phone')->nullable()->after('email');
    });
}

public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn('phone');
    });
}
```

### 7.2 Data Migrations

```php
// ✅ Cho migrations có data transformation
public function up(): void
{
    // Step 1: Add new column
    Schema::table('users', function (Blueprint $table) {
        $table->string('full_name')->nullable();
    });

    // Step 2: Migrate data
    DB::statement("UPDATE users SET full_name = CONCAT(first_name, ' ', last_name)");

    // Step 3: Make non-nullable (sau khi có data)
    Schema::table('users', function (Blueprint $table) {
        $table->string('full_name')->nullable(false)->change();
    });
}
```

### 7.3 Large Table Migrations

```php
// ✅ Cho tables lớn, thêm index riêng biệt
// Migration 1: Add column
public function up(): void
{
    Schema::table('logs', function (Blueprint $table) {
        $table->string('level')->nullable();
    });
}

// Migration 2: Backfill data (có thể chạy riêng, không lock table lâu)
// Migration 3: Add index
public function up(): void
{
    Schema::table('logs', function (Blueprint $table) {
        $table->index('level');
    });
}
```

## 8. MODEL DEFINITIONS

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Device extends Model
{
    use SoftDeletes;

    // ✅ Khai báo rõ fillable
    protected $fillable = [
        'user_id',
        'name',
        'device_id',
        'status',
        'metadata',
    ];

    // ✅ Casts cho non-string types
    protected $casts = [
        'metadata' => 'array',
        'is_online' => 'boolean',
        'last_seen_at' => 'datetime',
    ];

    // ✅ Relationships với return type
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function jobs(): HasMany
    {
        return $this->hasMany(WorkflowJob::class);
    }

    // ✅ Local scopes cho common queries
    public function scopeOnline($query)
    {
        return $query->where('is_online', true);
    }

    public function scopeForUser($query, User $user)
    {
        return $query->where('user_id', $user->id);
    }
}
```

## 9. SEEDING

```php
// database/seeders/DatabaseSeeder.php
public function run(): void
{
    // ✅ Order matters - parent before child
    $this->call([
        RoleSeeder::class,
        UserSeeder::class,
        CategorySeeder::class,
        DeviceSeeder::class,
    ]);
}

// ✅ Factory-based seeding
class DeviceSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();

        $users->each(function ($user) {
            Device::factory()
                ->count(rand(2, 5))
                ->create(['user_id' => $user->id]);
        });
    }
}
```

## 10. COMMANDS

```bash
# Run migrations
php artisan migrate

# Rollback last batch
php artisan migrate:rollback

# Fresh database (drop all + migrate)
php artisan migrate:fresh

# Fresh + seed
php artisan migrate:fresh --seed

# Check migration status
php artisan migrate:status

# Create migration
php artisan make:migration add_phone_to_users_table
```

## CHECKLIST TRƯỚC KHI COMMIT MIGRATION

- [ ] Tên migration mô tả rõ action
- [ ] Có cả `up()` và `down()` methods
- [ ] Foreign keys có constraint và cascade behavior
- [ ] Columns hay query được index
- [ ] Nullable columns được đánh dấu `nullable()`
- [ ] Default values hợp lý
- [ ] Tested locally với `migrate:fresh --seed`

## KHÔNG LÀM

| ❌ Không làm | ✅ Làm thay thế |
|--------------|-----------------|
| Edit existing migration | Create new migration |
| `$guarded = []` | Explicit `$fillable` |
| Enum columns | String with constants |
| Skip down() method | Always implement down() |
| Index everything | Index only queried columns |
| Raw SQL everywhere | Use Query Builder/Eloquent |
