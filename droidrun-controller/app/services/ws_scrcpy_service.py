"""ws-scrcpy server manager and WebView integration for live device streaming.

This module provides:
- WsScrcpyServer: Manager for ws-scrcpy Node.js server
- DeviceStreamView: Flet component to embed live device stream
"""

import asyncio
import subprocess
import os
import signal
from typing import Optional, Callable, Dict
from pathlib import Path


class WsScrcpyServer:
    """Manager for ws-scrcpy Node.js server.
    
    ws-scrcpy provides real-time H264 video streaming of Android devices
    via WebSocket, accessible through a web browser or WebView.
    """
    
    # Default paths
    WS_SCRCPY_DIR = Path(__file__).parent.parent.parent / "ws-scrcpy-server"
    DEFAULT_PORT = 8000
    
    def __init__(self, port: int = DEFAULT_PORT):
        self.port = port
        self._process: Optional[subprocess.Popen] = None
        self._is_running = False
        self._output_buffer = []
    
    @property
    def is_installed(self) -> bool:
        """Check if ws-scrcpy is installed."""
        return (self.WS_SCRCPY_DIR / "node_modules").exists()
    
    @property
    def is_running(self) -> bool:
        """Check if ws-scrcpy server is running."""
        if self._process:
            return self._process.poll() is None
        return False
    
    @property
    def web_url(self) -> str:
        """Get the web URL for ws-scrcpy."""
        return f"http://localhost:{self.port}"
    
    def get_device_url(self, device_serial: str) -> str:
        """Get the URL for a specific device stream.
        
        Args:
            device_serial: ADB device serial number
            
        Returns:
            URL to access the device stream in a browser/WebView
        """
        # ws-scrcpy uses URL format: http://localhost:PORT/?action=stream&udid=SERIAL
        return f"{self.web_url}/?action=stream&udid={device_serial}"
    
    async def install(self, progress_callback: Optional[Callable[[str], None]] = None) -> bool:
        """Install ws-scrcpy dependencies.
        
        Args:
            progress_callback: Optional callback for progress updates
            
        Returns:
            True if installation successful
        """
        if not self.WS_SCRCPY_DIR.exists():
            if progress_callback:
                progress_callback("ws-scrcpy not found. Please clone the repository first.")
            return False
        
        if progress_callback:
            progress_callback("Installing ws-scrcpy dependencies...")
        
        try:
            proc = await asyncio.create_subprocess_exec(
                "npm", "install", "--legacy-peer-deps",
                cwd=str(self.WS_SCRCPY_DIR),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await proc.communicate()
            
            if proc.returncode == 0:
                if progress_callback:
                    progress_callback("ws-scrcpy installed successfully!")
                return True
            else:
                if progress_callback:
                    progress_callback(f"Installation failed: {stderr.decode()[:200]}")
                return False
        except Exception as e:
            if progress_callback:
                progress_callback(f"Installation error: {e}")
            return False
    
    async def build(self, progress_callback: Optional[Callable[[str], None]] = None) -> bool:
        """Build ws-scrcpy dist files.
        
        Args:
            progress_callback: Optional callback for progress updates
            
        Returns:
            True if build successful
        """
        if progress_callback:
            progress_callback("Building ws-scrcpy...")
        
        try:
            proc = await asyncio.create_subprocess_exec(
                "npm", "run", "dist",
                cwd=str(self.WS_SCRCPY_DIR),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await proc.communicate()
            
            if proc.returncode == 0:
                if progress_callback:
                    progress_callback("ws-scrcpy built successfully!")
                return True
            else:
                if progress_callback:
                    progress_callback(f"Build failed: {stderr.decode()[:200]}")
                return False
        except Exception as e:
            if progress_callback:
                progress_callback(f"Build error: {e}")
            return False
    
    def start(self, callback: Optional[Callable[[str], None]] = None) -> bool:
        """Start the ws-scrcpy server.
        
        Args:
            callback: Optional callback for server output
            
        Returns:
            True if server started successfully
        """
        if self.is_running:
            return True
        
        if not self.is_installed:
            if callback:
                callback("ws-scrcpy not installed. Run install() first.")
            return False
        
        try:
            # Start ws-scrcpy server
            self._process = subprocess.Popen(
                ["npm", "start"],
                cwd=str(self.WS_SCRCPY_DIR),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                env={**os.environ, "PORT": str(self.port)},
            )
            
            self._is_running = True
            
            if callback:
                callback(f"ws-scrcpy server started on port {self.port}")
            
            return True
            
        except Exception as e:
            if callback:
                callback(f"Failed to start server: {e}")
            return False
    
    def stop(self) -> bool:
        """Stop the ws-scrcpy server.
        
        Returns:
            True if server stopped successfully
        """
        if not self._process:
            return True
        
        try:
            # Send SIGTERM first
            self._process.terminate()
            try:
                self._process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                # Force kill if not responding
                self._process.kill()
                self._process.wait()
            
            self._process = None
            self._is_running = False
            return True
            
        except Exception as e:
            print(f"Error stopping ws-scrcpy: {e}")
            return False
    
    def restart(self, callback: Optional[Callable[[str], None]] = None) -> bool:
        """Restart the ws-scrcpy server.
        
        Args:
            callback: Optional callback for status updates
            
        Returns:
            True if restart successful
        """
        self.stop()
        return self.start(callback)


# Global instance
ws_scrcpy_server = WsScrcpyServer()


# Try importing Flet for WebView component
try:
    import flet as ft
    from ..theme import get_colors, RADIUS, SPACING, ANIMATION, get_shadow
    
    class DeviceStreamView(ft.Container):
        """Flet component to embed live device stream using WebView.
        
        This component wraps a WebView that displays the ws-scrcpy interface
        for a specific device, allowing real-time video streaming and interaction.
        """
        
        def __init__(
            self,
            device_serial: str,
            device_name: str = "",
            width: int = 320,
            height: int = 480,
            server: Optional[WsScrcpyServer] = None,
            on_close: Optional[Callable] = None,
        ):
            self.device_serial = device_serial
            self.device_name = device_name or device_serial
            self.server = server or ws_scrcpy_server
            self.on_close = on_close
            
            colors = get_colors()
            
            super().__init__(
                content=self._build_content(),
                width=width,
                height=height + 40,  # Extra height for header
                border_radius=RADIUS["xl"],
                bgcolor=colors["bg_card"],
                border=ft.border.all(1, colors["border"]),
                shadow=get_shadow("lg"),
                clip_behavior=ft.ClipBehavior.ANTI_ALIAS,
            )
        
        def _build_content(self):
            """Build the component content."""
            colors = get_colors()
            
            # Header bar with device info and controls
            header = ft.Container(
                content=ft.Row(
                    [
                        # Device name
                        ft.Row(
                            [
                                ft.Container(
                                    width=8,
                                    height=8,
                                    border_radius=4,
                                    bgcolor=colors["success"],
                                ),
                                ft.Container(width=6),
                                ft.Text(
                                    self.device_name[:20],
                                    size=12,
                                    weight=ft.FontWeight.W_600,
                                    color=colors["text_primary"],
                                ),
                            ],
                        ),
                        ft.Container(expand=True),
                        # Controls
                        ft.IconButton(
                            icon=ft.Icons.REFRESH_ROUNDED,
                            icon_size=16,
                            icon_color=colors["text_secondary"],
                            tooltip="Refresh",
                            on_click=self._on_refresh,
                        ),
                        ft.IconButton(
                            icon=ft.Icons.OPEN_IN_NEW_ROUNDED,
                            icon_size=16,
                            icon_color=colors["text_secondary"],
                            tooltip="Open in browser",
                            on_click=self._on_open_browser,
                        ),
                        ft.IconButton(
                            icon=ft.Icons.CLOSE_ROUNDED,
                            icon_size=16,
                            icon_color=colors["text_muted"],
                            tooltip="Close",
                            on_click=self._on_close,
                        ),
                    ],
                ),
                padding=ft.padding.symmetric(horizontal=10, vertical=6),
                bgcolor=colors["bg_secondary"],
            )
            
            # WebView for streaming
            # Note: WebView is only available in Flet for mobile/desktop apps
            # For web, we'll show a link to open in new tab
            stream_url = self.server.get_device_url(self.device_serial)
            
            try:
                # Try to use WebView if available
                webview = ft.WebView(
                    url=stream_url,
                    expand=True,
                    on_page_started=lambda e: print(f"Loading stream for {self.device_serial}"),
                    on_page_ended=lambda e: print(f"Stream loaded for {self.device_serial}"),
                )
                stream_content = webview
            except Exception:
                # Fallback for platforms without WebView support
                stream_content = ft.Container(
                    content=ft.Column(
                        [
                            ft.Icon(
                                ft.Icons.VIDEOCAM_ROUNDED,
                                size=48,
                                color=colors["primary"],
                            ),
                            ft.Container(height=16),
                            ft.Text(
                                "Live Stream",
                                size=16,
                                weight=ft.FontWeight.W_600,
                                color=colors["text_primary"],
                            ),
                            ft.Container(height=8),
                            ft.Text(
                                "WebView not available on this platform.",
                                size=12,
                                color=colors["text_secondary"],
                                text_align=ft.TextAlign.CENTER,
                            ),
                            ft.Container(height=16),
                            ft.ElevatedButton(
                                "Open in Browser",
                                icon=ft.Icons.OPEN_IN_NEW_ROUNDED,
                                on_click=self._on_open_browser,
                            ),
                        ],
                        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                        alignment=ft.MainAxisAlignment.CENTER,
                    ),
                    expand=True,
                    bgcolor=colors["bg_tertiary"],
                )
            
            return ft.Column(
                [
                    header,
                    ft.Container(
                        content=stream_content,
                        expand=True,
                    ),
                ],
                spacing=0,
            )
        
        def _on_refresh(self, e):
            """Refresh the WebView."""
            self.content = self._build_content()
            if self.page:
                self.update()
        
        def _on_open_browser(self, e):
            """Open stream in external browser."""
            import webbrowser
            stream_url = self.server.get_device_url(self.device_serial)
            webbrowser.open(stream_url)
        
        def _on_close(self, e):
            """Close the stream view."""
            if self.on_close:
                self.on_close(self.device_serial)
    
    
    class DeviceStreamCard(ft.Container):
        """Compact device card with embedded live stream preview.
        
        Combines device info with a mini live stream view for the Device Farm grid.
        """
        
        def __init__(
            self,
            device_serial: str,
            device_model: str = "Unknown",
            status: str = "offline",
            android_version: str = "?",
            on_click: Optional[Callable] = None,
            on_select: Optional[Callable] = None,
            selected: bool = False,
            server: Optional[WsScrcpyServer] = None,
        ):
            self.device_serial = device_serial
            self.device_model = device_model
            self.status = status
            self.android_version = android_version
            self.on_card_click = on_click
            self.on_select = on_select
            self.selected = selected
            self.server = server or ws_scrcpy_server
            
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
            """Build the card content with live stream preview."""
            colors = get_colors()
            is_online = self.status == "connected"
            
            # Header
            header = ft.Container(
                content=ft.Row(
                    [
                        # Status badge
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
                                        "LIVE" if is_online else "OFFLINE",
                                        size=9,
                                        weight=ft.FontWeight.W_700,
                                        color=colors["success"] if is_online else colors["text_muted"],
                                    ),
                                ],
                            ),
                            padding=ft.padding.symmetric(horizontal=8, vertical=4),
                            border_radius=RADIUS["full"],
                            bgcolor=f"{colors['success']}15" if is_online else colors["bg_tertiary"],
                        ),
                        ft.Container(expand=True),
                        # Checkbox
                        ft.Checkbox(
                            value=self.selected,
                            on_change=lambda e: self.on_select(self.device_serial, e.control.value) if self.on_select else None,
                            active_color=colors["primary"],
                        ),
                    ],
                ),
                padding=ft.padding.only(left=10, right=2, top=6),
            )
            
            # Stream preview area
            stream_url = self.server.get_device_url(self.device_serial)
            
            if is_online and self.server.is_running:
                try:
                    stream_preview = ft.WebView(
                        url=stream_url,
                        expand=True,
                    )
                except Exception:
                    stream_preview = self._build_placeholder(colors, is_online)
            else:
                stream_preview = self._build_placeholder(colors, is_online)
            
            stream_frame = ft.Container(
                content=stream_preview,
                height=160,
                margin=ft.margin.symmetric(horizontal=10),
                border_radius=RADIUS["lg"],
                bgcolor=colors["bg_tertiary"],
                border=ft.border.all(2, colors["border"]),
                clip_behavior=ft.ClipBehavior.ANTI_ALIAS,
            )
            
            # Device info
            device_info = ft.Container(
                content=ft.Column(
                    [
                        ft.Text(
                            self.device_model[:16] + "..." if len(self.device_model) > 16 else self.device_model,
                            size=13,
                            weight=ft.FontWeight.W_700,
                            color=colors["text_primary"],
                            text_align=ft.TextAlign.CENTER,
                        ),
                        ft.Row(
                            [
                                ft.Container(
                                    content=ft.Row(
                                        [
                                            ft.Icon(ft.Icons.ANDROID, size=10, color=colors["success"]),
                                            ft.Text(f"{self.android_version}", size=9, color=colors["text_secondary"]),
                                        ],
                                        spacing=3,
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
                    spacing=4,
                ),
                padding=ft.padding.symmetric(horizontal=10, vertical=8),
            )
            
            # Action bar
            action_bar = ft.Container(
                content=ft.Row(
                    [
                        self._build_action_btn(ft.Icons.PLAY_ARROW_ROUNDED, colors["success"], "Run"),
                        self._build_action_btn(ft.Icons.SCREENSHOT_MONITOR_ROUNDED, colors["accent_blue"], "Screenshot"),
                        self._build_action_btn(ft.Icons.OPEN_IN_NEW_ROUNDED, colors["text_secondary"], "Full Screen"),
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
                    stream_frame,
                    device_info,
                    ft.Container(expand=True),
                    action_bar,
                ],
                spacing=0,
            )
        
        def _build_placeholder(self, colors, is_online):
            """Build placeholder when stream not available."""
            return ft.Container(
                content=ft.Column(
                    [
                        ft.Icon(
                            ft.Icons.VIDEOCAM_ROUNDED if is_online else ft.Icons.VIDEOCAM_OFF_ROUNDED,
                            size=32,
                            color=colors["primary"] if is_online else colors["text_muted"],
                        ),
                        ft.Container(height=8),
                        ft.Text(
                            "Start server\nto stream" if is_online else "Device\noffline",
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
        
        def _build_action_btn(self, icon, color, tooltip):
            """Build an action button."""
            return ft.Container(
                content=ft.Icon(icon, size=18, color=color),
                width=32,
                height=32,
                border_radius=RADIUS["md"],
                bgcolor=f"{color}10",
                alignment=ft.Alignment(0, 0),
                tooltip=tooltip,
            )
        
        def _handle_click(self, e):
            """Handle card click."""
            if self.on_card_click:
                self.on_card_click(self.device_serial)
        
        def _on_hover(self, e):
            """Handle hover effect."""
            colors = get_colors()
            if e.data == "true":
                self.border = ft.border.all(2, colors["primary"])
                self.shadow = get_shadow("lg")
            else:
                self.border = ft.border.all(
                    2 if self.selected else 1,
                    colors["primary"] if self.selected else colors["border"]
                )
                self.shadow = get_shadow("md") if self.selected else get_shadow("sm")
            self.update()
    
except ImportError:
    # Flet not available, skip UI components
    pass
