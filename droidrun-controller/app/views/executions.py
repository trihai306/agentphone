"""Professional Executions view for Droidrun Controller - 2025 Edition.

Polished with improved execution history cards, better status indicators,
and refined filtering with enhanced styling.
"""

import flet as ft
from datetime import datetime
from ..theme import get_colors, RADIUS, get_shadow, ANIMATION
from ..components.card import Card



# Dynamic color proxy - acts like a dict but always gets current theme colors
class _DynamicColors:
    def get(self, key, default=None):
        return get_colors().get(key, default)
    
    def __getitem__(self, key):
        return get_colors()[key]

COLORS = _DynamicColors()

class ExecutionsView(ft.Container):
    """Professional view for monitoring workflow executions."""

    def __init__(self, app_state, toast, **kwargs):
        self.app_state = app_state
        self.toast = toast
        self.executions = []
        self.loading = False
        self.filter_status = "all"  # all, running, completed, failed

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
                self._build_filter_bar(),
                ft.Container(height=20),
                self._build_executions_section(),
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
                                        "Executions",
                                        size=32,
                                        weight=ft.FontWeight.W_800,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Container(width=16),
                                    ft.Container(
                                        content=ft.Icon(
                                            ft.Icons.HISTORY_ROUNDED,
                                            size=22,
                                            color=COLORS["accent_cyan"],
                                        ),
                                        width=44,
                                        height=44,
                                        bgcolor=f"{COLORS['accent_cyan']}12",
                                        border_radius=RADIUS["lg"],
                                        alignment=ft.Alignment(0, 0),
                                        border=ft.border.all(1, f"{COLORS['accent_cyan']}20")
                                    ),
                                    ft.Container(width=12),
                                    ft.Container(
                                        content=ft.Text(
                                            str(len(self.executions)),
                                            size=12,
                                            weight=ft.FontWeight.W_600,
                                            color=COLORS["text_inverse"],
                                        ),
                                        bgcolor=COLORS["accent_cyan"],
                                        border_radius=12,
                                        padding=ft.padding.symmetric(horizontal=10, vertical=4),
                                    ),
                                ],
                                vertical_alignment=ft.CrossAxisAlignment.CENTER,
                            ),
                            ft.Container(height=4),
                            ft.Text(
                                "Monitor and manage workflow executions",
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
                                                ft.Icons.DELETE_SWEEP_ROUNDED,
                                                size=16,
                                                color=COLORS["text_secondary"],
                                            ),
                                            width=32,
                                            height=32,
                                            bgcolor=COLORS["bg_tertiary"],
                                            border_radius=RADIUS["sm"],
                                            alignment=ft.Alignment(0, 0),
                                        ),
                                        ft.Container(width=10),
                                        ft.Text(
                                            "Clear History",
                                            size=13,
                                            weight=ft.FontWeight.W_500,
                                            color=COLORS["text_secondary"],
                                        ),
                                    ],
                                ),
                                padding=ft.padding.only(left=8, right=18, top=10, bottom=10),
                                border_radius=RADIUS["lg"],
                                border=ft.border.all(1, COLORS["border"]),
                                animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
                                on_click=self._on_clear_history,
                                on_hover=self._on_button_hover,
                            ),
                            ft.Container(width=12),
                            ft.Container(
                                content=ft.Row(
                                    [
                                        ft.Container(
                                            content=ft.Icon(
                                                ft.Icons.REFRESH_ROUNDED,
                                                size=18,
                                                color=COLORS["text_inverse"],
                                            ),
                                            width=32,
                                            height=32,
                                            bgcolor=f"{COLORS['primary_dark']}40",
                                            border_radius=RADIUS["sm"],
                                            alignment=ft.Alignment(0, 0),
                                        ),
                                        ft.Container(width=10),
                                        ft.Text(
                                            "Refresh",
                                            size=13,
                                            weight=ft.FontWeight.W_600,
                                            color=COLORS["text_inverse"],
                                        ),
                                    ],
                                ),
                                bgcolor=COLORS["primary"],
                                padding=ft.padding.only(left=8, right=18, top=10, bottom=10),
                                border_radius=RADIUS["lg"],
                                animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
                                animate_scale=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
                                on_click=self._on_refresh,
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
        running = len([e for e in self.executions if e.get("status") == "running"])
        completed = len([e for e in self.executions if e.get("status") == "completed"])
        failed = len([e for e in self.executions if e.get("status") == "failed"])
        total = len(self.executions)

        # Calculate success rate
        success_rate = int((completed / total) * 100) if total > 0 else 0

        stats = [
            {
                "title": "Total Executions",
                "value": str(total),
                "subtitle": "All time recorded",
                "icon": ft.Icons.HISTORY_ROUNDED,
                "color": COLORS["accent_cyan"],
                "trend": None,
            },
            {
                "title": "Running",
                "value": str(running),
                "subtitle": "Currently active",
                "icon": ft.Icons.PLAY_CIRCLE_ROUNDED,
                "color": COLORS["info"],
                "trend": "up" if running > 0 else None,
            },
            {
                "title": "Completed",
                "value": str(completed),
                "subtitle": "Successfully finished",
                "icon": ft.Icons.CHECK_CIRCLE_ROUNDED,
                "color": COLORS["success"],
                "trend": "up" if completed > 0 else None,
            },
            {
                "title": "Success Rate",
                "value": f"{success_rate}%",
                "subtitle": f"{failed} failed execution{'s' if failed != 1 else ''}",
                "icon": ft.Icons.TRENDING_UP_ROUNDED if success_rate >= 80 else ft.Icons.TRENDING_DOWN_ROUNDED,
                "color": COLORS["success"] if success_rate >= 80 else COLORS["warning"] if success_rate >= 50 else COLORS["error"],
                "trend": "up" if success_rate >= 80 else "down" if success_rate < 50 else None,
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
                alignment=ft.Alignment(0, 0),
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
                                alignment=ft.Alignment(0, 0),
                                border=ft.border.all(1, f"{color}20")
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
            
            e.control.scale = 1.02
        else:
            e.control.border = ft.border.all(1, COLORS["border"])
            e.control.shadow = get_shadow("xs")
            e.control.scale = 1.0
        e.control.update()

    def _build_filter_bar(self):
        """Build the status filter bar."""
        filters = [
            {"key": "all", "label": "All", "icon": ft.Icons.LIST_ROUNDED, "color": COLORS["text_secondary"]},
            {"key": "running", "label": "Running", "icon": ft.Icons.PLAY_CIRCLE_ROUNDED, "color": COLORS["info"]},
            {"key": "completed", "label": "Completed", "icon": ft.Icons.CHECK_CIRCLE_ROUNDED, "color": COLORS["success"]},
            {"key": "failed", "label": "Failed", "icon": ft.Icons.ERROR_ROUNDED, "color": COLORS["error"]},
        ]

        filter_chips = []
        for f in filters:
            is_active = self.filter_status == f["key"]
            filter_chips.append(self._build_filter_chip(f, is_active))

        return ft.Container(
            content=ft.Row(
                [
                    ft.Text(
                        "Filter by status:",
                        size=13,
                        weight=ft.FontWeight.W_500,
                        color=COLORS["text_secondary"],
                    ),
                    ft.Container(width=16),
                    ft.Row(filter_chips, spacing=8),
                    ft.Container(expand=True),
                    # Search field placeholder
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(
                                    ft.Icons.SEARCH_ROUNDED,
                                    size=18,
                                    color=COLORS["text_muted"],
                                ),
                                ft.Container(width=10),
                                ft.Text(
                                    "Search executions...",
                                    size=13,
                                    color=COLORS["text_muted"],
                                ),
                            ],
                        ),
                        padding=ft.padding.symmetric(horizontal=16, vertical=12),
                        border_radius=RADIUS["lg"],
                        bgcolor=COLORS["bg_input"],
                        border=ft.border.all(1, COLORS["border_subtle"]),
                        width=260,
                    ),
                ],
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
        )

    def _build_filter_chip(self, filter_data: dict, is_active: bool):
        """Build a single filter chip."""
        color = filter_data["color"]

        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(
                        filter_data["icon"],
                        size=16,
                        color=COLORS["text_inverse"] if is_active else color,
                    ),
                    ft.Container(width=6),
                    ft.Text(
                        filter_data["label"],
                        size=12,
                        weight=ft.FontWeight.W_600 if is_active else ft.FontWeight.W_500,
                        color=COLORS["text_inverse"] if is_active else COLORS["text_secondary"],
                    ),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=14, vertical=10),
            border_radius=RADIUS["md"],
            bgcolor=color if is_active else COLORS["bg_tertiary"],
            border=ft.border.all(1, f"{color}30" if is_active else COLORS["border_subtle"]) if is_active else None,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            on_click=lambda e, key=filter_data["key"]: self._on_filter_click(key),
            on_hover=lambda e, c=color, active=is_active: self._on_filter_hover(e, c, active),
        )

    def _on_filter_click(self, key: str):
        """Handle filter chip click."""
        self.filter_status = key
        self.content = self._build_content()
        self.update()

    def _on_filter_hover(self, e, color, is_active):
        """Handle filter chip hover."""
        if is_active:
            return
        if e.data == "true":
            e.control.bgcolor = f"{color}15"
            e.control.border = ft.border.all(1, f"{color}30")
        else:
            e.control.bgcolor = COLORS["bg_tertiary"]
            e.control.border = ft.border.all(1, COLORS["border_subtle"])
        e.control.update()

    def _get_filtered_executions(self):
        """Get executions filtered by current status."""
        if self.filter_status == "all":
            return self.executions
        return [e for e in self.executions if e.get("status") == self.filter_status]

    def _build_executions_section(self):
        """Build the executions list section."""
        if self.loading:
            return self._build_loading()

        filtered_executions = self._get_filtered_executions()

        if not self.executions:
            return self._build_empty_state()

        if not filtered_executions:
            return self._build_no_results_state()

        execution_items = [self._build_execution_card(e) for e in filtered_executions]

        return ft.Container(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.TIMELINE_ROUNDED,
                                    size=20,
                                    color=COLORS["accent_cyan"],
                                ),
                                width=40,
                                height=40,
                                border_radius=RADIUS["md"],
                                bgcolor=f"{COLORS['accent_cyan']}12",
                                alignment=ft.Alignment(0, 0),
                                border=ft.border.all(1, f"{COLORS['accent_cyan']}20"),
                            ),
                            ft.Container(width=14),
                            ft.Column(
                                [
                                    ft.Text(
                                        "Execution History",
                                        size=17,
                                        weight=ft.FontWeight.W_700,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Text(
                                        f"{len(filtered_executions)} execution{'s' if len(filtered_executions) != 1 else ''} {f'({self.filter_status})' if self.filter_status != 'all' else ''}",
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
                                        ft.Icon(ft.Icons.FILE_DOWNLOAD_ROUNDED, size=16, color=COLORS["text_secondary"]),
                                        ft.Container(width=6),
                                        ft.Text("Export", size=12, weight=ft.FontWeight.W_500, color=COLORS["text_secondary"]),
                                    ],
                                ),
                                padding=ft.padding.symmetric(horizontal=14, vertical=10),
                                border_radius=RADIUS["md"],
                                bgcolor=COLORS["bg_tertiary"],
                                border=ft.border.all(1, COLORS["border_subtle"]),
                                animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                                on_click=self._on_export,
                                on_hover=self._on_button_hover,
                            ),
                        ],
                    ),
                    ft.Container(height=20),
                    ft.Column(execution_items, spacing=12),
                ],
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["xl"],
            padding=28,
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("xs"),
        )

    def _build_execution_card(self, execution: dict):
        """Build a polished execution card with enhanced styling."""
        status = execution.get("status", "pending")
        is_running = status == "running"
        is_success = status == "completed"
        is_failed = status == "failed"

        # Format duration
        duration = execution.get("duration")
        duration_text = f"{duration}s" if duration else "..."

        # Format time
        started_at = execution.get("started_at")
        time_text = started_at.strftime("%H:%M:%S") if isinstance(started_at, datetime) else str(started_at) if started_at else "--"

        # Get status color and icon
        status_config = {
            "running": (COLORS["info"], ft.Icons.PLAY_CIRCLE_ROUNDED),
            "completed": (COLORS["success"], ft.Icons.CHECK_CIRCLE_ROUNDED),
            "failed": (COLORS["error"], ft.Icons.ERROR_ROUNDED),
            "pending": (COLORS["text_muted"], ft.Icons.SCHEDULE_ROUNDED),
        }
        status_color, status_icon = status_config.get(status, (COLORS["text_muted"], ft.Icons.HELP_ROUNDED))

        # Status indicator with glow effect for running
        status_indicator = ft.Container(
            width=12,
            height=12,
            border_radius=6,
            bgcolor=status_color,
            border=ft.border.all(2, COLORS["bg_card"]) if is_running else None,
        )

        return ft.Container(
            content=ft.Row(
                [
                    # Workflow icon with status indicator (Stack-based)
                    ft.Stack(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.ACCOUNT_TREE_ROUNDED,
                                    size=24,
                                    color=COLORS["accent_purple"] if is_success else status_color if is_failed else COLORS["text_secondary"],
                                ),
                                width=56,
                                height=56,
                                border_radius=RADIUS["lg"],
                                bgcolor=f"{COLORS['accent_purple']}12" if is_success else f"{status_color}12",
                                alignment=ft.Alignment(0, 0),
                                border=ft.border.all(1, f"{COLORS['accent_purple']}20" if is_success else f"{status_color}20"),
                            ),
                            ft.Container(
                                content=status_indicator,
                                right=-2,
                                bottom=-2,
                            ),
                        ],
                    ),
                    ft.Container(width=16),
                    # Execution info
                    ft.Column(
                        [
                            ft.Text(
                                execution.get("workflow_name", "Unknown Workflow"),
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
                                                    ft.Icons.PHONE_ANDROID_ROUNDED,
                                                    size=12,
                                                    color=COLORS["accent_blue"],
                                                ),
                                                ft.Container(width=4),
                                                ft.Text(
                                                    execution.get("device_name", "Unknown Device"),
                                                    size=11,
                                                    weight=ft.FontWeight.W_500,
                                                    color=COLORS["text_secondary"],
                                                ),
                                            ],
                                        ),
                                        padding=ft.padding.symmetric(horizontal=8, vertical=4),
                                        border_radius=RADIUS["sm"],
                                        bgcolor=f"{COLORS['accent_blue']}10",
                                    ),
                                    ft.Container(width=8),
                                    ft.Icon(
                                        ft.Icons.ACCESS_TIME_ROUNDED,
                                        size=14,
                                        color=COLORS["text_muted"],
                                    ),
                                    ft.Container(width=4),
                                    ft.Text(
                                        time_text,
                                        size=12,
                                        color=COLORS["text_muted"],
                                    ),
                                ],
                            ),
                        ],
                        spacing=0,
                        expand=True,
                    ),
                    # Duration badge
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(
                                    ft.Icons.TIMER_ROUNDED,
                                    size=14,
                                    color=COLORS["text_secondary"],
                                ),
                                ft.Container(width=6),
                                ft.Text(
                                    duration_text,
                                    size=13,
                                    weight=ft.FontWeight.W_600,
                                    color=COLORS["text_primary"],
                                ),
                            ],
                        ),
                        bgcolor=COLORS["bg_tertiary"],
                        border_radius=RADIUS["md"],
                        padding=ft.padding.symmetric(horizontal=12, vertical=8),
                        border=ft.border.all(1, COLORS["border_subtle"]),
                    ),
                    ft.Container(width=12),
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
                                    status.capitalize(),
                                    size=11,
                                    weight=ft.FontWeight.W_600,
                                    color=status_color,
                                ),
                            ],
                        ),
                        bgcolor=f"{status_color}15",
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
                                    ft.Icons.VISIBILITY_ROUNDED,
                                    size=18,
                                    color=COLORS["text_muted"],
                                ),
                                width=38,
                                height=38,
                                border_radius=RADIUS["md"],
                                bgcolor=COLORS["bg_tertiary"],
                                alignment=ft.Alignment(0, 0),
                                border=ft.border.all(1, COLORS["border_subtle"]),
                                animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                                tooltip="View Details",
                                on_click=lambda e, ex=execution: self._on_view(ex),
                                on_hover=lambda e: self._on_action_hover(e, COLORS["text_secondary"]),
                            ),
                            ft.Container(width=8),
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.STOP_ROUNDED if is_running else ft.Icons.REPLAY_ROUNDED,
                                    size=18,
                                    color=COLORS["error"] if is_running else COLORS["primary"],
                                ),
                                width=38,
                                height=38,
                                border_radius=RADIUS["md"],
                                bgcolor=f"{COLORS['error']}10" if is_running else f"{COLORS['primary']}10",
                                alignment=ft.Alignment(0, 0),
                                border=ft.border.all(1, f"{COLORS['error']}20" if is_running else f"{COLORS['primary']}20"),
                                animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                                tooltip="Stop" if is_running else "Retry",
                                on_click=lambda e, ex=execution: self._on_action(ex),
                                on_hover=lambda e, running=is_running: self._on_action_hover(e, COLORS["error"] if running else COLORS["primary"]),
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
                                alignment=ft.Alignment(0, 0),
                                border=ft.border.all(1, f"{COLORS['error']}15"),
                                animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                                tooltip="Delete",
                                on_click=lambda e, ex=execution: self._on_delete(ex),
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
            
        else:
            if color == COLORS["error"]:
                e.control.bgcolor = f"{color}08"
                e.control.border = ft.border.all(1, f"{color}15")
            elif color == COLORS["primary"]:
                e.control.bgcolor = f"{color}10"
                e.control.border = ft.border.all(1, f"{color}20")
            else:
                e.control.bgcolor = COLORS["bg_tertiary"]
                e.control.border = ft.border.all(1, COLORS["border_subtle"])
            pass  # shadow removed
        e.control.update()

    def _build_empty_state(self):
        """Build polished empty state when no executions."""
        return ft.Container(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.TIMELINE_ROUNDED,
                                    size=20,
                                    color=COLORS["accent_cyan"],
                                ),
                                width=40,
                                height=40,
                                border_radius=RADIUS["md"],
                                bgcolor=f"{COLORS['accent_cyan']}12",
                                alignment=ft.Alignment(0, 0),
                                border=ft.border.all(1, f"{COLORS['accent_cyan']}20"),
                            ),
                            ft.Container(width=14),
                            ft.Column(
                                [
                                    ft.Text(
                                        "Execution History",
                                        size=17,
                                        weight=ft.FontWeight.W_700,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Text(
                                        "No executions recorded yet",
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
                                        ft.Icons.HISTORY_ROUNDED,
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
                                    "No Executions Yet",
                                    size=18,
                                    weight=ft.FontWeight.W_700,
                                    color=COLORS["text_primary"],
                                ),
                                ft.Container(height=8),
                                ft.Text(
                                    "Run a workflow or use the AI Agent to see\nexecution history here.",
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
                                                    ft.Icon(ft.Icons.ACCOUNT_TREE_ROUNDED, size=18, color=COLORS["text_inverse"]),
                                                    ft.Container(width=8),
                                                    ft.Text(
                                                        "View Workflows",
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
                                            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                                            on_click=self._on_view_workflows,
                                            on_hover=self._on_primary_hover,
                                        ),
                                    ],
                                    alignment=ft.MainAxisAlignment.CENTER,
                                ),
                            ],
                            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                        ),
                        padding=ft.padding.symmetric(vertical=40),
                        alignment=ft.Alignment(0, 0),
                    ),
                ],
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["xl"],
            padding=28,
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("xs"),
        )

    def _build_no_results_state(self):
        """Build state when filter returns no results."""
        return ft.Container(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.TIMELINE_ROUNDED,
                                    size=20,
                                    color=COLORS["accent_cyan"],
                                ),
                                width=40,
                                height=40,
                                border_radius=RADIUS["md"],
                                bgcolor=f"{COLORS['accent_cyan']}12",
                                alignment=ft.Alignment(0, 0),
                                border=ft.border.all(1, f"{COLORS['accent_cyan']}20"),
                            ),
                            ft.Container(width=14),
                            ft.Column(
                                [
                                    ft.Text(
                                        "Execution History",
                                        size=17,
                                        weight=ft.FontWeight.W_700,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Text(
                                        f"No {self.filter_status} executions found",
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
                                    content=ft.Icon(
                                        ft.Icons.FILTER_LIST_OFF_ROUNDED,
                                        size=36,
                                        color=COLORS["text_muted"],
                                    ),
                                    width=72,
                                    height=72,
                                    border_radius=RADIUS["xl"],
                                    bgcolor=COLORS["bg_tertiary"],
                                    alignment=ft.Alignment(0, 0),
                                    border=ft.border.all(1, COLORS["border_subtle"]),
                                ),
                                ft.Container(height=16),
                                ft.Text(
                                    f"No {self.filter_status.capitalize()} Executions",
                                    size=15,
                                    weight=ft.FontWeight.W_600,
                                    color=COLORS["text_primary"],
                                ),
                                ft.Container(height=6),
                                ft.Text(
                                    "Try selecting a different filter.",
                                    size=13,
                                    color=COLORS["text_muted"],
                                ),
                                ft.Container(height=20),
                                ft.Container(
                                    content=ft.Text(
                                        "Show All",
                                        size=13,
                                        weight=ft.FontWeight.W_600,
                                        color=COLORS["primary"],
                                    ),
                                    padding=ft.padding.symmetric(horizontal=16, vertical=10),
                                    border_radius=RADIUS["md"],
                                    bgcolor=f"{COLORS['primary']}12",
                                    border=ft.border.all(1, f"{COLORS['primary']}20"),
                                    on_click=lambda e: self._on_filter_click("all"),
                                ),
                            ],
                            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                        ),
                        padding=ft.padding.symmetric(vertical=32),
                        alignment=ft.Alignment(0, 0),
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
                                    ft.Icons.TIMELINE_ROUNDED,
                                    size=20,
                                    color=COLORS["accent_cyan"],
                                ),
                                width=40,
                                height=40,
                                border_radius=RADIUS["md"],
                                bgcolor=f"{COLORS['accent_cyan']}12",
                                alignment=ft.Alignment(0, 0),
                                border=ft.border.all(1, f"{COLORS['accent_cyan']}20"),
                            ),
                            ft.Container(width=14),
                            ft.Column(
                                [
                                    ft.Text(
                                        "Execution History",
                                        size=17,
                                        weight=ft.FontWeight.W_700,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Text(
                                        "Loading executions...",
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
                                        color=COLORS["accent_cyan"],
                                    ),
                                    width=72,
                                    height=72,
                                    border_radius=RADIUS["xl"],
                                    bgcolor=COLORS["bg_tertiary"],
                                    alignment=ft.Alignment(0, 0),
                                    border=ft.border.all(1, COLORS["border_subtle"]),
                                ),
                                ft.Container(height=16),
                                ft.Text(
                                    "Loading executions...",
                                    size=14,
                                    weight=ft.FontWeight.W_500,
                                    color=COLORS["text_secondary"],
                                ),
                            ],
                            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                        ),
                        padding=ft.padding.symmetric(vertical=40),
                        alignment=ft.Alignment(0, 0),
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
            
            e.control.scale = 1.02
        else:
            
            e.control.scale = 1.0
        e.control.update()

    def _on_button_hover(self, e):
        """Handle button hover effect."""
        if e.data == "true":
            e.control.bgcolor = COLORS["bg_hover"]
            e.control.border = ft.border.all(1, COLORS["border_light"])
        else:
            e.control.bgcolor = "transparent"
            e.control.border = ft.border.all(1, COLORS["border"])
        e.control.update()

    def _on_card_hover(self, e):
        """Handle card hover effect."""
        if e.data == "true":
            e.control.bgcolor = COLORS["bg_hover"]
            e.control.border = ft.border.all(1, COLORS["border_light"])
            
            e.control.scale = 1.01
        else:
            e.control.bgcolor = COLORS["bg_tertiary"]
            e.control.border = ft.border.all(1, COLORS["border_subtle"])
            pass  # shadow removed
            e.control.scale = 1.0
        e.control.update()

    async def _on_refresh(self, e):
        """Handle refresh button click."""
        self.loading = True
        self.content = self._build_content()
        self.update()
        await self.load_executions()

    async def _on_clear_history(self, e):
        """Handle clear history button click."""
        self.toast.warning("Clear execution history?")

    async def _on_view(self, execution: dict):
        """Handle view execution action."""
        self.toast.info(f"Viewing execution: {execution.get('id')}")

    async def _on_action(self, execution: dict):
        """Handle stop/retry action."""
        if execution.get("status") == "running":
            self.toast.warning("Stopping execution...")
        else:
            self.toast.info("Retrying execution...")

    async def _on_delete(self, execution: dict):
        """Handle delete execution action."""
        self.toast.warning(f"Delete execution #{execution.get('id')}?")

    async def _on_view_workflows(self, e):
        """Handle view workflows action."""
        self.toast.info("Navigating to workflows...")

    async def _on_export(self, e):
        """Handle export action."""
        self.toast.info("Exporting execution history...")

    async def load_executions(self):
        """Load executions from backend."""
        self.loading = True
        try:
            # This will be connected to backend service
            # For now, use mock data
            self.executions = [
                {
                    "id": 1,
                    "workflow_name": "Login Flow",
                    "device_name": "Pixel 6",
                    "status": "completed",
                    "duration": 12,
                    "started_at": "10:30:45",
                },
                {
                    "id": 2,
                    "workflow_name": "Data Export",
                    "device_name": "Samsung Galaxy S21",
                    "status": "running",
                    "duration": None,
                    "started_at": "10:35:20",
                },
                {
                    "id": 3,
                    "workflow_name": "Login Flow",
                    "device_name": "Pixel 6",
                    "status": "failed",
                    "duration": 5,
                    "started_at": "10:28:00",
                },
            ]
            self.toast.success("Executions refreshed")
        except Exception as ex:
            self.toast.error(f"Failed to load executions: {ex}")
            self.executions = []
        finally:
            self.loading = False
            self.content = self._build_content()
            self.update()

    def refresh(self):
        """Refresh the view."""
        self.content = self._build_content()
        self.update()
