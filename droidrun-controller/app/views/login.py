"""Professional Login view for Droidrun Controller - 2025 Edition.

Polished login page with form validation, email/password fields, and enhanced styling.
"""

import re
import flet as ft
from ..theme import COLORS, RADIUS, get_shadow, ANIMATION


# Animation curve for smooth transitions
EASE_OUT = ft.AnimationCurve.EASE_OUT

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
            alignment=ft.alignment.center,
            **kwargs
        )

    def _build_content(self):
        """Build the login form content."""
        # Initialize error text controls
        self.email_error = ft.Text(
            "",
            size=12,
            color=COLORS["error"],
            visible=False,
        )
        self.password_error = ft.Text(
            "",
            size=12,
            color=COLORS["error"],
            visible=False,
        )
        self.general_error = ft.Container(
            content=ft.Row(
                [
                    ft.Icon(
                        ft.Icons.ERROR_OUTLINE,
                        size=16,
                        color=COLORS["error"],
                    ),
                    ft.Container(width=8),
                    ft.Text(
                        "",
                        size=13,
                        color=COLORS["error"],
                        weight=ft.FontWeight.W_500,
                        ref=ft.Ref[ft.Text](),
                    ),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=16, vertical=12),
            border_radius=RADIUS["md"],
            bgcolor=f"{COLORS['error']}12",
            border=ft.border.all(1, f"{COLORS['error']}30"),
            visible=False,
        )

        # Email field
        self.email_field = ft.TextField(
            label="Email",
            hint_text="Enter your email address",
            prefix_icon=ft.Icons.EMAIL_OUTLINED,
            keyboard_type=ft.KeyboardType.EMAIL,
            autofocus=True,
            border_color=COLORS["border"],
            focused_border_color=COLORS["primary"],
            bgcolor=COLORS["bg_input"],
            color=COLORS["text_primary"],
            label_style=ft.TextStyle(color=COLORS["text_secondary"], size=14),
            hint_style=ft.TextStyle(color=COLORS["text_muted"], size=13),
            cursor_color=COLORS["primary"],
            border_radius=RADIUS["md"],
            content_padding=ft.padding.symmetric(horizontal=16, vertical=16),
            text_size=14,
            on_change=self._on_email_change,
            on_submit=self._on_submit,
        )

        # Password field
        self.password_field = ft.TextField(
            label="Password",
            hint_text="Enter your password",
            prefix_icon=ft.Icons.LOCK_OUTLINED,
            password=True,
            can_reveal_password=True,
            border_color=COLORS["border"],
            focused_border_color=COLORS["primary"],
            bgcolor=COLORS["bg_input"],
            color=COLORS["text_primary"],
            label_style=ft.TextStyle(color=COLORS["text_secondary"], size=14),
            hint_style=ft.TextStyle(color=COLORS["text_muted"], size=13),
            cursor_color=COLORS["primary"],
            border_radius=RADIUS["md"],
            content_padding=ft.padding.symmetric(horizontal=16, vertical=16),
            text_size=14,
            on_change=self._on_password_change,
            on_submit=self._on_submit,
        )

        # Login button
        self.login_button = ft.Container(
            content=ft.Row(
                [
                    ft.Text(
                        "Sign In",
                        size=15,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["text_inverse"],
                    ),
                ],
                alignment=ft.MainAxisAlignment.CENTER,
            ),
            height=52,
            bgcolor=COLORS["primary"],
            border_radius=RADIUS["md"],
            alignment=ft.alignment.center,
            shadow=ft.BoxShadow(
                spread_radius=0,
                blur_radius=16,
                color=f"{COLORS['primary']}40",
                offset=ft.Offset(0, 4),
            ),
            animate=ft.Animation(ANIMATION["normal"], EASE_OUT),
            animate_scale=ft.Animation(ANIMATION["normal"], EASE_OUT),
            on_click=self._on_login_click,
            on_hover=self._on_button_hover,
        )

        # Loading indicator (hidden by default)
        self.loading_indicator = ft.Container(
            content=ft.Row(
                [
                    ft.ProgressRing(
                        width=20,
                        height=20,
                        stroke_width=2,
                        color=COLORS["text_inverse"],
                    ),
                    ft.Container(width=12),
                    ft.Text(
                        "Signing in...",
                        size=15,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["text_inverse"],
                    ),
                ],
                alignment=ft.MainAxisAlignment.CENTER,
            ),
            height=52,
            bgcolor=COLORS["primary_dark"],
            border_radius=RADIUS["md"],
            alignment=ft.alignment.center,
            visible=False,
        )

        # Register link
        register_link = ft.Container(
            content=ft.Row(
                [
                    ft.Text(
                        "Don't have an account?",
                        size=14,
                        color=COLORS["text_secondary"],
                    ),
                    ft.Container(width=4),
                    ft.Text(
                        "Sign up",
                        size=14,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["primary"],
                    ),
                ],
                alignment=ft.MainAxisAlignment.CENTER,
            ),
            on_click=self._on_register_click,
            animate=ft.Animation(ANIMATION["fast"], EASE_OUT),
            on_hover=self._on_link_hover,
        )

        # Main form card
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
                    ft.Container(height=24),
                    # Login button
                    self.login_button,
                    self.loading_indicator,
                    ft.Container(height=24),
                    # Register link
                    register_link,
                ],
                spacing=0,
                horizontal_alignment=ft.CrossAxisAlignment.STRETCH,
            ),
            width=420,
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["xl"],
            padding=40,
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("lg"),
            animate=ft.Animation(ANIMATION["normal"], EASE_OUT),
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
        return ft.Column(
            [
                # Logo
                ft.Container(
                    content=ft.Icon(
                        ft.Icons.ANDROID,
                        size=40,
                        color=COLORS["primary"],
                    ),
                    width=72,
                    height=72,
                    border_radius=RADIUS["lg"],
                    bgcolor=f"{COLORS['primary']}15",
                    alignment=ft.alignment.center,
                    border=ft.border.all(1, f"{COLORS['primary']}25"),
                    shadow=ft.BoxShadow(
                        spread_radius=0,
                        blur_radius=20,
                        color=f"{COLORS['primary']}25",
                        offset=ft.Offset(0, 6),
                    ),
                ),
                ft.Container(height=24),
                # Title
                ft.Text(
                    "Welcome Back",
                    size=28,
                    weight=ft.FontWeight.W_800,
                    color=COLORS["text_primary"],
                    text_align=ft.TextAlign.CENTER,
                ),
                ft.Container(height=8),
                # Subtitle
                ft.Text(
                    "Sign in to your Droidrun Controller account",
                    size=14,
                    color=COLORS["text_secondary"],
                    text_align=ft.TextAlign.CENTER,
                ),
            ],
            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            spacing=0,
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
        # Clear error when user starts typing
        self.email_error.visible = False
        self.email_field.border_color = COLORS["border"]
        if self.email_error.page:
            self.email_error.update()
            self.email_field.update()

    def _on_password_change(self, e):
        """Handle password field change."""
        # Clear error when user starts typing
        self.password_error.visible = False
        self.password_field.border_color = COLORS["border"]
        if self.password_error.page:
            self.password_error.update()
            self.password_field.update()

    def _show_field_error(self, field: ft.TextField, error_text: ft.Text, message: str):
        """Show validation error for a field."""
        field.border_color = COLORS["error"]
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
        self.login_button.visible = not loading
        self.loading_indicator.visible = loading
        self.email_field.disabled = loading
        self.password_field.disabled = loading
        if self.page:
            self.update()

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

    def _on_button_hover(self, e):
        """Handle button hover effect."""
        if self._is_loading:
            return
        if e.data == "true":
            e.control.scale = 1.02
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=24,
                color=f"{COLORS['primary']}50",
                offset=ft.Offset(0, 8),
            )
        else:
            e.control.scale = 1.0
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=16,
                color=f"{COLORS['primary']}40",
                offset=ft.Offset(0, 4),
            )
        e.control.update()

    def _on_link_hover(self, e):
        """Handle link hover effect."""
        if e.data == "true":
            e.control.opacity = 0.8
        else:
            e.control.opacity = 1.0
        e.control.update()

    def show_error(self, message: str):
        """Show an error message (can be called from outside)."""
        self._show_general_error(message)

    def clear_form(self):
        """Clear the form fields."""
        self.email_field.value = ""
        self.password_field.value = ""
        self._hide_general_error()
        self.email_error.visible = False
        self.password_error.visible = False
        self.email_field.border_color = COLORS["border"]
        self.password_field.border_color = COLORS["border"]
        if self.page:
            self.update()

    def refresh(self):
        """Refresh the view."""
        self.content = self._build_content()
        self.update()
