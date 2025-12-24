"""Professional Dashboard view for Droidrun Controller - 2025 Design.

Polished with improved header, enhanced stats cards, refined chart styling,
and device list with hover effects.
"""

import flet as ft
from ..theme import COLORS, RADIUS, get_shadow, ANIMATION
from ..backend import backend


class DevicesView(ft.Column):
    """Professional dashboard view with stats cards and device management."""

    def __init__(self, app_state, toast):
        self.app_state = app_state
        self.toast = toast
        self.devices = []
        self.backend = backend
        self.loading = False

        super().__init__(
            controls=self._build_controls(),
            spacing=0,
            scroll=ft.ScrollMode.AUTO,
            expand=True,
        )

    def _build_controls(self):
        """Build the dashboard controls."""
        return [
            # Header
            self._build_header(),
            ft.Container(height=28),
            # Stats row
            self._build_stats_row(),
            ft.Container(height=28),
            # Main content
            self._build_main_content(),
        ]

    def _build_header(self):
        """Build the polished header section with enhanced styling."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Column(
                        [
                            ft.Row(
                                [
                                    ft.Text(
                                        "Dashboard",
                                        size=32,
                                        weight=ft.FontWeight.W_800,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Container(width=16),
                                    ft.Container(
                                        content=ft.Icon(
                                            ft.Icons.DASHBOARD_ROUNDED,
                                            size=22,
                                            color=COLORS["primary"],
                                        ),
                                        width=44,
                                        height=44,
                                        bgcolor=f"{COLORS['primary']}12",
                                        border_radius=RADIUS["lg"],
                                        alignment=ft.alignment.center,
                                        border=ft.border.all(1, f"{COLORS['primary']}20"),
                                        shadow=ft.BoxShadow(
                                            spread_radius=0,
                                            blur_radius=16,
                                            color=f"{COLORS['primary']}25",
                                            offset=ft.Offset(0, 4),
                                        ),
                                    ),
                                ],
                                vertical_alignment=ft.CrossAxisAlignment.CENTER,
                            ),
                            ft.Container(height=4),
                            ft.Text(
                                "Overview of your Android automation system",
                                size=14,
                                weight=ft.FontWeight.W_400,
                                color=COLORS["text_secondary"],
                            ),
                        ],
                        spacing=4,
                    ),
                    ft.Container(expand=True),
                    # Quick actions row
                    ft.Row(
                        [
                            ft.Container(
                                content=ft.IconButton(
                                    icon=ft.Icons.NOTIFICATIONS_OUTLINED,
                                    icon_size=20,
                                    icon_color=COLORS["text_secondary"],
                                    tooltip="Notifications",
                                ),
                                width=44,
                                height=44,
                                bgcolor=COLORS["bg_tertiary"],
                                border_radius=RADIUS["md"],
                                alignment=ft.alignment.center,
                                border=ft.border.all(1, COLORS["border_subtle"]),
                            ),
                            ft.Container(width=8),
                            ft.Container(
                                content=ft.IconButton(
                                    icon=ft.Icons.MORE_HORIZ,
                                    icon_size=20,
                                    icon_color=COLORS["text_secondary"],
                                    tooltip="More options",
                                ),
                                width=44,
                                height=44,
                                bgcolor=COLORS["bg_tertiary"],
                                border_radius=RADIUS["md"],
                                alignment=ft.alignment.center,
                                border=ft.border.all(1, COLORS["border_subtle"]),
                            ),
                            ft.Container(width=16),
                            self._build_scan_button(),
                        ],
                        spacing=0,
                    ),
                ],
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.only(bottom=8),
        )

    def _build_scan_button(self):
        """Build the polished scan devices button."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.RADAR,
                            size=18,
                            color=COLORS["text_inverse"],
                        ),
                        width=36,
                        height=36,
                        bgcolor=f"{COLORS['primary_dark']}40",
                        border_radius=RADIUS["md"],
                        alignment=ft.alignment.center,
                    ),
                    ft.Container(width=12),
                    ft.Text(
                        "Scan Devices",
                        size=14,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["text_inverse"],
                    ),
                ],
                alignment=ft.MainAxisAlignment.CENTER,
            ),
            bgcolor=COLORS["primary"],
            border_radius=RADIUS["lg"],
            padding=ft.padding.only(left=8, right=20, top=10, bottom=10),
            shadow=ft.BoxShadow(
                spread_radius=0,
                blur_radius=20,
                color=f"{COLORS['primary']}40",
                offset=ft.Offset(0, 6),
            ),
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            animate_scale=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            on_hover=lambda e: self._on_scan_hover(e),
            on_click=self._on_refresh,
        )

    def _on_scan_hover(self, e):
        """Handle scan button hover effect."""
        if e.data == "true":
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=28,
                color=f"{COLORS['primary']}55",
                offset=ft.Offset(0, 10),
            )
            e.control.scale = 1.02
        else:
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=20,
                color=f"{COLORS['primary']}40",
                offset=ft.Offset(0, 6),
            )
            e.control.scale = 1.0
        e.control.update()

    def _build_stats_row(self):
        """Build the enhanced stats cards row."""
        total = len(self.devices)
        online = len([d for d in self.devices if d.get("status") == "connected"])

        stats = [
            {
                "title": "Connected Devices",
                "value": str(total),
                "subtitle": "Total connected via ADB",
                "icon": ft.Icons.PHONE_ANDROID_ROUNDED,
                "color": COLORS["accent_blue"],
                "trend": None,
            },
            {
                "title": "Online Devices",
                "value": str(online),
                "subtitle": "Ready for automation",
                "icon": ft.Icons.CHECK_CIRCLE_OUTLINE_ROUNDED,
                "color": COLORS["success"],
                "trend": "up" if online > 0 else None,
            },
            {
                "title": "Agent Runs",
                "value": "12",
                "subtitle": "Total executions today",
                "icon": ft.Icons.SMART_TOY_OUTLINED,
                "color": COLORS["accent_purple"],
                "trend": "up",
            },
            {
                "title": "Success Rate",
                "value": "85%",
                "subtitle": "Last 24 hours",
                "icon": ft.Icons.TRENDING_UP_ROUNDED,
                "color": COLORS["success"],
                "trend": "up",
            },
        ]

        cards = [self._build_stat_card(s) for s in stats]

        return ft.Row(cards, spacing=20)

    def _build_stat_card(self, stat: dict):
        """Build a single enhanced stat card with hover effects."""
        color = stat["color"]

        # Build trend indicator if provided
        trend_indicator = None
        if stat.get("trend"):
            trend_color = COLORS["success"] if stat["trend"] == "up" else COLORS["error"]
            trend_icon = ft.Icons.ARROW_UPWARD_ROUNDED if stat["trend"] == "up" else ft.Icons.ARROW_DOWNWARD_ROUNDED
            trend_indicator = ft.Container(
                content=ft.Icon(
                    trend_icon,
                    size=14,
                    color=trend_color,
                ),
                width=24,
                height=24,
                border_radius=6,
                bgcolor=f"{trend_color}15",
                alignment=ft.alignment.center,
            )

        return ft.Container(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            ft.Text(
                                stat["title"],
                                size=13,
                                weight=ft.FontWeight.W_500,
                                color=COLORS["text_secondary"],
                            ),
                            ft.Container(expand=True),
                            ft.Container(
                                content=ft.Icon(
                                    stat["icon"],
                                    size=24,
                                    color=color,
                                ),
                                width=52,
                                height=52,
                                border_radius=RADIUS["lg"],
                                bgcolor=f"{color}12",
                                alignment=ft.alignment.center,
                                border=ft.border.all(1, f"{color}20"),
                                shadow=ft.BoxShadow(
                                    spread_radius=0,
                                    blur_radius=16,
                                    color=f"{color}25",
                                    offset=ft.Offset(0, 4),
                                ),
                            ),
                        ],
                        vertical_alignment=ft.CrossAxisAlignment.START,
                    ),
                    ft.Container(height=16),
                    ft.Row(
                        [
                            ft.Text(
                                stat["value"],
                                size=36,
                                weight=ft.FontWeight.W_800,
                                color=COLORS["text_primary"],
                            ),
                            ft.Container(width=8),
                            trend_indicator,
                        ] if trend_indicator else [
                            ft.Text(
                                stat["value"],
                                size=36,
                                weight=ft.FontWeight.W_800,
                                color=COLORS["text_primary"],
                            ),
                        ],
                        vertical_alignment=ft.CrossAxisAlignment.END,
                    ),
                    ft.Container(height=6),
                    ft.Text(
                        stat["subtitle"],
                        size=12,
                        weight=ft.FontWeight.W_400,
                        color=COLORS["text_muted"],
                    ),
                ],
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["xl"],
            padding=24,
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("xs"),
            expand=True,
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            animate_scale=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            on_hover=lambda e, c=color: self._on_stat_hover(e, c),
            data={"color": color},
        )

    def _on_stat_hover(self, e, color):
        """Handle stat card hover effect."""
        if e.data == "true":
            e.control.border = ft.border.all(1, f"{color}40")
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=28,
                color=f"{color}20",
                offset=ft.Offset(0, 10),
            )
            e.control.scale = 1.02
        else:
            e.control.border = ft.border.all(1, COLORS["border"])
            e.control.shadow = get_shadow("xs")
            e.control.scale = 1.0
        e.control.update()

    def _build_main_content(self):
        """Build the main content area."""
        return ft.Row(
            [
                # Left column - Chart and activity
                ft.Container(
                    content=ft.Column(
                        [
                            self._build_chart_section(),
                            ft.Container(height=24),
                            self._build_activity_section(),
                        ],
                        spacing=0,
                    ),
                    expand=2,
                ),
                ft.Container(width=24),
                # Right column - Devices
                ft.Container(
                    content=self._build_devices_section(),
                    expand=1,
                ),
            ],
            vertical_alignment=ft.CrossAxisAlignment.START,
        )

    def _build_chart_section(self):
        """Build the enhanced chart section with refined styling."""
        bars = []
        values = [0.6, 0.8, 0.5, 0.9, 0.7, 0.85, 0.75]
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

        for i, (v, day) in enumerate(zip(values, days)):
            is_today = i == len(days) - 1
            bar_height = int(v * 130)

            # Create gradient-like effect with stacked containers
            bar = ft.Container(
                content=ft.Column(
                    [
                        ft.Container(expand=True),
                        ft.Container(
                            width=36,
                            height=bar_height,
                            border_radius=ft.border_radius.only(
                                top_left=8, top_right=8, bottom_left=4, bottom_right=4
                            ),
                            bgcolor=COLORS["primary"] if is_today else f"{COLORS['primary']}50",
                            shadow=ft.BoxShadow(
                                spread_radius=0,
                                blur_radius=12,
                                color=f"{COLORS['primary']}30" if is_today else "transparent",
                                offset=ft.Offset(0, 4),
                            ) if is_today else None,
                            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
                        ),
                        ft.Container(height=12),
                        ft.Text(
                            day,
                            size=12,
                            weight=ft.FontWeight.W_600 if is_today else ft.FontWeight.W_500,
                            color=COLORS["text_primary"] if is_today else COLORS["text_muted"],
                        ),
                    ],
                    horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                ),
                expand=True,
            )
            bars.append(bar)

        return ft.Container(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            ft.Row(
                                [
                                    ft.Container(
                                        content=ft.Icon(
                                            ft.Icons.INSIGHTS_ROUNDED,
                                            size=20,
                                            color=COLORS["accent_indigo"],
                                        ),
                                        width=40,
                                        height=40,
                                        border_radius=RADIUS["md"],
                                        bgcolor=f"{COLORS['accent_indigo']}12",
                                        alignment=ft.alignment.center,
                                        border=ft.border.all(1, f"{COLORS['accent_indigo']}20"),
                                    ),
                                    ft.Container(width=14),
                                    ft.Column(
                                        [
                                            ft.Text(
                                                "Agent Activity",
                                                size=17,
                                                weight=ft.FontWeight.W_700,
                                                color=COLORS["text_primary"],
                                            ),
                                            ft.Text(
                                                "Weekly automation overview",
                                                size=12,
                                                color=COLORS["text_secondary"],
                                            ),
                                        ],
                                        spacing=2,
                                    ),
                                ],
                            ),
                            ft.Container(expand=True),
                            ft.Container(
                                content=ft.Text(
                                    "View All",
                                    size=13,
                                    weight=ft.FontWeight.W_600,
                                    color=COLORS["primary"],
                                ),
                                padding=ft.padding.symmetric(horizontal=16, vertical=8),
                                border_radius=RADIUS["md"],
                                bgcolor=COLORS["primary_glow"],
                                border=ft.border.all(1, f"{COLORS['primary']}20"),
                                animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                                on_hover=lambda e: self._on_view_all_hover(e),
                            ),
                        ],
                    ),
                    ft.Container(height=28),
                    ft.Container(
                        content=ft.Row(bars, alignment=ft.MainAxisAlignment.SPACE_AROUND),
                        height=180,
                        padding=ft.padding.symmetric(horizontal=10),
                    ),
                ],
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["xl"],
            padding=28,
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("xs"),
        )

    def _on_view_all_hover(self, e):
        """Handle view all button hover."""
        if e.data == "true":
            e.control.bgcolor = f"{COLORS['primary']}20"
            e.control.border = ft.border.all(1, f"{COLORS['primary']}40")
        else:
            e.control.bgcolor = COLORS["primary_glow"]
            e.control.border = ft.border.all(1, f"{COLORS['primary']}20")
        e.control.update()

    def _build_activity_section(self):
        """Build the enhanced recent activity section."""
        activities = [
            {
                "title": "Agent completed",
                "description": "Facebook browsing - 5 posts liked",
                "time": "2m ago",
                "icon": ft.Icons.CHECK_CIRCLE_ROUNDED,
                "color": COLORS["success"],
            },
            {
                "title": "Device connected",
                "description": "emulator-5554 connected via ADB",
                "time": "15m ago",
                "icon": ft.Icons.PHONE_ANDROID_ROUNDED,
                "color": COLORS["accent_blue"],
            },
            {
                "title": "Workflow saved",
                "description": "New workflow: Settings Navigation",
                "time": "1h ago",
                "icon": ft.Icons.SAVE_ROUNDED,
                "color": COLORS["accent_purple"],
            },
        ]

        items = [self._build_activity_item(act) for act in activities]

        return ft.Container(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.HISTORY_ROUNDED,
                                    size=20,
                                    color=COLORS["accent_cyan"],
                                ),
                                width=40,
                                height=40,
                                border_radius=RADIUS["md"],
                                bgcolor=f"{COLORS['accent_cyan']}12",
                                alignment=ft.alignment.center,
                                border=ft.border.all(1, f"{COLORS['accent_cyan']}20"),
                            ),
                            ft.Container(width=14),
                            ft.Column(
                                [
                                    ft.Text(
                                        "Recent Activity",
                                        size=17,
                                        weight=ft.FontWeight.W_700,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Text(
                                        "Latest automation events",
                                        size=12,
                                        color=COLORS["text_secondary"],
                                    ),
                                ],
                                spacing=2,
                            ),
                        ],
                    ),
                    ft.Container(height=20),
                    ft.Column(items, spacing=10),
                ],
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["xl"],
            padding=28,
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("xs"),
        )

    def _build_activity_item(self, activity: dict):
        """Build a single polished activity item with hover effect."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        content=ft.Icon(
                            activity["icon"],
                            size=18,
                            color=activity["color"],
                        ),
                        width=38,
                        height=38,
                        border_radius=RADIUS["md"],
                        bgcolor=f"{activity['color']}12",
                        alignment=ft.alignment.center,
                        border=ft.border.all(1, f"{activity['color']}20"),
                    ),
                    ft.Container(width=14),
                    ft.Column(
                        [
                            ft.Text(
                                activity["title"],
                                size=14,
                                weight=ft.FontWeight.W_600,
                                color=COLORS["text_primary"],
                            ),
                            ft.Text(
                                activity["description"],
                                size=12,
                                weight=ft.FontWeight.W_400,
                                color=COLORS["text_muted"],
                            ),
                        ],
                        spacing=3,
                        expand=True,
                    ),
                    ft.Container(
                        content=ft.Text(
                            activity["time"],
                            size=11,
                            weight=ft.FontWeight.W_500,
                            color=COLORS["text_muted"],
                        ),
                        padding=ft.padding.symmetric(horizontal=10, vertical=5),
                        border_radius=RADIUS["sm"],
                        bgcolor=COLORS["bg_tertiary"],
                    ),
                ],
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.symmetric(horizontal=14, vertical=12),
            border_radius=RADIUS["lg"],
            bgcolor=COLORS["bg_tertiary"],
            border=ft.border.all(1, COLORS["border_subtle"]),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            on_hover=lambda e: self._on_activity_hover(e),
        )

    def _on_activity_hover(self, e):
        """Handle activity item hover."""
        if e.data == "true":
            e.control.bgcolor = COLORS["bg_hover"]
            e.control.border = ft.border.all(1, COLORS["border_light"])
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=16,
                color="#00000015",
                offset=ft.Offset(0, 4),
            )
        else:
            e.control.bgcolor = COLORS["bg_tertiary"]
            e.control.border = ft.border.all(1, COLORS["border_subtle"])
            e.control.shadow = None
        e.control.update()

    def _build_devices_section(self):
        """Build the polished devices list section."""
        if self.loading:
            content = self._build_loading()
        elif self.devices:
            content = self._build_device_list()
        else:
            content = self._build_empty_state()

        return ft.Container(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.DEVICES_ROUNDED,
                                    size=20,
                                    color=COLORS["primary"],
                                ),
                                width=40,
                                height=40,
                                border_radius=RADIUS["md"],
                                bgcolor=f"{COLORS['primary']}12",
                                alignment=ft.alignment.center,
                                border=ft.border.all(1, f"{COLORS['primary']}20"),
                            ),
                            ft.Container(width=14),
                            ft.Column(
                                [
                                    ft.Text(
                                        "Devices",
                                        size=17,
                                        weight=ft.FontWeight.W_700,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Text(
                                        f"{len(self.devices)} device{'s' if len(self.devices) != 1 else ''} connected",
                                        size=12,
                                        color=COLORS["text_secondary"],
                                    ),
                                ],
                                spacing=2,
                                expand=True,
                            ),
                            ft.Container(
                                content=ft.IconButton(
                                    icon=ft.Icons.REFRESH_ROUNDED,
                                    icon_size=20,
                                    icon_color=COLORS["text_secondary"],
                                    tooltip="Refresh",
                                    on_click=self._on_refresh,
                                ),
                                width=40,
                                height=40,
                                border_radius=RADIUS["md"],
                                bgcolor=COLORS["bg_tertiary"],
                                alignment=ft.alignment.center,
                                border=ft.border.all(1, COLORS["border_subtle"]),
                            ),
                        ],
                    ),
                    ft.Container(height=20),
                    content,
                ],
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["xl"],
            padding=28,
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("xs"),
        )

    def _build_device_list(self):
        """Build the device list."""
        items = [self._build_device_item(device) for device in self.devices]
        return ft.Column(items, spacing=10)

    def _build_device_item(self, device: dict):
        """Build a single polished device item with hover effects."""
        status = device.get("status", "offline")
        is_online = status == "connected"
        name = device.get("name") or device.get("model") or device.get("adb_serial", "Unknown")
        serial = device.get("adb_serial", "")
        android_version = device.get("android_version", "?")

        # Status indicator with glow effect for online devices
        status_indicator = ft.Container(
            width=12,
            height=12,
            border_radius=6,
            bgcolor=COLORS["success"] if is_online else COLORS["text_muted"],
            border=ft.border.all(2, COLORS["bg_card"]),
            shadow=ft.BoxShadow(
                spread_radius=1,
                blur_radius=8,
                color=f"{COLORS['success']}50",
                offset=ft.Offset(0, 0),
            ) if is_online else None,
        )

        return ft.Container(
            content=ft.Row(
                [
                    ft.Stack(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.PHONE_ANDROID_ROUNDED,
                                    size=24,
                                    color=COLORS["text_secondary"],
                                ),
                                width=52,
                                height=52,
                                border_radius=RADIUS["lg"],
                                bgcolor=COLORS["bg_tertiary"],
                                alignment=ft.alignment.center,
                                border=ft.border.all(1, COLORS["border_subtle"]),
                            ),
                            ft.Container(
                                content=status_indicator,
                                right=-2,
                                bottom=-2,
                            ),
                        ],
                    ),
                    ft.Container(width=14),
                    ft.Column(
                        [
                            ft.Text(
                                name[:22] + "..." if len(name) > 22 else name,
                                size=14,
                                weight=ft.FontWeight.W_600,
                                color=COLORS["text_primary"],
                            ),
                            ft.Text(
                                serial,
                                size=12,
                                color=COLORS["text_muted"],
                            ),
                        ],
                        spacing=3,
                        expand=True,
                    ),
                    ft.Container(
                        content=ft.Text(
                            f"Android {android_version}",
                            size=11,
                            weight=ft.FontWeight.W_500,
                            color=COLORS["text_secondary"],
                        ),
                        padding=ft.padding.symmetric(horizontal=10, vertical=6),
                        border_radius=RADIUS["sm"],
                        bgcolor=COLORS["bg_tertiary"],
                        border=ft.border.all(1, COLORS["border_subtle"]),
                    ),
                ],
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.symmetric(horizontal=16, vertical=14),
            border_radius=RADIUS["lg"],
            bgcolor=COLORS["bg_tertiary"],
            border=ft.border.all(1, COLORS["border_subtle"]),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            animate_scale=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            on_hover=lambda e: self._on_device_hover(e),
            on_click=lambda e, d=device: self._on_device_click(d),
        )

    def _on_device_hover(self, e):
        """Handle device item hover."""
        if e.data == "true":
            e.control.bgcolor = COLORS["bg_hover"]
            e.control.border = ft.border.all(1, COLORS["border_light"])
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=20,
                color="#00000020",
                offset=ft.Offset(0, 6),
            )
            e.control.scale = 1.01
        else:
            e.control.bgcolor = COLORS["bg_tertiary"]
            e.control.border = ft.border.all(1, COLORS["border_subtle"])
            e.control.shadow = None
            e.control.scale = 1.0
        e.control.update()

    def _build_empty_state(self):
        """Build polished empty state when no devices."""
        return ft.Container(
            content=ft.Column(
                [
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.PHONE_ANDROID_ROUNDED,
                            size=44,
                            color=COLORS["text_muted"],
                        ),
                        width=88,
                        height=88,
                        border_radius=RADIUS["xl"],
                        bgcolor=COLORS["bg_tertiary"],
                        alignment=ft.alignment.center,
                        border=ft.border.all(1, COLORS["border_subtle"]),
                    ),
                    ft.Container(height=20),
                    ft.Text(
                        "No Devices Connected",
                        size=16,
                        weight=ft.FontWeight.W_700,
                        color=COLORS["text_primary"],
                    ),
                    ft.Container(height=6),
                    ft.Text(
                        "Connect a device via USB or WiFi ADB",
                        size=13,
                        weight=ft.FontWeight.W_400,
                        color=COLORS["text_muted"],
                        text_align=ft.TextAlign.CENTER,
                    ),
                    ft.Container(height=20),
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(ft.Icons.RADAR, size=16, color=COLORS["text_inverse"]),
                                ft.Container(width=8),
                                ft.Text(
                                    "Scan for Devices",
                                    size=13,
                                    weight=ft.FontWeight.W_600,
                                    color=COLORS["text_inverse"],
                                ),
                            ],
                            alignment=ft.MainAxisAlignment.CENTER,
                        ),
                        bgcolor=COLORS["primary"],
                        border_radius=RADIUS["md"],
                        padding=ft.padding.symmetric(horizontal=20, vertical=12),
                        shadow=ft.BoxShadow(
                            spread_radius=0,
                            blur_radius=16,
                            color=f"{COLORS['primary']}35",
                            offset=ft.Offset(0, 4),
                        ),
                        on_click=self._on_refresh,
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.symmetric(vertical=40),
            alignment=ft.alignment.center,
        )

    def _build_loading(self):
        """Build polished loading state."""
        return ft.Container(
            content=ft.Column(
                [
                    ft.Container(
                        content=ft.ProgressRing(
                            width=40,
                            height=40,
                            stroke_width=3,
                            color=COLORS["primary"],
                        ),
                        width=72,
                        height=72,
                        border_radius=RADIUS["xl"],
                        bgcolor=COLORS["bg_tertiary"],
                        alignment=ft.alignment.center,
                        border=ft.border.all(1, COLORS["border_subtle"]),
                    ),
                    ft.Container(height=16),
                    ft.Text(
                        "Scanning for devices...",
                        size=14,
                        weight=ft.FontWeight.W_500,
                        color=COLORS["text_secondary"],
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.symmetric(vertical=40),
            alignment=ft.alignment.center,
        )

    def _on_device_click(self, device: dict):
        """Handle device click."""
        self.toast.info(f"Selected: {device.get('name', device.get('adb_serial', 'device'))}")

    async def _on_refresh(self, e):
        """Handle refresh button click."""
        self.loading = True
        self._rebuild()
        await self.load_devices()

    def _rebuild(self):
        """Rebuild the view controls."""
        self.controls = self._build_controls()
        self.update()

    async def load_devices(self):
        """Load devices from backend."""
        self.loading = True
        try:
            try:
                self.devices = await self.backend.discover_devices()
            except Exception:
                self.devices = await self.backend.get_devices()

            if self.devices:
                self.toast.success(f"Found {len(self.devices)} device(s)")
            else:
                self.toast.info("No devices found")
        except Exception as ex:
            self.toast.error(f"Failed to load devices: {ex}")
            self.devices = []
        finally:
            self.loading = False
            self._rebuild()

    def refresh(self):
        """Refresh the view."""
        self._rebuild()
