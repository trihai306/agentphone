"""Professional Real-Time Phone Viewer Component for Droidrun Controller.

Features:
- Live device screen mirroring
- Real-time screenshot refresh
- Device controls (back, home, power, etc.)
- Touch/tap simulation
- Screen recording
- Screenshot capture
- Device information panel
"""

import flet as ft
import asyncio
from typing import Optional, Callable
from ..theme import get_colors, RADIUS, SPACING, get_shadow, ANIMATION, get_colors
from ..services.screen_service import screen_service



# Dynamic color proxy - acts like a dict but always gets current theme colors
class _DynamicColors:
    def get(self, key, default=None):
        return get_colors().get(key, default)
    
    def __getitem__(self, key):
        return get_colors()[key]

COLORS = _DynamicColors()

class PhoneViewerModal(ft.Container):
    """Professional phone viewer modal with real-time screen display.

    Features:
    - Large, clear screen display
    - Auto-refresh for live updates
    - Device control buttons
    - Screenshot capture
    - Fullscreen mode
    - Device info sidebar
    """

    def __init__(
        self,
        device_serial: str,
        device_info: dict,
        on_close: Optional[Callable] = None,
        auto_refresh: bool = True,
        refresh_interval: float = 1.0,  # seconds
        **kwargs
    ):
        self.device_serial = device_serial
        self.device_info = device_info
        self.on_close_callback = on_close
        self.auto_refresh = auto_refresh
        self.refresh_interval = refresh_interval

        self.screenshot_url = None
        self.is_refreshing = False
        self.refresh_task = None
        self.fullscreen = False

        super().__init__(
            content=self._build_content(),
            **kwargs
        )

        # Start auto-refresh if enabled
        if self.auto_refresh and hasattr(self, 'page') and self.page:
            self.refresh_task = self.page.run_task(self._auto_refresh_loop)

    def _build_content(self):
        """Build the modal content."""
        colors = get_colors()

        # Backdrop overlay
        return ft.Container(
            content=ft.Stack([
                # Backdrop
                ft.Container(
                    bgcolor=colors["backdrop"],
                    expand=True,
                    on_click=lambda _: self._handle_close(),
                ),
                # Modal content
                ft.Container(
                    content=self._build_modal_card(),
                    alignment=ft.Alignment(0, 0),
                    expand=True,
                ),
            ]),
            expand=True,
        )

    def _build_modal_card(self):
        """Build the main modal card."""
        colors = get_colors()

        if self.fullscreen:
            return self._build_fullscreen_view()

        return ft.Container(
            content=ft.Column([
                self._build_header(),
                ft.Container(height=SPACING["lg"]),
                ft.Row([
                    self._build_screen_display(),
                    ft.Container(width=SPACING["xl"]),
                    self._build_controls_panel(),
                ], alignment=ft.MainAxisAlignment.CENTER),
            ], spacing=0, horizontal_alignment=ft.CrossAxisAlignment.CENTER),
            width=1100,
            padding=SPACING["xxl"],
            bgcolor=colors["bg_card"],
            border_radius=RADIUS["xxl"],
            shadow=get_shadow("xl"),
            on_click=lambda e: e.stop_propagation(),  # Prevent backdrop close
        )

    def _build_header(self):
        """Build modal header."""
        colors = get_colors()
        device_name = self.device_info.get("model", "Unknown Device")
        device_id = self.device_info.get("device_id", "")

        return ft.Row([
            # Device info
            ft.Row([
                ft.Container(
                    content=ft.Icon(
                        ft.Icons.SMARTPHONE,
                        size=24,
                        color=colors["primary"],
                    ),
                    width=48,
                    height=48,
                    border_radius=RADIUS["md"],
                    bgcolor=colors["primary_glow"],
                    alignment=ft.Alignment(0, 0),
                ),
                ft.Container(width=SPACING["md"]),
                ft.Column([
                    ft.Text(
                        device_name,
                        size=20,
                        weight=ft.FontWeight.BOLD,
                        color=colors["text_primary"],
                    ),
                    ft.Text(
                        f"ID: {device_id}",
                        size=12,
                        color=colors["text_muted"],
                    ),
                ], spacing=SPACING["xxs"]),
            ]),
            ft.Container(expand=True),
            # Action buttons
            ft.Row([
                self._build_header_button(
                    icon=ft.Icons.REFRESH,
                    tooltip="Refresh",
                    on_click=lambda _: self.page.run_task(self._refresh_screenshot),
                ),
                ft.Container(width=SPACING["sm"]),
                self._build_header_button(
                    icon=ft.Icons.FULLSCREEN,
                    tooltip="Fullscreen",
                    on_click=lambda _: self._toggle_fullscreen(),
                ),
                ft.Container(width=SPACING["sm"]),
                self._build_header_button(
                    icon=ft.Icons.CLOSE,
                    tooltip="Close",
                    on_click=lambda _: self._handle_close(),
                ),
            ], spacing=0),
        ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN)

    def _build_header_button(self, icon: str, tooltip: str, on_click):
        """Build header action button."""
        colors = get_colors()

        return ft.Container(
            content=ft.Icon(icon, size=20, color=colors["text_secondary"]),
            width=40,
            height=40,
            border_radius=RADIUS["md"],
            bgcolor=colors["bg_hover"],
            alignment=ft.Alignment(0, 0),
            tooltip=tooltip,
            on_click=on_click,
            on_hover=self._on_icon_button_hover,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_screen_display(self):
        """Build the main screen display area."""
        colors = get_colors()

        # Phone frame dimensions (realistic aspect ratio)
        frame_width = 380
        frame_height = 760

        # Screenshot content
        if self.screenshot_url and not self.is_refreshing:
            screen_content = ft.Image(
                src=self.screenshot_url,
                width=frame_width - 20,
                height=frame_height - 20,
                fit=ft.ImageFit.CONTAIN,
            )
        elif self.is_refreshing:
            screen_content = ft.Column([
                ft.ProgressRing(width=40, height=40, color=colors["primary"]),
                ft.Container(height=SPACING["md"]),
                ft.Text("Refreshing...", size=14, color=colors["text_muted"]),
            ], horizontal_alignment=ft.CrossAxisAlignment.CENTER,
               alignment=ft.MainAxisAlignment.CENTER,
               expand=True)
        else:
            screen_content = ft.Column([
                ft.Icon(ft.Icons.PHONE_ANDROID, size=64, color=colors["text_muted"]),
                ft.Container(height=SPACING["md"]),
                ft.Text("No screen data", size=14, color=colors["text_muted"]),
                ft.Container(height=SPACING["sm"]),
                ft.Text(
                    "Click refresh to capture screen",
                    size=12,
                    color=colors["text_muted"],
                ),
            ], horizontal_alignment=ft.CrossAxisAlignment.CENTER,
               alignment=ft.MainAxisAlignment.CENTER,
               expand=True)

        # Phone frame with realistic styling
        return ft.Container(
            content=ft.Column([
                # Top notch/bezel
                ft.Container(
                    content=ft.Row([
                        ft.Container(
                            width=80,
                            height=6,
                            border_radius=3,
                            bgcolor=colors["text_primary"],
                            opacity=0.3,
                        ),
                    ], alignment=ft.MainAxisAlignment.CENTER),
                    height=30,
                    alignment=ft.Alignment(0, 0),
                ),
                # Screen
                ft.Container(
                    content=screen_content,
                    width=frame_width - 20,
                    height=frame_height - 60,
                    bgcolor=colors["bg_primary"],
                    border_radius=RADIUS["md"],
                    clip_behavior=ft.ClipBehavior.ANTI_ALIAS,
                ),
                # Bottom bezel
                ft.Container(height=30),
            ], spacing=0),
            width=frame_width,
            height=frame_height,
            bgcolor=colors["bg_secondary"],
            border_radius=RADIUS["xxl"],
            border=ft.border.all(8, colors["border"]),
            shadow=get_shadow("xl"),
        )

    def _build_controls_panel(self):
        """Build the controls panel."""
        colors = get_colors()

        return ft.Container(
            content=ft.Column([
                # Device Controls Section
                ft.Text(
                    "DEVICE CONTROLS",
                    size=10,
                    weight=ft.FontWeight.W_700,
                    color=colors["text_muted"],
                ),
                ft.Container(height=SPACING["md"]),

                # Navigation buttons
                ft.Container(
                    content=ft.Column([
                        self._build_control_button(
                            "Back",
                            ft.Icons.ARROW_BACK,
                            lambda _: self._send_key_event("BACK"),
                        ),
                        ft.Container(height=SPACING["sm"]),
                        self._build_control_button(
                            "Home",
                            ft.Icons.HOME,
                            lambda _: self._send_key_event("HOME"),
                        ),
                        ft.Container(height=SPACING["sm"]),
                        self._build_control_button(
                            "Recent Apps",
                            ft.Icons.APPS,
                            lambda _: self._send_key_event("APP_SWITCH"),
                        ),
                    ], spacing=0),
                    padding=SPACING["md"],
                    border_radius=RADIUS["lg"],
                    bgcolor=colors["bg_secondary"],
                    border=ft.border.all(1, colors["border"]),
                ),

                ft.Container(height=SPACING["lg"]),

                # Power Controls
                ft.Text(
                    "POWER",
                    size=10,
                    weight=ft.FontWeight.W_700,
                    color=colors["text_muted"],
                ),
                ft.Container(height=SPACING["md"]),

                ft.Container(
                    content=ft.Column([
                        self._build_control_button(
                            "Power",
                            ft.Icons.POWER_SETTINGS_NEW,
                            lambda _: self._send_key_event("POWER"),
                            color=colors["error"],
                        ),
                        ft.Container(height=SPACING["sm"]),
                        self._build_control_button(
                            "Volume Up",
                            ft.Icons.VOLUME_UP,
                            lambda _: self._send_key_event("VOLUME_UP"),
                        ),
                        ft.Container(height=SPACING["sm"]),
                        self._build_control_button(
                            "Volume Down",
                            ft.Icons.VOLUME_DOWN,
                            lambda _: self._send_key_event("VOLUME_DOWN"),
                        ),
                    ], spacing=0),
                    padding=SPACING["md"],
                    border_radius=RADIUS["lg"],
                    bgcolor=colors["bg_secondary"],
                    border=ft.border.all(1, colors["border"]),
                ),

                ft.Container(height=SPACING["lg"]),

                # Screenshot & Recording
                ft.Text(
                    "CAPTURE",
                    size=10,
                    weight=ft.FontWeight.W_700,
                    color=colors["text_muted"],
                ),
                ft.Container(height=SPACING["md"]),

                self._build_control_button(
                    "Screenshot",
                    ft.Icons.SCREENSHOT,
                    lambda _: self.page.run_task(self._take_screenshot),
                    full_width=True,
                    color=colors["primary"],
                ),

                ft.Container(height=SPACING["md"]),

                # Auto-refresh toggle
                ft.Container(
                    content=ft.Row([
                        ft.Checkbox(
                            value=self.auto_refresh,
                            on_change=self._toggle_auto_refresh,
                            active_color=colors["primary"],
                        ),
                        ft.Text(
                            "Auto-refresh",
                            size=13,
                            color=colors["text_secondary"],
                        ),
                    ], spacing=SPACING["sm"]),
                    padding=SPACING["md"],
                    border_radius=RADIUS["lg"],
                    bgcolor=colors["bg_secondary"],
                    border=ft.border.all(1, colors["border"]),
                ),

            ], spacing=0),
            width=250,
        )

    def _build_control_button(
        self,
        label: str,
        icon: str,
        on_click: Callable,
        full_width: bool = False,
        color: Optional[str] = None,
    ):
        """Build a control button."""
        colors = get_colors()
        button_color = color or colors["text_secondary"]

        return ft.Container(
            content=ft.Row([
                ft.Icon(icon, size=18, color=button_color),
                ft.Container(width=SPACING["sm"]),
                ft.Text(
                    label,
                    size=13,
                    weight=ft.FontWeight.W_600,
                    color=button_color,
                ),
            ], alignment=ft.MainAxisAlignment.START if full_width else ft.MainAxisAlignment.CENTER),
            padding=ft.padding.symmetric(horizontal=SPACING["md"], vertical=SPACING["sm"]),
            border_radius=RADIUS["md"],
            bgcolor=colors["bg_card"],
            border=ft.border.all(1, colors["border"]),
            on_click=on_click,
            on_hover=self._on_control_button_hover,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_fullscreen_view(self):
        """Build fullscreen viewer."""
        colors = get_colors()

        return ft.Container(
            content=ft.Column([
                # Header bar
                ft.Container(
                    content=ft.Row([
                        ft.Text(
                            self.device_info.get("model", "Device"),
                            size=16,
                            weight=ft.FontWeight.W_600,
                            color=colors["text_primary"],
                        ),
                        ft.Container(expand=True),
                        ft.IconButton(
                            icon=ft.Icons.FULLSCREEN_EXIT,
                            icon_color=colors["text_primary"],
                            on_click=lambda _: self._toggle_fullscreen(),
                        ),
                        ft.IconButton(
                            icon=ft.Icons.CLOSE,
                            icon_color=colors["text_primary"],
                            on_click=lambda _: self._handle_close(),
                        ),
                    ]),
                    padding=SPACING["lg"],
                    bgcolor=colors["bg_card"],
                ),
                # Large screen display
                ft.Container(
                    content=ft.Image(
                        src=self.screenshot_url,
                        fit=ft.ImageFit.CONTAIN,
                    ) if self.screenshot_url else ft.Icon(
                        ft.Icons.PHONE_ANDROID,
                        size=128,
                        color=colors["text_muted"],
                    ),
                    expand=True,
                    bgcolor=colors["bg_primary"],
                    alignment=ft.Alignment(0, 0),
                ),
            ], spacing=0),
            expand=True,
            bgcolor=colors["bg_card"],
        )

    def _on_icon_button_hover(self, e):
        """Handle icon button hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["bg_secondary"]
            e.control.content.color = colors["text_primary"]
        else:
            e.control.bgcolor = colors["bg_hover"]
            e.control.content.color = colors["text_secondary"]
        e.control.update()

    def _on_control_button_hover(self, e):
        """Handle control button hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["bg_hover"]
            e.control.border = ft.border.all(1, colors["border_hover"])
        else:
            e.control.bgcolor = colors["bg_card"]
            e.control.border = ft.border.all(1, colors["border"])
        e.control.update()

    async def _refresh_screenshot(self):
        """Refresh the screenshot."""
        if self.is_refreshing:
            return

        self.is_refreshing = True
        self.update()

        try:
            # Force new screenshot
            screenshot_url = await screen_service.get_screenshot(
                self.device_serial,
                force_new=True
            )
            self.screenshot_url = screenshot_url
        except Exception as e:
            print(f"Error refreshing screenshot: {e}")
        finally:
            self.is_refreshing = False
            self.update()

    async def _auto_refresh_loop(self):
        """Auto-refresh loop."""
        while self.auto_refresh:
            await asyncio.sleep(self.refresh_interval)
            if self.auto_refresh and not self.fullscreen:
                await self._refresh_screenshot()

    def _toggle_auto_refresh(self, e):
        """Toggle auto-refresh."""
        self.auto_refresh = e.control.value
        if self.auto_refresh and self.refresh_task is None:
            self.refresh_task = self.page.run_task(self._auto_refresh_loop)

    def _toggle_fullscreen(self):
        """Toggle fullscreen mode."""
        self.fullscreen = not self.fullscreen
        self.content = self._build_content()
        self.update()

    async def _take_screenshot(self):
        """Take and save screenshot."""
        # Implement screenshot save functionality
        pass

    def _send_key_event(self, key: str):
        """Send key event to device."""
        # Implement ADB key event
        # Example: adb shell input keyevent KEYCODE_{key}
        print(f"Sending key event: {key} to {self.device_serial}")

    def _handle_close(self):
        """Handle modal close."""
        self.auto_refresh = False  # Stop auto-refresh
        if self.on_close_callback:
            self.on_close_callback()


def show_phone_viewer(page: ft.Page, device_serial: str, device_info: dict):
    """Show the phone viewer modal.

    Args:
        page: Flet page instance
        device_serial: Device serial number
        device_info: Device information dict
    """
    def close_viewer():
        page.overlay.clear()
        page.update()

    viewer = PhoneViewerModal(
        device_serial=device_serial,
        device_info=device_info,
        on_close=close_viewer,
    )

    page.overlay.append(viewer)
    page.update()

    # Initial screenshot load
    page.run_task(viewer._refresh_screenshot)
