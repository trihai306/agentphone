---
trigger: glob
glob: laravel-backend/**/*.php
description: Security best practices for Laravel backend development
---

# SECURITY RULES (MANDATORY)

**BẮT BUỘC**: Mọi code PHẢI tuân thủ các quy tắc bảo mật này.

## 1. AUTHENTICATION & AUTHORIZATION

### 1.1 Authorization Checks

```php
// ✅ LUÔN check quyền trước khi thao tác
public function update(Request $request, Example $example)
{
    // Method 1: Policy (recommended)
    $this->authorize('update', $example);
    
    // Method 2: Manual check
    if ($example->user_id !== $request->user()->id) {
        abort(403);
    }
    
    // ... update logic
}

// ❌ KHÔNG BAO GIỜ bỏ qua authorization
public function delete(Example $example)
{
    $example->delete(); // ❌ NGUY HIỂM - không check quyền
}
```

### 1.2 Authentication Middleware

```php
// ✅ Protected routes
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/devices', [DeviceController::class, 'index']);
});

// ✅ Admin routes
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::resource('/users', AdminUserController::class);
});

// ❌ KHÔNG để routes quan trọng public
Route::get('/user/profile', [ProfileController::class, 'show']); // ❌ NGUY HIỂM
```

## 2. INPUT VALIDATION & SANITIZATION

### 2.1 Always Validate Input

```php
// ✅ Validate BEFORE processing
public function store(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users',
        'description' => 'nullable|string|max:5000',
        'category_id' => 'required|exists:categories,id',
    ]);
    
    return $this->service->create($validated);
}

// ❌ KHÔNG dùng raw input
$name = $request->input('name'); // ❌ Chưa validate
```

### 2.2 SQL Injection Prevention

```php
// ✅ ĐÚNG: Dùng Eloquent/Query Builder
$users = User::where('email', $email)->get();
$users = DB::table('users')->where('email', $email)->get();

// ✅ ĐÚNG: Prepared statements nếu raw query
$users = DB::select('SELECT * FROM users WHERE email = ?', [$email]);

// ❌ SAI: String concatenation
$users = DB::select("SELECT * FROM users WHERE email = '$email'"); // ❌ SQL INJECTION
```

### 2.3 XSS Prevention

```php
// ✅ React/Blade auto-escapes by default
// Trong Blade:
{{ $userInput }}  // ✅ Auto-escaped

// ❌ NGUY HIỂM: Bypass escaping chỉ khi THẬT SỰ cần
{!! $userInput !!}  // ❌ XSS vulnerability nếu không sanitize

// ✅ Nếu cần HTML, sanitize trước:
{!! clean($userInput) !!}  // Dùng HTMLPurifier
```

## 3. CSRF PROTECTION

```php
// ✅ Form submissions - Laravel auto-includes CSRF
@csrf  // Trong Blade forms

// ✅ Inertia.js tự động handle CSRF

// ✅ API routes - Dùng Sanctum tokens thay vì session
Route::middleware('auth:sanctum')->group(function () {
    // ...
});
```

## 4. FILE UPLOAD SECURITY

```php
public function uploadFile(Request $request)
{
    // ✅ Validate file type và size
    $validated = $request->validate([
        'file' => [
            'required',
            'file',
            'max:10240', // 10MB max
            'mimes:jpg,jpeg,png,pdf,doc,docx', // Allowed types
        ],
    ]);
    
    $file = $request->file('file');
    
    // ✅ Generate safe filename
    $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
    
    // ✅ Store outside public directory
    $path = $file->storeAs('uploads', $filename, 'private');
    
    return $path;
}

// ❌ KHÔNG LÀM
$file->move(public_path('uploads'), $request->file('file')->getClientOriginalName()); // ❌
```

## 5. SENSITIVE DATA HANDLING

### 5.1 Environment Variables

```php
// ✅ Sensitive data trong .env
$apiKey = config('services.payment.key'); // Lấy từ config, config đọc từ .env

// ❌ KHÔNG hardcode secrets
$apiKey = 'sk_live_abc123'; // ❌ NGUY HIỂM
```

### 5.2 Logging

```php
// ❌ KHÔNG log sensitive data
Log::info('Payment request', ['card_number' => $cardNumber]); // ❌

// ✅ Mask hoặc exclude sensitive fields
Log::info('Payment request', [
    'user_id' => $userId,
    'amount' => $amount,
    'card_last4' => substr($cardNumber, -4),
]);
```

### 5.3 API Responses

```php
// ❌ KHÔNG trả về sensitive fields
return response()->json($user); // ❌ Có thể leak password hash, tokens

// ✅ Chọn lọc fields hoặc dùng Resource
return response()->json([
    'id' => $user->id,
    'name' => $user->name,
    'email' => $user->email,
]);

// ✅ Hoặc dùng API Resource
return new UserResource($user);
```

## 6. RATE LIMITING

```php
// routes/api.php - Áp dụng rate limiting
Route::middleware(['throttle:api'])->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

// Hoặc custom rate limit cho sensitive actions
Route::middleware(['throttle:5,1'])->group(function () {
    Route::post('/forgot-password', [PasswordController::class, 'sendReset']);
});
```

## 7. MASS ASSIGNMENT PROTECTION

```php
// ✅ Định nghĩa $fillable hoặc $guarded trong Model
class User extends Model
{
    protected $fillable = ['name', 'email', 'password'];
    
    // Hoặc
    protected $guarded = ['id', 'is_admin', 'role'];
}

// ❌ KHÔNG làm
protected $guarded = []; // ❌ Cho phép gán mọi field
```

## 8. SECURE HEADERS (Middleware)

```php
// app/Http/Middleware/SecurityHeaders.php
public function handle($request, Closure $next)
{
    $response = $next($request);
    
    $response->headers->set('X-Content-Type-Options', 'nosniff');
    $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
    $response->headers->set('X-XSS-Protection', '1; mode=block');
    $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return $response;
}
```

## CHECKLIST TRƯỚC KHI DEPLOY

- [ ] Tất cả routes protected đều có auth middleware
- [ ] Tất cả actions đều check authorization
- [ ] Tất cả input được validate
- [ ] Không có hardcoded secrets
- [ ] Không log sensitive data
- [ ] File uploads được validate và stored safely
- [ ] Rate limiting cho auth/sensitive endpoints
- [ ] HTTPS enabled trên production

## KHÔNG LÀM

| ❌ Không làm | ✅ Làm thay thế |
|--------------|-----------------|
| Raw SQL với user input | Eloquent/Query Builder |
| Skip authorization | Luôn check `authorize()` hoặc manual |
| Hardcode API keys | Dùng `.env` |
| Log passwords/tokens | Mask hoặc exclude |
| Trust user input | Validate everything |
| Store files với original name | Generate UUID filename |
