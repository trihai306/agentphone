"""Modern theme configuration for Droidrun Controller - 2025 Professional Edition.

Inspired by Linear, Vercel, and Stripe dashboard designs.
Features: Glassmorphism, micro-interactions, fluid animations, and refined aesthetics.
"""

import flet as ft
import os
import json
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum


# ============================================================================
# TYPOGRAPHY SYSTEM - Professional Font Stack
# ============================================================================
class Typography:
    """Professional typography system with semantic sizing."""

    # Display sizes for hero sections
    DISPLAY_2XL = 72
    DISPLAY_XL = 60
    DISPLAY_LG = 48
    DISPLAY_MD = 36

    # Heading sizes
    H1 = 32
    H2 = 28
    H3 = 24
    H4 = 20
    H5 = 18
    H6 = 16

    # Body text
    BODY_LG = 16
    BODY_MD = 14
    BODY_SM = 13
    BODY_XS = 12

    # Labels and captions
    LABEL_LG = 14
    LABEL_MD = 13
    LABEL_SM = 12
    LABEL_XS = 11

    CAPTION = 11
    OVERLINE = 10


# ============================================================================
# EASING CURVES - Smooth Professional Animations
# ============================================================================
class Easing:
    """Professional easing curves for fluid animations."""

    # Standard curves
    EASE_IN = ft.AnimationCurve.EASE_IN
    EASE_OUT = ft.AnimationCurve.EASE_OUT
    EASE_IN_OUT = ft.AnimationCurve.EASE_IN_OUT

    # Spring-like curves
    BOUNCE_OUT = ft.AnimationCurve.BOUNCE_OUT
    ELASTIC_OUT = ft.AnimationCurve.ELASTIC_OUT

    # Deceleration (recommended for enter animations)
    DECELERATE = ft.AnimationCurve.DECELERATE

    # Fast out slow in (recommended for exit animations)
    FAST_OUT_SLOW_IN = ft.AnimationCurve.FAST_OUT_SLOWIN

# ============================================================================
# LIGHT THEME - Clean SaaS Style (Vercel/Linear Inspired)
# ============================================================================
COLORS_LIGHT: Dict[str, str] = {
    # Background layers - Ultra clean whites with subtle depth
    "bg_primary": "#FAFAFA",          # Main content - subtle off-white
    "bg_secondary": "#FFFFFF",         # Sidebar, elevated cards
    "bg_tertiary": "#F4F4F5",          # Nested surfaces
    "bg_card": "#FFFFFF",              # Card backgrounds
    "bg_hover": "#F4F4F5",             # Hover states
    "bg_input": "#FFFFFF",             # Input backgrounds
    "bg_elevated": "#FFFFFF",          # Elevated surfaces
    "bg_glass": "rgba(255,255,255,0.8)",  # Glassmorphism
    "bg_overlay": "rgba(0,0,0,0.04)",  # Subtle overlay
    "bg_subtle": "#FAFAFA",            # Subtle background
    "bg_muted": "#F9FAFB",             # Muted background
    "bg_accent": "#F0FDF4",            # Accent background (green tint)

    # Gradient backgrounds - Modern subtle gradients
    "bg_gradient_start": "#FFFFFF",
    "bg_gradient_end": "#F4F4F5",
    "bg_gradient_accent": "#ECFDF5",

    # Text hierarchy - High contrast for readability
    "text_primary": "#09090B",         # Near-black for main text
    "text_secondary": "#52525B",       # Zinc-600
    "text_muted": "#A1A1AA",           # Zinc-400
    "text_inverse": "#FFFFFF",
    "text_link": "#2563EB",
    "text_caption": "#71717A",         # Zinc-500
    "text_disabled": "#D4D4D8",        # Zinc-300

    # Brand colors - Vibrant Green (Primary)
    "primary": "#22C55E",              # Green-500
    "primary_light": "#4ADE80",        # Green-400
    "primary_dark": "#16A34A",         # Green-600
    "primary_darker": "#15803D",       # Green-700
    "primary_glow": "rgba(34,197,94,0.15)",
    "primary_subtle": "#F0FDF4",       # Green-50
    "primary_muted": "#DCFCE7",        # Green-100

    # Secondary brand - Violet
    "secondary": "#8B5CF6",            # Violet-500
    "secondary_light": "#A78BFA",      # Violet-400
    "secondary_dark": "#7C3AED",       # Violet-600
    "secondary_glow": "rgba(139,92,246,0.15)",
    "secondary_subtle": "#F5F3FF",     # Violet-50

    # Accent colors - Full spectrum
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

    # Semantic colors - Clear meaning
    "success": "#22C55E",
    "success_light": "#4ADE80",
    "success_dark": "#16A34A",
    "success_glow": "rgba(34,197,94,0.12)",
    "success_subtle": "#F0FDF4",

    "warning": "#F59E0B",
    "warning_light": "#FBBF24",
    "warning_dark": "#D97706",
    "warning_glow": "rgba(245,158,11,0.12)",
    "warning_subtle": "#FFFBEB",

    "error": "#EF4444",
    "error_light": "#F87171",
    "error_dark": "#DC2626",
    "error_glow": "rgba(239,68,68,0.12)",
    "error_subtle": "#FEF2F2",

    "info": "#3B82F6",
    "info_light": "#60A5FA",
    "info_dark": "#2563EB",
    "info_glow": "rgba(59,130,246,0.12)",
    "info_subtle": "#EFF6FF",

    # Borders - Subtle and refined
    "border": "#E4E4E7",               # Zinc-200
    "border_light": "#F4F4F5",         # Zinc-100
    "border_medium": "#D4D4D8",        # Zinc-300
    "border_focus": "#22C55E",
    "border_hover": "rgba(34,197,94,0.5)",
    "border_subtle": "#F4F4F5",
    "border_muted": "#E4E4E7",

    # Status colors
    "online": "#22C55E",
    "offline": "#A1A1AA",
    "busy": "#F59E0B",
    "running": "#3B82F6",
    "completed": "#22C55E",
    "failed": "#EF4444",
    "pending": "#A1A1AA",
    "active": "#22C55E",
    "inactive": "#A1A1AA",
    "paused": "#8B5CF6",
    "queued": "#6366F1",

    # Chart colors - Harmonized
    "chart_1": "#8B5CF6",
    "chart_2": "#22C55E",
    "chart_3": "#F59E0B",
    "chart_4": "#3B82F6",
    "chart_5": "#EC4899",
    "chart_6": "#06B6D4",
    "chart_7": "#F43F5E",
    "chart_8": "#84CC16",

    # Interactive states
    "focus_ring": "rgba(34,197,94,0.4)",
    "selection": "rgba(34,197,94,0.15)",
    "highlight": "#FEF3C7",
    "backdrop": "rgba(0,0,0,0.5)",

    # List view specific
    "list_item_hover": "#F4F4F5",
    "list_item_selected": "#F0FDF4",
    "list_item_border": "#E4E4E7",

    # Filter/Search specific
    "filter_bg": "#FFFFFF",
    "search_border_focus": "#22C55E",
    "search_bg": "#FFFFFF",

    # Skeleton/Loading
    "skeleton_base": "#E4E4E7",
    "skeleton_shimmer": "#F4F4F5",
}

# ============================================================================
# DARK THEME - Premium Dark (GitHub/Vercel Dark Inspired)
# ============================================================================
COLORS_DARK: Dict[str, str] = {
    # Background layers - Deep blacks with subtle blue undertones
    "bg_primary": "#09090B",           # True dark - Zinc-950
    "bg_secondary": "#18181B",         # Elevated - Zinc-900
    "bg_tertiary": "#27272A",          # Surfaces - Zinc-800
    "bg_card": "#18181B",              # Card backgrounds
    "bg_hover": "#27272A",             # Hover states
    "bg_input": "#18181B",             # Input backgrounds
    "bg_elevated": "#27272A",          # Elevated surfaces
    "bg_glass": "rgba(24,24,27,0.85)", # Glassmorphism
    "bg_overlay": "rgba(0,0,0,0.6)",   # Overlay
    "bg_subtle": "#0F0F12",            # Subtle background
    "bg_muted": "#18181B",             # Muted background
    "bg_accent": "rgba(34,197,94,0.1)", # Accent background

    # Gradient backgrounds
    "bg_gradient_start": "#09090B",
    "bg_gradient_end": "#18181B",
    "bg_gradient_accent": "rgba(34,197,94,0.08)",

    # Text hierarchy - Crisp whites
    "text_primary": "#FAFAFA",         # Zinc-50
    "text_secondary": "#A1A1AA",       # Zinc-400
    "text_muted": "#71717A",           # Zinc-500
    "text_inverse": "#09090B",         # Zinc-950
    "text_link": "#60A5FA",            # Blue-400
    "text_caption": "#71717A",         # Zinc-500
    "text_disabled": "#52525B",        # Zinc-600

    # Brand colors - Brighter for dark mode
    "primary": "#22C55E",              # Green-500
    "primary_light": "#4ADE80",        # Green-400
    "primary_dark": "#16A34A",         # Green-600
    "primary_darker": "#15803D",       # Green-700
    "primary_glow": "rgba(34,197,94,0.25)",
    "primary_subtle": "rgba(34,197,94,0.15)",
    "primary_muted": "rgba(34,197,94,0.1)",

    # Secondary brand - Violet
    "secondary": "#A78BFA",            # Violet-400
    "secondary_light": "#C4B5FD",      # Violet-300
    "secondary_dark": "#8B5CF6",       # Violet-500
    "secondary_glow": "rgba(167,139,250,0.25)",
    "secondary_subtle": "rgba(167,139,250,0.15)",

    # Accent colors - Brighter for dark
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

    # Semantic colors
    "success": "#22C55E",
    "success_light": "#4ADE80",
    "success_dark": "#16A34A",
    "success_glow": "rgba(34,197,94,0.25)",
    "success_subtle": "rgba(34,197,94,0.15)",

    "warning": "#FBBF24",
    "warning_light": "#FCD34D",
    "warning_dark": "#F59E0B",
    "warning_glow": "rgba(251,191,36,0.25)",
    "warning_subtle": "rgba(251,191,36,0.15)",

    "error": "#F87171",
    "error_light": "#FCA5A5",
    "error_dark": "#EF4444",
    "error_glow": "rgba(248,113,113,0.25)",
    "error_subtle": "rgba(248,113,113,0.15)",

    "info": "#60A5FA",
    "info_light": "#93C5FD",
    "info_dark": "#3B82F6",
    "info_glow": "rgba(96,165,250,0.25)",
    "info_subtle": "rgba(96,165,250,0.15)",

    # Borders - Subtle for dark
    "border": "#27272A",               # Zinc-800
    "border_light": "#3F3F46",         # Zinc-700
    "border_medium": "#52525B",        # Zinc-600
    "border_focus": "#22C55E",
    "border_hover": "rgba(34,197,94,0.5)",
    "border_subtle": "#27272A",
    "border_muted": "#3F3F46",

    # Status colors
    "online": "#22C55E",
    "offline": "#71717A",
    "busy": "#FBBF24",
    "running": "#60A5FA",
    "completed": "#22C55E",
    "failed": "#F87171",
    "pending": "#71717A",
    "active": "#22C55E",
    "inactive": "#71717A",
    "paused": "#A78BFA",
    "queued": "#818CF8",

    # Chart colors
    "chart_1": "#A78BFA",
    "chart_2": "#34D399",
    "chart_3": "#FBBF24",
    "chart_4": "#60A5FA",
    "chart_5": "#F472B6",
    "chart_6": "#22D3EE",
    "chart_7": "#FB7185",
    "chart_8": "#A3E635",

    # Interactive states
    "focus_ring": "rgba(34,197,94,0.5)",
    "selection": "rgba(34,197,94,0.2)",
    "highlight": "rgba(251,191,36,0.2)",
    "backdrop": "rgba(0,0,0,0.8)",

    # List view specific
    "list_item_hover": "#27272A",
    "list_item_selected": "rgba(34,197,94,0.15)",
    "list_item_border": "#27272A",

    # Filter/Search specific
    "filter_bg": "#18181B",
    "search_border_focus": "#22C55E",
    "search_bg": "#18181B",

    # Skeleton/Loading
    "skeleton_base": "#27272A",
    "skeleton_shimmer": "#3F3F46",
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


def get_settings_path() -> str:
    """Get the path to settings file."""
    import os
    settings_dir = os.path.expanduser("~/.droidrun")
    if not os.path.exists(settings_dir):
        os.makedirs(settings_dir)
    return os.path.join(settings_dir, "settings.json")


def save_theme_preference(mode: str) -> bool:
    """Save theme preference to file.
    
    Args:
        mode: 'light' or 'dark'
        
    Returns:
        True if saved successfully, False otherwise
    """
    import json
    try:
        settings_path = get_settings_path()
        settings = {}
        
        # Load existing settings if file exists
        if os.path.exists(settings_path):
            with open(settings_path, 'r') as f:
                settings = json.load(f)
        
        # Update theme mode
        settings['theme_mode'] = mode
        
        # Save settings
        with open(settings_path, 'w') as f:
            json.dump(settings, f, indent=2)
        
        return True
    except Exception as e:
        print(f"[WARNING] Failed to save theme preference: {e}")
        return False


def load_theme_preference() -> str:
    """Load theme preference from file.
    
    Returns:
        Theme mode ('light' or 'dark'), defaults to 'light'
    """
    import json
    import os
    try:
        settings_path = get_settings_path()
        if os.path.exists(settings_path):
            with open(settings_path, 'r') as f:
                settings = json.load(f)
                return settings.get('theme_mode', 'light')
    except Exception as e:
        print(f"[WARNING] Failed to load theme preference: {e}")
    return 'light'


def initialize_theme():
    """Initialize theme from saved preference. Call this at app startup."""
    mode = load_theme_preference()
    set_theme_mode(mode)
    return mode


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
        begin=ft.Alignment(0, -1) if vertical else ft.Alignment(-1, 0),
        end=ft.Alignment(0, 1) if vertical else ft.Alignment(1, 0),
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
    # List view specific spacing
    "list_item_padding_x": 16,      # Horizontal padding for list items
    "list_item_padding_y": 12,      # Vertical padding for list items
    "list_item_gap": 12,            # Gap between list item content sections
    "list_row_height": 64,          # Standard list row height
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
        color="#00000003",
        offset=ft.Offset(0, 1),
    ),
    "sm": ft.BoxShadow(
        spread_radius=0,
        blur_radius=2,
        color="#00000005",
        offset=ft.Offset(0, 1),
    ),
    "md": ft.BoxShadow(
        spread_radius=0,
        blur_radius=4,
        color="#00000008",
        offset=ft.Offset(0, 2),
    ),
    "lg": ft.BoxShadow(
        spread_radius=0,
        blur_radius=8,
        color="#0000000A",
        offset=ft.Offset(0, 4),
    ),
    "xl": ft.BoxShadow(
        spread_radius=0,
        blur_radius=12,
        color="#0000000F",
        offset=ft.Offset(0, 6),
    ),
    "xxl": ft.BoxShadow(
        spread_radius=0,
        blur_radius=20,
        color="#00000012",
        offset=ft.Offset(0, 10),
    ),
    "inner": ft.BoxShadow(
        spread_radius=-1,
        blur_radius=1,
        color="#00000005",
        offset=ft.Offset(0, 1),
    ),
}

# Colored shadow variants - Refined for softer glow
SHADOWS_COLORED = {
    "primary": lambda: ft.BoxShadow(
        spread_radius=0,
        blur_radius=12,
        color=get_colors()["primary_glow"],
        offset=ft.Offset(0, 4),
    ),
    "success": lambda: ft.BoxShadow(
        spread_radius=0,
        blur_radius=12,
        color=get_colors()["success_glow"],
        offset=ft.Offset(0, 4),
    ),
    "warning": lambda: ft.BoxShadow(
        spread_radius=0,
        blur_radius=12,
        color=get_colors()["warning_glow"],
        offset=ft.Offset(0, 4),
    ),
    "error": lambda: ft.BoxShadow(
        spread_radius=0,
        blur_radius=12,
        color=get_colors()["error_glow"],
        offset=ft.Offset(0, 4),
    ),
    "info": lambda: ft.BoxShadow(
        spread_radius=0,
        blur_radius=12,
        color=get_colors()["info_glow"],
        offset=ft.Offset(0, 4),
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


# ============================================================================
# PROFESSIONAL COMPONENT BUILDERS
# ============================================================================
class ComponentStyles:
    """Pre-built component style configurations for consistency."""

    @staticmethod
    def card(
        elevated: bool = False,
        interactive: bool = False,
        accent_color: Optional[str] = None
    ) -> dict:
        """Get card styling configuration."""
        colors = get_colors()
        base = {
            "bgcolor": colors["bg_card"],
            "border_radius": RADIUS["xl"],
            "border": ft.border.all(1, colors["border"]),
            "shadow": get_shadow("sm" if elevated else "xs"),
            "padding": 24,
        }
        if interactive:
            base["animate"] = ft.Animation(ANIMATION["fast"], Easing.EASE_OUT)
            base["animate_scale"] = ft.Animation(ANIMATION["fast"], Easing.EASE_OUT)
        return base

    @staticmethod
    def button_primary() -> dict:
        """Get primary button styling."""
        colors = get_colors()
        return {
            "bgcolor": colors["primary"],
            "border_radius": RADIUS["md"],
            "shadow": ft.BoxShadow(
                spread_radius=0,
                blur_radius=12,
                color=colors["primary_glow"],
                offset=ft.Offset(0, 4),
            ),
            "animate": ft.Animation(ANIMATION["fast"], Easing.EASE_OUT),
            "animate_scale": ft.Animation(ANIMATION["fast"], Easing.EASE_OUT),
        }

    @staticmethod
    def button_secondary() -> dict:
        """Get secondary button styling."""
        colors = get_colors()
        return {
            "bgcolor": colors["bg_tertiary"],
            "border_radius": RADIUS["md"],
            "border": ft.border.all(1, colors["border"]),
            "animate": ft.Animation(ANIMATION["fast"], Easing.EASE_OUT),
        }

    @staticmethod
    def button_ghost() -> dict:
        """Get ghost button styling."""
        return {
            "bgcolor": "transparent",
            "border_radius": RADIUS["md"],
            "animate": ft.Animation(ANIMATION["fast"], Easing.EASE_OUT),
        }

    @staticmethod
    def input_field() -> dict:
        """Get input field styling."""
        colors = get_colors()
        return {
            "bgcolor": colors["bg_input"],
            "border_color": colors["border"],
            "focused_border_color": colors["primary"],
            "border_radius": RADIUS["md"],
            "cursor_color": colors["primary"],
        }

    @staticmethod
    def badge(variant: str = "default") -> dict:
        """Get badge styling for different variants."""
        colors = get_colors()
        variants = {
            "default": {"bgcolor": colors["bg_tertiary"], "text_color": colors["text_secondary"]},
            "primary": {"bgcolor": colors["primary_subtle"], "text_color": colors["primary"]},
            "success": {"bgcolor": colors["success_subtle"], "text_color": colors["success"]},
            "warning": {"bgcolor": colors["warning_subtle"], "text_color": colors["warning"]},
            "error": {"bgcolor": colors["error_subtle"], "text_color": colors["error"]},
            "info": {"bgcolor": colors["info_subtle"], "text_color": colors["info"]},
        }
        style = variants.get(variant, variants["default"])
        return {
            "bgcolor": style["bgcolor"],
            "border_radius": RADIUS["full"],
            "padding": ft.padding.symmetric(horizontal=10, vertical=4),
        }


# ============================================================================
# MICRO-INTERACTION HELPERS
# ============================================================================
def create_hover_effect(
    control,
    hover_scale: float = 1.02,
    hover_shadow_size: str = "md",
    accent_color: Optional[str] = None
):
    """Apply standard hover effect to a control."""
    colors = get_colors()

    def on_hover(e):
        if e.data == "true":
            e.control.scale = hover_scale
            e.control.shadow = get_shadow(hover_shadow_size)
            if accent_color:
                e.control.border = ft.border.all(1, f"{accent_color}40")
        else:
            e.control.scale = 1.0
            e.control.shadow = get_shadow("xs")
            e.control.border = ft.border.all(1, colors["border"])
        e.control.update()

    control.on_hover = on_hover
    return control


def create_press_effect(control, press_scale: float = 0.98):
    """Apply press (click) effect to a control."""
    original_scale = 1.0

    def on_click(e):
        # Quick scale down then up animation
        e.control.scale = press_scale
        e.control.update()
        import time
        time.sleep(0.05)
        e.control.scale = original_scale
        e.control.update()

    return control


def get_status_style(status: str) -> dict:
    """Get complete styling for a status indicator."""
    colors = get_colors()
    color = status_color(status)
    return {
        "color": color,
        "icon": status_icon(status),
        "bgcolor": f"{color}15",
        "border_color": f"{color}30",
    }


# ============================================================================
# SKELETON LOADING COMPONENT HELPER
# ============================================================================
def create_skeleton(width: int | str = "100%", height: int = 20, border_radius: int = None) -> ft.Container:
    """Create a skeleton loading placeholder."""
    colors = get_colors()
    return ft.Container(
        width=width,
        height=height,
        bgcolor=colors["skeleton_base"],
        border_radius=border_radius or RADIUS["sm"],
        animate=ft.Animation(1000, ft.AnimationCurve.EASE_IN_OUT),
    )


# ============================================================================
# GLASSMORPHISM EFFECT HELPER
# ============================================================================
def create_glass_container(**kwargs) -> ft.Container:
    """Create a glassmorphism-styled container."""
    colors = get_colors()
    defaults = {
        "bgcolor": colors["bg_glass"],
        "border": ft.border.all(1, colors["border_light"]),
        "border_radius": RADIUS["xl"],
        "shadow": get_shadow("lg"),
    }
    defaults.update(kwargs)
    return ft.Container(**defaults)
