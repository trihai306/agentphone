"""Device Card component for grid view - Cloud device farm style."""

import flet as ft
from typing import Optional, Callable
from ..theme import get_colors, RADIUS, get_shadow, SPACING, ANIMATION


class DeviceCard(ft.Container):
    """A device card showing device info with screenshot preview."""

    def __init__(
        self,
        device_id: str,
        device_name: str,
        device_model: str = "Unknown",
        status: str = "offline",
        task_status: str = "",
        screenshot_url: Optional[str] = None,
        android_version: str = "?",
        on_click: Optional[Callable] = None,
        on_select: Optional[Callable] = None,
        selected: bool = False,
        # Extended device info
        battery_level: Optional[int] = None,
        storage_used: Optional[float] = None,
        storage_total: Optional[float] = None,
        ram_usage: Optional[int] = None,
        # Quick action callbacks
        on_view_details: Optional[Callable] = None,
        on_screenshot: Optional[Callable] = None,
        on_restart: Optional[Callable] = None,
        on_clear_data: Optional[Callable] = None,
        on_disconnect: Optional[Callable] = None,
    ):
        self.device_id = device_id
        self.device_name = device_name
        self.device_model = device_model
        self.status = status
        self.task_status = task_status
        self.screenshot_url = screenshot_url
        self.android_version = android_version
        self.on_card_click = on_click
        self.on_select = on_select
        self.selected = selected
        # Extended info
        self.battery_level = battery_level
        self.storage_used = storage_used
        self.storage_total = storage_total
        self.ram_usage = ram_usage
        # Quick action callbacks
        self.on_view_details = on_view_details
        self.on_screenshot = on_screenshot
        self.on_restart = on_restart
        self.on_clear_data = on_clear_data
        self.on_disconnect = on_disconnect

        colors = get_colors()
        super().__init__(
            content=self._build_content(),
            width=160,
            height=280,
            border_radius=RADIUS["lg"],
            bgcolor=colors["bg_card"],
            border=ft.border.all(
                2 if selected else 1,
                colors["primary"] if selected else colors["border"]
            ),
            on_click=self._handle_click,
            on_hover=self._on_hover,
            # Use subtle elevation for all cards, slightly more for selected
            shadow=get_shadow("sm") if selected else get_shadow("xs"),
        )

    def _build_content(self):
        """Build the card content."""
        colors = get_colors()
        # Status color
        status_color = colors["success"] if self.status == "connected" else colors["text_muted"]

        # Header with Cloud badge and ID
        header = ft.Container(
            content=ft.Row(
                [
                    # Cloud status badge
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Container(
                                    width=6,
                                    height=6,
                                    border_radius=3,
                                    bgcolor=status_color,
                                ),
                                ft.Container(width=4),
                                ft.Text(
                                    "Cloud",
                                    size=9,
                                    color=colors["primary"],
                                    weight=ft.FontWeight.W_600,
                                ),
                            ],
                            spacing=0,
                        ),
                        padding=ft.padding.symmetric(horizontal=6, vertical=2),
                        border_radius=4,
                        bgcolor=colors["primary_glow"],
                    ),
                    ft.Container(expand=True),
                    # Device ID
                    ft.Text(
                        self.device_id[:3] if len(self.device_id) >= 3 else self.device_id,
                        size=14,
                        weight=ft.FontWeight.W_700,
                        color=colors["primary"],
                    ),
                ],
            ),
            padding=ft.padding.only(left=8, right=8, top=8),
        )

        # Device name
        device_info = ft.Container(
            content=ft.Column(
                [
                    ft.Text(
                        self.device_model[:12] + "..." if len(self.device_model) > 12 else self.device_model,
                        size=11,
                        weight=ft.FontWeight.W_600,
                        color=colors["primary"],
                    ),
                ],
                spacing=0,
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.symmetric(horizontal=8),
            alignment=ft.Alignment(0, 0),
        )

        # Screenshot preview area
        if self.screenshot_url:
            preview = ft.Container(
                content=ft.Image(
                    src=self.screenshot_url,
                    fit=ft.ImageFit.CONTAIN,
                ),
                height=140,
                bgcolor=colors["bg_tertiary"],
                border_radius=RADIUS["sm"],
                margin=ft.margin.symmetric(horizontal=8),
            )
        else:
            # Placeholder with device icon
            preview = ft.Container(
                content=ft.Column(
                    [
                        ft.Icon(
                            ft.Icons.PHONE_ANDROID,
                            size=40,
                            color=colors["text_muted"],
                        ),
                        ft.Text(
                            f"Android {self.android_version}",
                            size=10,
                            color=colors["text_muted"],
                        ),
                    ],
                    horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                    alignment=ft.MainAxisAlignment.CENTER,
                    spacing=8,
                ),
                height=140,
                bgcolor=colors["bg_tertiary"],
                border_radius=RADIUS["sm"],
                margin=ft.margin.symmetric(horizontal=8),
                alignment=ft.Alignment(0, 0),
            )

        # Task status
        task_widget = ft.Container(
            content=ft.Text(
                self.task_status or "Ready",
                size=10,
                color=colors["text_secondary"],
                text_align=ft.TextAlign.CENTER,
            ),
            padding=ft.padding.symmetric(horizontal=8, vertical=4),
            alignment=ft.Alignment(0, 0),
        )

        # Extended device info row (battery, storage, RAM)
        extended_info = self._build_extended_info(colors)

        # Bottom action bar
        action_bar = ft.Container(
            content=ft.Row(
                [
                    ft.IconButton(
                        icon=ft.Icons.PLAY_ARROW,
                        icon_size=16,
                        icon_color=colors["success"],
                        tooltip="Run",
                        padding=4,
                    ),
                    ft.IconButton(
                        icon=ft.Icons.STOP,
                        icon_size=16,
                        icon_color=colors["error"],
                        tooltip="Stop",
                        padding=4,
                    ),
                    ft.IconButton(
                        icon=ft.Icons.REFRESH,
                        icon_size=16,
                        icon_color=colors["accent_blue"],
                        tooltip="Refresh",
                        padding=4,
                    ),
                    # Quick actions context menu
                    self._build_quick_actions_menu(colors),
                ],
                alignment=ft.MainAxisAlignment.SPACE_AROUND,
            ),
            padding=ft.padding.only(bottom=4),
        )

        # Selection checkbox
        checkbox = ft.Container(
            content=ft.Checkbox(
                value=self.selected,
                on_change=lambda e: self.on_select(self.device_id, e.control.value) if self.on_select else None,
            ),
            alignment=ft.Alignment(-1, -1),
            padding=0,
        )

        return ft.Stack(
            [
                ft.Column(
                    [
                        header,
                        device_info,
                        ft.Container(height=4),
                        preview,
                        extended_info,
                        task_widget,
                        action_bar,
                    ],
                    spacing=0,
                ),
                checkbox,
            ],
        )

    def _handle_click(self, e):
        """Handle card click."""
        if self.on_card_click:
            self.on_card_click(self.device_id)

    def _on_hover(self, e):
        """Handle hover effect."""
        colors = get_colors()
        if e.data == "true":
            self.border = ft.border.all(
                2 if self.selected else 1,
                colors["primary"]
            )
            # Subtle elevation on hover using theme shadows
            self.shadow = get_shadow("sm")
        else:
            self.border = ft.border.all(
                2 if self.selected else 1,
                colors["primary"] if self.selected else colors["border"]
            )
            # Restore appropriate shadow based on selection state
            self.shadow = get_shadow("sm") if self.selected else get_shadow("xs")
        self.update()

    def _build_quick_actions_menu(self, colors):
        """Build the quick actions popup menu.

        Args:
            colors: Theme colors dictionary

        Returns:
            PopupMenuButton with device action options
        """
        menu_items = [
            ft.PopupMenuItem(
                content=ft.Row(
                    [
                        ft.Icon(ft.Icons.INFO_OUTLINE, size=16, color=colors["text_secondary"]),
                        ft.Text("View Details", size=12, color=colors["text_primary"]),
                    ],
                    spacing=8,
                ),
                on_click=lambda e: self.on_view_details(self.device_id) if self.on_view_details else None,
            ),
            ft.PopupMenuItem(),  # Divider
            ft.PopupMenuItem(
                content=ft.Row(
                    [
                        ft.Icon(ft.Icons.SCREENSHOT_MONITOR, size=16, color=colors["accent_blue"]),
                        ft.Text("Take Screenshot", size=12, color=colors["text_primary"]),
                    ],
                    spacing=8,
                ),
                on_click=lambda e: self.on_screenshot(self.device_id) if self.on_screenshot else None,
            ),
            ft.PopupMenuItem(
                content=ft.Row(
                    [
                        ft.Icon(ft.Icons.RESTART_ALT, size=16, color=colors["warning"]),
                        ft.Text("Restart Device", size=12, color=colors["text_primary"]),
                    ],
                    spacing=8,
                ),
                on_click=lambda e: self.on_restart(self.device_id) if self.on_restart else None,
            ),
            ft.PopupMenuItem(
                content=ft.Row(
                    [
                        ft.Icon(ft.Icons.DELETE_SWEEP, size=16, color=colors["warning"]),
                        ft.Text("Clear App Data", size=12, color=colors["text_primary"]),
                    ],
                    spacing=8,
                ),
                on_click=lambda e: self.on_clear_data(self.device_id) if self.on_clear_data else None,
            ),
            ft.PopupMenuItem(),  # Divider
            ft.PopupMenuItem(
                content=ft.Row(
                    [
                        ft.Icon(ft.Icons.POWER_SETTINGS_NEW, size=16, color=colors["error"]),
                        ft.Text("Disconnect", size=12, color=colors["error"]),
                    ],
                    spacing=8,
                ),
                on_click=lambda e: self.on_disconnect(self.device_id) if self.on_disconnect else None,
            ),
        ]

        return ft.PopupMenuButton(
            icon=ft.Icons.MORE_VERT,
            icon_size=16,
            icon_color=colors["text_muted"],
            tooltip="More actions",
            items=menu_items,
            menu_position=ft.PopupMenuPosition.UNDER,
        )

    def _build_extended_info(self, colors):
        """Build extended device info row (battery, storage, RAM).

        Args:
            colors: Theme colors dictionary

        Returns:
            Container with compact info row showing battery, storage, RAM
        """
        info_items = []

        # Battery level with icon
        if self.battery_level is not None:
            battery_icon = ft.Icons.BATTERY_FULL if self.battery_level >= 80 else (
                ft.Icons.BATTERY_5_BAR if self.battery_level >= 50 else (
                    ft.Icons.BATTERY_3_BAR if self.battery_level >= 20 else ft.Icons.BATTERY_1_BAR
                )
            )
            battery_color = colors["success"] if self.battery_level >= 50 else (
                colors["warning"] if self.battery_level >= 20 else colors["error"]
            )
            info_items.append(
                ft.Container(
                    content=ft.Row(
                        [
                            ft.Icon(battery_icon, size=12, color=battery_color),
                            ft.Text(
                                f"{self.battery_level}%",
                                size=9,
                                color=colors["text_muted"],
                            ),
                        ],
                        spacing=2,
                    ),
                    tooltip=f"Battery: {self.battery_level}%",
                )
            )

        # Storage info
        if self.storage_used is not None and self.storage_total is not None:
            storage_pct = int((self.storage_used / self.storage_total) * 100) if self.storage_total > 0 else 0
            storage_color = colors["success"] if storage_pct < 70 else (
                colors["warning"] if storage_pct < 90 else colors["error"]
            )
            info_items.append(
                ft.Container(
                    content=ft.Row(
                        [
                            ft.Icon(ft.Icons.STORAGE, size=12, color=storage_color),
                            ft.Text(
                                f"{storage_pct}%",
                                size=9,
                                color=colors["text_muted"],
                            ),
                        ],
                        spacing=2,
                    ),
                    tooltip=f"Storage: {self.storage_used:.1f}GB / {self.storage_total:.1f}GB ({storage_pct}%)",
                )
            )

        # RAM usage
        if self.ram_usage is not None:
            ram_color = colors["success"] if self.ram_usage < 70 else (
                colors["warning"] if self.ram_usage < 90 else colors["error"]
            )
            info_items.append(
                ft.Container(
                    content=ft.Row(
                        [
                            ft.Icon(ft.Icons.MEMORY, size=12, color=ram_color),
                            ft.Text(
                                f"{self.ram_usage}%",
                                size=9,
                                color=colors["text_muted"],
                            ),
                        ],
                        spacing=2,
                    ),
                    tooltip=f"RAM Usage: {self.ram_usage}%",
                )
            )

        # Return empty container if no extended info available
        if not info_items:
            return ft.Container(height=0)

        return ft.Container(
            content=ft.Row(
                info_items,
                alignment=ft.MainAxisAlignment.SPACE_AROUND,
                spacing=4,
            ),
            padding=ft.padding.symmetric(horizontal=8, vertical=2),
        )


class DeviceGridToolbar(ft.Container):
    """Toolbar for device grid with action buttons and bulk operations."""

    def __init__(
        self,
        on_automate: Optional[Callable] = None,
        on_proxy: Optional[Callable] = None,
        on_change_device: Optional[Callable] = None,
        on_functions: Optional[Callable] = None,
        on_copy: Optional[Callable] = None,
        on_refresh: Optional[Callable] = None,
        # Bulk action callbacks
        on_screenshot_all: Optional[Callable] = None,
        on_restart_selected: Optional[Callable] = None,
        on_clear_data: Optional[Callable] = None,
        on_disconnect_all: Optional[Callable] = None,
        selected_count: int = 0,
    ):
        self.on_automate = on_automate
        self.on_proxy = on_proxy
        self.on_change_device = on_change_device
        self.on_functions = on_functions
        self.on_copy = on_copy
        self.on_refresh = on_refresh
        # Bulk action callbacks
        self.on_screenshot_all = on_screenshot_all
        self.on_restart_selected = on_restart_selected
        self.on_clear_data = on_clear_data
        self.on_disconnect_all = on_disconnect_all
        self._selected_count = selected_count

        colors = get_colors()
        super().__init__(
            content=self._build_content(),
            padding=ft.padding.symmetric(horizontal=16, vertical=12),
            bgcolor=colors["bg_card"],
            border=ft.border.only(bottom=ft.BorderSide(1, colors["border"])),
        )

    def _build_content(self):
        """Build toolbar content."""
        colors = get_colors()

        # Left side - Action buttons (always visible)
        left_actions = ft.Row(
            [
                self._build_action_button(
                    "Automate",
                    ft.Icons.PLAY_CIRCLE_OUTLINE,
                    colors["primary"],
                    self.on_automate,
                    primary=True,
                ),
                self._build_action_button(
                    "Proxy Data",
                    ft.Icons.VPN_KEY_OUTLINED,
                    colors["text_secondary"],
                    self.on_proxy,
                ),
                self._build_action_button(
                    "Change Device",
                    ft.Icons.SWAP_HORIZ,
                    colors["text_secondary"],
                    self.on_change_device,
                ),
                self._build_action_button(
                    "Functions",
                    ft.Icons.TUNE,
                    colors["text_secondary"],
                    self.on_functions,
                ),
                self._build_action_button(
                    "Copy",
                    ft.Icons.CONTENT_COPY,
                    colors["text_secondary"],
                    self.on_copy,
                ),
            ],
            spacing=8,
        )

        # Bulk actions (shown when devices are selected)
        bulk_actions = self._build_bulk_actions(colors) if self._selected_count > 0 else ft.Container()

        return ft.Row(
            [
                left_actions,
                ft.Container(width=16),  # Spacer
                bulk_actions,
                ft.Container(expand=True),
                # Right side - Refresh
                ft.IconButton(
                    icon=ft.Icons.REFRESH,
                    icon_color=colors["text_muted"],
                    tooltip="Refresh devices",
                    on_click=lambda e: self.on_refresh() if self.on_refresh else None,
                ),
            ],
        )

    def _build_action_button(
        self,
        label: str,
        icon: str,
        color: str,
        on_click: Optional[Callable],
        primary: bool = False,
    ):
        """Build an action button."""
        colors = get_colors()
        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(icon, size=16, color=colors["text_inverse"] if primary else color),
                    ft.Container(width=6),
                    ft.Text(
                        label,
                        size=12,
                        weight=ft.FontWeight.W_500,
                        color=colors["text_inverse"] if primary else color,
                    ),
                    ft.Icon(
                        ft.Icons.KEYBOARD_ARROW_DOWN,
                        size=14,
                        color=colors["text_inverse"] if primary else color,
                    ),
                ],
                spacing=0,
            ),
            padding=ft.padding.symmetric(horizontal=12, vertical=8),
            border_radius=RADIUS["md"],
            bgcolor=colors["primary"] if primary else "transparent",
            border=None if primary else ft.border.all(1, colors["border"]),
            on_click=lambda e: on_click() if on_click else None,
            on_hover=self._on_button_hover if not primary else self._on_primary_hover,
        )

    def _on_button_hover(self, e):
        """Handle button hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["bg_hover"]
        else:
            e.control.bgcolor = "transparent"
        e.control.update()

    def _on_primary_hover(self, e):
        """Handle primary button hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["primary_dark"]
        else:
            e.control.bgcolor = colors["primary"]
        e.control.update()

    def _build_bulk_actions(self, colors):
        """Build bulk action buttons shown when devices are selected.

        Args:
            colors: Theme colors dictionary

        Returns:
            Container with bulk action buttons and selection indicator
        """
        return ft.Container(
            content=ft.Row(
                [
                    # Selection indicator
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(ft.Icons.CHECK_CIRCLE, size=14, color=colors["primary"]),
                                ft.Text(
                                    f"{self._selected_count} selected",
                                    size=12,
                                    weight=ft.FontWeight.W_500,
                                    color=colors["primary"],
                                ),
                            ],
                            spacing=4,
                        ),
                        padding=ft.padding.symmetric(horizontal=8, vertical=4),
                        border_radius=RADIUS["sm"],
                        bgcolor=colors["primary_glow"],
                    ),
                    ft.Container(width=8),
                    # Bulk action buttons
                    self._build_bulk_button(
                        "Screenshot All",
                        ft.Icons.SCREENSHOT_MONITOR,
                        colors["accent_blue"],
                        lambda e: self.on_screenshot_all() if self.on_screenshot_all else None,
                    ),
                    self._build_bulk_button(
                        "Restart",
                        ft.Icons.RESTART_ALT,
                        colors["warning"],
                        lambda e: self.on_restart_selected() if self.on_restart_selected else None,
                    ),
                    self._build_bulk_button(
                        "Clear Data",
                        ft.Icons.DELETE_SWEEP,
                        colors["warning"],
                        lambda e: self.on_clear_data() if self.on_clear_data else None,
                    ),
                    self._build_bulk_button(
                        "Disconnect",
                        ft.Icons.POWER_SETTINGS_NEW,
                        colors["error"],
                        lambda e: self.on_disconnect_all() if self.on_disconnect_all else None,
                    ),
                ],
                spacing=6,
            ),
            padding=ft.padding.symmetric(horizontal=8, vertical=4),
            border_radius=RADIUS["md"],
            bgcolor=colors["bg_secondary"],
            border=ft.border.all(1, colors["border"]),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_bulk_button(
        self,
        label: str,
        icon: str,
        color: str,
        on_click: Optional[Callable],
    ):
        """Build a compact bulk action button.

        Args:
            label: Button text
            icon: Icon to display
            color: Icon/text color
            on_click: Click callback

        Returns:
            Container styled as a compact action button
        """
        colors = get_colors()
        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(icon, size=14, color=color),
                    ft.Text(
                        label,
                        size=11,
                        weight=ft.FontWeight.W_500,
                        color=color,
                    ),
                ],
                spacing=4,
            ),
            padding=ft.padding.symmetric(horizontal=8, vertical=4),
            border_radius=RADIUS["sm"],
            on_click=on_click,
            on_hover=self._on_bulk_button_hover,
        )

    def _on_bulk_button_hover(self, e):
        """Handle bulk button hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["bg_hover"]
        else:
            e.control.bgcolor = "transparent"
        e.control.update()

    def update_selected_count(self, count: int):
        """Update the selected device count and rebuild toolbar.

        Args:
            count: Number of selected devices
        """
        self._selected_count = count
        self.content = self._build_content()
        self.update()

    def get_selected_count(self) -> int:
        """Get current selected device count.

        Returns:
            Number of selected devices
        """
        return self._selected_count
