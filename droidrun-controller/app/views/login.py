"""Login view for Droidrun Controller - 2025 Edition.

Professional login form with polished styling and smooth animations.
"""

import flet as ft
from ..theme import COLORS, RADIUS, get_shadow, ANIMATION


# Animation curve for smooth transitions
EASE_OUT = ft.AnimationCurve.EASE_OUT


class LoginView(ft.Container):
    """Professional login view for user authentication."""

    def __init__(self, app_state, toast, on_navigate=None, **kwargs):
        self.app_state = app_state
        self.toast = toast
        self.on_navigate = on_navigate
        self.email_field = None
        self.password_field = None
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
            scroll=ft.ScrollMode.AUTO,
        )

    def _build_login_card(self):
        """Build the centered login card."""
        return ft.Container(
            content=ft.Column(
                [
                    self._build_header(),
                    ft.Container(height=32),
                    self._build_login_form(),
                    ft.Container(height=24),
                    self._build_forgot_password_link(),
                    ft.Container(height=32),
                    self._build_submit_button(),
                    ft.Container(height=24),
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
        """Build the polished header section with icon and title."""
        return ft.Column(
            [
                ft.Container(
                    content=ft.Icon(
                        ft.Icons.LOCK_PERSON_ROUNDED,
                        size=32,
                        color=COLORS["primary"],
                    ),
                    width=72,
                    height=72,
                    bgcolor=f"{COLORS['primary']}12",
                    border_radius=RADIUS["xl"],
                    alignment=ft.alignment.center,
                    border=ft.border.all(1, f"{COLORS['primary']}20"),
                    shadow=ft.BoxShadow(
                        spread_radius=0,
                        blur_radius=20,
                        color=f"{COLORS['primary']}25",
                        offset=ft.Offset(0, 6),
                    ),
                ),
                ft.Container(height=20),
                ft.Text(
                    "Đăng nhập",
                    size=28,
                    weight=ft.FontWeight.W_800,
                    color=COLORS["text_primary"],
                    text_align=ft.TextAlign.CENTER,
                ),
                ft.Container(height=8),
                ft.Text(
                    "Đăng nhập vào tài khoản của bạn",
                    size=14,
                    weight=ft.FontWeight.W_400,
                    color=COLORS["text_secondary"],
                    text_align=ft.TextAlign.CENTER,
                ),
            ],
            spacing=0,
            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
        )

    def _build_login_form(self):
        """Build the login form with email and password fields."""
        self.email_field = self._build_input_field(
            label="Email hoặc tên đăng nhập",
            hint="Nhập email hoặc tên đăng nhập",
            icon=ft.Icons.EMAIL_ROUNDED,
            password=False,
        )

        self.password_field = self._build_input_field(
            label="Mật khẩu",
            hint="Nhập mật khẩu",
            icon=ft.Icons.LOCK_ROUNDED,
            password=True,
        )

        return ft.Column(
            [
                self.email_field,
                ft.Container(height=20),
                self.password_field,
            ],
            spacing=0,
            expand=False,
        )

    def _build_input_field(self, label: str, hint: str, icon: str, password: bool = False):
        """Build a styled input field with label."""
        text_field = ft.TextField(
            hint_text=hint,
            password=password,
            can_reveal_password=password,
            bgcolor=COLORS["bg_input"],
            border_color=COLORS["border"],
            focused_border_color=COLORS["primary"],
            border_radius=RADIUS["md"],
            content_padding=ft.padding.only(left=48, right=16, top=14, bottom=14),
            text_style=ft.TextStyle(
                size=14,
                color=COLORS["text_primary"],
            ),
            hint_style=ft.TextStyle(
                size=14,
                color=COLORS["text_muted"],
            ),
            cursor_color=COLORS["primary"],
        )

        return ft.Column(
            [
                ft.Text(
                    label,
                    size=13,
                    weight=ft.FontWeight.W_500,
                    color=COLORS["text_primary"],
                ),
                ft.Container(height=8),
                ft.Stack(
                    [
                        text_field,
                        ft.Container(
                            content=ft.Icon(
                                icon,
                                size=18,
                                color=COLORS["text_muted"],
                            ),
                            width=48,
                            height=48,
                            alignment=ft.alignment.center,
                        ),
                    ],
                ),
            ],
            spacing=0,
        )

    def _build_forgot_password_link(self):
        """Build the forgot password link."""
        return ft.Container(
            content=ft.Text(
                "Quên mật khẩu?",
                size=13,
                weight=ft.FontWeight.W_500,
                color=COLORS["primary"],
            ),
            on_click=self._on_forgot_password,
            on_hover=self._on_link_hover,
            animate=ft.Animation(ANIMATION["fast"], EASE_OUT),
        )

    def _build_submit_button(self):
        """Build the login submit button."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(
                        ft.Icons.LOGIN_ROUNDED,
                        size=18,
                        color=COLORS["text_inverse"],
                    ),
                    ft.Container(width=8),
                    ft.Text(
                        "Đăng nhập",
                        size=15,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["text_inverse"],
                    ),
                ],
                alignment=ft.MainAxisAlignment.CENTER,
            ),
            width=340,
            height=52,
            bgcolor=COLORS["primary"],
            border_radius=RADIUS["lg"],
            alignment=ft.alignment.center,
            shadow=ft.BoxShadow(
                spread_radius=0,
                blur_radius=20,
                color=f"{COLORS['primary']}40",
                offset=ft.Offset(0, 6),
            ),
            animate=ft.Animation(ANIMATION["normal"], EASE_OUT),
            animate_scale=ft.Animation(ANIMATION["normal"], EASE_OUT),
            on_click=self._on_login,
            on_hover=self._on_primary_button_hover,
        )

    def _build_register_link(self):
        """Build the register link section."""
        return ft.Row(
            [
                ft.Text(
                    "Chưa có tài khoản?",
                    size=13,
                    weight=ft.FontWeight.W_400,
                    color=COLORS["text_secondary"],
                ),
                ft.Container(width=4),
                ft.Container(
                    content=ft.Text(
                        "Đăng ký ngay",
                        size=13,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["primary"],
                    ),
                    on_click=self._on_register,
                    on_hover=self._on_link_hover,
                    animate=ft.Animation(ANIMATION["fast"], EASE_OUT),
                ),
            ],
            alignment=ft.MainAxisAlignment.CENTER,
        )

    # Event handlers
    def _on_primary_button_hover(self, e):
        """Handle primary button hover effect."""
        if e.data == "true":
            e.control.scale = 1.02
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=28,
                color=f"{COLORS['primary']}50",
                offset=ft.Offset(0, 10),
            )
        else:
            e.control.scale = 1.0
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=20,
                color=f"{COLORS['primary']}40",
                offset=ft.Offset(0, 6),
            )
        e.control.update()

    def _on_link_hover(self, e):
        """Handle link hover effect."""
        if e.data == "true":
            e.control.opacity = 0.8
        else:
            e.control.opacity = 1.0
        e.control.update()

    async def _on_login(self, e):
        """Handle login button click."""
        # UI only - show toast message
        self.toast.info("Đang xử lý đăng nhập...")

    async def _on_forgot_password(self, e):
        """Handle forgot password link click."""
        if self.on_navigate:
            self.on_navigate("forgot_password")
        else:
            self.toast.info("Chuyển đến trang quên mật khẩu")

    async def _on_register(self, e):
        """Handle register link click."""
        if self.on_navigate:
            self.on_navigate("registration")
        else:
            self.toast.info("Chuyển đến trang đăng ký")

    def refresh(self):
        """Refresh the view."""
        self.content = self._build_content()
        self.update()
