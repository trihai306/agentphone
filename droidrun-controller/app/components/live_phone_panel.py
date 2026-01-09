"""Live Phone Streaming Panel using fast screenshot refresh.

This component provides near-real-time phone view by capturing and displaying
screenshots at high frequency (up to 200ms intervals), creating a "live" effect.

While not as smooth as true video streaming, this provides:
- Real-time view of phone screen
- No additional server/dependencies needed
- Works with any Android device via ADB
"""

import flet as ft
import asyncio
import os
import time
from typing import Optional, Callable
from pathlib import Path
from ..theme import get_colors, RADIUS, get_shadow, SPACING, ANIMATION
from ..services.screen_service import screen_service


class LivePhonePanel(ft.Container):
    """Large phone panel with LIVE screen display via fast screenshot refresh.
    
    This component creates a near-real-time view of the connected device by
    rapidly capturing and displaying screenshots (default: every 300ms).
    
    Screen size: 320x680 (realistic phone proportions)
    """
    
    PHONE_WIDTH = 320
    PHONE_HEIGHT = 680
    SCREEN_WIDTH = PHONE_WIDTH - 24
    SCREEN_HEIGHT = PHONE_HEIGHT - 60
    
    def __init__(
        self,
        device_serial: str,
        device_name: str = "",
        device_model: str = "Unknown",
        status: str = "offline",
        android_version: str = "?",
        refresh_interval: float = 0.3,  # 300ms for near-live view
        on_open_scrcpy: Optional[Callable] = None,
        battery_level: Optional[int] = None,
        ram_usage: Optional[int] = None,
    ):
        self.device_serial = device_serial
        self.device_name = device_name or device_serial
        self.device_model = device_model
        self.status = status
        self.android_version = android_version
        self.refresh_interval = refresh_interval
        self.on_open_scrcpy = on_open_scrcpy
        self.battery_level = battery_level
        self.ram_usage = ram_usage
        
        self._is_streaming = False
        self._screenshot_path: Optional[str] = None
        self._last_update = 0
        self._stream_task = None
        
        # Screen image control - will be updated with screenshots
        self._screen_image = ft.Image(
            src="",
            fit=ft.ImageFit.COVER,
            width=self.SCREEN_WIDTH,
            height=self.SCREEN_HEIGHT,
        )
        
        # Status indicator
        self._status_text = ft.Text(
            "LIVE",
            size=10,
            weight=ft.FontWeight.W_700,
            color=get_colors()["success"],
        )
        self._status_dot = ft.Container(
            width=8,
            height=8,
            border_radius=4,
            bgcolor=get_colors()["success"],
        )
        
        colors = get_colors()
        is_online = status == "connected"
        
        super().__init__(
            content=self._build_content(),
            width=self.PHONE_WIDTH + 40,
            border_radius=RADIUS["xl"],
            bgcolor=colors["bg_card"],
            border=ft.border.all(
                2,
                f"{colors['success']}50" if is_online else colors["border"]
            ),
            shadow=get_shadow("xl") if is_online else get_shadow("md"),
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            padding=0,
        )
    
    def did_mount(self):
        """Start streaming when component is mounted."""
        if self.status == "connected":
            self._start_streaming()
    
    def will_unmount(self):
        """Stop streaming when component is unmounted."""
        self._stop_streaming()
    
    def _start_streaming(self):
        """Start the screenshot streaming loop."""
        if self._is_streaming:
            return
        
        self._is_streaming = True
        if self.page:
            self.page.run_task(self._stream_loop)
    
    def _stop_streaming(self):
        """Stop the screenshot streaming loop."""
        self._is_streaming = False
    
    async def _stream_loop(self):
        """Main streaming loop - capture and display screenshots."""
        while self._is_streaming and self.page:
            try:
                # Capture screenshot
                screenshot_path = await self._capture_screenshot()
                
                if screenshot_path and os.path.exists(screenshot_path):
                    # Update image with new screenshot
                    # Add timestamp to prevent caching
                    self._screen_image.src = f"{screenshot_path}?t={time.time()}"
                    if self.page:
                        self._screen_image.update()
                
                # Wait for next interval
                await asyncio.sleep(self.refresh_interval)
                
            except Exception as e:
                print(f"[LivePhonePanel] Stream error: {e}")
                await asyncio.sleep(1)  # Wait longer on error
    
    async def _capture_screenshot(self) -> Optional[str]:
        """Capture a screenshot from the device."""
        try:
            # Use screen_service to take screenshot
            result = await asyncio.to_thread(
                screen_service.take_screenshot,
                self.device_serial,
            )
            return result  # Returns path to screenshot file
        except Exception as e:
            print(f"[LivePhonePanel] Screenshot error: {e}")
            return None
    
    def _build_content(self):
        """Build the panel content."""
        colors = get_colors()
        is_online = self.status == "connected"
        
        # ============ Header ============
        header = ft.Container(
            content=ft.Row(
                [
                    # LIVE indicator
                    ft.Container(
                        content=ft.Row(
                            [
                                self._status_dot,
                                ft.Container(width=6),
                                self._status_text,
                            ],
                        ),
                        padding=ft.padding.symmetric(horizontal=10, vertical=5),
                        border_radius=RADIUS["full"],
                        bgcolor=f"{colors['success']}15" if is_online else colors["bg_tertiary"],
                        animate=ft.Animation(500, ft.AnimationCurve.EASE_IN_OUT),
                    ),
                    ft.Container(expand=True),
                    # Stream controls
                    ft.Row(
                        [
                            # Pause/Play toggle
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.PAUSE_ROUNDED if self._is_streaming else ft.Icons.PLAY_ARROW_ROUNDED,
                                    size=18,
                                    color=colors["text_secondary"],
                                ),
                                width=32,
                                height=32,
                                border_radius=RADIUS["md"],
                                bgcolor=colors["bg_tertiary"],
                                alignment=ft.Alignment(0, 0),
                                on_click=self._toggle_streaming,
                                tooltip="Pause/Resume stream",
                            ),
                            ft.Container(width=4),
                            # Fullscreen (open scrcpy)
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.FULLSCREEN_ROUNDED,
                                    size=18,
                                    color=colors["primary"],
                                ),
                                width=32,
                                height=32,
                                border_radius=RADIUS["md"],
                                bgcolor=colors["primary_glow"],
                                alignment=ft.Alignment(0, 0),
                                on_click=lambda e: self.on_open_scrcpy(self.device_serial) if self.on_open_scrcpy else None,
                                tooltip="Open fullscreen (scrcpy)",
                            ),
                        ],
                        spacing=0,
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
                        size=15,
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
            padding=ft.padding.only(bottom=10),
        )
        
        # ============ Live Phone Screen ============
        phone_screen = self._build_phone_screen(colors, is_online)
        
        # ============ Action Bar ============
        action_bar = ft.Container(
            content=ft.Row(
                [
                    # Open scrcpy button
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(
                                    ft.Icons.OPEN_IN_FULL_ROUNDED,
                                    size=20,
                                    color=colors["text_inverse"],
                                ),
                                ft.Container(width=8),
                                ft.Text(
                                    "Interactive Mode (scrcpy)",
                                    size=13,
                                    weight=ft.FontWeight.W_600,
                                    color=colors["text_inverse"],
                                ),
                            ],
                            alignment=ft.MainAxisAlignment.CENTER,
                        ),
                        expand=True,
                        height=44,
                        border_radius=RADIUS["lg"],
                        bgcolor=colors["primary"],
                        alignment=ft.Alignment(0, 0),
                        on_click=lambda e: self.on_open_scrcpy(self.device_serial) if self.on_open_scrcpy else None,
                        on_hover=self._on_primary_hover,
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
        
        return ft.Column(
            [
                header,
                device_info,
                phone_screen,
                action_bar,
            ],
            spacing=0,
        )
    
    def _build_phone_screen(self, colors, is_online):
        """Build the live phone screen display."""
        # Placeholder content when not streaming/offline
        if not is_online:
            screen_content = ft.Container(
                content=ft.Column(
                    [
                        ft.Icon(
                            ft.Icons.PHONE_DISABLED_ROUNDED,
                            size=48,
                            color=colors["text_muted"],
                        ),
                        ft.Container(height=16),
                        ft.Text(
                            "Device Offline",
                            size=16,
                            weight=ft.FontWeight.W_600,
                            color=colors["text_muted"],
                        ),
                    ],
                    horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                    alignment=ft.MainAxisAlignment.CENTER,
                ),
                expand=True,
                bgcolor="#0a0a0a",
            )
        else:
            # Live screen content with updating image
            screen_content = ft.Container(
                content=ft.Stack(
                    [
                        # Screenshot image (updated by stream loop)
                        self._screen_image,
                        # Loading overlay (shown initially)
                        ft.Container(
                            content=ft.Column(
                                [
                                    ft.ProgressRing(
                                        width=40,
                                        height=40,
                                        stroke_width=3,
                                        color=colors["primary"],
                                    ),
                                    ft.Container(height=12),
                                    ft.Text(
                                        "Connecting...",
                                        size=13,
                                        color=colors["text_secondary"],
                                    ),
                                ],
                                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                                alignment=ft.MainAxisAlignment.CENTER,
                            ),
                            expand=True,
                            bgcolor="#0a0a0a",
                            visible=not self._screenshot_path,
                        ),
                    ],
                    expand=True,
                ),
                expand=True,
                bgcolor="#0a0a0a",
            )
        
        # Notch
        notch = ft.Container(
            content=ft.Row(
                [
                    ft.Container(width=36, height=5, border_radius=3, bgcolor="#333"),
                    ft.Container(width=8),
                    ft.Container(width=10, height=10, border_radius=5, bgcolor="#333"),
                ],
                alignment=ft.MainAxisAlignment.CENTER,
            ),
            height=20,
            bgcolor="#111",
            border_radius=ft.border_radius.only(bottom_left=10, bottom_right=10),
        )
        
        # Home indicator
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
                    screen_content,
                    ft.Container(content=notch, alignment=ft.Alignment(0, -1)),
                    ft.Container(content=home_indicator, alignment=ft.Alignment(0, 1)),
                ],
                expand=True,
            ),
            width=self.SCREEN_WIDTH,
            height=self.SCREEN_HEIGHT,
            border_radius=RADIUS["lg"],
            bgcolor="#0a0a0a",
            clip_behavior=ft.ClipBehavior.ANTI_ALIAS,
        )
        
        # Complete phone body
        phone_body = ft.Container(
            content=ft.Column(
                [
                    ft.Container(height=8),
                    screen_area,
                    ft.Container(height=8),
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
        )
        
        return ft.Container(
            content=phone_body,
            margin=ft.margin.symmetric(horizontal=10, vertical=8),
            alignment=ft.Alignment(0, 0),
        )
    
    def _toggle_streaming(self, e):
        """Toggle the streaming on/off."""
        if self._is_streaming:
            self._stop_streaming()
            self._status_text.value = "PAUSED"
            self._status_dot.bgcolor = get_colors()["warning"]
        else:
            self._start_streaming()
            self._status_text.value = "LIVE"
            self._status_dot.bgcolor = get_colors()["success"]
        
        if self.page:
            self._status_text.update()
            self._status_dot.update()
    
    def _on_primary_hover(self, e):
        """Handle primary button hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.scale = 1.02
        else:
            e.control.scale = 1.0
        e.control.update()
