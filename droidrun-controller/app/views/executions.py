"""Professional Executions view for Droidrun Controller."""

import flet as ft
from datetime import datetime
from ..theme import COLORS, RADIUS
from ..components.card import Card


class ExecutionsView(ft.Container):
    """Professional view for monitoring workflow executions."""

    def __init__(self, app_state, toast, **kwargs):
        self.app_state = app_state
        self.toast = toast
        self.executions = []
        self.loading = False

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
                self._build_executions_section(),
            ],
            spacing=0,
            expand=True,
            scroll=ft.ScrollMode.AUTO,
        )

    def _build_header(self):
        """Build the header section."""
        return ft.Row(
            [
                ft.Column(
                    [
                        ft.Row(
                            [
                                ft.Text(
                                    "Execution History",
                                    size=28,
                                    weight=ft.FontWeight.W_700,
                                    color=COLORS["text_primary"],
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
                        ),
                        ft.Text(
                            "Monitor and manage workflow executions",
                            size=14,
                            color=COLORS["text_secondary"],
                        ),
                    ],
                    spacing=6,
                ),
                ft.Container(expand=True),
                ft.Container(
                    content=ft.Row(
                        [
                            ft.Icon(ft.Icons.DELETE_SWEEP, size=16, color=COLORS["text_secondary"]),
                            ft.Container(width=8),
                            ft.Text("Clear History", size=13, weight=ft.FontWeight.W_500, color=COLORS["text_secondary"]),
                        ],
                    ),
                    padding=ft.padding.symmetric(horizontal=16, vertical=12),
                    border_radius=RADIUS["lg"],
                    border=ft.border.all(1, COLORS["border"]),
                    on_click=self._on_clear_history,
                    on_hover=self._on_button_hover,
                ),
                ft.Container(width=12),
                ft.Container(
                    content=ft.Row(
                        [
                            ft.Icon(ft.Icons.REFRESH, size=18, color=COLORS["text_inverse"]),
                            ft.Container(width=8),
                            ft.Text("Refresh", size=13, weight=ft.FontWeight.W_600, color=COLORS["text_inverse"]),
                        ],
                    ),
                    bgcolor=COLORS["primary"],
                    padding=ft.padding.symmetric(horizontal=18, vertical=12),
                    border_radius=RADIUS["lg"],
                    on_click=self._on_refresh,
                    on_hover=self._on_primary_hover,
                ),
            ],
        )

    def _build_stats(self):
        """Build the stats section."""
        running = len([e for e in self.executions if e.get("status") == "running"])
        completed = len([e for e in self.executions if e.get("status") == "completed"])
        failed = len([e for e in self.executions if e.get("status") == "failed"])

        stats = [
            {
                "title": "Total Executions",
                "value": len(self.executions),
                "icon": ft.Icons.HISTORY,
                "color": COLORS["accent_cyan"],
            },
            {
                "title": "Running",
                "value": running,
                "icon": ft.Icons.PLAY_CIRCLE,
                "color": COLORS["primary"],
            },
            {
                "title": "Completed",
                "value": completed,
                "icon": ft.Icons.CHECK_CIRCLE,
                "color": COLORS["success"],
            },
            {
                "title": "Failed",
                "value": failed,
                "icon": ft.Icons.ERROR,
                "color": COLORS["error"],
            },
        ]

        cards = []
        for s in stats:
            cards.append(
                ft.Container(
                    content=ft.Row(
                        [
                            ft.Container(
                                content=ft.Icon(s["icon"], size=24, color=s["color"]),
                                width=52,
                                height=52,
                                border_radius=14,
                                bgcolor=f"{s['color']}20",
                                alignment=ft.alignment.center,
                            ),
                            ft.Container(width=16),
                            ft.Column(
                                [
                                    ft.Text(
                                        str(s["value"]),
                                        size=28,
                                        weight=ft.FontWeight.W_700,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Text(
                                        s["title"],
                                        size=13,
                                        color=COLORS["text_secondary"],
                                    ),
                                ],
                                spacing=2,
                            ),
                        ],
                    ),
                    bgcolor=COLORS["bg_card"],
                    border_radius=RADIUS["lg"],
                    padding=20,
                    border=ft.border.all(1, COLORS["border"]),
                    expand=True,
                )
            )

        return ft.Row(cards, spacing=20)

    def _build_executions_section(self):
        """Build the executions list section."""
        if self.loading:
            return self._build_loading()

        if not self.executions:
            return Card(
                content=ft.Container(
                    content=ft.Column(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.HISTORY,
                                    size=48,
                                    color=COLORS["text_muted"],
                                ),
                                width=80,
                                height=80,
                                border_radius=20,
                                bgcolor=COLORS["bg_tertiary"],
                                alignment=ft.alignment.center,
                            ),
                            ft.Container(height=20),
                            ft.Text(
                                "No Executions Yet",
                                size=18,
                                weight=ft.FontWeight.W_600,
                                color=COLORS["text_primary"],
                            ),
                            ft.Container(height=8),
                            ft.Text(
                                "Run a workflow to see execution history here.",
                                size=14,
                                color=COLORS["text_secondary"],
                                text_align=ft.TextAlign.CENTER,
                            ),
                            ft.Container(height=24),
                            ft.Container(
                                content=ft.Row(
                                    [
                                        ft.Icon(ft.Icons.ACCOUNT_TREE, size=18, color=COLORS["text_inverse"]),
                                        ft.Container(width=8),
                                        ft.Text("View Workflows", size=14, weight=ft.FontWeight.W_600, color=COLORS["text_inverse"]),
                                    ],
                                ),
                                bgcolor=COLORS["primary"],
                                padding=ft.padding.symmetric(horizontal=24, vertical=14),
                                border_radius=RADIUS["lg"],
                                on_click=self._on_view_workflows,
                            ),
                        ],
                        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                    ),
                    padding=ft.padding.symmetric(vertical=40),
                ),
            )

        execution_items = [self._build_execution_card(e) for e in self.executions]

        return Card(
            title="Execution History",
            subtitle=f"{len(self.executions)} executions recorded",
            icon=ft.Icons.HISTORY,
            icon_color=COLORS["accent_cyan"],
            actions=[
                ft.Container(
                    content=ft.Row(
                        [
                            ft.Icon(ft.Icons.FILE_DOWNLOAD, size=16, color=COLORS["text_secondary"]),
                            ft.Container(width=6),
                            ft.Text("Export", size=12, weight=ft.FontWeight.W_500, color=COLORS["text_secondary"]),
                        ],
                    ),
                    padding=ft.padding.symmetric(horizontal=12, vertical=8),
                    border_radius=RADIUS["md"],
                    border=ft.border.all(1, COLORS["border"]),
                    on_click=self._on_export,
                    on_hover=self._on_button_hover,
                ),
            ],
            content=ft.Column(execution_items, spacing=12),
        )

    def _build_execution_card(self, execution: dict):
        """Build an execution card."""
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
            "running": (COLORS["primary"], ft.Icons.PLAY_CIRCLE),
            "completed": (COLORS["success"], ft.Icons.CHECK_CIRCLE),
            "failed": (COLORS["error"], ft.Icons.ERROR),
            "pending": (COLORS["text_muted"], ft.Icons.SCHEDULE),
        }
        status_color, status_icon = status_config.get(status, (COLORS["text_muted"], ft.Icons.HELP))

        return ft.Container(
            content=ft.Row(
                [
                    # Status indicator icon
                    ft.Container(
                        content=ft.Icon(status_icon, size=24, color=status_color),
                        width=52,
                        height=52,
                        border_radius=14,
                        bgcolor=f"{status_color}20",
                        alignment=ft.alignment.center,
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
                            ft.Row(
                                [
                                    ft.Icon(
                                        ft.Icons.PHONE_ANDROID,
                                        size=14,
                                        color=COLORS["text_muted"],
                                    ),
                                    ft.Container(width=4),
                                    ft.Text(
                                        execution.get("device_name", "Unknown Device"),
                                        size=13,
                                        color=COLORS["text_secondary"],
                                    ),
                                    ft.Container(
                                        width=4,
                                        height=4,
                                        border_radius=2,
                                        bgcolor=COLORS["text_muted"],
                                        margin=ft.margin.symmetric(horizontal=8),
                                    ),
                                    ft.Icon(
                                        ft.Icons.ACCESS_TIME,
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
                        spacing=4,
                        expand=True,
                    ),
                    # Duration badge
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(
                                    ft.Icons.TIMER,
                                    size=14,
                                    color=COLORS["text_secondary"],
                                ),
                                ft.Container(width=4),
                                ft.Text(
                                    duration_text,
                                    size=13,
                                    weight=ft.FontWeight.W_500,
                                    color=COLORS["text_primary"],
                                ),
                            ],
                        ),
                        bgcolor=COLORS["bg_tertiary"],
                        border_radius=RADIUS["sm"],
                        padding=ft.padding.symmetric(horizontal=10, vertical=6),
                    ),
                    ft.Container(width=12),
                    # Status badge
                    ft.Container(
                        content=ft.Text(
                            status.capitalize(),
                            size=11,
                            weight=ft.FontWeight.W_600,
                            color=status_color,
                        ),
                        bgcolor=f"{status_color}20",
                        padding=ft.padding.symmetric(horizontal=10, vertical=6),
                        border_radius=RADIUS["sm"],
                    ),
                    ft.Container(width=16),
                    # Actions
                    ft.Row(
                        [
                            ft.IconButton(
                                icon=ft.Icons.VISIBILITY,
                                icon_size=20,
                                icon_color=COLORS["text_muted"],
                                tooltip="View Details",
                                on_click=lambda e, ex=execution: self._on_view(ex),
                            ),
                            ft.IconButton(
                                icon=ft.Icons.STOP if is_running else ft.Icons.REPLAY,
                                icon_size=20,
                                icon_color=COLORS["error"] if is_running else COLORS["text_muted"],
                                tooltip="Stop" if is_running else "Retry",
                                on_click=lambda e, ex=execution: self._on_action(ex),
                            ),
                            ft.IconButton(
                                icon=ft.Icons.DELETE_OUTLINE,
                                icon_size=20,
                                icon_color=COLORS["error"],
                                tooltip="Delete",
                                on_click=lambda e, ex=execution: self._on_delete(ex),
                            ),
                        ],
                        spacing=0,
                    ),
                ],
            ),
            bgcolor=COLORS["bg_tertiary"],
            border_radius=RADIUS["lg"],
            padding=ft.padding.symmetric(horizontal=20, vertical=16),
            on_hover=self._on_card_hover,
        )

    def _build_loading(self):
        """Build loading state."""
        return ft.Container(
            content=ft.Column(
                [
                    ft.ProgressRing(
                        width=40,
                        height=40,
                        stroke_width=3,
                        color=COLORS["accent_cyan"],
                    ),
                    ft.Container(height=16),
                    ft.Text(
                        "Loading executions...",
                        size=14,
                        color=COLORS["text_secondary"],
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=60,
            alignment=ft.alignment.center,
            expand=True,
        )

    def _on_primary_hover(self, e):
        if e.data == "true":
            e.control.bgcolor = COLORS["primary_dark"]
        else:
            e.control.bgcolor = COLORS["primary"]
        e.control.update()

    def _on_button_hover(self, e):
        if e.data == "true":
            e.control.bgcolor = COLORS["bg_hover"]
        else:
            e.control.bgcolor = "transparent"
        e.control.update()

    def _on_card_hover(self, e):
        if e.data == "true":
            e.control.bgcolor = COLORS["bg_hover"]
            e.control.border = ft.border.all(1, COLORS["border"])
        else:
            e.control.bgcolor = COLORS["bg_tertiary"]
            e.control.border = None
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
