"""Professional Input Components for Droidrun Controller.

Provides consistent, accessible, and beautiful form inputs across the application.
Follows the design system principles and supports all interaction states.
"""

import flet as ft
from typing import Optional, Callable
from enum import Enum
from ...theme import get_colors, RADIUS, SPACING, ANIMATION


# Dynamic color proxy - acts like a dict but always gets current theme colors
class _DynamicColors:
    def get(self, key, default=None):
        return get_colors().get(key, default)
    
    def __getitem__(self, key):
        return get_colors()[key]

COLORS = _DynamicColors()


class InputSize(str, Enum):
    """Input size presets."""
    SMALL = "sm"
    MEDIUM = "md"
    LARGE = "lg"


class TextField(ft.Container):
    """Professional text input component.

    Features:
    - Multiple sizes (small, medium, large)
    - Prefix/suffix icons
    - Helper text and error states
    - Focus states with animations
    - Dark/Light mode support

    Example:
        TextField(
            label="Email",
            placeholder="Enter your email",
            prefix_icon=ft.Icons.EMAIL,
            on_change=handle_change
        )
    """

    def __init__(
        self,
        label: Optional[str] = None,
        placeholder: str = "",
        value: str = "",
        prefix_icon: Optional[str] = None,
        suffix_icon: Optional[str] = None,
        helper_text: Optional[str] = None,
        error_text: Optional[str] = None,
        size: InputSize = InputSize.MEDIUM,
        disabled: bool = False,
        read_only: bool = False,
        on_change: Optional[Callable] = None,
        on_submit: Optional[Callable] = None,
        on_focus: Optional[Callable] = None,
        on_blur: Optional[Callable] = None,
        multiline: bool = False,
        max_lines: int = 1,
        **kwargs
    ):
        self.label_text = label
        self.placeholder_text = placeholder
        self.value_text = value
        self.prefix_icon = prefix_icon
        self.suffix_icon = suffix_icon
        self.helper_text = helper_text
        self.error_text = error_text
        self.input_size = size
        self.is_disabled = disabled
        self.is_read_only = read_only
        self.on_change_callback = on_change
        self.on_submit_callback = on_submit
        self.on_focus_callback = on_focus
        self.on_blur_callback = on_blur
        self.is_multiline = multiline
        self.max_lines = max_lines if multiline else 1
        self._is_focused = False
        
        # Create the text field
        self.text_field = self._create_text_field()
        
        super().__init__(
            content=self._build_content(),
            **kwargs
        )
    
    def _get_size_config(self) -> dict:
        """Get size configuration."""
        sizes = {
            InputSize.SMALL: {
                "height": 36,
                "font_size": 13,
                "icon_size": 16,
                "padding_h": 10,
                "padding_v": 6,
                "label_size": 12,
            },
            InputSize.MEDIUM: {
                "height": 42,
                "font_size": 14,
                "icon_size": 18,
                "padding_h": 14,
                "padding_v": 10,
                "label_size": 13,
            },
            InputSize.LARGE: {
                "height": 50,
                "font_size": 16,
                "icon_size": 20,
                "padding_h": 16,
                "padding_v": 12,
                "label_size": 14,
            },
        }
        return sizes.get(self.input_size, sizes[InputSize.MEDIUM])
    
    def _create_text_field(self) -> ft.TextField:
        """Create the underlying Flet TextField."""
        config = self._get_size_config()
        colors = COLORS
        
        return ft.TextField(
            value=self.value_text,
            hint_text=self.placeholder_text,
            text_size=config["font_size"],
            hint_style=ft.TextStyle(
                size=config["font_size"],
                color=colors["text_muted"],
            ),
            border=ft.InputBorder.NONE,
            bgcolor="transparent",
            cursor_color=colors["primary"],
            selection_color=f"{colors['primary']}30",
            text_style=ft.TextStyle(
                size=config["font_size"],
                color=colors["text_primary"],
            ),
            disabled=self.is_disabled,
            read_only=self.is_read_only,
            multiline=self.is_multiline,
            max_lines=self.max_lines,
            expand=True,
            content_padding=ft.padding.symmetric(
                horizontal=0, 
                vertical=config["padding_v"]
            ),
            on_change=self._handle_change,
            on_submit=self._handle_submit,
            on_focus=self._handle_focus,
            on_blur=self._handle_blur,
        )
    
    def _build_content(self) -> ft.Control:
        """Build the complete input UI."""
        colors = COLORS
        config = self._get_size_config()
        has_error = self.error_text is not None
        
        content_items = []
        
        # Label
        if self.label_text:
            content_items.append(
                ft.Text(
                    self.label_text,
                    size=config["label_size"],
                    weight=ft.FontWeight.W_500,
                    color=colors["error"] if has_error else colors["text_secondary"],
                )
            )
            content_items.append(ft.Container(height=6))
        
        # Input container
        input_row = []
        
        # Prefix icon
        if self.prefix_icon:
            input_row.append(
                ft.Icon(
                    self.prefix_icon,
                    size=config["icon_size"],
                    color=colors["error"] if has_error else colors["text_muted"],
                )
            )
            input_row.append(ft.Container(width=10))
        
        # Text field
        input_row.append(self.text_field)
        
        # Suffix icon
        if self.suffix_icon:
            input_row.append(ft.Container(width=10))
            input_row.append(
                ft.Icon(
                    self.suffix_icon,
                    size=config["icon_size"],
                    color=colors["error"] if has_error else colors["text_muted"],
                )
            )
        
        # Input wrapper
        border_color = (
            colors["error"] if has_error 
            else colors["primary"] if self._is_focused 
            else colors["border"]
        )
        
        input_container = ft.Container(
            content=ft.Row(
                input_row,
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            height=None if self.is_multiline else config["height"],
            padding=ft.padding.symmetric(
                horizontal=config["padding_h"],
                vertical=config["padding_v"] if self.is_multiline else 0,
            ),
            bgcolor=colors["bg_input"] if not self.is_disabled else colors["bg_tertiary"],
            border_radius=RADIUS["md"],
            border=ft.border.all(1, border_color),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )
        content_items.append(input_container)
        
        # Helper/Error text
        bottom_text = self.error_text or self.helper_text
        if bottom_text:
            content_items.append(ft.Container(height=4))
            content_items.append(
                ft.Text(
                    bottom_text,
                    size=11,
                    color=colors["error"] if has_error else colors["text_muted"],
                )
            )
        
        return ft.Column(
            content_items,
            spacing=0,
        )
    
    def _handle_change(self, e):
        """Handle text change."""
        self.value_text = e.control.value
        if self.on_change_callback:
            self.on_change_callback(e)
    
    def _handle_submit(self, e):
        """Handle submit."""
        if self.on_submit_callback:
            self.on_submit_callback(e)
    
    def _handle_focus(self, e):
        """Handle focus."""
        self._is_focused = True
        self.content = self._build_content()
        self.update()
        if self.on_focus_callback:
            self.on_focus_callback(e)
    
    def _handle_blur(self, e):
        """Handle blur."""
        self._is_focused = False
        self.content = self._build_content()
        self.update()
        if self.on_blur_callback:
            self.on_blur_callback(e)
    
    @property
    def value(self) -> str:
        """Get current value."""
        return self.text_field.value or ""
    
    @value.setter
    def value(self, val: str):
        """Set value."""
        self.text_field.value = val
        self.value_text = val
        if self.page:
            self.text_field.update()
    
    def set_error(self, error: Optional[str]):
        """Set error text."""
        self.error_text = error
        self.content = self._build_content()
        if self.page:
            self.update()
    
    def clear_error(self):
        """Clear error text."""
        self.set_error(None)


class SearchInput(ft.Container):
    """Search input with icon and clear button.

    Example:
        SearchInput(
            placeholder="Search devices...",
            on_search=handle_search
        )
    """

    def __init__(
        self,
        placeholder: str = "Search...",
        value: str = "",
        size: InputSize = InputSize.MEDIUM,
        on_change: Optional[Callable] = None,
        on_search: Optional[Callable] = None,
        on_clear: Optional[Callable] = None,
        **kwargs
    ):
        self.placeholder_text = placeholder
        self.value_text = value
        self.input_size = size
        self.on_change_callback = on_change
        self.on_search_callback = on_search
        self.on_clear_callback = on_clear
        
        self.text_field = self._create_text_field()
        self.clear_button = self._create_clear_button()
        
        super().__init__(
            content=self._build_content(),
            **kwargs
        )
    
    def _get_size_config(self) -> dict:
        """Get size configuration."""
        sizes = {
            InputSize.SMALL: {"height": 36, "font_size": 13, "icon_size": 16},
            InputSize.MEDIUM: {"height": 42, "font_size": 14, "icon_size": 18},
            InputSize.LARGE: {"height": 50, "font_size": 16, "icon_size": 20},
        }
        return sizes.get(self.input_size, sizes[InputSize.MEDIUM])
    
    def _create_text_field(self) -> ft.TextField:
        """Create the text field."""
        config = self._get_size_config()
        colors = COLORS
        
        return ft.TextField(
            value=self.value_text,
            hint_text=self.placeholder_text,
            text_size=config["font_size"],
            hint_style=ft.TextStyle(
                size=config["font_size"],
                color=colors["text_muted"],
            ),
            border=ft.InputBorder.NONE,
            bgcolor="transparent",
            cursor_color=colors["primary"],
            text_style=ft.TextStyle(
                size=config["font_size"],
                color=colors["text_primary"],
            ),
            expand=True,
            content_padding=ft.padding.symmetric(horizontal=0, vertical=10),
            on_change=self._handle_change,
            on_submit=self._handle_search,
        )
    
    def _create_clear_button(self) -> ft.Container:
        """Create clear button."""
        config = self._get_size_config()
        colors = COLORS
        
        return ft.Container(
            content=ft.Icon(
                ft.Icons.CLOSE,
                size=config["icon_size"] - 2,
                color=colors["text_muted"],
            ),
            width=24,
            height=24,
            border_radius=12,
            alignment=ft.Alignment(0, 0),
            visible=bool(self.value_text),
            on_click=self._handle_clear,
            on_hover=self._handle_clear_hover,
        )
    
    def _build_content(self) -> ft.Control:
        """Build search input UI."""
        colors = COLORS
        config = self._get_size_config()
        
        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(
                        ft.Icons.SEARCH,
                        size=config["icon_size"],
                        color=colors["text_muted"],
                    ),
                    ft.Container(width=10),
                    self.text_field,
                    self.clear_button,
                ],
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            height=config["height"],
            padding=ft.padding.symmetric(horizontal=14),
            bgcolor=colors["bg_input"],
            border_radius=RADIUS["md"],
            border=ft.border.all(1, colors["border"]),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )
    
    def _handle_change(self, e):
        """Handle text change."""
        self.value_text = e.control.value
        self.clear_button.visible = bool(self.value_text)
        if self.page:
            self.clear_button.update()
        if self.on_change_callback:
            self.on_change_callback(e)
    
    def _handle_search(self, e):
        """Handle search submit."""
        if self.on_search_callback:
            self.on_search_callback(self.value_text)
    
    def _handle_clear(self, e):
        """Handle clear button click."""
        self.value_text = ""
        self.text_field.value = ""
        self.clear_button.visible = False
        if self.page:
            self.text_field.update()
            self.clear_button.update()
        if self.on_clear_callback:
            self.on_clear_callback(e)
    
    def _handle_clear_hover(self, e):
        """Handle clear button hover."""
        colors = COLORS
        if e.data == "true":
            e.control.bgcolor = colors["bg_hover"]
        else:
            e.control.bgcolor = "transparent"
        e.control.update()
    
    @property
    def value(self) -> str:
        """Get current value."""
        return self.text_field.value or ""


class PasswordInput(ft.Container):
    """Password input with show/hide toggle.

    Example:
        PasswordInput(
            label="Password",
            placeholder="Enter password",
            on_change=handle_change
        )
    """

    def __init__(
        self,
        label: Optional[str] = None,
        placeholder: str = "Enter password",
        value: str = "",
        helper_text: Optional[str] = None,
        error_text: Optional[str] = None,
        size: InputSize = InputSize.MEDIUM,
        on_change: Optional[Callable] = None,
        on_submit: Optional[Callable] = None,
        **kwargs
    ):
        self.label_text = label
        self.placeholder_text = placeholder
        self.value_text = value
        self.helper_text = helper_text
        self.error_text = error_text
        self.input_size = size
        self.on_change_callback = on_change
        self.on_submit_callback = on_submit
        self._show_password = False
        self._is_focused = False
        
        self.text_field = self._create_text_field()
        self.toggle_button = self._create_toggle_button()
        
        super().__init__(
            content=self._build_content(),
            **kwargs
        )
    
    def _get_size_config(self) -> dict:
        """Get size configuration."""
        sizes = {
            InputSize.SMALL: {"height": 36, "font_size": 13, "icon_size": 16, "label_size": 12},
            InputSize.MEDIUM: {"height": 42, "font_size": 14, "icon_size": 18, "label_size": 13},
            InputSize.LARGE: {"height": 50, "font_size": 16, "icon_size": 20, "label_size": 14},
        }
        return sizes.get(self.input_size, sizes[InputSize.MEDIUM])
    
    def _create_text_field(self) -> ft.TextField:
        """Create password text field."""
        config = self._get_size_config()
        colors = COLORS
        
        return ft.TextField(
            value=self.value_text,
            hint_text=self.placeholder_text,
            password=not self._show_password,
            can_reveal_password=False,
            text_size=config["font_size"],
            hint_style=ft.TextStyle(
                size=config["font_size"],
                color=colors["text_muted"],
            ),
            border=ft.InputBorder.NONE,
            bgcolor="transparent",
            cursor_color=colors["primary"],
            text_style=ft.TextStyle(
                size=config["font_size"],
                color=colors["text_primary"],
            ),
            expand=True,
            content_padding=ft.padding.symmetric(horizontal=0, vertical=10),
            on_change=self._handle_change,
            on_submit=self._handle_submit,
            on_focus=self._handle_focus,
            on_blur=self._handle_blur,
        )
    
    def _create_toggle_button(self) -> ft.Container:
        """Create show/hide toggle button."""
        config = self._get_size_config()
        colors = COLORS
        
        return ft.Container(
            content=ft.Icon(
                ft.Icons.VISIBILITY_OFF if not self._show_password else ft.Icons.VISIBILITY,
                size=config["icon_size"],
                color=colors["text_muted"],
            ),
            width=28,
            height=28,
            border_radius=14,
            alignment=ft.Alignment(0, 0),
            on_click=self._toggle_password,
            on_hover=self._handle_toggle_hover,
        )
    
    def _build_content(self) -> ft.Control:
        """Build password input UI."""
        colors = COLORS
        config = self._get_size_config()
        has_error = self.error_text is not None
        
        content_items = []
        
        # Label
        if self.label_text:
            content_items.append(
                ft.Text(
                    self.label_text,
                    size=config["label_size"],
                    weight=ft.FontWeight.W_500,
                    color=colors["error"] if has_error else colors["text_secondary"],
                )
            )
            content_items.append(ft.Container(height=6))
        
        # Input container
        border_color = (
            colors["error"] if has_error 
            else colors["primary"] if self._is_focused 
            else colors["border"]
        )
        
        input_container = ft.Container(
            content=ft.Row(
                [
                    ft.Icon(
                        ft.Icons.LOCK_OUTLINED,
                        size=config["icon_size"],
                        color=colors["error"] if has_error else colors["text_muted"],
                    ),
                    ft.Container(width=10),
                    self.text_field,
                    self.toggle_button,
                ],
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            height=config["height"],
            padding=ft.padding.symmetric(horizontal=14),
            bgcolor=colors["bg_input"],
            border_radius=RADIUS["md"],
            border=ft.border.all(1, border_color),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )
        content_items.append(input_container)
        
        # Helper/Error text
        bottom_text = self.error_text or self.helper_text
        if bottom_text:
            content_items.append(ft.Container(height=4))
            content_items.append(
                ft.Text(
                    bottom_text,
                    size=11,
                    color=colors["error"] if has_error else colors["text_muted"],
                )
            )
        
        return ft.Column(content_items, spacing=0)
    
    def _toggle_password(self, e):
        """Toggle password visibility."""
        self._show_password = not self._show_password
        self.text_field.password = not self._show_password
        self.toggle_button.content.name = (
            ft.Icons.VISIBILITY if self._show_password else ft.Icons.VISIBILITY_OFF
        )
        if self.page:
            self.text_field.update()
            self.toggle_button.update()
    
    def _handle_toggle_hover(self, e):
        """Handle toggle button hover."""
        colors = COLORS
        if e.data == "true":
            e.control.bgcolor = colors["bg_hover"]
        else:
            e.control.bgcolor = "transparent"
        e.control.update()
    
    def _handle_change(self, e):
        """Handle text change."""
        self.value_text = e.control.value
        if self.on_change_callback:
            self.on_change_callback(e)
    
    def _handle_submit(self, e):
        """Handle submit."""
        if self.on_submit_callback:
            self.on_submit_callback(e)
    
    def _handle_focus(self, e):
        """Handle focus."""
        self._is_focused = True
        self.content = self._build_content()
        self.update()
    
    def _handle_blur(self, e):
        """Handle blur."""
        self._is_focused = False
        self.content = self._build_content()
        self.update()
    
    @property
    def value(self) -> str:
        """Get current value."""
        return self.text_field.value or ""
    
    def set_error(self, error: Optional[str]):
        """Set error text."""
        self.error_text = error
        self.content = self._build_content()
        if self.page:
            self.update()
