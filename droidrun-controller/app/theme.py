"""Modern theme configuration for Droidrun Controller - 2025 Edition.

Inspired by professional dashboard designs with both light and dark modes.
Enhanced with refined color tones, gradient support, and improved shadows.
"""

import flet as ft
from typing import Dict, List, Tuple

# ============================================================================
# LIGHT THEME - Clean and Professional (Refined 2025)
# ============================================================================
COLORS_LIGHT: Dict[str, str] = {
    # Background layers - Refined with subtle warm tones
    "bg_primary": "#F8F9FB",        # Main content area - softer
    "bg_secondary": "#FFFFFF",       # Sidebar, cards
    "bg_tertiary": "#F1F3F7",        # Elevated surfaces
    "bg_card": "#FFFFFF",            # Card backgrounds
    "bg_hover": "#EEF1F6",           # Hover states - refined
    "bg_input": "#F5F7FA",           # Input backgrounds
    "bg_elevated": "#FFFFFF",
    "bg_glass": "#FFFFFF90",         # Glass effect with better opacity
    "bg_overlay": "#00000008",       # Subtle overlay
    "bg_subtle": "#FAFBFC",          # Subtle background variation

    # Gradient backgrounds
    "bg_gradient_start": "#F8F9FB",
    "bg_gradient_end": "#EBEEF4",
    "bg_gradient_accent": "#E8F5EC", # Subtle green tint

    # Text hierarchy - Improved contrast
    "text_primary": "#151922",       # Main text - deeper black
    "text_secondary": "#5E6778",     # Secondary text - refined
    "text_muted": "#8B95A5",         # Muted/placeholder - softer
    "text_inverse": "#FFFFFF",
    "text_link": "#2563EB",          # Link color
    "text_caption": "#9BA5B7",       # Caption text

    # Brand colors - Refined Green primary
    "primary": "#10B981",            # Emerald green - more refined
    "primary_light": "#34D399",
    "primary_dark": "#059669",
    "primary_darker": "#047857",
    "primary_glow": "#10B98125",
    "primary_subtle": "#ECFDF5",     # Very subtle primary tint

    # Secondary brand color
    "secondary": "#6366F1",          # Indigo secondary
    "secondary_light": "#818CF8",
    "secondary_dark": "#4F46E5",
    "secondary_glow": "#6366F120",

    # Accent colors - Refined palette
    "accent_cyan": "#06B6D4",
    "accent_teal": "#14B8A6",
    "accent_purple": "#8B5CF6",
    "accent_violet": "#7C3AED",
    "accent_pink": "#EC4899",
    "accent_rose": "#F43F5E",
    "accent_orange": "#F97316",
    "accent_amber": "#F59E0B",
    "accent_yellow": "#EAB308",
    "accent_blue": "#3B82F6",
    "accent_indigo": "#6366F1",
    "accent_sky": "#0EA5E9",
    "accent_emerald": "#10B981",
    "accent_lime": "#84CC16",

    # Semantic colors - Enhanced with gradients
    "success": "#10B981",
    "success_light": "#34D399",
    "success_dark": "#059669",
    "success_glow": "#10B98120",
    "success_subtle": "#ECFDF5",
    "success_gradient_start": "#10B981",
    "success_gradient_end": "#059669",

    "warning": "#F59E0B",
    "warning_light": "#FBBF24",
    "warning_dark": "#D97706",
    "warning_glow": "#F59E0B20",
    "warning_subtle": "#FFFBEB",
    "warning_gradient_start": "#F59E0B",
    "warning_gradient_end": "#D97706",

    "error": "#EF4444",
    "error_light": "#F87171",
    "error_dark": "#DC2626",
    "error_glow": "#EF444420",
    "error_subtle": "#FEF2F2",
    "error_gradient_start": "#EF4444",
    "error_gradient_end": "#DC2626",

    "info": "#3B82F6",
    "info_light": "#60A5FA",
    "info_dark": "#2563EB",
    "info_glow": "#3B82F620",
    "info_subtle": "#EFF6FF",
    "info_gradient_start": "#3B82F6",
    "info_gradient_end": "#2563EB",

    # Borders - Refined
    "border": "#E2E8F0",             # Softer border
    "border_light": "#F1F5F9",
    "border_medium": "#CBD5E1",
    "border_focus": "#10B981",
    "border_hover": "#10B98160",
    "border_subtle": "#F3F4F6",

    # Status colors - Refined
    "online": "#10B981",
    "offline": "#94A3B8",
    "busy": "#F59E0B",
    "running": "#3B82F6",
    "completed": "#10B981",
    "failed": "#EF4444",
    "pending": "#94A3B8",
    "active": "#10B981",
    "inactive": "#94A3B8",
    "paused": "#8B5CF6",
    "queued": "#6366F1",

    # Chart colors - Harmonized palette
    "chart_1": "#8B5CF6",    # Purple
    "chart_2": "#10B981",    # Emerald
    "chart_3": "#F59E0B",    # Amber
    "chart_4": "#3B82F6",    # Blue
    "chart_5": "#EC4899",    # Pink
    "chart_6": "#06B6D4",    # Cyan
    "chart_7": "#F43F5E",    # Rose
    "chart_8": "#84CC16",    # Lime

    # Interactive states
    "focus_ring": "#10B98140",
    "selection": "#10B98115",
    "highlight": "#FEF3C7",
    "backdrop": "#00000050",

    # Skeleton/Loading
    "skeleton_base": "#E2E8F0",
    "skeleton_shimmer": "#F8FAFC",
}

# ============================================================================
# DARK THEME - Modern and Premium (Refined 2025)
# ============================================================================
COLORS_DARK: Dict[str, str] = {
    # Background layers - Refined deep tones
    "bg_primary": "#0C0E14",         # Ultra deep dark - refined
    "bg_secondary": "#161921",       # Sidebar, cards - warmer
    "bg_tertiary": "#1F232D",        # Elevated surfaces
    "bg_card": "#171B24",            # Card backgrounds - refined
    "bg_hover": "#262B38",           # Hover states
    "bg_input": "#1E222C",           # Input backgrounds
    "bg_elevated": "#1F232D",
    "bg_glass": "#FFFFFF0A",         # Glass effect
    "bg_overlay": "#00000040",       # Overlay
    "bg_subtle": "#12151C",          # Subtle background variation

    # Gradient backgrounds
    "bg_gradient_start": "#0C0E14",
    "bg_gradient_end": "#161921",
    "bg_gradient_accent": "#0F1F1A", # Subtle green tint

    # Text hierarchy - Refined for dark mode
    "text_primary": "#F9FAFB",       # Slightly off-white
    "text_secondary": "#9CA3AF",
    "text_muted": "#6B7280",
    "text_inverse": "#0C0E14",
    "text_link": "#60A5FA",
    "text_caption": "#6B7280",

    # Brand colors - Refined Green primary (brighter for dark)
    "primary": "#22C55E",            # Brighter green for dark mode
    "primary_light": "#4ADE80",
    "primary_dark": "#16A34A",
    "primary_darker": "#15803D",
    "primary_glow": "#22C55E30",
    "primary_subtle": "#22C55E15",

    # Secondary brand color
    "secondary": "#818CF8",
    "secondary_light": "#A5B4FC",
    "secondary_dark": "#6366F1",
    "secondary_glow": "#818CF825",

    # Accent colors - Enhanced for dark mode
    "accent_cyan": "#22D3EE",
    "accent_teal": "#2DD4BF",
    "accent_purple": "#A78BFA",
    "accent_violet": "#8B5CF6",
    "accent_pink": "#F472B6",
    "accent_rose": "#FB7185",
    "accent_orange": "#FB923C",
    "accent_amber": "#FBBF24",
    "accent_yellow": "#FACC15",
    "accent_blue": "#60A5FA",
    "accent_indigo": "#818CF8",
    "accent_sky": "#38BDF8",
    "accent_emerald": "#34D399",
    "accent_lime": "#A3E635",

    # Semantic colors - Enhanced with gradients
    "success": "#22C55E",
    "success_light": "#4ADE80",
    "success_dark": "#16A34A",
    "success_glow": "#22C55E30",
    "success_subtle": "#22C55E15",
    "success_gradient_start": "#22C55E",
    "success_gradient_end": "#16A34A",

    "warning": "#FBBF24",
    "warning_light": "#FCD34D",
    "warning_dark": "#F59E0B",
    "warning_glow": "#FBBF2430",
    "warning_subtle": "#FBBF2415",
    "warning_gradient_start": "#FBBF24",
    "warning_gradient_end": "#F59E0B",

    "error": "#F87171",
    "error_light": "#FCA5A5",
    "error_dark": "#EF4444",
    "error_glow": "#F8717130",
    "error_subtle": "#F8717115",
    "error_gradient_start": "#F87171",
    "error_gradient_end": "#EF4444",

    "info": "#60A5FA",
    "info_light": "#93C5FD",
    "info_dark": "#3B82F6",
    "info_glow": "#60A5FA30",
    "info_subtle": "#60A5FA15",
    "info_gradient_start": "#60A5FA",
    "info_gradient_end": "#3B82F6",

    # Borders - Refined for dark
    "border": "#2D3344",
    "border_light": "#3D4455",
    "border_medium": "#404859",
    "border_focus": "#22C55E",
    "border_hover": "#22C55E60",
    "border_subtle": "#1F232D",

    # Status colors - Enhanced for dark mode
    "online": "#22C55E",
    "offline": "#6B7280",
    "busy": "#FBBF24",
    "running": "#60A5FA",
    "completed": "#22C55E",
    "failed": "#F87171",
    "pending": "#6B7280",
    "active": "#22C55E",
    "inactive": "#6B7280",
    "paused": "#A78BFA",
    "queued": "#818CF8",

    # Chart colors - Enhanced for dark mode
    "chart_1": "#A78BFA",
    "chart_2": "#34D399",
    "chart_3": "#FBBF24",
    "chart_4": "#60A5FA",
    "chart_5": "#F472B6",
    "chart_6": "#22D3EE",
    "chart_7": "#FB7185",
    "chart_8": "#A3E635",

    # Interactive states
    "focus_ring": "#22C55E40",
    "selection": "#22C55E20",
    "highlight": "#FBBF2420",
    "backdrop": "#00000080",

    # Skeleton/Loading
    "skeleton_base": "#2D3344",
    "skeleton_shimmer": "#3D4455",
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
            secondary=colors["secondary"],
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
        "paused": colors["paused"],
        "queued": colors["queued"],
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
        "paused": ft.Icons.PAUSE_CIRCLE,
        "queued": ft.Icons.QUEUE,
    }
    return icon_map.get(status.lower(), ft.Icons.HELP)


# ============================================================================
# GRADIENT DEFINITIONS
# ============================================================================
GRADIENTS_LIGHT: Dict[str, Tuple[str, str]] = {
    "primary": ("#10B981", "#059669"),
    "secondary": ("#6366F1", "#4F46E5"),
    "success": ("#10B981", "#059669"),
    "warning": ("#F59E0B", "#D97706"),
    "error": ("#EF4444", "#DC2626"),
    "info": ("#3B82F6", "#2563EB"),
    "purple": ("#8B5CF6", "#7C3AED"),
    "pink": ("#EC4899", "#DB2777"),
    "cyan": ("#06B6D4", "#0891B2"),
    "ambient": ("#F8F9FB", "#EBEEF4"),
    "card": ("#FFFFFF", "#FAFBFC"),
    "sunset": ("#F97316", "#EF4444"),
    "ocean": ("#06B6D4", "#3B82F6"),
    "forest": ("#10B981", "#059669"),
}

GRADIENTS_DARK: Dict[str, Tuple[str, str]] = {
    "primary": ("#22C55E", "#16A34A"),
    "secondary": ("#818CF8", "#6366F1"),
    "success": ("#22C55E", "#16A34A"),
    "warning": ("#FBBF24", "#F59E0B"),
    "error": ("#F87171", "#EF4444"),
    "info": ("#60A5FA", "#3B82F6"),
    "purple": ("#A78BFA", "#8B5CF6"),
    "pink": ("#F472B6", "#EC4899"),
    "cyan": ("#22D3EE", "#06B6D4"),
    "ambient": ("#0C0E14", "#161921"),
    "card": ("#171B24", "#1F232D"),
    "sunset": ("#FB923C", "#F87171"),
    "ocean": ("#22D3EE", "#60A5FA"),
    "forest": ("#34D399", "#22C55E"),
}


def get_gradient(name: str) -> Tuple[str, str]:
    """Get gradient colors by name."""
    gradients = GRADIENTS_LIGHT if _current_theme == "light" else GRADIENTS_DARK
    return gradients.get(name, gradients["primary"])


def create_linear_gradient(name: str, vertical: bool = True) -> ft.LinearGradient:
    """Create a linear gradient for use in containers."""
    start, end = get_gradient(name)
    return ft.LinearGradient(
        begin=ft.alignment.top_center if vertical else ft.alignment.center_left,
        end=ft.alignment.bottom_center if vertical else ft.alignment.center_right,
        colors=[start, end],
    )


# ============================================================================
# UI CONSTANTS
# ============================================================================
SPACING = {
    "xxs": 2,
    "xs": 4,
    "sm": 8,
    "md": 12,
    "lg": 16,
    "xl": 24,
    "xxl": 32,
    "xxxl": 48,
}

RADIUS = {
    "xs": 4,
    "sm": 6,
    "md": 10,
    "lg": 14,
    "xl": 20,
    "xxl": 28,
    "full": 999,
}

# ============================================================================
# SHADOW DEFINITIONS - Enhanced
# ============================================================================
SHADOWS: Dict[str, ft.BoxShadow] = {
    "xs": ft.BoxShadow(
        spread_radius=0,
        blur_radius=1,
        color="#00000008",
        offset=ft.Offset(0, 1),
    ),
    "sm": ft.BoxShadow(
        spread_radius=0,
        blur_radius=2,
        color="#0000000D",
        offset=ft.Offset(0, 2),
    ),
    "md": ft.BoxShadow(
        spread_radius=0,
        blur_radius=4,
        color="#00000012",
        offset=ft.Offset(0, 4),
    ),
    "lg": ft.BoxShadow(
        spread_radius=0,
        blur_radius=8,
        color="#00000018",
        offset=ft.Offset(0, 8),
    ),
    "xl": ft.BoxShadow(
        spread_radius=0,
        blur_radius=12,
        color="#0000001F",
        offset=ft.Offset(0, 12),
    ),
    "xxl": ft.BoxShadow(
        spread_radius=0,
        blur_radius=20,
        color="#00000025",
        offset=ft.Offset(0, 20),
    ),
    "inner": ft.BoxShadow(
        spread_radius=-1,
        blur_radius=2,
        color="#0000000A",
        offset=ft.Offset(0, 2),
    ),
}

# Colored shadow variants
SHADOWS_COLORED = {
    "primary": lambda: ft.BoxShadow(
        spread_radius=0,
        blur_radius=20,
        color=get_colors()["primary_glow"],
        offset=ft.Offset(0, 8),
    ),
    "success": lambda: ft.BoxShadow(
        spread_radius=0,
        blur_radius=20,
        color=get_colors()["success_glow"],
        offset=ft.Offset(0, 8),
    ),
    "warning": lambda: ft.BoxShadow(
        spread_radius=0,
        blur_radius=20,
        color=get_colors()["warning_glow"],
        offset=ft.Offset(0, 8),
    ),
    "error": lambda: ft.BoxShadow(
        spread_radius=0,
        blur_radius=20,
        color=get_colors()["error_glow"],
        offset=ft.Offset(0, 8),
    ),
    "info": lambda: ft.BoxShadow(
        spread_radius=0,
        blur_radius=20,
        color=get_colors()["info_glow"],
        offset=ft.Offset(0, 8),
    ),
}


def get_colored_shadow(name: str) -> ft.BoxShadow:
    """Get a colored shadow by name."""
    if name in SHADOWS_COLORED:
        return SHADOWS_COLORED[name]()
    return SHADOWS["md"]


# Dark mode shadows - softer for dark backgrounds
SHADOWS_DARK: Dict[str, ft.BoxShadow] = {
    "xs": ft.BoxShadow(
        spread_radius=0,
        blur_radius=1,
        color="#00000030",
        offset=ft.Offset(0, 1),
    ),
    "sm": ft.BoxShadow(
        spread_radius=0,
        blur_radius=2,
        color="#00000040",
        offset=ft.Offset(0, 2),
    ),
    "md": ft.BoxShadow(
        spread_radius=0,
        blur_radius=4,
        color="#00000050",
        offset=ft.Offset(0, 4),
    ),
    "lg": ft.BoxShadow(
        spread_radius=0,
        blur_radius=8,
        color="#00000060",
        offset=ft.Offset(0, 8),
    ),
    "xl": ft.BoxShadow(
        spread_radius=0,
        blur_radius=12,
        color="#00000070",
        offset=ft.Offset(0, 12),
    ),
    "xxl": ft.BoxShadow(
        spread_radius=0,
        blur_radius=20,
        color="#00000080",
        offset=ft.Offset(0, 20),
    ),
    "inner": ft.BoxShadow(
        spread_radius=-1,
        blur_radius=2,
        color="#00000040",
        offset=ft.Offset(0, 2),
    ),
}


def get_shadow(size: str = "md") -> ft.BoxShadow:
    """Get appropriate shadow for current theme."""
    shadows = SHADOWS if _current_theme == "light" else SHADOWS_DARK
    return shadows.get(size, shadows["md"])


FONT_SIZES = {
    "xxs": 10,
    "xs": 11,
    "sm": 12,
    "md": 14,
    "lg": 16,
    "xl": 20,
    "xxl": 28,
    "xxxl": 36,
    "display": 48,
}

# Font weights for consistency
FONT_WEIGHTS = {
    "light": ft.FontWeight.W_300,
    "normal": ft.FontWeight.W_400,
    "medium": ft.FontWeight.W_500,
    "semibold": ft.FontWeight.W_600,
    "bold": ft.FontWeight.W_700,
    "extrabold": ft.FontWeight.W_800,
}

# Animation durations (in milliseconds)
ANIMATION = {
    "instant": 0,
    "fast": 100,
    "normal": 200,
    "slow": 300,
    "slower": 400,
    "page": 500,
}

# Z-index levels for layering
Z_INDEX = {
    "base": 0,
    "dropdown": 100,
    "sticky": 200,
    "modal": 300,
    "popover": 400,
    "tooltip": 500,
    "toast": 600,
}
