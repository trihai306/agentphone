"""Professional Interaction History view for Droidrun Controller.

Displays user interaction history from portal-apk with filtering,
detailed node information, and session tracking.
"""

import flet as ft
from datetime import datetime
from typing import List, Optional, Dict, Any

from ..theme import get_colors, RADIUS, get_shadow, ANIMATION, SPACING
from ..components.card import Card
from ..services.interaction_service import interaction_service



# Dynamic color proxy - acts like a dict but always gets current theme colors
class _DynamicColors:
    def get(self, key, default=None):
        return get_colors().get(key, default)
    
    def __getitem__(self, key):
        return get_colors()[key]

COLORS = _DynamicColors()

class InteractionHistoryView(ft.Container):
    """Professional view for monitoring interaction history from portal-apk."""

    def __init__(self, app_state, toast, **kwargs):
        self.app_state = app_state
        self.toast = toast
        self.interactions: List[Dict[str, Any]] = []
        self.sessions: List[Dict[str, Any]] = []
        self.statistics: Dict[str, Any] = {}
        self.loading = False
        self.filter_device = None
        self.filter_package = None
        self.filter_action = "all"
        self.view_mode = "list"  # list or session

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
                self._build_interactions_section(),
            ],
            spacing=0,
            expand=True,
            scroll=ft.ScrollMode.AUTO,
        )

    def _build_header(self):
        """Build the polished header section."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Column(
                        [
                            ft.Row(
                                [
                                    ft.Text(
                                        "Interaction History",
                                        size=32,
                                        weight=ft.FontWeight.W_800,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Container(width=16),
                                    ft.Container(
                                        content=ft.Icon(
                                            ft.Icons.TOUCH_APP_ROUNDED,
                                            size=22,
                                            color=COLORS["accent_purple"],
                                        ),
                                        width=44,
                                        height=44,
                                        bgcolor=f"{COLORS['accent_purple']}12",
                                        border_radius=RADIUS["lg"],
                                        alignment=ft.Alignment(0, 0),
                                        border=ft.border.all(1, f"{COLORS['accent_purple']}20")
                                    ),
                                    ft.Container(width=12),
                                    ft.Container(
                                        content=ft.Text(
                                            str(len(self.interactions)),
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
                                "Track user interactions from portal-apk",
                                size=14,
                                weight=ft.FontWeight.W_400,
                                color=COLORS["text_secondary"],
                            ),
                        ],
                        spacing=0,
                    ),
                    ft.Container(expand=True),
                    ft.Row(
                        [
                            # Refresh button
                            ft.Container(
                                content=ft.Row(
                                    [
                                        ft.Icon(ft.Icons.REFRESH, size=16, color=COLORS["text_secondary"]),
                                        ft.Container(width=6),
                                        ft.Text(
                                            "Refresh",
                                            size=13,
                                            weight=ft.FontWeight.W_500,
                                            color=COLORS["text_secondary"],
                                        ),
                                    ],
                                ),
                                padding=ft.padding.symmetric(horizontal=16, vertical=10),
                                bgcolor=COLORS["bg_card"],
                                border=ft.border.all(1, COLORS["border"]),
                                border_radius=RADIUS["md"],
                                on_click=self._on_refresh,
                                animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                            ),
                            ft.Container(width=12),
                            # Export button
                            ft.Container(
                                content=ft.Row(
                                    [
                                        ft.Icon(ft.Icons.DOWNLOAD, size=16, color=COLORS["text_inverse"]),
                                        ft.Container(width=6),
                                        ft.Text(
                                            "Export",
                                            size=13,
                                            weight=ft.FontWeight.W_600,
                                            color=COLORS["text_inverse"],
                                        ),
                                    ],
                                ),
                                padding=ft.padding.symmetric(horizontal=16, vertical=10),
                                bgcolor=COLORS["primary"],
                                border_radius=RADIUS["md"],
                                on_click=self._on_export,
                                animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                            ),
                        ],
                    ),
                ],
                vertical_alignment=ft.CrossAxisAlignment.START,
            ),
        )

    def _build_stats(self):
        """Build statistics cards."""
        total = self.statistics.get("total_interactions", 0)
        devices = self.statistics.get("unique_devices", 0)
        by_action = self.statistics.get("by_action_type", {})
        taps = by_action.get("tap", 0)
        swipes = by_action.get("swipe", 0)

        stats = [
            ("Total Interactions", str(total), ft.Icons.TOUCH_APP, COLORS["primary"]),
            ("Devices", str(devices), ft.Icons.SMARTPHONE, COLORS["accent_cyan"]),
            ("Taps", str(taps), ft.Icons.ADS_CLICK, COLORS["success"]),
            ("Swipes", str(swipes), ft.Icons.SWIPE, COLORS["warning"]),
        ]

        return ft.Row(
            [self._build_stat_card(*stat) for stat in stats],
            spacing=20,
        )

    def _build_stat_card(self, title: str, value: str, icon, color: str):
        """Build a single stat card."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        content=ft.Icon(icon, size=20, color=color),
                        width=44,
                        height=44,
                        bgcolor=f"{color}12",
                        border_radius=RADIUS["md"],
                        alignment=ft.Alignment(0, 0),
                    ),
                    ft.Container(width=14),
                    ft.Column(
                        [
                            ft.Text(
                                value,
                                size=22,
                                weight=ft.FontWeight.W_700,
                                color=COLORS["text_primary"],
                            ),
                            ft.Text(
                                title,
                                size=12,
                                weight=ft.FontWeight.W_400,
                                color=COLORS["text_secondary"],
                            ),
                        ],
                        spacing=2,
                    ),
                ],
            ),
            padding=ft.padding.all(20),
            bgcolor=COLORS["bg_card"],
            border=ft.border.all(1, COLORS["border"]),
            border_radius=RADIUS["lg"],
            expand=True,
            shadow=get_shadow("sm"),
        )

    def _build_filter_bar(self):
        """Build the filter bar."""
        action_filters = [
            ("all", "All"),
            ("tap", "Tap"),
            ("long_tap", "Long Tap"),
            ("swipe", "Swipe"),
            ("input_text", "Input"),
        ]

        filter_chips = []
        for key, label in action_filters:
            is_selected = self.filter_action == key
            filter_chips.append(
                ft.Container(
                    content=ft.Text(
                        label,
                        size=12,
                        weight=ft.FontWeight.W_600 if is_selected else ft.FontWeight.W_500,
                        color=COLORS["text_inverse"] if is_selected else COLORS["text_secondary"],
                    ),
                    padding=ft.padding.symmetric(horizontal=16, vertical=8),
                    bgcolor=COLORS["primary"] if is_selected else COLORS["bg_hover"],
                    border_radius=RADIUS["full"],
                    border=ft.border.all(1, COLORS["primary"] if is_selected else COLORS["border"]),
                    on_click=lambda e, k=key: self._on_filter_action(k),
                    animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                )
            )

        return ft.Row(
            [
                ft.Row(filter_chips, spacing=8),
                ft.Container(expand=True),
                # View mode toggle
                ft.Row(
                    [
                        ft.Container(
                            content=ft.Icon(
                                ft.Icons.VIEW_LIST,
                                size=18,
                                color=COLORS["primary"] if self.view_mode == "list" else COLORS["text_muted"],
                            ),
                            width=36,
                            height=36,
                            bgcolor=COLORS["primary_subtle"] if self.view_mode == "list" else "transparent",
                            border_radius=RADIUS["sm"],
                            alignment=ft.Alignment(0, 0),
                            on_click=lambda e: self._set_view_mode("list"),
                        ),
                        ft.Container(
                            content=ft.Icon(
                                ft.Icons.FOLDER,
                                size=18,
                                color=COLORS["primary"] if self.view_mode == "session" else COLORS["text_muted"],
                            ),
                            width=36,
                            height=36,
                            bgcolor=COLORS["primary_subtle"] if self.view_mode == "session" else "transparent",
                            border_radius=RADIUS["sm"],
                            alignment=ft.Alignment(0, 0),
                            on_click=lambda e: self._set_view_mode("session"),
                        ),
                    ],
                    spacing=4,
                ),
            ],
        )

    def _build_interactions_section(self):
        """Build the interactions list or session view."""
        if self.loading:
            return ft.Container(
                content=ft.Column(
                    [
                        ft.ProgressRing(width=40, height=40),
                        ft.Container(height=16),
                        ft.Text(
                            "Loading interactions...",
                            size=14,
                            color=COLORS["text_secondary"],
                        ),
                    ],
                    horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                ),
                alignment=ft.Alignment(0, 0),
                expand=True,
            )

        if not self.interactions and not self.sessions:
            return self._build_empty_state()

        if self.view_mode == "session":
            return self._build_sessions_list()
        else:
            return self._build_interactions_list()

    def _build_empty_state(self):
        """Build empty state view."""
        return ft.Container(
            content=ft.Column(
                [
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.TOUCH_APP_OUTLINED,
                            size=64,
                            color=COLORS["text_muted"],
                        ),
                        width=120,
                        height=120,
                        bgcolor=COLORS["bg_hover"],
                        border_radius=60,
                        alignment=ft.Alignment(0, 0),
                    ),
                    ft.Container(height=24),
                    ft.Text(
                        "No Interactions Yet",
                        size=20,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["text_primary"],
                    ),
                    ft.Container(height=8),
                    ft.Text(
                        "Interactions from portal-apk will appear here",
                        size=14,
                        color=COLORS["text_secondary"],
                        text_align=ft.TextAlign.CENTER,
                    ),
                    ft.Container(height=24),
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(ft.Icons.REFRESH, size=16, color=COLORS["text_inverse"]),
                                ft.Container(width=8),
                                ft.Text(
                                    "Refresh",
                                    size=14,
                                    weight=ft.FontWeight.W_500,
                                    color=COLORS["text_inverse"],
                                ),
                            ],
                        ),
                        padding=ft.padding.symmetric(horizontal=24, vertical=12),
                        bgcolor=COLORS["primary"],
                        border_radius=RADIUS["md"],
                        on_click=self._on_refresh,
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            alignment=ft.Alignment(0, 0),
            expand=True,
        )

    def _build_interactions_list(self):
        """Build the list of interactions."""
        items = []
        for interaction in self.interactions[:100]:  # Limit display
            items.append(self._build_interaction_card(interaction))

        return ft.Column(
            items,
            spacing=12,
            expand=True,
        )

    def _build_interaction_card(self, interaction: Dict[str, Any]):
        """Build a single interaction card."""
        node = interaction.get("node", {})
        action_type = interaction.get("action_type", "tap")
        created_at = interaction.get("created_at", "")

        # Action icon and color
        action_icons = {
            "tap": (ft.Icons.ADS_CLICK, COLORS["success"]),
            "long_tap": (ft.Icons.TOUCH_APP, COLORS["warning"]),
            "swipe": (ft.Icons.SWIPE, COLORS["accent_cyan"]),
            "input_text": (ft.Icons.KEYBOARD, COLORS["accent_purple"]),
            "scroll": (ft.Icons.UNFOLD_MORE, COLORS["text_secondary"]),
        }
        icon, color = action_icons.get(action_type, (ft.Icons.TOUCH_APP, COLORS["primary"]))

        # Format time
        time_str = ""
        if created_at:
            try:
                dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                time_str = dt.strftime("%H:%M:%S")
            except Exception:
                time_str = created_at[:8] if len(created_at) >= 8 else created_at

        # Node info
        node_text = node.get("text") or node.get("content_desc") or node.get("resource_id") or "Unknown Element"
        node_class = node.get("class", "").split(".")[-1] if node.get("class") else "Element"

        return ft.Container(
            content=ft.Row(
                [
                    # Action icon
                    ft.Container(
                        content=ft.Icon(icon, size=20, color=color),
                        width=44,
                        height=44,
                        bgcolor=f"{color}12",
                        border_radius=RADIUS["md"],
                        alignment=ft.Alignment(0, 0),
                    ),
                    ft.Container(width=16),
                    # Info
                    ft.Column(
                        [
                            ft.Row(
                                [
                                    ft.Text(
                                        action_type.replace("_", " ").title(),
                                        size=14,
                                        weight=ft.FontWeight.W_600,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Container(width=8),
                                    ft.Container(
                                        content=ft.Text(
                                            node_class,
                                            size=10,
                                            color=COLORS["text_muted"],
                                        ),
                                        bgcolor=COLORS["bg_hover"],
                                        padding=ft.padding.symmetric(horizontal=8, vertical=2),
                                        border_radius=RADIUS["sm"],
                                    ),
                                ],
                            ),
                            ft.Text(
                                node_text[:50] + ("..." if len(node_text) > 50 else ""),
                                size=12,
                                color=COLORS["text_secondary"],
                            ),
                            ft.Row(
                                [
                                    ft.Icon(ft.Icons.SMARTPHONE, size=12, color=COLORS["text_muted"]),
                                    ft.Container(width=4),
                                    ft.Text(
                                        interaction.get("device_serial", "Unknown")[:20],
                                        size=11,
                                        color=COLORS["text_muted"],
                                    ),
                                    ft.Container(width=12),
                                    ft.Icon(ft.Icons.APPS, size=12, color=COLORS["text_muted"]),
                                    ft.Container(width=4),
                                    ft.Text(
                                        (interaction.get("package_name") or "Unknown").split(".")[-1],
                                        size=11,
                                        color=COLORS["text_muted"],
                                    ),
                                ],
                            ),
                        ],
                        spacing=4,
                        expand=True,
                    ),
                    # Coordinates
                    ft.Column(
                        [
                            ft.Text(
                                time_str,
                                size=11,
                                color=COLORS["text_muted"],
                            ),
                            ft.Text(
                                f"({interaction.get('tap_x', 0)}, {interaction.get('tap_y', 0)})",
                                size=10,
                                color=COLORS["text_muted"],
                            ),
                        ],
                        horizontal_alignment=ft.CrossAxisAlignment.END,
                        spacing=4,
                    ),
                    ft.Container(width=12),
                    # View details button
                    ft.IconButton(
                        icon=ft.Icons.CHEVRON_RIGHT,
                        icon_size=20,
                        icon_color=COLORS["text_muted"],
                        on_click=lambda e, i=interaction: self._show_interaction_detail(i),
                    ),
                ],
            ),
            padding=ft.padding.all(16),
            bgcolor=COLORS["bg_card"],
            border=ft.border.all(1, COLORS["border"]),
            border_radius=RADIUS["lg"],
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            on_hover=self._on_card_hover,
        )

    def _build_sessions_list(self):
        """Build the list of sessions."""
        items = []
        for session in self.sessions:
            items.append(self._build_session_card(session))

        return ft.Column(
            items,
            spacing=12,
            expand=True,
        )

    def _build_session_card(self, session: Dict[str, Any]):
        """Build a single session card."""
        session_id = session.get("session_id", "Unknown")[:8]
        device = session.get("device_serial", "Unknown")
        package = session.get("package_name", "Unknown")
        count = session.get("interaction_count", 0)
        started = session.get("started_at", "")
        ended = session.get("ended_at", "")

        # Calculate duration
        duration_str = ""
        if started and ended:
            try:
                start_dt = datetime.fromisoformat(started)
                end_dt = datetime.fromisoformat(ended)
                duration = (end_dt - start_dt).total_seconds()
                if duration < 60:
                    duration_str = f"{int(duration)}s"
                elif duration < 3600:
                    duration_str = f"{int(duration // 60)}m {int(duration % 60)}s"
                else:
                    duration_str = f"{int(duration // 3600)}h {int((duration % 3600) // 60)}m"
            except Exception:
                pass

        return ft.Container(
            content=ft.Row(
                [
                    # Session icon
                    ft.Container(
                        content=ft.Icon(ft.Icons.FOLDER, size=24, color=COLORS["accent_purple"]),
                        width=52,
                        height=52,
                        bgcolor=f"{COLORS['accent_purple']}12",
                        border_radius=RADIUS["md"],
                        alignment=ft.Alignment(0, 0),
                    ),
                    ft.Container(width=16),
                    # Info
                    ft.Column(
                        [
                            ft.Text(
                                f"Session {session_id}",
                                size=15,
                                weight=ft.FontWeight.W_600,
                                color=COLORS["text_primary"],
                            ),
                            ft.Row(
                                [
                                    ft.Icon(ft.Icons.SMARTPHONE, size=12, color=COLORS["text_muted"]),
                                    ft.Container(width=4),
                                    ft.Text(
                                        device[:20],
                                        size=12,
                                        color=COLORS["text_secondary"],
                                    ),
                                    ft.Container(width=12),
                                    ft.Icon(ft.Icons.APPS, size=12, color=COLORS["text_muted"]),
                                    ft.Container(width=4),
                                    ft.Text(
                                        (package or "Unknown").split(".")[-1],
                                        size=12,
                                        color=COLORS["text_secondary"],
                                    ),
                                ],
                            ),
                        ],
                        spacing=6,
                        expand=True,
                    ),
                    # Stats
                    ft.Column(
                        [
                            ft.Container(
                                content=ft.Text(
                                    str(count),
                                    size=16,
                                    weight=ft.FontWeight.W_700,
                                    color=COLORS["primary"],
                                ),
                            ),
                            ft.Text(
                                "interactions",
                                size=10,
                                color=COLORS["text_muted"],
                            ),
                        ],
                        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                        spacing=2,
                    ),
                    ft.Container(width=20),
                    # Duration
                    ft.Column(
                        [
                            ft.Text(
                                duration_str or "-",
                                size=14,
                                weight=ft.FontWeight.W_500,
                                color=COLORS["text_primary"],
                            ),
                            ft.Text(
                                "duration",
                                size=10,
                                color=COLORS["text_muted"],
                            ),
                        ],
                        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                        spacing=2,
                    ),
                    ft.Container(width=12),
                    ft.IconButton(
                        icon=ft.Icons.CHEVRON_RIGHT,
                        icon_size=20,
                        icon_color=COLORS["text_muted"],
                        on_click=lambda e, s=session: self._load_session_interactions(s["session_id"]),
                    ),
                ],
            ),
            padding=ft.padding.all(20),
            bgcolor=COLORS["bg_card"],
            border=ft.border.all(1, COLORS["border"]),
            border_radius=RADIUS["lg"],
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            on_hover=self._on_card_hover,
        )

    def _on_card_hover(self, e):
        """Handle card hover."""
        if e.data == "true":
            e.control.border = ft.border.all(1, COLORS["primary"])
            e.control.shadow = get_shadow("md")
        else:
            e.control.border = ft.border.all(1, COLORS["border"])
            pass  # shadow removed
        e.control.update()

    async def _on_refresh(self, e=None):
        """Refresh interactions."""
        await self.load_data()
        self.toast.success("Data refreshed")

    def _on_export(self, e):
        """Handle export button click."""
        self.toast.info("Export feature coming soon...")

    def _on_filter_action(self, action: str):
        """Handle action filter change."""
        self.filter_action = action
        self.page.run_task(self.load_data)

    def _set_view_mode(self, mode: str):
        """Set the view mode."""
        self.view_mode = mode
        self.content = self._build_content()
        self.update()

    def _show_interaction_detail(self, interaction: Dict[str, Any]):
        """Show interaction detail dialog."""
        node = interaction.get("node", {})

        dialog = ft.AlertDialog(
            title=ft.Text("Interaction Details"),
            content=ft.Container(
                content=ft.Column(
                    [
                        self._detail_row("Action", interaction.get("action_type", "Unknown")),
                        self._detail_row("Device", interaction.get("device_serial", "Unknown")),
                        self._detail_row("Package", interaction.get("package_name", "Unknown")),
                        self._detail_row("Activity", interaction.get("activity_name", "Unknown")),
                        ft.Divider(),
                        ft.Text("Node Information", weight=ft.FontWeight.W_600, size=14),
                        self._detail_row("Class", node.get("class", "Unknown")),
                        self._detail_row("Text", node.get("text", "-")),
                        self._detail_row("Content Desc", node.get("content_desc", "-")),
                        self._detail_row("Resource ID", node.get("resource_id", "-")),
                        self._detail_row("Bounds", str(node.get("bounds", "-"))),
                        self._detail_row("XPath", node.get("xpath", "-")[:50] + "..." if node.get("xpath") else "-"),
                        ft.Divider(),
                        self._detail_row("Coordinates", f"({interaction.get('tap_x', 0)}, {interaction.get('tap_y', 0)})"),
                        self._detail_row("Created", interaction.get("created_at", "-")),
                    ],
                    spacing=8,
                    scroll=ft.ScrollMode.AUTO,
                ),
                width=400,
                height=400,
            ),
            actions=[
                ft.TextButton("Close", on_click=lambda e: self._close_dialog(dialog)),
            ],
        )
        self.page.open(dialog)

    def _detail_row(self, label: str, value: str):
        """Build a detail row."""
        return ft.Row(
            [
                ft.Text(f"{label}:", size=12, color=COLORS["text_muted"], width=100),
                ft.Text(str(value) if value else "-", size=12, color=COLORS["text_primary"]),
            ],
        )

    def _close_dialog(self, dialog):
        """Close dialog."""
        self.page.close(dialog)

    async def _load_session_interactions(self, session_id: str):
        """Load interactions for a specific session."""
        try:
            interactions = await interaction_service.get_interactions(
                session_id=session_id,
                limit=500,
            )
            self.interactions = [i.to_dict() for i in interactions]
            self.view_mode = "list"
            self.content = self._build_content()
            self.update()
        except Exception as e:
            self.toast.error(f"Failed to load session: {str(e)}")

    async def load_data(self):
        """Load interactions and statistics."""
        self.loading = True
        self.content = self._build_content()
        self.update()

        try:
            # Load interactions
            action_filter = None if self.filter_action == "all" else self.filter_action
            interactions = await interaction_service.get_interactions(
                device_serial=self.filter_device,
                package_name=self.filter_package,
                action_type=action_filter,
                limit=100,
            )
            self.interactions = [i.to_dict() for i in interactions]

            # Load statistics
            self.statistics = await interaction_service.get_statistics()

            # Load sessions
            self.sessions = await interaction_service.get_recent_sessions(limit=20)

        except Exception as e:
            self.toast.error(f"Failed to load data: {str(e)}")

        finally:
            self.loading = False
            self.content = self._build_content()
            self.update()
