"""Phone Viewer view - Cloud device farm style grid management."""

import flet as ft
import asyncio
from typing import List, Dict, Set
from ..theme import COLORS, RADIUS, SPACING, SHADOWS, get_shadow, ANIMATION
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
                ft.Container(height=SPACING["lg"]),
                self._build_toolbar(),
                self._build_device_grid(),
            ],
            spacing=0,
            expand=True,
        )

    def _build_header(self):
        """Build the header section with polished styling."""
        is_mobile = self._is_mobile()
        selected_count = len(self.selected_devices)
        total_count = len(self.devices)
        online_count = len([d for d in self.devices if d.get("status") == "connected"])

        if is_mobile:
            return ft.Container(
                content=ft.Column(
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
                                # Stats badges with improved styling
                                self._build_status_badge(
                                    f"{online_count}/{total_count}",
                                    COLORS["success"],
                                    COLORS["success_glow"],
                                ),
                            ],
                        ),
                        ft.Container(height=SPACING["sm"]),
                        ft.Row(
                            [
                                self._build_right_actions(),
                            ],
                        ),
                    ],
                ),
                padding=ft.padding.only(bottom=SPACING["sm"]),
            )

        return ft.Container(
            content=ft.Row(
                [
                    ft.Column(
                        [
                            ft.Row(
                                [
                                    # Title with gradient-like effect
                                    ft.Text(
                                        "Device Farm",
                                        size=28,
                                        weight=ft.FontWeight.W_700,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Container(width=SPACING["md"]),
                                    # Online count badge with pulse indicator
                                    self._build_online_badge(online_count),
                                    ft.Container(width=SPACING["sm"]),
                                    # Selected count badge
                                    self._build_selected_badge(selected_count) if selected_count > 0 else ft.Container(),
                                ],
                            ),
                            ft.Container(height=SPACING["xs"]),
                            ft.Text(
                                "Manage and control your cloud devices",
                                size=14,
                                color=COLORS["text_secondary"],
                            ),
                        ],
                        spacing=0,
                    ),
                    ft.Container(expand=True),
                    self._build_right_actions(),
                ],
            ),
            padding=ft.padding.only(bottom=SPACING["sm"]),
        )

    def _build_status_badge(self, text: str, color: str, bg_color: str):
        """Build a polished status badge."""
        return ft.Container(
            content=ft.Text(
                text,
                size=11,
                weight=ft.FontWeight.W_600,
                color=color,
            ),
            bgcolor=bg_color,
            border_radius=RADIUS["full"],
            padding=ft.padding.symmetric(horizontal=10, vertical=4),
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_online_badge(self, online_count: int):
        """Build an enhanced online status badge with pulse indicator."""
        return ft.Container(
            content=ft.Row(
                [
                    # Animated pulse dot
                    ft.Container(
                        width=8,
                        height=8,
                        border_radius=4,
                        bgcolor=COLORS["success"],
                        shadow=ft.BoxShadow(
                            spread_radius=0,
                            blur_radius=6,
                            color=COLORS["success_glow"],
                            offset=ft.Offset(0, 0),
                        ),
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
            border_radius=RADIUS["full"],
            padding=ft.padding.symmetric(horizontal=12, vertical=5),
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_selected_badge(self, selected_count: int):
        """Build a selected count badge."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(
                        ft.Icons.CHECK_CIRCLE_OUTLINE,
                        size=14,
                        color=COLORS["accent_purple"],
                    ),
                    ft.Container(width=4),
                    ft.Text(
                        f"{selected_count} selected",
                        size=12,
                        weight=ft.FontWeight.W_500,
                        color=COLORS["accent_purple"],
                    ),
                ],
            ),
            bgcolor=f"{COLORS['accent_purple']}15",
            border_radius=RADIUS["full"],
            padding=ft.padding.symmetric(horizontal=12, vertical=5),
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_right_actions(self):
        """Build right side action buttons with polished styling."""
        return ft.Row(
            [
                # Payment button
                self._build_header_button(
                    "Payment",
                    ft.Icons.PAYMENT_OUTLINED,
                    lambda e: self.toast.info("Payment coming soon..."),
                ),
                ft.Container(width=SPACING["sm"]),
                # Docs button
                self._build_header_button(
                    "Docs",
                    ft.Icons.DESCRIPTION_OUTLINED,
                    lambda e: self.toast.info("Docs coming soon..."),
                ),
            ],
            spacing=0,
        )

    def _build_header_button(self, label: str, icon: str, on_click):
        """Build a polished header action button."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(icon, size=16, color=COLORS["text_secondary"]),
                    ft.Container(width=6),
                    ft.Text(
                        label,
                        size=12,
                        weight=ft.FontWeight.W_500,
                        color=COLORS["text_secondary"],
                    ),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=14, vertical=9),
            border_radius=RADIUS["md"],
            border=ft.border.all(1, COLORS["border"]),
            bgcolor="transparent",
            on_click=on_click,
            on_hover=self._on_button_hover,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_toolbar(self):
        """Build the toolbar section with enhanced styling."""
        is_mobile = self._is_mobile()
        all_selected = len(self.selected_devices) == len(self.devices) and len(self.devices) > 0

        if is_mobile:
            # Simplified mobile toolbar
            return ft.Container(
                content=ft.Row(
                    [
                        # Select all checkbox with label
                        ft.Row(
                            [
                                ft.Checkbox(
                                    value=all_selected,
                                    on_change=self._on_select_all,
                                    active_color=COLORS["primary"],
                                    check_color=COLORS["text_inverse"],
                                ),
                                ft.Text(
                                    f"{len(self.selected_devices)}",
                                    size=12,
                                    weight=ft.FontWeight.W_500,
                                    color=COLORS["text_secondary"],
                                ),
                            ],
                            spacing=4,
                        ),
                        ft.Container(expand=True),
                        # Action buttons
                        self._build_icon_action_button(
                            ft.Icons.PLAY_ARROW_ROUNDED,
                            COLORS["primary"],
                            "Automate",
                            self._on_automate,
                        ),
                        self._build_icon_action_button(
                            ft.Icons.REFRESH_ROUNDED,
                            COLORS["text_muted"],
                            "Refresh",
                            self._on_refresh,
                        ),
                    ],
                ),
                padding=ft.padding.symmetric(horizontal=SPACING["md"], vertical=SPACING["sm"]),
                bgcolor=COLORS["bg_card"],
                border=ft.border.only(bottom=ft.BorderSide(1, COLORS["border"])),
            )

        return ft.Container(
            content=ft.Row(
                [
                    # Left side - Select all and action buttons
                    ft.Row(
                        [
                            # Enhanced checkbox with subtle background
                            ft.Container(
                                content=ft.Checkbox(
                                    value=all_selected,
                                    on_change=self._on_select_all,
                                    active_color=COLORS["primary"],
                                    check_color=COLORS["text_inverse"],
                                ),
                                padding=ft.padding.only(right=SPACING["sm"]),
                            ),
                            # Action buttons with improved styling
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
                                ft.Icons.SWAP_HORIZ_ROUNDED,
                                self._on_change_device,
                            ),
                            self._build_toolbar_button(
                                "Functions",
                                ft.Icons.TUNE_ROUNDED,
                                self._on_functions,
                            ),
                            self._build_toolbar_button(
                                "Copy",
                                ft.Icons.CONTENT_COPY_ROUNDED,
                                self._on_copy,
                            ),
                        ],
                        spacing=SPACING["sm"],
                    ),
                    ft.Container(expand=True),
                    # Right side - Refresh with enhanced styling
                    self._build_refresh_button(),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=SPACING["lg"], vertical=SPACING["md"]),
            bgcolor=COLORS["bg_card"],
            border=ft.border.only(bottom=ft.BorderSide(1, COLORS["border"])),
        )

    def _build_icon_action_button(self, icon: str, color: str, tooltip: str, on_click):
        """Build an icon-only action button for mobile."""
        return ft.Container(
            content=ft.Icon(icon, size=20, color=color),
            padding=SPACING["sm"],
            border_radius=RADIUS["md"],
            on_click=on_click,
            on_hover=self._on_button_hover,
            tooltip=tooltip,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_toolbar_button(self, label: str, icon: str, on_click, primary: bool = False):
        """Build a polished toolbar action button with dropdown indicator."""
        text_color = COLORS["text_inverse"] if primary else COLORS["text_secondary"]
        bg_color = COLORS["primary"] if primary else "transparent"

        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(icon, size=16, color=text_color),
                    ft.Container(width=6),
                    ft.Text(
                        label,
                        size=12,
                        weight=ft.FontWeight.W_500,
                        color=text_color,
                    ),
                    ft.Container(width=2),
                    ft.Icon(
                        ft.Icons.KEYBOARD_ARROW_DOWN_ROUNDED,
                        size=16,
                        color=text_color,
                    ),
                ],
                spacing=0,
            ),
            padding=ft.padding.symmetric(horizontal=14, vertical=8),
            border_radius=RADIUS["md"],
            bgcolor=bg_color,
            border=None if primary else ft.border.all(1, COLORS["border"]),
            on_click=on_click,
            on_hover=self._on_primary_hover if primary else self._on_button_hover,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_refresh_button(self):
        """Build an enhanced refresh button."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(ft.Icons.REFRESH_ROUNDED, size=18, color=COLORS["text_secondary"]),
                    ft.Container(width=6),
                    ft.Text(
                        "Refresh",
                        size=12,
                        weight=ft.FontWeight.W_500,
                        color=COLORS["text_secondary"],
                    ),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=12, vertical=8),
            border_radius=RADIUS["md"],
            border=ft.border.all(1, COLORS["border"]),
            on_click=self._on_refresh,
            on_hover=self._on_button_hover,
            tooltip="Refresh devices",
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_device_grid(self):
        """Build the device grid section with enhanced styling."""
        if self.loading:
            return self._build_loading()

        if not self.devices:
            return self._build_empty_state()

        # Build device cards with enhanced phone frames
        cards = []
        for idx, device in enumerate(self.devices):
            serial = device.get("adb_serial", str(idx))
            cards.append(
                self._build_phone_frame(
                    device_id=str(400 + idx),
                    device=device,
                    serial=serial,
                    idx=idx,
                )
            )

        # Wrap in scrollable grid with padding
        return ft.Container(
            content=ft.Column(
                [
                    ft.Container(
                        content=ft.Row(
                            cards,
                            wrap=True,
                            spacing=SPACING["lg"],
                            run_spacing=SPACING["lg"],
                        ),
                        padding=ft.padding.all(SPACING["xl"]),
                    ),
                ],
                scroll=ft.ScrollMode.AUTO,
                expand=True,
            ),
            expand=True,
            bgcolor=COLORS["bg_primary"],
        )

    def _build_phone_frame(self, device_id: str, device: dict, serial: str, idx: int):
        """Build an enhanced phone frame with realistic styling."""
        status = device.get("status", "offline")
        status_color = COLORS["success"] if status == "connected" else COLORS["text_muted"]
        is_selected = serial in self.selected_devices
        screenshot_url = screen_service.get_cached_screenshot(serial)

        # Phone frame styling
        frame_border = ft.border.all(
            2 if is_selected else 1,
            COLORS["primary"] if is_selected else COLORS["border"]
        )

        # Header with status indicator and device ID
        header = ft.Container(
            content=ft.Row(
                [
                    # Status badge with cloud indicator
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Container(
                                    width=6,
                                    height=6,
                                    border_radius=3,
                                    bgcolor=status_color,
                                    shadow=ft.BoxShadow(
                                        spread_radius=0,
                                        blur_radius=4,
                                        color=f"{status_color}60",
                                        offset=ft.Offset(0, 0),
                                    ) if status == "connected" else None,
                                ),
                                ft.Container(width=4),
                                ft.Text(
                                    "Cloud",
                                    size=9,
                                    color=COLORS["primary"],
                                    weight=ft.FontWeight.W_600,
                                ),
                            ],
                            spacing=0,
                        ),
                        padding=ft.padding.symmetric(horizontal=8, vertical=3),
                        border_radius=RADIUS["sm"],
                        bgcolor=COLORS["primary_glow"],
                    ),
                    ft.Container(expand=True),
                    # Device ID with enhanced styling
                    ft.Text(
                        device_id[:3] if len(device_id) >= 3 else device_id,
                        size=14,
                        weight=ft.FontWeight.W_700,
                        color=COLORS["primary"],
                    ),
                ],
            ),
            padding=ft.padding.only(left=10, right=10, top=8, bottom=4),
        )

        # Device model name
        device_model = device.get("model", "Galaxy S7")
        device_info = ft.Container(
            content=ft.Text(
                device_model[:14] + "..." if len(device_model) > 14 else device_model,
                size=11,
                weight=ft.FontWeight.W_600,
                color=COLORS["primary"],
                text_align=ft.TextAlign.CENTER,
            ),
            padding=ft.padding.symmetric(horizontal=10),
            alignment=ft.alignment.center,
        )

        # Screenshot preview with phone frame aesthetic
        android_version = device.get("android_version", "?")
        preview = self._build_screenshot_preview(screenshot_url, android_version)

        # Task status with enhanced styling
        task_status = device.get("task_status", "")
        task_widget = ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        width=6,
                        height=6,
                        border_radius=3,
                        bgcolor=COLORS["success"] if task_status else COLORS["text_muted"],
                    ),
                    ft.Container(width=6),
                    ft.Text(
                        task_status or "Ready",
                        size=10,
                        color=COLORS["text_secondary"],
                        weight=ft.FontWeight.W_500,
                    ),
                ],
                alignment=ft.MainAxisAlignment.CENTER,
            ),
            padding=ft.padding.symmetric(horizontal=10, vertical=6),
            alignment=ft.alignment.center,
        )

        # Enhanced action bar with polished buttons
        action_bar = self._build_device_action_bar(serial)

        # Selection checkbox with better positioning
        checkbox = ft.Container(
            content=ft.Checkbox(
                value=is_selected,
                on_change=lambda e, did=device_id: self._on_device_select(did, e.control.value),
                active_color=COLORS["primary"],
                check_color=COLORS["text_inverse"],
            ),
            alignment=ft.alignment.top_left,
            padding=2,
        )

        # Main phone frame container
        return ft.Container(
            content=ft.Stack(
                [
                    ft.Column(
                        [
                            header,
                            device_info,
                            ft.Container(height=6),
                            preview,
                            task_widget,
                            action_bar,
                        ],
                        spacing=0,
                    ),
                    checkbox,
                ],
            ),
            width=165,
            height=290,
            border_radius=RADIUS["lg"],
            bgcolor=COLORS["bg_card"],
            border=frame_border,
            shadow=ft.BoxShadow(
                spread_radius=0,
                blur_radius=12 if is_selected else 6,
                color=f"{COLORS['primary']}25" if is_selected else "#00000010",
                offset=ft.Offset(0, 4 if is_selected else 2),
            ),
            on_click=lambda e, sid=serial: self._on_device_click(sid),
            on_hover=lambda e, sel=is_selected: self._on_card_hover(e, sel),
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_screenshot_preview(self, screenshot_url: str, android_version: str):
        """Build an enhanced screenshot preview with phone frame aesthetic."""
        if screenshot_url:
            content = ft.Image(
                src=screenshot_url,
                fit=ft.ImageFit.CONTAIN,
            )
        else:
            # Enhanced placeholder with phone outline
            content = ft.Column(
                [
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.PHONE_ANDROID_ROUNDED,
                            size=36,
                            color=COLORS["text_muted"],
                        ),
                        width=60,
                        height=60,
                        border_radius=RADIUS["md"],
                        bgcolor=COLORS["bg_hover"],
                        alignment=ft.alignment.center,
                    ),
                    ft.Container(height=8),
                    ft.Text(
                        f"Android {android_version}",
                        size=10,
                        color=COLORS["text_muted"],
                        weight=ft.FontWeight.W_500,
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                alignment=ft.MainAxisAlignment.CENTER,
                spacing=0,
            )

        return ft.Container(
            content=content,
            height=145,
            bgcolor=COLORS["bg_tertiary"],
            border_radius=RADIUS["md"],
            margin=ft.margin.symmetric(horizontal=10),
            alignment=ft.alignment.center,
            border=ft.border.all(1, COLORS["border_subtle"]),
        )

    def _build_device_action_bar(self, serial: str):
        """Build an enhanced action bar for device cards."""
        return ft.Container(
            content=ft.Row(
                [
                    self._build_action_icon(
                        ft.Icons.PLAY_ARROW_ROUNDED,
                        COLORS["success"],
                        "Run",
                        lambda e: self.toast.info(f"Running {serial}..."),
                    ),
                    self._build_action_icon(
                        ft.Icons.STOP_ROUNDED,
                        COLORS["error"],
                        "Stop",
                        lambda e: self.toast.info(f"Stopping {serial}..."),
                    ),
                    self._build_action_icon(
                        ft.Icons.REFRESH_ROUNDED,
                        COLORS["info"],
                        "Refresh",
                        lambda e: self.toast.info(f"Refreshing {serial}..."),
                    ),
                    self._build_action_icon(
                        ft.Icons.MORE_VERT_ROUNDED,
                        COLORS["text_muted"],
                        "More",
                        lambda e: self.toast.info("More options..."),
                    ),
                ],
                alignment=ft.MainAxisAlignment.SPACE_AROUND,
            ),
            padding=ft.padding.only(bottom=6, top=2),
        )

    def _build_action_icon(self, icon: str, color: str, tooltip: str, on_click):
        """Build an enhanced action icon button."""
        return ft.Container(
            content=ft.Icon(icon, size=18, color=color),
            width=32,
            height=32,
            border_radius=RADIUS["sm"],
            alignment=ft.alignment.center,
            on_click=on_click,
            on_hover=self._on_action_icon_hover,
            tooltip=tooltip,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_empty_state(self):
        """Build an enhanced empty state with polished styling."""
        return ft.Container(
            content=ft.Column(
                [
                    # Icon container with subtle background
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.PHONE_ANDROID_ROUNDED,
                            size=56,
                            color=COLORS["text_muted"],
                        ),
                        width=100,
                        height=100,
                        border_radius=RADIUS["xl"],
                        bgcolor=COLORS["bg_tertiary"],
                        alignment=ft.alignment.center,
                        border=ft.border.all(1, COLORS["border"]),
                    ),
                    ft.Container(height=SPACING["xl"]),
                    ft.Text(
                        "No Devices Connected",
                        size=20,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["text_primary"],
                    ),
                    ft.Container(height=SPACING["sm"]),
                    ft.Text(
                        "Connect Android devices via USB or WiFi ADB",
                        size=14,
                        color=COLORS["text_secondary"],
                    ),
                    ft.Container(height=SPACING["xxl"]),
                    # Enhanced scan button
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(
                                    ft.Icons.RADAR_ROUNDED,
                                    size=18,
                                    color=COLORS["text_inverse"],
                                ),
                                ft.Container(width=8),
                                ft.Text(
                                    "Scan for Devices",
                                    size=14,
                                    weight=ft.FontWeight.W_600,
                                    color=COLORS["text_inverse"],
                                ),
                            ],
                            alignment=ft.MainAxisAlignment.CENTER,
                        ),
                        padding=ft.padding.symmetric(horizontal=24, vertical=14),
                        border_radius=RADIUS["md"],
                        bgcolor=COLORS["primary"],
                        on_click=self._on_refresh,
                        on_hover=self._on_primary_hover,
                        shadow=get_shadow("sm"),
                        animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=SPACING["xxxl"],
            alignment=ft.alignment.center,
            expand=True,
        )

    def _build_loading(self):
        """Build enhanced loading state with polished animation."""
        return ft.Container(
            content=ft.Column(
                [
                    # Loading spinner with glow effect
                    ft.Container(
                        content=ft.ProgressRing(
                            width=48,
                            height=48,
                            stroke_width=4,
                            color=COLORS["primary"],
                        ),
                        width=80,
                        height=80,
                        border_radius=RADIUS["xl"],
                        bgcolor=COLORS["bg_tertiary"],
                        alignment=ft.alignment.center,
                        shadow=ft.BoxShadow(
                            spread_radius=0,
                            blur_radius=20,
                            color=COLORS["primary_glow"],
                            offset=ft.Offset(0, 0),
                        ),
                    ),
                    ft.Container(height=SPACING["xl"]),
                    ft.Text(
                        "Scanning devices...",
                        size=16,
                        weight=ft.FontWeight.W_500,
                        color=COLORS["text_primary"],
                    ),
                    ft.Container(height=SPACING["sm"]),
                    ft.Text(
                        "This may take a moment",
                        size=13,
                        color=COLORS["text_muted"],
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=SPACING["xxxl"],
            alignment=ft.alignment.center,
            expand=True,
        )

    # Event handlers
    def _on_button_hover(self, e):
        """Handle button hover with smooth transition."""
        if e.data == "true":
            e.control.bgcolor = COLORS["bg_hover"]
            e.control.border = ft.border.all(1, COLORS["border_hover"])
        else:
            e.control.bgcolor = "transparent"
            e.control.border = ft.border.all(1, COLORS["border"])
        e.control.update()

    def _on_primary_hover(self, e):
        """Handle primary button hover."""
        if e.data == "true":
            e.control.bgcolor = COLORS["primary_dark"]
        else:
            e.control.bgcolor = COLORS["primary"]
        e.control.update()

    def _on_action_icon_hover(self, e):
        """Handle action icon hover."""
        if e.data == "true":
            e.control.bgcolor = COLORS["bg_hover"]
        else:
            e.control.bgcolor = "transparent"
        e.control.update()

    def _on_card_hover(self, e, is_selected: bool):
        """Handle device card hover with enhanced effect."""
        if e.data == "true":
            e.control.border = ft.border.all(
                2 if is_selected else 1,
                COLORS["primary"]
            )
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=16,
                color=f"{COLORS['primary']}30",
                offset=ft.Offset(0, 6),
            )
        else:
            e.control.border = ft.border.all(
                2 if is_selected else 1,
                COLORS["primary"] if is_selected else COLORS["border"]
            )
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=12 if is_selected else 6,
                color=f"{COLORS['primary']}25" if is_selected else "#00000010",
                offset=ft.Offset(0, 4 if is_selected else 2),
            )
        e.control.update()

    def _on_device_click(self, device_id: str):
        """Handle device card click."""
        self.toast.info(f"Opening device {device_id}...")

    def _on_device_select(self, device_id: str, selected: bool):
        """Handle device selection."""
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
