"""Professional Packages view for Droidrun Controller - 2025 Edition.

Displays available subscription packages and user's current subscription with stunning UI.
"""

import flet as ft
from ..theme import get_colors, RADIUS, SPACING, ANIMATION, get_shadow, get_theme_mode
from ..services.package_service import get_package_service, Package, Subscription
from datetime import datetime



# Dynamic color proxy - acts like a dict but always gets current theme colors
class _DynamicColors:
    def get(self, key, default=None):
        return get_colors().get(key, default)
    
    def __getitem__(self, key):
        return get_colors()[key]

COLORS = _DynamicColors()

class PackagesView(ft.Column):
    """Professional packages view with pricing cards and subscription management."""

    def __init__(self, app_state, toast, **kwargs):
        """Initialize the packages view.

        Args:
            app_state: Application state dictionary
            toast: Toast manager for notifications
        """
        self.app_state = app_state
        self.toast = toast
        self.package_service = get_package_service()

        # State
        self._is_loading = True
        self._packages = []
        self._current_subscription = None

        # UI references
        self.packages_container = None
        self.subscription_card = None
        self.loading_indicator = None

        super().__init__(
            spacing=SPACING["xl"],
            scroll=ft.ScrollMode.AUTO,
            expand=True,
            **kwargs
        )

        # Build initial UI
        self._build_ui()

    def _build_ui(self):
        """Build the packages UI."""
        colors = COLORS

        # Header section with gradient background
        header = ft.Container(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.CARD_MEMBERSHIP,
                                    size=40,
                                    color=colors["primary"],
                                ),
                                width=64,
                                height=64,
                                border_radius=RADIUS["lg"],
                                bgcolor=f"{colors['primary']}15",
                                alignment=ft.Alignment(0, 0),
                            ),
                            ft.Container(width=SPACING["lg"]),
                            ft.Column(
                                [
                                    ft.Text(
                                        "🎯 Gói Dịch Vụ",
                                        size=32,
                                        weight=ft.FontWeight.W_900,
                                        color=colors["text_primary"],
                                    ),
                                    ft.Container(height=4),
                                    ft.Text(
                                        "Chọn gói phù hợp nhất cho nhu cầu automation của bạn",
                                        size=15,
                                        color=colors["text_secondary"],
                                    ),
                                ],
                                spacing=0,
                            ),
                        ],
                    ),
                ],
                spacing=0,
            ),
            padding=ft.padding.all(24),
            margin=ft.margin.only(bottom=SPACING["xl"]),
            border_radius=RADIUS["xl"],
            bgcolor=colors["bg_card"],
            border=ft.border.all(1, colors["border"]),
            shadow=get_shadow("md"),
        )

        # Current subscription card placeholder
        self.subscription_card = ft.Container(
            visible=False,
        )

        # Loading indicator
        self.loading_indicator = ft.Container(
            content=ft.Column(
                [
                    ft.ProgressRing(width=50, height=50, color=colors["primary"]),
                    ft.Container(height=20),
                    ft.Text(
                        "Đang tải gói dịch vụ...",
                        size=16,
                        weight=ft.FontWeight.W_600,
                        color=colors["text_secondary"]
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                alignment=ft.MainAxisAlignment.CENTER,
            ),
            alignment=ft.Alignment(0, 0),
            padding=ft.padding.all(80),
        )

        # Packages container
        self.packages_container = ft.Container(
            content=self.loading_indicator,
        )

        # Add all to column
        self.controls = [
            header,
            self.subscription_card,
            self.packages_container,
        ]

    async def load_data(self):
        """Load packages and subscription data from API."""
        if not hasattr(self, 'page') or self.page is None:
            return

        self._is_loading = True
        self._show_loading()

        try:
            # Get auth service to access token
            from ..services.auth_service import get_auth_service
            auth_service = get_auth_service()

            # Set token for package service
            self.package_service.token = auth_service.token

            # Load packages and current subscription
            packages_result = await self.package_service.get_available_packages()
            subscription_result = await self.package_service.get_current_subscription()

            if packages_result.success:
                self._packages = packages_result.packages or []
            else:
                self.toast.error(f"Không thể tải gói dịch vụ: {packages_result.message}")

            if subscription_result.success and subscription_result.subscription:
                self._current_subscription = subscription_result.subscription
                self._build_subscription_card()
            else:
                self._current_subscription = None

            # Build packages UI
            self._build_packages()

        except Exception as e:
            self.toast.error(f"Lỗi: {str(e)}")
        finally:
            self._is_loading = False

    def _show_loading(self):
        """Show loading state."""
        self.loading_indicator.visible = True
        if self.page:
            self.update()

    def _build_subscription_card(self):
        """Build current subscription card with beautiful design."""
        if not self._current_subscription:
            self.subscription_card.visible = False
            return

        colors = COLORS
        sub = self._current_subscription

        # Calculate days remaining
        days_remaining = (sub.expires_at - datetime.now()).days if sub.expires_at else 0

        # Status color and icon
        status_map = {
            "active": (colors["success"], ft.Icons.CHECK_CIRCLE, "Đang hoạt động"),
            "cancelled": (colors["warning"], ft.Icons.CANCEL, "Đã hủy"),
            "expired": (colors["error"], ft.Icons.ERROR, "Hết hạn"),
        }
        status_color, status_icon, status_text = status_map.get(
            sub.status, (colors["text_muted"], ft.Icons.HELP, "Không xác định")
        )

        self.subscription_card.content = ft.Container(
            content=ft.Column(
                [
                    # Header with animated icon
                    ft.Row(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.WORKSPACE_PREMIUM,
                                    size=28,
                                    color=colors["primary"],
                                ),
                                width=56,
                                height=56,
                                border_radius=RADIUS["lg"],
                                bgcolor=f"{colors['primary']}20",
                                alignment=ft.Alignment(0, 0)
                            ),
                            ft.Container(width=SPACING["lg"]),
                            ft.Column(
                                [
                                    ft.Text(
                                        "🎉 Gói Hiện Tại",
                                        size=13,
                                        weight=ft.FontWeight.W_500,
                                        color=colors["text_muted"],
                                    ),
                                    ft.Text(
                                        sub.package_name,
                                        size=24,
                                        weight=ft.FontWeight.W_800,
                                        color=colors["text_primary"],
                                    ),
                                ],
                                spacing=4,
                            ),
                            ft.Container(expand=True),
                            # Status badge
                            ft.Container(
                                content=ft.Row(
                                    [
                                        ft.Icon(status_icon, size=16, color=status_color),
                                        ft.Container(width=6),
                                        ft.Text(
                                            status_text,
                                            size=13,
                                            weight=ft.FontWeight.W_600,
                                            color=status_color,
                                        ),
                                    ],
                                    spacing=0,
                                ),
                                padding=ft.padding.symmetric(horizontal=14, vertical=8),
                                border_radius=RADIUS["full"],
                                bgcolor=f"{status_color}15",
                                border=ft.border.all(1, f"{status_color}30"),
                            ),
                        ],
                        alignment=ft.MainAxisAlignment.SPACE_BETWEEN,
                    ),
                    ft.Container(height=SPACING["xl"]),
                    # Info cards grid
                    ft.Row(
                        [
                            self._build_stat_card(
                                "⏰ Hết hạn sau",
                                f"{days_remaining} ngày",
                                colors["primary"],
                                ft.Icons.SCHEDULE,
                            ),
                            self._build_stat_card(
                                "🔄 Tự động gia hạn",
                                "Bật" if sub.auto_renew else "Tắt",
                                colors["success"] if sub.auto_renew else colors["text_muted"],
                                ft.Icons.AUTORENEW if sub.auto_renew else ft.Icons.BLOCK,
                            ),
                            self._build_stat_card(
                                "⚡ Credits còn lại",
                                f"{sub.credits_remaining:,}" if sub.credits_remaining else "N/A",
                                colors["accent_cyan"],
                                ft.Icons.BOLT,
                            ),
                        ],
                        spacing=SPACING["md"],
                        wrap=True,
                    ),
                    ft.Container(height=SPACING["lg"]),
                    # Action button
                    ft.ElevatedButton(
                        content=ft.Row(
                            [
                                ft.Icon(ft.Icons.SETTINGS, size=20),
                                ft.Text("Quản lý gói dịch vụ", size=15, weight=ft.FontWeight.W_600),
                            ],
                            spacing=8,
                            alignment=ft.MainAxisAlignment.CENTER,
                        ),
                        style=ft.ButtonStyle(
                            color=colors["text_inverse"],
                            bgcolor=colors["primary"],
                            padding=ft.padding.symmetric(horizontal=24, vertical=16),
                        ),
                        width=float("inf"),
                        on_click=self._on_manage_subscription,
                    ),
                ],
            ),
            bgcolor=colors["bg_card"],
            border_radius=RADIUS["xl"],
            padding=ft.padding.all(28),
            border=ft.border.all(2, colors["primary"]),
            margin=ft.margin.only(bottom=SPACING["xl"]),
        )
        self.subscription_card.visible = True

    def _build_stat_card(self, label: str, value: str, color: str, icon):
        """Build a stat card."""
        colors = COLORS
        return ft.Container(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            ft.Icon(icon, size=18, color=color),
                            ft.Container(width=6),
                            ft.Text(
                                label,
                                size=12,
                                color=colors["text_muted"],
                                weight=ft.FontWeight.W_500,
                            ),
                        ],
                    ),
                    ft.Container(height=6),
                    ft.Text(
                        value,
                        size=18,
                        weight=ft.FontWeight.W_700,
                        color=color,
                    ),
                ],
                spacing=0,
            ),
            padding=ft.padding.all(16),
            border_radius=RADIUS["lg"],
            bgcolor=f"{color}08",
            border=ft.border.all(1, f"{color}20"),
            expand=True,
        )

    def _build_packages(self):
        """Build packages grid with beautiful cards."""
        colors = COLORS

        if not self._packages:
            # Empty state
            self.packages_container.content = ft.Container(
                content=ft.Column(
                    [
                        ft.Icon(
                            ft.Icons.INVENTORY_2_OUTLINED,
                            size=64,
                            color=colors["text_muted"],
                        ),
                        ft.Container(height=20),
                        ft.Text(
                            "Không có gói dịch vụ nào",
                            size=18,
                            weight=ft.FontWeight.W_700,
                            color=colors["text_secondary"],
                        ),
                        ft.Text(
                            "Vui lòng quay lại sau",
                            size=14,
                            color=colors["text_muted"],
                        ),
                    ],
                    horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                    alignment=ft.MainAxisAlignment.CENTER,
                ),
                alignment=ft.Alignment(0, 0),
                padding=ft.padding.all(80),
            )
            if self.page:
                self.update()
            return

        # Build package cards
        package_cards = []
        for package in self._packages:
            package_cards.append(self._build_package_card(package))

        # Create responsive grid
        self.packages_container.content = ft.Column(
            [
                ft.Container(
                    content=ft.Text(
                        "📦 Chọn Gói Phù Hợp",
                        size=22,
                        weight=ft.FontWeight.W_800,
                        color=colors["text_primary"],
                    ),
                    margin=ft.margin.only(bottom=SPACING["lg"]),
                ),
                ft.Row(
                    package_cards,
                    spacing=SPACING["lg"],
                    wrap=True,
                    alignment=ft.MainAxisAlignment.START,
                ),
            ],
        )

        if self.page:
            self.update()

    def _build_package_card(self, package: Package):
        """Build a beautiful package pricing card."""
        colors = COLORS

        # Format price
        price_str = f"{package.price:,.0f}"
        if package.currency == "VND":
            price_display = f"{price_str}đ"
        else:
            price_display = f"${price_str}"

        # Original price
        original_price_display = None
        if package.price > 0 and hasattr(package, 'is_popular'):
            # Calculate from original_price if available via API
            pass

        # Duration display
        if package.duration_days == 30:
            duration = "tháng"
        elif package.duration_days == 365:
            duration = "năm"
        elif package.duration_days == 7:
            duration = "7 ngày"
        else:
            duration = f"{package.duration_days} ngày"

        # Check if user has this package
        is_current = (
            self._current_subscription
            and self._current_subscription.package_id == package.id
            and self._current_subscription.status == "active"
        )

        # Popular badge
        badge_container = None
        if package.is_popular:
            badge_container = ft.Container(
                content=ft.Text(
                    "⭐ PHỔ BIẾN NHẤT",
                    size=11,
                    weight=ft.FontWeight.W_800,
                    color=colors["text_inverse"],
                ),
                bgcolor=colors["error"],
                padding=ft.padding.symmetric(horizontal=14, vertical=7),
                border_radius=RADIUS["full"]
            )

        # Features list
        features_list = []
        for feature in package.features[:8]:  # Limit to 8 features for clean UI
            features_list.append(
                ft.Row(
                    [
                        ft.Icon(
                            ft.Icons.CHECK_CIRCLE_ROUNDED,
                            size=18,
                            color=colors["success"],
                        ),
                        ft.Container(width=10),
                        ft.Text(
                            feature,
                            size=13,
                            color=colors["text_secondary"],
                            weight=ft.FontWeight.W_500,
                        ),
                    ],
                    spacing=0,
                )
            )

        # More features indicator
        if len(package.features) > 8:
            features_list.append(
                ft.Text(
                    f"+ {len(package.features) - 8} tính năng khác...",
                    size=12,
                    color=colors["primary"],
                    weight=ft.FontWeight.W_600,
                    italic=True,
                )
            )

        # Card content
        card_content = ft.Column(
            [
                # Badge and header
                ft.Row(
                    [
                        ft.Text(
                            package.name,
                            size=24,
                            weight=ft.FontWeight.W_800,
                            color=colors["text_primary"],
                        ),
                        ft.Container(expand=True),
                        badge_container if badge_container else ft.Container(),
                    ],
                    alignment=ft.MainAxisAlignment.SPACE_BETWEEN,
                ),
                ft.Container(height=SPACING["sm"]),
                # Description
                ft.Text(
                    package.description,
                    size=14,
                    color=colors["text_secondary"],
                    weight=ft.FontWeight.W_500,
                ),
                ft.Container(height=SPACING["xl"]),
                # Price
                ft.Row(
                    [
                        ft.Text(
                            price_display if package.price > 0 else "MIỄN PHÍ",
                            size=40,
                            weight=ft.FontWeight.W_900,
                            color=colors["primary"] if package.price > 0 else colors["success"],
                        ),
                        ft.Container(width=6),
                        ft.Column(
                            [
                                ft.Text(
                                    f"/{duration}" if package.price > 0 else "",
                                    size=15,
                                    color=colors["text_muted"],
                                    weight=ft.FontWeight.W_600,
                                ),
                            ],
                            alignment=ft.MainAxisAlignment.END,
                        ),
                    ],
                    spacing=0,
                    alignment=ft.MainAxisAlignment.START,
                ),
                ft.Container(height=SPACING["xl"]),
                # Divider
                ft.Container(
                    height=2,
                    bgcolor=colors["border"],
                    border_radius=RADIUS["xs"],
                ),
                ft.Container(height=SPACING["lg"]),
                # Features
                ft.Column(
                    features_list,
                    spacing=SPACING["md"],
                ),
                ft.Container(expand=True),
                ft.Container(height=SPACING["lg"]),
                # Action button
                ft.ElevatedButton(
                    content=ft.Row(
                        [
                            ft.Icon(
                                ft.Icons.CHECK if is_current else ft.Icons.SHOPPING_CART,
                                size=20
                            ),
                            ft.Text(
                                "Gói hiện tại" if is_current else "Đăng ký ngay",
                                size=15,
                                weight=ft.FontWeight.W_700,
                            ),
                        ],
                        alignment=ft.MainAxisAlignment.CENTER,
                        spacing=8,
                    ),
                    style=ft.ButtonStyle(
                        color=colors["text_inverse"] if not is_current else colors["text_muted"],
                        bgcolor=colors["primary"] if not is_current else colors["bg_tertiary"],
                        padding=ft.padding.symmetric(horizontal=24, vertical=16),
                        shadow_color=f"{colors['primary']}40" if not is_current else "transparent",
                    ),
                    width=float("inf"),
                    disabled=is_current,
                    on_click=lambda e, pkg=package: self._on_subscribe(pkg),
                ),
            ],
            spacing=0,
        )

        # Highlight if popular
        border_color = colors["error"] if package.is_popular else colors["border"]
        border_width = 2 if package.is_popular else 1
        shadow = get_shadow("xl") if package.is_popular else get_shadow("md")

        # Transform scale on hover
        hover_scale = 1.02 if not is_current else 1.0

        return ft.Container(
            content=card_content,
            width=350,
            bgcolor=colors["bg_card"],
            border_radius=RADIUS["xl"],
            padding=ft.padding.all(32),
            border=ft.border.all(border_width, border_color),
            shadow=shadow,
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            animate_scale=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            on_hover=lambda e: setattr(e.control, 'scale', hover_scale if e.data == "true" else 1.0) or e.control.update(),
        )

    async def _on_subscribe(self, package: Package):
        """Handle subscribe button click."""
        self.toast.info(f"Đang đăng ký gói {package.name}...")

        try:
            result = await self.package_service.subscribe(package.id)

            if result.success:
                self.toast.success(f"✅ Đăng ký thành công gói {package.name}!")
                # Reload data to refresh subscription status
                await self.load_data()
            else:
                self.toast.error(f"❌ Đăng ký thất bại: {result.message}")

        except Exception as e:
            self.toast.error(f"❌ Lỗi: {str(e)}")

    def _on_manage_subscription(self, e):
        """Handle manage subscription button click."""
        self.toast.info("Tính năng quản lý gói đang được phát triển...")

    async def did_mount_async(self):
        """Called when view is mounted."""
        await self.load_data()
