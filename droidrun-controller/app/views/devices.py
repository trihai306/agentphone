"""Professional Dashboard view for Droidrun Controller - 2025 Design."""

import flet as ft
from ..theme import COLORS, RADIUS
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
            ft.Container(height=24),
            # Stats row
            self._build_stats_row(),
            ft.Container(height=24),
            # Main content
            self._build_main_content(),
        ]

    def _build_header(self):
        """Build the header section."""
        return ft.Row(
            [
                ft.Column(
                    [
                        ft.Row(
                            [
                                ft.Text(
                                    "Dashboard",
                                    size=28,
                                    weight=ft.FontWeight.W_700,
                                    color=COLORS["text_primary"],
                                ),
                                ft.Container(width=12),
                                ft.Container(
                                    content=ft.Icon(
                                        ft.Icons.DASHBOARD,
                                        size=20,
                                        color=COLORS["primary"],
                                    ),
                                    bgcolor=COLORS["primary_glow"],
                                    border_radius=10,
                                    padding=8,
                                ),
                            ],
                        ),
                        ft.Text(
                            "Overview of your Android automation system",
                            size=14,
                            color=COLORS["text_secondary"],
                        ),
                    ],
                    spacing=6,
                ),
                ft.Container(expand=True),
                ft.IconButton(
                    icon=ft.Icons.MORE_HORIZ,
                    icon_color=COLORS["text_muted"],
                    tooltip="More options",
                ),
                ft.Container(width=8),
                ft.ElevatedButton(
                    content=ft.Row(
                        [
                            ft.Icon(
                                ft.Icons.RADAR,
                                size=18,
                                color=COLORS["text_inverse"],
                            ),
                            ft.Container(width=8),
                            ft.Text(
                                "Scan Devices",
                                size=13,
                                weight=ft.FontWeight.W_600,
                                color=COLORS["text_inverse"],
                            ),
                        ],
                    ),
                    bgcolor=COLORS["primary"],
                    style=ft.ButtonStyle(
                        shape=ft.RoundedRectangleBorder(radius=RADIUS["lg"]),
                        padding=ft.padding.symmetric(horizontal=20, vertical=12),
                    ),
                    on_click=self._on_refresh,
                ),
            ],
        )

    def _build_stats_row(self):
        """Build the stats cards row."""
        total = len(self.devices)
        online = len([d for d in self.devices if d.get("status") == "connected"])

        stats = [
            {
                "title": "Connected Devices",
                "value": str(total),
                "subtitle": "Total connected via ADB",
                "icon": ft.Icons.PHONE_ANDROID,
                "color": COLORS["accent_blue"],
            },
            {
                "title": "Online Devices",
                "value": str(online),
                "subtitle": "Ready for automation",
                "icon": ft.Icons.CHECK_CIRCLE_OUTLINE,
                "color": COLORS["success"],
            },
            {
                "title": "Agent Runs",
                "value": "12",
                "subtitle": "Total executions today",
                "icon": ft.Icons.SMART_TOY_OUTLINED,
                "color": COLORS["accent_purple"],
            },
            {
                "title": "Success Rate",
                "value": "85%",
                "subtitle": "Last 24 hours",
                "icon": ft.Icons.TRENDING_UP,
                "color": COLORS["success"],
            },
        ]

        cards = [self._build_stat_card(s) for s in stats]

        return ft.Row(cards, spacing=16)

    def _build_stat_card(self, stat: dict):
        """Build a single stat card."""
        return ft.Container(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            ft.Text(
                                stat["title"],
                                size=13,
                                color=COLORS["text_secondary"],
                            ),
                            ft.Container(expand=True),
                            ft.Container(
                                content=ft.Icon(
                                    stat["icon"],
                                    size=20,
                                    color=stat["color"],
                                ),
                                width=40,
                                height=40,
                                border_radius=10,
                                bgcolor=f"{stat['color']}20",
                                alignment=ft.alignment.center,
                            ),
                        ],
                    ),
                    ft.Container(height=12),
                    ft.Text(
                        stat["value"],
                        size=32,
                        weight=ft.FontWeight.W_700,
                        color=COLORS["text_primary"],
                    ),
                    ft.Container(height=4),
                    ft.Text(
                        stat["subtitle"],
                        size=12,
                        color=COLORS["text_muted"],
                    ),
                ],
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["lg"],
            padding=20,
            border=ft.border.all(1, COLORS["border"]),
            expand=True,
        )

    def _build_main_content(self):
        """Build the main content area."""
        return ft.Row(
            [
                # Left column - Chart and activity
                ft.Container(
                    content=ft.Column(
                        [
                            self._build_chart_section(),
                            ft.Container(height=20),
                            self._build_activity_section(),
                        ],
                        spacing=0,
                    ),
                    expand=2,
                ),
                ft.Container(width=20),
                # Right column - Devices
                ft.Container(
                    content=self._build_devices_section(),
                    expand=1,
                ),
            ],
            vertical_alignment=ft.CrossAxisAlignment.START,
        )

    def _build_chart_section(self):
        """Build the chart section."""
        bars = []
        values = [0.6, 0.8, 0.5, 0.9, 0.7, 0.85, 0.75]
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

        for i, (v, day) in enumerate(zip(values, days)):
            is_today = i == len(days) - 1
            bars.append(
                ft.Container(
                    content=ft.Column(
                        [
                            ft.Container(expand=True),
                            ft.Container(
                                width=28,
                                height=int(v * 120),
                                border_radius=ft.border_radius.only(top_left=4, top_right=4),
                                bgcolor=COLORS["primary"] if is_today else f"{COLORS['primary']}60",
                            ),
                            ft.Container(height=8),
                            ft.Text(
                                day,
                                size=11,
                                color=COLORS["text_primary"] if is_today else COLORS["text_muted"],
                            ),
                        ],
                        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                    ),
                    expand=True,
                )
            )

        return ft.Container(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            ft.Text(
                                "Agent Activity",
                                size=16,
                                weight=ft.FontWeight.W_600,
                                color=COLORS["text_primary"],
                            ),
                            ft.Container(expand=True),
                            ft.TextButton(
                                "View All",
                                style=ft.ButtonStyle(color=COLORS["primary"]),
                            ),
                        ],
                    ),
                    ft.Container(height=20),
                    ft.Container(
                        content=ft.Row(bars, alignment=ft.MainAxisAlignment.SPACE_AROUND),
                        height=160,
                    ),
                ],
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["lg"],
            padding=20,
            border=ft.border.all(1, COLORS["border"]),
        )

    def _build_activity_section(self):
        """Build the recent activity section."""
        activities = [
            {
                "title": "Agent completed",
                "description": "Facebook browsing - 5 posts liked",
                "time": "2m ago",
                "icon": ft.Icons.CHECK_CIRCLE,
                "color": COLORS["success"],
            },
            {
                "title": "Device connected",
                "description": "emulator-5554 connected via ADB",
                "time": "15m ago",
                "icon": ft.Icons.PHONE_ANDROID,
                "color": COLORS["accent_blue"],
            },
            {
                "title": "Workflow saved",
                "description": "New workflow: Settings Navigation",
                "time": "1h ago",
                "icon": ft.Icons.SAVE,
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
                                    ft.Icons.HISTORY,
                                    size=20,
                                    color=COLORS["accent_cyan"],
                                ),
                                width=40,
                                height=40,
                                border_radius=10,
                                bgcolor=f"{COLORS['accent_cyan']}20",
                                alignment=ft.alignment.center,
                            ),
                            ft.Container(width=12),
                            ft.Column(
                                [
                                    ft.Text(
                                        "Recent Activity",
                                        size=16,
                                        weight=ft.FontWeight.W_600,
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
                    ft.Container(height=16),
                    ft.Column(items, spacing=8),
                ],
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["lg"],
            padding=20,
            border=ft.border.all(1, COLORS["border"]),
        )

    def _build_activity_item(self, activity: dict):
        """Build a single activity item."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        content=ft.Icon(
                            activity["icon"],
                            size=16,
                            color=activity["color"],
                        ),
                        width=32,
                        height=32,
                        border_radius=8,
                        bgcolor=f"{activity['color']}15",
                        alignment=ft.alignment.center,
                    ),
                    ft.Container(width=12),
                    ft.Column(
                        [
                            ft.Text(
                                activity["title"],
                                size=13,
                                weight=ft.FontWeight.W_500,
                                color=COLORS["text_primary"],
                            ),
                            ft.Text(
                                activity["description"],
                                size=12,
                                color=COLORS["text_muted"],
                            ),
                        ],
                        spacing=2,
                        expand=True,
                    ),
                    ft.Text(
                        activity["time"],
                        size=11,
                        color=COLORS["text_muted"],
                    ),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=10, vertical=8),
            border_radius=RADIUS["sm"],
        )

    def _build_devices_section(self):
        """Build the devices list section."""
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
                                    ft.Icons.DEVICES,
                                    size=20,
                                    color=COLORS["primary"],
                                ),
                                width=40,
                                height=40,
                                border_radius=10,
                                bgcolor=COLORS["primary_glow"],
                                alignment=ft.alignment.center,
                            ),
                            ft.Container(width=12),
                            ft.Column(
                                [
                                    ft.Text(
                                        "Devices",
                                        size=16,
                                        weight=ft.FontWeight.W_600,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Text(
                                        f"{len(self.devices)} devices connected",
                                        size=12,
                                        color=COLORS["text_secondary"],
                                    ),
                                ],
                                spacing=2,
                                expand=True,
                            ),
                            ft.IconButton(
                                icon=ft.Icons.REFRESH,
                                icon_size=20,
                                icon_color=COLORS["text_muted"],
                                tooltip="Refresh",
                                on_click=self._on_refresh,
                            ),
                        ],
                    ),
                    ft.Container(height=16),
                    content,
                ],
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["lg"],
            padding=20,
            border=ft.border.all(1, COLORS["border"]),
        )

    def _build_device_list(self):
        """Build the device list."""
        items = [self._build_device_item(device) for device in self.devices]
        return ft.Column(items, spacing=8)

    def _build_device_item(self, device: dict):
        """Build a single device item."""
        status = device.get("status", "offline")
        is_online = status == "connected"
        name = device.get("name") or device.get("model") or device.get("adb_serial", "Unknown")
        serial = device.get("adb_serial", "")
        android_version = device.get("android_version", "?")

        return ft.Container(
            content=ft.Row(
                [
                    ft.Stack(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.PHONE_ANDROID,
                                    size=22,
                                    color=COLORS["text_secondary"],
                                ),
                                width=44,
                                height=44,
                                border_radius=RADIUS["md"],
                                bgcolor=COLORS["bg_tertiary"],
                                alignment=ft.alignment.center,
                            ),
                            ft.Container(
                                width=10,
                                height=10,
                                border_radius=5,
                                bgcolor=COLORS["success"] if is_online else COLORS["text_muted"],
                                border=ft.border.all(2, COLORS["bg_card"]),
                                right=0,
                                bottom=0,
                            ),
                        ],
                    ),
                    ft.Container(width=12),
                    ft.Column(
                        [
                            ft.Text(
                                name[:20] + "..." if len(name) > 20 else name,
                                size=13,
                                weight=ft.FontWeight.W_600,
                                color=COLORS["text_primary"],
                            ),
                            ft.Text(
                                serial,
                                size=11,
                                color=COLORS["text_muted"],
                            ),
                        ],
                        spacing=2,
                        expand=True,
                    ),
                    ft.Container(
                        content=ft.Text(
                            f"Android {android_version}",
                            size=10,
                            color=COLORS["text_secondary"],
                        ),
                        padding=ft.padding.symmetric(horizontal=8, vertical=4),
                        border_radius=RADIUS["sm"],
                        bgcolor=COLORS["bg_tertiary"],
                    ),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=12, vertical=10),
            border_radius=RADIUS["md"],
            bgcolor=COLORS["bg_tertiary"],
            on_click=lambda e, d=device: self._on_device_click(d),
        )

    def _build_empty_state(self):
        """Build empty state when no devices."""
        return ft.Container(
            content=ft.Column(
                [
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.PHONE_ANDROID,
                            size=40,
                            color=COLORS["text_muted"],
                        ),
                        width=72,
                        height=72,
                        border_radius=18,
                        bgcolor=COLORS["bg_tertiary"],
                        alignment=ft.alignment.center,
                    ),
                    ft.Container(height=16),
                    ft.Text(
                        "No Devices Connected",
                        size=15,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["text_primary"],
                    ),
                    ft.Container(height=4),
                    ft.Text(
                        "Connect via USB or WiFi ADB",
                        size=12,
                        color=COLORS["text_muted"],
                        text_align=ft.TextAlign.CENTER,
                    ),
                    ft.Container(height=16),
                    ft.ElevatedButton(
                        content=ft.Row(
                            [
                                ft.Icon(ft.Icons.RADAR, size=16, color=COLORS["text_inverse"]),
                                ft.Container(width=6),
                                ft.Text(
                                    "Scan",
                                    size=12,
                                    weight=ft.FontWeight.W_600,
                                    color=COLORS["text_inverse"],
                                ),
                            ],
                            alignment=ft.MainAxisAlignment.CENTER,
                        ),
                        bgcolor=COLORS["primary"],
                        style=ft.ButtonStyle(
                            shape=ft.RoundedRectangleBorder(radius=RADIUS["md"]),
                        ),
                        on_click=self._on_refresh,
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.symmetric(vertical=30),
            alignment=ft.alignment.center,
        )

    def _build_loading(self):
        """Build loading state."""
        return ft.Container(
            content=ft.Column(
                [
                    ft.ProgressRing(
                        width=36,
                        height=36,
                        stroke_width=3,
                        color=COLORS["primary"],
                    ),
                    ft.Container(height=12),
                    ft.Text(
                        "Scanning...",
                        size=13,
                        color=COLORS["text_secondary"],
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.symmetric(vertical=30),
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
