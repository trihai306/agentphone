"""Reusable UI components for Droidrun Controller.

Bootstrap-style component library providing consistent, accessible, and beautiful
UI components across the application.

Categories:
- Buttons: ActionButton, IconButton, FloatingActionButton, ToggleButton
- Cards: Card, StatsCard, GlassCard, ListCard
- Inputs: TextField, SearchInput, PasswordInput
- Modals: Modal, ConfirmDialog, InfoDialog
- Feedback: ToastManager, EmptyState, StatusBadge
- Data: DataTable, SearchFilter, ViewToggle

Example:
    from app.components import Button, Card, TextField, ActionButton
    
    # Create components
    btn = ActionButton("Submit", variant="primary")
    card = Card(title="Settings", content=form)
    input = TextField(label="Email", prefix_icon=ft.Icons.EMAIL)
"""

# Cards
from .card import Card, StatsCard, GlassCard, ListCard

# Extended Cards (from common)
from .common.cards import (
    Card as BaseCard,
    StatCard,
    InfoCard,
    AlertCard,
    ListItemCard,
)

# Buttons
from .action_button import ActionButton, IconButton, FloatingActionButton, ToggleButton

# Extended Buttons (from common)
from .common.button import (
    Button,
    IconButton as StyledIconButton,
    ButtonVariant,
    ButtonSize,
)

# Input Components
from .ui.input import TextField, SearchInput, PasswordInput, InputSize

# Status & Badges
from .status_badge import StatusBadge, StatusDot

# Data Display
from .data_table import DataTable

# Modals & Dialogs
from .modal import Modal, ConfirmDialog, InfoDialog
from .device_detail_modal import DeviceDetailModal, show_device_detail_modal

# Feedback
from .empty_state import EmptyState
from .toast import ToastManager

# Search & Filter
from .search_filter import SearchFilter, SearchFilterCompact
from .view_toggle import ViewToggle, ViewToggleCompact

# Loading
from .loading import (
    LoadingSpinner,
    LoadingOverlay,
    SkeletonLoader,
)

__all__ = [
    # === Buttons ===
    "Button",
    "ButtonVariant",
    "ButtonSize",
    "ActionButton",
    "IconButton",
    "StyledIconButton",
    "FloatingActionButton",
    "ToggleButton",
    
    # === Cards ===
    "Card",
    "BaseCard",
    "StatsCard",
    "StatCard",
    "GlassCard",
    "ListCard",
    "InfoCard",
    "AlertCard",
    "ListItemCard",
    
    # === Inputs ===
    "TextField",
    "SearchInput",
    "PasswordInput",
    "InputSize",
    
    # === Status & Badges ===
    "StatusBadge",
    "StatusDot",
    
    # === Data Display ===
    "DataTable",
    
    # === Modals & Dialogs ===
    "Modal",
    "ConfirmDialog",
    "InfoDialog",
    "DeviceDetailModal",
    "show_device_detail_modal",
    
    # === Feedback ===
    "EmptyState",
    "ToastManager",
    
    # === Search & Filter ===
    "SearchFilter",
    "SearchFilterCompact",
    "ViewToggle",
    "ViewToggleCompact",
    
    # === Loading ===
    "LoadingSpinner",
    "LoadingOverlay",
    "SkeletonLoader",
]
