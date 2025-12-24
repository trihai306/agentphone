"""Professional card components for Droidrun Controller."""

import flet as ft
from ..theme import COLORS


class Card(ft.Container):
    """A professional styled card container with enhanced design."""

    def __init__(
        self,
        content: ft.Control = None,
        title: str = None,
        subtitle: str = None,
        icon: str = None,
        icon_color: str = None,
        actions: list[ft.Control] = None,
        **kwargs
    ):
        card_content = []

        # Header with title, icon and actions
        if title or subtitle or icon:
            header_left = []

            if icon:
                header_left.append(
                    ft.Container(
                        content=ft.Icon(
                            icon,
                            size=22,
                            color=icon_color or COLORS["primary"],
                        ),
                        width=44,
                        height=44,
                        border_radius=12,
                        bgcolor=f"{icon_color or COLORS['primary']}20",
                        alignment=ft.alignment.center,
                        shadow=ft.BoxShadow(
                            spread_radius=0,
                            blur_radius=12,
                            color=f"{icon_color or COLORS['primary']}30",
                            offset=ft.Offset(0, 2),
                        ),
                    )
                )
                header_left.append(ft.Container(width=16))

            text_content = []
            if title:
                text_content.append(
                    ft.Text(
                        title,
                        size=18,
                        weight=ft.FontWeight.W_700,
                        color=COLORS["text_primary"],
                    )
                )
            if subtitle:
                text_content.append(
                    ft.Text(
                        subtitle,
                        size=13,
                        color=COLORS["text_secondary"],
                    )
                )

            header_left.append(
                ft.Column(text_content, spacing=4, expand=True)
            )

            header_row = [ft.Row(header_left, expand=True)]

            if actions:
                header_row.append(ft.Row(actions, spacing=8))

            card_content.append(
                ft.Row(
                    header_row,
                    alignment=ft.MainAxisAlignment.SPACE_BETWEEN,
                )
            )
            card_content.append(ft.Container(height=24))

        if content:
            card_content.append(content)

        super().__init__(
            content=ft.Column(card_content, spacing=0),
            bgcolor=COLORS["bg_card"],
            border_radius=20,
            padding=28,
            border=ft.border.all(1, COLORS["border"]),
            animate=ft.Animation(200, ft.AnimationCurve.EASE_OUT),
            on_hover=lambda e: self._on_hover(e),
            **kwargs
        )

    def _on_hover(self, e):
        """Handle hover effect for card."""
        if e.data == "true":
            self.border = ft.border.all(1, COLORS["border_light"])
            self.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=24,
                color="#00000050",
                offset=ft.Offset(0, 8),
            )
        else:
            self.border = ft.border.all(1, COLORS["border"])
            self.shadow = None
        self.update()


class StatsCard(ft.Container):
    """A modern statistics card with icon and optional trend."""

    def __init__(
        self,
        title: str,
        value: str | int,
        icon: str = ft.Icons.INFO,
        color: str = None,
        subtitle: str = None,
        trend: str = None,
        trend_value: str = None,
        **kwargs
    ):
        color = color or COLORS["primary"]

        # Icon container with glow effect
        icon_container = ft.Container(
            content=ft.Icon(icon, size=24, color=color),
            width=56,
            height=56,
            border_radius=16,
            bgcolor=f"{color}20",
            alignment=ft.alignment.center,
            shadow=ft.BoxShadow(
                spread_radius=0,
                blur_radius=16,
                color=f"{color}40",
                offset=ft.Offset(0, 4),
            ),
        )

        # Value and title
        text_content = [
            ft.Text(
                str(value),
                size=36,
                weight=ft.FontWeight.W_800,
                color=COLORS["text_primary"],
            ),
            ft.Text(
                title,
                size=14,
                weight=ft.FontWeight.W_500,
                color=COLORS["text_secondary"],
            ),
        ]

        # Trend indicator
        if trend and trend_value:
            trend_color = COLORS["success"] if trend == "up" else COLORS["error"]
            trend_icon = ft.Icons.TRENDING_UP if trend == "up" else ft.Icons.TRENDING_DOWN
            text_content.append(ft.Container(height=10))
            text_content.append(
                ft.Container(
                    content=ft.Row(
                        [
                            ft.Icon(trend_icon, size=16, color=trend_color),
                            ft.Text(
                                trend_value,
                                size=13,
                                weight=ft.FontWeight.W_600,
                                color=trend_color
                            ),
                        ],
                        spacing=6,
                    ),
                    padding=ft.padding.symmetric(horizontal=10, vertical=6),
                    border_radius=8,
                    bgcolor=f"{trend_color}15",
                )
            )

        super().__init__(
            content=ft.Column(
                [
                    ft.Row(
                        [icon_container, ft.Container(expand=True)],
                    ),
                    ft.Container(height=20),
                    ft.Column(text_content, spacing=4),
                ],
                spacing=0,
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=20,
            padding=28,
            border=ft.border.all(1, COLORS["border"]),
            expand=True,
            animate=ft.Animation(200, ft.AnimationCurve.EASE_OUT),
            on_hover=lambda e: self._on_hover(e),
            **kwargs
        )

    def _on_hover(self, e):
        """Handle hover effect with border glow."""
        if e.data == "true":
            self.border = ft.border.all(1, COLORS["primary"])
            self.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=20,
                color=COLORS["primary_glow"],
                offset=ft.Offset(0, 6),
            )
            self.scale = 1.02
        else:
            self.border = ft.border.all(1, COLORS["border"])
            self.shadow = None
            self.scale = 1.0
        self.update()


class GlassCard(ft.Container):
    """A glass-morphism style card with modern blur effects."""

    def __init__(
        self,
        content: ft.Control = None,
        **kwargs
    ):
        super().__init__(
            content=content,
            bgcolor=COLORS["bg_glass"],
            border_radius=20,
            padding=24,
            border=ft.border.all(1, f"{COLORS['border_light']}60"),
            blur=12,
            animate=ft.Animation(200, ft.AnimationCurve.EASE_OUT),
            **kwargs
        )


class ListCard(ft.Container):
    """A card designed for list items with smooth hover effects."""

    def __init__(
        self,
        content: ft.Control = None,
        on_click=None,
        **kwargs
    ):
        super().__init__(
            content=content,
            bgcolor=COLORS["bg_tertiary"],
            border_radius=14,
            padding=ft.padding.symmetric(horizontal=20, vertical=18),
            on_click=on_click,
            on_hover=lambda e: self._on_hover(e),
            animate=ft.Animation(200, ft.AnimationCurve.EASE_OUT),
            **kwargs
        )

    def _on_hover(self, e):
        """Handle hover effect with elevation and border."""
        if e.data == "true":
            self.bgcolor = COLORS["bg_hover"]
            self.border = ft.border.all(1, COLORS["border_light"])
            self.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=16,
                color="#00000040",
                offset=ft.Offset(0, 4),
            )
            self.scale = 1.01
        else:
            self.bgcolor = COLORS["bg_tertiary"]
            self.border = None
            self.shadow = None
            self.scale = 1.0
        self.update()
