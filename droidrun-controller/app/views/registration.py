"""Registration view for Droidrun Controller - 2025 Edition.

Professional registration form with polished styling and smooth animations.
"""

import flet as ft
from ..theme import COLORS, RADIUS, get_shadow, ANIMATION


# Animation curve for smooth transitions
EASE_OUT = ft.AnimationCurve.EASE_OUT


class RegistrationView(ft.Container):
    """Professional registration view for new user signup."""

    def __init__(self, app_state, toast, on_navigate=None, **kwargs):
        self.app_state = app_state
        self.toast = toast
        self.on_navigate = on_navigate
        self.fullname_field = None
        self.email_field = None
        self.password_field = None
        self.confirm_password_field = None
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
                self._build_registration_card(),
                ft.Container(expand=True),
            ],
            spacing=0,
            expand=True,
            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            scroll=ft.ScrollMode.AUTO,
        )

    def _build_registration_card(self):
        """Build the centered registration card."""
        return ft.Container(
            content=ft.Column(
                [
                    self._build_header(),
                    ft.Container(height=32),
                    self._build_registration_form(),
                    ft.Container(height=32),
                    self._build_submit_button(),
                    ft.Container(height=24),
                    self._build_login_link(),
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
                        ft.Icons.PERSON_ADD_ROUNDED,
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
                    "Đăng ký",
                    size=28,
                    weight=ft.FontWeight.W_800,
                    color=COLORS["text_primary"],
                    text_align=ft.TextAlign.CENTER,
                ),
                ft.Container(height=8),
                ft.Text(
                    "Tạo tài khoản mới của bạn",
                    size=14,
                    weight=ft.FontWeight.W_400,
                    color=COLORS["text_secondary"],
                    text_align=ft.TextAlign.CENTER,
                ),
            ],
            spacing=0,
            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
        )

    def _build_registration_form(self):
        """Build the registration form with all required fields."""
        self.fullname_field = self._build_input_field(
            label="Họ và tên",
            hint="Nhập họ và tên đầy đủ",
            icon=ft.Icons.PERSON_ROUNDED,
            password=False,
        )

        self.email_field = self._build_input_field(
            label="Email",
            hint="Nhập địa chỉ email",
            icon=ft.Icons.EMAIL_ROUNDED,
            password=False,
        )

        self.password_field = self._build_input_field(
            label="Mật khẩu",
            hint="Nhập mật khẩu (tối thiểu 8 ký tự)",
            icon=ft.Icons.LOCK_ROUNDED,
            password=True,
        )

        self.confirm_password_field = self._build_input_field(
            label="Xác nhận mật khẩu",
            hint="Nhập lại mật khẩu",
            icon=ft.Icons.LOCK_OUTLINE_ROUNDED,
            password=True,
        )

        return ft.Column(
            [
                self.fullname_field,
                ft.Container(height=20),
                self.email_field,
                ft.Container(height=20),
                self.password_field,
                ft.Container(height=20),
                self.confirm_password_field,
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

    def _build_submit_button(self):
        """Build the registration submit button."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(
                        ft.Icons.PERSON_ADD_ROUNDED,
                        size=18,
                        color=COLORS["text_inverse"],
                    ),
                    ft.Container(width=8),
                    ft.Text(
                        "Đăng ký",
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
            on_click=self._on_register,
            on_hover=self._on_primary_button_hover,
        )

    def _build_login_link(self):
        """Build the login link section."""
        return ft.Row(
            [
                ft.Text(
                    "Đã có tài khoản?",
                    size=13,
                    weight=ft.FontWeight.W_400,
                    color=COLORS["text_secondary"],
                ),
                ft.Container(width=4),
                ft.Container(
                    content=ft.Text(
                        "Đăng nhập",
                        size=13,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["primary"],
                    ),
                    on_click=self._on_login,
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

    async def _on_register(self, e):
        """Handle register button click."""
        # UI only - show toast message
        self.toast.info("Đang xử lý đăng ký...")

    async def _on_login(self, e):
        """Handle login link click."""
        if self.on_navigate:
            self.on_navigate("login")
        else:
            self.toast.info("Chuyển đến trang đăng nhập")

    def refresh(self):
        """Refresh the view."""
        self.content = self._build_content()
        self.update()
