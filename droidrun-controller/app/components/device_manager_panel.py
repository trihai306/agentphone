"""Large Device Manager Panel for Cloud Device Viewing.

Professional device manager with large phone screens - similar to cloud device
management consoles like AWS Device Farm, Firebase Test Lab, BrowserStack.

Each device is displayed as a LARGE panel (like an actual phone) that can be
interacted with directly.
"""

import flet as ft
from typing import Optional, Callable, List, Dict
from ..theme import get_colors, RADIUS, get_shadow, SPACING, ANIMATION


class DeviceManagerPanel(ft.Container):
    """Large device panel for full-size phone view and interaction.
    
    Displays a phone at near-actual size (360x720+) with:
    - Live screen preview
    - Device info header
    - Quick controls
    - Interaction overlay
    """
    
    # Standard phone aspect ratio (9:19.5 or similar)
    PHONE_WIDTH = 320
    PHONE_HEIGHT = 680
    
    def __init__(
        self,
        device_id: str,
        device_name: str,
        device_model: str = "Unknown",
        status: str = "offline",
        android_version: str = "?",
        screenshot_url: Optional[str] = None,
        on_click: Optional[Callable] = None,
        on_open_scrcpy: Optional[Callable] = None,
        on_screenshot: Optional[Callable] = None,
        on_restart: Optional[Callable] = None,
        on_disconnect: Optional[Callable] = None,
        battery_level: Optional[int] = None,
        ram_usage: Optional[int] = None,
        selected: bool = False,
    ):
        self.device_id = device_id
        self.device_name = device_name
        self.device_model = device_model
        self.status = status
        self.android_version = android_version
        self.screenshot_url = screenshot_url
        self.on_card_click = on_click
        self.on_open_scrcpy = on_open_scrcpy
        self.on_screenshot = on_screenshot
        self.on_restart = on_restart
        self.on_disconnect = on_disconnect
        self.battery_level = battery_level
        self.ram_usage = ram_usage
        self.selected = selected
        
        colors = get_colors()
        is_online = status == "connected"
        
        super().__init__(
            content=self._build_content(),
            width=self.PHONE_WIDTH + 40,  # Extra for padding
            border_radius=RADIUS["xl"],
            bgcolor=colors["bg_card"],
            border=ft.border.all(
                3 if selected else 2,
                colors["primary"] if selected else (f"{colors['success']}50" if is_online else colors["border"])
            ),
            shadow=get_shadow("xl") if is_online else get_shadow("md"),
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            padding=0,
        )
    
    def _build_content(self):
        """Build the large panel content."""
        colors = get_colors()
        is_online = self.status == "connected"
        
        # ============ Header ============
        header = ft.Container(
            content=ft.Row(
                [
                    # Status indicator
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Container(
                                    width=12,
                                    height=12,
                                    border_radius=6,
                                    bgcolor=colors["success"] if is_online else colors["text_muted"],
                                ),
                                ft.Container(width=8),
                                ft.Text(
                                    "ONLINE" if is_online else "OFFLINE",
                                    size=11,
                                    weight=ft.FontWeight.W_700,
                                    color=colors["success"] if is_online else colors["text_muted"],
                                ),
                            ],
                        ),
                        padding=ft.padding.symmetric(horizontal=12, vertical=6),
                        border_radius=RADIUS["full"],
                        bgcolor=f"{colors['success']}15" if is_online else colors["bg_tertiary"],
                    ),
                    ft.Container(expand=True),
                    # Device ID
                    ft.Text(
                        f"ID: {self.device_id[:12]}..." if len(self.device_id) > 12 else f"ID: {self.device_id}",
                        size=10,
                        color=colors["text_muted"],
                    ),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=16, vertical=10),
        )
        
        # ============ Device Name ============
        device_info = ft.Container(
            content=ft.Column(
                [
                    ft.Text(
                        self.device_model,
                        size=16,
                        weight=ft.FontWeight.W_700,
                        color=colors["text_primary"],
                        text_align=ft.TextAlign.CENTER,
                    ),
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(ft.Icons.ANDROID, size=14, color=colors["success"]),
                                ft.Text(
                                    f"Android {self.android_version}",
                                    size=12,
                                    color=colors["text_secondary"],
                                ),
                            ],
                            alignment=ft.MainAxisAlignment.CENTER,
                            spacing=6,
                        ),
                        margin=ft.margin.only(top=4),
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.only(bottom=12),
        )
        
        # ============ Large Phone Frame ============
        phone_frame = self._build_phone_frame(colors, is_online)
        
        # ============ Stats Bar ============
        stats_bar = self._build_stats_bar(colors)
        
        # ============ Action Bar ============
        action_bar = self._build_action_bar(colors, is_online)
        
        return ft.Column(
            [
                header,
                device_info,
                phone_frame,
                stats_bar,
                action_bar,
            ],
            spacing=0,
        )
    
    def _build_phone_frame(self, colors, is_online):
        """Build a large realistic phone frame."""
        # Phone screen content
        if self.screenshot_url:
            screen_content = ft.Image(
                src=self.screenshot_url,
                fit=ft.ImageFit.COVER,
                width=self.PHONE_WIDTH - 24,
                height=self.PHONE_HEIGHT - 40,
            )
        else:
            # Large placeholder
            screen_content = ft.Container(
                content=ft.Column(
                    [
                        # Phone icon
                        ft.Container(
                            content=ft.Icon(
                                ft.Icons.SMARTPHONE_ROUNDED,
                                size=64,
                                color=colors["primary"] if is_online else colors["text_muted"],
                            ),
                            width=100,
                            height=100,
                            border_radius=25,
                            bgcolor=f"{colors['primary']}15" if is_online else colors["bg_tertiary"],
                            alignment=ft.Alignment(0, 0),
                        ),
                        ft.Container(height=20),
                        # Status text
                        ft.Text(
                            "Tap to Connect" if is_online else "Device Offline",
                            size=18,
                            weight=ft.FontWeight.W_600,
                            color=colors["text_primary"] if is_online else colors["text_muted"],
                        ),
                        ft.Container(height=8),
                        ft.Text(
                            "Click Play to open scrcpy" if is_online else "Connect to manage device",
                            size=13,
                            color=colors["text_secondary"],
                        ),
                        ft.Container(height=24),
                        # Android version badge
                        ft.Container(
                            content=ft.Row(
                                [
                                    ft.Icon(ft.Icons.ANDROID, size=20, color=colors["success"]),
                                    ft.Container(width=8),
                                    ft.Text(
                                        f"Android {self.android_version}",
                                        size=14,
                                        weight=ft.FontWeight.W_600,
                                        color=colors["text_secondary"],
                                    ),
                                ],
                                alignment=ft.MainAxisAlignment.CENTER,
                            ),
                            padding=ft.padding.symmetric(horizontal=16, vertical=10),
                            border_radius=RADIUS["full"],
                            bgcolor=f"{colors['success']}10",
                        ),
                    ],
                    horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                    alignment=ft.MainAxisAlignment.CENTER,
                ),
                expand=True,
                bgcolor="#0a0a0a",
            )
        
        # Notch
        notch = ft.Container(
            content=ft.Row(
                [
                    ft.Container(width=40, height=5, border_radius=3, bgcolor="#333"),
                    ft.Container(width=8),
                    ft.Container(width=10, height=10, border_radius=5, bgcolor="#333"),
                ],
                alignment=ft.MainAxisAlignment.CENTER,
            ),
            height=20,
            bgcolor="#111",
            border_radius=ft.border_radius.only(bottom_left=10, bottom_right=10),
        )
        
        # Home indicator at bottom
        home_indicator = ft.Container(
            content=ft.Container(
                width=100,
                height=5,
                border_radius=3,
                bgcolor="#333",
            ),
            height=20,
            bgcolor="#111",
            alignment=ft.Alignment(0, 0),
        )
        
        # Screen area
        screen_area = ft.Container(
            content=ft.Stack(
                [
                    ft.Container(
                        content=screen_content,
                        expand=True,
                    ),
                    ft.Container(content=notch, alignment=ft.Alignment(0, -1)),
                    ft.Container(content=home_indicator, alignment=ft.Alignment(0, 1)),
                ],
                expand=True,
            ),
            width=self.PHONE_WIDTH - 24,
            height=self.PHONE_HEIGHT - 40,
            border_radius=RADIUS["lg"],
            bgcolor="#0a0a0a",
            clip_behavior=ft.ClipBehavior.ANTI_ALIAS,
        )
        
        # Complete phone body
        phone_body = ft.Container(
            content=ft.Column(
                [
                    ft.Container(height=8),  # Top bezel
                    screen_area,
                    ft.Container(height=8),  # Bottom bezel
                ],
                spacing=0,
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            width=self.PHONE_WIDTH,
            height=self.PHONE_HEIGHT,
            border_radius=RADIUS["2xl"],
            bgcolor="#1a1a1a",
            border=ft.border.all(4, "#2d2d2d"),
            shadow=ft.BoxShadow(
                spread_radius=0,
                blur_radius=30,
                color="#00000060",
                offset=ft.Offset(0, 8),
            ),
            clip_behavior=ft.ClipBehavior.ANTI_ALIAS,
            on_click=lambda e: self.on_open_scrcpy(self.device_id) if self.on_open_scrcpy else None,
        )
        
        # Side buttons
        power_button = ft.Container(
            content=ft.Container(
                width=4,
                height=40,
                border_radius=2,
                bgcolor="#3a3a3a",
            ),
            alignment=ft.Alignment(1, -0.2),
        )
        
        volume_buttons = ft.Container(
            content=ft.Column(
                [
                    ft.Container(width=4, height=30, border_radius=2, bgcolor="#3a3a3a"),
                    ft.Container(height=8),
                    ft.Container(width=4, height=30, border_radius=2, bgcolor="#3a3a3a"),
                ],
            ),
            alignment=ft.Alignment(-1, -0.4),
        )
        
        return ft.Container(
            content=ft.Stack(
                [
                    ft.Container(content=phone_body, alignment=ft.Alignment(0, 0)),
                    volume_buttons,
                    power_button,
                ],
                width=self.PHONE_WIDTH + 16,
                height=self.PHONE_HEIGHT + 16,
            ),
            margin=ft.margin.symmetric(horizontal=10, vertical=8),
            alignment=ft.Alignment(0, 0),
        )
    
    def _build_stats_bar(self, colors):
        """Build stats bar with battery, RAM, etc."""
        items = []
        
        if self.battery_level is not None:
            battery_color = colors["success"] if self.battery_level >= 50 else (
                colors["warning"] if self.battery_level >= 20 else colors["error"]
            )
            items.append(self._build_stat_item(
                ft.Icons.BATTERY_FULL_ROUNDED if self.battery_level >= 80 else ft.Icons.BATTERY_3_BAR_ROUNDED,
                f"{self.battery_level}%",
                battery_color,
                colors,
            ))
        
        if self.ram_usage is not None:
            ram_color = colors["success"] if self.ram_usage < 70 else (
                colors["warning"] if self.ram_usage < 90 else colors["error"]
            )
            items.append(self._build_stat_item(
                ft.Icons.MEMORY_ROUNDED,
                f"{self.ram_usage}%",
                ram_color,
                colors,
            ))
        
        # Add placeholder if no stats
        if not items:
            items.append(ft.Container(
                content=ft.Text("No stats available", size=11, color=colors["text_muted"]),
                padding=ft.padding.symmetric(horizontal=12, vertical=6),
            ))
        
        return ft.Container(
            content=ft.Row(items, alignment=ft.MainAxisAlignment.CENTER, spacing=12),
            padding=ft.padding.symmetric(vertical=10),
        )
    
    def _build_stat_item(self, icon, value, color, colors):
        """Build a stat item."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(icon, size=16, color=color),
                    ft.Container(width=6),
                    ft.Text(value, size=12, weight=ft.FontWeight.W_600, color=colors["text_secondary"]),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=12, vertical=6),
            border_radius=RADIUS["md"],
            bgcolor=f"{color}10",
        )
    
    def _build_action_bar(self, colors, is_online):
        """Build the action bar with large buttons."""
        return ft.Container(
            content=ft.Row(
                [
                    # Play/Connect button (large, primary)
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(
                                    ft.Icons.PLAY_ARROW_ROUNDED if is_online else ft.Icons.POWER_SETTINGS_NEW_ROUNDED,
                                    size=24,
                                    color=colors["text_inverse"],
                                ),
                                ft.Container(width=8),
                                ft.Text(
                                    "Open scrcpy" if is_online else "Connect",
                                    size=14,
                                    weight=ft.FontWeight.W_600,
                                    color=colors["text_inverse"],
                                ),
                            ],
                            alignment=ft.MainAxisAlignment.CENTER,
                        ),
                        expand=True,
                        height=44,
                        border_radius=RADIUS["lg"],
                        bgcolor=colors["success"] if is_online else colors["primary"],
                        alignment=ft.Alignment(0, 0),
                        on_click=lambda e: self.on_open_scrcpy(self.device_id) if self.on_open_scrcpy else None,
                        on_hover=self._on_primary_hover,
                        animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                    ),
                ],
            ),
            padding=ft.padding.all(16),
            bgcolor=f"{colors['bg_secondary']}80",
            border_radius=ft.border_radius.only(
                bottom_left=RADIUS["xl"],
                bottom_right=RADIUS["xl"],
            ),
        )
    
    def _on_primary_hover(self, e):
        """Handle primary button hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.scale = 1.02
            e.control.shadow = get_shadow("md")
        else:
            e.control.scale = 1.0
            e.control.shadow = None
        e.control.update()


class DeviceGridLarge(ft.Container):
    """Grid of large device panels for cloud device management."""
    
    def __init__(
        self,
        devices: List[Dict] = None,
        on_device_click: Optional[Callable] = None,
        on_open_scrcpy: Optional[Callable] = None,
        on_screenshot: Optional[Callable] = None,
    ):
        self.devices = devices or []
        self.on_device_click = on_device_click
        self.on_open_scrcpy = on_open_scrcpy
        self.on_screenshot = on_screenshot
        
        colors = get_colors()
        
        super().__init__(
            content=self._build_content(),
            expand=True,
            bgcolor=colors["bg_primary"],
        )
    
    def _build_content(self):
        """Build the grid of large device panels."""
        colors = get_colors()
        
        if not self.devices:
            return ft.Container(
                content=ft.Column(
                    [
                        ft.Icon(ft.Icons.DEVICES_OTHER_ROUNDED, size=64, color=colors["text_muted"]),
                        ft.Container(height=16),
                        ft.Text("No devices connected", size=18, weight=ft.FontWeight.W_600, color=colors["text_secondary"]),
                        ft.Text("Connect an Android device to get started", size=14, color=colors["text_muted"]),
                    ],
                    horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                    alignment=ft.MainAxisAlignment.CENTER,
                ),
                expand=True,
            )
        
        # Create panels for each device
        panels = []
        for device in self.devices:
            panel = DeviceManagerPanel(
                device_id=device.get("device_id", device.get("id", "")),
                device_name=device.get("device_name", "Unknown"),
                device_model=device.get("device_model", device.get("model", "Unknown")),
                status=device.get("status", "offline"),
                android_version=device.get("android_version", device.get("version", "?")),
                screenshot_url=device.get("screenshot_url"),
                battery_level=device.get("battery_level"),
                ram_usage=device.get("ram_usage"),
                on_click=self.on_device_click,
                on_open_scrcpy=self.on_open_scrcpy,
                on_screenshot=self.on_screenshot,
            )
            panels.append(panel)
        
        # Wrap in a scrollable Row
        return ft.Container(
            content=ft.Row(
                panels,
                scroll=ft.ScrollMode.AUTO,
                spacing=24,
            ),
            padding=ft.padding.all(24),
            expand=True,
        )
    
    def update_devices(self, devices: List[Dict]):
        """Update the devices list and rebuild."""
        self.devices = devices
        self.content = self._build_content()
        if self.page:
            self.update()
