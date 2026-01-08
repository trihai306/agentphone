"""Professional Recording Panel view for Droidrun Controller - 2025 Edition.

This module implements the recording panel UI with:
- Start/Stop/Pause controls for workflow recording
- Live event list showing captured actions in real-time
- Recording state management with visual feedback
- Professional styling following existing Flet patterns
"""

import flet as ft
from datetime import datetime
from typing import List, Optional, Dict, Any, Callable

from ..theme import get_colors, RADIUS, get_shadow, ANIMATION
from ..models.workflow import (
    Workflow,
    WorkflowStep,
    ActionType,
    ElementSelector,
    SelectorType,
)
from ..services import get_selector_generator, get_step_namer



# Dynamic color proxy - acts like a dict but always gets current theme colors
class _DynamicColors:
    def get(self, key, default=None):
        return get_colors().get(key, default)
    
    def __getitem__(self, key):
        return get_colors()[key]

COLORS = _DynamicColors()

class RecordingState:
    """Recording state enumeration."""
    IDLE = "idle"
    RECORDING = "recording"
    PAUSED = "paused"
    STOPPED = "stopped"


class RecordingPanelView(ft.Container):
    """Professional view for recording workflow actions.

    This panel provides controls for starting, stopping, and pausing
    workflow recording, along with a live list of captured events.
    """

    def __init__(
        self,
        app_state: Dict[str, Any],
        toast,
        device_id: Optional[str] = None,
        on_recording_complete: Optional[Callable[[Workflow], None]] = None,
        **kwargs
    ):
        """Initialize the recording panel.

        Args:
            app_state: Application state dictionary.
            toast: Toast notification manager.
            device_id: Optional connected device ID for recording.
            on_recording_complete: Callback when recording is saved.
        """
        self.app_state = app_state
        self.toast = toast
        self.device_id = device_id
        self.on_recording_complete = on_recording_complete

        # Recording state
        self.recording_state = RecordingState.IDLE
        self.recorded_events: List[Dict[str, Any]] = []
        self.workflow_steps: List[WorkflowStep] = []
        self.recording_start_time: Optional[datetime] = None
        self.event_count = 0

        # Services
        self.selector_generator = get_selector_generator()
        self.step_namer = get_step_namer()

        # UI references for updates
        self._event_list_container: Optional[ft.Container] = None
        self._stats_row: Optional[ft.Row] = None
        self._control_buttons: Optional[ft.Row] = None
        self._recording_indicator: Optional[ft.Container] = None

        super().__init__(
            content=self._build_content(),
            expand=True,
            **kwargs
        )

    def _build_content(self):
        """Build the main panel content."""
        return ft.Column(
            [
                self._build_header(),
                ft.Container(height=24),
                self._build_recording_controls(),
                ft.Container(height=24),
                self._build_stats_section(),
                ft.Container(height=24),
                self._build_event_list_section(),
            ],
            spacing=0,
            expand=True,
            scroll=ft.ScrollMode.AUTO,
        )

    def _build_header(self):
        """Build the header section with title and recording indicator."""
        self._recording_indicator = ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        width=8,
                        height=8,
                        border_radius=4,
                        bgcolor=COLORS["error"] if self.recording_state == RecordingState.RECORDING else COLORS["text_muted"],
                        animate=ft.Animation(500, ft.AnimationCurve.EASE_IN_OUT),
                    ),
                    ft.Container(width=8),
                    ft.Text(
                        self._get_state_label(),
                        size=12,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["error"] if self.recording_state == RecordingState.RECORDING else COLORS["text_secondary"],
                    ),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=12, vertical=6),
            border_radius=RADIUS["full"],
            bgcolor=f"{COLORS['error']}15" if self.recording_state == RecordingState.RECORDING else COLORS["bg_tertiary"],
            border=ft.border.all(1, f"{COLORS['error']}30" if self.recording_state == RecordingState.RECORDING else COLORS["border_subtle"]),
        )

        return ft.Container(
            content=ft.Row(
                [
                    ft.Column(
                        [
                            ft.Row(
                                [
                                    ft.Text(
                                        "Recording",
                                        size=32,
                                        weight=ft.FontWeight.W_800,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Container(width=16),
                                    ft.Container(
                                        content=ft.Icon(
                                            ft.Icons.FIBER_MANUAL_RECORD,
                                            size=22,
                                            color=COLORS["error"],
                                        ),
                                        width=44,
                                        height=44,
                                        bgcolor=f"{COLORS['error']}12",
                                        border_radius=RADIUS["lg"],
                                        alignment=ft.Alignment(0, 0),
                                        border=ft.border.all(1, f"{COLORS['error']}20")
                                    ),
                                ],
                                vertical_alignment=ft.CrossAxisAlignment.CENTER,
                            ),
                            ft.Container(height=4),
                            ft.Text(
                                "Capture actions on your device to create workflows",
                                size=14,
                                weight=ft.FontWeight.W_400,
                                color=COLORS["text_secondary"],
                            ),
                        ],
                        spacing=4,
                    ),
                    ft.Container(expand=True),
                    self._recording_indicator,
                ],
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.only(bottom=8),
        )

    def _build_recording_controls(self):
        """Build the recording control buttons section."""
        is_recording = self.recording_state == RecordingState.RECORDING
        is_paused = self.recording_state == RecordingState.PAUSED
        is_idle = self.recording_state == RecordingState.IDLE

        # Start button
        start_btn = ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.FIBER_MANUAL_RECORD,
                            size=18,
                            color=COLORS["text_inverse"],
                        ),
                        width=36,
                        height=36,
                        bgcolor=f"{COLORS['error_dark']}40",
                        border_radius=RADIUS["sm"],
                        alignment=ft.Alignment(0, 0),
                    ),
                    ft.Container(width=12),
                    ft.Text(
                        "Start Recording",
                        size=14,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["text_inverse"],
                    ),
                ],
            ),
            bgcolor=COLORS["error"],
            padding=ft.padding.only(left=10, right=20, top=12, bottom=12),
            border_radius=RADIUS["lg"],
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            animate_scale=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            visible=is_idle,
            on_click=self._on_start_recording,
            on_hover=self._on_danger_hover,
        )

        # Pause button
        pause_btn = ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.PAUSE if is_recording else ft.Icons.PLAY_ARROW,
                            size=18,
                            color=COLORS["text_inverse"],
                        ),
                        width=36,
                        height=36,
                        bgcolor=f"{COLORS['warning_dark']}40",
                        border_radius=RADIUS["sm"],
                        alignment=ft.Alignment(0, 0),
                    ),
                    ft.Container(width=12),
                    ft.Text(
                        "Pause" if is_recording else "Resume",
                        size=14,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["text_inverse"],
                    ),
                ],
            ),
            bgcolor=COLORS["warning"],
            padding=ft.padding.only(left=10, right=20, top=12, bottom=12),
            border_radius=RADIUS["lg"],
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            animate_scale=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            visible=is_recording or is_paused,
            on_click=self._on_pause_recording,
            on_hover=self._on_warning_hover,
        )

        # Stop button
        stop_btn = ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.STOP,
                            size=18,
                            color=COLORS["text_inverse"],
                        ),
                        width=36,
                        height=36,
                        bgcolor=f"{COLORS['primary_dark']}40",
                        border_radius=RADIUS["sm"],
                        alignment=ft.Alignment(0, 0),
                    ),
                    ft.Container(width=12),
                    ft.Text(
                        "Stop & Save",
                        size=14,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["text_inverse"],
                    ),
                ],
            ),
            bgcolor=COLORS["primary"],
            padding=ft.padding.only(left=10, right=20, top=12, bottom=12),
            border_radius=RADIUS["lg"],
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            animate_scale=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            visible=is_recording or is_paused,
            on_click=self._on_stop_recording,
            on_hover=self._on_primary_hover,
        )

        # Discard button
        discard_btn = ft.Container(
            content=ft.Row(
                [
                    ft.Icon(
                        ft.Icons.DELETE_OUTLINE,
                        size=18,
                        color=COLORS["text_secondary"],
                    ),
                    ft.Container(width=8),
                    ft.Text(
                        "Discard",
                        size=14,
                        weight=ft.FontWeight.W_500,
                        color=COLORS["text_secondary"],
                    ),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=16, vertical=12),
            border_radius=RADIUS["lg"],
            bgcolor=COLORS["bg_tertiary"],
            border=ft.border.all(1, COLORS["border_subtle"]),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            visible=is_recording or is_paused,
            on_click=self._on_discard_recording,
            on_hover=self._on_button_hover,
        )

        self._control_buttons = ft.Container(
            content=ft.Row(
                [
                    start_btn,
                    pause_btn,
                    ft.Container(width=12),
                    stop_btn,
                    ft.Container(width=12),
                    discard_btn,
                ],
                spacing=0,
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["xl"],
            padding=24,
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("xs"),
        )

        return self._control_buttons

    def _build_stats_section(self):
        """Build the recording stats cards."""
        duration = self._get_recording_duration()
        steps_count = len(self.workflow_steps)

        stats = [
            {
                "title": "Events Captured",
                "value": str(self.event_count),
                "subtitle": "Actions recorded",
                "icon": ft.Icons.TOUCH_APP_ROUNDED,
                "color": COLORS["accent_purple"],
            },
            {
                "title": "Workflow Steps",
                "value": str(steps_count),
                "subtitle": "Generated steps",
                "icon": ft.Icons.CHECKLIST_ROUNDED,
                "color": COLORS["accent_cyan"],
            },
            {
                "title": "Duration",
                "value": duration,
                "subtitle": "Recording time",
                "icon": ft.Icons.TIMER_ROUNDED,
                "color": COLORS["warning"],
            },
            {
                "title": "Device",
                "value": "Connected" if self.device_id else "None",
                "subtitle": self.device_id[:12] + "..." if self.device_id and len(self.device_id) > 12 else (self.device_id or "No device"),
                "icon": ft.Icons.SMARTPHONE_ROUNDED,
                "color": COLORS["success"] if self.device_id else COLORS["text_muted"],
            },
        ]

        cards = [self._build_stat_card(s) for s in stats]
        self._stats_row = ft.Row(cards, spacing=20)

        return self._stats_row

    def _build_stat_card(self, stat: dict):
        """Build a single stat card with enhanced styling."""
        color = stat["color"]

        return ft.Container(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            ft.Text(
                                stat["title"],
                                size=13,
                                weight=ft.FontWeight.W_500,
                                color=COLORS["text_secondary"],
                            ),
                            ft.Container(expand=True),
                            ft.Container(
                                content=ft.Icon(
                                    stat["icon"],
                                    size=24,
                                    color=color,
                                ),
                                width=52,
                                height=52,
                                border_radius=RADIUS["lg"],
                                bgcolor=f"{color}12",
                                alignment=ft.Alignment(0, 0),
                                border=ft.border.all(1, f"{color}20")
                            ),
                        ],
                        vertical_alignment=ft.CrossAxisAlignment.START,
                    ),
                    ft.Container(height=16),
                    ft.Text(
                        stat["value"],
                        size=36,
                        weight=ft.FontWeight.W_800,
                        color=COLORS["text_primary"],
                    ),
                    ft.Container(height=6),
                    ft.Text(
                        stat["subtitle"],
                        size=12,
                        weight=ft.FontWeight.W_400,
                        color=COLORS["text_muted"],
                    ),
                ],
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["xl"],
            padding=24,
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("xs"),
            expand=True,
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            animate_scale=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            on_hover=lambda e, c=color: self._on_stat_hover(e, c),
        )

    def _build_event_list_section(self):
        """Build the live event list section."""
        if not self.workflow_steps:
            event_content = self._build_empty_event_list()
        else:
            event_items = [self._build_event_item(step, i) for i, step in enumerate(self.workflow_steps)]
            event_content = ft.Column(event_items, spacing=8)

        self._event_list_container = ft.Container(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.LIST_ALT_ROUNDED,
                                    size=20,
                                    color=COLORS["accent_purple"],
                                ),
                                width=40,
                                height=40,
                                border_radius=RADIUS["md"],
                                bgcolor=f"{COLORS['accent_purple']}12",
                                alignment=ft.Alignment(0, 0),
                                border=ft.border.all(1, f"{COLORS['accent_purple']}20"),
                            ),
                            ft.Container(width=14),
                            ft.Column(
                                [
                                    ft.Text(
                                        "Recorded Events",
                                        size=17,
                                        weight=ft.FontWeight.W_700,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Text(
                                        f"{len(self.workflow_steps)} step{'s' if len(self.workflow_steps) != 1 else ''} recorded",
                                        size=12,
                                        color=COLORS["text_secondary"],
                                    ),
                                ],
                                spacing=2,
                                expand=True,
                            ),
                            ft.Container(
                                content=ft.Row(
                                    [
                                        ft.Icon(ft.Icons.CLEAR_ALL_ROUNDED, size=16, color=COLORS["text_secondary"]),
                                        ft.Container(width=6),
                                        ft.Text("Clear All", size=12, weight=ft.FontWeight.W_500, color=COLORS["text_secondary"]),
                                    ],
                                ),
                                padding=ft.padding.symmetric(horizontal=14, vertical=10),
                                border_radius=RADIUS["md"],
                                bgcolor=COLORS["bg_tertiary"],
                                border=ft.border.all(1, COLORS["border_subtle"]),
                                animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                                visible=len(self.workflow_steps) > 0,
                                on_click=self._on_clear_events,
                                on_hover=self._on_button_hover,
                            ),
                        ],
                    ),
                    ft.Container(height=20),
                    event_content,
                ],
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["xl"],
            padding=28,
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("xs"),
            expand=True,
        )

        return self._event_list_container

    def _build_empty_event_list(self):
        """Build empty state for event list."""
        return ft.Container(
            content=ft.Column(
                [
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.TOUCH_APP_ROUNDED,
                            size=44,
                            color=COLORS["text_muted"],
                        ),
                        width=88,
                        height=88,
                        border_radius=RADIUS["xl"],
                        bgcolor=COLORS["bg_tertiary"],
                        alignment=ft.Alignment(0, 0),
                        border=ft.border.all(1, COLORS["border_subtle"]),
                    ),
                    ft.Container(height=24),
                    ft.Text(
                        "No Events Recorded",
                        size=18,
                        weight=ft.FontWeight.W_700,
                        color=COLORS["text_primary"],
                    ),
                    ft.Container(height=8),
                    ft.Text(
                        "Start recording to capture actions from your device.\nTaps, swipes, and text inputs will appear here.",
                        size=13,
                        weight=ft.FontWeight.W_400,
                        color=COLORS["text_muted"],
                        text_align=ft.TextAlign.CENTER,
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.symmetric(vertical=40),
            alignment=ft.Alignment(0, 0),
        )

    def _build_event_item(self, step: WorkflowStep, index: int):
        """Build a single event item card."""
        # Get action icon and color
        action_config = self._get_action_config(step.action)

        return ft.Container(
            content=ft.Row(
                [
                    # Step number
                    ft.Container(
                        content=ft.Text(
                            str(index + 1),
                            size=12,
                            weight=ft.FontWeight.W_700,
                            color=COLORS["text_inverse"],
                        ),
                        width=28,
                        height=28,
                        border_radius=RADIUS["full"],
                        bgcolor=action_config["color"],
                        alignment=ft.Alignment(0, 0),
                    ),
                    ft.Container(width=14),
                    # Action icon
                    ft.Container(
                        content=ft.Icon(
                            action_config["icon"],
                            size=20,
                            color=action_config["color"],
                        ),
                        width=40,
                        height=40,
                        border_radius=RADIUS["md"],
                        bgcolor=f"{action_config['color']}12",
                        alignment=ft.Alignment(0, 0),
                        border=ft.border.all(1, f"{action_config['color']}20"),
                    ),
                    ft.Container(width=14),
                    # Step info
                    ft.Column(
                        [
                            ft.Text(
                                step.name,
                                size=14,
                                weight=ft.FontWeight.W_600,
                                color=COLORS["text_primary"],
                            ),
                            ft.Container(height=2),
                            ft.Row(
                                [
                                    ft.Container(
                                        content=ft.Text(
                                            step.action.value.upper(),
                                            size=10,
                                            weight=ft.FontWeight.W_600,
                                            color=action_config["color"],
                                        ),
                                        padding=ft.padding.symmetric(horizontal=8, vertical=3),
                                        border_radius=RADIUS["xs"],
                                        bgcolor=f"{action_config['color']}12",
                                    ),
                                    ft.Container(width=8),
                                    ft.Text(
                                        self._get_selector_info(step.selector) if step.selector else "No selector",
                                        size=11,
                                        color=COLORS["text_muted"],
                                    ),
                                ],
                            ),
                        ],
                        spacing=0,
                        expand=True,
                    ),
                    # Timestamp
                    ft.Text(
                        step.timestamp.strftime("%H:%M:%S") if step.timestamp else "",
                        size=11,
                        color=COLORS["text_muted"],
                    ),
                    ft.Container(width=12),
                    # Delete button
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.CLOSE_ROUNDED,
                            size=16,
                            color=COLORS["text_muted"],
                        ),
                        width=32,
                        height=32,
                        border_radius=RADIUS["sm"],
                        bgcolor=COLORS["bg_tertiary"],
                        alignment=ft.Alignment(0, 0),
                        border=ft.border.all(1, COLORS["border_subtle"]),
                        animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                        on_click=lambda e, sid=step.id: self._on_remove_step(sid),
                        on_hover=lambda e: self._on_action_hover(e, COLORS["error"]),
                    ),
                ],
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            bgcolor=COLORS["bg_tertiary"],
            border_radius=RADIUS["lg"],
            padding=ft.padding.symmetric(horizontal=16, vertical=12),
            border=ft.border.all(1, COLORS["border_subtle"]),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            on_hover=self._on_card_hover,
        )

    def _get_action_config(self, action: ActionType) -> Dict[str, Any]:
        """Get icon and color for an action type."""
        configs = {
            ActionType.TAP: {"icon": ft.Icons.TOUCH_APP_ROUNDED, "color": COLORS["accent_purple"]},
            ActionType.LONG_TAP: {"icon": ft.Icons.TOUCH_APP_ROUNDED, "color": COLORS["accent_violet"]},
            ActionType.SWIPE: {"icon": ft.Icons.SWIPE_ROUNDED, "color": COLORS["accent_cyan"]},
            ActionType.SCROLL: {"icon": ft.Icons.UNFOLD_MORE_ROUNDED, "color": COLORS["accent_teal"]},
            ActionType.INPUT_TEXT: {"icon": ft.Icons.KEYBOARD_ROUNDED, "color": COLORS["accent_orange"]},
            ActionType.WAIT: {"icon": ft.Icons.HOURGLASS_EMPTY_ROUNDED, "color": COLORS["warning"]},
        }
        return configs.get(action, {"icon": ft.Icons.HELP_ROUNDED, "color": COLORS["text_muted"]})

    def _get_selector_info(self, selector: ElementSelector) -> str:
        """Get a short description of a selector."""
        if selector.type == SelectorType.RESOURCE_ID:
            # Extract just the ID name
            value = selector.value
            if ":id/" in value:
                value = value.split(":id/")[-1]
            return f"id: {value[:30]}..." if len(value) > 30 else f"id: {value}"
        elif selector.type == SelectorType.CONTENT_DESC:
            return f"desc: {selector.value[:25]}..." if len(selector.value) > 25 else f"desc: {selector.value}"
        elif selector.type == SelectorType.TEXT:
            return f"text: {selector.value[:25]}..." if len(selector.value) > 25 else f"text: {selector.value}"
        elif selector.type == SelectorType.BOUNDS:
            return f"bounds: {selector.value}"
        else:
            return selector.value[:30]

    def _get_state_label(self) -> str:
        """Get the label for the current recording state."""
        labels = {
            RecordingState.IDLE: "Ready",
            RecordingState.RECORDING: "Recording...",
            RecordingState.PAUSED: "Paused",
            RecordingState.STOPPED: "Stopped",
        }
        return labels.get(self.recording_state, "Unknown")

    def _get_recording_duration(self) -> str:
        """Get the formatted recording duration."""
        if not self.recording_start_time:
            return "0:00"

        elapsed = datetime.now() - self.recording_start_time
        minutes = int(elapsed.total_seconds() // 60)
        seconds = int(elapsed.total_seconds() % 60)
        return f"{minutes}:{seconds:02d}"

    # Event handlers

    async def _on_start_recording(self, e):
        """Handle start recording button click."""
        if not self.device_id:
            self.toast.warning("Please select a device first")
            return

        self.recording_state = RecordingState.RECORDING
        self.recording_start_time = datetime.now()
        self.recorded_events = []
        self.workflow_steps = []
        self.event_count = 0

        self.toast.success("Recording started")
        self._refresh_ui()

    async def _on_pause_recording(self, e):
        """Handle pause/resume button click."""
        if self.recording_state == RecordingState.RECORDING:
            self.recording_state = RecordingState.PAUSED
            self.toast.info("Recording paused")
        else:
            self.recording_state = RecordingState.RECORDING
            self.toast.info("Recording resumed")

        self._refresh_ui()

    async def _on_stop_recording(self, e):
        """Handle stop recording button click."""
        self.recording_state = RecordingState.STOPPED

        if self.workflow_steps:
            # Create workflow from recorded steps
            workflow = Workflow(
                name=f"Recording {datetime.now().strftime('%Y-%m-%d %H:%M')}",
                description="Auto-generated workflow from recording",
                steps=self.workflow_steps,
                device_info={"device_id": self.device_id} if self.device_id else None,
            )

            if self.on_recording_complete:
                self.on_recording_complete(workflow)

            self.toast.success(f"Saved workflow with {len(self.workflow_steps)} steps")
        else:
            self.toast.warning("No steps recorded")

        # Reset state
        self.recording_state = RecordingState.IDLE
        self._refresh_ui()

    async def _on_discard_recording(self, e):
        """Handle discard button click."""
        self.recording_state = RecordingState.IDLE
        self.recorded_events = []
        self.workflow_steps = []
        self.recording_start_time = None
        self.event_count = 0

        self.toast.info("Recording discarded")
        self._refresh_ui()

    async def _on_clear_events(self, e):
        """Handle clear all events."""
        self.workflow_steps = []
        self.event_count = 0
        self.toast.info("Events cleared")
        self._refresh_ui()

    async def _on_remove_step(self, step_id: str):
        """Handle removing a single step."""
        self.workflow_steps = [s for s in self.workflow_steps if s.id != step_id]
        self.toast.info("Step removed")
        self._refresh_ui()

    def add_event(self, event_data: Dict[str, Any]):
        """Add a captured event from the device.

        This method is called by the recording service when an event
        is received from the Android device.

        Args:
            event_data: Dictionary containing event data from Android.
        """
        if self.recording_state != RecordingState.RECORDING:
            return

        self.event_count += 1
        self.recorded_events.append(event_data)

        # Generate selector
        selector = self.selector_generator.generate_selector(event_data)

        # Determine action type
        action_type_str = event_data.get("type", "tap").lower()
        try:
            action_type = ActionType(action_type_str)
        except ValueError:
            action_type = ActionType.TAP

        # Generate step name
        step_name = self.step_namer.generate_name(
            action_type_str,
            event_data,
            event_data.get("action_data", {})
        )

        # Create workflow step
        step = WorkflowStep(
            action=action_type,
            selector=selector,
            name=step_name,
            order=len(self.workflow_steps),
            timestamp=datetime.now(),
            metadata=event_data,
        )

        self.workflow_steps.append(step)
        self._refresh_ui()

    def _refresh_ui(self):
        """Refresh the UI after state changes."""
        self.content = self._build_content()
        self.update()

    def set_device(self, device_id: str):
        """Set the device ID for recording.

        Args:
            device_id: The device serial/ID to record from.
        """
        self.device_id = device_id
        self._refresh_ui()

    # Hover handlers (following patterns from workflows.py)

    def _on_primary_hover(self, e):
        """Handle primary button hover effect."""
        if e.data == "true":
            
            e.control.scale = 1.02
        else:
            
            e.control.scale = 1.0
        e.control.update()

    def _on_danger_hover(self, e):
        """Handle danger button hover effect."""
        if e.data == "true":
            
            e.control.scale = 1.02
        else:
            
            e.control.scale = 1.0
        e.control.update()

    def _on_warning_hover(self, e):
        """Handle warning button hover effect."""
        if e.data == "true":
            
            e.control.scale = 1.02
        else:
            
            e.control.scale = 1.0
        e.control.update()

    def _on_button_hover(self, e):
        """Handle secondary button hover effect."""
        if e.data == "true":
            e.control.bgcolor = COLORS["bg_hover"]
            e.control.border = ft.border.all(1, COLORS["border_light"])
        else:
            e.control.bgcolor = COLORS["bg_tertiary"]
            e.control.border = ft.border.all(1, COLORS["border_subtle"])
        e.control.update()

    def _on_card_hover(self, e):
        """Handle card hover effect."""
        if e.data == "true":
            e.control.bgcolor = COLORS["bg_hover"]
            e.control.border = ft.border.all(1, COLORS["border_light"])
            
        else:
            e.control.bgcolor = COLORS["bg_tertiary"]
            e.control.border = ft.border.all(1, COLORS["border_subtle"])
            pass  # shadow removed
        e.control.update()

    def _on_stat_hover(self, e, color):
        """Handle stat card hover effect."""
        if e.data == "true":
            e.control.border = ft.border.all(1, f"{color}40")
            
            e.control.scale = 1.02
        else:
            e.control.border = ft.border.all(1, COLORS["border"])
            e.control.shadow = get_shadow("xs")
            e.control.scale = 1.0
        e.control.update()

    def _on_action_hover(self, e, color):
        """Handle action button hover."""
        if e.data == "true":
            e.control.bgcolor = f"{color}15"
            e.control.border = ft.border.all(1, f"{color}30")
            
        else:
            e.control.bgcolor = COLORS["bg_tertiary"]
            e.control.border = ft.border.all(1, COLORS["border_subtle"])
            pass  # shadow removed
        e.control.update()
