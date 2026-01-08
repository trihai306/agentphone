"""Professional Dashboard view for Droidrun Controller - 2025 Enterprise Edition.

Features: Modern SaaS-style dashboard with animated stats, real-time charts,
professional cards with micro-interactions, and refined data visualization.
"""

import flet as ft
from typing import List, Optional
from ..theme import get_colors, get_shadow, ANIMATION, RADIUS, Typography, Easing
from ..backend import backend


# Dynamic color proxy - acts like a dict but always gets current theme colors
class _DynamicColors:
    def get(self, key, default=None):
        return get_colors().get(key, default)
    
    def __getitem__(self, key):
        return get_colors()[key]

COLORS = _DynamicColors()


class DevicesView(ft.Column):
    """Professional dashboard view with enterprise-grade UI."""

    def __init__(self, app_state, toast, on_notification_click=None, on_settings_click=None):
        self.app_state = app_state
        self.toast = toast
        self.devices: List[dict] = []
        self.backend = backend
        self.loading = False
        self._on_notification_click = on_notification_click
        self._on_settings_click = on_settings_click

        super().__init__(
            controls=self._build_controls(),
            spacing=0,
            scroll=ft.ScrollMode.AUTO,
            expand=True,
        )

    def _build_controls(self):
        """Build the dashboard controls."""
        return [
            self._build_header(),
            ft.Container(height=32),
            self._build_stats_row(),
            ft.Container(height=32),
            self._build_quick_actions_row(),
            ft.Container(height=32),
            self._build_main_content(),
        ]

    def _build_header(self):
        """Build professional header with refined styling."""
        colors = get_colors()

        return ft.Container(
            content=ft.Row(
                [
                    # Left: Title section
                    ft.Column(
                        [
                            ft.Row(
                                [
                                    ft.Text(
                                        "Dashboard",
                                        size=Typography.H1,
                                        weight=ft.FontWeight.W_800,
                                        color=colors["text_primary"],
                                    ),
                                    ft.Container(width=16),
                                    ft.Container(
                                        content=ft.Icon(
                                            ft.Icons.DASHBOARD_ROUNDED,
                                            size=24,
                                            color=colors["primary"],
                                        ),
                                        width=48,
                                        height=48,
                                        bgcolor=colors["primary_subtle"],
                                        border_radius=RADIUS["lg"],
                                        alignment=ft.Alignment(0, 0),
                                        border=ft.border.all(1, f"{colors['primary']}25"),
                                    ),
                                ],
                                vertical_alignment=ft.CrossAxisAlignment.CENTER,
                            ),
                            ft.Container(height=6),
                            ft.Text(
                                "Monitor and manage your Android automation system",
                                size=Typography.BODY_MD,
                                weight=ft.FontWeight.W_400,
                                color=colors["text_secondary"],
                            ),
                        ],
                        spacing=0,
                    ),
                    ft.Container(expand=True),
                    # Right: Action buttons
                    ft.Row(
                        [
                            # Notification button
                            self._build_icon_button(
                                ft.Icons.NOTIFICATIONS_OUTLINED,
                                "Notifications",
                                badge_count=3,
                                on_click=self._on_notification_click,
                            ),
                            ft.Container(width=12),
                            # Settings button
                            self._build_icon_button(
                                ft.Icons.SETTINGS_OUTLINED,
                                "Settings",
                                on_click=self._on_settings_click,
                            ),
                            ft.Container(width=16),
                            # Scan devices button
                            self._build_scan_button(),
                        ],
                        spacing=0,
                    ),
                ],
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.only(bottom=8),
        )

    def _build_icon_button(self, icon, tooltip, badge_count: int = 0, on_click=None):
        """Build a refined icon button with optional badge."""
        colors = get_colors()

        icon_container = ft.Container(
            content=ft.Icon(
                icon,
                size=20,
                color=colors["text_muted"],
            ),
            width=42,
            height=42,
            bgcolor=colors["bg_card"],
            border_radius=RADIUS["md"],
            alignment=ft.Alignment(0, 0),
            border=ft.border.all(1, colors["border"]),
            animate=ft.Animation(ANIMATION["fast"], Easing.EASE_OUT),
        )

        content = ft.Stack([icon_container])

        # Add badge if count > 0
        if badge_count > 0:
            content.controls.append(
                ft.Container(
                    content=ft.Text(
                        str(badge_count) if badge_count < 10 else "9+",
                        size=9,
                        weight=ft.FontWeight.W_700,
                        color="#FFFFFF",
                    ),
                    width=16,
                    height=16,
                    bgcolor=colors["error"],
                    border_radius=8,
                    alignment=ft.Alignment(0, 0),
                    right=-2,
                    top=-2,
                    border=ft.border.all(2, colors["bg_secondary"]),
                )
            )

        def on_hover(e):
            if e.data == "true":
                icon_container.bgcolor = colors["bg_hover"]
                icon_container.border = ft.border.all(1, colors["border_light"])
                icon_container.content.color = colors["text_primary"]
            else:
                icon_container.bgcolor = colors["bg_card"]
                icon_container.border = ft.border.all(1, colors["border"])
                icon_container.content.color = colors["text_muted"]
            icon_container.update()

        # Use provided on_click callback or default to toast
        click_handler = on_click if on_click else lambda _: self.toast.info(f"{tooltip} clicked")

        return ft.Container(
            content=content,
            tooltip=tooltip,
            on_click=click_handler,
            on_hover=on_hover,
        )

    def _create_icon_button_hover(self):
        colors = get_colors()

        def on_hover(e):
            container = e.control.content.controls[0] if isinstance(e.control.content, ft.Stack) else e.control.content
            if e.data == "true":
                container.bgcolor = colors["bg_hover"]
                container.border = ft.border.all(1, colors["border_light"])
            else:
                container.bgcolor = colors["bg_tertiary"]
                container.border = ft.border.all(1, colors["border_subtle"])
            container.update()
        return on_hover

    def _build_scan_button(self):
        """Build the primary scan devices button."""
        colors = get_colors()

        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(
                        ft.Icons.RADAR_ROUNDED,
                        size=18,
                        color="#FFFFFF",
                    ),
                    ft.Container(width=10),
                    ft.Text(
                        "Scan Devices",
                        size=14,
                        weight=ft.FontWeight.W_600,
                        color="#FFFFFF",
                    ),
                ],
                alignment=ft.MainAxisAlignment.CENTER,
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            height=42,
            padding=ft.padding.symmetric(horizontal=20),
            bgcolor=colors["primary"],
            border_radius=RADIUS["md"],
            animate=ft.Animation(ANIMATION["fast"], Easing.EASE_OUT),
            animate_scale=ft.Animation(ANIMATION["fast"], Easing.EASE_OUT),
            on_hover=self._on_scan_hover,
            on_click=self._on_refresh,
        )

    def _on_scan_hover(self, e):
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["primary_dark"]
            e.control.scale = 1.02
        else:
            e.control.bgcolor = colors["primary"]
            e.control.scale = 1.0
        e.control.update()

    def _build_stats_row(self):
        """Build statistics cards with animated counters."""
        colors = get_colors()
        total = len(self.devices)
        online = len([d for d in self.devices if d.get("status") == "connected"])

        # Calculate aggregated stats
        total_battery = 0
        devices_with_battery = 0
        total_storage_used = 0
        total_storage_total = 0
        devices_with_storage = 0

        for device in self.devices:
            battery = device.get("battery_level")
            if battery is not None:
                total_battery += battery
                devices_with_battery += 1
            storage_used = device.get("storage_used")
            storage_total = device.get("storage_total")
            if storage_used and storage_total:
                total_storage_used += storage_used
                total_storage_total += storage_total
                devices_with_storage += 1

        avg_battery = round(total_battery / devices_with_battery) if devices_with_battery else 0
        storage_percent = round((total_storage_used / total_storage_total) * 100) if total_storage_total else 0

        stats = [
            {
                "title": "Connected Devices",
                "value": str(total),
                "subtitle": "Total via ADB",
                "icon": ft.Icons.DEVICES_ROUNDED,
                "color": colors["accent_blue"],
                "trend": None,
            },
            {
                "title": "Online Devices",
                "value": str(online),
                "subtitle": "Ready for automation",
                "icon": ft.Icons.CHECK_CIRCLE_OUTLINE_ROUNDED,
                "color": colors["success"],
                "trend": "up" if online > 0 else None,
            },
            {
                "title": "Avg Battery",
                "value": f"{avg_battery}%",
                "subtitle": f"Across {devices_with_battery} device(s)",
                "icon": ft.Icons.BATTERY_CHARGING_FULL_ROUNDED,
                "color": colors["success"] if avg_battery > 50 else colors["warning"] if avg_battery > 20 else colors["error"],
                "trend": "up" if avg_battery > 50 else "down" if avg_battery < 30 else None,
            },
            {
                "title": "Storage Used",
                "value": f"{storage_percent}%",
                "subtitle": f"Across {devices_with_storage} device(s)",
                "icon": ft.Icons.STORAGE_ROUNDED,
                "color": colors["error"] if storage_percent > 80 else colors["warning"] if storage_percent > 60 else colors["accent_purple"],
                "trend": "up" if storage_percent > 80 else None,
            },
        ]

        return ft.Row(
            [self._build_stat_card(s) for s in stats],
            spacing=20,
        )

    def _build_stat_card(self, stat: dict):
        """Build a single statistics card with hover effects."""
        colors = get_colors()
        color = stat["color"]

        # Trend indicator
        trend_indicator = None
        if stat.get("trend"):
            trend_color = colors["success"] if stat["trend"] == "up" else colors["error"]
            trend_icon = ft.Icons.TRENDING_UP if stat["trend"] == "up" else ft.Icons.TRENDING_DOWN
            trend_indicator = ft.Container(
                content=ft.Icon(trend_icon, size=14, color=trend_color),
                width=26,
                height=26,
                border_radius=RADIUS["sm"],
                bgcolor=f"{trend_color}15",
                alignment=ft.Alignment(0, 0),
            )

        value_row = [
            ft.Text(
                stat["value"],
                size=40,
                weight=ft.FontWeight.W_800,
                color=colors["text_primary"],
            ),
        ]
        if trend_indicator:
            value_row.append(ft.Container(width=10))
            value_row.append(trend_indicator)

        return ft.Container(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            ft.Text(
                                stat["title"],
                                size=Typography.BODY_SM,
                                weight=ft.FontWeight.W_500,
                                color=colors["text_secondary"],
                            ),
                            ft.Container(expand=True),
                            ft.Container(
                                content=ft.Icon(stat["icon"], size=24, color=color),
                                width=52,
                                height=52,
                                border_radius=RADIUS["lg"],
                                bgcolor=f"{color}12",
                                alignment=ft.Alignment(0, 0),
                                border=ft.border.all(1, f"{color}20")
                            ),
                        ],
                        vertical_alignment=ft.CrossAxisAlignment.START,
                    ),
                    ft.Container(height=20),
                    ft.Row(value_row, vertical_alignment=ft.CrossAxisAlignment.END),
                    ft.Container(height=8),
                    ft.Text(
                        stat["subtitle"],
                        size=Typography.BODY_XS,
                        weight=ft.FontWeight.W_400,
                        color=colors["text_muted"],
                    ),
                ],
            ),
            bgcolor=colors["bg_card"],
            border_radius=RADIUS["xl"],
            padding=28,
            border=ft.border.all(1, colors["border"]),
            
            expand=True,
            animate=ft.Animation(ANIMATION["fast"], Easing.EASE_OUT),
            animate_scale=ft.Animation(ANIMATION["fast"], Easing.EASE_OUT),
            on_hover=lambda e, c=color: self._on_stat_hover(e, c),
            data={"color": color},
        )

    def _on_stat_hover(self, e, color):
        colors = get_colors()
        if e.data == "true":
            e.control.border = ft.border.all(1, f"{color}40")
            
            e.control.scale = 1.015
        else:
            e.control.border = ft.border.all(1, colors["border"])
            
            e.control.scale = 1.0
        e.control.update()

    def _build_quick_actions_row(self):
        """Build the quick actions row with action cards."""
        colors = get_colors()
        online_count = len([d for d in self.devices if d.get("status") == "connected"])

        actions = [
            {
                "title": "Scan for Devices",
                "description": "Discover new Android devices",
                "icon": ft.Icons.RADAR_ROUNDED,
                "color": colors["primary"],
                "action": "scan",
            },
            {
                "title": "View All Devices",
                "description": f"{len(self.devices)} device(s) available",
                "icon": ft.Icons.PHONE_ANDROID_ROUNDED,
                "color": colors["accent_blue"],
                "action": "view_devices",
            },
            {
                "title": "Quick Connect",
                "description": "Connect via WiFi ADB",
                "icon": ft.Icons.WIFI_ROUNDED,
                "color": colors["accent_cyan"],
                "action": "wifi_connect",
            },
            {
                "title": "Run Agent",
                "description": f"{online_count} device(s) ready",
                "icon": ft.Icons.SMART_TOY_ROUNDED,
                "color": colors["accent_purple"],
                "action": "run_agent",
            },
        ]

        cards = [self._build_quick_action_card(action) for action in actions]
        return ft.Row(cards, spacing=16)

    def _build_quick_action_card(self, action: dict):
        """Build a single quick action card with hover effects."""
        colors = get_colors()
        color = action["color"]

        return ft.Container(
            content=ft.Row(
                [
                    # Icon container
                    ft.Container(
                        content=ft.Icon(
                            action["icon"],
                            size=22,
                            color=color,
                        ),
                        width=48,
                        height=48,
                        border_radius=RADIUS["lg"],
                        bgcolor=f"{color}12",
                        alignment=ft.Alignment(0, 0),
                        border=ft.border.all(1, f"{color}20"),
                    ),
                    ft.Container(width=14),
                    # Text content
                    ft.Column(
                        [
                            ft.Text(
                                action["title"],
                                size=Typography.BODY_MD,
                                weight=ft.FontWeight.W_600,
                                color=colors["text_primary"],
                            ),
                            ft.Text(
                                action["description"],
                                size=Typography.BODY_XS,
                                weight=ft.FontWeight.W_400,
                                color=colors["text_muted"],
                            ),
                        ],
                        spacing=2,
                        expand=True,
                    ),
                    # Arrow indicator
                    ft.Icon(
                        ft.Icons.ARROW_FORWARD_IOS_ROUNDED,
                        size=14,
                        color=colors["text_muted"],
                    ),
                ],
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            bgcolor=colors["bg_card"],
            border_radius=RADIUS["lg"],
            padding=ft.padding.symmetric(horizontal=16, vertical=14),
            border=ft.border.all(1, colors["border"]),
            
            expand=True,
            animate=ft.Animation(ANIMATION["fast"], Easing.EASE_OUT),
            animate_scale=ft.Animation(ANIMATION["fast"], Easing.EASE_OUT),
            on_hover=lambda e, c=color: self._on_quick_action_hover(e, c),
            on_click=lambda e, a=action["action"]: self._on_quick_action_click(a),
            data={"color": color, "action": action["action"]},
        )

    def _on_quick_action_hover(self, e, color):
        """Handle quick action card hover effect."""
        colors = get_colors()
        if e.data == "true":
            e.control.border = ft.border.all(1, f"{color}40")
            
            e.control.scale = 1.01
        else:
            e.control.border = ft.border.all(1, colors["border"])
            
            e.control.scale = 1.0
        e.control.update()

    def _on_quick_action_click(self, action: str):
        """Handle quick action card click."""
        if action == "scan":
            # Trigger device scan
            if self.page:
                self.page.run_task(self._on_refresh, None)
        elif action == "view_devices":
            # Navigate to phone viewer
            if self.app_state and hasattr(self.app_state, 'navigate'):
                self.app_state.navigate("phone_viewer")
            elif self.page:
                # Try to change tab through navigation
                self.toast.info("Navigate to Phones tab to view all devices")
        elif action == "wifi_connect":
            # Show WiFi ADB connection info
            self.toast.info("Use 'adb tcpip 5555' on connected device, then 'adb connect <IP>:5555'")
        elif action == "run_agent":
            if len([d for d in self.devices if d.get("status") == "connected"]) > 0:
                self.toast.info("Select a device to run an agent")
            else:
                self.toast.warning("No online devices available")

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
                            bgcolor=COLORS["primary"] if is_today else f"{COLORS['primary']}50" if is_today else None,
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
                                        alignment=ft.Alignment(0, 0),
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
                                alignment=ft.Alignment(0, 0),
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
                        alignment=ft.Alignment(0, 0),
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
            
        else:
            e.control.bgcolor = COLORS["bg_tertiary"]
            e.control.border = ft.border.all(1, COLORS["border_subtle"])
            pass  # shadow removed
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
                                alignment=ft.Alignment(0, 0),
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
                                alignment=ft.Alignment(0, 0),
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
            border=ft.border.all(2, COLORS["bg_card"]) if is_online else None,
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
                                alignment=ft.Alignment(0, 0),
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
            
            e.control.scale = 1.01
        else:
            e.control.bgcolor = COLORS["bg_tertiary"]
            e.control.border = ft.border.all(1, COLORS["border_subtle"])
            pass  # shadow removed
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
                        alignment=ft.Alignment(0, 0),
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
                        on_click=self._on_refresh,
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.symmetric(vertical=40),
            alignment=ft.Alignment(0, 0),
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
                        alignment=ft.Alignment(0, 0),
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
            alignment=ft.Alignment(0, 0),
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
