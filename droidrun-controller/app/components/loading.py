"""Loading and spinner components with refined animations and polish.

Enhanced with improved shadows, better visual hierarchy, and smoother animations.
"""

import flet as ft
from ..theme import COLORS, ANIMATION, RADIUS, get_shadow


class LoadingSpinner(ft.Container):
    """A modern loading spinner with enhanced styling and glow effects.

    Features:
    - Multiple size variants (small, medium, large)
    - Optional glow effect for visual emphasis
    - Customizable colors
    - Smooth animations
    """

    def __init__(
        self,
        size: str = "medium",
        color: str = None,
        show_glow: bool = False,
        **kwargs
    ):
        # Size configurations with refined proportions
        sizes = {
            "small": {"width": 24, "stroke": 2, "glow_radius": 8},
            "medium": {"width": 40, "stroke": 3, "glow_radius": 12},
            "large": {"width": 56, "stroke": 4, "glow_radius": 16},
            "xlarge": {"width": 72, "stroke": 5, "glow_radius": 20},
        }
        size_config = sizes.get(size, sizes["medium"])

        spinner_color = color or COLORS["primary"]
        spinner_size = size_config["width"]

        spinner = ft.ProgressRing(
            width=spinner_size,
            height=spinner_size,
            stroke_width=size_config["stroke"],
            color=spinner_color,
        )

        # Wrap with glow effect if enabled
        if show_glow:
            content = ft.Container(
                content=spinner,
                width=spinner_size + 20,
                height=spinner_size + 20,
                alignment=ft.alignment.center,
                shadow=ft.BoxShadow(
                    spread_radius=0,
                    blur_radius=size_config["glow_radius"],
                    color=f"{spinner_color}20",
                    offset=ft.Offset(0, 0),
                ),
            )
        else:
            content = spinner

        super().__init__(
            content=content,
            alignment=ft.alignment.center,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            **kwargs
        )


class LoadingOverlay(ft.Container):
    """A full-screen loading overlay with enhanced blur and animation effects.

    Features:
    - Backdrop blur effect with smooth opacity
    - Refined card styling with subtle border
    - Optional sub-message for progress indication
    - Smooth fade-in animation
    - Spinner with glow effect for visual focus
    """

    def __init__(
        self,
        message: str = "Loading...",
        sub_message: str = None,
        spinner_size: int = 48,
        show_spinner_glow: bool = True,
        **kwargs
    ):
        spinner_color = COLORS["primary"]

        # Build spinner with enhanced glow container
        spinner_content = ft.ProgressRing(
            width=spinner_size,
            height=spinner_size,
            stroke_width=4,
            color=spinner_color,
        )

        if show_spinner_glow:
            spinner_container = ft.Container(
                content=spinner_content,
                width=spinner_size + 32,
                height=spinner_size + 32,
                alignment=ft.alignment.center,
                border_radius=RADIUS["full"],
                bgcolor=f"{spinner_color}08",
                border=ft.border.all(1, f"{spinner_color}12"),
                shadow=ft.BoxShadow(
                    spread_radius=0,
                    blur_radius=16,
                    color=f"{spinner_color}18",
                    offset=ft.Offset(0, 0),
                ),
            )
        else:
            spinner_container = ft.Container(
                content=spinner_content,
                shadow=ft.BoxShadow(
                    spread_radius=0,
                    blur_radius=12,
                    color=COLORS["primary_glow"],
                    offset=ft.Offset(0, 0),
                ),
            )

        # Build content items
        content_items = [
            spinner_container,
            ft.Container(height=28),
            ft.Text(
                message,
                size=17,
                weight=ft.FontWeight.W_600,
                color=COLORS["text_primary"],
                text_align=ft.TextAlign.CENTER,
            ),
        ]

        # Add sub-message if provided
        if sub_message:
            content_items.append(ft.Container(height=8))
            content_items.append(
                ft.Text(
                    sub_message,
                    size=13,
                    weight=ft.FontWeight.W_400,
                    color=COLORS["text_muted"],
                    text_align=ft.TextAlign.CENTER,
                )
            )

        super().__init__(
            content=ft.Container(
                content=ft.Column(
                    content_items,
                    horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                    spacing=0,
                ),
                bgcolor=COLORS["bg_card"],
                border_radius=RADIUS["xl"],
                padding=ft.padding.symmetric(horizontal=52, vertical=44),
                border=ft.border.all(1, COLORS["border"]),
                shadow=ft.BoxShadow(
                    spread_radius=0,
                    blur_radius=20,
                    color="#00000020",
                    offset=ft.Offset(0, 8),
                ),
                animate=ft.Animation(ANIMATION["slow"], ft.AnimationCurve.EASE_OUT),
                animate_scale=ft.Animation(ANIMATION["slow"], ft.AnimationCurve.EASE_OUT),
            ),
            bgcolor=COLORS["backdrop"],
            alignment=ft.alignment.center,
            expand=True,
            animate_opacity=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            **kwargs
        )


class SkeletonLoader(ft.Container):
    """A skeleton loader with shimmer animation effect.

    Features:
    - Smooth shimmer/pulse animation
    - Multiple shape variants (rectangle, circle, text)
    - Customizable dimensions
    - Theme-aware colors
    """

    def __init__(
        self,
        width: int = None,
        height: int = 20,
        shape: str = "rectangle",
        animate_opacity: bool = True,
        **kwargs
    ):
        # Shape configurations with refined border radii
        if shape == "circle":
            # For circle, use the larger dimension
            size = max(width or height, height)
            border_radius = size // 2
            actual_width = size
            actual_height = size
        elif shape == "text":
            # Text placeholder - slightly rounded
            border_radius = RADIUS["xs"]
            actual_width = width
            actual_height = height or 16
        elif shape == "rounded":
            # More rounded rectangle
            border_radius = RADIUS["md"]
            actual_width = width
            actual_height = height
        else:
            # Rectangle - default
            border_radius = RADIUS["sm"]
            actual_width = width
            actual_height = height

        # Use skeleton colors from theme
        base_color = COLORS.get("skeleton_base", COLORS["bg_tertiary"])

        super().__init__(
            width=actual_width,
            height=actual_height,
            bgcolor=base_color,
            border_radius=border_radius,
            animate=ft.Animation(ANIMATION["slow"], ft.AnimationCurve.EASE_IN_OUT),
            animate_opacity=ft.Animation(1400, ft.AnimationCurve.EASE_IN_OUT) if animate_opacity else None,
            **kwargs
        )


class SkeletonGroup(ft.Container):
    """A group of skeleton loaders for common content patterns.

    Provides preset layouts for:
    - card: Card-like content with title, subtitle, and body
    - list_item: List item with avatar and text
    - paragraph: Multiple lines of text
    - avatar: Circular avatar placeholder
    - stats: Stats card skeleton
    """

    def __init__(
        self,
        preset: str = "card",
        lines: int = 3,
        **kwargs
    ):
        if preset == "card":
            content = ft.Column([
                SkeletonLoader(width=200, height=24, shape="rounded"),
                ft.Container(height=10),
                SkeletonLoader(width=140, height=16),
                ft.Container(height=18),
                SkeletonLoader(height=16),
                ft.Container(height=8),
                SkeletonLoader(height=16),
                ft.Container(height=8),
                SkeletonLoader(width=220, height=16),
            ], spacing=0)
        elif preset == "list_item":
            content = ft.Row([
                SkeletonLoader(width=48, height=48, shape="circle"),
                ft.Container(width=14),
                ft.Column([
                    SkeletonLoader(width=160, height=18, shape="rounded"),
                    ft.Container(height=8),
                    SkeletonLoader(width=100, height=14),
                ], spacing=0, expand=True),
            ], spacing=0, vertical_alignment=ft.CrossAxisAlignment.CENTER)
        elif preset == "paragraph":
            items = []
            for i in range(lines):
                if i > 0:
                    items.append(ft.Container(height=10))
                # Last line is shorter for natural look
                width = None if i < lines - 1 else 180
                items.append(SkeletonLoader(width=width, height=16))
            content = ft.Column(items, spacing=0)
        elif preset == "avatar":
            content = SkeletonLoader(width=64, height=64, shape="circle")
        elif preset == "stats":
            content = ft.Column([
                ft.Row([
                    SkeletonLoader(width=48, height=48, shape="rounded"),
                    ft.Container(expand=True),
                ]),
                ft.Container(height=20),
                SkeletonLoader(width=80, height=36, shape="rounded"),
                ft.Container(height=10),
                SkeletonLoader(width=120, height=16),
            ], spacing=0)
        else:
            content = SkeletonLoader(height=20)

        super().__init__(
            content=content,
            **kwargs
        )


class EmptyState(ft.Container):
    """An empty state component with refined styling and animations.

    Features:
    - Refined icon container with subtle border and shadow
    - Better typography hierarchy
    - Multiple visual variants (default, primary, warning, error)
    - Compact mode for smaller spaces
    - Smooth entrance animation support
    """

    def __init__(
        self,
        icon: str = ft.Icons.INBOX_OUTLINED,
        title: str = "No data available",
        description: str = None,
        action_button: ft.Control = None,
        variant: str = "default",
        compact: bool = False,
        **kwargs
    ):
        # Variant configurations with refined colors
        variants = {
            "default": {
                "icon_bg": COLORS["bg_tertiary"],
                "icon_border": ft.border.all(1, COLORS["border_light"]),
                "icon_color": COLORS["text_muted"],
                "icon_shadow": None,
            },
            "primary": {
                "icon_bg": f"{COLORS['primary']}12",
                "icon_border": ft.border.all(1, f"{COLORS['primary']}20"),
                "icon_color": COLORS["primary"],
                "icon_shadow": ft.BoxShadow(
                    spread_radius=0,
                    blur_radius=8,
                    color=f"{COLORS['primary']}12",
                    offset=ft.Offset(0, 4),
                ),
            },
            "success": {
                "icon_bg": f"{COLORS['success']}12",
                "icon_border": ft.border.all(1, f"{COLORS['success']}20"),
                "icon_color": COLORS["success"],
                "icon_shadow": ft.BoxShadow(
                    spread_radius=0,
                    blur_radius=8,
                    color=f"{COLORS['success']}12",
                    offset=ft.Offset(0, 4),
                ),
            },
            "warning": {
                "icon_bg": f"{COLORS['warning']}12",
                "icon_border": ft.border.all(1, f"{COLORS['warning']}20"),
                "icon_color": COLORS["warning"],
                "icon_shadow": ft.BoxShadow(
                    spread_radius=0,
                    blur_radius=8,
                    color=f"{COLORS['warning']}12",
                    offset=ft.Offset(0, 4),
                ),
            },
            "error": {
                "icon_bg": f"{COLORS['error']}12",
                "icon_border": ft.border.all(1, f"{COLORS['error']}20"),
                "icon_color": COLORS["error"],
                "icon_shadow": ft.BoxShadow(
                    spread_radius=0,
                    blur_radius=8,
                    color=f"{COLORS['error']}12",
                    offset=ft.Offset(0, 4),
                ),
            },
            "info": {
                "icon_bg": f"{COLORS['info']}12",
                "icon_border": ft.border.all(1, f"{COLORS['info']}20"),
                "icon_color": COLORS["info"],
                "icon_shadow": ft.BoxShadow(
                    spread_radius=0,
                    blur_radius=8,
                    color=f"{COLORS['info']}12",
                    offset=ft.Offset(0, 4),
                ),
            },
        }
        variant_config = variants.get(variant, variants["default"])

        # Size adjustments for compact mode
        icon_container_size = 96 if compact else 120
        icon_size = 44 if compact else 56
        title_size = 17 if compact else 20
        desc_size = 13 if compact else 14
        padding_size = 36 if compact else 56

        # Build the icon container with enhanced styling
        icon_container = ft.Container(
            content=ft.Icon(
                icon,
                size=icon_size,
                color=variant_config["icon_color"],
            ),
            width=icon_container_size,
            height=icon_container_size,
            border_radius=icon_container_size // 2,
            bgcolor=variant_config["icon_bg"],
            border=variant_config["icon_border"],
            alignment=ft.alignment.center,
            shadow=variant_config["icon_shadow"],
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
        )

        content_items = [
            icon_container,
            ft.Container(height=20 if compact else 28),
            ft.Text(
                title,
                size=title_size,
                weight=ft.FontWeight.W_700,
                color=COLORS["text_primary"],
                text_align=ft.TextAlign.CENTER,
            ),
        ]

        if description:
            content_items.append(ft.Container(height=10))
            content_items.append(
                ft.Container(
                    content=ft.Text(
                        description,
                        size=desc_size,
                        weight=ft.FontWeight.W_400,
                        color=COLORS["text_secondary"],
                        text_align=ft.TextAlign.CENTER,
                        max_lines=3,
                    ),
                    width=340,
                )
            )

        if action_button:
            content_items.append(ft.Container(height=20 if compact else 28))
            content_items.append(action_button)

        super().__init__(
            content=ft.Column(
                content_items,
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                spacing=0,
            ),
            alignment=ft.alignment.center,
            padding=padding_size,
            animate=ft.Animation(ANIMATION["slow"], ft.AnimationCurve.EASE_OUT),
            **kwargs
        )


class LoadingDots(ft.Container):
    """A loading indicator with animated dots.

    Features:
    - Three-dot animation pattern
    - Customizable colors and sizes
    - Smooth wave animation effect
    """

    def __init__(
        self,
        size: int = 8,
        color: str = None,
        spacing: int = 8,
        **kwargs
    ):
        dot_color = color or COLORS["primary"]

        dots = []
        for i in range(3):
            dot = ft.Container(
                width=size,
                height=size,
                border_radius=size // 2,
                bgcolor=dot_color,
                animate_opacity=ft.Animation(700, ft.AnimationCurve.EASE_IN_OUT),
                opacity=0.3 + (i * 0.25),  # Staggered opacity for wave effect
            )
            dots.append(dot)

        super().__init__(
            content=ft.Row(
                dots,
                spacing=spacing,
                alignment=ft.MainAxisAlignment.CENTER,
            ),
            **kwargs
        )


class InlineLoader(ft.Container):
    """A compact inline loading indicator.

    Features:
    - Minimal footprint for inline use
    - Optional text label
    - Subtle styling
    """

    def __init__(
        self,
        text: str = None,
        size: int = 16,
        color: str = None,
        **kwargs
    ):
        spinner_color = color or COLORS["primary"]

        content_items = [
            ft.ProgressRing(
                width=size,
                height=size,
                stroke_width=2,
                color=spinner_color,
            ),
        ]

        if text:
            content_items.append(ft.Container(width=10))
            content_items.append(
                ft.Text(
                    text,
                    size=13,
                    color=COLORS["text_secondary"],
                    weight=ft.FontWeight.W_500,
                )
            )

        super().__init__(
            content=ft.Row(
                content_items,
                spacing=0,
                alignment=ft.MainAxisAlignment.CENTER,
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            **kwargs
        )


class ProgressOverlay(ft.Container):
    """A loading overlay with progress indication.

    Features:
    - Progress bar with percentage
    - Status message updates
    - Cancel button support
    - Smooth animations
    """

    def __init__(
        self,
        message: str = "Processing...",
        progress: float = None,
        on_cancel=None,
        **kwargs
    ):
        # Build content items
        content_items = []

        # Spinner or progress indicator
        if progress is not None:
            # Progress bar with refined styling
            progress_value = max(0.0, min(1.0, progress))
            content_items.append(
                ft.Container(
                    content=ft.ProgressBar(
                        value=progress_value,
                        color=COLORS["primary"],
                        bgcolor=COLORS.get("skeleton_base", COLORS["bg_tertiary"]),
                    ),
                    width=260,
                    height=8,
                    border_radius=RADIUS["full"],
                    clip_behavior=ft.ClipBehavior.ANTI_ALIAS,
                )
            )
            content_items.append(ft.Container(height=16))
            content_items.append(
                ft.Text(
                    f"{int(progress_value * 100)}%",
                    size=28,
                    weight=ft.FontWeight.W_700,
                    color=COLORS["primary"],
                )
            )
        else:
            # Indeterminate spinner with glow
            content_items.append(
                ft.Container(
                    content=ft.ProgressRing(
                        width=48,
                        height=48,
                        stroke_width=4,
                        color=COLORS["primary"],
                    ),
                    width=72,
                    height=72,
                    alignment=ft.alignment.center,
                    border_radius=RADIUS["full"],
                    bgcolor=f"{COLORS['primary']}08",
                    shadow=ft.BoxShadow(
                        spread_radius=0,
                        blur_radius=12,
                        color=COLORS["primary_glow"],
                        offset=ft.Offset(0, 0),
                    ),
                )
            )

        content_items.append(ft.Container(height=24))
        content_items.append(
            ft.Text(
                message,
                size=15,
                weight=ft.FontWeight.W_500,
                color=COLORS["text_primary"],
                text_align=ft.TextAlign.CENTER,
            )
        )

        # Cancel button if handler provided
        if on_cancel:
            content_items.append(ft.Container(height=24))
            content_items.append(
                ft.Container(
                    content=ft.Text(
                        "Cancel",
                        size=13,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["text_secondary"],
                    ),
                    padding=ft.padding.symmetric(horizontal=20, vertical=10),
                    border_radius=RADIUS["md"],
                    bgcolor=COLORS["bg_hover"],
                    border=ft.border.all(1, COLORS["border"]),
                    on_click=on_cancel,
                    ink=True,
                    ink_color=f"{COLORS['text_secondary']}10",
                    animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                )
            )

        super().__init__(
            content=ft.Container(
                content=ft.Column(
                    content_items,
                    horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                    spacing=0,
                ),
                bgcolor=COLORS["bg_card"],
                border_radius=RADIUS["xl"],
                padding=ft.padding.symmetric(horizontal=52, vertical=40),
                border=ft.border.all(1, COLORS["border"]),
                shadow=ft.BoxShadow(
                    spread_radius=0,
                    blur_radius=20,
                    color="#00000020",
                    offset=ft.Offset(0, 8),
                ),
                animate=ft.Animation(ANIMATION["slow"], ft.AnimationCurve.EASE_OUT),
            ),
            bgcolor=COLORS["backdrop"],
            alignment=ft.alignment.center,
            expand=True,
            animate_opacity=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            **kwargs
        )
