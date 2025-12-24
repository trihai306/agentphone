"""Empty state component with polished styling.

Refined with improved icon container, better visual balance, professional button styling,
semantic variants, and smooth entrance animations.
"""

import flet as ft
from ..theme import COLORS, RADIUS, SPACING, ANIMATION, get_shadow


class EmptyState(ft.Container):
    """An empty state placeholder with enhanced visual styling.

    Features:
    - Polished icon container with subtle border, shadow, and glow effects
    - Semantic variants (default, primary, success, warning, error, info)
    - Refined typography with proper visual hierarchy
    - Professional action button with hover feedback and glow effect
    - Improved spacing and visual balance
    - Smooth entrance animations
    """

    def __init__(
        self,
        title: str,
        message: str,
        icon: str = ft.Icons.INBOX_OUTLINED,
        icon_color: str = None,
        action_text: str = None,
        on_action=None,
        size: str = "medium",
        variant: str = "default",
        **kwargs
    ):
        # Size configurations for different contexts
        sizes = {
            "small": {
                "icon_size": 48,
                "icon_container_size": 88,
                "icon_padding": 20,
                "title_size": 16,
                "message_size": 13,
                "outer_padding": 40,
                "icon_title_gap": 16,
                "title_message_gap": 6,
                "message_button_gap": 20,
            },
            "medium": {
                "icon_size": 56,
                "icon_container_size": 104,
                "icon_padding": 24,
                "title_size": 18,
                "message_size": 14,
                "outer_padding": 60,
                "icon_title_gap": 20,
                "title_message_gap": 8,
                "message_button_gap": 24,
            },
            "large": {
                "icon_size": 64,
                "icon_container_size": 120,
                "icon_padding": 28,
                "title_size": 20,
                "message_size": 15,
                "outer_padding": 80,
                "icon_title_gap": 24,
                "title_message_gap": 10,
                "message_button_gap": 28,
            },
        }
        config = sizes.get(size, sizes["medium"])

        # Semantic variant configurations for different contexts
        variants = {
            "default": {
                "icon_bg": COLORS["bg_tertiary"],
                "icon_border": f"{COLORS['border']}60",
                "icon_color": COLORS["text_muted"],
                "icon_shadow_color": f"{COLORS['text_muted']}12",
            },
            "primary": {
                "icon_bg": f"{COLORS['primary']}12",
                "icon_border": f"{COLORS['primary']}25",
                "icon_color": COLORS["primary"],
                "icon_shadow_color": f"{COLORS['primary']}20",
            },
            "success": {
                "icon_bg": f"{COLORS['success']}12",
                "icon_border": f"{COLORS['success']}25",
                "icon_color": COLORS["success"],
                "icon_shadow_color": f"{COLORS['success']}20",
            },
            "warning": {
                "icon_bg": f"{COLORS['warning']}12",
                "icon_border": f"{COLORS['warning']}25",
                "icon_color": COLORS["warning"],
                "icon_shadow_color": f"{COLORS['warning']}20",
            },
            "error": {
                "icon_bg": f"{COLORS['error']}12",
                "icon_border": f"{COLORS['error']}25",
                "icon_color": COLORS["error"],
                "icon_shadow_color": f"{COLORS['error']}20",
            },
            "info": {
                "icon_bg": f"{COLORS['info']}12",
                "icon_border": f"{COLORS['info']}25",
                "icon_color": COLORS["info"],
                "icon_shadow_color": f"{COLORS['info']}20",
            },
        }
        variant_config = variants.get(variant, variants["default"])

        # Determine icon color - custom color takes precedence over variant
        resolved_icon_color = icon_color or variant_config["icon_color"]
        resolved_icon_bg = COLORS["bg_tertiary"] if icon_color else variant_config["icon_bg"]
        resolved_icon_border = f"{COLORS['border']}60" if icon_color else variant_config["icon_border"]
        resolved_shadow_color = f"{COLORS['text_muted']}12" if icon_color else variant_config["icon_shadow_color"]

        # Build polished icon container with subtle border, shadow, and glow
        icon_container = ft.Container(
            content=ft.Icon(
                icon,
                size=config["icon_size"],
                color=resolved_icon_color,
            ),
            width=config["icon_container_size"],
            height=config["icon_container_size"],
            border_radius=config["icon_container_size"] // 2,
            bgcolor=resolved_icon_bg,
            border=ft.border.all(1, resolved_icon_border),
            alignment=ft.alignment.center,
            shadow=ft.BoxShadow(
                spread_radius=0,
                blur_radius=24,
                color=resolved_shadow_color,
                offset=ft.Offset(0, 8),
            ),
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
        )

        # Build content items with refined spacing
        content_items = [
            icon_container,
            ft.Container(height=config["icon_title_gap"]),
            ft.Text(
                title,
                size=config["title_size"],
                weight=ft.FontWeight.W_600,
                color=COLORS["text_primary"],
                text_align=ft.TextAlign.CENTER,
            ),
            ft.Container(height=config["title_message_gap"]),
            ft.Container(
                content=ft.Text(
                    message,
                    size=config["message_size"],
                    color=COLORS["text_secondary"],
                    text_align=ft.TextAlign.CENTER,
                    height=1.5,
                ),
                width=400,  # Constrain message width for better readability
            ),
        ]

        # Add action button with polished styling
        if action_text and on_action:
            content_items.append(ft.Container(height=config["message_button_gap"]))
            content_items.append(
                ft.Container(
                    content=ft.Text(
                        action_text,
                        size=14,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["text_inverse"],
                    ),
                    padding=ft.padding.symmetric(horizontal=24, vertical=12),
                    border_radius=RADIUS["md"],
                    bgcolor=COLORS["primary"],
                    border=ft.border.all(1, f"{COLORS['primary_dark']}80"),
                    shadow=ft.BoxShadow(
                        spread_radius=0,
                        blur_radius=20,
                        color=COLORS.get("primary_glow", f"{COLORS['primary']}25"),
                        offset=ft.Offset(0, 6),
                    ),
                    on_click=on_action,
                    ink=True,
                    ink_color=f"{COLORS['text_inverse']}20",
                    animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
                )
            )

        super().__init__(
            content=ft.Column(
                content_items,
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                spacing=0,
            ),
            padding=config["outer_padding"],
            alignment=ft.alignment.center,
            expand=True,
            animate=ft.Animation(ANIMATION["slow"], ft.AnimationCurve.EASE_OUT),
            animate_opacity=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            **kwargs
        )
