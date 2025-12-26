"""Professional action button components with polished transitions."""

import flet as ft
from ..theme import COLORS, ANIMATION


class ActionButton(ft.Container):
    """A modern styled action button with enhanced effects and polished transitions."""

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
        # Variant configurations with enhanced colors and refined shadows
        variants = {
            "primary": {
                "bgcolor": COLORS["primary"],
                "color": COLORS["text_primary"],
                "hover_bg": COLORS["primary_dark"],
                "active_bg": COLORS["primary_darker"],
                "shadow_color": COLORS["primary_glow"],
                "shadow_hover_color": f"{COLORS['primary']}40",
                "border_color": "transparent",
                "border_hover": f"{COLORS['primary_light']}50",
            },
            "secondary": {
                "bgcolor": COLORS["bg_tertiary"],
                "color": COLORS["text_primary"],
                "hover_bg": COLORS["bg_hover"],
                "active_bg": COLORS["bg_tertiary"],
                "shadow_color": "#00000015",
                "shadow_hover_color": "#00000025",
                "border_color": COLORS["border_light"],
                "border_hover": COLORS["border_medium"],
            },
            "success": {
                "bgcolor": COLORS["success"],
                "color": COLORS["text_primary"],
                "hover_bg": COLORS["success_dark"],
                "active_bg": COLORS["success_dark"],
                "shadow_color": COLORS["success_glow"],
                "shadow_hover_color": f"{COLORS['success']}45",
                "border_color": "transparent",
                "border_hover": f"{COLORS['success_light']}50",
            },
            "danger": {
                "bgcolor": COLORS["error"],
                "color": COLORS["text_primary"],
                "hover_bg": COLORS["error_dark"],
                "active_bg": COLORS["error_dark"],
                "shadow_color": COLORS["error_glow"],
                "shadow_hover_color": f"{COLORS['error']}45",
                "border_color": "transparent",
                "border_hover": f"{COLORS['error_light']}50",
            },
            "ghost": {
                "bgcolor": "transparent",
                "color": COLORS["text_secondary"],
                "hover_bg": COLORS["bg_tertiary"],
                "active_bg": COLORS["bg_hover"],
                "shadow_color": "transparent",
                "shadow_hover_color": "#00000010",
                "border_color": "transparent",
                "border_hover": COLORS["border_light"],
            },
            "outline": {
                "bgcolor": "transparent",
                "color": COLORS["primary"],
                "hover_bg": COLORS["primary_glow"],
                "active_bg": f"{COLORS['primary']}20",
                "shadow_color": "transparent",
                "shadow_hover_color": COLORS["primary_glow"],
                "border_color": COLORS["primary"],
                "border_hover": COLORS["primary_light"],
            },
            "warning": {
                "bgcolor": COLORS["warning"],
                "color": COLORS["text_primary"],
                "hover_bg": COLORS["warning_dark"],
                "active_bg": COLORS["warning_dark"],
                "shadow_color": COLORS["warning_glow"],
                "shadow_hover_color": f"{COLORS['warning']}45",
                "border_color": "transparent",
                "border_hover": f"{COLORS['warning_light']}50",
            },
        }
        self.style_config = variants.get(variant, variants["primary"])
        self.variant = variant
        self.disabled = disabled

        # Size configurations with better proportions
        sizes = {
            "small": {"height": 36, "font_size": 12, "padding": 16, "icon_size": 16, "radius": 10},
            "medium": {"height": 42, "font_size": 14, "padding": 20, "icon_size": 18, "radius": 12},
            "large": {"height": 50, "font_size": 15, "padding": 26, "icon_size": 20, "radius": 14},
        }
        self.size_config = sizes.get(size, sizes["medium"])

        # Store icon reference for hover effects
        self.icon_control = None
        self.text_control = None

        # Build button content
        content_items = []
        if icon:
            self.icon_control = ft.Icon(
                icon,
                size=self.size_config["icon_size"],
                color=self.style_config["color"],
            )
            content_items.append(self.icon_control)
            if text:
                content_items.append(ft.Container(width=8))

        if text:
            self.text_control = ft.Text(
                text,
                size=self.size_config["font_size"],
                weight=ft.FontWeight.W_600,
                color=self.style_config["color"],
            )
            content_items.append(self.text_control)

        # Determine initial shadow based on variant
        has_glow = variant in ["primary", "success", "danger", "warning"]
        initial_shadow = ft.BoxShadow(
            spread_radius=0,
            blur_radius=6 if has_glow else 4,
            color=self.style_config["shadow_color"],
            offset=ft.Offset(0, 4),
        ) if has_glow or variant == "secondary" else None

        super().__init__(
            content=ft.Row(
                content_items,
                alignment=ft.MainAxisAlignment.CENTER,
                spacing=0,
            ),
            height=self.size_config["height"],
            padding=ft.padding.symmetric(horizontal=self.size_config["padding"]),
            border_radius=self.size_config["radius"],
            bgcolor=self.style_config["bgcolor"],
            border=ft.border.all(1, self.style_config["border_color"]) if variant in ["outline", "secondary"] else None,
            on_click=on_click if not disabled else None,
            on_hover=self._on_hover if not disabled else None,
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT_CUBIC),
            animate_scale=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            opacity=0.5 if disabled else 1,
            expand=expand,
            shadow=initial_shadow,
            ink=not disabled,
            **kwargs
        )

    def _on_hover(self, e):
        """Handle hover effect with enhanced animations and glow effects."""
        has_glow = self.variant in ["primary", "success", "danger", "warning"]

        if e.data == "true":
            # Hover state - enhanced
            e.control.bgcolor = self.style_config["hover_bg"]
            e.control.scale = 1.02

            # Enhanced shadow on hover with moderate glow
            e.control.shadow = ft.BoxShadow(
                spread_radius=1,
                blur_radius=10 if has_glow else 8,
                color=self.style_config["shadow_hover_color"],
                offset=ft.Offset(0, 8),
            )

            # Update border on hover for outline/secondary variants
            if self.variant in ["outline", "secondary"]:
                e.control.border = ft.border.all(1, self.style_config["border_hover"])
        else:
            # Normal state
            e.control.bgcolor = self.style_config["bgcolor"]
            e.control.scale = 1.0

            # Reset shadow
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=6 if has_glow else 4,
                color=self.style_config["shadow_color"],
                offset=ft.Offset(0, 4),
            ) if has_glow or self.variant == "secondary" else None

            # Reset border
            if self.variant in ["outline", "secondary"]:
                e.control.border = ft.border.all(1, self.style_config["border_color"])

        e.control.update()


class IconButton(ft.Container):
    """A styled icon button with smooth hover effects and polished transitions."""

    def __init__(
        self,
        icon: str,
        tooltip: str = None,
        color: str = None,
        hover_color: str = None,
        size: int = 38,
        icon_size: int = 20,
        on_click=None,
        variant: str = "default",
        **kwargs
    ):
        self.default_color = color or COLORS["text_secondary"]
        self.hover_color = hover_color or COLORS["primary"]
        self._tooltip = tooltip
        self.variant = variant

        # Variant-specific hover backgrounds
        variant_configs = {
            "default": {
                "hover_bg": COLORS["bg_tertiary"],
                "hover_shadow": "#00000010",
            },
            "primary": {
                "hover_bg": COLORS["primary_glow"],
                "hover_shadow": COLORS["primary_glow"],
            },
            "danger": {
                "hover_bg": COLORS["error_glow"],
                "hover_shadow": COLORS["error_glow"],
            },
            "success": {
                "hover_bg": COLORS["success_glow"],
                "hover_shadow": COLORS["success_glow"],
            },
        }
        self.variant_config = variant_configs.get(variant, variant_configs["default"])

        self.icon_control = ft.Icon(
            icon,
            size=icon_size,
            color=self.default_color,
        )

        super().__init__(
            content=self.icon_control,
            width=size,
            height=size,
            border_radius=size // 4 + 2,  # Proportional rounded corners
            alignment=ft.alignment.center,
            on_click=on_click,
            on_hover=self._on_hover,
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT_CUBIC),
            animate_scale=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            tooltip=tooltip,
            ink=True,
            **kwargs
        )

    def _on_hover(self, e):
        """Handle hover effect with smooth color and background transitions."""
        if e.data == "true":
            e.control.bgcolor = self.variant_config["hover_bg"]
            e.control.scale = 1.08
            self.icon_control.color = self.hover_color

            # Add subtle shadow on hover
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=12,
                color=self.variant_config["hover_shadow"],
                offset=ft.Offset(0, 4),
            )
        else:
            e.control.bgcolor = "transparent"
            e.control.scale = 1.0
            self.icon_control.color = self.default_color
            e.control.shadow = None

        self.icon_control.update()
        e.control.update()


class FloatingActionButton(ft.Container):
    """A floating action button with enhanced glow effects and polished transitions."""

    def __init__(
        self,
        icon: str,
        on_click=None,
        color: str = None,
        size: str = "medium",
        tooltip: str = None,
        **kwargs
    ):
        self.base_color = color or COLORS["primary"]

        # Size configurations
        sizes = {
            "small": {"width": 48, "height": 48, "icon_size": 22, "radius": 24},
            "medium": {"width": 60, "height": 60, "icon_size": 26, "radius": 30},
            "large": {"width": 72, "height": 72, "icon_size": 32, "radius": 36},
        }
        self.size_config = sizes.get(size, sizes["medium"])

        # Calculate glow opacity based on color
        self.glow_normal = f"{self.base_color}50"
        self.glow_hover = f"{self.base_color}70"

        super().__init__(
            content=ft.Icon(
                icon,
                size=self.size_config["icon_size"],
                color=COLORS["text_primary"],
            ),
            width=self.size_config["width"],
            height=self.size_config["height"],
            border_radius=self.size_config["radius"],
            bgcolor=self.base_color,
            alignment=ft.alignment.center,
            on_click=on_click,
            on_hover=self._on_hover,
            animate=ft.Animation(ANIMATION["slow"], ft.AnimationCurve.EASE_OUT_CUBIC),
            animate_scale=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.ELASTIC_OUT),
            shadow=ft.BoxShadow(
                spread_radius=0,
                blur_radius=20,
                color=self.glow_normal,
                offset=ft.Offset(0, 6),
            ),
            tooltip=tooltip,
            ink=True,
            **kwargs
        )

    def _on_hover(self, e):
        """Handle hover effect with enhanced scale, shadow, and glow animation."""
        if e.data == "true":
            e.control.scale = 1.1
            e.control.shadow = ft.BoxShadow(
                spread_radius=2,
                blur_radius=32,
                color=self.glow_hover,
                offset=ft.Offset(0, 10),
            )
            # Subtle rotation effect could be added via transform
        else:
            e.control.scale = 1.0
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=20,
                color=self.glow_normal,
                offset=ft.Offset(0, 6),
            )
        e.control.update()


class ToggleButton(ft.Container):
    """A toggle button with smooth state transitions."""

    def __init__(
        self,
        text: str = None,
        icon: str = None,
        value: bool = False,
        on_change=None,
        size: str = "medium",
        **kwargs
    ):
        self.value = value
        self.on_change_callback = on_change

        # Size configurations
        sizes = {
            "small": {"height": 32, "font_size": 12, "padding": 12, "icon_size": 16},
            "medium": {"height": 38, "font_size": 14, "padding": 16, "icon_size": 18},
            "large": {"height": 44, "font_size": 15, "padding": 20, "icon_size": 20},
        }
        self.size_config = sizes.get(size, sizes["medium"])

        # Build content
        content_items = []
        self.icon_control = None
        self.text_control = None

        if icon:
            self.icon_control = ft.Icon(
                icon,
                size=self.size_config["icon_size"],
                color=COLORS["primary"] if value else COLORS["text_secondary"],
            )
            content_items.append(self.icon_control)
            if text:
                content_items.append(ft.Container(width=6))

        if text:
            self.text_control = ft.Text(
                text,
                size=self.size_config["font_size"],
                weight=ft.FontWeight.W_500,
                color=COLORS["primary"] if value else COLORS["text_secondary"],
            )
            content_items.append(self.text_control)

        super().__init__(
            content=ft.Row(
                content_items,
                alignment=ft.MainAxisAlignment.CENTER,
                spacing=0,
            ),
            height=self.size_config["height"],
            padding=ft.padding.symmetric(horizontal=self.size_config["padding"]),
            border_radius=10,
            bgcolor=COLORS["primary_glow"] if value else "transparent",
            border=ft.border.all(1, COLORS["primary"] if value else COLORS["border_light"]),
            on_click=self._on_click,
            on_hover=self._on_hover,
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT_CUBIC),
            **kwargs
        )

    def _on_click(self, e):
        """Toggle the button state."""
        self.value = not self.value
        self._update_appearance()
        if self.on_change_callback:
            self.on_change_callback(self.value)

    def _on_hover(self, e):
        """Handle hover effect."""
        if e.data == "true":
            e.control.scale = 1.02
            if not self.value:
                e.control.bgcolor = COLORS["bg_tertiary"]
        else:
            e.control.scale = 1.0
            if not self.value:
                e.control.bgcolor = "transparent"
        e.control.update()

    def _update_appearance(self):
        """Update button appearance based on current value."""
        if self.value:
            self.bgcolor = COLORS["primary_glow"]
            self.border = ft.border.all(1, COLORS["primary"])
            if self.icon_control:
                self.icon_control.color = COLORS["primary"]
            if self.text_control:
                self.text_control.color = COLORS["primary"]
        else:
            self.bgcolor = "transparent"
            self.border = ft.border.all(1, COLORS["border_light"])
            if self.icon_control:
                self.icon_control.color = COLORS["text_secondary"]
            if self.text_control:
                self.text_control.color = COLORS["text_secondary"]

        if self.icon_control:
            self.icon_control.update()
        if self.text_control:
            self.text_control.update()
        self.update()
