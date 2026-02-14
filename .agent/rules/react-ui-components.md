---
description: BẮT BUỘC sử dụng UI Components từ @/Components/UI khi code React
globs: ["**/*.jsx", "**/*.tsx"]
---

# REACT UI COMPONENTS RULE (MANDATORY)

**BẮT BUỘC**: Mọi React code PHẢI sử dụng UI Components từ `@/Components/UI` thay vì tự viết HTML/JSX thủ công.

## Import Pattern

```jsx
// ✅ ĐÚNG: Import từ @/Components/UI
import { Button, Card, Input, Modal, Badge } from '@/Components/UI';

// ❌ SAI: Tự viết button/card/input thủ công
<button className="px-4 py-2 bg-blue-500...">Submit</button>
<div className="rounded-lg border p-4...">Card content</div>
<input className="border rounded px-3..." />
```

## Available Components

### Layout & Container
| Component | Import | Thay thế cho |
|-----------|--------|--------------|
| `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` | `@/Components/UI` | `<div>` wrapper cards |
| `GlassCard`, `GlassCardHeader`, `GlassCardStat` | `@/Components/UI` | Glassmorphism cards |
| `PageHeader` | `@/Components/UI` | Page title sections |
| `SectionHeader`, `SectionTitle` | `@/Components/UI` | Section dividers |
| `Divider`, `VerticalDivider` | `@/Components/UI` | `<hr>` elements |

### Form Controls
| Component | Import | Thay thế cho |
|-----------|--------|--------------|
| `Button` | `@/Components/UI` | `<button>` elements |
| `Input`, `SearchInput` | `@/Components/UI` | `<input>` elements |
| `Select` | `@/Components/UI` | `<select>` elements |
| `Textarea` | `@/Components/UI` | `<textarea>` elements |
| `Checkbox` | `@/Components/UI` | `<input type="checkbox">` |
| `Switch` | `@/Components/UI` | Toggle switches |

### Feedback & Display
| Component | Import | Thay thế cho |
|-----------|--------|--------------|
| `Badge`, `StatusBadge` | `@/Components/UI` | Status labels/tags |
| `Alert` | `@/Components/UI` | Alert/notice banners |
| `Tooltip` | `@/Components/UI` | Title attributes |
| `EmptyState`, `EmptyStateCard` | `@/Components/UI` | Empty data placeholders |
| `Skeleton`, `SkeletonCard`, `SkeletonTable` | `@/Components/UI` | Loading states |

### Overlay & Navigation
| Component | Import | Thay thế cho |
|-----------|--------|--------------|
| `Modal`, `ModalFooter` | `@/Components/UI` | Custom modals/dialogs |
| `ConfirmModal`, `useConfirm` | `@/Components/UI` | `window.confirm()` |
| `Dropdown`, `DropdownTrigger` | `@/Components/UI` | Custom dropdown menus |
| `Tabs`, `TabPanel` | `@/Components/UI` | Tab navigation |

### Data Display
| Component | Import | Thay thế cho |
|-----------|--------|--------------|
| `Table`, `TableCell`, `TableHeader` | `@/Components/UI` | `<table>` elements |
| `DataList`, `DataListCard` | `@/Components/UI` | Definition lists |
| `Avatar`, `AvatarGroup` | `@/Components/UI` | User avatar images |
| `StatCardPremium`, `StatCardCompact` | `@/Components/UI` | Stats/metrics cards |
| `ActionCard`, `ActionCardGrid` | `@/Components/UI` | Clickable action cards |
| `MiniChart`, `TrendIndicator` | `@/Components/UI` | Inline charts |

## Rules

### 1. LUÔN dùng UI Component khi có sẵn

```jsx
// ✅ ĐÚNG
<Button variant="primary" onClick={handleSave}>{t('common.save')}</Button>
<Input label={t('form.name')} value={name} onChange={setName} />
<Card><CardContent>...</CardContent></Card>
<Modal open={showModal} onClose={() => setShowModal(false)}>...</Modal>
<Badge variant="success">Active</Badge>

// ❌ SAI: Tự viết HTML thủ công khi đã có component
<button className="px-6 py-3 rounded-2xl bg-gradient-to-r...">Save</button>
<input className="w-full border rounded-lg px-4 py-2..." />
<div className="bg-white rounded-xl shadow-lg p-6...">...</div>
```

### 2. KHÔNG tạo component trùng chức năng

```jsx
// ❌ SAI: Tạo CustomButton, MyCard, StyledInput...
const CustomButton = ({ children, ...props }) => (
    <button className="px-4 py-2 rounded bg-blue-500...">{children}</button>
);

// ✅ ĐÚNG: Dùng Button từ UI với variant/props
<Button variant="primary" size="lg">Submit</Button>
<Button variant="secondary" size="sm">Cancel</Button>
<Button variant="danger" onClick={handleDelete}>Delete</Button>
```

### 3. Confirm dialogs PHẢI dùng ConfirmModal

```jsx
// ❌ SAI
if (window.confirm('Are you sure?')) { ... }

// ✅ ĐÚNG
const { confirm } = useConfirm();
const handleDelete = async () => {
    const ok = await confirm({ title: t('common.confirm'), message: t('common.confirm_delete') });
    if (ok) router.delete(`/items/${id}`);
};
```

### 4. Loading states PHẢI dùng Skeleton

```jsx
// ❌ SAI
{loading && <div>Loading...</div>}

// ✅ ĐÚNG
{loading ? <SkeletonCard count={3} /> : <ActualContent />}
```

### 5. Empty states PHẢI dùng EmptyState

```jsx
// ❌ SAI
{items.length === 0 && <p>No items found</p>}

// ✅ ĐÚNG
{items.length === 0 && <EmptyState title={t('common.no_data')} icon="search" />}
```

## Khi nào ĐƯỢC viết HTML thủ công

- Layout wrappers (`<div className="flex...">`) cho positioning/spacing
- Unique one-off UI không map với bất kỳ component nào
- Complex custom visualizations (charts, editors, canvas)
- Third-party library wrappers

## KHÔNG LÀM

| ❌ Không làm | ✅ Làm thay thế |
|--------------|-----------------|
| `<button className="...">` | `<Button variant="...">` |
| `<input className="...">` | `<Input label="..." />` |
| `<select className="...">` | `<Select options={...} />` |
| `window.confirm()` | `useConfirm()` |
| Custom loading spinners | `<Skeleton />` |
| Custom empty placeholders | `<EmptyState />` |
| Custom modal divs | `<Modal />` |
| `<table className="...">` | `<Table />` |
