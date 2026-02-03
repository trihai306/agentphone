---
trigger: glob
glob: laravel-backend/app/**/*.php
description: Controller-Service pattern standard for Laravel backend
---

# CONTROLLER-SERVICE PATTERN (ZEN STANDARD)

**BẮT BUỘC**: Mọi Controller trong dự án PHẢI tuân theo pattern này.

## NGUYÊN TẮC CHÍNH

Controller CHỈ làm **3 việc**:
1. **Validate** input (request validation)
2. **Gọi Service** để xử lý business logic
3. **Trả Response** (Inertia::render hoặc redirect)

## PATTERN CHUẨN

### ✅ Controller Đúng Chuẩn

```php
class ExampleController extends Controller
{
    public function __construct(
        protected ExampleService $exampleService
    ) {}

    public function index(Request $request)
    {
        return Inertia::render('Example/Index', [
            'items' => $this->exampleService->getItemsForUser($request->user()),
            'stats' => $this->exampleService->getStats($request->user()),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $item = $this->exampleService->createItem($request->user(), $validated);

        return redirect()->route('example.show', $item)
            ->with('success', 'Đã tạo thành công!');
    }

    public function show(Example $example)
    {
        $this->authorize('view', $example);
        return Inertia::render('Example/Show', [
            'example' => $this->exampleService->getDetailedItem($example),
        ]);
    }
}
```

### ❌ Controller SAI (Không làm)

```php
// ❌ SAI: Business logic trực tiếp trong Controller
public function store(Request $request)
{
    $validated = $request->validate([...]);
    
    // ❌ Tạo trực tiếp Model
    $item = Example::create([
        'user_id' => $request->user()->id,
        ...$validated,
    ]);
    
    // ❌ Logic attach trong controller
    $item->relations()->attach($validated['relation_ids']);
    
    // ❌ Gọi external API trong controller
    Http::post('https://api.example.com/notify', [...]);
    
    // ❌ Query phức tạp trong controller
    $stats = Example::where('user_id', $request->user()->id)
        ->where('status', 'active')
        ->groupBy('category')
        ->selectRaw('category, count(*) as total')
        ->get();
}
```

## SERVICE PATTERN

### Cấu Trúc Service

```php
<?php

namespace App\Services;

use App\Models\Example;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ExampleService
{
    /**
     * Get paginated items for user
     */
    public function getItemsForUser(User $user, int $perPage = 12): LengthAwarePaginator
    {
        return Example::where('user_id', $user->id)
            ->with(['relation:id,name'])
            ->withCount('subItems')
            ->orderBy('updated_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Get statistics for user
     */
    public function getStats(User $user): array
    {
        return [
            'total' => Example::where('user_id', $user->id)->count(),
            'active' => Example::where('user_id', $user->id)->where('status', 'active')->count(),
        ];
    }

    /**
     * Create new item with relations
     */
    public function createItem(User $user, array $validated): Example
    {
        return DB::transaction(function () use ($user, $validated) {
            $item = Example::create([
                'user_id' => $user->id,
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
            ]);

            if (isset($validated['relation_ids'])) {
                $item->relations()->attach($validated['relation_ids']);
            }

            return $item;
        });
    }
}
```

## KHI NÀO CẦN SERVICE

| Tình huống | Cần Service? |
|------------|--------------|
| Query đơn giản (1 dòng) | ❌ Có thể để trong Controller |
| Query phức tạp (with, withCount, joins) | ✅ Bắt buộc |
| Tạo/Update với relations | ✅ Bắt buộc |
| Cần transaction | ✅ Bắt buộc |
| Logic được dùng ở nhiều nơi | ✅ Bắt buộc |
| Gọi external API/Service | ✅ Bắt buộc |

## NAMING CONVENTIONS

| Type | Convention | Ví dụ |
|------|------------|-------|
| Service Class | `{Model}Service` | `CampaignService`, `DeviceService` |
| Get methods | `get{What}For{Who}` | `getItemsForUser()`, `getStatsForCampaign()` |
| Create methods | `create{What}` | `createItem()`, `createCampaign()` |
| Update methods | `update{What}` | `updateStatus()` |
| Action methods | `{verb}{What}` | `runCampaign()`, `pauseJob()` |

## INJECT SERVICE

```php
// ✅ Constructor Injection (Recommended)
public function __construct(
    protected ExampleService $exampleService,
    protected AnotherService $anotherService
) {}

// ✅ Method Injection (cho specific actions)
public function specialAction(Request $request, SpecialService $service)
{
    return $service->doSomething();
}
```

## AUTHORIZATION

```php
// ✅ Dùng $this->authorize() trong Controller
public function show(Example $example)
{
    $this->authorize('view', $example);
    // ...
}

// ✅ Hoặc check thủ công
public function update(Request $request, Example $example)
{
    if ($example->user_id !== $request->user()->id) {
        abort(403);
    }
    // ...
}
```

## THAM KHẢO

| Pattern | File |
|---------|------|
| Controller chuẩn | `CampaignController.php` |
| Service chuẩn | `CampaignService.php` |
| Service phức tạp | `FlowService.php` |
| Service với API | `AiGenerationService.php` |

