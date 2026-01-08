"""Dashboard components - Professional stats cards and metrics."""

import flet as ft
from typing import Optional, Callable, List
from ..theme import get_colors, RADIUS, SPACING


# Dynamic color proxy - acts like a dict but always gets current theme colors
class _DynamicColors:
    def get(self, key, default=None):
        return get_colors().get(key, default)
    
    def __getitem__(self, key):
        return get_colors()[key]

COLORS = _DynamicColors()


class StatsCard(ft.Container):
    """A professional statistics card with glassmorphism effect.

    Features: Gradient accent, smooth hover animation, trend indicator.
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
        accent_color: Optional[str] = None,
        on_click: Optional[Callable] = None,
        compact: bool = False,
    ):
        self.title = title
        self.value_text = value
        self.subtitle = subtitle
        self.trend_value = trend_value
        self.trend_positive = trend_positive
        self.icon = icon
        self.icon_color = icon_color or COLORS.get("primary", "#6366F1")
        self.accent_color = accent_color or self.icon_color
        self.compact = compact

        super().__init__(
            content=self._build_content(),
            padding=ft.padding.only(left=20, right=20, top=20, bottom=16) if not compact else 16,
            border_radius=RADIUS.get("lg", 12),
            bgcolor=COLORS.get("bg_card", "#1E1E2E"),
            border=ft.border.all(1, COLORS.get("border", "#2D2D3D")),
            on_click=on_click,
            on_hover=self._on_hover,
            animate=ft.animation.Animation(200, ft.AnimationCurve.EASE_OUT),
            expand=True,
        )

    def _build_content(self):
        # Accent bar at top
        accent_bar = ft.Container(
            width=40,
            height=3,
            border_radius=2,
            gradient=ft.LinearGradient(
                begin=ft.alignment.center_left,
                end=ft.alignment.center_right,
                colors=[self.accent_color, f"{self.accent_color}60"],
            ),
        )

        # Trend indicator with pill design
        trend_widget = None
        if self.trend_value:
            trend_color = COLORS.get("success", "#10B981") if self.trend_positive else COLORS.get("error", "#EF4444")
            trend_icon = ft.icons.TRENDING_UP_ROUNDED if self.trend_positive else ft.icons.TRENDING_DOWN_ROUNDED
            trend_widget = ft.Container(
                content=ft.Row(
                    [
                        ft.Icon(trend_icon, size=14, color=trend_color),
                        ft.Text(
                            self.trend_value,
                            size=12,
                            weight=ft.FontWeight.W_600,
                            color=trend_color,
                        ),
                    ],
                    spacing=4,
                ),
                padding=ft.padding.symmetric(horizontal=10, vertical=5),
                border_radius=20,
                bgcolor=f"{trend_color}15",
            )

        # Icon with gradient background
        icon_widget = None
        if self.icon:
            icon_widget = ft.Container(
                content=ft.Icon(
                    self.icon,
                    size=22,
                    color=self.icon_color,
                ),
                width=44,
                height=44,
                border_radius=12,
                gradient=ft.LinearGradient(
                    begin=ft.alignment.top_left,
                    end=ft.alignment.bottom_right,
                    colors=[f"{self.icon_color}25", f"{self.icon_color}10"],
                ),
                border=ft.border.all(1, f"{self.icon_color}30"),
                alignment=ft.alignment.center,
            )

        return ft.Column(
            [
                accent_bar,
                ft.Container(height=16),
                # Header row
                ft.Row(
                    [
                        ft.Text(
                            self.title.upper(),
                            size=11,
                            color=COLORS.get("text_muted", "#6B7280"),
                            weight=ft.FontWeight.W_600,
                            letter_spacing=0.5,
                        ),
                        ft.Container(expand=True),
                        icon_widget if icon_widget else ft.Container(),
                    ],
                    vertical_alignment=ft.CrossAxisAlignment.START,
                ),
                ft.Container(height=8),
                # Value
                ft.Text(
                    self.value_text,
                    size=32 if not self.compact else 26,
                    weight=ft.FontWeight.W_700,
                    color=COLORS.get("text_primary", "#FFFFFF"),
                ),
                ft.Container(height=12),
                # Footer row with trend and subtitle
                ft.Row(
                    [
                        trend_widget if trend_widget else ft.Container(),
                        ft.Container(width=8) if trend_widget else ft.Container(),
                        ft.Text(
                            self.subtitle,
                            size=12,
                            color=COLORS.get("text_muted", "#6B7280"),
                        ),
                    ],
                    vertical_alignment=ft.CrossAxisAlignment.CENTER,
                ),
            ],
            spacing=0,
        )

    def _on_hover(self, e):
        if e.data == "true":
            e.control.border = ft.border.all(1, f"{self.accent_color}60")
            
        else:
            e.control.border = ft.border.all(1, COLORS.get("border", "#2D2D3D"))
            
        e.control.update()


class StatsCardRow(ft.Row):
    """A responsive row of stats cards."""

    def __init__(self, cards: List[StatsCard]):
        super().__init__(
            controls=cards,
            spacing=20,
            wrap=True,
            run_spacing=20,
        )


class MetricMini(ft.Container):
    """A compact metric display with modern styling."""

    def __init__(
        self,
        label: str,
        value: str,
        color: str = None,
        icon: Optional[str] = None,
    ):
        color = color or COLORS.get("primary", "#6366F1")

        icon_widget = None
        if icon:
            icon_widget = ft.Icon(icon, size=16, color=color)

        super().__init__(
            content=ft.Row(
                [
                    ft.Container(
                        content=icon_widget,
                        width=32,
                        height=32,
                        border_radius=8,
                        bgcolor=f"{color}15",
                        alignment=ft.alignment.center,
                        visible=icon is not None,
                    ) if icon else ft.Container(),
                    ft.Container(width=10) if icon else ft.Container(),
                    ft.Column(
                        [
                            ft.Text(
                                label.upper(),
                                size=10,
                                color=COLORS.get("text_muted", "#6B7280"),
                                weight=ft.FontWeight.W_500,
                                letter_spacing=0.5,
                            ),
                            ft.Text(
                                value,
                                size=18,
                                weight=ft.FontWeight.W_700,
                                color=color,
                            ),
                        ],
                        spacing=2,
                    ),
                ],
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.symmetric(horizontal=16, vertical=14),
            border_radius=RADIUS.get("md", 8),
            bgcolor=COLORS.get("bg_tertiary", "#252536"),
            border=ft.border.all(1, COLORS.get("border", "#2D2D3D")),
            on_hover=self._on_hover,
            animate=ft.animation.Animation(150, ft.AnimationCurve.EASE_OUT),
        )
        self._color = color

    def _on_hover(self, e):
        if e.data == "true":
            e.control.bgcolor = COLORS.get("bg_hover", "#2A2A3E")
            e.control.border = ft.border.all(1, f"{self._color}40")
        else:
            e.control.bgcolor = COLORS.get("bg_tertiary", "#252536")
            e.control.border = ft.border.all(1, COLORS.get("border", "#2D2D3D"))
        e.control.update()


class ProgressCard(ft.Container):
    """A professional progress card with animated bar."""

    def __init__(
        self,
        title: str,
        current: int,
        total: int,
        color: str = None,
        icon: Optional[str] = None,
    ):
        color = color or COLORS.get("primary", "#6366F1")
        percentage = (current / total * 100) if total > 0 else 0

        icon_widget = None
        if icon:
            icon_widget = ft.Container(
                content=ft.Icon(icon, size=18, color=color),
                width=36,
                height=36,
                border_radius=10,
                bgcolor=f"{color}15",
                alignment=ft.alignment.center,
            )

        # Custom progress bar with gradient
        progress_bar = ft.Container(
            content=ft.Stack(
                [
                    # Background
                    ft.Container(
                        width=None,
                        height=8,
                        border_radius=4,
                        bgcolor=COLORS.get("bg_tertiary", "#252536"),
                        expand=True,
                    ),
                    # Progress fill
                    ft.Container(
                        width=f"{percentage}%",
                        height=8,
                        border_radius=4,
                        gradient=ft.LinearGradient(
                            begin=ft.alignment.center_left,
                            end=ft.alignment.center_right,
                            colors=[color, f"{color}CC"],
                        ),
                        animate=ft.animation.Animation(500, ft.AnimationCurve.EASE_OUT),
                    ),
                ],
            ),
            expand=True,
        )

        super().__init__(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            icon_widget if icon_widget else ft.Container(),
                            ft.Container(width=12) if icon else ft.Container(),
                            ft.Column(
                                [
                                    ft.Text(
                                        title,
                                        size=14,
                                        weight=ft.FontWeight.W_500,
                                        color=COLORS.get("text_primary", "#FFFFFF"),
                                    ),
                                    ft.Text(
                                        f"{percentage:.0f}% completed",
                                        size=12,
                                        color=COLORS.get("text_muted", "#6B7280"),
                                    ),
                                ],
                                spacing=2,
                                expand=True,
                            ),
                            ft.Container(
                                content=ft.Text(
                                    f"{current}/{total}",
                                    size=14,
                                    weight=ft.FontWeight.W_700,
                                    color=color,
                                ),
                                padding=ft.padding.symmetric(horizontal=12, vertical=6),
                                border_radius=8,
                                bgcolor=f"{color}15",
                            ),
                        ],
                        vertical_alignment=ft.CrossAxisAlignment.CENTER,
                    ),
                    ft.Container(height=16),
                    progress_bar,
                ],
            ),
            padding=20,
            border_radius=RADIUS.get("lg", 12),
            bgcolor=COLORS.get("bg_card", "#1E1E2E"),
            border=ft.border.all(1, COLORS.get("border", "#2D2D3D")),
        )


class ActivityItem(ft.Container):
    """A modern activity item with timeline connector."""

    def __init__(
        self,
        title: str,
        description: str,
        time: str,
        icon: str,
        icon_color: str = None,
        show_connector: bool = True,
    ):
        icon_color = icon_color or COLORS.get("primary", "#6366F1")

        super().__init__(
            content=ft.Row(
                [
                    # Timeline indicator
                    ft.Column(
                        [
                            ft.Container(
                                content=ft.Icon(icon, size=16, color=icon_color),
                                width=36,
                                height=36,
                                border_radius=10,
                                gradient=ft.LinearGradient(
                                    begin=ft.alignment.top_left,
                                    end=ft.alignment.bottom_right,
                                    colors=[f"{icon_color}20", f"{icon_color}10"],
                                ),
                                border=ft.border.all(1, f"{icon_color}30"),
                                alignment=ft.alignment.center,
                            ),
                            # Connector line
                            ft.Container(
                                width=2,
                                height=20,
                                bgcolor=COLORS.get("border", "#2D2D3D"),
                                visible=show_connector,
                            ) if show_connector else ft.Container(),
                        ],
                        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                        spacing=4,
                    ),
                    ft.Container(width=14),
                    # Content
                    ft.Column(
                        [
                            ft.Text(
                                title,
                                size=14,
                                weight=ft.FontWeight.W_600,
                                color=COLORS.get("text_primary", "#FFFFFF"),
                            ),
                            ft.Container(height=2),
                            ft.Text(
                                description,
                                size=12,
                                color=COLORS.get("text_secondary", "#9CA3AF"),
                            ),
                        ],
                        spacing=0,
                        expand=True,
                    ),
                    # Time badge
                    ft.Container(
                        content=ft.Text(
                            time,
                            size=11,
                            color=COLORS.get("text_muted", "#6B7280"),
                            weight=ft.FontWeight.W_500,
                        ),
                        padding=ft.padding.symmetric(horizontal=10, vertical=5),
                        border_radius=6,
                        bgcolor=COLORS.get("bg_tertiary", "#252536"),
                    ),
                ],
                vertical_alignment=ft.CrossAxisAlignment.START,
            ),
            padding=ft.padding.symmetric(horizontal=16, vertical=12),
            border_radius=RADIUS.get("md", 8),
            on_hover=self._on_hover,
            animate=ft.animation.Animation(150, ft.AnimationCurve.EASE_OUT),
        )
        self._icon_color = icon_color

    def _on_hover(self, e):
        if e.data == "true":
            e.control.bgcolor = COLORS.get("bg_hover", "#2A2A3E")
        else:
            e.control.bgcolor = None
        e.control.update()


class ChartCard(ft.Container):
    """A professional chart card with header and actions."""

    def __init__(
        self,
        title: str,
        subtitle: Optional[str] = None,
        height: int = 220,
        chart_type: str = "bar",
        data: Optional[List[float]] = None,
        labels: Optional[List[str]] = None,
        color: Optional[str] = None,
        on_view_all: Optional[Callable] = None,
    ):
        self.color = color or COLORS.get("primary", "#6366F1")
        self.data = data or [0.6, 0.8, 0.45, 0.9, 0.7, 0.85, 0.65]
        self.labels = labels or ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

        super().__init__(
            content=ft.Column(
                [
                    # Header
                    ft.Row(
                        [
                            ft.Column(
                                [
                                    ft.Text(
                                        title,
                                        size=16,
                                        weight=ft.FontWeight.W_600,
                                        color=COLORS.get("text_primary", "#FFFFFF"),
                                    ),
                                    ft.Text(
                                        subtitle,
                                        size=12,
                                        color=COLORS.get("text_muted", "#6B7280"),
                                        visible=subtitle is not None,
                                    ) if subtitle else ft.Container(),
                                ],
                                spacing=2,
                            ),
                            ft.Container(expand=True),
                            ft.Container(
                                content=ft.Row(
                                    [
                                        ft.Text(
                                            "View All",
                                            size=12,
                                            color=COLORS.get("primary", "#6366F1"),
                                            weight=ft.FontWeight.W_500,
                                        ),
                                        ft.Icon(
                                            ft.icons.ARROW_FORWARD_ROUNDED,
                                            size=14,
                                            color=COLORS.get("primary", "#6366F1"),
                                        ),
                                    ],
                                    spacing=4,
                                ),
                                on_click=on_view_all,
                                on_hover=self._on_link_hover,
                                padding=ft.padding.symmetric(horizontal=12, vertical=6),
                                border_radius=6,
                            ) if on_view_all else ft.Container(),
                        ],
                    ),
                    ft.Container(height=20),
                    # Chart
                    self._build_chart(chart_type, height - 80),
                ],
            ),
            padding=24,
            border_radius=RADIUS.get("lg", 12),
            bgcolor=COLORS.get("bg_card", "#1E1E2E"),
            border=ft.border.all(1, COLORS.get("border", "#2D2D3D")),
        )

    def _on_link_hover(self, e):
        if e.data == "true":
            e.control.bgcolor = f"{COLORS.get('primary', '#6366F1')}15"
        else:
            e.control.bgcolor = None
        e.control.update()

    def _build_chart(self, chart_type: str, height: int):
        if chart_type == "bar":
            return self._build_bar_chart(height)
        elif chart_type == "line":
            return self._build_line_chart(height)
        elif chart_type == "donut":
            return self._build_donut_chart(height)
        return ft.Container(height=height)

    def _build_bar_chart(self, height: int):
        """Build professional bar chart."""
        bars = []
        max_val = max(self.data) if self.data else 1

        for i, v in enumerate(self.data):
            normalized = v / max_val
            bar_height = int(normalized * (height - 40))

            bars.append(
                ft.Container(
                    content=ft.Column(
                        [
                            ft.Container(expand=True),
                            # Bar with gradient
                            ft.Container(
                                content=ft.Container(
                                    width=32,
                                    height=bar_height,
                                    border_radius=ft.border_radius.only(
                                        top_left=6, top_right=6
                                    ),
                                    gradient=ft.LinearGradient(
                                        begin=ft.alignment.bottom_center,
                                        end=ft.alignment.top_center,
                                        colors=[self.color, f"{self.color}80"],
                                    ),
                                ),
                                on_hover=lambda e, idx=i: self._on_bar_hover(e, idx),
                            ),
                            ft.Container(height=10),
                            # Label
                            ft.Text(
                                self.labels[i] if i < len(self.labels) else f"D{i+1}",
                                size=11,
                                color=COLORS.get("text_muted", "#6B7280"),
                                weight=ft.FontWeight.W_500,
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

    def _on_bar_hover(self, e, idx):
        if e.data == "true":
            e.control.content.opacity = 0.8
        else:
            e.control.content.opacity = 1
        e.control.update()

    def _build_line_chart(self, height: int):
        """Build line chart placeholder with visual indication."""
        return ft.Container(
            content=ft.Column(
                [
                    ft.Icon(
                        ft.icons.SHOW_CHART_ROUNDED,
                        size=48,
                        color=f"{self.color}60",
                    ),
                    ft.Container(height=8),
                    ft.Text(
                        "Line Chart",
                        size=13,
                        color=COLORS.get("text_muted", "#6B7280"),
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                alignment=ft.MainAxisAlignment.CENTER,
            ),
            height=height,
            border_radius=12,
            bgcolor=COLORS.get("bg_tertiary", "#252536"),
        )

    def _build_donut_chart(self, height: int):
        """Build donut chart visual."""
        return ft.Container(
            content=ft.Column(
                [
                    ft.Icon(
                        ft.icons.DONUT_LARGE_ROUNDED,
                        size=48,
                        color=f"{self.color}60",
                    ),
                    ft.Container(height=8),
                    ft.Text(
                        "Distribution",
                        size=13,
                        color=COLORS.get("text_muted", "#6B7280"),
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                alignment=ft.MainAxisAlignment.CENTER,
            ),
            height=height,
            border_radius=12,
            bgcolor=COLORS.get("bg_tertiary", "#252536"),
        )


class QuickStatBadge(ft.Container):
    """A professional quick stat badge with accent line."""

    def __init__(
        self,
        value: str,
        label: str,
        color: str = None,
        icon: Optional[str] = None,
    ):
        color = color or COLORS.get("primary", "#6366F1")

        super().__init__(
            content=ft.Row(
                [
                    # Accent line
                    ft.Container(
                        width=3,
                        height=40,
                        border_radius=2,
                        gradient=ft.LinearGradient(
                            begin=ft.alignment.top_center,
                            end=ft.alignment.bottom_center,
                            colors=[color, f"{color}40"],
                        ),
                    ),
                    ft.Container(width=14),
                    # Icon
                    ft.Container(
                        content=ft.Icon(icon, size=18, color=color),
                        width=36,
                        height=36,
                        border_radius=8,
                        bgcolor=f"{color}15",
                        alignment=ft.alignment.center,
                        visible=icon is not None,
                    ) if icon else ft.Container(),
                    ft.Container(width=10) if icon else ft.Container(),
                    # Content
                    ft.Column(
                        [
                            ft.Text(
                                value,
                                size=20,
                                weight=ft.FontWeight.W_700,
                                color=COLORS.get("text_primary", "#FFFFFF"),
                            ),
                            ft.Text(
                                label,
                                size=12,
                                color=COLORS.get("text_muted", "#6B7280"),
                            ),
                        ],
                        spacing=2,
                    ),
                ],
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.symmetric(horizontal=16, vertical=12),
            border_radius=RADIUS.get("md", 8),
            bgcolor=COLORS.get("bg_card", "#1E1E2E"),
            border=ft.border.all(1, COLORS.get("border", "#2D2D3D")),
            on_hover=self._on_hover,
            animate=ft.animation.Animation(150, ft.AnimationCurve.EASE_OUT),
        )
        self._color = color

    def _on_hover(self, e):
        if e.data == "true":
            e.control.border = ft.border.all(1, f"{self._color}40")
        else:
            e.control.border = ft.border.all(1, COLORS.get("border", "#2D2D3D"))
        e.control.update()


class LegendItem(ft.Container):
    """A modern legend item for charts."""

    def __init__(
        self,
        color: str,
        label: str,
        value: str,
        percentage: Optional[str] = None,
    ):
        super().__init__(
            content=ft.Row(
                [
                    # Color indicator
                    ft.Container(
                        width=10,
                        height=10,
                        border_radius=3,
                        bgcolor=color,
                    ),
                    ft.Container(width=10),
                    # Label
                    ft.Text(
                        label,
                        size=13,
                        color=COLORS.get("text_secondary", "#9CA3AF"),
                        expand=True,
                    ),
                    # Value
                    ft.Text(
                        value,
                        size=13,
                        weight=ft.FontWeight.W_600,
                        color=COLORS.get("text_primary", "#FFFFFF"),
                    ),
                    # Percentage
                    ft.Container(
                        content=ft.Text(
                            percentage,
                            size=11,
                            color=color,
                            weight=ft.FontWeight.W_500,
                        ),
                        padding=ft.padding.symmetric(horizontal=8, vertical=3),
                        border_radius=4,
                        bgcolor=f"{color}15",
                        visible=percentage is not None,
                    ) if percentage else ft.Container(),
                ],
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.symmetric(vertical=8, horizontal=4),
            on_hover=self._on_hover,
            animate=ft.animation.Animation(100, ft.AnimationCurve.EASE_OUT),
        )

    def _on_hover(self, e):
        if e.data == "true":
            e.control.bgcolor = COLORS.get("bg_hover", "#2A2A3E")
            e.control.border_radius = 6
        else:
            e.control.bgcolor = None
        e.control.update()


class EmptyStateCard(ft.Container):
    """A professional empty state card."""

    def __init__(
        self,
        title: str,
        description: str,
        icon: str = ft.icons.INBOX_ROUNDED,
        action_text: Optional[str] = None,
        on_action: Optional[Callable] = None,
    ):
        super().__init__(
            content=ft.Column(
                [
                    ft.Container(
                        content=ft.Icon(
                            icon,
                            size=48,
                            color=COLORS.get("text_muted", "#6B7280"),
                        ),
                        width=80,
                        height=80,
                        border_radius=20,
                        bgcolor=COLORS.get("bg_tertiary", "#252536"),
                        alignment=ft.alignment.center,
                    ),
                    ft.Container(height=20),
                    ft.Text(
                        title,
                        size=16,
                        weight=ft.FontWeight.W_600,
                        color=COLORS.get("text_primary", "#FFFFFF"),
                        text_align=ft.TextAlign.CENTER,
                    ),
                    ft.Container(height=8),
                    ft.Text(
                        description,
                        size=13,
                        color=COLORS.get("text_muted", "#6B7280"),
                        text_align=ft.TextAlign.CENTER,
                    ),
                    ft.Container(height=20) if action_text else ft.Container(),
                    ft.ElevatedButton(
                        content=ft.Text(
                            action_text,
                            size=13,
                            weight=ft.FontWeight.W_500,
                        ),
                        style=ft.ButtonStyle(
                            color=COLORS.get("text_primary", "#FFFFFF"),
                            bgcolor=COLORS.get("primary", "#6366F1"),
                            padding=ft.padding.symmetric(horizontal=24, vertical=12),
                            shape=ft.RoundedRectangleBorder(radius=8),
                        ),
                        on_click=on_action,
                    ) if action_text else ft.Container(),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=40,
            border_radius=RADIUS.get("lg", 12),
            bgcolor=COLORS.get("bg_card", "#1E1E2E"),
            border=ft.border.all(1, COLORS.get("border", "#2D2D3D")),
            alignment=ft.alignment.center,
        )


class SkeletonLoader(ft.Container):
    """A skeleton loading placeholder with shimmer effect."""

    def __init__(
        self,
        width: Optional[int] = None,
        height: int = 20,
        border_radius: int = 6,
    ):
        super().__init__(
            width=width,
            height=height,
            border_radius=border_radius,
            bgcolor=COLORS.get("bg_tertiary", "#252536"),
            animate=ft.animation.Animation(1000, ft.AnimationCurve.EASE_IN_OUT),
        )


# Backward compatibility alias
ChartPlaceholder = ChartCard
