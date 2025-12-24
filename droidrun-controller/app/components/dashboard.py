"""Dashboard components - Stats cards and metrics like reference design."""

import flet as ft
from typing import Optional, Callable
from ..theme import COLORS, RADIUS, SPACING


class StatsCard(ft.Container):
    """A statistics card showing a metric with optional trend indicator.

    Like the reference design: "Created Tickets: 24,208 -5%"
    """

    def __init__(
        self,
        title: str,
        value: str,
        subtitle: str = "Compare to last month",
        trend_value: Optional[str] = None,
        trend_positive: bool = True,
        icon: Optional[str] = None,
        icon_color: Optional[str] = None,
        on_click: Optional[Callable] = None,
        compact: bool = False,
    ):
        self.title = title
        self.value_text = value
        self.subtitle = subtitle
        self.trend_value = trend_value
        self.trend_positive = trend_positive
        self.icon = icon
        self.icon_color = icon_color or COLORS["primary"]
        self.compact = compact

        super().__init__(
            content=self._build_content(),
            padding=16 if compact else 20,
            border_radius=RADIUS["lg"],
            bgcolor=COLORS["bg_card"],
            border=ft.border.all(1, COLORS["border"]),
            on_click=on_click,
            on_hover=self._on_hover,
            expand=True,
        )

    def _build_content(self):
        # Trend indicator
        trend_widget = None
        if self.trend_value:
            trend_color = COLORS["success"] if self.trend_positive else COLORS["error"]
            trend_icon = "↗" if self.trend_positive else "↘"
            trend_widget = ft.Container(
                content=ft.Row(
                    [
                        ft.Text(
                            self.trend_value,
                            size=12,
                            weight=ft.FontWeight.W_600,
                            color=trend_color,
                        ),
                        ft.Text(
                            trend_icon,
                            size=12,
                            color=trend_color,
                        ),
                    ],
                    spacing=2,
                ),
                padding=ft.padding.symmetric(horizontal=8, vertical=4),
                border_radius=RADIUS["sm"],
                bgcolor=f"{trend_color}15",
            )

        # Icon widget
        icon_widget = None
        if self.icon:
            icon_widget = ft.Container(
                content=ft.Icon(
                    self.icon,
                    size=20,
                    color=self.icon_color,
                ),
                width=40,
                height=40,
                border_radius=RADIUS["md"],
                bgcolor=f"{self.icon_color}15",
                alignment=ft.alignment.center,
            )

        return ft.Column(
            [
                # Header row with title and optional icon
                ft.Row(
                    [
                        ft.Text(
                            self.title,
                            size=13,
                            color=COLORS["text_secondary"],
                            weight=ft.FontWeight.W_500,
                        ),
                        ft.Container(expand=True),
                        icon_widget if icon_widget else ft.Container(),
                    ],
                ),
                ft.Container(height=12),
                # Value row with trend
                ft.Row(
                    [
                        ft.Text(
                            self.value_text,
                            size=28,
                            weight=ft.FontWeight.W_700,
                            color=COLORS["text_primary"],
                        ),
                        ft.Container(width=12),
                        trend_widget if trend_widget else ft.Container(),
                    ],
                    vertical_alignment=ft.CrossAxisAlignment.END,
                ),
                ft.Container(height=8),
                # Subtitle
                ft.Text(
                    self.subtitle,
                    size=12,
                    color=COLORS["text_muted"],
                ),
            ],
            spacing=0,
        )

    def _on_hover(self, e):
        if e.data == "true":
            e.control.border = ft.border.all(1, COLORS["primary"])
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=16,
                color=f"{COLORS['primary']}15",
                offset=ft.Offset(0, 4),
            )
        else:
            e.control.border = ft.border.all(1, COLORS["border"])
            e.control.shadow = None
        e.control.update()


class StatsCardRow(ft.Row):
    """A row of stats cards like the reference design."""

    def __init__(self, cards: list[StatsCard]):
        super().__init__(
            controls=cards,
            spacing=20,
        )


class MetricMini(ft.Container):
    """A mini metric display for sidebar or compact areas."""

    def __init__(
        self,
        label: str,
        value: str,
        color: str = None,
    ):
        color = color or COLORS["primary"]

        super().__init__(
            content=ft.Column(
                [
                    ft.Text(
                        label,
                        size=11,
                        color=COLORS["text_muted"],
                    ),
                    ft.Text(
                        value,
                        size=16,
                        weight=ft.FontWeight.W_600,
                        color=color,
                    ),
                ],
                spacing=2,
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.symmetric(horizontal=16, vertical=12),
            border_radius=RADIUS["md"],
            bgcolor=COLORS["bg_tertiary"],
        )


class ProgressCard(ft.Container):
    """A card showing progress with a bar chart representation."""

    def __init__(
        self,
        title: str,
        current: int,
        total: int,
        color: str = None,
    ):
        color = color or COLORS["primary"]
        percentage = (current / total * 100) if total > 0 else 0

        super().__init__(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            ft.Text(
                                title,
                                size=13,
                                color=COLORS["text_secondary"],
                            ),
                            ft.Container(expand=True),
                            ft.Text(
                                f"{current}/{total}",
                                size=13,
                                weight=ft.FontWeight.W_600,
                                color=COLORS["text_primary"],
                            ),
                        ],
                    ),
                    ft.Container(height=10),
                    ft.ProgressBar(
                        value=percentage / 100,
                        bgcolor=COLORS["bg_tertiary"],
                        color=color,
                        height=8,
                        border_radius=4,
                    ),
                ],
            ),
            padding=16,
            border_radius=RADIUS["md"],
            bgcolor=COLORS["bg_card"],
            border=ft.border.all(1, COLORS["border"]),
        )


class ActivityItem(ft.Container):
    """An activity item for the activity list."""

    def __init__(
        self,
        title: str,
        description: str,
        time: str,
        icon: str,
        icon_color: str = None,
    ):
        icon_color = icon_color or COLORS["primary"]

        super().__init__(
            content=ft.Row(
                [
                    ft.Container(
                        content=ft.Icon(icon, size=18, color=icon_color),
                        width=36,
                        height=36,
                        border_radius=RADIUS["md"],
                        bgcolor=f"{icon_color}15",
                        alignment=ft.alignment.center,
                    ),
                    ft.Container(width=12),
                    ft.Column(
                        [
                            ft.Text(
                                title,
                                size=13,
                                weight=ft.FontWeight.W_500,
                                color=COLORS["text_primary"],
                            ),
                            ft.Text(
                                description,
                                size=12,
                                color=COLORS["text_muted"],
                            ),
                        ],
                        spacing=2,
                        expand=True,
                    ),
                    ft.Text(
                        time,
                        size=11,
                        color=COLORS["text_muted"],
                    ),
                ],
                vertical_alignment=ft.CrossAxisAlignment.START,
            ),
            padding=ft.padding.symmetric(horizontal=12, vertical=10),
            border_radius=RADIUS["md"],
            on_hover=self._on_hover,
        )

    def _on_hover(self, e):
        if e.data == "true":
            e.control.bgcolor = COLORS["bg_hover"]
        else:
            e.control.bgcolor = None
        e.control.update()


class ChartPlaceholder(ft.Container):
    """A placeholder for charts (Flet doesn't have built-in charts)."""

    def __init__(
        self,
        title: str,
        height: int = 200,
        chart_type: str = "bar",  # bar, line, pie, donut
    ):
        super().__init__(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            ft.Text(
                                title,
                                size=15,
                                weight=ft.FontWeight.W_600,
                                color=COLORS["text_primary"],
                            ),
                            ft.Container(expand=True),
                            ft.Container(
                                content=ft.Text(
                                    "View All",
                                    size=12,
                                    color=COLORS["primary"],
                                ),
                                on_click=lambda _: None,
                            ),
                        ],
                    ),
                    ft.Container(height=16),
                    # Simple bar chart visualization
                    self._build_chart(chart_type, height - 60),
                ],
            ),
            padding=20,
            border_radius=RADIUS["lg"],
            bgcolor=COLORS["bg_card"],
            border=ft.border.all(1, COLORS["border"]),
        )

    def _build_chart(self, chart_type: str, height: int):
        """Build a simple chart visualization."""
        if chart_type == "bar":
            return self._build_bar_chart(height)
        elif chart_type == "donut":
            return self._build_donut_placeholder(height)
        else:
            return ft.Container(height=height)

    def _build_bar_chart(self, height: int):
        """Build simple bar chart."""
        bars = []
        values = [0.6, 0.8, 0.5, 0.9, 0.7, 0.85, 0.75]
        colors = [
            COLORS["chart_1"],
            COLORS["chart_1"],
            COLORS["chart_1"],
            COLORS["chart_1"],
            COLORS["chart_1"],
            COLORS["chart_1"],
            COLORS["chart_1"],
        ]

        for i, (v, c) in enumerate(zip(values, colors)):
            bars.append(
                ft.Container(
                    content=ft.Column(
                        [
                            ft.Container(expand=True),
                            ft.Container(
                                width=28,
                                height=int(v * (height - 30)),
                                border_radius=ft.border_radius.only(
                                    top_left=4, top_right=4
                                ),
                                bgcolor=c,
                            ),
                            ft.Container(height=8),
                            ft.Text(
                                f"D{i+1}",
                                size=10,
                                color=COLORS["text_muted"],
                            ),
                        ],
                        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                    ),
                    expand=True,
                )
            )

        return ft.Container(
            content=ft.Row(bars, alignment=ft.MainAxisAlignment.SPACE_AROUND),
            height=height,
        )

    def _build_donut_placeholder(self, height: int):
        """Build donut chart placeholder."""
        return ft.Container(
            content=ft.Column(
                [
                    ft.Container(
                        content=ft.Text(
                            "📊",
                            size=48,
                        ),
                        alignment=ft.alignment.center,
                    ),
                    ft.Text(
                        "Chart visualization",
                        size=12,
                        color=COLORS["text_muted"],
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                alignment=ft.MainAxisAlignment.CENTER,
            ),
            height=height,
        )


class QuickStatBadge(ft.Container):
    """A quick stat badge for inline statistics."""

    def __init__(
        self,
        value: str,
        label: str,
        color: str = None,
    ):
        color = color or COLORS["primary"]

        super().__init__(
            content=ft.Row(
                [
                    ft.Container(
                        width=4,
                        height=24,
                        border_radius=2,
                        bgcolor=color,
                    ),
                    ft.Container(width=10),
                    ft.Column(
                        [
                            ft.Text(
                                value,
                                size=16,
                                weight=ft.FontWeight.W_700,
                                color=COLORS["text_primary"],
                            ),
                            ft.Text(
                                label,
                                size=11,
                                color=COLORS["text_muted"],
                            ),
                        ],
                        spacing=0,
                    ),
                ],
            ),
        )


class LegendItem(ft.Container):
    """A legend item for charts."""

    def __init__(
        self,
        color: str,
        label: str,
        value: str,
    ):
        super().__init__(
            content=ft.Row(
                [
                    ft.Container(
                        width=12,
                        height=12,
                        border_radius=3,
                        bgcolor=color,
                    ),
                    ft.Container(width=8),
                    ft.Text(
                        label,
                        size=12,
                        color=COLORS["text_secondary"],
                        expand=True,
                    ),
                    ft.Text(
                        value,
                        size=12,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["text_primary"],
                    ),
                ],
            ),
            padding=ft.padding.symmetric(vertical=6),
        )
