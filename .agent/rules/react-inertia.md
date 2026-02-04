---
trigger: always_on
description: React + Inertia.js patterns for frontend development
---

# REACT + INERTIA.JS PATTERNS

**BẮT BUỘC**: Mọi React Page PHẢI tuân theo patterns này.

## IMPORT ALIAS (BẮT BUỘC cho file mới)

Sử dụng `@/` alias thay vì relative imports:

```jsx
// ✅ ĐÚNG (file mới)
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { Button } from '@/Components/UI';

// ❌ TRÁNH (chỉ OK cho file cũ)
import AppLayout from '../../Layouts/AppLayout';
```

## CORE REQUIREMENTS

Mọi Page React **PHẢI** có:
1. `useTranslation()` - Đa ngôn ngữ
2. `useTheme()` - Dark/Light mode
3. `AppLayout` - Layout wrapper
4. `<Head title={...} />` - SEO

## TEMPLATE PAGE CHUẨN

```jsx
import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';

export default function Index({ items = { data: [] }, stats = {} }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <AppLayout title={t('module.title')}>
            <Head title={t('module.title')} />
            
            <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {t('module.title')}
                        </h1>
                        <Link
                            href="/module/create"
                            className="px-6 py-3 text-sm font-semibold rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                        >
                            {t('module.create')}
                        </Link>
                    </div>

                    {/* Content Grid */}
                    {items.data.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {items.data.map((item) => (
                                <ItemCard key={item.id} item={item} isDark={isDark} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState isDark={isDark} t={t} />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
```

## DESIGN TOKENS

### Colors

```jsx
const isDark = theme === 'dark';

// Page Background
className={isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}

// Card Background
className={isDark ? 'bg-white/5' : 'bg-white'}
className={isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white shadow-lg hover:shadow-xl'}

// Text
className={isDark ? 'text-white' : 'text-gray-900'}      // Primary
className={isDark ? 'text-gray-400' : 'text-gray-600'}   // Secondary
className={isDark ? 'text-gray-500' : 'text-gray-400'}   // Muted

// Borders
className={isDark ? 'border-white/10' : 'border-gray-200'}
```

### Gradients (Hero/Accent)

```jsx
// Purple gradient
'bg-gradient-to-r from-violet-600 to-indigo-600'

// Green gradient
'bg-gradient-to-r from-emerald-600 to-teal-600'

// Pink gradient
'bg-gradient-to-r from-pink-500 to-rose-500'

// Card hover effects
'hover:shadow-xl hover:scale-[1.02] transition-all duration-300'
```

### Buttons

```jsx
// Primary Button
<button className="px-6 py-3 text-sm font-semibold rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 transition-all">
    {t('common.save')}
</button>

// Secondary Button
<button className={`px-5 py-3 text-sm font-medium rounded-2xl ${isDark 
    ? 'bg-white/10 text-white hover:bg-white/20' 
    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'} transition-all`}>
    {t('common.cancel')}
</button>
```

## INERTIA NAVIGATION

```jsx
import { router } from '@inertiajs/react';

// Navigate with filters
router.get('/items', {
    search: query,
    category: category !== 'all' ? category : undefined,
    page: 1,
}, { preserveState: true });

// Form submit
const handleSubmit = (e) => {
    e.preventDefault();
    router.post('/items', formData);
};

// Delete with confirmation
const handleDelete = (id) => {
    if (confirm(t('common.confirm_delete'))) {
        router.delete(`/items/${id}`);
    }
};
```

## LAYOUTS

| Layout | Dùng cho | Middleware |
|--------|----------|------------|
| `AppLayout` | Dashboard, Devices, Flows... | auth |
| `LandingLayout` | Landing, Features, Pricing | none |
| `AuthLayout` | Login, Register | guest |

```jsx
// AppLayout với title
<AppLayout title={t('dashboard.title')}>
    {/* content */}
</AppLayout>

// LandingLayout cho public pages
<LandingLayout>
    <SeoHead title="Features" description="..." />
    {/* content */}
</LandingLayout>
```

## COMPONENTS CÓ SẴN

```jsx
// UI Components
import { Button, Card, GlassCard, ConfirmModal, Skeleton } from '@/Components/UI';

// SEO cho public pages
import SeoHead from '@/Components/SeoHead';

// Language switcher
import LanguageSwitcher from '@/Components/LanguageSwitcher';

// Error Boundary (đã được wrap trong app.jsx)
import ErrorBoundary from '@/Components/ErrorBoundary';
```

## HOOKS CÓ SẴN

```jsx
// Page loading state (track Inertia navigation)
import { usePageLoading, usePageProgress } from '@/hooks/usePageLoading';

// Usage
const loading = usePageLoading(); // true when navigating
const { loading, progress } = usePageProgress(); // with percentage

// Notifications (realtime)
import useNotifications from '@/hooks/useNotifications';

// Device management
import useDeviceManager from '@/hooks/useDeviceManager';

// Wallet updates (realtime balance)
import useWalletUpdates from '@/hooks/useWalletUpdates';
```

## KHÔNG LÀM

- ❌ Hardcode text (dùng `t()` từ useTranslation)
- ❌ Quên dark mode support
- ❌ Tạo API JSON endpoint khi chỉ cần Inertia props
- ❌ Inline styles (dùng Tailwind classes)
- ❌ Quên Empty State khi data rỗng
- ❌ Responsive breakpoints: luôn dùng `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

## THAM KHẢO

| Pattern | File |
|---------|------|
| Full page example | `Pages/Tasks/Index.jsx` |
| Dashboard | `Pages/Dashboard/Index.jsx` |
| Form page | `Pages/Campaigns/Create.jsx` |
| Detail page | `Pages/Flows/Show.jsx` |
| Public page | `Pages/Features/Index.jsx` |