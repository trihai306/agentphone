"""Status badge component."""

import flet as ft
from ..theme import COLORS, status_color


class StatusBadge(ft.Container):
    """A status indicator badge with enhanced visual effects."""

    def __init__(
        self,
        status: str,
        size: str = "medium",
        show_pulse: bool = False,
        **kwargs
    ):
        color = status_color(status)

        # Size configurations
        sizes = {
            "small": {"padding": 6, "font_size": 11, "dot_size": 7, "spacing": 6},
            "medium": {"padding": 8, "font_size": 12, "dot_size": 8, "spacing": 8},
            "large": {"padding": 10, "font_size": 14, "dot_size": 10, "spacing": 10},
        }
        config = sizes.get(size, sizes["medium"])

        # Create pulsing dot for active statuses
        dot_content = ft.Container(
            width=config["dot_size"],
            height=config["dot_size"],
            border_radius=config["dot_size"] // 2,
            bgcolor=color,
            shadow=ft.BoxShadow(
                spread_radius=0,
                blur_radius=6,
                color=f"{color}60",
                offset=ft.Offset(0, 0),
            ) if show_pulse else None,
        )

        super().__init__(
            content=ft.Row(
                [
                    dot_content,
                    ft.Text(
                        status.capitalize(),
                        size=config["font_size"],
                        color=color,
                        weight=ft.FontWeight.W_600,
                    ),
                ],
                spacing=config["spacing"],
            ),
            bgcolor=f"{color}18",
            border=ft.border.all(1, f"{color}30"),
            border_radius=12,
            padding=ft.padding.only(
                left=config["padding"] + 4,
                right=config["padding"] + 8,
                top=config["padding"],
                bottom=config["padding"],
            ),
            **kwargs
        )
