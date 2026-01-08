"""Device Detail Modal component for displaying full device specifications.

A polished modal dialog that displays comprehensive device information,
connection history, and action buttons following the Modal pattern from modal.py.
Uses the stat card pattern from devices.py for info sections.
"""

import flet as ft
from typing import Optional, Callable, Dict, Any
from ..theme import get_colors, ANIMATION, RADIUS, get_shadow



# Dynamic color proxy - acts like a dict but always gets current theme colors
class _DynamicColors:
    def get(self, key, default=None):
        return get_colors().get(key, default)
    
    def __getitem__(self, key):
        return get_colors()[key]

COLORS = _DynamicColors()

class DeviceDetailModal(ft.AlertDialog):
    """A polished modal dialog for displaying full device details.

    Features:
    - Full device specifications display (model, Android version, serial, etc.)
    - Stat card pattern for device metrics (storage, RAM, battery)
    - Connection history section (placeholder)
    - Action buttons for device operations
    - Enhanced styling following Modal pattern
    """

    def __init__(
        self,
        device: Dict[str, Any],
        on_close: Optional[Callable] = None,
        on_screenshot: Optional[Callable] = None,
        on_restart: Optional[Callable] = None,
        on_disconnect: Optional[Callable] = None,
        on_run_agent: Optional[Callable] = None,
        width: int = 600,
        **kwargs
    ):
        self.device = device
        self.on_close_callback = on_close
        self.on_screenshot = on_screenshot
        self.on_restart = on_restart
        self.on_disconnect = on_disconnect
        self.on_run_agent = on_run_agent
        self.modal_width = width

        # Build the modal content
        title_content = self._build_title()
        content_container = self._build_content()
        action_buttons = self._build_actions()

        super().__init__(
            modal=True,
            title=title_content,
            title_padding=ft.padding.only(left=28, right=28, top=24, bottom=0),
            content=content_container,
            content_padding=ft.padding.symmetric(horizontal=28),
            actions=action_buttons,
            actions_alignment=ft.MainAxisAlignment.END,
            actions_padding=ft.padding.only(left=28, right=28, bottom=24, top=16),
            bgcolor=COLORS["bg_card"],
            shape=ft.RoundedRectangleBorder(radius=RADIUS["xl"]),
            surface_tint_color="transparent",
            shadow_color="#00000020",
            elevation=16,
            barrier_color=COLORS["backdrop"],
            **kwargs
        )

    def _build_title(self) -> ft.Container:
        """Build the title row with device name and close button."""
        device_name = self.device.get("name") or self.device.get("model") or "Unknown Device"
        status = self.device.get("status", "offline")
        is_online = status == "connected"

        # Status indicator with glow effect
        status_indicator = ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        width=8,
                        height=8,
                        border_radius=4,
                        bgcolor=COLORS["success"] if is_online else COLORS["text_muted"] if is_online else None,
                    ),
                    ft.Container(width=6),
                    ft.Text(
                        "Online" if is_online else "Offline",
                        size=12,
                        weight=ft.FontWeight.W_500,
                        color=COLORS["success"] if is_online else COLORS["text_muted"],
                    ),
                ],
                spacing=0,
            ),
            bgcolor=COLORS["success_glow"] if is_online else COLORS["bg_tertiary"],
            border_radius=RADIUS["full"],
            padding=ft.padding.symmetric(horizontal=12, vertical=5),
        )

        # Title row with device info and close button
        return ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.PHONE_ANDROID_ROUNDED,
                            size=24,
                            color=COLORS["primary"],
                        ),
                        width=48,
                        height=48,
                        border_radius=RADIUS["lg"],
                        bgcolor=f"{COLORS['primary']}12",
                        border=ft.border.all(1, f"{COLORS['primary']}20"),
                        alignment=ft.Alignment(0, 0)
                    ),
                    ft.Container(width=16),
                    ft.Column(
                        [
                            ft.Text(
                                device_name[:30] + "..." if len(device_name) > 30 else device_name,
                                size=20,
                                weight=ft.FontWeight.W_700,
                                color=COLORS["text_primary"],
                            ),
                            ft.Container(height=2),
                            status_indicator,
                        ],
                        spacing=2,
                        expand=True,
                    ),
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.CLOSE_ROUNDED,
                            size=20,
                            color=COLORS["text_muted"],
                        ),
                        width=36,
                        height=36,
                        border_radius=RADIUS["md"],
                        alignment=ft.Alignment(0, 0),
                        bgcolor=COLORS["bg_tertiary"],
                        border=ft.border.all(1, COLORS["border_subtle"]),
                        on_click=self._handle_close,
                        ink=True,
                        animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                        on_hover=self._on_close_hover,
                    ),
                ],
                alignment=ft.MainAxisAlignment.START,
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.only(bottom=8),
        )

    def _build_content(self) -> ft.Container:
        """Build the main content with device specs, metrics, and history."""
        # Gradient divider
        divider = ft.Container(
            content=ft.Container(
                height=1,
                gradient=ft.LinearGradient(
                    begin=ft.Alignment(-1, 0),
                    end=ft.Alignment(1, 0),
                    colors=[
                        "transparent",
                        COLORS["border_light"],
                        COLORS["border_light"],
                        "transparent",
                    ],
                    stops=[0, 0.1, 0.9, 1],
                ),
            ),
            margin=ft.margin.only(bottom=20),
        )

        # Main content column
        content = ft.Column(
            [
                divider,
                # Device Specifications Section
                self._build_section_header("Device Specifications", ft.Icons.INFO_OUTLINE),
                ft.Container(height=12),
                self._build_specs_grid(),
                ft.Container(height=24),
                # Device Metrics Section (stat cards)
                self._build_section_header("Device Metrics", ft.Icons.ANALYTICS_OUTLINED),
                ft.Container(height=12),
                self._build_metrics_row(),
                ft.Container(height=24),
                # Connection History Section (placeholder)
                self._build_section_header("Connection History", ft.Icons.HISTORY_ROUNDED),
                ft.Container(height=12),
                self._build_history_section(),
            ],
            spacing=0,
        )

        return ft.Container(
            content=content,
            width=self.modal_width,
            padding=ft.padding.symmetric(vertical=4),
        )

    def _build_section_header(self, title: str, icon: str) -> ft.Container:
        """Build a section header with icon and title."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        content=ft.Icon(
                            icon,
                            size=18,
                            color=COLORS["accent_indigo"],
                        ),
                        width=32,
                        height=32,
                        border_radius=RADIUS["md"],
                        bgcolor=f"{COLORS['accent_indigo']}12",
                        alignment=ft.Alignment(0, 0),
                        border=ft.border.all(1, f"{COLORS['accent_indigo']}20"),
                    ),
                    ft.Container(width=10),
                    ft.Text(
                        title,
                        size=15,
                        weight=ft.FontWeight.W_700,
                        color=COLORS["text_primary"],
                    ),
                ],
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
        )

    def _build_specs_grid(self) -> ft.Container:
        """Build the device specifications grid."""
        specs = [
            {
                "label": "Model",
                "value": self.device.get("model", "Unknown"),
                "icon": ft.Icons.PHONE_ANDROID_ROUNDED,
            },
            {
                "label": "Android Version",
                "value": f"Android {self.device.get('android_version', '?')}",
                "icon": ft.Icons.ANDROID_ROUNDED,
            },
            {
                "label": "Serial Number",
                "value": self.device.get("adb_serial", "N/A"),
                "icon": ft.Icons.TAG_ROUNDED,
            },
            {
                "label": "Device ID",
                "value": self.device.get("device_id", self.device.get("adb_serial", "N/A"))[:20],
                "icon": ft.Icons.FINGERPRINT_ROUNDED,
            },
            {
                "label": "Brand",
                "value": self.device.get("brand", self.device.get("manufacturer", "Unknown")),
                "icon": ft.Icons.BUSINESS_ROUNDED,
            },
            {
                "label": "SDK Version",
                "value": f"API {self.device.get('sdk_version', '?')}",
                "icon": ft.Icons.CODE_ROUNDED,
            },
        ]

        # Build two columns of specs
        left_specs = specs[:3]
        right_specs = specs[3:]

        return ft.Container(
            content=ft.Row(
                [
                    ft.Column(
                        [self._build_spec_item(s) for s in left_specs],
                        spacing=12,
                        expand=True,
                    ),
                    ft.Container(width=20),
                    ft.Column(
                        [self._build_spec_item(s) for s in right_specs],
                        spacing=12,
                        expand=True,
                    ),
                ],
            ),
            bgcolor=COLORS["bg_tertiary"],
            border_radius=RADIUS["lg"],
            padding=16,
            border=ft.border.all(1, COLORS["border_subtle"]),
        )

    def _build_spec_item(self, spec: Dict[str, Any]) -> ft.Container:
        """Build a single specification item."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        content=ft.Icon(
                            spec["icon"],
                            size=16,
                            color=COLORS["text_secondary"],
                        ),
                        width=28,
                        height=28,
                        border_radius=RADIUS["sm"],
                        bgcolor=COLORS["bg_card"],
                        alignment=ft.Alignment(0, 0),
                        border=ft.border.all(1, COLORS["border"]),
                    ),
                    ft.Container(width=10),
                    ft.Column(
                        [
                            ft.Text(
                                spec["label"],
                                size=11,
                                weight=ft.FontWeight.W_500,
                                color=COLORS["text_muted"],
                            ),
                            ft.Text(
                                str(spec["value"])[:25] + "..." if len(str(spec["value"])) > 25 else str(spec["value"]),
                                size=13,
                                weight=ft.FontWeight.W_600,
                                color=COLORS["text_primary"],
                            ),
                        ],
                        spacing=2,
                        expand=True,
                    ),
                ],
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
        )

    def _build_metrics_row(self) -> ft.Row:
        """Build the metrics row with stat cards for storage, RAM, and battery."""
        # Get metric values from device data
        battery = self.device.get("battery_level", self.device.get("battery", None))
        storage_used = self.device.get("storage_used", None)
        storage_total = self.device.get("storage_total", None)
        ram_used = self.device.get("ram_used", None)
        ram_total = self.device.get("ram_total", None)

        metrics = [
            {
                "title": "Battery",
                "value": f"{battery}%" if battery is not None else "N/A",
                "icon": ft.Icons.BATTERY_FULL_ROUNDED if battery and battery > 20 else ft.Icons.BATTERY_ALERT_ROUNDED,
                "color": COLORS["success"] if battery and battery > 50 else (
                    COLORS["warning"] if battery and battery > 20 else COLORS["error"]
                ) if battery else COLORS["text_muted"],
                "subtitle": "Current level",
            },
            {
                "title": "Storage",
                "value": f"{storage_used}/{storage_total} GB" if storage_used and storage_total else "N/A",
                "icon": ft.Icons.STORAGE_ROUNDED,
                "color": COLORS["accent_blue"],
                "subtitle": "Used / Total",
            },
            {
                "title": "RAM",
                "value": f"{ram_used}/{ram_total} GB" if ram_used and ram_total else "N/A",
                "icon": ft.Icons.MEMORY_ROUNDED,
                "color": COLORS["accent_purple"],
                "subtitle": "Used / Total",
            },
        ]

        return ft.Row(
            [self._build_metric_card(m) for m in metrics],
            spacing=12,
        )

    def _build_metric_card(self, metric: Dict[str, Any]) -> ft.Container:
        """Build a single metric stat card following the devices.py pattern."""
        color = metric["color"]

        return ft.Container(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            ft.Text(
                                metric["title"],
                                size=12,
                                weight=ft.FontWeight.W_500,
                                color=COLORS["text_secondary"],
                            ),
                            ft.Container(expand=True),
                            ft.Container(
                                content=ft.Icon(
                                    metric["icon"],
                                    size=18,
                                    color=color,
                                ),
                                width=36,
                                height=36,
                                border_radius=RADIUS["md"],
                                bgcolor=f"{color}12",
                                alignment=ft.Alignment(0, 0),
                                border=ft.border.all(1, f"{color}20")
                            ),
                        ],
                        vertical_alignment=ft.CrossAxisAlignment.START,
                    ),
                    ft.Container(height=8),
                    ft.Text(
                        metric["value"],
                        size=20,
                        weight=ft.FontWeight.W_800,
                        color=COLORS["text_primary"],
                    ),
                    ft.Container(height=4),
                    ft.Text(
                        metric["subtitle"],
                        size=10,
                        weight=ft.FontWeight.W_400,
                        color=COLORS["text_muted"],
                    ),
                ],
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["lg"],
            padding=16,
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("xs"),
            expand=True,
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            on_hover=lambda e, c=color: self._on_metric_hover(e, c),
        )

    def _on_metric_hover(self, e, color: str):
        """Handle metric card hover effect."""
        if e.data == "true":
            e.control.border = ft.border.all(1, f"{color}40")
            
        else:
            e.control.border = ft.border.all(1, COLORS["border"])
            e.control.shadow = get_shadow("xs")
        e.control.update()

    def _build_history_section(self) -> ft.Container:
        """Build the connection history section (placeholder)."""
        # Placeholder history items
        history_items = [
            {
                "event": "Connected",
                "time": "5 minutes ago",
                "icon": ft.Icons.LINK_ROUNDED,
                "color": COLORS["success"],
            },
            {
                "event": "Agent Run Completed",
                "time": "1 hour ago",
                "icon": ft.Icons.CHECK_CIRCLE_OUTLINE_ROUNDED,
                "color": COLORS["accent_blue"],
            },
            {
                "event": "Disconnected",
                "time": "2 hours ago",
                "icon": ft.Icons.LINK_OFF_ROUNDED,
                "color": COLORS["text_muted"],
            },
        ]

        return ft.Container(
            content=ft.Column(
                [self._build_history_item(item) for item in history_items],
                spacing=8,
            ),
            bgcolor=COLORS["bg_tertiary"],
            border_radius=RADIUS["lg"],
            padding=12,
            border=ft.border.all(1, COLORS["border_subtle"]),
        )

    def _build_history_item(self, item: Dict[str, Any]) -> ft.Container:
        """Build a single history item."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        content=ft.Icon(
                            item["icon"],
                            size=14,
                            color=item["color"],
                        ),
                        width=28,
                        height=28,
                        border_radius=RADIUS["sm"],
                        bgcolor=f"{item['color']}12",
                        alignment=ft.Alignment(0, 0),
                        border=ft.border.all(1, f"{item['color']}20"),
                    ),
                    ft.Container(width=10),
                    ft.Text(
                        item["event"],
                        size=13,
                        weight=ft.FontWeight.W_500,
                        color=COLORS["text_primary"],
                        expand=True,
                    ),
                    ft.Container(
                        content=ft.Text(
                            item["time"],
                            size=11,
                            weight=ft.FontWeight.W_400,
                            color=COLORS["text_muted"],
                        ),
                        padding=ft.padding.symmetric(horizontal=8, vertical=4),
                        border_radius=RADIUS["sm"],
                        bgcolor=COLORS["bg_card"],
                    ),
                ],
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.symmetric(horizontal=8, vertical=6),
            border_radius=RADIUS["md"],
            on_hover=self._on_history_hover,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

    def _on_history_hover(self, e):
        """Handle history item hover."""
        if e.data == "true":
            e.control.bgcolor = COLORS["bg_hover"]
        else:
            e.control.bgcolor = "transparent"
        e.control.update()

    def _build_actions(self) -> list:
        """Build the action buttons."""
        return [
            # Secondary actions
            self._build_action_button(
                "Screenshot",
                ft.Icons.SCREENSHOT_ROUNDED,
                COLORS["accent_blue"],
                self.on_screenshot,
                secondary=True,
            ),
            ft.Container(width=8),
            self._build_action_button(
                "Restart",
                ft.Icons.RESTART_ALT_ROUNDED,
                COLORS["warning"],
                self.on_restart,
                secondary=True,
            ),
            ft.Container(width=8),
            self._build_action_button(
                "Disconnect",
                ft.Icons.LINK_OFF_ROUNDED,
                COLORS["error"],
                self.on_disconnect,
                secondary=True,
            ),
            ft.Container(width=16),
            # Primary action
            self._build_action_button(
                "Run Agent",
                ft.Icons.SMART_TOY_ROUNDED,
                COLORS["primary"],
                self.on_run_agent,
                primary=True,
            ),
        ]

    def _build_action_button(
        self,
        label: str,
        icon: str,
        color: str,
        on_click: Optional[Callable],
        primary: bool = False,
        secondary: bool = False,
    ) -> ft.Container:
        """Build an action button with consistent styling."""
        if primary:
            # Primary button styling
            return ft.Container(
                content=ft.Row(
                    [
                        ft.Icon(icon, size=16, color=COLORS["text_inverse"]),
                        ft.Container(width=8),
                        ft.Text(
                            label,
                            size=14,
                            weight=ft.FontWeight.W_600,
                            color=COLORS["text_inverse"],
                        ),
                    ],
                    spacing=0,
                ),
                padding=ft.padding.symmetric(horizontal=20, vertical=12),
                border_radius=RADIUS["md"],
                bgcolor=color,
                border=ft.border.all(1, f"{COLORS['primary_dark']}80"),
                on_click=lambda e: on_click(self.device) if on_click else None,
                ink=True,
                ink_color=f"{COLORS['text_inverse']}20",
                animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
                on_hover=lambda e: self._on_primary_button_hover(e, color),
            )
        else:
            # Secondary button styling
            return ft.Container(
                content=ft.Row(
                    [
                        ft.Icon(icon, size=16, color=color),
                        ft.Container(width=6),
                        ft.Text(
                            label,
                            size=13,
                            weight=ft.FontWeight.W_600,
                            color=color,
                        ),
                    ],
                    spacing=0,
                ),
                padding=ft.padding.symmetric(horizontal=14, vertical=10),
                border_radius=RADIUS["md"],
                bgcolor=f"{color}10",
                border=ft.border.all(1, f"{color}20"),
                on_click=lambda e: on_click(self.device) if on_click else None,
                ink=True,
                ink_color=f"{color}15",
                animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
                on_hover=lambda e: self._on_secondary_button_hover(e, color),
            )

    def _on_primary_button_hover(self, e, color: str):
        """Handle primary button hover."""
        if e.data == "true":
            e.control.bgcolor = COLORS["primary_dark"]
            
        else:
            e.control.bgcolor = color
            
        e.control.update()

    def _on_secondary_button_hover(self, e, color: str):
        """Handle secondary button hover."""
        if e.data == "true":
            e.control.bgcolor = f"{color}20"
            e.control.border = ft.border.all(1, f"{color}40")
        else:
            e.control.bgcolor = f"{color}10"
            e.control.border = ft.border.all(1, f"{color}20")
        e.control.update()

    def _on_close_hover(self, e):
        """Handle close button hover."""
        if e.data == "true":
            e.control.bgcolor = COLORS["bg_hover"]
            e.control.border = ft.border.all(1, COLORS["border_light"])
        else:
            e.control.bgcolor = COLORS["bg_tertiary"]
            e.control.border = ft.border.all(1, COLORS["border_subtle"])
        e.control.update()

    def _handle_close(self, e):
        """Handle close button click."""
        if self.on_close_callback:
            self.on_close_callback(e)


def show_device_detail_modal(
    page: ft.Page,
    device: Dict[str, Any],
    on_close: Optional[Callable] = None,
    on_screenshot: Optional[Callable] = None,
    on_restart: Optional[Callable] = None,
    on_disconnect: Optional[Callable] = None,
    on_run_agent: Optional[Callable] = None,
) -> DeviceDetailModal:
    """Helper function to create and show a device detail modal.

    Args:
        page: The Flet page to show the modal on
        device: Device data dictionary
        on_close: Callback when modal is closed
        on_screenshot: Callback for screenshot action
        on_restart: Callback for restart action
        on_disconnect: Callback for disconnect action
        on_run_agent: Callback for run agent action

    Returns:
        The created DeviceDetailModal instance
    """
    def handle_close(e):
        page.close(modal)
        if on_close:
            on_close(e)

    modal = DeviceDetailModal(
        device=device,
        on_close=handle_close,
        on_screenshot=on_screenshot,
        on_restart=on_restart,
        on_disconnect=on_disconnect,
        on_run_agent=on_run_agent,
    )

    page.open(modal)
    return modal
