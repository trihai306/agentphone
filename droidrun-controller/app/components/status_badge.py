"""Status badge component with refined styling and pulse animation."""

import flet as ft
from ..theme import COLORS, status_color, ANIMATION, RADIUS


class StatusBadge(ft.Container):
    """A status indicator badge with enhanced visual effects and pulse animation.

    Features:
    - Refined color contrast with improved opacity values
    - Optional pulse animation for active states
    - Smooth hover interactions
    - Multiple size variants (small, medium, large)
    """

    def __init__(
        self,
        status: str,
        size: str = "medium",
        show_pulse: bool = False,
        show_dot: bool = True,
        variant: str = "filled",
        **kwargs
    ):
        self._status = status
        self._color = status_color(status)
        self._show_pulse = show_pulse
        self._variant = variant

        # Size configurations with refined values
        sizes = {
            "small": {
                "padding_h": 10,
                "padding_v": 5,
                "font_size": 11,
                "dot_size": 6,
                "spacing": 6,
                "radius": RADIUS["sm"],
            },
            "medium": {
                "padding_h": 12,
                "padding_v": 6,
                "font_size": 12,
                "dot_size": 8,
                "spacing": 8,
                "radius": RADIUS["md"],
            },
            "large": {
                "padding_h": 16,
                "padding_v": 8,
                "font_size": 14,
                "dot_size": 10,
                "spacing": 10,
                "radius": RADIUS["lg"],
            },
        }
        self._config = sizes.get(size, sizes["medium"])

        # Build the dot indicator with optional pulse effect
        dot_content = self._build_dot() if show_dot else None

        # Build row content
        row_content = []
        if dot_content:
            row_content.append(dot_content)

        row_content.append(
            ft.Text(
                status.capitalize(),
                size=self._config["font_size"],
                color=self._color,
                weight=ft.FontWeight.W_600,
            )
        )

        # Variant styles for better contrast
        if variant == "filled":
            # Filled variant with better background contrast
            bg_color = f"{self._color}15"
            border_color = f"{self._color}35"
        elif variant == "outline":
            # Outline variant - transparent background
            bg_color = "transparent"
            border_color = f"{self._color}60"
        elif variant == "subtle":
            # Subtle variant - minimal styling
            bg_color = f"{self._color}08"
            border_color = f"{self._color}20"
        else:
            bg_color = f"{self._color}15"
            border_color = f"{self._color}35"

        super().__init__(
            content=ft.Row(
                row_content,
                spacing=self._config["spacing"],
                alignment=ft.MainAxisAlignment.CENTER,
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            bgcolor=bg_color,
            border=ft.border.all(1, border_color),
            border_radius=self._config["radius"],
            padding=ft.padding.only(
                left=self._config["padding_h"],
                right=self._config["padding_h"] + 2,
                top=self._config["padding_v"],
                bottom=self._config["padding_v"],
            ),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            on_hover=lambda e: self._on_hover(e),
            **kwargs
        )

    def _build_dot(self) -> ft.Control:
        """Build the status dot indicator with optional pulse animation."""
        dot_size = self._config["dot_size"]

        # Inner dot - solid color
        inner_dot = ft.Container(
            width=dot_size,
            height=dot_size,
            border_radius=dot_size // 2,
            bgcolor=self._color,
        )

        if self._show_pulse:
            # Create pulsing glow effect using animated container
            # The outer container creates the glow effect
            pulse_ring = ft.Container(
                content=inner_dot,
                width=dot_size + 8,
                height=dot_size + 8,
                border_radius=(dot_size + 8) // 2,
                alignment=ft.alignment.center,
                shadow=ft.BoxShadow(
                    spread_radius=2,
                    blur_radius=8,
                    color=f"{self._color}50",
                    offset=ft.Offset(0, 0),
                ),
                animate=ft.Animation(1000, ft.AnimationCurve.EASE_IN_OUT),
            )
            return pulse_ring
        else:
            # Static dot with subtle shadow for depth
            return ft.Container(
                content=inner_dot,
                width=dot_size + 4,
                height=dot_size + 4,
                alignment=ft.alignment.center,
                shadow=ft.BoxShadow(
                    spread_radius=0,
                    blur_radius=4,
                    color=f"{self._color}30",
                    offset=ft.Offset(0, 1),
                ) if self._variant != "subtle" else None,
            )

    def _on_hover(self, e):
        """Handle hover effect with subtle color enhancement."""
        if e.data == "true":
            # Enhanced colors on hover
            if self._variant == "filled":
                self.bgcolor = f"{self._color}22"
                self.border = ft.border.all(1, f"{self._color}50")
            elif self._variant == "outline":
                self.bgcolor = f"{self._color}10"
                self.border = ft.border.all(1.5, f"{self._color}80")
            else:
                self.bgcolor = f"{self._color}12"
                self.border = ft.border.all(1, f"{self._color}30")
        else:
            # Reset to original state
            if self._variant == "filled":
                self.bgcolor = f"{self._color}15"
                self.border = ft.border.all(1, f"{self._color}35")
            elif self._variant == "outline":
                self.bgcolor = "transparent"
                self.border = ft.border.all(1, f"{self._color}60")
            else:
                self.bgcolor = f"{self._color}08"
                self.border = ft.border.all(1, f"{self._color}20")
        self.update()


class StatusDot(ft.Container):
    """A minimal status dot indicator without text.

    Useful for compact status displays in tables or lists.
    """

    def __init__(
        self,
        status: str,
        size: int = 10,
        show_pulse: bool = False,
        tooltip: str = None,
        **kwargs
    ):
        self._status = status
        self._color = status_color(status)
        self._size = size
        self._show_pulse = show_pulse

        # Build the dot
        inner_dot = ft.Container(
            width=size,
            height=size,
            border_radius=size // 2,
            bgcolor=self._color,
        )

        if show_pulse:
            # Pulsing variant with glow
            content = ft.Container(
                content=inner_dot,
                width=size + 6,
                height=size + 6,
                border_radius=(size + 6) // 2,
                alignment=ft.alignment.center,
                shadow=ft.BoxShadow(
                    spread_radius=1,
                    blur_radius=6,
                    color=f"{self._color}60",
                    offset=ft.Offset(0, 0),
                ),
            )
        else:
            content = inner_dot

        super().__init__(
            content=content,
            tooltip=tooltip or status.capitalize(),
            **kwargs
        )
