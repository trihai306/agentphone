---
description: Quy trình tạo page mới cho dự án Laravel + Inertia.js + React (CLICKAI)
---

# Quy Trình Tạo Page Mới

## Tech Stack
- **Backend**: Laravel 11 + Inertia.js
- **Frontend**: React 18 + Tailwind CSS
- **i18n**: react-i18next (vi/en)

## Cấu Trúc Thư Mục
```
laravel-backend/
├── app/Http/Controllers/       # Controllers
├── resources/js/
│   ├── Pages/[Feature]/        # Pages theo feature
│   ├── Components/UI/          # Base components
│   └── Layouts/                # AppLayout, LandingLayout, AuthLayout
└── routes/web.php
```

## Layouts

| Layout | Dùng cho | Middleware |
|--------|----------|------------|
| `AppLayout` | Dashboard, Devices, Flows... | auth |
| `LandingLayout` | Landing, Features, Pricing | none |
| `AuthLayout` | Login, Register | guest |

## Design Tokens

```jsx
const { theme } = useTheme();
const isDark = theme === 'dark';

// Colors
// Page bg: isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'
// Card bg: isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'
// Text:    isDark ? 'text-white' : 'text-gray-900'
// Muted:   isDark ? 'text-gray-500' : 'text-gray-400'
// Border:  isDark ? 'border-[#2a2a2a]' : 'border-gray-100'
```

## UI Patterns

### Page Header
```jsx
<div className="mb-8">
    <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {t('page.title')}
    </h1>
</div>
```

### Card
```jsx
<div className={`p-5 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
```

### Button
```jsx
<button className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark
    ? 'bg-white text-black hover:bg-gray-100'
    : 'bg-gray-900 text-white hover:bg-gray-800'
}`}>
```

## Các Bước Tạo Page

### 1. Controller
```php
// app/Http/Controllers/ExampleController.php
public function index(Request $request)
{
    return Inertia::render('Example/Index', [
        'items' => $request->user()->items()->get(),
    ]);
}
```

### 2. Route
```php
// routes/web.php
Route::middleware(['auth'])->group(function () {
    Route::get('/example', [ExampleController::class, 'index'])->name('example.index');
});
```

### 3. Page Component
```jsx
// resources/js/Pages/Example/Index.jsx
import AppLayout from '@/Layouts/AppLayout';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/Contexts/ThemeContext';

export default function Index({ items }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <AppLayout title={t('example.title')}>
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[1400px] mx-auto px-6 py-6">
                    {/* Content */}
                </div>
            </div>
        </AppLayout>
    );
}
```

### 4. Translations
```json
// lang/vi.json
{ "example": { "title": "Tiêu đề" } }
```

## Checklist
- [ ] Controller trả về `Inertia::render()`
- [ ] Route đúng middleware
- [ ] Dark mode (isDark)
- [ ] `useTranslation()` cho text
- [ ] Responsive design
- [ ] Empty state

## Components Có Sẵn
- `@/Components/UI/`: Button, Card, GlassCard, ConfirmModal, Skeleton
- `@/Components/SeoHead`: SEO cho public pages

## Không Làm
- ❌ Tạo API JSON nếu chỉ cần render (dùng Inertia)
- ❌ Hardcode text (dùng translations)
- ❌ Quên dark mode

## Tham Khảo
- `Pages/Dashboard/Index.jsx` - Full example
- `Pages/Features/Index.jsx` - Public page

// turbo-all
