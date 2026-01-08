# Droidrun Controller - Professional Design System 2025

## 📐 Design Philosophy

**Modern SaaS Excellence** - Inspired by industry leaders like Linear, Vercel, and Stripe, our design system emphasizes:

- **Clarity**: Clean layouts with clear visual hierarchy
- **Efficiency**: Fast, intuitive workflows for power users
- **Elegance**: Refined aesthetics without sacrificing functionality
- **Consistency**: Unified experience across all features

---

## 🎨 Color System

### Brand Colors
- **Primary (Green)**: `#22C55E` - Action, success, online status
- **Secondary (Violet)**: `#8B5CF6` - Premium features, highlights

### Semantic Colors
- **Success**: `#22C55E` - Completed actions, positive feedback
- **Warning**: `#F59E0B` - Caution, requires attention
- **Error**: `#EF4444` - Failures, critical issues
- **Info**: `#3B82F6` - Informational messages

### Background Layers
```
bg_primary (#FAFAFA)    → Main workspace
  ↳ bg_secondary (#FFFFFF)  → Sidebar, elevated cards
    ↳ bg_tertiary (#F4F4F5)   → Nested surfaces
      ↳ bg_card (#FFFFFF)       → Individual cards
```

### Text Hierarchy
- **Primary**: `#09090B` - Main content (near-black)
- **Secondary**: `#52525B` - Supporting text
- **Muted**: `#A1A1AA` - Metadata, timestamps

---

## 📏 Spacing Scale

```python
SPACING = {
    "xxxs": 2,   # Micro adjustments
    "xxs": 4,    # Tight grouping
    "xs": 8,     # Related elements
    "sm": 12,    # Small gap
    "md": 16,    # Default spacing
    "lg": 24,    # Section spacing
    "xl": 32,    # Major sections
    "xxl": 48,   # Page sections
    "xxxl": 64,  # Hero sections
}
```

---

## 🔘 Border Radius

```python
RADIUS = {
    "none": 0,
    "xs": 4,     # Tight elements
    "sm": 6,     # Small buttons
    "md": 8,     # Default buttons
    "lg": 12,    # Cards
    "xl": 16,    # Large cards
    "xxl": 24,   # Headers
    "full": 999, # Pills, avatars
}
```

---

## ✨ Shadows & Elevation

### Shadow Levels
- **XS**: Subtle elevation (inputs, search bars)
- **SM**: Cards, dropdown menus
- **MD**: Modals, popups
- **LG**: Overlays, large modals
- **XL**: Full-screen overlays

```python
SHADOWS = {
    "xs": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    "sm": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
    "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
    "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
    "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
}
```

---

## 🎭 Animation System

### Durations
- **Instant**: 100ms - Micro-interactions
- **Fast**: 200ms - Hover, focus states
- **Normal**: 300ms - Transitions, reveals
- **Slow**: 500ms - Complex animations

### Easing
- **EASE_OUT**: Default for entrances
- **EASE_IN_OUT**: Smooth transitions
- **SPRING**: Playful interactions

---

## 🧩 Component Guidelines

### Buttons

#### Primary Button
```python
ft.Container(
    content=ft.Text("Action", size=14, weight=ft.FontWeight.W_600),
    padding=ft.padding.symmetric(horizontal=16, vertical=10),
    border_radius=RADIUS["md"],
    bgcolor=COLORS["primary"],
    shadow=get_shadow("sm"),
)
```

#### Secondary Button
```python
ft.Container(
    content=ft.Text("Action", size=14, weight=ft.FontWeight.W_600),
    padding=ft.padding.symmetric(horizontal=16, vertical=10),
    border_radius=RADIUS["md"],
    bgcolor=COLORS["bg_secondary"],
    border=ft.border.all(1, COLORS["border"]),
)
```

#### Icon Button
```python
ft.Container(
    content=ft.Icon(icon, size=20, color=COLORS["text_secondary"]),
    width=40,
    height=40,
    border_radius=RADIUS["md"],
    bgcolor=COLORS["bg_hover"],
)
```

### Cards

#### Standard Card
```python
ft.Container(
    content=...,
    padding=SPACING["xl"],
    border_radius=RADIUS["xl"],
    bgcolor=COLORS["bg_card"],
    border=ft.border.all(1, COLORS["border"]),
    shadow=get_shadow("md"),
)
```

#### Interactive Card
- **Hover**: Lift with increased shadow
- **Active**: Scale down slightly (0.98)
- **Selected**: Primary border + glow background

### Input Fields

```python
ft.TextField(
    border_color=COLORS["border"],
    focused_border_color=COLORS["primary"],
    bgcolor=COLORS["bg_input"],
    border_radius=RADIUS["md"],
    content_padding=ft.padding.symmetric(horizontal=14, vertical=12),
    text_size=14,
)
```

---

## 📱 Responsive Breakpoints

```python
BREAKPOINT_SM = 768   # Mobile → Tablet
BREAKPOINT_MD = 1024  # Tablet → Desktop
BREAKPOINT_LG = 1280  # Desktop → Large Desktop
```

### Layout Behavior
- **Mobile (< 768px)**:
  - Bottom navigation
  - Single column layout
  - Collapsed sidebar (hidden)

- **Tablet (768-1024px)**:
  - Icon-only sidebar
  - Dual column layout

- **Desktop (> 1024px)**:
  - Full sidebar with labels
  - Multi-column layouts
  - Rich interactions

---

## 🎯 Component Patterns

### Navigation Item (Sidebar)

**Idle State**:
- Background: Transparent
- Text: Secondary color
- Icon: Outline version

**Hover State**:
- Background: `bg_hover`
- Border: `border_light`
- Transition: 200ms

**Active State**:
- Background: `primary_subtle`
- Text: Primary color (brand)
- Icon: Filled version
- Border: `primary_glow`
- Indicator: 4px vertical bar

### Device Card

**Structure**:
1. Header (status badge + ID)
2. Model name
3. Screenshot preview
4. Status indicator
5. Action bar (4 icons)

**States**:
- **Normal**: Border `border`, Shadow MD
- **Hover**: Lift effect, Shadow LG
- **Selected**: Border `primary`, Glow background

### Modal

**Overlay**:
- Background: `rgba(0,0,0,0.5)`
- Backdrop blur: 4px

**Content**:
- Max width: 600px (default)
- Padding: XXL
- Border radius: XL
- Shadow: XL

---

## 🔤 Typography Guidelines

### Headings
- **H1**: 32px, Bold - Page titles
- **H2**: 28px, Bold - Section headers
- **H3**: 24px, Semibold - Subsections
- **H4**: 20px, Semibold - Card titles

### Body Text
- **Large**: 16px - Important content
- **Medium**: 14px - Default text
- **Small**: 13px - Supporting text
- **Extra Small**: 12px - Metadata

### Labels
- **All caps**: 10px, Semibold, Letter spacing +0.5
- Color: `text_muted`
- Used for section labels

---

## ✅ Accessibility

### Color Contrast
- Text on light backgrounds: Minimum 4.5:1
- Interactive elements: Minimum 3:1
- Use semantic colors consistently

### Focus States
- Visible focus ring: 2px `focus_ring`
- Keyboard navigation support
- Skip links for main content

### Interactive Targets
- Minimum touch target: 44x44px
- Desktop click target: 36x36px
- Adequate spacing between targets

---

## 🚀 Best Practices

### DO
✅ Use design tokens consistently
✅ Follow spacing scale rigorously
✅ Implement smooth transitions
✅ Maintain visual hierarchy
✅ Test responsive layouts

### DON'T
❌ Use arbitrary spacing values
❌ Mix different design patterns
❌ Ignore hover/focus states
❌ Create overly complex layouts
❌ Sacrifice performance for aesthetics

---

## 📚 Component Library

### Core Components
- ✅ **Buttons**: Primary, Secondary, Tertiary, Icon
- ✅ **Cards**: Standard, Interactive, Stat
- ✅ **Inputs**: Text, Search, Select, Checkbox
- ✅ **Navigation**: Sidebar, Bottom Nav, Breadcrumbs
- ✅ **Feedback**: Toast, Modal, Alert
- ✅ **Data Display**: Table, List, Grid
- ✅ **Status**: Badge, Indicator, Progress

### Custom Components
- ✅ **DeviceCard**: Device grid/list items
- ✅ **PhonePreview**: Screenshot with frame
- ✅ **ActionBar**: Quick action buttons
- ✅ **SearchFilter**: Advanced filtering
- ✅ **ViewToggle**: Grid/List switcher
- ✅ **EmptyState**: No data placeholder

---

## 🎨 Design Inspiration

Our design draws inspiration from:
- **Linear**: Clean hierarchy, fluid animations
- **Vercel**: Glassmorphism, subtle gradients
- **Stripe**: Professional spacing, clear CTAs
- **Tailwind UI**: Modern component patterns
- **Shadcn UI**: Accessible, flexible components

---

*Last updated: January 2025*
*Version: 1.0.0*
