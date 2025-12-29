# InertiaJS Architecture - Device Management

## Kiến Trúc InertiaJS (Không Dùng API)

Dự án này sử dụng **InertiaJS** để kết nối Laravel backend với React frontend **KHÔNG THÔNG QUA API**. InertiaJS cho phép bạn xây dựng SPA (Single Page Application) hiện đại mà không cần tạo API riêng.

## 🔄 Luồng Hoạt Động

```
Browser Request
    ↓
Laravel Routes (web.php)
    ↓
Controller (return Inertia::render())
    ↓
InertiaJS Middleware
    ↓
React Component (nhận props)
    ↓
User Interaction
    ↓
Inertia Link/Form (không reload trang)
    ↓
Back to Controller
```

## 📁 Cấu Trúc

### 1. Routes (web.php - KHÔNG PHẢI api.php)

```php
// routes/web.php
Route::middleware(['auth'])->group(function () {
    Route::resource('devices', UserDeviceController::class);
});
```

**Chú ý:**
- ✅ Dùng `middleware(['auth'])` - Session-based authentication
- ❌ KHÔNG dùng `auth:sanctum` - Đó là cho API
- ✅ Routes trong `web.php` - KHÔNG phải `api.php`

### 2. Controller (Return Inertia::render)

```php
// app/Http/Controllers/UserDeviceController.php
use Inertia\Inertia;

public function index(Request $request)
{
    $devices = Device::where('user_id', $request->user()->id)
        ->orderBy('last_active_at', 'desc')
        ->paginate(10);

    // KHÔNG return JSON
    // KHÔNG return response()->json()

    return Inertia::render('Devices/Index', [
        'devices' => $devices,
    ]);
}
```

**Khác biệt với API:**
- ❌ KHÔNG: `return response()->json($devices)`
- ✅ CÓ: `return Inertia::render('Devices/Index', $data)`

### 3. React Components (Nhận Props)

```jsx
// resources/js/Pages/Devices/Index.jsx
export default function Index({ devices }) {
    // devices được truyền trực tiếp từ Controller
    // KHÔNG cần fetch() hoặc axios.get()

    return (
        <AppLayout>
            {devices.data.map(device => (
                <DeviceCard key={device.id} device={device} />
            ))}
        </AppLayout>
    );
}
```

**Khác biệt với API:**
- ❌ KHÔNG cần: `useEffect(() => { fetch('/api/devices') })`
- ✅ Props tự động: `{ devices }` - Nhận từ Controller

### 4. Navigation (Inertia Link)

```jsx
import { Link } from '@inertiajs/react';

// KHÔNG reload trang, InertiaJS xử lý
<Link href="/devices/create">Add Device</Link>

// Form submission
<Link href="/logout" method="post" as="button">
    Logout
</Link>
```

**Khác biệt:**
- ❌ KHÔNG dùng: `<a href="/devices">` - Sẽ reload trang
- ✅ Dùng: `<Link href="/devices">` - SPA navigation

### 5. Form Handling (useForm Hook)

```jsx
import { useForm } from '@inertiajs/react';

const { data, setData, post, errors } = useForm({
    device_id: '',
    name: '',
});

const handleSubmit = (e) => {
    e.preventDefault();
    // KHÔNG cần axios.post() hoặc fetch()
    post('/devices'); // InertiaJS tự xử lý
};
```

**Khác biệt:**
- ❌ KHÔNG: `axios.post('/api/devices', data)`
- ✅ Dùng: `post('/devices')` - InertiaJS form helper

## 🔐 Authentication

```php
// Middleware trong web.php
Route::middleware(['auth'])->group(function () {
    // Session-based authentication
    // Cookie-based
    // CSRF protection tự động
});
```

**Shared Props (Middleware):**

```php
// app/Http/Middleware/HandleInertiaRequests.php
public function share(Request $request): array
{
    return [
        'auth' => [
            'user' => $request->user(), // Tự động có trong mọi component
        ],
        'flash' => [
            'success' => session('success'),
            'error' => session('error'),
        ],
    ];
}
```

**Sử dụng trong React:**

```jsx
import { usePage } from '@inertiajs/react';

function MyComponent() {
    const { auth, flash } = usePage().props;

    return (
        <div>
            <p>Xin chào, {auth.user.name}</p>
            {flash.success && <Alert>{flash.success}</Alert>}
        </div>
    );
}
```

## ⚡ Ưu Điểm So Với API

### Với API (Cách truyền thống):
```
Laravel API (/api/devices)
    ↓
Return JSON
    ↓
React fetch() hoặc axios
    ↓
Parse JSON
    ↓
Render Component
```

**Nhược điểm:**
- Phải tạo API endpoints riêng
- CORS configuration
- API authentication (tokens)
- Duplicate validation logic
- Phải handle loading states
- Phải handle errors manually

### Với InertiaJS (Cách hiện tại):
```
Laravel Controller
    ↓
Return Inertia::render()
    ↓
Props tự động truyền vào React
    ↓
Render Component
```

**Ưu điểm:**
- ✅ Không cần tạo API
- ✅ Không cần CORS
- ✅ Session authentication (như web thông thường)
- ✅ CSRF protection tự động
- ✅ Props truyền trực tiếp
- ✅ Validation errors tự động
- ✅ Flash messages dễ dàng
- ✅ Vẫn có SPA experience (không reload trang)

## 🛠️ Debugging

### Xem Props Được Truyền:

```jsx
export default function MyPage(props) {
    console.log('All props:', props);
    // Xem tất cả data từ Controller

    return <div>...</div>;
}
```

### Xem Inertia Network Requests:

1. Mở DevTools
2. Tab Network
3. Lọc "XHR"
4. Xem requests với header `X-Inertia: true`
5. Response sẽ là JSON chứa component name và props

## 📝 Best Practices

### 1. Pagination
```php
// Controller
$devices = Device::paginate(10);
return Inertia::render('Devices/Index', [
    'devices' => $devices, // InertiaJS tự động serialize paginator
]);
```

```jsx
// React
{devices.links.map(link => (
    <Link href={link.url}>{link.label}</Link>
))}
```

### 2. Flash Messages
```php
// Controller
return redirect()->route('devices.index')
    ->with('success', 'Device created!');
```

```jsx
// React - Tự động có trong usePage().props.flash
const { flash } = usePage().props;
{flash.success && <Alert>{flash.success}</Alert>}
```

### 3. Form Validation
```php
// Controller
$validated = $request->validate([
    'device_id' => 'required|unique:devices',
]);
```

```jsx
// React - Errors tự động có
const { errors } = useForm();
{errors.device_id && <p>{errors.device_id}</p>}
```

## 🚫 Những Gì KHÔNG Làm

1. ❌ KHÔNG tạo API routes trong `routes/api.php`
2. ❌ KHÔNG dùng `return response()->json()`
3. ❌ KHÔNG dùng `axios` hoặc `fetch()` để get data
4. ❌ KHÔNG dùng `auth:sanctum` middleware cho web routes
5. ❌ KHÔNG dùng `<a>` tag - dùng `<Link>` của InertiaJS

## 🎯 Kết Luận

InertiaJS cho phép bạn:
- ✅ Viết code như MPA (Multi-Page App) - dễ hiểu, quen thuộc
- ✅ Nhưng được trải nghiệm của SPA - nhanh, mượt, không reload
- ✅ Không cần API - giảm complexity
- ✅ Dùng session authentication - an toàn hơn cho web app

**Tóm lại: "The best of both worlds"** 🎉
