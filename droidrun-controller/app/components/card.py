"""Professional card components for Droidrun Controller.

Polished with refined shadows, improved hover animations, and better visual hierarchy.
"""

import flet as ft
from ..theme import COLORS, get_shadow, ANIMATION, RADIUS


class Card(ft.Container):
    """A professional styled card container with enhanced design and polished interactions."""

    def __init__(
        self,
        content: ft.Control = None,
        title: str = None,
        subtitle: str = None,
        icon: str = None,
        icon_color: str = None,
        actions: list[ft.Control] = None,
        elevated: bool = False,
        **kwargs
    ):
        self._elevated = elevated
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
                        border_radius=RADIUS["lg"],
                        bgcolor=f"{icon_color or COLORS['primary']}15",
                        alignment=ft.alignment.center,
                        shadow=ft.BoxShadow(
                            spread_radius=0,
                            blur_radius=16,
                            color=f"{icon_color or COLORS['primary']}25",
                            offset=ft.Offset(0, 4),
                        ),
                        animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
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
                        weight=ft.FontWeight.W_400,
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

        # Base shadow for elevated cards
        base_shadow = get_shadow("sm") if elevated else None

        super().__init__(
            content=ft.Column(card_content, spacing=0),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["xl"],
            padding=28,
            border=ft.border.all(1, COLORS["border"]),
            shadow=base_shadow,
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            animate_scale=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            on_hover=lambda e: self._on_hover(e),
            **kwargs
        )

    def _on_hover(self, e):
        """Handle hover effect with smooth elevation transition."""
        if e.data == "true":
            self.border = ft.border.all(1, COLORS["border_light"])
            self.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=32,
                color="#00000035",
                offset=ft.Offset(0, 12),
            )
            self.scale = 1.005
        else:
            self.border = ft.border.all(1, COLORS["border"])
            self.shadow = get_shadow("sm") if self._elevated else None
            self.scale = 1.0
        self.update()


class StatsCard(ft.Container):
    """A modern statistics card with icon, optional trend, and refined hover effects."""

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
        self._color = color or COLORS["primary"]

        # Icon container with enhanced glow effect
        icon_container = ft.Container(
            content=ft.Icon(icon, size=24, color=self._color),
            width=56,
            height=56,
            border_radius=RADIUS["lg"],
            bgcolor=f"{self._color}12",
            alignment=ft.alignment.center,
            border=ft.border.all(1, f"{self._color}20"),
            shadow=ft.BoxShadow(
                spread_radius=0,
                blur_radius=20,
                color=f"{self._color}30",
                offset=ft.Offset(0, 6),
            ),
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
        )

        # Value and title with improved hierarchy
        text_content = [
            ft.Text(
                str(value),
                size=36,
                weight=ft.FontWeight.W_800,
                color=COLORS["text_primary"],
            ),
            ft.Container(height=2),
            ft.Text(
                title,
                size=14,
                weight=ft.FontWeight.W_500,
                color=COLORS["text_secondary"],
            ),
        ]

        # Trend indicator with polished styling
        if trend and trend_value:
            trend_color = COLORS["success"] if trend == "up" else COLORS["error"]
            trend_icon = ft.Icons.TRENDING_UP if trend == "up" else ft.Icons.TRENDING_DOWN
            text_content.append(ft.Container(height=12))
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
                    padding=ft.padding.symmetric(horizontal=12, vertical=6),
                    border_radius=RADIUS["sm"],
                    bgcolor=f"{trend_color}12",
                    border=ft.border.all(1, f"{trend_color}20"),
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
            border_radius=RADIUS["xl"],
            padding=28,
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("xs"),
            expand=True,
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            animate_scale=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            on_hover=lambda e: self._on_hover(e),
            **kwargs
        )

    def _on_hover(self, e):
        """Handle hover effect with color-coordinated glow."""
        if e.data == "true":
            self.border = ft.border.all(1, f"{self._color}50")
            self.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=28,
                color=f"{self._color}25",
                offset=ft.Offset(0, 10),
            )
            self.scale = 1.02
        else:
            self.border = ft.border.all(1, COLORS["border"])
            self.shadow = get_shadow("xs")
            self.scale = 1.0
        self.update()


class GlassCard(ft.Container):
    """A glass-morphism style card with modern blur effects and refined interactions."""

    def __init__(
        self,
        content: ft.Control = None,
        blur_radius: int = 16,
        **kwargs
    ):
        self._blur_radius = blur_radius
        super().__init__(
            content=content,
            bgcolor=COLORS["bg_glass"],
            border_radius=RADIUS["xl"],
            padding=24,
            border=ft.border.all(1, f"{COLORS['border_light']}50"),
            blur=blur_radius,
            shadow=ft.BoxShadow(
                spread_radius=0,
                blur_radius=12,
                color="#00000010",
                offset=ft.Offset(0, 4),
            ),
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            animate_scale=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            on_hover=lambda e: self._on_hover(e),
            **kwargs
        )

    def _on_hover(self, e):
        """Handle hover effect with enhanced glass depth."""
        if e.data == "true":
            self.border = ft.border.all(1, f"{COLORS['border_light']}80")
            self.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=24,
                color="#00000020",
                offset=ft.Offset(0, 8),
            )
            self.scale = 1.01
        else:
            self.border = ft.border.all(1, f"{COLORS['border_light']}50")
            self.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=12,
                color="#00000010",
                offset=ft.Offset(0, 4),
            )
            self.scale = 1.0
        self.update()


class ListCard(ft.Container):
    """A card designed for list items with smooth hover effects and refined styling."""

    def __init__(
        self,
        content: ft.Control = None,
        on_click=None,
        selected: bool = False,
        **kwargs
    ):
        self._selected = selected

        # Determine initial styling based on selection state
        initial_bgcolor = COLORS["bg_hover"] if selected else COLORS["bg_tertiary"]
        initial_border = ft.border.all(1, COLORS["primary"]) if selected else ft.border.all(1, COLORS["border_subtle"])

        super().__init__(
            content=content,
            bgcolor=initial_bgcolor,
            border_radius=RADIUS["lg"],
            padding=ft.padding.symmetric(horizontal=20, vertical=18),
            border=initial_border,
            shadow=get_shadow("xs") if selected else None,
            on_click=on_click,
            on_hover=lambda e: self._on_hover(e),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            animate_scale=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            **kwargs
        )

    def _on_hover(self, e):
        """Handle hover effect with smooth elevation and subtle highlighting."""
        if e.data == "true":
            self.bgcolor = COLORS["bg_hover"]
            self.border = ft.border.all(1, COLORS["border_light"])
            self.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=20,
                color="#00000030",
                offset=ft.Offset(0, 6),
            )
            self.scale = 1.008
        else:
            if self._selected:
                self.bgcolor = COLORS["bg_hover"]
                self.border = ft.border.all(1, COLORS["primary"])
                self.shadow = get_shadow("xs")
            else:
                self.bgcolor = COLORS["bg_tertiary"]
                self.border = ft.border.all(1, COLORS["border_subtle"])
                self.shadow = None
            self.scale = 1.0
        self.update()

    def set_selected(self, selected: bool):
        """Update the selection state of the list card."""
        self._selected = selected
        if selected:
            self.bgcolor = COLORS["bg_hover"]
            self.border = ft.border.all(1, COLORS["primary"])
            self.shadow = get_shadow("xs")
        else:
            self.bgcolor = COLORS["bg_tertiary"]
            self.border = ft.border.all(1, COLORS["border_subtle"])
            self.shadow = None
        self.update()
