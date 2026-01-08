# Component Usage Guide

## Professional UI Components Library

This guide shows how to use the new professional components in your views.

---

## 🎯 Buttons

### Import
```python
from app.components.common import Button, IconButton, ButtonVariant, ButtonSize
```

### Primary Button
```python
Button(
    text="Save Changes",
    variant=ButtonVariant.PRIMARY,
    size=ButtonSize.MEDIUM,
    on_click=handle_save,
)
```

### Secondary Button
```python
Button(
    text="Cancel",
    variant=ButtonVariant.SECONDARY,
    size=ButtonSize.MEDIUM,
    on_click=handle_cancel,
)
```

### Button with Icon
```python
Button(
    text="New Device",
    variant=ButtonVariant.PRIMARY,
    icon=ft.Icons.ADD,
    on_click=handle_new_device,
)
```

### Loading Button
```python
# Create button
save_btn = Button(
    text="Save",
    variant=ButtonVariant.PRIMARY,
)

# Set loading state
save_btn.set_loading(True)  # Shows spinner
# ... after async operation
save_btn.set_loading(False)  # Back to normal
```

### Icon Button
```python
IconButton(
    icon=ft.Icons.CLOSE,
    size=ButtonSize.MEDIUM,
    on_click=handle_close,
    tooltip="Close",
)
```

### Button Sizes
```python
# Small (for compact UIs)
Button(text="Small", size=ButtonSize.SMALL)

# Medium (default)
Button(text="Medium", size=ButtonSize.MEDIUM)

# Large (for CTAs)
Button(text="Large", size=ButtonSize.LARGE)
```

---

## 📦 Cards

### Import
```python
from app.components.common import Card, StatCard, InfoCard, AlertCard, ListItemCard
```

### Basic Card
```python
Card(
    content=ft.Column([
        ft.Text("Card Title", size=18, weight=ft.FontWeight.BOLD),
        ft.Text("Card content goes here"),
    ]),
    hoverable=True,
    on_click=handle_click,
)
```

### Stat Card
```python
StatCard(
    value="1,234",
    label="Total Devices",
    description="+12% from last month",
    icon=ft.Icons.DEVICES,
    trend="up",  # "up", "down", "neutral"
)
```

### Info Card
```python
InfoCard(
    title="System Status",
    subtitle="Last updated 5 minutes ago",
    content=ft.Column([
        ft.Text("All systems operational"),
        ft.Text("24 devices online"),
    ]),
    actions=[
        IconButton(
            icon=ft.Icons.REFRESH,
            on_click=handle_refresh,
        ),
    ],
)
```

### Alert Card
```python
AlertCard(
    severity="warning",  # "info", "success", "warning", "error"
    title="Low Battery",
    message="Device battery is below 20%",
    dismissible=True,
    on_dismiss=handle_dismiss,
)
```

### List Item Card
```python
ListItemCard(
    leading=ft.Icon(ft.Icons.SMARTPHONE, size=32),
    title="Galaxy S21",
    subtitle="Online • Last seen 2 mins ago",
    trailing=StatusBadge("Online"),
    on_click=handle_device_click,
)
```

---

## ⏳ Skeleton Loaders

### Import
```python
from app.components.common import (
    Skeleton,
    SkeletonText,
    SkeletonCard,
    SkeletonDeviceCard,
    SkeletonGrid,
    with_skeleton,
)
```

### Basic Skeleton
```python
Skeleton(width=200, height=20)  # Rectangle
Skeleton(width=40, height=40, circle=True)  # Circle (avatar)
```

### Skeleton Text
```python
SkeletonText(lines=3)  # 3 lines of loading text
```

### Skeleton Card
```python
SkeletonCard()  # Full card placeholder
```

### Skeleton Device Card
```python
SkeletonDeviceCard()  # Matches device card layout
```

### Skeleton Grid
```python
SkeletonGrid(items=6)  # Shows 6 skeleton cards
```

### Using with_skeleton Helper
```python
# In your view
is_loading = True
actual_content = ft.Text("Loaded data")

# Show skeleton while loading, content when done
with_skeleton(
    loading=is_loading,
    content=actual_content,
    skeleton=SkeletonCard(),
)
```

---

## 🎨 Complete Example: Dashboard View

```python
import flet as ft
from app.components.common import (
    Button, IconButton, ButtonVariant, ButtonSize,
    Card, StatCard, InfoCard,
    SkeletonGrid, with_skeleton,
)
from app.theme import SPACING

class DashboardView(ft.Container):
    def __init__(self, app_state, toast):
        self.app_state = app_state
        self.toast = toast
        self.loading = True
        self.devices = []

        super().__init__(
            content=self._build_content(),
            expand=True,
        )

    def _build_content(self):
        return ft.Column([
            self._build_header(),
            ft.Container(height=SPACING["xl"]),
            self._build_stats(),
            ft.Container(height=SPACING["xl"]),
            self._build_devices(),
        ])

    def _build_header(self):
        return ft.Row([
            ft.Text(
                "Dashboard",
                size=32,
                weight=ft.FontWeight.BOLD,
            ),
            ft.Container(expand=True),
            Button(
                text="Scan Devices",
                variant=ButtonVariant.PRIMARY,
                icon=ft.Icons.RADAR,
                on_click=self._on_scan,
            ),
        ])

    def _build_stats(self):
        return ft.Row([
            StatCard(
                value=str(len(self.devices)),
                label="Total Devices",
                icon=ft.Icons.DEVICES,
                expand=True,
            ),
            StatCard(
                value=str(self._count_online()),
                label="Online",
                icon=ft.Icons.WIFI,
                trend="up",
                expand=True,
            ),
            StatCard(
                value=str(self._count_running()),
                label="Running Jobs",
                icon=ft.Icons.PLAY_CIRCLE,
                expand=True,
            ),
        ], spacing=SPACING["lg"])

    def _build_devices(self):
        return with_skeleton(
            loading=self.loading,
            content=self._build_device_grid(),
            skeleton=SkeletonGrid(items=6),
        )

    def _build_device_grid(self):
        # Your actual device grid
        return ft.Text("Device grid here")

    async def load_devices(self):
        self.loading = True
        self.update()

        # Load from backend
        await asyncio.sleep(1)  # Simulate loading

        self.loading = False
        self.update()
```

---

## 💡 Best Practices

### 1. **Use Consistent Button Variants**
- **PRIMARY**: Main actions (Save, Submit, Create)
- **SECONDARY**: Secondary actions (Cancel, Close, Back)
- **DANGER**: Destructive actions (Delete, Remove)
- **GHOST**: Subtle actions (View, Edit)

### 2. **Show Loading States**
```python
async def handle_save(e):
    save_btn.set_loading(True)
    try:
        await save_data()
        toast.success("Saved!")
    finally:
        save_btn.set_loading(False)
```

### 3. **Always Use Skeletons for Async Content**
```python
# DON'T: Blank screen while loading
if not loading:
    return actual_content

# DO: Show skeleton while loading
return with_skeleton(
    loading=loading,
    content=actual_content,
    skeleton=SkeletonCard(),
)
```

### 4. **Use Stat Cards for Metrics**
Dashboard metrics should use StatCard for consistency:
```python
ft.Row([
    StatCard(value="42", label="Devices"),
    StatCard(value="12", label="Online", trend="up"),
    StatCard(value="5", label="Jobs", trend="down"),
])
```

### 5. **Alert Cards for Notifications**
Use AlertCard instead of plain text for important messages:
```python
AlertCard(
    severity="error",
    title="Connection Lost",
    message="Unable to connect to device",
)
```

---

## 🔧 Customization

### Custom Button Style
```python
Button(
    text="Custom",
    variant=ButtonVariant.PRIMARY,
    # Override defaults
    padding=ft.padding.all(20),
    border_radius=RADIUS["lg"],
)
```

### Custom Card
```python
Card(
    content=my_content,
    elevation="xl",  # Extra large shadow
    padding=SPACING["xxl"],  # Extra padding
)
```

---

## ⚠️ Common Mistakes

### ❌ Don't Mix Old and New Components
```python
# BAD: Mixing old ft.Container with new components
ft.Container(
    content=ft.Text("Old style"),
    padding=10,  # Arbitrary number
    bgcolor="#FFFFFF",  # Hardcoded color
)

# GOOD: Use new Card component
Card(
    content=ft.Text("New style"),
    padding=SPACING["lg"],  # Design token
)
```

### ❌ Don't Hardcode Colors
```python
# BAD
ft.Container(bgcolor="#22C55E")

# GOOD
from app.theme import get_colors
colors = get_colors()
ft.Container(bgcolor=colors["primary"])
```

### ❌ Don't Skip Loading States
```python
# BAD: No loading feedback
async def load_data():
    data = await fetch_data()
    show_data(data)

# GOOD: Show skeleton while loading
async def load_data():
    self.loading = True
    self.update()
    data = await fetch_data()
    self.loading = False
    show_data(data)
```

---

**Last Updated**: January 2026
**Version**: 1.0.0
