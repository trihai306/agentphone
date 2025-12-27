"""Recorder Controls component for recording UI actions.

Provides start/stop/pause buttons, recording status indicator,
elapsed time display, and action counter.
"""

import flet as ft
from typing import Optional, Callable
from datetime import datetime, timedelta
from ..theme import get_colors, RADIUS, get_shadow, SPACING, ANIMATION


class RecorderControls(ft.Container):
    """Recording control panel with start/stop/pause buttons and status display."""

    def __init__(
        self,
        on_start: Optional[Callable] = None,
        on_stop: Optional[Callable] = None,
        on_pause: Optional[Callable] = None,
        on_resume: Optional[Callable] = None,
        on_cancel: Optional[Callable] = None,
        device_name: str = "Unknown Device",
        **kwargs
    ):
        self.on_start_recording = on_start
        self.on_stop_recording = on_stop
        self.on_pause_recording = on_pause
        self.on_resume_recording = on_resume
        self.on_cancel_recording = on_cancel
        self.device_name = device_name

        # State
        self._is_recording = False
        self._is_paused = False
        self._action_count = 0
        self._start_time: Optional[datetime] = None
        self._elapsed_seconds = 0

        colors = get_colors()
        super().__init__(
            content=self._build_content(),
            bgcolor=colors["bg_card"],
            border_radius=RADIUS["xl"],
            border=ft.border.all(1, colors["border"]),
            shadow=get_shadow("sm"),
            padding=24,
            **kwargs
        )

    def _build_content(self):
        """Build the recorder controls content."""
        colors = get_colors()

        if self._is_recording or self._is_paused:
            return self._build_recording_state()
        else:
            return self._build_idle_state()

    def _build_idle_state(self):
        """Build the idle state UI (ready to start recording)."""
        colors = get_colors()

        return ft.Column(
            [
                # Header with device info
                ft.Row(
                    [
                        ft.Container(
                            content=ft.Icon(
                                ft.Icons.FIBER_MANUAL_RECORD,
                                size=20,
                                color=colors["error"],
                            ),
                            width=44,
                            height=44,
                            border_radius=RADIUS["lg"],
                            bgcolor=f"{colors['error']}12",
                            alignment=ft.alignment.center,
                            border=ft.border.all(1, f"{colors['error']}20"),
                        ),
                        ft.Container(width=SPACING["md"]),
                        ft.Column(
                            [
                                ft.Text(
                                    "Record Actions",
                                    size=18,
                                    weight=ft.FontWeight.W_700,
                                    color=colors["text_primary"],
                                ),
                                ft.Text(
                                    f"Device: {self.device_name}",
                                    size=12,
                                    color=colors["text_secondary"],
                                ),
                            ],
                            spacing=2,
                        ),
                    ],
                    vertical_alignment=ft.CrossAxisAlignment.CENTER,
                ),
                ft.Container(height=SPACING["lg"]),
                # Instructions
                ft.Container(
                    content=ft.Column(
                        [
                            ft.Row(
                                [
                                    ft.Icon(
                                        ft.Icons.INFO_OUTLINE,
                                        size=16,
                                        color=colors["info"],
                                    ),
                                    ft.Container(width=8),
                                    ft.Text(
                                        "Recording will capture all taps, swipes, and text input.",
                                        size=12,
                                        color=colors["text_secondary"],
                                    ),
                                ],
                            ),
                        ],
                    ),
                    bgcolor=f"{colors['info']}08",
                    border_radius=RADIUS["md"],
                    padding=SPACING["md"],
                    border=ft.border.all(1, f"{colors['info']}15"),
                ),
                ft.Container(height=SPACING["xl"]),
                # Start button
                ft.Container(
                    content=ft.Row(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.FIBER_MANUAL_RECORD,
                                    size=16,
                                    color=colors["text_inverse"],
                                ),
                                width=32,
                                height=32,
                                bgcolor=f"{colors['error_dark']}40",
                                border_radius=RADIUS["sm"],
                                alignment=ft.alignment.center,
                            ),
                            ft.Container(width=SPACING["sm"]),
                            ft.Text(
                                "Start Recording",
                                size=14,
                                weight=ft.FontWeight.W_600,
                                color=colors["text_inverse"],
                            ),
                        ],
                        alignment=ft.MainAxisAlignment.CENTER,
                    ),
                    bgcolor=colors["error"],
                    padding=ft.padding.symmetric(horizontal=24, vertical=14),
                    border_radius=RADIUS["lg"],
                    shadow=ft.BoxShadow(
                        spread_radius=0,
                        blur_radius=16,
                        color=f"{colors['error']}35",
                        offset=ft.Offset(0, 4),
                    ),
                    animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
                    animate_scale=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
                    on_click=self._handle_start,
                    on_hover=self._on_start_hover,
                ),
            ],
            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
        )

    def _build_recording_state(self):
        """Build the recording state UI (currently recording)."""
        colors = get_colors()

        # Status indicator
        status_color = colors["paused"] if self._is_paused else colors["error"]
        status_text = "Paused" if self._is_paused else "Recording"
        status_icon = ft.Icons.PAUSE_CIRCLE if self._is_paused else ft.Icons.FIBER_MANUAL_RECORD

        # Format elapsed time
        elapsed_str = self._format_elapsed_time()

        return ft.Column(
            [
                # Recording status header
                ft.Row(
                    [
                        # Animated recording indicator
                        ft.Container(
                            content=ft.Icon(
                                status_icon,
                                size=20,
                                color=status_color,
                            ),
                            width=44,
                            height=44,
                            border_radius=RADIUS["lg"],
                            bgcolor=f"{status_color}15",
                            alignment=ft.alignment.center,
                            border=ft.border.all(1, f"{status_color}30"),
                            animate=ft.Animation(500, ft.AnimationCurve.EASE_IN_OUT),
                        ),
                        ft.Container(width=SPACING["md"]),
                        ft.Column(
                            [
                                ft.Row(
                                    [
                                        ft.Container(
                                            width=8,
                                            height=8,
                                            border_radius=4,
                                            bgcolor=status_color,
                                        ),
                                        ft.Container(width=8),
                                        ft.Text(
                                            status_text,
                                            size=16,
                                            weight=ft.FontWeight.W_700,
                                            color=status_color,
                                        ),
                                    ],
                                ),
                                ft.Text(
                                    f"Device: {self.device_name}",
                                    size=12,
                                    color=colors["text_secondary"],
                                ),
                            ],
                            spacing=2,
                        ),
                        ft.Container(expand=True),
                        # Elapsed time
                        ft.Container(
                            content=ft.Row(
                                [
                                    ft.Icon(
                                        ft.Icons.TIMER,
                                        size=16,
                                        color=colors["text_secondary"],
                                    ),
                                    ft.Container(width=6),
                                    ft.Text(
                                        elapsed_str,
                                        size=20,
                                        weight=ft.FontWeight.W_700,
                                        color=colors["text_primary"],
                                        font_family="monospace",
                                    ),
                                ],
                            ),
                            padding=ft.padding.symmetric(horizontal=16, vertical=8),
                            border_radius=RADIUS["md"],
                            bgcolor=colors["bg_tertiary"],
                            border=ft.border.all(1, colors["border_subtle"]),
                        ),
                    ],
                    vertical_alignment=ft.CrossAxisAlignment.CENTER,
                ),
                ft.Container(height=SPACING["lg"]),
                # Stats row
                ft.Row(
                    [
                        # Action count
                        self._build_stat_badge(
                            icon=ft.Icons.TOUCH_APP,
                            value=str(self._action_count),
                            label="Actions",
                            color=colors["accent_cyan"],
                        ),
                        ft.Container(width=SPACING["md"]),
                        # Recording duration
                        self._build_stat_badge(
                            icon=ft.Icons.ACCESS_TIME,
                            value=elapsed_str,
                            label="Duration",
                            color=colors["accent_purple"],
                        ),
                    ],
                    alignment=ft.MainAxisAlignment.CENTER,
                ),
                ft.Container(height=SPACING["xl"]),
                # Control buttons
                ft.Row(
                    [
                        # Pause/Resume button
                        ft.Container(
                            content=ft.Row(
                                [
                                    ft.Icon(
                                        ft.Icons.PLAY_ARROW if self._is_paused else ft.Icons.PAUSE,
                                        size=18,
                                        color=colors["accent_purple"],
                                    ),
                                    ft.Container(width=6),
                                    ft.Text(
                                        "Resume" if self._is_paused else "Pause",
                                        size=13,
                                        weight=ft.FontWeight.W_600,
                                        color=colors["accent_purple"],
                                    ),
                                ],
                                alignment=ft.MainAxisAlignment.CENTER,
                            ),
                            padding=ft.padding.symmetric(horizontal=20, vertical=12),
                            border_radius=RADIUS["md"],
                            bgcolor=f"{colors['accent_purple']}12",
                            border=ft.border.all(1, f"{colors['accent_purple']}30"),
                            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                            on_click=self._handle_pause_resume,
                            on_hover=self._on_secondary_hover,
                            data={"color": colors["accent_purple"]},
                        ),
                        ft.Container(width=SPACING["sm"]),
                        # Stop button
                        ft.Container(
                            content=ft.Row(
                                [
                                    ft.Icon(
                                        ft.Icons.STOP,
                                        size=18,
                                        color=colors["text_inverse"],
                                    ),
                                    ft.Container(width=6),
                                    ft.Text(
                                        "Stop Recording",
                                        size=13,
                                        weight=ft.FontWeight.W_600,
                                        color=colors["text_inverse"],
                                    ),
                                ],
                                alignment=ft.MainAxisAlignment.CENTER,
                            ),
                            padding=ft.padding.symmetric(horizontal=20, vertical=12),
                            border_radius=RADIUS["md"],
                            bgcolor=colors["error"],
                            shadow=ft.BoxShadow(
                                spread_radius=0,
                                blur_radius=12,
                                color=f"{colors['error']}30",
                                offset=ft.Offset(0, 3),
                            ),
                            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                            on_click=self._handle_stop,
                            on_hover=self._on_danger_hover,
                        ),
                        ft.Container(width=SPACING["sm"]),
                        # Cancel button
                        ft.Container(
                            content=ft.Row(
                                [
                                    ft.Icon(
                                        ft.Icons.CLOSE,
                                        size=18,
                                        color=colors["text_muted"],
                                    ),
                                    ft.Container(width=6),
                                    ft.Text(
                                        "Cancel",
                                        size=13,
                                        weight=ft.FontWeight.W_500,
                                        color=colors["text_muted"],
                                    ),
                                ],
                                alignment=ft.MainAxisAlignment.CENTER,
                            ),
                            padding=ft.padding.symmetric(horizontal=16, vertical=12),
                            border_radius=RADIUS["md"],
                            bgcolor=colors["bg_tertiary"],
                            border=ft.border.all(1, colors["border_subtle"]),
                            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                            on_click=self._handle_cancel,
                            on_hover=self._on_button_hover,
                        ),
                    ],
                    alignment=ft.MainAxisAlignment.CENTER,
                ),
            ],
        )

    def _build_stat_badge(
        self,
        icon: str,
        value: str,
        label: str,
        color: str,
    ):
        """Build a stat badge for displaying recording stats."""
        colors = get_colors()
        return ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        content=ft.Icon(
                            icon,
                            size=18,
                            color=color,
                        ),
                        width=36,
                        height=36,
                        border_radius=RADIUS["md"],
                        bgcolor=f"{color}15",
                        alignment=ft.alignment.center,
                    ),
                    ft.Container(width=SPACING["sm"]),
                    ft.Column(
                        [
                            ft.Text(
                                value,
                                size=18,
                                weight=ft.FontWeight.W_700,
                                color=colors["text_primary"],
                            ),
                            ft.Text(
                                label,
                                size=11,
                                color=colors["text_muted"],
                            ),
                        ],
                        spacing=0,
                    ),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=16, vertical=12),
            border_radius=RADIUS["lg"],
            bgcolor=colors["bg_tertiary"],
            border=ft.border.all(1, colors["border_subtle"]),
        )

    def _format_elapsed_time(self) -> str:
        """Format elapsed time as MM:SS or HH:MM:SS."""
        seconds = self._elapsed_seconds
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        secs = seconds % 60

        if hours > 0:
            return f"{hours:02d}:{minutes:02d}:{secs:02d}"
        return f"{minutes:02d}:{secs:02d}"

    # Event handlers
    async def _handle_start(self, e):
        """Handle start recording button click."""
        if self.on_start_recording:
            await self.on_start_recording(e)

    async def _handle_stop(self, e):
        """Handle stop recording button click."""
        if self.on_stop_recording:
            await self.on_stop_recording(e)

    async def _handle_pause_resume(self, e):
        """Handle pause/resume button click."""
        if self._is_paused:
            if self.on_resume_recording:
                await self.on_resume_recording(e)
        else:
            if self.on_pause_recording:
                await self.on_pause_recording(e)

    async def _handle_cancel(self, e):
        """Handle cancel button click."""
        if self.on_cancel_recording:
            await self.on_cancel_recording(e)

    # Hover effects
    def _on_start_hover(self, e):
        """Handle start button hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=24,
                color=f"{colors['error']}50",
                offset=ft.Offset(0, 8),
            )
            e.control.scale = 1.02
        else:
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=16,
                color=f"{colors['error']}35",
                offset=ft.Offset(0, 4),
            )
            e.control.scale = 1.0
        e.control.update()

    def _on_danger_hover(self, e):
        """Handle danger button hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=16,
                color=f"{colors['error']}45",
                offset=ft.Offset(0, 6),
            )
            e.control.scale = 1.01
        else:
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=12,
                color=f"{colors['error']}30",
                offset=ft.Offset(0, 3),
            )
            e.control.scale = 1.0
        e.control.update()

    def _on_secondary_hover(self, e):
        """Handle secondary button hover."""
        colors = get_colors()
        color = e.control.data.get("color", colors["accent_purple"])
        if e.data == "true":
            e.control.bgcolor = f"{color}20"
            e.control.border = ft.border.all(1, f"{color}50")
        else:
            e.control.bgcolor = f"{color}12"
            e.control.border = ft.border.all(1, f"{color}30")
        e.control.update()

    def _on_button_hover(self, e):
        """Handle button hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["bg_hover"]
            e.control.border = ft.border.all(1, colors["border_light"])
        else:
            e.control.bgcolor = colors["bg_tertiary"]
            e.control.border = ft.border.all(1, colors["border_subtle"])
        e.control.update()

    # Public methods for updating state
    def start_recording(self):
        """Update UI to show recording state."""
        self._is_recording = True
        self._is_paused = False
        self._action_count = 0
        self._start_time = datetime.now()
        self._elapsed_seconds = 0
        self.content = self._build_content()
        self.update()

    def stop_recording(self):
        """Update UI to show idle state."""
        self._is_recording = False
        self._is_paused = False
        self._start_time = None
        self.content = self._build_content()
        self.update()

    def pause_recording(self):
        """Update UI to show paused state."""
        self._is_paused = True
        self.content = self._build_content()
        self.update()

    def resume_recording(self):
        """Update UI to show resumed recording state."""
        self._is_paused = False
        self.content = self._build_content()
        self.update()

    def increment_action_count(self, count: int = 1):
        """Increment the action counter."""
        self._action_count += count
        self.content = self._build_content()
        self.update()

    def set_action_count(self, count: int):
        """Set the action counter to a specific value."""
        self._action_count = count
        self.content = self._build_content()
        self.update()

    def update_elapsed_time(self, seconds: int):
        """Update the elapsed time display."""
        self._elapsed_seconds = seconds
        self.content = self._build_content()
        self.update()

    def set_device_name(self, name: str):
        """Update the device name."""
        self.device_name = name
        self.content = self._build_content()
        self.update()

    @property
    def is_recording(self) -> bool:
        """Check if currently recording."""
        return self._is_recording

    @property
    def is_paused(self) -> bool:
        """Check if recording is paused."""
        return self._is_paused

    @property
    def action_count(self) -> int:
        """Get the current action count."""
        return self._action_count


class RecorderStatusBadge(ft.Container):
    """Compact status badge for showing recording status in headers."""

    def __init__(
        self,
        is_recording: bool = False,
        action_count: int = 0,
        **kwargs
    ):
        self._is_recording = is_recording
        self._action_count = action_count

        colors = get_colors()
        status_color = colors["error"] if is_recording else colors["text_muted"]

        super().__init__(
            content=ft.Row(
                [
                    ft.Container(
                        width=8,
                        height=8,
                        border_radius=4,
                        bgcolor=status_color,
                    ),
                    ft.Container(width=6),
                    ft.Text(
                        "Recording" if is_recording else "Ready",
                        size=12,
                        weight=ft.FontWeight.W_600,
                        color=status_color,
                    ),
                    ft.Container(width=8) if is_recording and action_count > 0 else ft.Container(),
                    ft.Text(
                        f"({action_count} actions)",
                        size=11,
                        color=colors["text_muted"],
                    ) if is_recording and action_count > 0 else ft.Container(),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=12, vertical=6),
            border_radius=RADIUS["md"],
            bgcolor=f"{status_color}12",
            border=ft.border.all(1, f"{status_color}25"),
            **kwargs
        )

    def update_status(self, is_recording: bool, action_count: int = 0):
        """Update the recording status."""
        self._is_recording = is_recording
        self._action_count = action_count

        colors = get_colors()
        status_color = colors["error"] if is_recording else colors["text_muted"]

        self.bgcolor = f"{status_color}12"
        self.border = ft.border.all(1, f"{status_color}25")
        self.content = ft.Row(
            [
                ft.Container(
                    width=8,
                    height=8,
                    border_radius=4,
                    bgcolor=status_color,
                ),
                ft.Container(width=6),
                ft.Text(
                    "Recording" if is_recording else "Ready",
                    size=12,
                    weight=ft.FontWeight.W_600,
                    color=status_color,
                ),
                ft.Container(width=8) if is_recording and action_count > 0 else ft.Container(),
                ft.Text(
                    f"({action_count} actions)",
                    size=11,
                    color=colors["text_muted"],
                ) if is_recording and action_count > 0 else ft.Container(),
            ],
        )
        self.update()
