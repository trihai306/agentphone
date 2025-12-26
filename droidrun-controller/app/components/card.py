"""Professional card components for Droidrun Controller.

Polished with refined shadows, improved hover animations, and better visual hierarchy.
"""

import flet as ft
from ..theme import get_colors, get_shadow, ANIMATION, RADIUS


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
        colors = get_colors()
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
                            color=icon_color or colors["primary"],
                        ),
                        width=44,
                        height=44,
                        border_radius=RADIUS["lg"],
                        bgcolor=f"{icon_color or colors['primary']}15",
                        alignment=ft.alignment.center,
                        shadow=ft.BoxShadow(
                            spread_radius=0,
                            blur_radius=4,
                            color=f"{icon_color or colors['primary']}10",
                            offset=ft.Offset(0, 2),
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
                        color=colors["text_primary"],
                    )
                )
            if subtitle:
                text_content.append(
                    ft.Text(
                        subtitle,
                        size=13,
                        weight=ft.FontWeight.W_400,
                        color=colors["text_secondary"],
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
            bgcolor=colors["bg_card"],
            border_radius=RADIUS["xl"],
            padding=28,
            border=ft.border.all(1, colors["border"]),
            shadow=base_shadow,
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            animate_scale=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            on_hover=lambda e: self._on_hover(e),
            **kwargs
        )

    def _on_hover(self, e):
        """Handle hover effect with smooth elevation transition."""
        colors = get_colors()
        if e.data == "true":
            self.border = ft.border.all(1, colors["border_light"])
            self.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=10,
                color="#00000015",
                offset=ft.Offset(0, 4),
            )
            self.scale = 1.002
        else:
            self.border = ft.border.all(1, colors["border"])
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
        colors = get_colors()
        self._color = color or colors["primary"]

        # Icon container with subtle shadow
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
                blur_radius=6,
                color=f"{self._color}12",
                offset=ft.Offset(0, 2),
            ),
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
        )

        # Value and title with improved hierarchy
        text_content = [
            ft.Text(
                str(value),
                size=36,
                weight=ft.FontWeight.W_800,
                color=colors["text_primary"],
            ),
            ft.Container(height=2),
            ft.Text(
                title,
                size=14,
                weight=ft.FontWeight.W_500,
                color=colors["text_secondary"],
            ),
        ]

        # Trend indicator with polished styling
        if trend and trend_value:
            trend_color = colors["success"] if trend == "up" else colors["error"]
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
            bgcolor=colors["bg_card"],
            border_radius=RADIUS["xl"],
            padding=28,
            border=ft.border.all(1, colors["border"]),
            shadow=get_shadow("xs"),
            expand=True,
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            animate_scale=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            on_hover=lambda e: self._on_hover(e),
            **kwargs
        )

    def _on_hover(self, e):
        """Handle hover effect with subtle elevation."""
        colors = get_colors()
        if e.data == "true":
            self.border = ft.border.all(1, f"{self._color}40")
            self.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=10,
                color=f"{self._color}15",
                offset=ft.Offset(0, 4),
            )
            self.scale = 1.01
        else:
            self.border = ft.border.all(1, colors["border"])
            self.shadow = get_shadow("xs")
            self.scale = 1.0
        self.update()


class GlassCard(ft.Container):
    """A glass-morphism style card with subtle blur effects and refined interactions."""

    def __init__(
        self,
        content: ft.Control = None,
        blur_radius: int = 16,
        **kwargs
    ):
        self._blur_radius = blur_radius
        colors = get_colors()
        super().__init__(
            content=content,
            bgcolor=colors["bg_glass"],
            border_radius=RADIUS["xl"],
            padding=24,
            border=ft.border.all(1, f"{colors['border_light']}50"),
            blur=blur_radius,
            shadow=ft.BoxShadow(
                spread_radius=0,
                blur_radius=4,
                color="#00000008",
                offset=ft.Offset(0, 2),
            ),
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            animate_scale=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            on_hover=lambda e: self._on_hover(e),
            **kwargs
        )

    def _on_hover(self, e):
        """Handle hover effect with subtle glass depth."""
        colors = get_colors()
        if e.data == "true":
            self.border = ft.border.all(1, f"{colors['border_light']}80")
            self.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=8,
                color="#0000000D",
                offset=ft.Offset(0, 4),
            )
            self.scale = 1.005
        else:
            self.border = ft.border.all(1, f"{colors['border_light']}50")
            self.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=4,
                color="#00000008",
                offset=ft.Offset(0, 2),
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
        """Handle hover effect with subtle elevation."""
        if e.data == "true":
            self.bgcolor = COLORS["bg_hover"]
            self.border = ft.border.all(1, COLORS["border_light"])
            self.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=8,
                color="#00000012",
                offset=ft.Offset(0, 3),
            )
            self.scale = 1.003
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
