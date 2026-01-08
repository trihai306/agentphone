"""Professional Login view for Droidrun Controller - 2025 Edition.

Polished login page with form validation, email/password fields, and enhanced styling.
Uses standardized component library for consistent UI.
"""

import re
import flet as ft
from ..theme import get_colors, RADIUS, get_shadow, ANIMATION, Typography, Easing
from ..components import Button, ButtonVariant, ButtonSize
from ..components.ui.input import TextField, PasswordInput, InputSize
from ..components.common.cards import AlertCard


# Validation patterns
EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')


class LoginView(ft.Container):
    """Professional login view with form validation and polished UI."""

    def __init__(self, on_login=None, on_navigate_to_register=None, **kwargs):
        """Initialize the login view.

        Args:
            on_login: Callback function when login is submitted.
                      Receives (email, password) as arguments.
            on_navigate_to_register: Callback function to navigate to register page.
        """
        self.on_login = on_login
        self.on_navigate_to_register = on_navigate_to_register
        self._is_loading = False

        # Form field references
        self.email_field = None
        self.password_field = None
        self.email_error = None
        self.password_error = None
        self.general_error = None

        super().__init__(
            content=self._build_content(),
            expand=True,
            alignment=ft.Alignment(0, 0),
            **kwargs
        )

    def _build_content(self):
        """Build the login form content."""
        colors = get_colors()

        # Initialize error text controls
        self.email_error = ft.Text(
            "",
            size=Typography.LABEL_SM,
            color=colors["error"],
            visible=False,
        )
        self.password_error = ft.Text(
            "",
            size=Typography.LABEL_SM,
            color=colors["error"],
            visible=False,
        )
        self.general_error = ft.Container(
            content=ft.Row(
                [
                    ft.Icon(
                        ft.Icons.ERROR_OUTLINE,
                        size=16,
                        color=colors["error"],
                    ),
                    ft.Container(width=8),
                    ft.Text(
                        "",
                        size=Typography.BODY_SM,
                        color=colors["error"],
                        weight=ft.FontWeight.W_500,
                        ref=ft.Ref[ft.Text](),
                    ),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=16, vertical=12),
            border_radius=RADIUS["md"],
            bgcolor=f"{colors['error']}12",
            border=ft.border.all(1, f"{colors['error']}30"),
            visible=False,
        )

        # Email field with polished styling
        self.email_field = ft.TextField(
            label="Email",
            hint_text="Enter your email address",
            prefix_icon=ft.Icons.EMAIL_OUTLINED,
            keyboard_type=ft.KeyboardType.EMAIL,
            autofocus=True,
            border_color=colors["border"],
            focused_border_color=colors["primary"],
            bgcolor=colors["bg_input"],
            color=colors["text_primary"],
            label_style=ft.TextStyle(color=colors["text_secondary"], size=Typography.BODY_MD),
            hint_style=ft.TextStyle(color=colors["text_muted"], size=Typography.BODY_SM),
            cursor_color=colors["primary"],
            border_radius=RADIUS["md"],
            content_padding=ft.padding.symmetric(horizontal=16, vertical=16),
            text_size=Typography.BODY_MD,
            on_change=self._on_email_change,
            on_submit=self._on_submit,
        )

        # Password field with polished styling
        self.password_field = ft.TextField(
            label="Password",
            hint_text="Enter your password",
            prefix_icon=ft.Icons.LOCK_OUTLINED,
            password=True,
            can_reveal_password=True,
            border_color=colors["border"],
            focused_border_color=colors["primary"],
            bgcolor=colors["bg_input"],
            color=colors["text_primary"],
            label_style=ft.TextStyle(color=colors["text_secondary"], size=Typography.BODY_MD),
            hint_style=ft.TextStyle(color=colors["text_muted"], size=Typography.BODY_SM),
            cursor_color=colors["primary"],
            border_radius=RADIUS["md"],
            content_padding=ft.padding.symmetric(horizontal=16, vertical=16),
            text_size=Typography.BODY_MD,
            on_change=self._on_password_change,
            on_submit=self._on_submit,
        )

        # Login button using component library
        self.login_button = Button(
            text="Sign In",
            variant=ButtonVariant.PRIMARY,
            size=ButtonSize.LARGE,
            full_width=True,
            on_click=self._on_login_click,
        )

        # Register link with subtle hover
        register_link = ft.Container(
            content=ft.Row(
                [
                    ft.Text(
                        "Don't have an account?",
                        size=Typography.BODY_MD,
                        color=colors["text_secondary"],
                    ),
                    ft.Container(width=6),
                    ft.Text(
                        "Sign up",
                        size=Typography.BODY_MD,
                        weight=ft.FontWeight.W_600,
                        color=colors["primary"],
                    ),
                ],
                alignment=ft.MainAxisAlignment.CENTER,
            ),
            on_click=self._on_register_click,
            animate=ft.Animation(ANIMATION["fast"], Easing.EASE_OUT),
            on_hover=self._on_link_hover,
        )

        # Forgot password link
        forgot_password_link = ft.Container(
            content=ft.Text(
                "Forgot password?",
                size=Typography.BODY_SM,
                weight=ft.FontWeight.W_500,
                color=colors["text_muted"],
            ),
            alignment=ft.Alignment(1, 0),
            on_click=lambda _: None,  # Placeholder
            animate=ft.Animation(ANIMATION["fast"], Easing.EASE_OUT),
            on_hover=self._on_forgot_hover,
        )

        # Main form card with glass morphism effect
        form_card = ft.Container(
            content=ft.Column(
                [
                    # Header
                    self._build_header(),
                    ft.Container(height=32),
                    # General error message
                    self.general_error,
                    # Email field
                    self.email_field,
                    self.email_error,
                    ft.Container(height=16),
                    # Password field
                    self.password_field,
                    self.password_error,
                    ft.Container(height=8),
                    # Forgot password
                    forgot_password_link,
                    ft.Container(height=24),
                    # Login button (handles its own loading state)
                    self.login_button,
                    ft.Container(height=28),
                    # Divider with text
                    self._build_divider("or continue with"),
                    ft.Container(height=20),
                    # Social login buttons
                    self._build_social_buttons(),
                    ft.Container(height=28),
                    # Register link
                    register_link,
                ],
                spacing=0,
                horizontal_alignment=ft.CrossAxisAlignment.STRETCH,
            ),
            width=440,
            bgcolor=colors["bg_card"],
            border_radius=RADIUS["xl"],
            padding=44,
            border=ft.border.all(1, colors["border"]),
            shadow=get_shadow("lg"),
            animate=ft.Animation(ANIMATION["normal"], Easing.EASE_OUT),
        )

        # Wrap in scrollable column for smaller screens
        return ft.Column(
            [
                ft.Container(expand=True),
                form_card,
                ft.Container(expand=True),
            ],
            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            scroll=ft.ScrollMode.AUTO,
            expand=True,
        )

    def _build_header(self):
        """Build the header section with logo and title."""
        colors = get_colors()
        return ft.Column(
            [
                # Logo with glow effect
                ft.Container(
                    content=ft.Icon(
                        ft.Icons.ANDROID,
                        size=44,
                        color=colors["primary"],
                    ),
                    width=80,
                    height=80,
                    border_radius=RADIUS["lg"],
                    bgcolor=f"{colors['primary']}12",
                    alignment=ft.Alignment(0, 0),
                    border=ft.border.all(1, f"{colors['primary']}20")
                ),
                ft.Container(height=28),
                # Title
                ft.Text(
                    "Welcome Back",
                    size=Typography.H2,
                    weight=ft.FontWeight.W_800,
                    color=colors["text_primary"],
                    text_align=ft.TextAlign.CENTER,
                ),
                ft.Container(height=8),
                # Subtitle
                ft.Text(
                    "Sign in to your Droidrun Controller account",
                    size=Typography.BODY_MD,
                    color=colors["text_secondary"],
                    text_align=ft.TextAlign.CENTER,
                ),
            ],
            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            spacing=0,
        )

    def _build_divider(self, text: str):
        """Build a divider with centered text."""
        colors = get_colors()
        return ft.Row(
            [
                ft.Container(
                    height=1,
                    bgcolor=colors["border"],
                    expand=True,
                ),
                ft.Container(
                    content=ft.Text(
                        text,
                        size=Typography.LABEL_SM,
                        color=colors["text_muted"],
                        weight=ft.FontWeight.W_500,
                    ),
                    padding=ft.padding.symmetric(horizontal=16),
                ),
                ft.Container(
                    height=1,
                    bgcolor=colors["border"],
                    expand=True,
                ),
            ],
            vertical_alignment=ft.CrossAxisAlignment.CENTER,
        )

    def _build_social_buttons(self):
        """Build social login buttons."""
        colors = get_colors()

        def build_social_button(icon: str, label: str, on_click=None):
            return ft.Container(
                content=ft.Row(
                    [
                        ft.Icon(icon, size=20, color=colors["text_secondary"]),
                        ft.Container(width=8),
                        ft.Text(
                            label,
                            size=Typography.BODY_SM,
                            weight=ft.FontWeight.W_500,
                            color=colors["text_primary"],
                        ),
                    ],
                    alignment=ft.MainAxisAlignment.CENTER,
                ),
                height=46,
                expand=True,
                border_radius=RADIUS["md"],
                bgcolor=colors["bg_tertiary"],
                border=ft.border.all(1, colors["border"]),
                alignment=ft.Alignment(0, 0),
                animate=ft.Animation(ANIMATION["fast"], Easing.EASE_OUT),
                on_click=on_click,
                on_hover=self._on_social_hover,
            )

        return ft.Row(
            [
                build_social_button(ft.Icons.LANGUAGE, "Google"),
                ft.Container(width=12),
                build_social_button(ft.Icons.APPLE, "Apple"),
            ],
        )

    def _validate_email(self, email: str) -> tuple[bool, str]:
        """Validate email format."""
        if not email or not email.strip():
            return False, "Email is required"
        if not EMAIL_PATTERN.match(email.strip()):
            return False, "Please enter a valid email address"
        return True, ""

    def _validate_password(self, password: str) -> tuple[bool, str]:
        """Validate password is not empty."""
        if not password:
            return False, "Password is required"
        return True, ""

    def _on_email_change(self, e):
        """Handle email field change."""
        colors = get_colors()
        # Clear error when user starts typing
        self.email_error.visible = False
        self.email_field.border_color = colors["border"]
        if self.email_error.page:
            self.email_error.update()
            self.email_field.update()

    def _on_password_change(self, e):
        """Handle password field change."""
        colors = get_colors()
        # Clear error when user starts typing
        self.password_error.visible = False
        self.password_field.border_color = colors["border"]
        if self.password_error.page:
            self.password_error.update()
            self.password_field.update()

    def _show_field_error(self, field: ft.TextField, error_text: ft.Text, message: str):
        """Show validation error for a field."""
        colors = get_colors()
        field.border_color = colors["error"]
        error_text.value = message
        error_text.visible = True
        if field.page:
            field.update()
            error_text.update()

    def _show_general_error(self, message: str):
        """Show general error message."""
        # Find the text control inside the general error container
        error_row = self.general_error.content
        if error_row and len(error_row.controls) >= 3:
            error_row.controls[2].value = message
        self.general_error.visible = True
        if self.general_error.page:
            self.general_error.update()

    def _hide_general_error(self):
        """Hide general error message."""
        self.general_error.visible = False
        if self.general_error.page:
            self.general_error.update()

    def _set_loading(self, loading: bool):
        """Set loading state."""
        self._is_loading = loading
        # Use Button's built-in loading state
        self.login_button.set_loading(loading)
        self.email_field.disabled = loading
        self.password_field.disabled = loading
        # Only update if still in page (may have been removed after successful login)
        try:
            if self.page:
                self.email_field.update()
                self.password_field.update()
        except RuntimeError:
            # Control was removed from page, ignore
            pass

    async def _on_login_click(self, e):
        """Handle login button click."""
        await self._perform_login()

    async def _on_submit(self, e):
        """Handle form submit (Enter key)."""
        await self._perform_login()

    async def _perform_login(self):
        """Perform login with validation."""
        if self._is_loading:
            return

        # Hide previous errors
        self._hide_general_error()

        # Get field values
        email = self.email_field.value or ""
        password = self.password_field.value or ""

        # Validate all fields
        has_errors = False

        # Validate email
        is_valid, error_msg = self._validate_email(email)
        if not is_valid:
            self._show_field_error(self.email_field, self.email_error, error_msg)
            has_errors = True

        # Validate password
        is_valid, error_msg = self._validate_password(password)
        if not is_valid:
            self._show_field_error(self.password_field, self.password_error, error_msg)
            has_errors = True

        if has_errors:
            return

        # Call login callback
        if self.on_login:
            self._set_loading(True)
            try:
                await self.on_login(email.strip(), password)
            except Exception as ex:
                self._show_general_error(str(ex))
            finally:
                self._set_loading(False)

    def _on_register_click(self, e):
        """Handle register link click."""
        if self.on_navigate_to_register:
            self.on_navigate_to_register()

    def _on_link_hover(self, e):
        """Handle link hover effect."""
        if e.data == "true":
            e.control.opacity = 0.8
        else:
            e.control.opacity = 1.0
        e.control.update()

    def _on_forgot_hover(self, e):
        """Handle forgot password link hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.content.color = colors["primary"]
        else:
            e.control.content.color = colors["text_muted"]
        e.control.update()

    def _on_social_hover(self, e):
        """Handle social button hover effect."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["bg_hover"]
            e.control.border = ft.border.all(1, colors["border_hover"])
        else:
            e.control.bgcolor = colors["bg_tertiary"]
            e.control.border = ft.border.all(1, colors["border"])
        e.control.update()

    def show_error(self, message: str):
        """Show an error message (can be called from outside)."""
        self._show_general_error(message)

    def clear_form(self):
        """Clear the form fields."""
        colors = get_colors()
        self.email_field.value = ""
        self.password_field.value = ""
        self._hide_general_error()
        self.email_error.visible = False
        self.password_error.visible = False
        self.email_field.border_color = colors["border"]
        self.password_field.border_color = colors["border"]
        if self.page:
            self.update()

    def refresh(self):
        """Refresh the view."""
        self.content = self._build_content()
        self.update()
