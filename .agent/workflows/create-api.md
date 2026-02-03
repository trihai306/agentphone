---
description: Quy trình tạo API endpoint mới cho Laravel Backend
---

# Quy Trình Tạo API Endpoint

## Kiến Trúc API

```
Request → Route → Controller → Service → Model → Response
                     ↓
               Form Request (validation)
                     ↓
               API Resource (format)
```

---

## Các Bước

### 1. Tạo Route

```php
// routes/api.php
Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('examples', Api\ExampleController::class);
    
    // Hoặc custom routes
    Route::get('/examples/{example}/stats', [Api\ExampleController::class, 'stats']);
    Route::post('/examples/{example}/activate', [Api\ExampleController::class, 'activate']);
});
```

### 2. Tạo Form Request (Validation)

```bash
// turbo
php artisan make:request StoreExampleRequest
```

```php
// app/Http/Requests/StoreExampleRequest.php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreExampleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Hoặc check permission
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'category_id' => 'required|exists:categories,id',
            'status' => 'in:active,inactive',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Tên là bắt buộc',
            'category_id.exists' => 'Danh mục không tồn tại',
        ];
    }
}
```

### 3. Tạo API Resource

```bash
// turbo
php artisan make:resource ExampleResource
```

```php
// app/Http/Resources/ExampleResource.php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ExampleResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'status' => $this->status,
            
            // Relationships
            'category' => $this->whenLoaded('category', fn() => [
                'id' => $this->category->id,
                'name' => $this->category->name,
            ]),
            
            // Counts
            'items_count' => $this->whenCounted('items'),
            
            // Timestamps
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
```

### 4. Tạo Controller

```bash
// turbo
php artisan make:controller Api/ExampleController --api
```

```php
// app/Http/Controllers/Api/ExampleController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExampleRequest;
use App\Http\Requests\UpdateExampleRequest;
use App\Http\Resources\ExampleResource;
use App\Models\Example;
use App\Services\ExampleService;
use Illuminate\Http\Request;

class ExampleController extends Controller
{
    public function __construct(
        protected ExampleService $service
    ) {}

    public function index(Request $request)
    {
        $examples = $this->service->getExamplesForUser(
            $request->user(),
            $request->all()
        );

        return ExampleResource::collection($examples);
    }

    public function store(StoreExampleRequest $request)
    {
        $example = $this->service->createExample(
            $request->user(),
            $request->validated()
        );

        return new ExampleResource($example);
    }

    public function show(Example $example)
    {
        $this->authorize('view', $example);

        return new ExampleResource(
            $example->load(['category', 'items'])
        );
    }

    public function update(UpdateExampleRequest $request, Example $example)
    {
        $this->authorize('update', $example);

        $example = $this->service->updateExample(
            $example,
            $request->validated()
        );

        return new ExampleResource($example);
    }

    public function destroy(Example $example)
    {
        $this->authorize('delete', $example);

        $this->service->deleteExample($example);

        return response()->noContent();
    }
}
```

### 5. Tạo Service (nếu cần)

Xem workflow `/createservice` để tạo Service.

---

## Response Format

### Success
```json
{
    "data": { ... },
    "meta": { "current_page": 1, "total": 50 }
}
```

### Error
```json
{
    "message": "The given data was invalid.",
    "errors": {
        "name": ["The name field is required."]
    }
}
```

---

## HTTP Status Codes

| Code | Khi nào dùng | Method |
|------|--------------|--------|
| 200 | Success | GET, PUT, PATCH |
| 201 | Created | POST |
| 204 | No Content | DELETE |
| 400 | Bad Request | - |
| 401 | Unauthorized | - |
| 403 | Forbidden | - |
| 404 | Not Found | - |
| 422 | Validation Error | - |

---

## Test API

```bash
# List
// turbo
curl -X GET http://localhost:8000/api/examples \
  -H "Authorization: Bearer {token}"

# Create
// turbo
curl -X POST http://localhost:8000/api/examples \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "category_id": 1}'

# Verify routes
// turbo
php artisan route:list --path=api/examples
```

---

## Checklist

- [ ] Route với đúng middleware (`auth:sanctum`)
- [ ] Form Request với validation rules
- [ ] API Resource format response
- [ ] Controller inject Service
- [ ] Authorization với Policy
- [ ] Test với curl hoặc Postman

---

## Tham Khảo

| Pattern | File |
|---------|------|
| Controller | `Api/DeviceController.php` |
| Service | `DeviceService.php` |
| Resource | `DeviceResource.php` |
| FormRequest | `StoreDeviceRequest.php` |

// turbo-all
