"""Professional Workflows view for Droidrun Controller."""

import flet as ft
from ..theme import COLORS, RADIUS
from ..components.card import Card
from ..backend import backend


class WorkflowsView(ft.Container):
    """Professional view for managing automation workflows."""

    def __init__(self, app_state, toast, **kwargs):
        self.app_state = app_state
        self.toast = toast
        self.workflows = []
        self.backend = backend
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
                self._build_workflows_section(),
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
                                    "Workflows",
                                    size=28,
                                    weight=ft.FontWeight.W_700,
                                    color=COLORS["text_primary"],
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
                        ),
                        ft.Text(
                            "Create and manage automation workflows",
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
                            ft.Icon(ft.Icons.FIBER_MANUAL_RECORD, size=16, color=COLORS["text_inverse"]),
                            ft.Container(width=8),
                            ft.Text("Record", size=13, weight=ft.FontWeight.W_600, color=COLORS["text_inverse"]),
                        ],
                    ),
                    bgcolor=COLORS["error"],
                    padding=ft.padding.symmetric(horizontal=18, vertical=12),
                    border_radius=RADIUS["lg"],
                    on_click=self._on_record,
                    on_hover=self._on_danger_hover,
                ),
                ft.Container(width=12),
                ft.Container(
                    content=ft.Row(
                        [
                            ft.Icon(ft.Icons.ADD, size=18, color=COLORS["text_inverse"]),
                            ft.Container(width=8),
                            ft.Text("New Workflow", size=13, weight=ft.FontWeight.W_600, color=COLORS["text_inverse"]),
                        ],
                    ),
                    bgcolor=COLORS["primary"],
                    padding=ft.padding.symmetric(horizontal=18, vertical=12),
                    border_radius=RADIUS["lg"],
                    on_click=self._on_new_workflow,
                    on_hover=self._on_primary_hover,
                ),
            ],
        )

    def _build_stats(self):
        """Build the stats section."""
        total = len(self.workflows)
        active = len([w for w in self.workflows if w.get("is_active")])
        steps_total = sum(len(w.get("steps", [])) for w in self.workflows)

        stats = [
            {
                "title": "Total Workflows",
                "value": total,
                "icon": ft.Icons.ACCOUNT_TREE,
                "color": COLORS["accent_purple"],
            },
            {
                "title": "Active",
                "value": active,
                "icon": ft.Icons.PLAY_CIRCLE,
                "color": COLORS["success"],
            },
            {
                "title": "Total Steps",
                "value": steps_total,
                "icon": ft.Icons.CHECKLIST,
                "color": COLORS["accent_cyan"],
            },
            {
                "title": "Run Today",
                "value": 0,
                "icon": ft.Icons.TODAY,
                "color": COLORS["warning"],
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

    def _build_workflows_section(self):
        """Build the workflows list section."""
        if self.loading:
            return self._build_loading()

        if not self.workflows:
            return Card(
                content=ft.Container(
                    content=ft.Column(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.ACCOUNT_TREE,
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
                                "No Workflows Yet",
                                size=18,
                                weight=ft.FontWeight.W_600,
                                color=COLORS["text_primary"],
                            ),
                            ft.Container(height=8),
                            ft.Text(
                                "Create your first workflow to automate tasks on Android devices.",
                                size=14,
                                color=COLORS["text_secondary"],
                                text_align=ft.TextAlign.CENTER,
                            ),
                            ft.Container(height=24),
                            ft.Container(
                                content=ft.Row(
                                    [
                                        ft.Icon(ft.Icons.ADD, size=18, color=COLORS["text_inverse"]),
                                        ft.Container(width=8),
                                        ft.Text("Create Workflow", size=14, weight=ft.FontWeight.W_600, color=COLORS["text_inverse"]),
                                    ],
                                ),
                                bgcolor=COLORS["primary"],
                                padding=ft.padding.symmetric(horizontal=24, vertical=14),
                                border_radius=RADIUS["lg"],
                                on_click=self._on_new_workflow,
                            ),
                        ],
                        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                    ),
                    padding=ft.padding.symmetric(vertical=40),
                ),
            )

        workflow_items = [self._build_workflow_card(w) for w in self.workflows]

        return Card(
            title="All Workflows",
            subtitle=f"{len(self.workflows)} workflows created",
            icon=ft.Icons.ACCOUNT_TREE,
            icon_color=COLORS["accent_purple"],
            actions=[
                ft.Container(
                    content=ft.Row(
                        [
                            ft.Icon(ft.Icons.FILE_UPLOAD, size=16, color=COLORS["text_secondary"]),
                            ft.Container(width=6),
                            ft.Text("Import", size=12, weight=ft.FontWeight.W_500, color=COLORS["text_secondary"]),
                        ],
                    ),
                    padding=ft.padding.symmetric(horizontal=12, vertical=8),
                    border_radius=RADIUS["md"],
                    border=ft.border.all(1, COLORS["border"]),
                    on_click=self._on_import,
                    on_hover=self._on_button_hover,
                ),
            ],
            content=ft.Column(workflow_items, spacing=12),
        )

    def _build_workflow_card(self, workflow: dict):
        """Build a workflow card."""
        is_active = workflow.get("is_active", False)
        steps_count = len(workflow.get("steps", []))

        return ft.Container(
            content=ft.Row(
                [
                    # Workflow icon
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.ACCOUNT_TREE,
                            size=24,
                            color=COLORS["accent_purple"] if is_active else COLORS["text_muted"],
                        ),
                        width=52,
                        height=52,
                        border_radius=14,
                        bgcolor=f"{COLORS['accent_purple']}20" if is_active else COLORS["bg_tertiary"],
                        alignment=ft.alignment.center,
                    ),
                    ft.Container(width=16),
                    # Workflow info
                    ft.Column(
                        [
                            ft.Text(
                                workflow.get("name", "Unnamed Workflow"),
                                size=15,
                                weight=ft.FontWeight.W_600,
                                color=COLORS["text_primary"],
                            ),
                            ft.Row(
                                [
                                    ft.Icon(
                                        ft.Icons.CHECKLIST,
                                        size=14,
                                        color=COLORS["text_muted"],
                                    ),
                                    ft.Container(width=4),
                                    ft.Text(
                                        f"{steps_count} steps",
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
                                    ft.Text(
                                        workflow.get("description", "No description")[:40],
                                        size=12,
                                        color=COLORS["text_muted"],
                                    ),
                                ],
                            ),
                        ],
                        spacing=4,
                        expand=True,
                    ),
                    # Status badge
                    ft.Container(
                        content=ft.Text(
                            "Active" if is_active else "Inactive",
                            size=11,
                            weight=ft.FontWeight.W_600,
                            color=COLORS["success"] if is_active else COLORS["text_muted"],
                        ),
                        bgcolor=COLORS["success_glow"] if is_active else COLORS["bg_tertiary"],
                        padding=ft.padding.symmetric(horizontal=10, vertical=6),
                        border_radius=RADIUS["sm"],
                    ),
                    ft.Container(width=16),
                    # Actions
                    ft.Row(
                        [
                            ft.IconButton(
                                icon=ft.Icons.PLAY_ARROW,
                                icon_size=20,
                                icon_color=COLORS["success"],
                                tooltip="Run Workflow",
                                on_click=lambda e, w=workflow: self._on_run(w),
                            ),
                            ft.IconButton(
                                icon=ft.Icons.EDIT,
                                icon_size=20,
                                icon_color=COLORS["text_muted"],
                                tooltip="Edit",
                                on_click=lambda e, w=workflow: self._on_edit(w),
                            ),
                            ft.IconButton(
                                icon=ft.Icons.CONTENT_COPY,
                                icon_size=20,
                                icon_color=COLORS["text_muted"],
                                tooltip="Duplicate",
                                on_click=lambda e, w=workflow: self._on_duplicate(w),
                            ),
                            ft.IconButton(
                                icon=ft.Icons.DELETE_OUTLINE,
                                icon_size=20,
                                icon_color=COLORS["error"],
                                tooltip="Delete",
                                on_click=lambda e, w=workflow: self._on_delete(w),
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
                        color=COLORS["accent_purple"],
                    ),
                    ft.Container(height=16),
                    ft.Text(
                        "Loading workflows...",
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

    def _on_danger_hover(self, e):
        if e.data == "true":
            e.control.bgcolor = COLORS["error_dark"]
        else:
            e.control.bgcolor = COLORS["error"]
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

    async def _on_record(self, e):
        """Handle record button click."""
        self.toast.info("Select a device to start recording...")

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
