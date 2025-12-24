"""Loading and spinner components."""

import flet as ft
from ..theme import COLORS


class LoadingSpinner(ft.Container):
    """A modern loading spinner."""

    def __init__(
        self,
        size: int = 40,
        color: str = None,
        **kwargs
    ):
        color = color or COLORS["primary"]

        super().__init__(
            content=ft.ProgressRing(
                width=size,
                height=size,
                stroke_width=3,
                color=color,
            ),
            **kwargs
        )


class LoadingOverlay(ft.Container):
    """A full-screen loading overlay with blur effect."""

    def __init__(
        self,
        message: str = "Loading...",
        **kwargs
    ):
        super().__init__(
            content=ft.Container(
                content=ft.Column(
                    [
                        ft.ProgressRing(
                            width=50,
                            height=50,
                            stroke_width=4,
                            color=COLORS["primary"],
                        ),
                        ft.Container(height=20),
                        ft.Text(
                            message,
                            size=16,
                            weight=ft.FontWeight.W_500,
                            color=COLORS["text_primary"],
                        ),
                    ],
                    horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                ),
                bgcolor=COLORS["bg_card"],
                border_radius=20,
                padding=40,
                border=ft.border.all(1, COLORS["border_light"]),
                shadow=ft.BoxShadow(
                    spread_radius=0,
                    blur_radius=40,
                    color="#00000060",
                    offset=ft.Offset(0, 10),
                ),
            ),
            bgcolor="#00000080",
            alignment=ft.alignment.center,
            expand=True,
            **kwargs
        )


class SkeletonLoader(ft.Container):
    """A skeleton loader for content placeholders."""

    def __init__(
        self,
        width: int = None,
        height: int = 20,
        **kwargs
    ):
        super().__init__(
            width=width,
            height=height,
            bgcolor=COLORS["bg_tertiary"],
            border_radius=8,
            animate=ft.Animation(1000, ft.AnimationCurve.EASE_IN_OUT),
            **kwargs
        )


class EmptyState(ft.Container):
    """An empty state component for when there's no data."""

    def __init__(
        self,
        icon: str = ft.Icons.INBOX_OUTLINED,
        title: str = "No data available",
        description: str = None,
        action_button: ft.Control = None,
        **kwargs
    ):
        content_items = [
            ft.Container(
                content=ft.Icon(
                    icon,
                    size=64,
                    color=COLORS["text_muted"],
                ),
                width=120,
                height=120,
                border_radius=60,
                bgcolor=COLORS["bg_tertiary"],
                alignment=ft.alignment.center,
            ),
            ft.Container(height=24),
            ft.Text(
                title,
                size=20,
                weight=ft.FontWeight.W_700,
                color=COLORS["text_primary"],
                text_align=ft.TextAlign.CENTER,
            ),
        ]

        if description:
            content_items.append(ft.Container(height=8))
            content_items.append(
                ft.Text(
                    description,
                    size=14,
                    color=COLORS["text_secondary"],
                    text_align=ft.TextAlign.CENTER,
                    max_lines=2,
                )
            )

        if action_button:
            content_items.append(ft.Container(height=24))
            content_items.append(action_button)

        super().__init__(
            content=ft.Column(
                content_items,
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            alignment=ft.alignment.center,
            padding=60,
            **kwargs
        )
