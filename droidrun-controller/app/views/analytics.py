"""Token Analytics view for Droidrun Controller."""

import flet as ft
from datetime import datetime, timedelta
from ..theme import COLORS
from ..components.card import Card, StatsCard
from ..components.action_button import ActionButton
from ..components.empty_state import EmptyState


class AnalyticsView(ft.Container):
    """Professional view for token consumption analytics."""

    def __init__(self, app_state, toast, **kwargs):
        self.app_state = app_state
        self.toast = toast
        self.token_data = []
        self.loading = False

        # Sample data for demo
        self.total_tokens = 125000
        self.tokens_today = 8500
        self.tokens_week = 45000
        self.tokens_month = 125000
        self.cost_estimate = 2.50

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
                self._build_chart_section(),
                ft.Container(height=28),
                self._build_usage_breakdown(),
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
                                    "Token Analytics",
                                    size=28,
                                    weight=ft.FontWeight.W_700,
                                    color=COLORS["text_primary"],
                                ),
                                ft.Container(width=12),
                                ft.Container(
                                    content=ft.Icon(
                                        ft.Icons.ANALYTICS,
                                        size=20,
                                        color=COLORS["accent_orange"],
                                    ),
                                    bgcolor=f"{COLORS['accent_orange']}20",
                                    border_radius=10,
                                    padding=8,
                                ),
                            ],
                        ),
                        ft.Text(
                            "Monitor token consumption and costs",
                            size=14,
                            color=COLORS["text_secondary"],
                        ),
                    ],
                    spacing=6,
                ),
                ft.Container(expand=True),
                ActionButton(
                    text="Export Report",
                    icon=ft.Icons.FILE_DOWNLOAD,
                    variant="ghost",
                    on_click=self._on_export,
                ),
                ft.Container(width=12),
                ActionButton(
                    text="Refresh",
                    icon=ft.Icons.REFRESH,
                    variant="secondary",
                    on_click=self._on_refresh,
                ),
            ],
        )

    def _build_stats(self):
        """Build the stats section."""
        return ft.Row(
            [
                StatsCard(
                    title="Total Tokens",
                    value=self._format_number(self.total_tokens),
                    icon=ft.Icons.TOKEN,
                    color=COLORS["accent_orange"],
                ),
                StatsCard(
                    title="Today",
                    value=self._format_number(self.tokens_today),
                    icon=ft.Icons.TODAY,
                    color=COLORS["primary"],
                ),
                StatsCard(
                    title="This Week",
                    value=self._format_number(self.tokens_week),
                    icon=ft.Icons.DATE_RANGE,
                    color=COLORS["accent_cyan"],
                ),
                StatsCard(
                    title="Est. Cost",
                    value=f"${self.cost_estimate:.2f}",
                    icon=ft.Icons.ATTACH_MONEY,
                    color=COLORS["success"],
                ),
            ],
            spacing=20,
        )

    def _build_chart_section(self):
        """Build the chart section with bar chart."""
        # Generate sample data for last 7 days
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        values = [12000, 8500, 15000, 9200, 11000, 5500, 8500]
        max_value = max(values) if values else 1

        bars = []
        for i, (day, value) in enumerate(zip(days, values)):
            bar_height = (value / max_value) * 150
            is_today = i == len(days) - 1

            bars.append(
                ft.Column(
                    [
                        ft.Text(
                            self._format_number(value),
                            size=11,
                            color=COLORS["text_secondary"],
                            text_align=ft.TextAlign.CENTER,
                        ),
                        ft.Container(height=8),
                        ft.Container(
                            width=40,
                            height=bar_height,
                            border_radius=ft.border_radius.only(top_left=6, top_right=6),
                            bgcolor=COLORS["accent_orange"] if is_today else f"{COLORS['accent_orange']}60",
                            animate=300,
                        ),
                        ft.Container(height=8),
                        ft.Text(
                            day,
                            size=12,
                            weight=ft.FontWeight.W_500 if is_today else ft.FontWeight.W_400,
                            color=COLORS["text_primary"] if is_today else COLORS["text_secondary"],
                        ),
                    ],
                    horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                    spacing=0,
                )
            )

        return Card(
            title="Token Usage (Last 7 Days)",
            subtitle="Daily consumption breakdown",
            icon=ft.Icons.BAR_CHART,
            icon_color=COLORS["accent_orange"],
            actions=[
                ActionButton(
                    text="View Details",
                    icon=ft.Icons.OPEN_IN_NEW,
                    variant="ghost",
                    size="small",
                    on_click=self._on_view_details,
                ),
            ],
            content=ft.Container(
                content=ft.Row(
                    bars,
                    alignment=ft.MainAxisAlignment.SPACE_AROUND,
                ),
                padding=ft.padding.symmetric(vertical=20),
            ),
        )

    def _build_usage_breakdown(self):
        """Build usage breakdown by model/feature."""
        usage_items = [
            {"name": "GPT-4", "tokens": 75000, "color": COLORS["accent_purple"], "percentage": 60},
            {"name": "Claude 3.5", "tokens": 35000, "color": COLORS["accent_cyan"], "percentage": 28},
            {"name": "GPT-3.5", "tokens": 15000, "color": COLORS["success"], "percentage": 12},
        ]

        items = []
        for item in usage_items:
            items.append(self._build_usage_item(item))

        return Card(
            title="Usage by Model",
            subtitle="Token distribution across AI models",
            icon=ft.Icons.PIE_CHART,
            icon_color=COLORS["accent_purple"],
            content=ft.Column(items, spacing=16),
        )

    def _build_usage_item(self, item: dict):
        """Build a usage breakdown item."""
        return ft.Container(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.SMART_TOY,
                                    size=18,
                                    color=item["color"],
                                ),
                                width=36,
                                height=36,
                                border_radius=8,
                                bgcolor=f"{item['color']}20",
                                alignment=ft.alignment.center,
                            ),
                            ft.Container(width=12),
                            ft.Column(
                                [
                                    ft.Text(
                                        item["name"],
                                        size=14,
                                        weight=ft.FontWeight.W_600,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Text(
                                        f"{self._format_number(item['tokens'])} tokens",
                                        size=12,
                                        color=COLORS["text_secondary"],
                                    ),
                                ],
                                spacing=2,
                                expand=True,
                            ),
                            ft.Container(
                                content=ft.Text(
                                    f"{item['percentage']}%",
                                    size=13,
                                    weight=ft.FontWeight.W_600,
                                    color=item["color"],
                                ),
                                bgcolor=f"{item['color']}20",
                                border_radius=8,
                                padding=ft.padding.symmetric(horizontal=12, vertical=6),
                            ),
                        ],
                    ),
                    ft.Container(height=8),
                    # Progress bar
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Container(
                                    width=item["percentage"] * 3,
                                    height=6,
                                    border_radius=3,
                                    bgcolor=item["color"],
                                ),
                            ],
                        ),
                        width=300,
                        height=6,
                        border_radius=3,
                        bgcolor=COLORS["bg_tertiary"],
                    ),
                ],
            ),
        )

    def _format_number(self, num):
        """Format large numbers with K suffix."""
        if num >= 1000:
            return f"{num/1000:.1f}K"
        return str(num)

    async def _on_refresh(self, e):
        """Handle refresh button click."""
        self.loading = True
        self.content = self._build_content()
        self.update()

        # Simulate loading
        await self.load_analytics()

    async def _on_export(self, e):
        """Handle export button click."""
        self.toast.info("Exporting analytics report...")

    async def _on_view_details(self, e):
        """Handle view details button click."""
        self.toast.info("Opening detailed analytics...")

    async def load_analytics(self):
        """Load analytics data."""
        self.loading = True
        try:
            # This will be connected to actual token tracking
            # For now, use sample data
            self.toast.success("Analytics refreshed")
        except Exception as ex:
            self.toast.error(f"Failed to load analytics: {ex}")
        finally:
            self.loading = False
            self.content = self._build_content()
            self.update()

    def refresh(self):
        """Refresh the view."""
        self.content = self._build_content()
        self.update()
