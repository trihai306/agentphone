"""Professional Workflows view for Droidrun Controller - 2025 Edition.

Polished with improved workflow cards, better list styling, and enhanced empty state.
Integrated with recording controls and action feed for workflow recording.
"""

import asyncio
import flet as ft
from typing import Optional
from ..theme import COLORS, RADIUS, get_shadow, ANIMATION
from ..components.card import Card
from ..components.recorder_controls import RecorderControls
from ..components.action_feed import ActionFeed
from ..backend import backend
from ..services.recording_service import get_recording_service, ActionEvent


class WorkflowsView(ft.Container):
    """Professional view for managing automation workflows."""

    def __init__(self, app_state, toast, **kwargs):
        self.app_state = app_state
        self.toast = toast
        self.workflows = []
        self.backend = backend
        self.loading = False

        # Recording state
        self._recording_service = get_recording_service()
        self._recording_session_id: Optional[str] = None
        self._recording_device_serial: Optional[str] = None
        self._recording_overlay: Optional[ft.Container] = None
        self._recorder_controls: Optional[RecorderControls] = None
        self._action_feed: Optional[ActionFeed] = None
        self._elapsed_timer_task: Optional[asyncio.Task] = None
        self._elapsed_seconds = 0

        super().__init__(
            content=self._build_content(),
            expand=True,
            **kwargs
        )

    def _build_content(self):
        """Build the view content."""
        return ft.Column(
            [
                self._build_header(),
                ft.Container(height=28),
                self._build_stats(),
                ft.Container(height=28),
                self._build_workflows_section(),
            ],
            spacing=0,
            expand=True,
            scroll=ft.ScrollMode.AUTO,
        )

    def _build_header(self):
        """Build the polished header section with enhanced styling."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Column(
                        [
                            ft.Row(
                                [
                                    ft.Text(
                                        "Workflows",
                                        size=32,
                                        weight=ft.FontWeight.W_800,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Container(width=16),
                                    ft.Container(
                                        content=ft.Icon(
                                            ft.Icons.ACCOUNT_TREE_ROUNDED,
                                            size=22,
                                            color=COLORS["accent_purple"],
                                        ),
                                        width=44,
                                        height=44,
                                        bgcolor=f"{COLORS['accent_purple']}12",
                                        border_radius=RADIUS["lg"],
                                        alignment=ft.alignment.center,
                                        border=ft.border.all(1, f"{COLORS['accent_purple']}20"),
                                        shadow=ft.BoxShadow(
                                            spread_radius=0,
                                            blur_radius=16,
                                            color=f"{COLORS['accent_purple']}25",
                                            offset=ft.Offset(0, 4),
                                        ),
                                    ),
                                    ft.Container(width=12),
                                    ft.Container(
                                        content=ft.Text(
                                            str(len(self.workflows)),
                                            size=12,
                                            weight=ft.FontWeight.W_600,
                                            color=COLORS["text_inverse"],
                                        ),
                                        bgcolor=COLORS["accent_purple"],
                                        border_radius=12,
                                        padding=ft.padding.symmetric(horizontal=10, vertical=4),
                                    ),
                                ],
                                vertical_alignment=ft.CrossAxisAlignment.CENTER,
                            ),
                            ft.Container(height=4),
                            ft.Text(
                                "Create and manage automation workflows",
                                size=14,
                                weight=ft.FontWeight.W_400,
                                color=COLORS["text_secondary"],
                            ),
                        ],
                        spacing=4,
                    ),
                    ft.Container(expand=True),
                    # Quick actions
                    ft.Row(
                        [
                            ft.Container(
                                content=ft.Row(
                                    [
                                        ft.Container(
                                            content=ft.Icon(
                                                ft.Icons.FIBER_MANUAL_RECORD,
                                                size=14,
                                                color=COLORS["text_inverse"],
                                            ),
                                            width=32,
                                            height=32,
                                            bgcolor=f"{COLORS['error_dark']}40",
                                            border_radius=RADIUS["sm"],
                                            alignment=ft.alignment.center,
                                        ),
                                        ft.Container(width=10),
                                        ft.Text(
                                            "Record",
                                            size=13,
                                            weight=ft.FontWeight.W_600,
                                            color=COLORS["text_inverse"],
                                        ),
                                    ],
                                ),
                                bgcolor=COLORS["error"],
                                padding=ft.padding.only(left=8, right=18, top=10, bottom=10),
                                border_radius=RADIUS["lg"],
                                shadow=ft.BoxShadow(
                                    spread_radius=0,
                                    blur_radius=16,
                                    color=f"{COLORS['error']}35",
                                    offset=ft.Offset(0, 4),
                                ),
                                animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
                                animate_scale=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
                                on_click=self._on_record,
                                on_hover=self._on_danger_hover,
                            ),
                            ft.Container(width=12),
                            ft.Container(
                                content=ft.Row(
                                    [
                                        ft.Container(
                                            content=ft.Icon(
                                                ft.Icons.ADD,
                                                size=18,
                                                color=COLORS["text_inverse"],
                                            ),
                                            width=32,
                                            height=32,
                                            bgcolor=f"{COLORS['primary_dark']}40",
                                            border_radius=RADIUS["sm"],
                                            alignment=ft.alignment.center,
                                        ),
                                        ft.Container(width=10),
                                        ft.Text(
                                            "New Workflow",
                                            size=13,
                                            weight=ft.FontWeight.W_600,
                                            color=COLORS["text_inverse"],
                                        ),
                                    ],
                                ),
                                bgcolor=COLORS["primary"],
                                padding=ft.padding.only(left=8, right=18, top=10, bottom=10),
                                border_radius=RADIUS["lg"],
                                shadow=ft.BoxShadow(
                                    spread_radius=0,
                                    blur_radius=20,
                                    color=f"{COLORS['primary']}40",
                                    offset=ft.Offset(0, 6),
                                ),
                                animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
                                animate_scale=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
                                on_click=self._on_new_workflow,
                                on_hover=self._on_primary_hover,
                            ),
                        ],
                        spacing=0,
                    ),
                ],
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.only(bottom=8),
        )

    def _build_stats(self):
        """Build the enhanced stats cards row."""
        total = len(self.workflows)
        active = len([w for w in self.workflows if w.get("is_active")])
        steps_total = sum(len(w.get("steps", [])) for w in self.workflows)

        stats = [
            {
                "title": "Total Workflows",
                "value": str(total),
                "subtitle": "Created in workspace",
                "icon": ft.Icons.ACCOUNT_TREE_ROUNDED,
                "color": COLORS["accent_purple"],
                "trend": None,
            },
            {
                "title": "Active",
                "value": str(active),
                "subtitle": "Ready to run",
                "icon": ft.Icons.PLAY_CIRCLE_ROUNDED,
                "color": COLORS["success"],
                "trend": "up" if active > 0 else None,
            },
            {
                "title": "Total Steps",
                "value": str(steps_total),
                "subtitle": "Across all workflows",
                "icon": ft.Icons.CHECKLIST_ROUNDED,
                "color": COLORS["accent_cyan"],
                "trend": None,
            },
            {
                "title": "Run Today",
                "value": "0",
                "subtitle": "Executions today",
                "icon": ft.Icons.TODAY_ROUNDED,
                "color": COLORS["warning"],
                "trend": None,
            },
        ]

        cards = [self._build_stat_card(s) for s in stats]

        return ft.Row(cards, spacing=20)

    def _build_stat_card(self, stat: dict):
        """Build a single enhanced stat card with hover effects."""
        color = stat["color"]

        # Build trend indicator if provided
        trend_indicator = None
        if stat.get("trend"):
            trend_color = COLORS["success"] if stat["trend"] == "up" else COLORS["error"]
            trend_icon = ft.Icons.ARROW_UPWARD_ROUNDED if stat["trend"] == "up" else ft.Icons.ARROW_DOWNWARD_ROUNDED
            trend_indicator = ft.Container(
                content=ft.Icon(
                    trend_icon,
                    size=14,
                    color=trend_color,
                ),
                width=24,
                height=24,
                border_radius=6,
                bgcolor=f"{trend_color}15",
                alignment=ft.alignment.center,
            )

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
                                alignment=ft.alignment.center,
                                border=ft.border.all(1, f"{color}20"),
                                shadow=ft.BoxShadow(
                                    spread_radius=0,
                                    blur_radius=16,
                                    color=f"{color}25",
                                    offset=ft.Offset(0, 4),
                                ),
                            ),
                        ],
                        vertical_alignment=ft.CrossAxisAlignment.START,
                    ),
                    ft.Container(height=16),
                    ft.Row(
                        [
                            ft.Text(
                                stat["value"],
                                size=36,
                                weight=ft.FontWeight.W_800,
                                color=COLORS["text_primary"],
                            ),
                            ft.Container(width=8),
                            trend_indicator,
                        ] if trend_indicator else [
                            ft.Text(
                                stat["value"],
                                size=36,
                                weight=ft.FontWeight.W_800,
                                color=COLORS["text_primary"],
                            ),
                        ],
                        vertical_alignment=ft.CrossAxisAlignment.END,
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
            data={"color": color},
        )

    def _on_stat_hover(self, e, color):
        """Handle stat card hover effect."""
        if e.data == "true":
            e.control.border = ft.border.all(1, f"{color}40")
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=28,
                color=f"{color}20",
                offset=ft.Offset(0, 10),
            )
            e.control.scale = 1.02
        else:
            e.control.border = ft.border.all(1, COLORS["border"])
            e.control.shadow = get_shadow("xs")
            e.control.scale = 1.0
        e.control.update()

    def _build_workflows_section(self):
        """Build the workflows list section."""
        if self.loading:
            return self._build_loading()

        if not self.workflows:
            return self._build_empty_state()

        workflow_items = [self._build_workflow_card(w) for w in self.workflows]

        return ft.Container(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.FOLDER_SPECIAL_ROUNDED,
                                    size=20,
                                    color=COLORS["accent_purple"],
                                ),
                                width=40,
                                height=40,
                                border_radius=RADIUS["md"],
                                bgcolor=f"{COLORS['accent_purple']}12",
                                alignment=ft.alignment.center,
                                border=ft.border.all(1, f"{COLORS['accent_purple']}20"),
                            ),
                            ft.Container(width=14),
                            ft.Column(
                                [
                                    ft.Text(
                                        "All Workflows",
                                        size=17,
                                        weight=ft.FontWeight.W_700,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Text(
                                        f"{len(self.workflows)} workflow{'s' if len(self.workflows) != 1 else ''} created",
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
                                        ft.Icon(ft.Icons.FILE_UPLOAD_ROUNDED, size=16, color=COLORS["text_secondary"]),
                                        ft.Container(width=6),
                                        ft.Text("Import", size=12, weight=ft.FontWeight.W_500, color=COLORS["text_secondary"]),
                                    ],
                                ),
                                padding=ft.padding.symmetric(horizontal=14, vertical=10),
                                border_radius=RADIUS["md"],
                                bgcolor=COLORS["bg_tertiary"],
                                border=ft.border.all(1, COLORS["border_subtle"]),
                                animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                                on_click=self._on_import,
                                on_hover=self._on_button_hover,
                            ),
                        ],
                    ),
                    ft.Container(height=20),
                    ft.Column(workflow_items, spacing=12),
                ],
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["xl"],
            padding=28,
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("xs"),
        )

    def _build_workflow_card(self, workflow: dict):
        """Build a polished workflow card with enhanced styling."""
        is_active = workflow.get("is_active", False)
        steps_count = len(workflow.get("steps", []))
        description = workflow.get("description", "No description")
        name = workflow.get("name", "Unnamed Workflow")

        # Status colors
        status_color = COLORS["success"] if is_active else COLORS["text_muted"]
        status_bg = f"{COLORS['success']}15" if is_active else COLORS["bg_tertiary"]

        return ft.Container(
            content=ft.Row(
                [
                    # Workflow icon with status indicator
                    ft.Stack(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.ACCOUNT_TREE_ROUNDED,
                                    size=24,
                                    color=COLORS["accent_purple"] if is_active else COLORS["text_muted"],
                                ),
                                width=56,
                                height=56,
                                border_radius=RADIUS["lg"],
                                bgcolor=f"{COLORS['accent_purple']}12" if is_active else COLORS["bg_tertiary"],
                                alignment=ft.alignment.center,
                                border=ft.border.all(1, f"{COLORS['accent_purple']}20" if is_active else COLORS["border_subtle"]),
                            ),
                            ft.Container(
                                content=ft.Container(
                                    width=12,
                                    height=12,
                                    border_radius=6,
                                    bgcolor=status_color,
                                    border=ft.border.all(2, COLORS["bg_card"]),
                                    shadow=ft.BoxShadow(
                                        spread_radius=1,
                                        blur_radius=6,
                                        color=f"{status_color}50",
                                        offset=ft.Offset(0, 0),
                                    ) if is_active else None,
                                ),
                                right=-2,
                                bottom=-2,
                            ),
                        ],
                    ),
                    ft.Container(width=16),
                    # Workflow info
                    ft.Column(
                        [
                            ft.Text(
                                name,
                                size=15,
                                weight=ft.FontWeight.W_600,
                                color=COLORS["text_primary"],
                            ),
                            ft.Container(height=4),
                            ft.Row(
                                [
                                    ft.Container(
                                        content=ft.Row(
                                            [
                                                ft.Icon(
                                                    ft.Icons.CHECKLIST_ROUNDED,
                                                    size=12,
                                                    color=COLORS["accent_cyan"],
                                                ),
                                                ft.Container(width=4),
                                                ft.Text(
                                                    f"{steps_count} step{'s' if steps_count != 1 else ''}",
                                                    size=11,
                                                    weight=ft.FontWeight.W_500,
                                                    color=COLORS["text_secondary"],
                                                ),
                                            ],
                                        ),
                                        padding=ft.padding.symmetric(horizontal=8, vertical=4),
                                        border_radius=RADIUS["sm"],
                                        bgcolor=f"{COLORS['accent_cyan']}10",
                                    ),
                                    ft.Container(width=8),
                                    ft.Text(
                                        description[:45] + "..." if len(description) > 45 else description,
                                        size=12,
                                        color=COLORS["text_muted"],
                                    ),
                                ],
                            ),
                        ],
                        spacing=0,
                        expand=True,
                    ),
                    # Status badge
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Container(
                                    width=6,
                                    height=6,
                                    border_radius=3,
                                    bgcolor=status_color,
                                ),
                                ft.Container(width=6),
                                ft.Text(
                                    "Active" if is_active else "Inactive",
                                    size=11,
                                    weight=ft.FontWeight.W_600,
                                    color=status_color,
                                ),
                            ],
                        ),
                        bgcolor=status_bg,
                        padding=ft.padding.symmetric(horizontal=12, vertical=8),
                        border_radius=RADIUS["md"],
                        border=ft.border.all(1, f"{status_color}20"),
                    ),
                    ft.Container(width=16),
                    # Action buttons
                    ft.Row(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.PLAY_ARROW_ROUNDED,
                                    size=20,
                                    color=COLORS["success"],
                                ),
                                width=38,
                                height=38,
                                border_radius=RADIUS["md"],
                                bgcolor=f"{COLORS['success']}10",
                                alignment=ft.alignment.center,
                                border=ft.border.all(1, f"{COLORS['success']}20"),
                                animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                                tooltip="Run Workflow",
                                on_click=lambda e, w=workflow: self._on_run(w),
                                on_hover=lambda e: self._on_action_hover(e, COLORS["success"]),
                            ),
                            ft.Container(width=8),
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.EDIT_ROUNDED,
                                    size=18,
                                    color=COLORS["text_muted"],
                                ),
                                width=38,
                                height=38,
                                border_radius=RADIUS["md"],
                                bgcolor=COLORS["bg_tertiary"],
                                alignment=ft.alignment.center,
                                border=ft.border.all(1, COLORS["border_subtle"]),
                                animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                                tooltip="Edit",
                                on_click=lambda e, w=workflow: self._on_edit(w),
                                on_hover=lambda e: self._on_action_hover(e, COLORS["text_secondary"]),
                            ),
                            ft.Container(width=8),
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.CONTENT_COPY_ROUNDED,
                                    size=18,
                                    color=COLORS["text_muted"],
                                ),
                                width=38,
                                height=38,
                                border_radius=RADIUS["md"],
                                bgcolor=COLORS["bg_tertiary"],
                                alignment=ft.alignment.center,
                                border=ft.border.all(1, COLORS["border_subtle"]),
                                animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                                tooltip="Duplicate",
                                on_click=lambda e, w=workflow: self._on_duplicate(w),
                                on_hover=lambda e: self._on_action_hover(e, COLORS["text_secondary"]),
                            ),
                            ft.Container(width=8),
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.DELETE_OUTLINE_ROUNDED,
                                    size=18,
                                    color=COLORS["error"],
                                ),
                                width=38,
                                height=38,
                                border_radius=RADIUS["md"],
                                bgcolor=f"{COLORS['error']}08",
                                alignment=ft.alignment.center,
                                border=ft.border.all(1, f"{COLORS['error']}15"),
                                animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                                tooltip="Delete",
                                on_click=lambda e, w=workflow: self._on_delete(w),
                                on_hover=lambda e: self._on_action_hover(e, COLORS["error"]),
                            ),
                        ],
                        spacing=0,
                    ),
                ],
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            bgcolor=COLORS["bg_tertiary"],
            border_radius=RADIUS["lg"],
            padding=ft.padding.symmetric(horizontal=20, vertical=18),
            border=ft.border.all(1, COLORS["border_subtle"]),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            animate_scale=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            on_hover=self._on_card_hover,
        )

    def _on_action_hover(self, e, color):
        """Handle action button hover."""
        if e.data == "true":
            e.control.bgcolor = f"{color}15"
            e.control.border = ft.border.all(1, f"{color}30")
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=8,
                color=f"{color}20",
                offset=ft.Offset(0, 2),
            )
        else:
            if color == COLORS["success"]:
                e.control.bgcolor = f"{color}10"
                e.control.border = ft.border.all(1, f"{color}20")
            elif color == COLORS["error"]:
                e.control.bgcolor = f"{color}08"
                e.control.border = ft.border.all(1, f"{color}15")
            else:
                e.control.bgcolor = COLORS["bg_tertiary"]
                e.control.border = ft.border.all(1, COLORS["border_subtle"])
            e.control.shadow = None
        e.control.update()

    def _build_empty_state(self):
        """Build polished empty state when no workflows."""
        return ft.Container(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.FOLDER_SPECIAL_ROUNDED,
                                    size=20,
                                    color=COLORS["accent_purple"],
                                ),
                                width=40,
                                height=40,
                                border_radius=RADIUS["md"],
                                bgcolor=f"{COLORS['accent_purple']}12",
                                alignment=ft.alignment.center,
                                border=ft.border.all(1, f"{COLORS['accent_purple']}20"),
                            ),
                            ft.Container(width=14),
                            ft.Column(
                                [
                                    ft.Text(
                                        "All Workflows",
                                        size=17,
                                        weight=ft.FontWeight.W_700,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Text(
                                        "No workflows created yet",
                                        size=12,
                                        color=COLORS["text_secondary"],
                                    ),
                                ],
                                spacing=2,
                            ),
                        ],
                    ),
                    ft.Container(height=20),
                    # Empty state content
                    ft.Container(
                        content=ft.Column(
                            [
                                ft.Container(
                                    content=ft.Icon(
                                        ft.Icons.ACCOUNT_TREE_ROUNDED,
                                        size=44,
                                        color=COLORS["text_muted"],
                                    ),
                                    width=88,
                                    height=88,
                                    border_radius=RADIUS["xl"],
                                    bgcolor=COLORS["bg_tertiary"],
                                    alignment=ft.alignment.center,
                                    border=ft.border.all(1, COLORS["border_subtle"]),
                                ),
                                ft.Container(height=24),
                                ft.Text(
                                    "No Workflows Yet",
                                    size=18,
                                    weight=ft.FontWeight.W_700,
                                    color=COLORS["text_primary"],
                                ),
                                ft.Container(height=8),
                                ft.Text(
                                    "Create your first workflow to automate tasks on Android devices.\nWorkflows can be recorded, imported, or built from scratch.",
                                    size=13,
                                    weight=ft.FontWeight.W_400,
                                    color=COLORS["text_muted"],
                                    text_align=ft.TextAlign.CENTER,
                                ),
                                ft.Container(height=28),
                                ft.Row(
                                    [
                                        ft.Container(
                                            content=ft.Row(
                                                [
                                                    ft.Icon(ft.Icons.FIBER_MANUAL_RECORD, size=14, color=COLORS["text_inverse"]),
                                                    ft.Container(width=8),
                                                    ft.Text(
                                                        "Record Actions",
                                                        size=13,
                                                        weight=ft.FontWeight.W_600,
                                                        color=COLORS["text_inverse"],
                                                    ),
                                                ],
                                                alignment=ft.MainAxisAlignment.CENTER,
                                            ),
                                            bgcolor=COLORS["error"],
                                            border_radius=RADIUS["md"],
                                            padding=ft.padding.symmetric(horizontal=20, vertical=12),
                                            shadow=ft.BoxShadow(
                                                spread_radius=0,
                                                blur_radius=16,
                                                color=f"{COLORS['error']}35",
                                                offset=ft.Offset(0, 4),
                                            ),
                                            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                                            on_click=self._on_record,
                                            on_hover=self._on_danger_hover,
                                        ),
                                        ft.Container(width=12),
                                        ft.Container(
                                            content=ft.Row(
                                                [
                                                    ft.Icon(ft.Icons.ADD, size=18, color=COLORS["text_inverse"]),
                                                    ft.Container(width=8),
                                                    ft.Text(
                                                        "Create Workflow",
                                                        size=13,
                                                        weight=ft.FontWeight.W_600,
                                                        color=COLORS["text_inverse"],
                                                    ),
                                                ],
                                                alignment=ft.MainAxisAlignment.CENTER,
                                            ),
                                            bgcolor=COLORS["primary"],
                                            border_radius=RADIUS["md"],
                                            padding=ft.padding.symmetric(horizontal=20, vertical=12),
                                            shadow=ft.BoxShadow(
                                                spread_radius=0,
                                                blur_radius=16,
                                                color=f"{COLORS['primary']}35",
                                                offset=ft.Offset(0, 4),
                                            ),
                                            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                                            on_click=self._on_new_workflow,
                                            on_hover=self._on_primary_hover,
                                        ),
                                    ],
                                    alignment=ft.MainAxisAlignment.CENTER,
                                ),
                            ],
                            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                        ),
                        padding=ft.padding.symmetric(vertical=40),
                        alignment=ft.alignment.center,
                    ),
                ],
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["xl"],
            padding=28,
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("xs"),
        )

    def _build_loading(self):
        """Build polished loading state."""
        return ft.Container(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.FOLDER_SPECIAL_ROUNDED,
                                    size=20,
                                    color=COLORS["accent_purple"],
                                ),
                                width=40,
                                height=40,
                                border_radius=RADIUS["md"],
                                bgcolor=f"{COLORS['accent_purple']}12",
                                alignment=ft.alignment.center,
                                border=ft.border.all(1, f"{COLORS['accent_purple']}20"),
                            ),
                            ft.Container(width=14),
                            ft.Column(
                                [
                                    ft.Text(
                                        "All Workflows",
                                        size=17,
                                        weight=ft.FontWeight.W_700,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Text(
                                        "Loading workflows...",
                                        size=12,
                                        color=COLORS["text_secondary"],
                                    ),
                                ],
                                spacing=2,
                            ),
                        ],
                    ),
                    ft.Container(height=20),
                    ft.Container(
                        content=ft.Column(
                            [
                                ft.Container(
                                    content=ft.ProgressRing(
                                        width=40,
                                        height=40,
                                        stroke_width=3,
                                        color=COLORS["accent_purple"],
                                    ),
                                    width=72,
                                    height=72,
                                    border_radius=RADIUS["xl"],
                                    bgcolor=COLORS["bg_tertiary"],
                                    alignment=ft.alignment.center,
                                    border=ft.border.all(1, COLORS["border_subtle"]),
                                ),
                                ft.Container(height=16),
                                ft.Text(
                                    "Loading workflows...",
                                    size=14,
                                    weight=ft.FontWeight.W_500,
                                    color=COLORS["text_secondary"],
                                ),
                            ],
                            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                        ),
                        padding=ft.padding.symmetric(vertical=40),
                        alignment=ft.alignment.center,
                    ),
                ],
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["xl"],
            padding=28,
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("xs"),
        )

    def _on_primary_hover(self, e):
        """Handle primary button hover effect."""
        if e.data == "true":
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=28,
                color=f"{COLORS['primary']}55",
                offset=ft.Offset(0, 10),
            )
            e.control.scale = 1.02
        else:
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=20,
                color=f"{COLORS['primary']}40",
                offset=ft.Offset(0, 6),
            )
            e.control.scale = 1.0
        e.control.update()

    def _on_danger_hover(self, e):
        """Handle danger button hover effect."""
        if e.data == "true":
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=24,
                color=f"{COLORS['error']}50",
                offset=ft.Offset(0, 8),
            )
            e.control.scale = 1.02
        else:
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=16,
                color=f"{COLORS['error']}35",
                offset=ft.Offset(0, 4),
            )
            e.control.scale = 1.0
        e.control.update()

    def _on_button_hover(self, e):
        """Handle button hover effect."""
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
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=20,
                color="#00000020",
                offset=ft.Offset(0, 6),
            )
            e.control.scale = 1.01
        else:
            e.control.bgcolor = COLORS["bg_tertiary"]
            e.control.border = ft.border.all(1, COLORS["border_subtle"])
            e.control.shadow = None
            e.control.scale = 1.0
        e.control.update()

    async def _on_record(self, e):
        """Handle record button click - show device selection then recording overlay."""
        # Get available devices from app_state
        devices = getattr(self.app_state, 'devices', [])
        if not devices:
            self.toast.warning("No devices connected. Please connect a device first.")
            return

        # If only one device, use it directly
        if len(devices) == 1:
            device = devices[0]
            device_serial = device.get('serial', device.get('id', ''))
            device_name = device.get('name', device.get('model', 'Device'))
            await self._start_recording_for_device(device_serial, device_name)
        else:
            # Show device selection dialog
            await self._show_device_selection_dialog(devices)

    async def _show_device_selection_dialog(self, devices):
        """Show a dialog to select which device to record on."""
        device_options = []
        for device in devices:
            device_serial = device.get('serial', device.get('id', ''))
            device_name = device.get('name', device.get('model', 'Device'))
            device_options.append({
                'serial': device_serial,
                'name': device_name,
            })

        # Create selection dialog
        selected_device = {'serial': None, 'name': None}

        def on_device_select(e):
            idx = int(e.control.data)
            selected_device['serial'] = device_options[idx]['serial']
            selected_device['name'] = device_options[idx]['name']
            dialog.open = False
            self.page.update()

        async def on_confirm(e):
            if selected_device['serial']:
                dialog.open = False
                self.page.update()
                await self._start_recording_for_device(
                    selected_device['serial'],
                    selected_device['name']
                )

        device_buttons = []
        for i, opt in enumerate(device_options):
            device_buttons.append(
                ft.Container(
                    content=ft.Row(
                        [
                            ft.Icon(ft.Icons.SMARTPHONE, size=20, color=COLORS["accent_purple"]),
                            ft.Container(width=12),
                            ft.Column(
                                [
                                    ft.Text(
                                        opt['name'],
                                        size=14,
                                        weight=ft.FontWeight.W_600,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Text(
                                        opt['serial'],
                                        size=11,
                                        color=COLORS["text_muted"],
                                    ),
                                ],
                                spacing=2,
                            ),
                        ],
                    ),
                    padding=ft.padding.symmetric(horizontal=16, vertical=12),
                    border_radius=RADIUS["md"],
                    bgcolor=COLORS["bg_tertiary"],
                    border=ft.border.all(1, COLORS["border_subtle"]),
                    on_click=on_device_select,
                    data=str(i),
                    animate=ft.Animation(150, ft.AnimationCurve.EASE_OUT),
                )
            )

        dialog = ft.AlertDialog(
            modal=True,
            title=ft.Text("Select Device to Record", weight=ft.FontWeight.W_600),
            content=ft.Container(
                content=ft.Column(
                    device_buttons,
                    spacing=8,
                ),
                width=350,
                padding=ft.padding.only(top=8),
            ),
            actions=[
                ft.TextButton("Cancel", on_click=lambda e: self._close_dialog(dialog)),
            ],
            actions_alignment=ft.MainAxisAlignment.END,
        )

        self.page.overlay.append(dialog)
        dialog.open = True
        self.page.update()

    def _close_dialog(self, dialog):
        """Close a dialog."""
        dialog.open = False
        self.page.update()

    async def _start_recording_for_device(self, device_serial: str, device_name: str):
        """Start recording on the specified device."""
        self._recording_device_serial = device_serial

        # Create recorder controls
        self._recorder_controls = RecorderControls(
            device_name=device_name,
            on_start=self._on_start_recording,
            on_stop=self._on_stop_recording,
            on_pause=self._on_pause_recording,
            on_resume=self._on_resume_recording,
            on_cancel=self._on_cancel_recording,
        )

        # Create action feed
        self._action_feed = ActionFeed(
            on_action_click=self._on_action_item_click,
        )

        # Build and show recording overlay
        self._show_recording_overlay()

    def _show_recording_overlay(self):
        """Show the recording overlay with controls and action feed."""
        # Build the overlay
        self._recording_overlay = ft.Container(
            content=ft.Stack(
                [
                    # Semi-transparent backdrop
                    ft.Container(
                        bgcolor="#00000080",
                        expand=True,
                        on_click=lambda e: None,  # Prevent clicks from passing through
                    ),
                    # Recording panel
                    ft.Container(
                        content=ft.Column(
                            [
                                # Header
                                ft.Container(
                                    content=ft.Row(
                                        [
                                            ft.Row(
                                                [
                                                    ft.Container(
                                                        content=ft.Icon(
                                                            ft.Icons.FIBER_MANUAL_RECORD,
                                                            size=18,
                                                            color=COLORS["error"],
                                                        ),
                                                        width=36,
                                                        height=36,
                                                        border_radius=RADIUS["md"],
                                                        bgcolor=f"{COLORS['error']}15",
                                                        alignment=ft.alignment.center,
                                                    ),
                                                    ft.Container(width=12),
                                                    ft.Text(
                                                        "Recording Session",
                                                        size=18,
                                                        weight=ft.FontWeight.W_700,
                                                        color=COLORS["text_primary"],
                                                    ),
                                                ],
                                            ),
                                            ft.IconButton(
                                                icon=ft.Icons.CLOSE,
                                                icon_color=COLORS["text_secondary"],
                                                icon_size=20,
                                                on_click=self._on_close_overlay,
                                                tooltip="Close",
                                            ),
                                        ],
                                        alignment=ft.MainAxisAlignment.SPACE_BETWEEN,
                                    ),
                                    padding=ft.padding.symmetric(horizontal=24, vertical=16),
                                    border=ft.border.only(bottom=ft.BorderSide(1, COLORS["border"])),
                                ),
                                # Main content - controls and feed side by side
                                ft.Container(
                                    content=ft.Row(
                                        [
                                            # Left side - Recorder Controls
                                            ft.Container(
                                                content=self._recorder_controls,
                                                width=380,
                                            ),
                                            ft.Container(width=24),
                                            # Right side - Action Feed
                                            ft.Container(
                                                content=self._action_feed,
                                                expand=True,
                                            ),
                                        ],
                                        expand=True,
                                    ),
                                    padding=24,
                                    expand=True,
                                ),
                            ],
                            spacing=0,
                            expand=True,
                        ),
                        width=900,
                        height=550,
                        bgcolor=COLORS["bg_card"],
                        border_radius=RADIUS["xl"],
                        border=ft.border.all(1, COLORS["border"]),
                        shadow=ft.BoxShadow(
                            spread_radius=0,
                            blur_radius=40,
                            color="#00000050",
                            offset=ft.Offset(0, 20),
                        ),
                        alignment=ft.alignment.center,
                    ),
                ],
                alignment=ft.alignment.center,
            ),
            expand=True,
        )

        # Add overlay to page
        self.page.overlay.append(self._recording_overlay)
        self.page.update()

    def _hide_recording_overlay(self):
        """Hide and cleanup the recording overlay."""
        if self._recording_overlay and self._recording_overlay in self.page.overlay:
            self.page.overlay.remove(self._recording_overlay)
            self.page.update()
        self._recording_overlay = None
        self._recorder_controls = None
        self._action_feed = None

    async def _on_start_recording(self, e):
        """Handle start recording button click."""
        if not self._recording_device_serial:
            self.toast.error("No device selected")
            return

        # Start recording session via service
        session_id = await self._recording_service.start_recording(
            self._recording_device_serial
        )

        if session_id:
            self._recording_session_id = session_id
            self._elapsed_seconds = 0

            # Update UI
            if self._recorder_controls:
                self._recorder_controls.start_recording()

            # Register callback for new actions
            self._recording_service.add_action_callback(
                session_id,
                self._on_action_received
            )

            # Start elapsed time timer
            self._start_elapsed_timer()

            self.toast.success("Recording started")
        else:
            self.toast.error("Failed to start recording. Check device connection.")

    async def _on_stop_recording(self, e):
        """Handle stop recording button click."""
        if not self._recording_session_id:
            return

        # Stop elapsed timer
        self._stop_elapsed_timer()

        # Stop recording and get actions
        actions = await self._recording_service.stop_recording(
            self._recording_session_id
        )

        # Update UI
        if self._recorder_controls:
            self._recorder_controls.stop_recording()

        if actions:
            # Generate workflow from recorded actions
            from ..services.recording_service import generate_workflow_from_session

            session = self._recording_service.get_session(self._recording_session_id)
            if session:
                workflow = generate_workflow_from_session(session)

                # Save workflow to backend
                try:
                    saved_workflow = await self.backend.save_workflow(workflow)
                    self.toast.success(
                        f"Workflow saved: {len(actions)} actions recorded"
                    )

                    # Refresh workflows list
                    await self.load_workflows()

                except Exception as ex:
                    self.toast.error(f"Failed to save workflow: {ex}")
        else:
            self.toast.info("No actions recorded")

        # Cleanup
        self._recording_service.cleanup_session(self._recording_session_id)
        self._recording_session_id = None

        # Hide overlay
        self._hide_recording_overlay()

    async def _on_pause_recording(self, e):
        """Handle pause recording button click."""
        # Update UI only (APK doesn't have pause support, we just stop polling)
        if self._recorder_controls:
            self._recorder_controls.pause_recording()
        self._stop_elapsed_timer()
        self.toast.info("Recording paused")

    async def _on_resume_recording(self, e):
        """Handle resume recording button click."""
        # Update UI only
        if self._recorder_controls:
            self._recorder_controls.resume_recording()
        self._start_elapsed_timer()
        self.toast.info("Recording resumed")

    async def _on_cancel_recording(self, e):
        """Handle cancel recording button click."""
        # Stop elapsed timer
        self._stop_elapsed_timer()

        # Stop recording without saving
        if self._recording_session_id:
            await self._recording_service.stop_recording(self._recording_session_id)
            self._recording_service.cleanup_session(self._recording_session_id)
            self._recording_session_id = None

        # Update UI
        if self._recorder_controls:
            self._recorder_controls.stop_recording()

        self.toast.info("Recording cancelled")

        # Hide overlay
        self._hide_recording_overlay()

    def _on_close_overlay(self, e):
        """Handle close overlay button click."""
        if self._recording_session_id:
            # Recording in progress, confirm cancel
            self.page.run_task(self._on_cancel_recording, e)
        else:
            self._hide_recording_overlay()

    def _on_action_received(self, action: ActionEvent):
        """Callback when a new action is received from the recording service."""
        if self._action_feed:
            # Convert ActionEvent to dict for ActionFeed
            action_dict = {
                "type": action.type,
                "timestamp": action.timestamp,
                "x": action.x,
                "y": action.y,
                "resource_id": action.resource_id,
                "content_desc": action.content_desc,
                "text": action.text,
                "class_name": action.class_name,
                "input_text": action.input_text,
            }
            self._action_feed.add_action(action_dict)

        if self._recorder_controls:
            self._recorder_controls.increment_action_count()

    def _on_action_item_click(self, index: int):
        """Handle action item click in the feed."""
        # Could show action details or allow editing
        pass

    def _start_elapsed_timer(self):
        """Start the elapsed time timer."""
        async def timer_loop():
            while True:
                await asyncio.sleep(1)
                self._elapsed_seconds += 1
                if self._recorder_controls:
                    self._recorder_controls.update_elapsed_time(self._elapsed_seconds)

        self._elapsed_timer_task = asyncio.create_task(timer_loop())

    def _stop_elapsed_timer(self):
        """Stop the elapsed time timer."""
        if self._elapsed_timer_task and not self._elapsed_timer_task.done():
            self._elapsed_timer_task.cancel()
        self._elapsed_timer_task = None

    async def _on_new_workflow(self, e):
        """Handle new workflow button click."""
        self.toast.info("Opening workflow editor...")

    async def _on_import(self, e):
        """Handle import button click."""
        self.toast.info("Import workflow from file...")

    async def _on_run(self, workflow: dict):
        """Handle run workflow action."""
        self.toast.info(f"Running workflow: {workflow.get('name')}")

    async def _on_edit(self, workflow: dict):
        """Handle edit workflow action."""
        self.toast.info(f"Editing: {workflow.get('name')}")

    async def _on_duplicate(self, workflow: dict):
        """Handle duplicate workflow action."""
        self.toast.success(f"Duplicated: {workflow.get('name')}")

    async def _on_delete(self, workflow: dict):
        """Handle delete workflow action."""
        self.toast.warning(f"Delete workflow: {workflow.get('name')}?")

    async def load_workflows(self):
        """Load workflows from backend."""
        self.loading = True
        self.content = self._build_content()
        self.update()

        try:
            self.workflows = await self.backend.get_workflows()
            self.toast.success(f"Loaded {len(self.workflows)} workflows")
        except Exception as ex:
            self.toast.error(f"Failed to load workflows: {ex}")
            self.workflows = []
        finally:
            self.loading = False
            self.content = self._build_content()
            self.update()

    def refresh(self):
        """Refresh the view."""
        self.content = self._build_content()
        self.update()
