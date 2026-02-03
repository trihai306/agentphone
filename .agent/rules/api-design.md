---
trigger: glob
glob: laravel-backend/app/Http/Controllers/Api/**/*.php
description: RESTful API design patterns and response standards
---

# API DESIGN RULES (RESTFUL STANDARD)

**BẮT BUỘC**: Mọi API endpoint PHẢI tuân theo các conventions này.

## 1. URL NAMING CONVENTIONS

```php
// ✅ ĐÚNG: Plural nouns, lowercase, kebab-case
GET    /api/devices              // List all
GET    /api/devices/{id}         // Get single
POST   /api/devices              // Create
PUT    /api/devices/{id}         // Full update
PATCH  /api/devices/{id}         // Partial update
DELETE /api/devices/{id}         // Delete

GET    /api/workflow-jobs        // Kebab-case for multi-word
GET    /api/users/{id}/devices   // Nested resources

// ❌ SAI
GET    /api/getDevices           // ❌ Verb in URL
GET    /api/device               // ❌ Singular
GET    /api/Device               // ❌ PascalCase
GET    /api/device_list          // ❌ Snake_case
POST   /api/createDevice         // ❌ Verb in URL
```

## 2. HTTP STATUS CODES

| Status | When to use | Laravel method |
|--------|-------------|----------------|
| 200 | Success (GET, PUT, PATCH) | `response()->json($data)` |
| 201 | Created (POST) | `response()->json($data, 201)` |
| 204 | No content (DELETE) | `response()->noContent()` |
| 400 | Bad request | `response()->json([...], 400)` |
| 401 | Unauthorized (not logged in) | `response()->json([...], 401)` |
| 403 | Forbidden (no permission) | `abort(403)` |
| 404 | Not found | `abort(404)` |
| 422 | Validation error | Auto by Laravel validation |
| 500 | Server error | Auto by Laravel |

## 3. RESPONSE FORMAT

### 3.1 Success Response

```php
// ✅ Single resource
return response()->json([
    'success' => true,
    'data' => [
        'id' => 1,
        'name' => 'My Device',
        'status' => 'online',
        'created_at' => '2026-01-30T10:00:00Z',
    ],
]);

// ✅ Collection (paginated)
return response()->json([
    'success' => true,
    'data' => [...],
    'meta' => [
        'current_page' => 1,
        'last_page' => 5,
        'per_page' => 15,
        'total' => 75,
    ],
]);

// ✅ Hoặc dùng API Resource (recommended)
return new DeviceResource($device);
return DeviceResource::collection($devices);
```

### 3.2 Error Response

```php
// ✅ Standard error format
return response()->json([
    'success' => false,
    'message' => 'Device not found',
    'error' => [
        'code' => 'DEVICE_NOT_FOUND',
        'details' => null,
    ],
], 404);

// ✅ Validation errors (auto by Laravel)
{
    "message": "The given data was invalid.",
    "errors": {
        "name": ["The name field is required."],
        "email": ["The email must be a valid email address."]
    }
}
```

## 4. API RESOURCE PATTERN

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class DeviceResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'status' => $this->status,
            'is_online' => $this->is_online,
            'last_seen_at' => $this->last_seen_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            
            // Conditional fields
            'user' => $this->whenLoaded('user', fn() => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ]),
            
            // Conditional counts
            'jobs_count' => $this->whenCounted('jobs'),
        ];
    }
}
```

## 5. PAGINATION

```php
// ✅ Controller
public function index(Request $request)
{
    $devices = Device::query()
        ->where('user_id', $request->user()->id)
        ->when($request->search, fn($q, $s) => $q->where('name', 'like', "%$s%"))
        ->when($request->status, fn($q, $s) => $q->where('status', $s))
        ->orderBy($request->sort_by ?? 'created_at', $request->sort_dir ?? 'desc')
        ->paginate($request->per_page ?? 15);

    return DeviceResource::collection($devices);
}

// ✅ Response format
{
    "data": [...],
    "links": {
        "first": "http://example.com/api/devices?page=1",
        "last": "http://example.com/api/devices?page=5",
        "prev": null,
        "next": "http://example.com/api/devices?page=2"
    },
    "meta": {
        "current_page": 1,
        "from": 1,
        "last_page": 5,
        "per_page": 15,
        "to": 15,
        "total": 75
    }
}
```

## 6. FILTERING & SORTING

### Query Parameters

| Param | Purpose | Example |
|-------|---------|---------|
| `search` | Full-text search | `?search=phone` |
| `filter[field]` | Exact match | `?filter[status]=active` |
| `sort_by` | Sort column | `?sort_by=created_at` |
| `sort_dir` | Sort direction | `?sort_dir=desc` |
| `per_page` | Items per page | `?per_page=25` |
| `page` | Page number | `?page=2` |

### Implementation

```php
public function index(Request $request)
{
    $query = Device::query()->where('user_id', $request->user()->id);

    // Search
    if ($search = $request->input('search')) {
        $query->where('name', 'like', "%{$search}%");
    }

    // Filters
    if ($status = $request->input('filter.status')) {
        $query->where('status', $status);
    }

    // Sorting
    $sortBy = $request->input('sort_by', 'created_at');
    $sortDir = $request->input('sort_dir', 'desc');
    $query->orderBy($sortBy, $sortDir);

    return DeviceResource::collection(
        $query->paginate($request->input('per_page', 15))
    );
}
```

## 7. VERSIONING

```php
// routes/api.php
Route::prefix('v1')->group(function () {
    Route::apiResource('devices', Api\V1\DeviceController::class);
});

Route::prefix('v2')->group(function () {
    Route::apiResource('devices', Api\V2\DeviceController::class);
});

// URL: /api/v1/devices, /api/v2/devices
```

## 8. RATE LIMITING

```php
// app/Providers/RouteServiceProvider.php
RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
});

// Specific limits for sensitive endpoints
RateLimiter::for('auth', function (Request $request) {
    return Limit::perMinute(5)->by($request->ip());
});

// routes/api.php
Route::middleware(['throttle:auth'])->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
});
```

## 9. CONTROLLER TEMPLATE

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDeviceRequest;
use App\Http\Requests\UpdateDeviceRequest;
use App\Http\Resources\DeviceResource;
use App\Models\Device;
use App\Services\DeviceService;
use Illuminate\Http\Request;

class DeviceController extends Controller
{
    public function __construct(
        protected DeviceService $deviceService
    ) {}

    public function index(Request $request)
    {
        $devices = $this->deviceService->getDevicesForUser(
            $request->user(),
            $request->all()
        );

        return DeviceResource::collection($devices);
    }

    public function store(StoreDeviceRequest $request)
    {
        $device = $this->deviceService->createDevice(
            $request->user(),
            $request->validated()
        );

        return new DeviceResource($device);
    }

    public function show(Device $device)
    {
        $this->authorize('view', $device);

        return new DeviceResource($device->load(['user', 'jobs']));
    }

    public function update(UpdateDeviceRequest $request, Device $device)
    {
        $this->authorize('update', $device);

        $device = $this->deviceService->updateDevice($device, $request->validated());

        return new DeviceResource($device);
    }

    public function destroy(Device $device)
    {
        $this->authorize('delete', $device);

        $this->deviceService->deleteDevice($device);

        return response()->noContent();
    }
}
```

## 10. KHÔNG LÀM

| ❌ Không làm | ✅ Làm thay thế |
|--------------|-----------------|
| Verbs in URLs (`/getUsers`) | Nouns only (`/users`) |
| Singular URLs (`/user`) | Plural (`/users`) |
| Return raw model | Use API Resource |
| Mixed response formats | Consistent format |
| Hardcode pagination | Accept `per_page` param |
| Return 200 for errors | Use proper status codes |
| Return 500 for validation | Return 422 |
