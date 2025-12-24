"""Loading and spinner components with refined animations and polish."""

import flet as ft
from ..theme import COLORS, ANIMATION, RADIUS, SHADOWS


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
        # Size configurations
        sizes = {
            "small": {"width": 24, "stroke": 2},
            "medium": {"width": 40, "stroke": 3},
            "large": {"width": 56, "stroke": 4},
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
                shadow=ft.BoxShadow(
                    spread_radius=0,
                    blur_radius=20,
                    color=f"{spinner_color}40",
                    offset=ft.Offset(0, 0),
                ),
            )
        else:
            content = spinner

        super().__init__(
            content=content,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            **kwargs
        )


class LoadingOverlay(ft.Container):
    """A full-screen loading overlay with enhanced blur and animation effects.

    Features:
    - Backdrop blur effect with smooth opacity
    - Refined card styling with gradient border
    - Optional sub-message for progress indication
    - Smooth fade-in animation
    """

    def __init__(
        self,
        message: str = "Loading...",
        sub_message: str = None,
        spinner_size: int = 50,
        **kwargs
    ):
        # Build content items
        content_items = [
            # Spinner with glow effect
            ft.Container(
                content=ft.ProgressRing(
                    width=spinner_size,
                    height=spinner_size,
                    stroke_width=4,
                    color=COLORS["primary"],
                ),
                shadow=ft.BoxShadow(
                    spread_radius=0,
                    blur_radius=24,
                    color=COLORS["primary_glow"],
                    offset=ft.Offset(0, 0),
                ),
            ),
            ft.Container(height=24),
            ft.Text(
                message,
                size=16,
                weight=ft.FontWeight.W_600,
                color=COLORS["text_primary"],
            ),
        ]

        # Add sub-message if provided
        if sub_message:
            content_items.append(ft.Container(height=8))
            content_items.append(
                ft.Text(
                    sub_message,
                    size=13,
                    color=COLORS["text_secondary"],
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
                padding=ft.padding.symmetric(horizontal=48, vertical=40),
                border=ft.border.all(1, COLORS["border_light"]),
                shadow=ft.BoxShadow(
                    spread_radius=0,
                    blur_radius=48,
                    color="#00000050",
                    offset=ft.Offset(0, 12),
                ),
                animate=ft.Animation(ANIMATION["slow"], ft.AnimationCurve.EASE_OUT),
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
    - Proper border radius handling
    """

    def __init__(
        self,
        width: int = None,
        height: int = 20,
        shape: str = "rectangle",
        animate_opacity: bool = True,
        **kwargs
    ):
        # Shape configurations
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
            animate_opacity=ft.Animation(1200, ft.AnimationCurve.EASE_IN_OUT) if animate_opacity else None,
            **kwargs
        )


class SkeletonGroup(ft.Container):
    """A group of skeleton loaders for common content patterns.

    Provides preset layouts for:
    - card: Card-like content with title, subtitle, and body
    - list_item: List item with avatar and text
    - paragraph: Multiple lines of text
    - avatar: Circular avatar placeholder
    """

    def __init__(
        self,
        preset: str = "card",
        lines: int = 3,
        **kwargs
    ):
        if preset == "card":
            content = ft.Column([
                SkeletonLoader(width=200, height=24),
                ft.Container(height=8),
                SkeletonLoader(width=150, height=16),
                ft.Container(height=16),
                SkeletonLoader(height=16),
                ft.Container(height=6),
                SkeletonLoader(height=16),
                ft.Container(height=6),
                SkeletonLoader(width=250, height=16),
            ], spacing=0)
        elif preset == "list_item":
            content = ft.Row([
                SkeletonLoader(width=48, height=48, shape="circle"),
                ft.Container(width=12),
                ft.Column([
                    SkeletonLoader(width=160, height=18),
                    ft.Container(height=6),
                    SkeletonLoader(width=100, height=14),
                ], spacing=0),
            ], spacing=0)
        elif preset == "paragraph":
            items = []
            for i in range(lines):
                if i > 0:
                    items.append(ft.Container(height=8))
                # Last line is shorter
                width = None if i < lines - 1 else 200
                items.append(SkeletonLoader(width=width, height=16))
            content = ft.Column(items, spacing=0)
        elif preset == "avatar":
            content = SkeletonLoader(width=64, height=64, shape="circle")
        else:
            content = SkeletonLoader(height=20)

        super().__init__(
            content=content,
            **kwargs
        )


class EmptyState(ft.Container):
    """An empty state component with refined styling and animations.

    Features:
    - Refined icon container with subtle gradient
    - Better typography hierarchy
    - Optional hover effects on icon
    - Smooth entrance animation support
    - Multiple visual variants
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
        # Variant configurations
        variants = {
            "default": {
                "icon_bg": COLORS["bg_tertiary"],
                "icon_border": None,
                "icon_color": COLORS["text_muted"],
            },
            "primary": {
                "icon_bg": COLORS["primary_glow"],
                "icon_border": ft.border.all(1, f"{COLORS['primary']}30"),
                "icon_color": COLORS["primary"],
            },
            "warning": {
                "icon_bg": COLORS["warning_glow"],
                "icon_border": ft.border.all(1, f"{COLORS['warning']}30"),
                "icon_color": COLORS["warning"],
            },
            "error": {
                "icon_bg": COLORS["error_glow"],
                "icon_border": ft.border.all(1, f"{COLORS['error']}30"),
                "icon_color": COLORS["error"],
            },
        }
        variant_config = variants.get(variant, variants["default"])

        # Size adjustments for compact mode
        icon_container_size = 100 if compact else 120
        icon_size = 48 if compact else 64
        title_size = 18 if compact else 20
        padding_size = 40 if compact else 60

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
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            shadow=ft.BoxShadow(
                spread_radius=0,
                blur_radius=16,
                color=f"{variant_config['icon_color']}15",
                offset=ft.Offset(0, 4),
            ) if variant != "default" else None,
        )

        content_items = [
            icon_container,
            ft.Container(height=20 if compact else 24),
            ft.Text(
                title,
                size=title_size,
                weight=ft.FontWeight.W_700,
                color=COLORS["text_primary"],
                text_align=ft.TextAlign.CENTER,
            ),
        ]

        if description:
            content_items.append(ft.Container(height=8))
            content_items.append(
                ft.Text(
                    description,
                    size=14,
                    color=COLORS["text_secondary"],
                    text_align=ft.TextAlign.CENTER,
                    max_lines=3,
                )
            )

        if action_button:
            content_items.append(ft.Container(height=20 if compact else 24))
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
        spacing: int = 6,
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
                animate_opacity=ft.Animation(600, ft.AnimationCurve.EASE_IN_OUT),
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
            content_items.append(ft.Container(width=8))
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
            # Progress bar
            content_items.append(
                ft.Container(
                    content=ft.ProgressBar(
                        value=progress,
                        color=COLORS["primary"],
                        bgcolor=COLORS["bg_tertiary"],
                    ),
                    width=240,
                    border_radius=RADIUS["full"],
                    clip_behavior=ft.ClipBehavior.ANTI_ALIAS,
                )
            )
            content_items.append(ft.Container(height=12))
            content_items.append(
                ft.Text(
                    f"{int(progress * 100)}%",
                    size=24,
                    weight=ft.FontWeight.W_700,
                    color=COLORS["primary"],
                )
            )
        else:
            # Indeterminate spinner
            content_items.append(
                ft.Container(
                    content=ft.ProgressRing(
                        width=48,
                        height=48,
                        stroke_width=4,
                        color=COLORS["primary"],
                    ),
                    shadow=ft.BoxShadow(
                        spread_radius=0,
                        blur_radius=20,
                        color=COLORS["primary_glow"],
                        offset=ft.Offset(0, 0),
                    ),
                )
            )

        content_items.append(ft.Container(height=20))
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
            content_items.append(ft.Container(height=20))
            content_items.append(
                ft.TextButton(
                    "Cancel",
                    on_click=on_cancel,
                    style=ft.ButtonStyle(
                        color=COLORS["text_secondary"],
                    ),
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
                padding=ft.padding.symmetric(horizontal=48, vertical=36),
                border=ft.border.all(1, COLORS["border_light"]),
                shadow=ft.BoxShadow(
                    spread_radius=0,
                    blur_radius=48,
                    color="#00000050",
                    offset=ft.Offset(0, 12),
                ),
            ),
            bgcolor=COLORS["backdrop"],
            alignment=ft.alignment.center,
            expand=True,
            **kwargs
        )
