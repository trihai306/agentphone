"""Device Card component for grid view - Cloud device farm style."""

import flet as ft
from typing import Optional, Callable
from ..theme import get_colors, RADIUS, get_shadow


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
            alignment=ft.alignment.center,
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
                alignment=ft.alignment.center,
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
            alignment=ft.alignment.center,
        )

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
                    ft.IconButton(
                        icon=ft.Icons.MORE_VERT,
                        icon_size=16,
                        icon_color=colors["text_muted"],
                        tooltip="More",
                        padding=4,
                    ),
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
            alignment=ft.alignment.top_left,
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


class DeviceGridToolbar(ft.Container):
    """Toolbar for device grid with action buttons."""

    def __init__(
        self,
        on_automate: Optional[Callable] = None,
        on_proxy: Optional[Callable] = None,
        on_change_device: Optional[Callable] = None,
        on_functions: Optional[Callable] = None,
        on_copy: Optional[Callable] = None,
        on_refresh: Optional[Callable] = None,
    ):
        self.on_automate = on_automate
        self.on_proxy = on_proxy
        self.on_change_device = on_change_device
        self.on_functions = on_functions
        self.on_copy = on_copy
        self.on_refresh = on_refresh

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
        return ft.Row(
            [
                # Left side - Action buttons
                ft.Row(
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
                ),
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
