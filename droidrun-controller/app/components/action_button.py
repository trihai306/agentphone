"""Professional action button components."""

import flet as ft
from ..theme import COLORS


class ActionButton(ft.Container):
    """A modern styled action button with enhanced effects."""

    def __init__(
        self,
        text: str,
        icon: str = None,
        variant: str = "primary",
        size: str = "medium",
        on_click=None,
        disabled: bool = False,
        expand: bool = False,
        **kwargs
    ):
        # Variant configurations with enhanced colors
        variants = {
            "primary": {
                "bgcolor": COLORS["primary"],
                "color": COLORS["text_primary"],
                "hover_bg": COLORS["primary_dark"],
                "shadow_color": COLORS["primary_glow"],
            },
            "secondary": {
                "bgcolor": COLORS["bg_tertiary"],
                "color": COLORS["text_primary"],
                "hover_bg": COLORS["bg_hover"],
                "shadow_color": "#00000030",
            },
            "success": {
                "bgcolor": COLORS["success"],
                "color": COLORS["text_primary"],
                "hover_bg": COLORS["success_dark"],
                "shadow_color": COLORS["success_glow"],
            },
            "danger": {
                "bgcolor": COLORS["error"],
                "color": COLORS["text_primary"],
                "hover_bg": COLORS["error_dark"],
                "shadow_color": COLORS["error_glow"],
            },
            "ghost": {
                "bgcolor": "transparent",
                "color": COLORS["text_secondary"],
                "hover_bg": COLORS["bg_tertiary"],
                "shadow_color": "#00000020",
            },
            "outline": {
                "bgcolor": "transparent",
                "color": COLORS["primary"],
                "hover_bg": COLORS["primary_glow"],
                "shadow_color": COLORS["primary_glow"],
            },
            "warning": {
                "bgcolor": COLORS["warning"],
                "color": COLORS["text_primary"],
                "hover_bg": COLORS["warning_dark"],
                "shadow_color": COLORS["warning_glow"],
            },
        }
        self.style_config = variants.get(variant, variants["primary"])
        self.variant = variant

        # Size configurations with better proportions
        sizes = {
            "small": {"height": 36, "font_size": 12, "padding": 16, "icon_size": 16},
            "medium": {"height": 42, "font_size": 14, "padding": 20, "icon_size": 18},
            "large": {"height": 50, "font_size": 15, "padding": 26, "icon_size": 20},
        }
        size_config = sizes.get(size, sizes["medium"])

        # Build button content
        content_items = []
        if icon:
            content_items.append(
                ft.Icon(
                    icon,
                    size=size_config["icon_size"],
                    color=self.style_config["color"],
                )
            )
            if text:
                content_items.append(ft.Container(width=10))

        if text:
            content_items.append(
                ft.Text(
                    text,
                    size=size_config["font_size"],
                    weight=ft.FontWeight.W_600,
                    color=self.style_config["color"],
                )
            )

        super().__init__(
            content=ft.Row(
                content_items,
                alignment=ft.MainAxisAlignment.CENTER,
                spacing=0,
            ),
            height=size_config["height"],
            padding=ft.padding.symmetric(horizontal=size_config["padding"]),
            border_radius=12,
            bgcolor=self.style_config["bgcolor"],
            border=ft.border.all(1, COLORS["border_light"]) if variant == "outline" else None,
            on_click=on_click if not disabled else None,
            on_hover=self._on_hover if not disabled else None,
            animate=ft.Animation(200, ft.AnimationCurve.EASE_OUT),
            opacity=0.5 if disabled else 1,
            expand=expand,
            shadow=ft.BoxShadow(
                spread_radius=0,
                blur_radius=16,
                color=self.style_config["shadow_color"],
                offset=ft.Offset(0, 4),
            ) if variant in ["primary", "success", "danger", "warning"] else None,
            **kwargs
        )

    def _on_hover(self, e):
        """Handle hover effect with enhanced animations."""
        if e.data == "true":
            e.control.bgcolor = self.style_config["hover_bg"]
            e.control.scale = 1.02
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=24,
                color=self.style_config["shadow_color"],
                offset=ft.Offset(0, 8),
            )
        else:
            e.control.bgcolor = self.style_config["bgcolor"]
            e.control.scale = 1.0
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=16,
                color=self.style_config["shadow_color"],
                offset=ft.Offset(0, 4),
            ) if self.variant in ["primary", "success", "danger", "warning"] else None
        e.control.update()


class IconButton(ft.Container):
    """A styled icon button with smooth hover effects."""

    def __init__(
        self,
        icon: str,
        tooltip: str = None,
        color: str = None,
        size: int = 38,
        icon_size: int = 20,
        on_click=None,
        **kwargs
    ):
        self.default_color = color or COLORS["text_secondary"]
        self.hover_color = COLORS["primary"]
        self._tooltip = tooltip

        self.icon_control = ft.Icon(
            icon,
            size=icon_size,
            color=self.default_color,
        )

        super().__init__(
            content=self.icon_control,
            width=size,
            height=size,
            border_radius=10,
            alignment=ft.alignment.center,
            on_click=on_click,
            on_hover=self._on_hover,
            animate=ft.Animation(200, ft.AnimationCurve.EASE_OUT),
            tooltip=tooltip,
            **kwargs
        )

    def _on_hover(self, e):
        """Handle hover effect with color change."""
        if e.data == "true":
            e.control.bgcolor = COLORS["bg_tertiary"]
            e.control.scale = 1.05
            self.icon_control.color = self.hover_color
        else:
            e.control.bgcolor = "transparent"
            e.control.scale = 1.0
            self.icon_control.color = self.default_color
        e.control.update()


class FloatingActionButton(ft.Container):
    """A floating action button with glow effects."""

    def __init__(
        self,
        icon: str,
        on_click=None,
        color: str = None,
        **kwargs
    ):
        color = color or COLORS["primary"]

        super().__init__(
            content=ft.Icon(
                icon,
                size=26,
                color=COLORS["text_primary"],
            ),
            width=60,
            height=60,
            border_radius=30,
            bgcolor=color,
            alignment=ft.alignment.center,
            on_click=on_click,
            on_hover=self._on_hover,
            animate=ft.Animation(250, ft.AnimationCurve.EASE_OUT),
            shadow=ft.BoxShadow(
                spread_radius=0,
                blur_radius=20,
                color=f"{color}60",
                offset=ft.Offset(0, 6),
            ),
            **kwargs
        )
        self.base_color = color

    def _on_hover(self, e):
        """Handle hover effect with scale and shadow."""
        if e.data == "true":
            e.control.scale = 1.08
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=28,
                color=f"{self.base_color}80",
                offset=ft.Offset(0, 10),
            )
        else:
            e.control.scale = 1.0
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=20,
                color=f"{self.base_color}60",
                offset=ft.Offset(0, 6),
            )
        e.control.update()
