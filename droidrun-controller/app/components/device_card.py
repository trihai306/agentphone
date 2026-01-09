"""Device Card component for grid view - Premium Cloud Device Farm Style.

Modern glassmorphism design with smart status indicators and beautiful animations.
"""

import flet as ft
from typing import Optional, Callable
from ..theme import get_colors, RADIUS, get_shadow, SPACING, ANIMATION


class DeviceCard(ft.Container):
    """Premium device card with glassmorphism design and smart status indicators."""

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
        is_online = status == "connected"
        
        super().__init__(
            content=self._build_content(),
            width=280,  # Much larger width
            height=420,  # Much taller for professional look
            border_radius=RADIUS["xl"],
            bgcolor=colors["bg_card"],
            border=ft.border.all(
                2 if selected else 1,
                colors["primary"] if selected else (f"{colors['success']}60" if is_online else colors["border"])
            ),
            on_click=self._handle_click,
            on_hover=self._on_hover,
            shadow=get_shadow("lg") if selected else get_shadow("md"),
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            animate_scale=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_content(self):
        """Build the premium card content with larger, professional layout."""
        colors = get_colors()
        is_online = self.status == "connected"
        
        # Status indicator colors
        status_color = colors["success"] if is_online else colors["text_muted"]
        status_glow = f"{colors['success']}20" if is_online else "transparent"
        
        # ============ Header Section ============
        header = ft.Container(
            content=ft.Row(
                [
                    # Cloud badge
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(ft.Icons.CLOUD_DONE_ROUNDED if is_online else ft.Icons.CLOUD_OFF_ROUNDED, size=14, color=colors["primary"]),
                                ft.Container(width=4),
                                ft.Text("Cloud", size=11, weight=ft.FontWeight.W_600, color=colors["primary"]),
                            ],
                        ),
                        padding=ft.padding.symmetric(horizontal=10, vertical=5),
                        border_radius=RADIUS["full"],
                        bgcolor=colors["primary_glow"],
                    ),
                    ft.Container(expand=True),
                    # Device ID
                    ft.Text(
                        self.device_id[:8] if len(self.device_id) >= 8 else self.device_id,
                        size=12,
                        weight=ft.FontWeight.W_600,
                        color=colors["warning"],
                    ),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=16, vertical=12),
        )
        
        # ============ Device Name ============
        device_name_section = ft.Container(
            content=ft.Text(
                self.device_model if len(self.device_model) <= 24 else self.device_model[:24] + "...",
                size=14,
                weight=ft.FontWeight.W_700,
                color=colors["text_primary"],
                text_align=ft.TextAlign.CENTER,
            ),
            padding=ft.padding.symmetric(horizontal=16),
            alignment=ft.Alignment(0, 0),
        )

        # ============ Large Phone Frame ============
        if self.screenshot_url:
            screen_content = ft.Image(
                src=self.screenshot_url,
                fit=ft.ImageFit.COVER,
            )
        else:
            # Placeholder screen
            screen_content = ft.Container(
                content=ft.Column(
                    [
                        ft.Container(
                            content=ft.Icon(
                                ft.Icons.SMARTPHONE_ROUNDED,
                                size=48,
                                color=colors["primary"] if is_online else colors["text_muted"],
                            ),
                            width=80,
                            height=80,
                            border_radius=20,
                            bgcolor=f"{colors['primary']}10" if is_online else colors["bg_tertiary"],
                            alignment=ft.Alignment(0, 0),
                        ),
                        ft.Container(height=12),
                        ft.Container(
                            content=ft.Row(
                                [
                                    ft.Icon(ft.Icons.ANDROID, size=16, color=colors["success"]),
                                    ft.Container(width=6),
                                    ft.Text(
                                        f"Android {self.android_version}",
                                        size=13,
                                        weight=ft.FontWeight.W_600,
                                        color=colors["text_secondary"],
                                    ),
                                ],
                                alignment=ft.MainAxisAlignment.CENTER,
                            ),
                            padding=ft.padding.symmetric(horizontal=12, vertical=6),
                            border_radius=RADIUS["full"],
                            bgcolor=f"{colors['success']}10",
                        ),
                    ],
                    horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                    alignment=ft.MainAxisAlignment.CENTER,
                ),
                expand=True,
            )

        # Phone notch
        phone_notch = ft.Container(
            content=ft.Row(
                [
                    ft.Container(width=32, height=4, border_radius=2, bgcolor=colors["text_muted"]),
                    ft.Container(width=6),
                    ft.Container(width=8, height=8, border_radius=4, bgcolor=colors["text_muted"]),
                ],
                alignment=ft.MainAxisAlignment.CENTER,
            ),
            height=16,
            bgcolor="#1a1a1a",
            border_radius=ft.border_radius.only(bottom_left=8, bottom_right=8),
        )

        # Screen area
        screen_area = ft.Container(
            content=ft.Stack(
                [
                    ft.Container(content=screen_content, expand=True, bgcolor="#0d0d0d"),
                    ft.Container(content=phone_notch, alignment=ft.Alignment(0, -1)),
                ],
                expand=True,
            ),
            height=180,  # Much larger screen
            border_radius=12,
            bgcolor="#0d0d0d",
            clip_behavior=ft.ClipBehavior.ANTI_ALIAS,
        )

        # Phone frame with bezels
        phone_frame = ft.Container(
            content=ft.Column(
                [
                    ft.Container(height=6),  # Top bezel
                    screen_area,
                    ft.Container(height=6),  # Bottom bezel
                ],
                spacing=0,
            ),
            margin=ft.margin.symmetric(horizontal=16),
            padding=ft.padding.symmetric(horizontal=6),
            border_radius=RADIUS["xl"],
            bgcolor="#1a1a1a",
            border=ft.border.all(3, "#2a2a2a"),
            shadow=ft.BoxShadow(
                spread_radius=0,
                blur_radius=16,
                color=f"{colors['shadow']}40",
                offset=ft.Offset(0, 4),
            ),
        )

        # ============ Status & Stats Section ============
        stats_section = ft.Container(
            content=ft.Row(
                [
                    # Status indicator
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Container(
                                    width=10,
                                    height=10,
                                    border_radius=5,
                                    bgcolor=status_color,
                                ),
                                ft.Container(width=8),
                                ft.Text(
                                    "Ready" if is_online else "Offline",
                                    size=12,
                                    weight=ft.FontWeight.W_600,
                                    color=status_color,
                                ),
                            ],
                        ),
                    ),
                    ft.Container(expand=True),
                    # Battery (if available)
                    self._build_stat_badge(
                        ft.Icons.BATTERY_FULL_ROUNDED if self.battery_level and self.battery_level >= 50 else ft.Icons.BATTERY_3_BAR_ROUNDED,
                        f"{self.battery_level}%" if self.battery_level else "--",
                        colors["success"] if self.battery_level and self.battery_level >= 50 else colors["warning"],
                        colors,
                    ) if self.battery_level else ft.Container(),
                    ft.Container(width=8),
                    # RAM (if available)
                    self._build_stat_badge(
                        ft.Icons.MEMORY_ROUNDED,
                        f"{self.ram_usage}%" if self.ram_usage else "--",
                        colors["accent_blue"],
                        colors,
                    ) if self.ram_usage else ft.Container(),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=16, vertical=10),
        )

        # ============ Action Buttons ============
        action_bar = ft.Container(
            content=ft.Row(
                [
                    # Play button
                    self._build_action_btn(
                        ft.Icons.PLAY_ARROW_ROUNDED,
                        colors["success"],
                        "Run",
                        lambda e: self.on_view_details(self.device_id) if self.on_view_details else None,
                        colors,
                        large=True,
                    ),
                    ft.Container(expand=True),
                    # Screenshot
                    self._build_action_btn(
                        ft.Icons.SCREENSHOT_MONITOR_ROUNDED,
                        colors["accent_blue"],
                        "Screenshot",
                        lambda e: self.on_screenshot(self.device_id) if self.on_screenshot else None,
                        colors,
                    ),
                    ft.Container(width=8),
                    # Restart
                    self._build_action_btn(
                        ft.Icons.REFRESH_ROUNDED,
                        colors["warning"],
                        "Restart",
                        lambda e: self.on_restart(self.device_id) if self.on_restart else None,
                        colors,
                    ),
                    ft.Container(width=8),
                    # More menu
                    self._build_quick_actions_menu(colors),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=16, vertical=12),
            bgcolor=f"{colors['bg_secondary']}80",
            border_radius=ft.border_radius.only(
                bottom_left=RADIUS["xl"],
                bottom_right=RADIUS["xl"],
            ),
        )

        return ft.Column(
            [
                header,
                device_name_section,
                ft.Container(height=8),
                phone_frame,
                ft.Container(height=8),
                stats_section,
                ft.Container(expand=True),
                action_bar,
            ],
            spacing=0,
        )

    def _build_stat_badge(self, icon, value, color, colors):
        """Build a stat badge with icon and value."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(icon, size=14, color=color),
                    ft.Container(width=4),
                    ft.Text(value, size=11, weight=ft.FontWeight.W_600, color=colors["text_secondary"]),
                ],
                spacing=0,
            ),
            padding=ft.padding.symmetric(horizontal=8, vertical=4),
            border_radius=RADIUS["md"],
            bgcolor=f"{color}10",
        )

    def _build_action_btn(self, icon, color, tooltip, on_click, colors, large=False):
        """Build an action button."""
        size = 40 if large else 32
        icon_size = 22 if large else 16
        return ft.Container(
            content=ft.Icon(icon, size=icon_size, color=color),
            width=size,
            height=size,
            border_radius=RADIUS["lg"] if large else RADIUS["md"],
            bgcolor=f"{color}15",
            alignment=ft.Alignment(0, 0),
            tooltip=tooltip,
            on_click=on_click,
            on_hover=lambda e, c=color: self._on_action_hover(e, c),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_action_icon(self, icon, color, tooltip, on_click):
        """Build a sleek action icon button."""
        colors = get_colors()
        return ft.Container(
            content=ft.Icon(icon, size=18, color=color),
            width=32,
            height=32,
            border_radius=RADIUS["md"],
            bgcolor=f"{color}10",
            alignment=ft.Alignment(0, 0),
            tooltip=tooltip,
            on_click=on_click,
            on_hover=lambda e, c=color: self._on_action_hover(e, c),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

    def _on_action_hover(self, e, color):
        """Handle action button hover."""
        if e.data == "true":
            e.control.bgcolor = f"{color}20"
            e.control.scale = 1.1
        else:
            e.control.bgcolor = f"{color}10"
            e.control.scale = 1.0
        e.control.update()

    def _build_stats_row(self, colors):
        """Build compact stats row with battery, storage, RAM."""
        stats = []
        
        # Battery
        if self.battery_level is not None:
            battery_color = colors["success"] if self.battery_level >= 50 else (
                colors["warning"] if self.battery_level >= 20 else colors["error"]
            )
            stats.append(self._build_stat_item(
                ft.Icons.BATTERY_FULL_ROUNDED if self.battery_level >= 80 else ft.Icons.BATTERY_3_BAR_ROUNDED,
                f"{self.battery_level}%",
                battery_color,
                colors,
            ))
        
        # Storage
        if self.storage_used is not None and self.storage_total is not None:
            storage_pct = int((self.storage_used / self.storage_total) * 100) if self.storage_total > 0 else 0
            storage_color = colors["success"] if storage_pct < 70 else (
                colors["warning"] if storage_pct < 90 else colors["error"]
            )
            stats.append(self._build_stat_item(
                ft.Icons.STORAGE_ROUNDED,
                f"{storage_pct}%",
                storage_color,
                colors,
            ))
        
        # RAM
        if self.ram_usage is not None:
            ram_color = colors["success"] if self.ram_usage < 70 else (
                colors["warning"] if self.ram_usage < 90 else colors["error"]
            )
            stats.append(self._build_stat_item(
                ft.Icons.MEMORY_ROUNDED,
                f"{self.ram_usage}%",
                ram_color,
                colors,
            ))
        
        if not stats:
            return ft.Container(height=0)
        
        return ft.Container(
            content=ft.Row(
                stats,
                alignment=ft.MainAxisAlignment.CENTER,
                spacing=12,
            ),
            padding=ft.padding.symmetric(vertical=4),
        )

    def _build_stat_item(self, icon, value, color, colors):
        """Build a single stat item."""
        return ft.Row(
            [
                ft.Icon(icon, size=12, color=color),
                ft.Text(value, size=9, color=colors["text_muted"], weight=ft.FontWeight.W_500),
            ],
            spacing=3,
        )

    def _handle_click(self, e):
        """Handle card click."""
        if self.on_card_click:
            self.on_card_click(self.device_id)

    def _on_hover(self, e):
        """Handle hover effect with subtle animation."""
        colors = get_colors()
        is_online = self.status == "connected"
        
        if e.data == "true":
            self.border = ft.border.all(2, colors["primary"])
            self.shadow = get_shadow("lg")
            self.scale = 1.02
        else:
            self.border = ft.border.all(
                2 if self.selected else 1,
                colors["primary"] if self.selected else (f"{colors['success']}40" if is_online else colors["border"])
            )
            self.shadow = get_shadow("md") if self.selected else get_shadow("sm")
            self.scale = 1.0
        self.update()

    def _build_quick_actions_menu(self, colors):
        """Build the quick actions popup menu."""
        menu_items = [
            ft.PopupMenuItem(
                content=ft.Row(
                    [
                        ft.Icon(ft.Icons.INFO_OUTLINE_ROUNDED, size=16, color=colors["text_secondary"]),
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
                        ft.Icon(ft.Icons.DELETE_SWEEP_ROUNDED, size=16, color=colors["warning"]),
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
                        ft.Icon(ft.Icons.POWER_SETTINGS_NEW_ROUNDED, size=16, color=colors["error"]),
                        ft.Text("Disconnect", size=12, color=colors["error"]),
                    ],
                    spacing=8,
                ),
                on_click=lambda e: self.on_disconnect(self.device_id) if self.on_disconnect else None,
            ),
        ]

        return ft.PopupMenuButton(
            icon=ft.Icons.MORE_VERT_ROUNDED,
            icon_size=18,
            icon_color=colors["text_muted"],
            tooltip="More actions",
            items=menu_items,
            menu_position=ft.PopupMenuPosition.UNDER,
        )


class DeviceGridToolbar(ft.Container):
    """Premium toolbar for device grid with action buttons and bulk operations."""

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
        self.on_screenshot_all = on_screenshot_all
        self.on_restart_selected = on_restart_selected
        self.on_clear_data = on_clear_data
        self.on_disconnect_all = on_disconnect_all
        self._selected_count = selected_count

        colors = get_colors()
        super().__init__(
            content=self._build_content(),
            padding=ft.padding.symmetric(horizontal=20, vertical=14),
            bgcolor=colors["bg_card"],
            border=ft.border.only(bottom=ft.BorderSide(1, colors["border"])),
        )

    def _build_content(self):
        """Build toolbar content."""
        colors = get_colors()

        left_actions = ft.Row(
            [
                self._build_action_button(
                    "Automate",
                    ft.Icons.PLAY_CIRCLE_ROUNDED,
                    colors["primary"],
                    self.on_automate,
                    primary=True,
                ),
                self._build_action_button(
                    "Proxy Data",
                    ft.Icons.VPN_KEY_ROUNDED,
                    colors["text_secondary"],
                    self.on_proxy,
                ),
                self._build_action_button(
                    "Change Device",
                    ft.Icons.SWAP_HORIZ_ROUNDED,
                    colors["text_secondary"],
                    self.on_change_device,
                ),
                self._build_action_button(
                    "Functions",
                    ft.Icons.TUNE_ROUNDED,
                    colors["text_secondary"],
                    self.on_functions,
                ),
                self._build_action_button(
                    "Copy",
                    ft.Icons.CONTENT_COPY_ROUNDED,
                    colors["text_secondary"],
                    self.on_copy,
                ),
            ],
            spacing=10,
        )

        bulk_actions = self._build_bulk_actions(colors) if self._selected_count > 0 else ft.Container()

        return ft.Row(
            [
                left_actions,
                ft.Container(width=20),
                bulk_actions,
                ft.Container(expand=True),
                # Refresh button with animation
                ft.Container(
                    content=ft.Row(
                        [
                            ft.Icon(ft.Icons.REFRESH_ROUNDED, size=16, color=colors["text_secondary"]),
                            ft.Container(width=6),
                            ft.Text("Refresh", size=12, color=colors["text_secondary"], weight=ft.FontWeight.W_500),
                        ],
                    ),
                    padding=ft.padding.symmetric(horizontal=14, vertical=8),
                    border_radius=RADIUS["md"],
                    border=ft.border.all(1, colors["border"]),
                    on_click=lambda e: self.on_refresh() if self.on_refresh else None,
                    on_hover=self._on_button_hover,
                    animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
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
        """Build an action button with premium styling."""
        colors = get_colors()
        text_color = colors["text_inverse"] if primary else color
        bg_color = colors["primary"] if primary else "transparent"
        
        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(icon, size=16, color=text_color),
                    ft.Container(width=6),
                    ft.Text(
                        label,
                        size=12,
                        weight=ft.FontWeight.W_600 if primary else ft.FontWeight.W_500,
                        color=text_color,
                    ),
                    ft.Icon(ft.Icons.KEYBOARD_ARROW_DOWN_ROUNDED, size=14, color=text_color),
                ],
                spacing=0,
            ),
            padding=ft.padding.symmetric(horizontal=14, vertical=10),
            border_radius=RADIUS["md"],
            bgcolor=bg_color,
            border=None if primary else ft.border.all(1, colors["border"]),
            on_click=lambda e: on_click() if on_click else None,
            on_hover=self._on_primary_hover if primary else self._on_button_hover,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            shadow=get_shadow("xs") if primary else None,
        )

    def _on_button_hover(self, e):
        """Handle button hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["bg_hover"]
            e.control.border = ft.border.all(1, colors["border_light"])
        else:
            e.control.bgcolor = "transparent"
            e.control.border = ft.border.all(1, colors["border"])
        e.control.update()

    def _on_primary_hover(self, e):
        """Handle primary button hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["primary_dark"]
            e.control.scale = 1.02
        else:
            e.control.bgcolor = colors["primary"]
            e.control.scale = 1.0
        e.control.update()

    def _build_bulk_actions(self, colors):
        """Build bulk action buttons shown when devices are selected."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(ft.Icons.CHECK_CIRCLE_ROUNDED, size=14, color=colors["primary"]),
                                ft.Text(
                                    f"{self._selected_count} selected",
                                    size=12,
                                    weight=ft.FontWeight.W_600,
                                    color=colors["primary"],
                                ),
                            ],
                            spacing=6,
                        ),
                        padding=ft.padding.symmetric(horizontal=10, vertical=5),
                        border_radius=RADIUS["md"],
                        bgcolor=colors["primary_glow"],
                    ),
                    ft.Container(width=10),
                    self._build_bulk_button("Screenshot", ft.Icons.SCREENSHOT_MONITOR_ROUNDED, colors["accent_blue"], 
                        lambda e: self.on_screenshot_all() if self.on_screenshot_all else None),
                    self._build_bulk_button("Restart", ft.Icons.RESTART_ALT_ROUNDED, colors["warning"],
                        lambda e: self.on_restart_selected() if self.on_restart_selected else None),
                    self._build_bulk_button("Clear", ft.Icons.DELETE_SWEEP_ROUNDED, colors["warning"],
                        lambda e: self.on_clear_data() if self.on_clear_data else None),
                    self._build_bulk_button("Disconnect", ft.Icons.POWER_SETTINGS_NEW_ROUNDED, colors["error"],
                        lambda e: self.on_disconnect_all() if self.on_disconnect_all else None),
                ],
                spacing=8,
            ),
            padding=ft.padding.symmetric(horizontal=12, vertical=6),
            border_radius=RADIUS["lg"],
            bgcolor=colors["bg_secondary"],
            border=ft.border.all(1, colors["border"]),
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_bulk_button(self, label: str, icon: str, color: str, on_click: Optional[Callable]):
        """Build a compact bulk action button."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(icon, size=14, color=color),
                    ft.Text(label, size=11, weight=ft.FontWeight.W_600, color=color),
                ],
                spacing=4,
            ),
            padding=ft.padding.symmetric(horizontal=10, vertical=6),
            border_radius=RADIUS["md"],
            on_click=on_click,
            on_hover=lambda e: self._on_bulk_hover(e, color),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

    def _on_bulk_hover(self, e, color):
        """Handle bulk button hover."""
        if e.data == "true":
            e.control.bgcolor = f"{color}15"
        else:
            e.control.bgcolor = "transparent"
        e.control.update()

    def update_selected_count(self, count: int):
        """Update the selected device count and rebuild toolbar."""
        self._selected_count = count
        self.content = self._build_content()
        if self.page:
            self.update()

    def get_selected_count(self) -> int:
        """Get current selected device count."""
        return self._selected_count


class LiveDeviceCard(ft.Container):
    """Device card with live screen streaming via auto-refresh screenshots.
    
    Features:
    - Auto-refresh screenshot every 2 seconds for live view effect
    - Live indicator with pulse animation
    - Play/Pause streaming controls
    - Full phone frame mockup design
    """
    
    def __init__(
        self,
        device_serial: str,
        device_name: str,
        device_model: str = "Unknown",
        status: str = "offline",
        android_version: str = "?",
        on_click: Optional[Callable] = None,
        on_select: Optional[Callable] = None,
        selected: bool = False,
        screen_service = None,  # Pass screen_service instance
        refresh_interval: float = 2.0,  # Seconds between screenshot updates
    ):
        self.device_serial = device_serial
        self.device_name = device_name
        self.device_model = device_model
        self.status = status
        self.android_version = android_version
        self.on_card_click = on_click
        self.on_select = on_select
        self.selected = selected
        self.screen_service = screen_service
        self.refresh_interval = refresh_interval
        
        # Streaming state
        self._is_streaming = False
        self._screenshot_path: Optional[str] = None
        self._image_control: Optional[ft.Image] = None
        
        colors = get_colors()
        is_online = status == "connected"
        
        super().__init__(
            content=self._build_content(),
            width=200,
            height=320,
            border_radius=RADIUS["xl"],
            bgcolor=colors["bg_card"],
            border=ft.border.all(
                2 if selected else 1,
                colors["primary"] if selected else (f"{colors['success']}40" if is_online else colors["border"])
            ),
            on_click=self._handle_click,
            on_hover=self._on_hover,
            shadow=get_shadow("md") if selected else get_shadow("sm"),
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_content(self):
        """Build the live card content."""
        colors = get_colors()
        is_online = self.status == "connected"
        
        # ============ Header with Live Badge ============
        header = ft.Container(
            content=ft.Row(
                [
                    # Live streaming indicator
                    ft.Container(
                        content=ft.Row(
                            [
                                # Pulse dot
                                ft.Container(
                                    width=8,
                                    height=8,
                                    border_radius=4,
                                    bgcolor=colors["error"] if self._is_streaming else colors["text_muted"],
                                ),
                                ft.Container(width=6),
                                ft.Text(
                                    "LIVE" if self._is_streaming else "PAUSED",
                                    size=9,
                                    weight=ft.FontWeight.W_700,
                                    color=colors["error"] if self._is_streaming else colors["text_muted"],
                                ),
                            ],
                            spacing=0,
                        ),
                        padding=ft.padding.symmetric(horizontal=8, vertical=4),
                        border_radius=RADIUS["full"],
                        bgcolor=f"{colors['error']}15" if self._is_streaming else colors["bg_tertiary"],
                    ),
                    ft.Container(expand=True),
                    # Online/Offline status
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Container(
                                    width=6,
                                    height=6,
                                    border_radius=3,
                                    bgcolor=colors["success"] if is_online else colors["text_muted"],
                                ),
                                ft.Container(width=4),
                                ft.Text(
                                    "Online" if is_online else "Offline",
                                    size=9,
                                    color=colors["success"] if is_online else colors["text_muted"],
                                ),
                            ],
                        ),
                        padding=ft.padding.symmetric(horizontal=6, vertical=3),
                        border_radius=RADIUS["full"],
                        bgcolor=f"{colors['success']}10" if is_online else colors["bg_tertiary"],
                    ),
                    # Selection checkbox
                    ft.Checkbox(
                        value=self.selected,
                        on_change=lambda e: self.on_select(self.device_serial, e.control.value) if self.on_select else None,
                        active_color=colors["primary"],
                        check_color=colors["text_inverse"],
                    ),
                ],
            ),
            padding=ft.padding.only(left=10, right=2, top=6),
        )

        # ============ Phone Screen Area (Live View) ============
        if self._screenshot_path:
            self._image_control = ft.Image(
                src=self._screenshot_path,
                fit=ft.ImageFit.CONTAIN,
            )
            screen_content = self._image_control
        else:
            # Placeholder
            screen_content = ft.Container(
                content=ft.Column(
                    [
                        ft.Icon(
                            ft.Icons.VIDEOCAM_ROUNDED if is_online else ft.Icons.VIDEOCAM_OFF_ROUNDED,
                            size=32,
                            color=colors["primary"] if is_online else colors["text_muted"],
                        ),
                        ft.Container(height=8),
                        ft.Text(
                            "Tap to stream" if is_online else "Device offline",
                            size=10,
                            color=colors["text_secondary"],
                            text_align=ft.TextAlign.CENTER,
                        ),
                    ],
                    horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                    alignment=ft.MainAxisAlignment.CENTER,
                ),
                expand=True,
            )

        # Phone frame with screen
        phone_frame = ft.Container(
            content=ft.Container(
                content=screen_content,
                bgcolor=colors["bg_tertiary"],
                border_radius=8,
                expand=True,
                clip_behavior=ft.ClipBehavior.ANTI_ALIAS,
            ),
            height=150,
            margin=ft.margin.symmetric(horizontal=10),
            padding=6,
            border_radius=RADIUS["lg"],
            bgcolor=colors["bg_secondary"],
            border=ft.border.all(2, colors["border"]),
            shadow=ft.BoxShadow(
                spread_radius=0,
                blur_radius=6,
                color=f"{colors['shadow']}20",
                offset=ft.Offset(0, 2),
            ),
        )

        # ============ Device Info ============
        device_info = ft.Container(
            content=ft.Column(
                [
                    ft.Text(
                        self.device_model[:18] + "..." if len(self.device_model) > 18 else self.device_model,
                        size=12,
                        weight=ft.FontWeight.W_700,
                        color=colors["text_primary"],
                        text_align=ft.TextAlign.CENTER,
                    ),
                    ft.Container(height=2),
                    ft.Row(
                        [
                            ft.Container(
                                content=ft.Row(
                                    [
                                        ft.Icon(ft.Icons.ANDROID, size=10, color=colors["success"]),
                                        ft.Container(width=3),
                                        ft.Text(f"{self.android_version}", size=9, color=colors["text_secondary"]),
                                    ],
                                ),
                                padding=ft.padding.symmetric(horizontal=6, vertical=2),
                                border_radius=RADIUS["sm"],
                                bgcolor=f"{colors['success']}10",
                            ),
                            ft.Container(
                                content=ft.Text(
                                    f"#{self.device_serial[:6]}",
                                    size=9,
                                    color=colors["primary"],
                                ),
                                padding=ft.padding.symmetric(horizontal=6, vertical=2),
                                border_radius=RADIUS["sm"],
                                bgcolor=colors["primary_glow"],
                            ),
                        ],
                        alignment=ft.MainAxisAlignment.CENTER,
                        spacing=6,
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                spacing=0,
            ),
            padding=ft.padding.symmetric(horizontal=10, vertical=6),
        )

        # ============ Stream Controls ============
        stream_controls = ft.Container(
            content=ft.Row(
                [
                    # Play/Pause button
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.PAUSE_ROUNDED if self._is_streaming else ft.Icons.PLAY_ARROW_ROUNDED,
                            size=20,
                            color=colors["text_inverse"],
                        ),
                        width=36,
                        height=36,
                        border_radius=RADIUS["lg"],
                        bgcolor=colors["primary"],
                        alignment=ft.Alignment(0, 0),
                        on_click=self._toggle_streaming,
                        tooltip="Pause" if self._is_streaming else "Start streaming",
                    ),
                    # Screenshot button
                    ft.Container(
                        content=ft.Icon(ft.Icons.SCREENSHOT_MONITOR_ROUNDED, size=18, color=colors["accent_blue"]),
                        width=32,
                        height=32,
                        border_radius=RADIUS["md"],
                        bgcolor=f"{colors['accent_blue']}15",
                        alignment=ft.Alignment(0, 0),
                        on_click=self._take_screenshot,
                        tooltip="Take screenshot",
                    ),
                    # Open full screen
                    ft.Container(
                        content=ft.Icon(ft.Icons.OPEN_IN_NEW_ROUNDED, size=18, color=colors["text_secondary"]),
                        width=32,
                        height=32,
                        border_radius=RADIUS["md"],
                        bgcolor=colors["bg_tertiary"],
                        alignment=ft.Alignment(0, 0),
                        on_click=self._open_full_view,
                        tooltip="Open full screen",
                    ),
                ],
                alignment=ft.MainAxisAlignment.CENTER,
                spacing=8,
            ),
            padding=ft.padding.symmetric(horizontal=10, vertical=8),
            bgcolor=f"{colors['bg_secondary']}80",
            border_radius=ft.border_radius.only(
                bottom_left=RADIUS["xl"],
                bottom_right=RADIUS["xl"],
            ),
        )

        return ft.Column(
            [
                header,
                ft.Container(height=4),
                phone_frame,
                device_info,
                ft.Container(expand=True),
                stream_controls,
            ],
            spacing=0,
        )

    async def _refresh_screenshot(self):
        """Refresh screenshot for live view effect."""
        import asyncio
        while self._is_streaming and self.screen_service:
            try:
                path = await self.screen_service.take_screenshot(self.device_serial)
                if path and self._image_control:
                    self._screenshot_path = path
                    self._image_control.src = path
                    if self.page:
                        self._image_control.update()
            except Exception as e:
                print(f"Screenshot refresh failed: {e}")
            
            await asyncio.sleep(self.refresh_interval)

    def _toggle_streaming(self, e):
        """Toggle streaming on/off."""
        self._is_streaming = not self._is_streaming
        self.content = self._build_content()
        if self.page:
            self.update()
            if self._is_streaming:
                self.page.run_task(self._refresh_screenshot)

    async def _take_screenshot(self, e):
        """Take a single screenshot."""
        if self.screen_service:
            path = await self.screen_service.take_screenshot(self.device_serial)
            if path:
                self._screenshot_path = path
                self.content = self._build_content()
                if self.page:
                    self.update()

    def _open_full_view(self, e):
        """Open scrcpy full screen view."""
        if self.screen_service:
            self.screen_service.start_scrcpy(
                device_serial=self.device_serial,
                title=self.device_model,
                max_size=1920,
            )

    def _handle_click(self, e):
        """Handle card click."""
        if self.on_card_click:
            self.on_card_click(self.device_serial)

    def _on_hover(self, e):
        """Handle hover effect."""
        colors = get_colors()
        is_online = self.status == "connected"
        
        if e.data == "true":
            self.border = ft.border.all(2, colors["primary"])
            self.shadow = get_shadow("lg")
        else:
            self.border = ft.border.all(
                2 if self.selected else 1,
                colors["primary"] if self.selected else (f"{colors['success']}40" if is_online else colors["border"])
            )
            self.shadow = get_shadow("md") if self.selected else get_shadow("sm")
        self.update()

    def start_streaming(self):
        """Start live streaming."""
        if not self._is_streaming:
            self._toggle_streaming(None)

    def stop_streaming(self):
        """Stop live streaming."""
        self._is_streaming = False
        self.content = self._build_content()
        if self.page:
            self.update()

