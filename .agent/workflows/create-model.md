---
description: Quy trình tạo Migration và Model mới cho Laravel
---

# Quy Trình Tạo Migration & Model

## Các Bước

### 1. Tạo Migration + Model

```bash
# Tạo cả Model và Migration
// turbo
php artisan make:model Example -m

# Tạo với Factory và Seeder
// turbo
php artisan make:model Example -mfs
```

### 2. Define Migration

```php
// database/migrations/xxxx_create_examples_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('examples', function (Blueprint $table) {
            $table->id();
            
            // Foreign Keys
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            
            // Strings
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            
            // Numbers
            $table->integer('order')->default(0);
            $table->decimal('price', 10, 2)->default(0);
            
            // Booleans
            $table->boolean('is_active')->default(true);
            
            // Enums (dùng string thay vì enum)
            $table->string('status')->default('draft');
            
            // JSON
            $table->json('metadata')->nullable();
            
            // Dates
            $table->timestamp('published_at')->nullable();
            
            // Timestamps & Soft Deletes
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('status');
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('examples');
    }
};
```

### 3. Define Model

```php
// app/Models/Example.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Example extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'category_id',
        'name',
        'slug',
        'description',
        'order',
        'price',
        'is_active',
        'status',
        'metadata',
        'published_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'price' => 'decimal:2',
        'metadata' => 'array',
        'published_at' => 'datetime',
    ];

    // ========== RELATIONSHIPS ==========

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ExampleItem::class);
    }

    // ========== SCOPES ==========

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForUser($query, User $user)
    {
        return $query->where('user_id', $user->id);
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published')
            ->whereNotNull('published_at');
    }

    // ========== ACCESSORS ==========

    public function getFormattedPriceAttribute(): string
    {
        return number_format($this->price, 0, ',', '.') . ' đ';
    }

    // ========== MUTATORS ==========

    public function setNameAttribute($value): void
    {
        $this->attributes['name'] = $value;
        $this->attributes['slug'] = Str::slug($value);
    }
}
```

### 4. Tạo Factory (Optional)

```php
// database/factories/ExampleFactory.php
<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ExampleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'status' => fake()->randomElement(['draft', 'published']),
            'is_active' => fake()->boolean(80),
            'price' => fake()->randomFloat(2, 10, 1000),
        ];
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'published',
            'published_at' => now(),
        ]);
    }
}
```

### 5. Run Migration

```bash
# Chạy migration
// turbo
php artisan migrate

# Rollback nếu cần
php artisan migrate:rollback

# Fresh database (dev only)
php artisan migrate:fresh --seed
```

---

## Naming Conventions

| Type | Convention | Ví dụ |
|------|------------|-------|
| Table | plural, snake_case | `examples`, `workflow_jobs` |
| Model | singular, PascalCase | `Example`, `WorkflowJob` |
| Foreign Key | singular_id | `user_id`, `category_id` |
| Pivot Table | singular, alphabetical | `category_example` |

---

## Column Types

| Type | Dùng cho | Ví dụ |
|------|----------|-------|
| `id()` | Primary key | - |
| `foreignId()` | Foreign key | `user_id` |
| `string()` | Short text | `name`, `email` |
| `text()` | Long text | `description` |
| `boolean()` | True/False | `is_active` |
| `integer()` | Số nguyên | `count`, `order` |
| `decimal(10,2)` | Tiền tệ | `price`, `amount` |
| `json()` | JSON data | `metadata`, `settings` |
| `timestamp()` | Datetime | `published_at` |
| `timestamps()` | created_at, updated_at | - |
| `softDeletes()` | deleted_at | - |

---

## Checklist

- [ ] Model có `$fillable` đúng columns
- [ ] Model có `$casts` cho non-string types
- [ ] Migration có `up()` và `down()`
- [ ] Foreign keys có constraint và cascade
- [ ] Columns hay query có index
- [ ] Test với `migrate:fresh`

---

## Tham Khảo

| Pattern | File |
|---------|------|
| Migration | `create_devices_table.php` |
| Model | `Device.php` |
| Factory | `DeviceFactory.php` |

// turbo-all
