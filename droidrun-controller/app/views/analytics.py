"""Professional Token Analytics view for Droidrun Controller - 2025 Edition.

Polished with improved chart containers, better stat displays,
and enhanced data visualization with hover effects.
"""

import flet as ft
from datetime import datetime, timedelta
from ..theme import COLORS, RADIUS, get_shadow, ANIMATION
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
        self.selected_period = "week"  # day, week, month

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
        """Build the polished header section with enhanced styling."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Column(
                        [
                            ft.Row(
                                [
                                    ft.Text(
                                        "Token Analytics",
                                        size=32,
                                        weight=ft.FontWeight.W_800,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Container(width=16),
                                    ft.Container(
                                        content=ft.Icon(
                                            ft.Icons.ANALYTICS_ROUNDED,
                                            size=22,
                                            color=COLORS["accent_orange"],
                                        ),
                                        width=44,
                                        height=44,
                                        bgcolor=f"{COLORS['accent_orange']}12",
                                        border_radius=RADIUS["lg"],
                                        alignment=ft.alignment.center,
                                        border=ft.border.all(1, f"{COLORS['accent_orange']}20"),
                                        shadow=ft.BoxShadow(
                                            spread_radius=0,
                                            blur_radius=16,
                                            color=f"{COLORS['accent_orange']}25",
                                            offset=ft.Offset(0, 4),
                                        ),
                                    ),
                                    ft.Container(width=12),
                                    ft.Container(
                                        content=ft.Text(
                                            "Live",
                                            size=11,
                                            weight=ft.FontWeight.W_600,
                                            color=COLORS["text_inverse"],
                                        ),
                                        bgcolor=COLORS["success"],
                                        border_radius=10,
                                        padding=ft.padding.symmetric(horizontal=10, vertical=4),
                                    ),
                                ],
                                vertical_alignment=ft.CrossAxisAlignment.CENTER,
                            ),
                            ft.Container(height=4),
                            ft.Text(
                                "Monitor token consumption, costs, and usage patterns",
                                size=14,
                                weight=ft.FontWeight.W_400,
                                color=COLORS["text_secondary"],
                            ),
                        ],
                        spacing=4,
                    ),
                    ft.Container(expand=True),
                    # Period selector
                    ft.Row(
                        [
                            self._build_period_chip("day", "Today"),
                            ft.Container(width=8),
                            self._build_period_chip("week", "Week"),
                            ft.Container(width=8),
                            self._build_period_chip("month", "Month"),
                        ],
                        spacing=0,
                    ),
                    ft.Container(width=20),
                    # Action buttons
                    ft.Row(
                        [
                            ft.Container(
                                content=ft.Row(
                                    [
                                        ft.Container(
                                            content=ft.Icon(
                                                ft.Icons.FILE_DOWNLOAD_ROUNDED,
                                                size=16,
                                                color=COLORS["text_secondary"],
                                            ),
                                            width=32,
                                            height=32,
                                            bgcolor=COLORS["bg_tertiary"],
                                            border_radius=RADIUS["sm"],
                                            alignment=ft.alignment.center,
                                        ),
                                        ft.Container(width=10),
                                        ft.Text(
                                            "Export",
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
                                on_click=self._on_export,
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
                                            bgcolor=f"{COLORS['accent_orange']}40",
                                            border_radius=RADIUS["sm"],
                                            alignment=ft.alignment.center,
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
                                bgcolor=COLORS["accent_orange"],
                                padding=ft.padding.only(left=8, right=18, top=10, bottom=10),
                                border_radius=RADIUS["lg"],
                                shadow=ft.BoxShadow(
                                    spread_radius=0,
                                    blur_radius=20,
                                    color=f"{COLORS['accent_orange']}40",
                                    offset=ft.Offset(0, 6),
                                ),
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

    def _build_period_chip(self, key: str, label: str):
        """Build a period selector chip."""
        is_active = self.selected_period == key

        return ft.Container(
            content=ft.Text(
                label,
                size=12,
                weight=ft.FontWeight.W_600 if is_active else ft.FontWeight.W_500,
                color=COLORS["text_inverse"] if is_active else COLORS["text_secondary"],
            ),
            padding=ft.padding.symmetric(horizontal=14, vertical=10),
            border_radius=RADIUS["md"],
            bgcolor=COLORS["accent_orange"] if is_active else COLORS["bg_tertiary"],
            border=ft.border.all(1, f"{COLORS['accent_orange']}30" if is_active else COLORS["border_subtle"]),
            shadow=ft.BoxShadow(
                spread_radius=0,
                blur_radius=12,
                color=f"{COLORS['accent_orange']}30",
                offset=ft.Offset(0, 4),
            ) if is_active else None,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            on_click=lambda e, k=key: self._on_period_click(k),
            on_hover=lambda e, active=is_active: self._on_period_hover(e, active),
        )

    def _on_period_click(self, key: str):
        """Handle period chip click."""
        self.selected_period = key
        self.content = self._build_content()
        self.update()

    def _on_period_hover(self, e, is_active: bool):
        """Handle period chip hover."""
        if is_active:
            return
        if e.data == "true":
            e.control.bgcolor = f"{COLORS['accent_orange']}15"
            e.control.border = ft.border.all(1, f"{COLORS['accent_orange']}30")
        else:
            e.control.bgcolor = COLORS["bg_tertiary"]
            e.control.border = ft.border.all(1, COLORS["border_subtle"])
        e.control.update()

    def _build_stats(self):
        """Build the enhanced stats section with hover effects."""
        # Calculate trend based on mock data
        token_change = "+12%"
        cost_change = "-5%"

        stats = [
            {
                "title": "Total Tokens",
                "value": self._format_number(self.total_tokens),
                "subtitle": "All time consumption",
                "icon": ft.Icons.TOKEN_ROUNDED,
                "color": COLORS["accent_orange"],
                "trend": "up",
                "trend_value": token_change,
            },
            {
                "title": "Today",
                "value": self._format_number(self.tokens_today),
                "subtitle": "Last 24 hours",
                "icon": ft.Icons.TODAY_ROUNDED,
                "color": COLORS["primary"],
                "trend": "up",
                "trend_value": "+8%",
            },
            {
                "title": "This Week",
                "value": self._format_number(self.tokens_week),
                "subtitle": "Last 7 days",
                "icon": ft.Icons.DATE_RANGE_ROUNDED,
                "color": COLORS["accent_cyan"],
                "trend": None,
                "trend_value": None,
            },
            {
                "title": "Est. Cost",
                "value": f"${self.cost_estimate:.2f}",
                "subtitle": "Based on current usage",
                "icon": ft.Icons.SAVINGS_ROUNDED,
                "color": COLORS["success"],
                "trend": "down",
                "trend_value": cost_change,
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
            is_up = stat["trend"] == "up"
            # For cost, down is good; for tokens, up might be neutral
            trend_color = COLORS["success"] if (stat["title"] == "Est. Cost" and not is_up) or (stat["title"] != "Est. Cost" and is_up) else COLORS["error"]
            trend_icon = ft.Icons.TRENDING_UP_ROUNDED if is_up else ft.Icons.TRENDING_DOWN_ROUNDED
            trend_indicator = ft.Container(
                content=ft.Row(
                    [
                        ft.Icon(
                            trend_icon,
                            size=14,
                            color=trend_color,
                        ),
                        ft.Container(width=2),
                        ft.Text(
                            stat["trend_value"],
                            size=11,
                            weight=ft.FontWeight.W_600,
                            color=trend_color,
                        ),
                    ],
                ),
                padding=ft.padding.symmetric(horizontal=8, vertical=4),
                border_radius=6,
                bgcolor=f"{trend_color}12",
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
                            trend_indicator if trend_indicator else ft.Container(),
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

    def _build_chart_section(self):
        """Build the polished chart section with enhanced bar chart."""
        # Generate sample data based on selected period
        if self.selected_period == "day":
            labels = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"]
            values = [1200, 800, 3500, 2800, 4000, 2200]
        elif self.selected_period == "week":
            labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            values = [12000, 8500, 15000, 9200, 11000, 5500, 8500]
        else:  # month
            labels = ["Week 1", "Week 2", "Week 3", "Week 4"]
            values = [28000, 32000, 35000, 30000]

        max_value = max(values) if values else 1
        total = sum(values)
        avg = total // len(values)

        bars = []
        for i, (label, value) in enumerate(zip(labels, values)):
            bar_height = (value / max_value) * 160
            is_today = i == len(labels) - 1

            bars.append(
                ft.Container(
                    content=ft.Column(
                        [
                            ft.Text(
                                self._format_number(value),
                                size=11,
                                weight=ft.FontWeight.W_600,
                                color=COLORS["accent_orange"] if is_today else COLORS["text_muted"],
                                text_align=ft.TextAlign.CENTER,
                            ),
                            ft.Container(height=8),
                            ft.Container(
                                width=44 if len(labels) <= 7 else 36,
                                height=bar_height,
                                border_radius=ft.border_radius.only(top_left=8, top_right=8),
                                bgcolor=COLORS["accent_orange"] if is_today else f"{COLORS['accent_orange']}50",
                                border=ft.border.all(1, f"{COLORS['accent_orange']}30") if is_today else None,
                                shadow=ft.BoxShadow(
                                    spread_radius=0,
                                    blur_radius=12,
                                    color=f"{COLORS['accent_orange']}30",
                                    offset=ft.Offset(0, 4),
                                ) if is_today else None,
                                animate=ft.Animation(ANIMATION["slow"], ft.AnimationCurve.EASE_OUT),
                            ),
                            ft.Container(height=10),
                            ft.Text(
                                label,
                                size=12,
                                weight=ft.FontWeight.W_600 if is_today else ft.FontWeight.W_400,
                                color=COLORS["text_primary"] if is_today else COLORS["text_muted"],
                            ),
                        ],
                        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                        spacing=0,
                    ),
                    on_hover=lambda e, idx=i: self._on_bar_hover(e, idx == len(labels) - 1),
                )
            )

        # Period label
        period_labels = {
            "day": "Last 24 Hours",
            "week": "Last 7 Days",
            "month": "Last 30 Days",
        }

        return ft.Container(
            content=ft.Column(
                [
                    # Section header
                    ft.Row(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.BAR_CHART_ROUNDED,
                                    size=20,
                                    color=COLORS["accent_orange"],
                                ),
                                width=40,
                                height=40,
                                border_radius=RADIUS["md"],
                                bgcolor=f"{COLORS['accent_orange']}12",
                                alignment=ft.alignment.center,
                                border=ft.border.all(1, f"{COLORS['accent_orange']}20"),
                            ),
                            ft.Container(width=14),
                            ft.Column(
                                [
                                    ft.Text(
                                        "Token Usage",
                                        size=17,
                                        weight=ft.FontWeight.W_700,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Text(
                                        period_labels.get(self.selected_period, ""),
                                        size=12,
                                        color=COLORS["text_secondary"],
                                    ),
                                ],
                                spacing=2,
                                expand=True,
                            ),
                            # Summary badges
                            ft.Container(
                                content=ft.Row(
                                    [
                                        ft.Container(
                                            width=6,
                                            height=6,
                                            border_radius=3,
                                            bgcolor=COLORS["accent_orange"],
                                        ),
                                        ft.Container(width=6),
                                        ft.Text(
                                            f"Total: {self._format_number(total)}",
                                            size=11,
                                            weight=ft.FontWeight.W_600,
                                            color=COLORS["text_secondary"],
                                        ),
                                    ],
                                ),
                                padding=ft.padding.symmetric(horizontal=12, vertical=8),
                                border_radius=RADIUS["md"],
                                bgcolor=f"{COLORS['accent_orange']}10",
                                border=ft.border.all(1, f"{COLORS['accent_orange']}15"),
                            ),
                            ft.Container(width=8),
                            ft.Container(
                                content=ft.Row(
                                    [
                                        ft.Icon(
                                            ft.Icons.TRENDING_UP_ROUNDED,
                                            size=14,
                                            color=COLORS["text_muted"],
                                        ),
                                        ft.Container(width=4),
                                        ft.Text(
                                            f"Avg: {self._format_number(avg)}",
                                            size=11,
                                            weight=ft.FontWeight.W_500,
                                            color=COLORS["text_muted"],
                                        ),
                                    ],
                                ),
                                padding=ft.padding.symmetric(horizontal=12, vertical=8),
                                border_radius=RADIUS["md"],
                                bgcolor=COLORS["bg_tertiary"],
                                border=ft.border.all(1, COLORS["border_subtle"]),
                            ),
                            ft.Container(width=8),
                            ft.Container(
                                content=ft.Row(
                                    [
                                        ft.Icon(ft.Icons.OPEN_IN_NEW_ROUNDED, size=14, color=COLORS["text_secondary"]),
                                        ft.Container(width=6),
                                        ft.Text("Details", size=12, weight=ft.FontWeight.W_500, color=COLORS["text_secondary"]),
                                    ],
                                ),
                                padding=ft.padding.symmetric(horizontal=14, vertical=10),
                                border_radius=RADIUS["md"],
                                bgcolor=COLORS["bg_tertiary"],
                                border=ft.border.all(1, COLORS["border_subtle"]),
                                animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                                on_click=self._on_view_details,
                                on_hover=self._on_button_hover,
                            ),
                        ],
                    ),
                    ft.Container(height=24),
                    # Chart area
                    ft.Container(
                        content=ft.Column(
                            [
                                # Y-axis labels and chart
                                ft.Row(
                                    [
                                        # Y-axis labels
                                        ft.Column(
                                            [
                                                ft.Text(self._format_number(max_value), size=10, color=COLORS["text_muted"]),
                                                ft.Container(expand=True),
                                                ft.Text(self._format_number(max_value // 2), size=10, color=COLORS["text_muted"]),
                                                ft.Container(expand=True),
                                                ft.Text("0", size=10, color=COLORS["text_muted"]),
                                            ],
                                            height=190,
                                            width=40,
                                            alignment=ft.MainAxisAlignment.SPACE_BETWEEN,
                                        ),
                                        ft.Container(width=8),
                                        # Chart bars
                                        ft.Container(
                                            content=ft.Stack(
                                                [
                                                    # Grid lines
                                                    ft.Column(
                                                        [
                                                            ft.Container(
                                                                height=1,
                                                                bgcolor=COLORS["border_subtle"],
                                                            ),
                                                            ft.Container(expand=True),
                                                            ft.Container(
                                                                height=1,
                                                                bgcolor=COLORS["border_subtle"],
                                                            ),
                                                            ft.Container(expand=True),
                                                            ft.Container(
                                                                height=1,
                                                                bgcolor=COLORS["border_light"],
                                                            ),
                                                        ],
                                                        height=160,
                                                    ),
                                                    # Bars
                                                    ft.Container(
                                                        content=ft.Row(
                                                            bars,
                                                            alignment=ft.MainAxisAlignment.SPACE_AROUND,
                                                            vertical_alignment=ft.CrossAxisAlignment.END,
                                                        ),
                                                        height=210,
                                                        alignment=ft.alignment.bottom_center,
                                                    ),
                                                ],
                                            ),
                                            expand=True,
                                            height=210,
                                        ),
                                    ],
                                ),
                            ],
                        ),
                        padding=ft.padding.only(top=10, left=10, right=20, bottom=10),
                        bgcolor=COLORS["bg_tertiary"],
                        border_radius=RADIUS["lg"],
                        border=ft.border.all(1, COLORS["border_subtle"]),
                    ),
                ],
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["xl"],
            padding=28,
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("xs"),
        )

    def _on_bar_hover(self, e, is_today: bool):
        """Handle bar hover effect."""
        bar_container = e.control.content.controls[2]  # The bar container
        if e.data == "true":
            bar_container.bgcolor = COLORS["accent_orange"]
            bar_container.border = ft.border.all(1, f"{COLORS['accent_orange']}40")
            bar_container.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=16,
                color=f"{COLORS['accent_orange']}40",
                offset=ft.Offset(0, 6),
            )
        else:
            bar_container.bgcolor = COLORS["accent_orange"] if is_today else f"{COLORS['accent_orange']}50"
            bar_container.border = ft.border.all(1, f"{COLORS['accent_orange']}30") if is_today else None
            bar_container.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=12,
                color=f"{COLORS['accent_orange']}30",
                offset=ft.Offset(0, 4),
            ) if is_today else None
        bar_container.update()

    def _build_usage_breakdown(self):
        """Build polished usage breakdown by model/feature."""
        usage_items = [
            {"name": "GPT-4", "tokens": 75000, "color": COLORS["accent_purple"], "percentage": 60, "icon": ft.Icons.SMART_TOY_ROUNDED},
            {"name": "Claude 3.5", "tokens": 35000, "color": COLORS["accent_cyan"], "percentage": 28, "icon": ft.Icons.PSYCHOLOGY_ROUNDED},
            {"name": "GPT-3.5", "tokens": 15000, "color": COLORS["success"], "percentage": 12, "icon": ft.Icons.AUTO_AWESOME_ROUNDED},
        ]

        items = [self._build_usage_item(item) for item in usage_items]

        return ft.Container(
            content=ft.Column(
                [
                    # Section header
                    ft.Row(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.PIE_CHART_ROUNDED,
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
                                        "Usage by Model",
                                        size=17,
                                        weight=ft.FontWeight.W_700,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Text(
                                        "Token distribution across AI models",
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
                                        ft.Icon(ft.Icons.SETTINGS_ROUNDED, size=14, color=COLORS["text_secondary"]),
                                        ft.Container(width=6),
                                        ft.Text("Manage", size=12, weight=ft.FontWeight.W_500, color=COLORS["text_secondary"]),
                                    ],
                                ),
                                padding=ft.padding.symmetric(horizontal=14, vertical=10),
                                border_radius=RADIUS["md"],
                                bgcolor=COLORS["bg_tertiary"],
                                border=ft.border.all(1, COLORS["border_subtle"]),
                                animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                                on_hover=self._on_button_hover,
                            ),
                        ],
                    ),
                    ft.Container(height=24),
                    # Usage items
                    ft.Column(items, spacing=16),
                ],
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["xl"],
            padding=28,
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("xs"),
        )

    def _build_usage_item(self, item: dict):
        """Build a polished usage breakdown item with hover effect."""
        color = item["color"]

        return ft.Container(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    item["icon"],
                                    size=20,
                                    color=color,
                                ),
                                width=44,
                                height=44,
                                border_radius=RADIUS["md"],
                                bgcolor=f"{color}12",
                                alignment=ft.alignment.center,
                                border=ft.border.all(1, f"{color}20"),
                                shadow=ft.BoxShadow(
                                    spread_radius=0,
                                    blur_radius=12,
                                    color=f"{color}20",
                                    offset=ft.Offset(0, 4),
                                ),
                            ),
                            ft.Container(width=16),
                            ft.Column(
                                [
                                    ft.Text(
                                        item["name"],
                                        size=15,
                                        weight=ft.FontWeight.W_600,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Container(height=2),
                                    ft.Text(
                                        f"{self._format_number(item['tokens'])} tokens",
                                        size=12,
                                        color=COLORS["text_secondary"],
                                    ),
                                ],
                                spacing=0,
                                expand=True,
                            ),
                            ft.Container(
                                content=ft.Text(
                                    f"{item['percentage']}%",
                                    size=14,
                                    weight=ft.FontWeight.W_700,
                                    color=color,
                                ),
                                bgcolor=f"{color}15",
                                border_radius=RADIUS["md"],
                                padding=ft.padding.symmetric(horizontal=14, vertical=8),
                                border=ft.border.all(1, f"{color}20"),
                            ),
                        ],
                        vertical_alignment=ft.CrossAxisAlignment.CENTER,
                    ),
                    ft.Container(height=12),
                    # Progress bar with track
                    ft.Container(
                        content=ft.Stack(
                            [
                                # Track
                                ft.Container(
                                    width=None,
                                    height=8,
                                    border_radius=4,
                                    bgcolor=COLORS["bg_tertiary"],
                                ),
                                # Progress
                                ft.Container(
                                    width=item["percentage"] * 4,  # Relative to container width
                                    height=8,
                                    border_radius=4,
                                    bgcolor=color,
                                    shadow=ft.BoxShadow(
                                        spread_radius=0,
                                        blur_radius=8,
                                        color=f"{color}40",
                                        offset=ft.Offset(0, 2),
                                    ),
                                    animate=ft.Animation(ANIMATION["slow"], ft.AnimationCurve.EASE_OUT),
                                ),
                            ],
                        ),
                        expand=True,
                    ),
                ],
            ),
            bgcolor=COLORS["bg_tertiary"],
            border_radius=RADIUS["lg"],
            padding=ft.padding.symmetric(horizontal=20, vertical=18),
            border=ft.border.all(1, COLORS["border_subtle"]),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            animate_scale=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            on_hover=lambda e, c=color: self._on_usage_item_hover(e, c),
        )

    def _on_usage_item_hover(self, e, color):
        """Handle usage item hover effect."""
        if e.data == "true":
            e.control.bgcolor = COLORS["bg_hover"]
            e.control.border = ft.border.all(1, f"{color}30")
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=20,
                color=f"{color}15",
                offset=ft.Offset(0, 6),
            )
            e.control.scale = 1.01
        else:
            e.control.bgcolor = COLORS["bg_tertiary"]
            e.control.border = ft.border.all(1, COLORS["border_subtle"])
            e.control.shadow = None
            e.control.scale = 1.0
        e.control.update()

    def _format_number(self, num):
        """Format large numbers with K suffix."""
        if num >= 1000:
            return f"{num/1000:.1f}K"
        return str(num)

    def _on_primary_hover(self, e):
        """Handle primary button hover effect."""
        if e.data == "true":
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=28,
                color=f"{COLORS['accent_orange']}55",
                offset=ft.Offset(0, 10),
            )
            e.control.scale = 1.02
        else:
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=20,
                color=f"{COLORS['accent_orange']}40",
                offset=ft.Offset(0, 6),
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
