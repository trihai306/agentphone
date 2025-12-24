"""Modern theme configuration for Droidrun Controller - 2025 Edition.

Inspired by professional dashboard designs with both light and dark modes.
"""

import flet as ft
from typing import Dict

# ============================================================================
# LIGHT THEME - Clean and Professional (like reference)
# ============================================================================
COLORS_LIGHT: Dict[str, str] = {
    # Background layers
    "bg_primary": "#F7F8FA",        # Main content area
    "bg_secondary": "#FFFFFF",       # Sidebar, cards
    "bg_tertiary": "#F0F2F5",        # Elevated surfaces
    "bg_card": "#FFFFFF",            # Card backgrounds
    "bg_hover": "#F0F2F5",           # Hover states
    "bg_input": "#F7F8FA",           # Input backgrounds
    "bg_elevated": "#FFFFFF",
    "bg_glass": "#FFFFFF80",

    # Text hierarchy
    "text_primary": "#1A1D26",       # Main text
    "text_secondary": "#6B7280",     # Secondary text
    "text_muted": "#9CA3AF",         # Muted/placeholder
    "text_inverse": "#FFFFFF",

    # Brand colors - Green primary (like reference)
    "primary": "#22C55E",            # Green primary
    "primary_light": "#4ADE80",
    "primary_dark": "#16A34A",
    "primary_glow": "#22C55E20",

    # Accent colors
    "accent_cyan": "#06B6D4",
    "accent_teal": "#14B8A6",
    "accent_purple": "#8B5CF6",
    "accent_violet": "#7C3AED",
    "accent_pink": "#EC4899",
    "accent_orange": "#F97316",
    "accent_amber": "#F59E0B",
    "accent_blue": "#3B82F6",
    "accent_indigo": "#6366F1",

    # Semantic colors
    "success": "#22C55E",
    "success_light": "#4ADE80",
    "success_dark": "#16A34A",
    "success_glow": "#22C55E20",

    "warning": "#F59E0B",
    "warning_light": "#FCD34D",
    "warning_dark": "#D97706",
    "warning_glow": "#F59E0B20",

    "error": "#EF4444",
    "error_light": "#F87171",
    "error_dark": "#DC2626",
    "error_glow": "#EF444420",

    "info": "#3B82F6",
    "info_light": "#60A5FA",
    "info_dark": "#2563EB",
    "info_glow": "#3B82F620",

    # Borders
    "border": "#E5E7EB",
    "border_light": "#F3F4F6",
    "border_focus": "#22C55E",
    "border_hover": "#22C55E60",

    # Status colors
    "online": "#22C55E",
    "offline": "#9CA3AF",
    "busy": "#F59E0B",
    "running": "#3B82F6",
    "completed": "#22C55E",
    "failed": "#EF4444",
    "pending": "#9CA3AF",
    "active": "#22C55E",
    "inactive": "#9CA3AF",

    # Chart colors
    "chart_1": "#8B5CF6",    # Purple
    "chart_2": "#22C55E",    # Green
    "chart_3": "#F59E0B",    # Amber
    "chart_4": "#3B82F6",    # Blue
    "chart_5": "#EC4899",    # Pink
    "chart_6": "#06B6D4",    # Cyan
}

# ============================================================================
# DARK THEME - Modern and Premium
# ============================================================================
COLORS_DARK: Dict[str, str] = {
    # Background layers
    "bg_primary": "#0F1117",         # Ultra deep dark
    "bg_secondary": "#1A1D27",       # Sidebar, cards
    "bg_tertiary": "#242836",        # Elevated surfaces
    "bg_card": "#1A1D27",            # Card backgrounds
    "bg_hover": "#2D3241",           # Hover states
    "bg_input": "#242836",           # Input backgrounds
    "bg_elevated": "#242836",
    "bg_glass": "#FFFFFF08",

    # Text hierarchy
    "text_primary": "#FFFFFF",
    "text_secondary": "#A1A7B4",
    "text_muted": "#6B7280",
    "text_inverse": "#0F1117",

    # Brand colors - Green primary
    "primary": "#22C55E",
    "primary_light": "#4ADE80",
    "primary_dark": "#16A34A",
    "primary_glow": "#22C55E30",

    # Accent colors
    "accent_cyan": "#06B6D4",
    "accent_teal": "#14B8A6",
    "accent_purple": "#8B5CF6",
    "accent_violet": "#7C3AED",
    "accent_pink": "#EC4899",
    "accent_orange": "#F97316",
    "accent_amber": "#F59E0B",
    "accent_blue": "#3B82F6",
    "accent_indigo": "#6366F1",

    # Semantic colors
    "success": "#22C55E",
    "success_light": "#4ADE80",
    "success_dark": "#16A34A",
    "success_glow": "#22C55E30",

    "warning": "#F59E0B",
    "warning_light": "#FCD34D",
    "warning_dark": "#D97706",
    "warning_glow": "#F59E0B30",

    "error": "#EF4444",
    "error_light": "#F87171",
    "error_dark": "#DC2626",
    "error_glow": "#EF444430",

    "info": "#3B82F6",
    "info_light": "#60A5FA",
    "info_dark": "#2563EB",
    "info_glow": "#3B82F630",

    # Borders
    "border": "#2D3241",
    "border_light": "#3D4355",
    "border_focus": "#22C55E",
    "border_hover": "#22C55E60",

    # Status colors
    "online": "#22C55E",
    "offline": "#6B7280",
    "busy": "#F59E0B",
    "running": "#3B82F6",
    "completed": "#22C55E",
    "failed": "#EF4444",
    "pending": "#6B7280",
    "active": "#22C55E",
    "inactive": "#6B7280",

    # Chart colors
    "chart_1": "#8B5CF6",
    "chart_2": "#22C55E",
    "chart_3": "#F59E0B",
    "chart_4": "#3B82F6",
    "chart_5": "#EC4899",
    "chart_6": "#06B6D4",
}

# Default to Light theme (like reference)
COLORS = COLORS_LIGHT

# Theme mode
_current_theme = "light"


def set_theme_mode(mode: str):
    """Set the theme mode: 'light' or 'dark'."""
    global COLORS, _current_theme
    _current_theme = mode
    COLORS = COLORS_LIGHT if mode == "light" else COLORS_DARK


def get_theme_mode() -> str:
    """Get current theme mode."""
    return _current_theme


def get_colors() -> Dict[str, str]:
    """Get current color palette."""
    return COLORS_LIGHT if _current_theme == "light" else COLORS_DARK


def get_theme() -> ft.Theme:
    """Get the Flet theme configuration."""
    colors = get_colors()
    return ft.Theme(
        color_scheme_seed=ft.Colors.GREEN,
        color_scheme=ft.ColorScheme(
            primary=colors["primary"],
            on_primary=colors["text_inverse"] if _current_theme == "light" else colors["text_primary"],
            secondary=colors["accent_cyan"],
            background=colors["bg_primary"],
            surface=colors["bg_secondary"],
            on_surface=colors["text_primary"],
            error=colors["error"],
        ),
    )


def status_color(status: str) -> str:
    """Get color for a status value."""
    colors = get_colors()
    status_map = {
        "online": colors["online"],
        "offline": colors["offline"],
        "busy": colors["busy"],
        "running": colors["running"],
        "completed": colors["completed"],
        "success": colors["success"],
        "failed": colors["failed"],
        "error": colors["error"],
        "pending": colors["pending"],
        "active": colors["success"],
        "inactive": colors["text_muted"],
    }
    return status_map.get(status.lower(), colors["text_muted"])


def status_icon(status: str) -> str:
    """Get icon for a status value."""
    icon_map = {
        "online": ft.Icons.CHECK_CIRCLE,
        "offline": ft.Icons.CANCEL,
        "busy": ft.Icons.PENDING,
        "running": ft.Icons.PLAY_CIRCLE,
        "completed": ft.Icons.CHECK_CIRCLE,
        "success": ft.Icons.CHECK_CIRCLE,
        "failed": ft.Icons.ERROR,
        "error": ft.Icons.ERROR,
        "pending": ft.Icons.SCHEDULE,
    }
    return icon_map.get(status.lower(), ft.Icons.HELP)


# ============================================================================
# UI CONSTANTS
# ============================================================================
SPACING = {
    "xs": 4,
    "sm": 8,
    "md": 12,
    "lg": 16,
    "xl": 24,
    "xxl": 32,
}

RADIUS = {
    "sm": 6,
    "md": 10,
    "lg": 14,
    "xl": 20,
    "full": 999,
}

SHADOWS = {
    "sm": ft.BoxShadow(
        spread_radius=0,
        blur_radius=4,
        color="#00000010",
        offset=ft.Offset(0, 2),
    ),
    "md": ft.BoxShadow(
        spread_radius=0,
        blur_radius=8,
        color="#00000015",
        offset=ft.Offset(0, 4),
    ),
    "lg": ft.BoxShadow(
        spread_radius=0,
        blur_radius=16,
        color="#00000020",
        offset=ft.Offset(0, 8),
    ),
}

FONT_SIZES = {
    "xs": 11,
    "sm": 12,
    "md": 14,
    "lg": 16,
    "xl": 20,
    "xxl": 28,
    "display": 36,
}
