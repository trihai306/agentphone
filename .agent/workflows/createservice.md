---
description: Quy trình tạo Service mới cho dự án Laravel (CLICKAI Backend)
---

# Quy Trình Tạo Service

## Khi Nào Cần Service

✅ Cần tạo Service khi:
- Logic phức tạp (>10 dòng code)
- Cần database transaction
- Tái sử dụng ở nhiều controllers
- Gọi external API
- Query phức tạp (joins, with, withCount)

❌ Không cần Service khi:
- Query đơn giản 1-2 dòng
- CRUD cơ bản không có logic phụ

---

## Các Bước

### 1. Tạo File Service

```bash
# turbo
touch app/Services/{ModelName}Service.php
```

### 2. Template Service

```php
<?php

namespace App\Services;

use App\Models\{ModelName};
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class {ModelName}Service
{
    /**
     * Get paginated items for user
     */
    public function getItemsForUser(User $user, int $perPage = 12): LengthAwarePaginator
    {
        return {ModelName}::where('user_id', $user->id)
            ->with(['relation:id,name'])
            ->withCount('subItems')
            ->orderBy('updated_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Get stats for user
     */
    public function getStats(User $user): array
    {
        return [
            'total' => {ModelName}::where('user_id', $user->id)->count(),
            'active' => {ModelName}::where('user_id', $user->id)
                ->where('status', 'active')->count(),
        ];
    }

    /**
     * Create new item
     */
    public function createItem(User $user, array $validated): {ModelName}
    {
        return DB::transaction(function () use ($user, $validated) {
            $item = {ModelName}::create([
                'user_id' => $user->id,
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
            ]);

            // Attach relations if needed
            if (isset($validated['relation_ids'])) {
                $item->relations()->attach($validated['relation_ids']);
            }

            return $item;
        });
    }

    /**
     * Get detailed item with relations
     */
    public function getDetailedItem({ModelName} $item): {ModelName}
    {
        return $item->load(['relation', 'subItems']);
    }
}
```

### 3. Inject vào Controller

```php
<?php

namespace App\Http\Controllers;

use App\Services\{ModelName}Service;
use Illuminate\Http\Request;
use Inertia\Inertia;

class {ModelName}Controller extends Controller
{
    public function __construct(
        protected {ModelName}Service $service
    ) {}

    public function index(Request $request)
    {
        return Inertia::render('{ModelName}/Index', [
            'items' => $this->service->getItemsForUser($request->user()),
            'stats' => $this->service->getStats($request->user()),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            // ...
        ]);

        $item = $this->service->createItem($request->user(), $validated);

        return redirect()->route('{model}.show', $item)
            ->with('success', 'Đã tạo thành công!');
    }
}
```

---

## Naming Conventions

| Type | Convention | Ví dụ |
|------|------------|-------|
| File | `{Model}Service.php` | `CampaignService.php` |
| Get methods | `get{What}For{Who}` | `getItemsForUser()` |
| Create methods | `create{What}` | `createCampaign()` |
| Action methods | `{verb}{What}` | `runCampaign()` |

---

## Checklist

- [ ] File đặt trong `app/Services/`
- [ ] Namespace đúng `App\Services`
- [ ] Inject vào Controller qua constructor
- [ ] Methods trả về kiểu dữ liệu rõ ràng (type hints)
- [ ] Dùng `DB::transaction()` cho multi-table operations
- [ ] DocBlocks cho public methods

---

## Tham Khảo

| Pattern | File |
|---------|------|
| Service chuẩn | `CampaignService.php` |
| Service phức tạp | `FlowService.php` |
| Service với API | `AiGenerationService.php` |
| Service với cache | `DataCollectionCacheService.php` |

// turbo-all
