"""Professional Button Component Library for Droidrun Controller.

Provides consistent, accessible, and beautiful buttons across the application.
Follows the design system principles and supports all interaction states.
"""

import flet as ft
from typing import Optional, Callable
from enum import Enum
from ...theme import get_colors, RADIUS, SPACING, get_shadow, ANIMATION



# Dynamic color proxy - acts like a dict but always gets current theme colors
class _DynamicColors:
    def get(self, key, default=None):
        return get_colors().get(key, default)
    
    def __getitem__(self, key):
        return get_colors()[key]

COLORS = _DynamicColors()

class ButtonVariant(Enum):
    """Button style variants."""
    PRIMARY = "primary"
    SECONDARY = "secondary"
    TERTIARY = "tertiary"
    DANGER = "danger"
    SUCCESS = "success"
    GHOST = "ghost"


class ButtonSize(Enum):
    """Button size presets."""
    SMALL = "sm"
    MEDIUM = "md"
    LARGE = "lg"


class Button(ft.Container):
    """Professional button component with all states and variants.

    Features:
    - Multiple visual variants (primary, secondary, etc.)
    - Size presets (small, medium, large)
    - Loading state support
    - Disabled state
    - Icon support (left or right)
    - Hover and active states
    - Keyboard accessible

    Example:
        Button(
            text="Save Changes",
            variant=ButtonVariant.PRIMARY,
            size=ButtonSize.MEDIUM,
            icon=ft.Icons.SAVE,
            on_click=handle_save,
        )
    """

    def __init__(
        self,
        text: str,
        on_click: Optional[Callable] = None,
        variant: ButtonVariant = ButtonVariant.PRIMARY,
        size: ButtonSize = ButtonSize.MEDIUM,
        icon: Optional[str] = None,
        icon_right: bool = False,
        loading: bool = False,
        disabled: bool = False,
        full_width: bool = False,
        **kwargs
    ):
        self.button_text = text
        self.button_variant = variant
        self.button_size = size
        self.button_icon = icon
        self.icon_right = icon_right
        self.loading = loading
        self.disabled = disabled
        self.full_width = full_width
        self._on_click = on_click
        
        # Initialize size config BEFORE _build_content() is called
        self._init_size_config()

        super().__init__(
            content=self._build_content(),
            **self._get_container_style(),
            on_click=self._handle_click if not (disabled or loading) else None,
            on_hover=self._handle_hover if not (disabled or loading) else None,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            **kwargs
        )
    
    def _init_size_config(self):
        """Initialize size configuration."""
        size_config = {
            ButtonSize.SMALL: {
                "padding": ft.Padding(left=12, right=12, top=6, bottom=6),
                "text_size": 13,
                "icon_size": 16,
            },
            ButtonSize.MEDIUM: {
                "padding": ft.Padding(left=16, right=16, top=10, bottom=10),
                "text_size": 14,
                "icon_size": 18,
            },
            ButtonSize.LARGE: {
                "padding": ft.Padding(left=20, right=20, top=12, bottom=12),
                "text_size": 16,
                "icon_size": 20,
            },
        }
        self._size_config = size_config[self.button_size]

    def _get_container_style(self):
        """Get container styling based on variant and size."""
        colors = get_colors()

        # Size configuration
        size_config = {
            ButtonSize.SMALL: {
                "padding": ft.padding.symmetric(horizontal=12, vertical=6),
                "text_size": 13,
                "icon_size": 16,
            },
            ButtonSize.MEDIUM: {
                "padding": ft.padding.symmetric(horizontal=16, vertical=10),
                "text_size": 14,
                "icon_size": 18,
            },
            ButtonSize.LARGE: {
                "padding": ft.padding.symmetric(horizontal=20, vertical=12),
                "text_size": 16,
                "icon_size": 20,
            },
        }

        self._size_config = size_config[self.button_size]

        # Variant configuration
        if self.disabled:
            variant_style = {
                "bgcolor": colors["bg_hover"],
                "border": ft.border.all(1, colors["border"]),
                "shadow": None,
            }
        elif self.button_variant == ButtonVariant.PRIMARY:
            variant_style = {
                "bgcolor": colors["primary"],
                "border": None,
                "shadow": get_shadow("sm"),
            }
        elif self.button_variant == ButtonVariant.SECONDARY:
            variant_style = {
                "bgcolor": colors["bg_secondary"],
                "border": ft.border.all(1, colors["border"]),
                "shadow": get_shadow("xs"),
            }
        elif self.button_variant == ButtonVariant.TERTIARY:
            variant_style = {
                "bgcolor": "transparent",
                "border": ft.border.all(1, "transparent"),
                "shadow": None,
            }
        elif self.button_variant == ButtonVariant.DANGER:
            variant_style = {
                "bgcolor": colors["error"],
                "border": None,
                "shadow": get_shadow("sm"),
            }
        elif self.button_variant == ButtonVariant.SUCCESS:
            variant_style = {
                "bgcolor": colors["success"],
                "border": None,
                "shadow": get_shadow("sm"),
            }
        else:  # GHOST
            variant_style = {
                "bgcolor": "transparent",
                "border": None,
                "shadow": None,
            }

        return {
            "padding": self._size_config["padding"],
            "border_radius": RADIUS["md"],
            **variant_style,
            "expand": self.full_width,
        }

    def _build_content(self):
        """Build button content with text and optional icon."""
        colors = get_colors()

        # Text color based on variant and state
        if self.disabled:
            text_color = colors["text_muted"]
        elif self.button_variant in [ButtonVariant.PRIMARY, ButtonVariant.DANGER, ButtonVariant.SUCCESS]:
            text_color = colors["text_inverse"]
        else:
            text_color = colors["text_primary"]

        # Loading spinner
        if self.loading:
            return ft.Row(
                [
                    ft.ProgressRing(
                        width=self._size_config["icon_size"],
                        height=self._size_config["icon_size"],
                        stroke_width=2,
                        color=text_color,
                    ),
                    ft.Container(width=SPACING["sm"]),
                    ft.Text(
                        "Loading...",
                        size=self._size_config["text_size"],
                        weight=ft.FontWeight.W_600,
                        color=text_color,
                    ),
                ],
                alignment=ft.MainAxisAlignment.CENTER,
                spacing=0,
            )

        # Build content items
        items = []

        # Icon on left
        if self.button_icon and not self.icon_right:
            items.extend([
                ft.Icon(
                    self.button_icon,
                    size=self._size_config["icon_size"],
                    color=text_color,
                ),
                ft.Container(width=SPACING["sm"]),
            ])

        # Text
        items.append(
            ft.Text(
                self.button_text,
                size=self._size_config["text_size"],
                weight=ft.FontWeight.W_600,
                color=text_color,
            )
        )

        # Icon on right
        if self.button_icon and self.icon_right:
            items.extend([
                ft.Container(width=SPACING["sm"]),
                ft.Icon(
                    self.button_icon,
                    size=self._size_config["icon_size"],
                    color=text_color,
                ),
            ])

        return ft.Row(
            items,
            alignment=ft.MainAxisAlignment.CENTER,
            spacing=0,
        )

    def _handle_click(self, e):
        """Handle button click - supports both sync and async callbacks."""
        if self._on_click:
            import inspect
            import asyncio
            if inspect.iscoroutinefunction(self._on_click):
                # Async callback - create wrapper coroutine
                async def run_async():
                    await self._on_click(e)
                if self.page:
                    self.page.run_task(run_async)
            else:
                # Sync callback
                self._on_click(e)

    def _handle_hover(self, e):
        """Handle hover state changes."""
        colors = get_colors()

        if e.data == "true":  # Mouse enter
            if self.button_variant == ButtonVariant.PRIMARY:
                e.control.bgcolor = colors["primary_dark"]
                e.control.shadow = get_shadow("md")
            elif self.button_variant == ButtonVariant.SECONDARY:
                e.control.bgcolor = colors["bg_hover"]
                e.control.border = ft.border.all(1, colors["border_hover"])
                e.control.shadow = get_shadow("sm")
            elif self.button_variant == ButtonVariant.TERTIARY:
                e.control.bgcolor = colors["bg_hover"]
            elif self.button_variant == ButtonVariant.DANGER:
                e.control.bgcolor = colors["error_dark"]
                e.control.shadow = get_shadow("md")
            elif self.button_variant == ButtonVariant.SUCCESS:
                e.control.bgcolor = colors["success_dark"]
                e.control.shadow = get_shadow("md")
            else:  # GHOST
                e.control.bgcolor = colors["bg_hover"]
        else:  # Mouse leave
            # Reset to original style
            style = self._get_container_style()
            e.control.bgcolor = style["bgcolor"]
            e.control.border = style.get("border")
            e.control.shadow = style.get("shadow")

        e.control.update()

    def set_loading(self, loading: bool):
        """Set loading state."""
        self.loading = loading
        self.content = self._build_content()
        self.on_click = None if loading else self._handle_click
        self.on_hover = None if loading else self._handle_hover
        self.update()

    def set_disabled(self, disabled: bool):
        """Set disabled state."""
        self.disabled = disabled
        style = self._get_container_style()
        self.bgcolor = style["bgcolor"]
        self.border = style.get("border")
        self.shadow = style.get("shadow")
        self.on_click = None if disabled else self._handle_click
        self.on_hover = None if disabled else self._handle_hover
        self.content = self._build_content()
        self.update()


class IconButton(ft.Container):
    """Icon-only button for compact interfaces.

    Features:
    - Square or circle shape
    - Consistent sizing
    - Hover states
    - Tooltip support

    Example:
        IconButton(
            icon=ft.Icons.CLOSE,
            on_click=handle_close,
            tooltip="Close",
        )
    """

    def __init__(
        self,
        icon: str,
        on_click: Optional[Callable] = None,
        size: ButtonSize = ButtonSize.MEDIUM,
        variant: ButtonVariant = ButtonVariant.SECONDARY,
        circle: bool = False,
        disabled: bool = False,
        tooltip: Optional[str] = None,
        **kwargs
    ):
        self.button_icon = icon
        self.button_size = size
        self.button_variant = variant
        self.circle = circle
        self.disabled = disabled
        self._on_click = on_click

        # Size configuration
        size_map = {
            ButtonSize.SMALL: {"size": 32, "icon_size": 16},
            ButtonSize.MEDIUM: {"size": 40, "icon_size": 20},
            ButtonSize.LARGE: {"size": 48, "icon_size": 24},
        }
        self._size_config = size_map[size]

        super().__init__(
            content=self._build_content(),
            **self._get_style(),
            on_click=self._handle_click if not disabled else None,
            on_hover=self._handle_hover if not disabled else None,
            tooltip=tooltip,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            **kwargs
        )

    def _get_style(self):
        """Get icon button style."""
        colors = get_colors()

        # Variant style
        if self.disabled:
            bgcolor = colors["bg_hover"]
            border = ft.border.all(1, colors["border"])
        elif self.button_variant == ButtonVariant.PRIMARY:
            bgcolor = colors["primary"]
            border = None
        elif self.button_variant == ButtonVariant.DANGER:
            bgcolor = colors["error_glow"]
            border = ft.border.all(1, colors["error"] + "30")
        else:  # SECONDARY or GHOST
            bgcolor = colors["bg_hover"]
            border = ft.border.all(1, colors["border"])

        return {
            "width": self._size_config["size"],
            "height": self._size_config["size"],
            "border_radius": self._size_config["size"] // 2 if self.circle else RADIUS["md"],
            "bgcolor": bgcolor,
            "border": border,
            "alignment": ft.Alignment(0, 0),
        }

    def _build_content(self):
        """Build icon content."""
        colors = get_colors()

        if self.disabled:
            icon_color = colors["text_muted"]
        elif self.button_variant == ButtonVariant.PRIMARY:
            icon_color = colors["text_inverse"]
        elif self.button_variant == ButtonVariant.DANGER:
            icon_color = colors["error"]
        else:
            icon_color = colors["text_secondary"]

        return ft.Icon(
            self.button_icon,
            size=self._size_config["icon_size"],
            color=icon_color,
        )

    def _handle_click(self, e):
        """Handle click."""
        if self._on_click:
            self._on_click(e)

    def _handle_hover(self, e):
        """Handle hover."""
        colors = get_colors()

        if e.data == "true":
            if self.button_variant == ButtonVariant.PRIMARY:
                e.control.bgcolor = colors["primary_dark"]
            elif self.button_variant == ButtonVariant.DANGER:
                e.control.bgcolor = colors["error_glow"]
                e.control.border = ft.border.all(1, colors["error"])
            else:
                e.control.bgcolor = colors["bg_secondary"]
                e.control.border = ft.border.all(1, colors["border_hover"])
        else:
            style = self._get_style()
            e.control.bgcolor = style["bgcolor"]
            e.control.border = style.get("border")

        e.control.update()
