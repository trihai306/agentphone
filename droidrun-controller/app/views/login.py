"""Professional Login view for Droidrun Controller - 2025 Edition.

Polished with form styling, proper validation states, and enhanced visual design.
"""

import re
import flet as ft
from ..theme import COLORS, RADIUS, get_shadow, ANIMATION


# Email validation pattern
EMAIL_PATTERN = re.compile(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
)


# Animation curve for smooth transitions
EASE_OUT = ft.AnimationCurve.EASE_OUT


class LoginView(ft.Container):
    """Professional view for user login with polished UI."""

    def __init__(self, app_state, toast, on_navigate=None, **kwargs):
        self.app_state = app_state
        self.toast = toast
        self.on_navigate = on_navigate
        self.email_field = None
        self.password_field = None
        self.email_error = None
        self.password_error = None
        self.is_loading = False

        super().__init__(
            content=self._build_content(),
            expand=True,
            **kwargs
        )

    def _build_content(self):
        """Build the view content."""
        return ft.Column(
            [
                ft.Container(expand=True),
                self._build_login_card(),
                ft.Container(expand=True),
            ],
            spacing=0,
            expand=True,
            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
        )

    def _build_login_card(self):
        """Build the centered login card with form."""
        return ft.Container(
            content=ft.Column(
                [
                    self._build_header(),
                    ft.Container(height=32),
                    self._build_form(),
                    ft.Container(height=24),
                    self._build_submit_button(),
                    ft.Container(height=20),
                    self._build_divider(),
                    ft.Container(height=20),
                    self._build_register_link(),
                ],
                spacing=0,
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            width=420,
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["xl"],
            padding=40,
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("lg"),
            animate=ft.Animation(ANIMATION["normal"], EASE_OUT),
        )

    def _build_header(self):
        """Build the polished header section with logo and title."""
        return ft.Column(
            [
                # Logo container with glow effect
                ft.Container(
                    content=ft.Icon(
                        ft.Icons.ANDROID_ROUNDED,
                        size=48,
                        color=COLORS["primary"],
                    ),
                    width=88,
                    height=88,
                    border_radius=RADIUS["xl"],
                    bgcolor=f"{COLORS['primary']}12",
                    alignment=ft.alignment.center,
                    border=ft.border.all(1, f"{COLORS['primary']}20"),
                    shadow=ft.BoxShadow(
                        spread_radius=0,
                        blur_radius=24,
                        color=f"{COLORS['primary']}30",
                        offset=ft.Offset(0, 8),
                    ),
                ),
                ft.Container(height=24),
                ft.Text(
                    "Welcome Back",
                    size=28,
                    weight=ft.FontWeight.W_700,
                    color=COLORS["text_primary"],
                ),
                ft.Container(height=8),
                ft.Text(
                    "Sign in to continue to Droidrun Controller",
                    size=14,
                    weight=ft.FontWeight.W_400,
                    color=COLORS["text_secondary"],
                    text_align=ft.TextAlign.CENTER,
                ),
            ],
            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            spacing=0,
        )

    def _build_form(self):
        """Build the login form with email and password fields."""
        # Email field
        self.email_field = ft.TextField(
            hint_text="Email address",
            prefix_icon=ft.Icons.EMAIL_ROUNDED,
            border_color=COLORS["border"],
            focused_border_color=COLORS["primary"],
            bgcolor=COLORS["bg_input"],
            color=COLORS["text_primary"],
            hint_style=ft.TextStyle(color=COLORS["text_muted"], size=14),
            cursor_color=COLORS["primary"],
            border_radius=RADIUS["md"],
            content_padding=ft.padding.symmetric(horizontal=16, vertical=16),
            text_size=14,
            keyboard_type=ft.KeyboardType.EMAIL,
            on_change=self._on_email_change,
            on_blur=self._on_email_blur,
            on_submit=self._on_submit,
        )

        self.email_error = ft.Text(
            "",
            size=12,
            color=COLORS["error"],
            visible=False,
        )

        # Password field
        self.password_field = ft.TextField(
            hint_text="Password",
            prefix_icon=ft.Icons.LOCK_ROUNDED,
            password=True,
            can_reveal_password=True,
            border_color=COLORS["border"],
            focused_border_color=COLORS["primary"],
            bgcolor=COLORS["bg_input"],
            color=COLORS["text_primary"],
            hint_style=ft.TextStyle(color=COLORS["text_muted"], size=14),
            cursor_color=COLORS["primary"],
            border_radius=RADIUS["md"],
            content_padding=ft.padding.symmetric(horizontal=16, vertical=16),
            text_size=14,
            on_change=self._on_password_change,
            on_blur=self._on_password_blur,
            on_submit=self._on_submit,
        )

        self.password_error = ft.Text(
            "",
            size=12,
            color=COLORS["error"],
            visible=False,
        )

        return ft.Column(
            [
                # Email field section
                ft.Column(
                    [
                        ft.Text(
                            "Email",
                            size=13,
                            weight=ft.FontWeight.W_500,
                            color=COLORS["text_primary"],
                        ),
                        ft.Container(height=8),
                        self.email_field,
                        ft.Container(height=4),
                        self.email_error,
                    ],
                    spacing=0,
                ),
                ft.Container(height=16),
                # Password field section
                ft.Column(
                    [
                        ft.Row(
                            [
                                ft.Text(
                                    "Password",
                                    size=13,
                                    weight=ft.FontWeight.W_500,
                                    color=COLORS["text_primary"],
                                ),
                                ft.Container(expand=True),
                                ft.TextButton(
                                    content=ft.Text(
                                        "Forgot password?",
                                        size=12,
                                        color=COLORS["primary"],
                                    ),
                                    on_click=self._on_forgot_password,
                                ),
                            ],
                        ),
                        ft.Container(height=8),
                        self.password_field,
                        ft.Container(height=4),
                        self.password_error,
                    ],
                    spacing=0,
                ),
            ],
            spacing=0,
        )

    def _build_submit_button(self):
        """Build the polished submit button."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(
                        ft.Icons.LOGIN_ROUNDED,
                        size=18,
                        color=COLORS["text_inverse"],
                    ),
                    ft.Container(width=10),
                    ft.Text(
                        "Sign In",
                        size=15,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["text_inverse"],
                    ),
                ],
                alignment=ft.MainAxisAlignment.CENTER,
            ),
            width=340,
            height=48,
            bgcolor=COLORS["primary"],
            border_radius=RADIUS["md"],
            alignment=ft.alignment.center,
            shadow=ft.BoxShadow(
                spread_radius=0,
                blur_radius=16,
                color=f"{COLORS['primary']}40",
                offset=ft.Offset(0, 6),
            ),
            animate=ft.Animation(ANIMATION["normal"], EASE_OUT),
            animate_scale=ft.Animation(ANIMATION["normal"], EASE_OUT),
            on_click=self._on_submit,
            on_hover=self._on_submit_button_hover,
        )

    def _build_divider(self):
        """Build an 'or' divider section."""
        return ft.Row(
            [
                ft.Container(
                    height=1,
                    bgcolor=COLORS["border"],
                    expand=True,
                ),
                ft.Container(width=16),
                ft.Text(
                    "or",
                    size=12,
                    color=COLORS["text_muted"],
                ),
                ft.Container(width=16),
                ft.Container(
                    height=1,
                    bgcolor=COLORS["border"],
                    expand=True,
                ),
            ],
        )

    def _build_register_link(self):
        """Build the registration link section."""
        return ft.Row(
            [
                ft.Text(
                    "Don't have an account?",
                    size=14,
                    color=COLORS["text_secondary"],
                ),
                ft.Container(width=6),
                ft.TextButton(
                    content=ft.Text(
                        "Create account",
                        size=14,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["primary"],
                    ),
                    on_click=self._on_register_click,
                ),
            ],
            alignment=ft.MainAxisAlignment.CENTER,
        )

    # Validation helpers
    def _validate_email(self, email: str) -> str | None:
        """Validate email and return error message if invalid."""
        if not email:
            return "Email is required"
        if not EMAIL_PATTERN.match(email):
            return "Please enter a valid email address"
        return None

    def _validate_password(self, password: str) -> str | None:
        """Validate password and return error message if invalid."""
        if not password:
            return "Password is required"
        return None

    def _show_email_error(self, message: str):
        """Show email error with styling."""
        self.email_error.value = message
        self.email_error.visible = True
        self.email_field.border_color = COLORS["error"]
        self.email_error.update()
        self.email_field.update()

    def _clear_email_error(self):
        """Clear email error and reset styling."""
        if self.email_error and self.email_error.visible:
            self.email_error.visible = False
            self.email_error.update()
            self.email_field.border_color = COLORS["border"]
            self.email_field.update()

    def _show_password_error(self, message: str):
        """Show password error with styling."""
        self.password_error.value = message
        self.password_error.visible = True
        self.password_field.border_color = COLORS["error"]
        self.password_error.update()
        self.password_field.update()

    def _clear_password_error(self):
        """Clear password error and reset styling."""
        if self.password_error and self.password_error.visible:
            self.password_error.visible = False
            self.password_error.update()
            self.password_field.border_color = COLORS["border"]
            self.password_field.update()

    # Event handlers
    def _on_submit_button_hover(self, e):
        """Handle submit button hover effect."""
        if e.data == "true":
            e.control.scale = 1.02
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=24,
                color=f"{COLORS['primary']}50",
                offset=ft.Offset(0, 10),
            )
        else:
            e.control.scale = 1.0
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=16,
                color=f"{COLORS['primary']}40",
                offset=ft.Offset(0, 6),
            )
        e.control.update()

    def _on_email_change(self, e):
        """Handle email field change - clear error."""
        self._clear_email_error()

    def _on_email_blur(self, e):
        """Handle email field blur - validate."""
        email = self.email_field.value or ""
        error = self._validate_email(email)
        if error:
            self._show_email_error(error)

    def _on_password_change(self, e):
        """Handle password field change - clear error."""
        self._clear_password_error()

    def _on_password_blur(self, e):
        """Handle password field blur - validate."""
        password = self.password_field.value or ""
        error = self._validate_password(password)
        if error:
            self._show_password_error(error)

    async def _on_submit(self, e):
        """Handle form submission."""
        if self.is_loading:
            return

        # Validate fields
        email = self.email_field.value or ""
        password = self.password_field.value or ""

        is_valid = True

        # Validate email using helper
        email_error = self._validate_email(email)
        if email_error:
            self._show_email_error(email_error)
            is_valid = False

        # Validate password using helper
        password_error = self._validate_password(password)
        if password_error:
            self._show_password_error(password_error)
            is_valid = False

        if not is_valid:
            return

        # Show loading state
        self.is_loading = True
        self.toast.info("Signing in...")

        # Simulate authentication (will be replaced with actual auth)
        self.is_loading = False
        self.toast.success("Sign in successful!")

    async def _on_forgot_password(self, e):
        """Handle forgot password click."""
        self.toast.info("Password reset is not yet implemented")

    async def _on_register_click(self, e):
        """Handle register link click."""
        if self.on_navigate:
            self.on_navigate("registration")
        else:
            self.toast.info("Navigate to registration page")

    def refresh(self):
        """Refresh the view."""
        self.content = self._build_content()
        self.update()
