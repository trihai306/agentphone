"""Phone Viewer view - Cloud device farm style grid management."""

import flet as ft
import asyncio
from typing import List, Dict, Set
from ..theme import COLORS, RADIUS
from ..components.device_card import DeviceCard, DeviceGridToolbar
from ..components.empty_state import EmptyState
from ..backend import backend
from ..services.screen_service import screen_service


class PhoneViewerView(ft.Container):
    """Cloud device farm style grid view for managing multiple devices."""

    def __init__(self, app_state, toast, **kwargs):
        self.app_state = app_state
        self.toast = toast
        self.devices = []
        self.selected_devices: Set[str] = set()
        self.loading = False
        self.scrcpy_available = False
        self.scrcpy_version = None

        super().__init__(
            content=self._build_content(),
            expand=True,
            **kwargs
        )

    def _get_container_width(self):
        """Get the current container width for responsive layout."""
        try:
            if hasattr(self, 'page') and self.page:
                return self.page.window.width or 1440
        except:
            pass
        return 1440

    def _is_mobile(self):
        return self._get_container_width() < 768

    def _is_tablet(self):
        width = self._get_container_width()
        return width >= 768 and width < 1024

    def _get_grid_columns(self):
        """Get number of columns based on screen width."""
        width = self._get_container_width()
        if width < 600:
            return 2
        elif width < 900:
            return 4
        elif width < 1200:
            return 6
        elif width < 1600:
            return 8
        else:
            return 10

    def _build_content(self):
        """Build the view content."""
        return ft.Column(
            [
                self._build_header(),
                ft.Container(height=16),
                self._build_toolbar(),
                self._build_device_grid(),
            ],
            spacing=0,
            expand=True,
        )

    def _build_header(self):
        """Build the header section."""
        is_mobile = self._is_mobile()
        selected_count = len(self.selected_devices)
        total_count = len(self.devices)
        online_count = len([d for d in self.devices if d.get("status") == "connected"])

        if is_mobile:
            return ft.Column(
                [
                    ft.Row(
                        [
                            ft.Text(
                                "Device Farm",
                                size=22,
                                weight=ft.FontWeight.W_700,
                                color=COLORS["text_primary"],
                            ),
                            ft.Container(expand=True),
                            # Stats badges
                            ft.Container(
                                content=ft.Text(
                                    f"{online_count}/{total_count}",
                                    size=11,
                                    weight=ft.FontWeight.W_600,
                                    color=COLORS["success"],
                                ),
                                bgcolor=COLORS["success_glow"],
                                border_radius=12,
                                padding=ft.padding.symmetric(horizontal=8, vertical=4),
                            ),
                        ],
                    ),
                    ft.Container(height=8),
                    ft.Row(
                        [
                            self._build_right_actions(),
                        ],
                    ),
                ],
            )

        return ft.Row(
            [
                ft.Column(
                    [
                        ft.Row(
                            [
                                ft.Text(
                                    "Device Farm",
                                    size=26,
                                    weight=ft.FontWeight.W_700,
                                    color=COLORS["text_primary"],
                                ),
                                ft.Container(width=12),
                                # Online count badge
                                ft.Container(
                                    content=ft.Row(
                                        [
                                            ft.Container(
                                                width=8,
                                                height=8,
                                                border_radius=4,
                                                bgcolor=COLORS["success"],
                                            ),
                                            ft.Container(width=6),
                                            ft.Text(
                                                f"{online_count} online",
                                                size=12,
                                                weight=ft.FontWeight.W_500,
                                                color=COLORS["success"],
                                            ),
                                        ],
                                    ),
                                    bgcolor=COLORS["success_glow"],
                                    border_radius=12,
                                    padding=ft.padding.symmetric(horizontal=10, vertical=4),
                                ),
                                ft.Container(width=8),
                                # Selected count badge
                                ft.Container(
                                    content=ft.Text(
                                        f"{selected_count} selected",
                                        size=12,
                                        weight=ft.FontWeight.W_500,
                                        color=COLORS["accent_purple"],
                                    ),
                                    bgcolor=f"{COLORS['accent_purple']}20",
                                    border_radius=12,
                                    padding=ft.padding.symmetric(horizontal=10, vertical=4),
                                ) if selected_count > 0 else ft.Container(),
                            ],
                        ),
                        ft.Text(
                            "Manage and control your cloud devices",
                            size=13,
                            color=COLORS["text_secondary"],
                        ),
                    ],
                    spacing=4,
                ),
                ft.Container(expand=True),
                self._build_right_actions(),
            ],
        )

    def _build_right_actions(self):
        """Build right side action buttons."""
        return ft.Row(
            [
                # Payment button
                ft.Container(
                    content=ft.Row(
                        [
                            ft.Icon(ft.Icons.PAYMENT, size=16, color=COLORS["text_primary"]),
                            ft.Container(width=6),
                            ft.Text("Payment", size=12, weight=ft.FontWeight.W_500, color=COLORS["text_primary"]),
                        ],
                    ),
                    padding=ft.padding.symmetric(horizontal=12, vertical=8),
                    border_radius=RADIUS["md"],
                    border=ft.border.all(1, COLORS["border"]),
                    on_click=lambda e: self.toast.info("Payment coming soon..."),
                    on_hover=self._on_button_hover,
                ),
                ft.Container(width=8),
                # Docs button
                ft.Container(
                    content=ft.Row(
                        [
                            ft.Icon(ft.Icons.DESCRIPTION, size=16, color=COLORS["text_primary"]),
                            ft.Container(width=6),
                            ft.Text("Docs", size=12, weight=ft.FontWeight.W_500, color=COLORS["text_primary"]),
                        ],
                    ),
                    padding=ft.padding.symmetric(horizontal=12, vertical=8),
                    border_radius=RADIUS["md"],
                    border=ft.border.all(1, COLORS["border"]),
                    on_click=lambda e: self.toast.info("Docs coming soon..."),
                    on_hover=self._on_button_hover,
                ),
            ],
            spacing=0,
        )

    def _build_toolbar(self):
        """Build the toolbar section."""
        is_mobile = self._is_mobile()

        if is_mobile:
            # Simplified mobile toolbar
            return ft.Container(
                content=ft.Row(
                    [
                        # Select all checkbox
                        ft.Checkbox(
                            value=len(self.selected_devices) == len(self.devices) and len(self.devices) > 0,
                            on_change=self._on_select_all,
                        ),
                        ft.Text(f"{len(self.selected_devices)}", size=12, color=COLORS["text_secondary"]),
                        ft.Container(expand=True),
                        ft.IconButton(
                            icon=ft.Icons.PLAY_ARROW,
                            icon_color=COLORS["primary"],
                            tooltip="Automate",
                            on_click=self._on_automate,
                        ),
                        ft.IconButton(
                            icon=ft.Icons.REFRESH,
                            icon_color=COLORS["text_muted"],
                            tooltip="Refresh",
                            on_click=self._on_refresh,
                        ),
                    ],
                ),
                padding=ft.padding.symmetric(horizontal=8, vertical=4),
                bgcolor=COLORS["bg_card"],
                border=ft.border.only(bottom=ft.BorderSide(1, COLORS["border"])),
            )

        return ft.Container(
            content=ft.Row(
                [
                    # Left side - Select all and action buttons
                    ft.Row(
                        [
                            ft.Checkbox(
                                value=len(self.selected_devices) == len(self.devices) and len(self.devices) > 0,
                                on_change=self._on_select_all,
                            ),
                            self._build_toolbar_button(
                                "Automate",
                                ft.Icons.PLAY_CIRCLE_OUTLINE,
                                self._on_automate,
                                primary=True,
                            ),
                            self._build_toolbar_button(
                                "Proxy Data",
                                ft.Icons.VPN_KEY_OUTLINED,
                                self._on_proxy_data,
                            ),
                            self._build_toolbar_button(
                                "Change Device",
                                ft.Icons.SWAP_HORIZ,
                                self._on_change_device,
                            ),
                            self._build_toolbar_button(
                                "Functions",
                                ft.Icons.TUNE,
                                self._on_functions,
                            ),
                            self._build_toolbar_button(
                                "Copy",
                                ft.Icons.CONTENT_COPY,
                                self._on_copy,
                            ),
                        ],
                        spacing=8,
                    ),
                    ft.Container(expand=True),
                    # Right side - Refresh
                    ft.IconButton(
                        icon=ft.Icons.REFRESH,
                        icon_color=COLORS["text_muted"],
                        tooltip="Refresh devices",
                        on_click=self._on_refresh,
                    ),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=12, vertical=8),
            bgcolor=COLORS["bg_card"],
            border=ft.border.only(bottom=ft.BorderSide(1, COLORS["border"])),
        )

    def _build_toolbar_button(self, label: str, icon: str, on_click, primary: bool = False):
        """Build a toolbar action button."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(
                        icon,
                        size=16,
                        color=COLORS["text_inverse"] if primary else COLORS["text_secondary"],
                    ),
                    ft.Container(width=6),
                    ft.Text(
                        label,
                        size=12,
                        weight=ft.FontWeight.W_500,
                        color=COLORS["text_inverse"] if primary else COLORS["text_secondary"],
                    ),
                    ft.Icon(
                        ft.Icons.KEYBOARD_ARROW_DOWN,
                        size=14,
                        color=COLORS["text_inverse"] if primary else COLORS["text_secondary"],
                    ),
                ],
                spacing=0,
            ),
            padding=ft.padding.symmetric(horizontal=12, vertical=8),
            border_radius=RADIUS["md"],
            bgcolor=COLORS["primary"] if primary else "transparent",
            border=None if primary else ft.border.all(1, COLORS["border"]),
            on_click=on_click,
            on_hover=self._on_primary_hover if primary else self._on_button_hover,
        )

    def _build_device_grid(self):
        """Build the device grid section."""
        if self.loading:
            return self._build_loading()

        if not self.devices:
            return ft.Container(
                content=ft.Column(
                    [
                        ft.Icon(
                            ft.Icons.PHONE_ANDROID,
                            size=64,
                            color=COLORS["text_muted"],
                        ),
                        ft.Container(height=16),
                        ft.Text(
                            "No Devices Connected",
                            size=18,
                            weight=ft.FontWeight.W_600,
                            color=COLORS["text_primary"],
                        ),
                        ft.Container(height=8),
                        ft.Text(
                            "Connect Android devices via USB or WiFi ADB",
                            size=13,
                            color=COLORS["text_secondary"],
                        ),
                        ft.Container(height=20),
                        ft.ElevatedButton(
                            text="Scan for Devices",
                            icon=ft.Icons.RADAR,
                            bgcolor=COLORS["primary"],
                            color=COLORS["text_inverse"],
                            on_click=self._on_refresh,
                        ),
                    ],
                    horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                ),
                padding=60,
                alignment=ft.alignment.center,
                expand=True,
            )

        # Build device cards
        cards = []
        for idx, device in enumerate(self.devices):
            serial = device.get("adb_serial", str(idx))
            cards.append(
                DeviceCard(
                    device_id=str(400 + idx),  # Mock ID like in screenshot
                    device_name=device.get("name", "Device"),
                    device_model=device.get("model", "Galaxy S7"),
                    status=device.get("status", "offline"),
                    task_status=device.get("task_status", ""),
                    android_version=device.get("android_version", "?"),
                    screenshot_url=screen_service.get_cached_screenshot(serial),
                    on_click=lambda did=serial: self._on_device_click(did),
                    on_select=self._on_device_select,
                    selected=serial in self.selected_devices,
                )
            )

        # Wrap in scrollable grid
        return ft.Container(
            content=ft.Column(
                [
                    ft.Container(
                        content=ft.Row(
                            cards,
                            wrap=True,
                            spacing=12,
                            run_spacing=12,
                        ),
                        padding=ft.padding.all(16),
                    ),
                ],
                scroll=ft.ScrollMode.AUTO,
                expand=True,
            ),
            expand=True,
            bgcolor=COLORS["bg_primary"],
        )

    def _build_loading(self):
        """Build loading state."""
        return ft.Container(
            content=ft.Column(
                [
                    ft.ProgressRing(
                        width=40,
                        height=40,
                        stroke_width=3,
                        color=COLORS["primary"],
                    ),
                    ft.Container(height=16),
                    ft.Text(
                        "Loading devices...",
                        size=14,
                        color=COLORS["text_secondary"],
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=60,
            alignment=ft.alignment.center,
            expand=True,
        )

    # Event handlers
    def _on_button_hover(self, e):
        if e.data == "true":
            e.control.bgcolor = COLORS["bg_hover"]
        else:
            e.control.bgcolor = "transparent"
        e.control.update()

    def _on_primary_hover(self, e):
        if e.data == "true":
            e.control.bgcolor = COLORS["primary_dark"]
        else:
            e.control.bgcolor = COLORS["primary"]
        e.control.update()

    def _on_device_click(self, device_id: str):
        """Handle device card click."""
        self.toast.info(f"Opening device {device_id}...")

    def _on_device_select(self, device_id: str, selected: bool):
        """Handle device selection."""
        # Find the actual serial from index
        try:
            idx = int(device_id) - 400
            if 0 <= idx < len(self.devices):
                serial = self.devices[idx].get("adb_serial", device_id)
                if selected:
                    self.selected_devices.add(serial)
                else:
                    self.selected_devices.discard(serial)
                self.content = self._build_content()
                self.update()
        except:
            pass

    def _on_select_all(self, e):
        """Handle select all checkbox."""
        if e.control.value:
            self.selected_devices = {d.get("adb_serial", "") for d in self.devices}
        else:
            self.selected_devices = set()
        self.content = self._build_content()
        self.update()

    async def _on_automate(self, e):
        """Handle automate action."""
        if not self.selected_devices:
            self.toast.warning("Select devices to automate")
            return
        self.toast.info(f"Automating {len(self.selected_devices)} devices...")

    async def _on_proxy_data(self, e):
        """Handle proxy data action."""
        self.toast.info("Proxy data coming soon...")

    async def _on_change_device(self, e):
        """Handle change device action."""
        self.toast.info("Change device coming soon...")

    async def _on_functions(self, e):
        """Handle functions action."""
        self.toast.info("Functions coming soon...")

    async def _on_copy(self, e):
        """Handle copy action."""
        self.toast.info("Copy coming soon...")

    async def _on_refresh(self, e):
        """Handle refresh button click."""
        self.loading = True
        self.content = self._build_content()
        self.update()
        await self.load_devices()

    async def load_devices(self):
        """Load devices."""
        self.loading = True

        # Check scrcpy
        self.scrcpy_available = screen_service.check_scrcpy_installed()
        if self.scrcpy_available:
            self.scrcpy_version = screen_service.get_scrcpy_version()

        try:
            try:
                self.devices = await backend.discover_devices()
            except Exception:
                self.devices = await backend.get_devices()

            # Add mock data for demo if no devices
            if not self.devices:
                # Add mock devices for demo
                self.devices = [
                    {"adb_serial": f"emulator-{5554 + i*2}", "name": f"Device {i+1}",
                     "model": "Galaxy S7", "status": "connected", "android_version": "10"}
                    for i in range(12)
                ]

            self.toast.success(f"Found {len(self.devices)} devices")
        except Exception as ex:
            self.toast.error(f"Failed to load devices: {ex}")
            self.devices = []
        finally:
            self.loading = False
            self.content = self._build_content()
            self.update()

    def refresh(self):
        """Refresh the view."""
        self.content = self._build_content()
        self.update()
