"""Page header component for consistent page titles."""

import flet as ft
from ..theme import COLORS


class PageHeader(ft.Container):
    """A professional page header with title, subtitle and optional actions."""

    def __init__(
        self,
        title: str,
        subtitle: str = None,
        icon: str = None,
        actions: list[ft.Control] = None,
        **kwargs
    ):
        header_content = []

        # Left side - Icon and text
        left_items = []

        if icon:
            left_items.append(
                ft.Container(
                    content=ft.Icon(
                        icon,
                        size=28,
                        color=COLORS["primary"],
                    ),
                    width=56,
                    height=56,
                    border_radius=16,
                    bgcolor=COLORS["primary_glow"],
                    alignment=ft.alignment.center,
                    shadow=ft.BoxShadow(
                        spread_radius=0,
                        blur_radius=16,
                        color=COLORS["primary_glow"],
                        offset=ft.Offset(0, 4),
                    ),
                )
            )
            left_items.append(ft.Container(width=16))

        text_items = [
            ft.Text(
                title,
                size=28,
                weight=ft.FontWeight.W_800,
                color=COLORS["text_primary"],
            )
        ]

        if subtitle:
            text_items.append(
                ft.Text(
                    subtitle,
                    size=14,
                    color=COLORS["text_secondary"],
                )
            )

        left_items.append(
            ft.Column(text_items, spacing=4)
        )

        header_row = [ft.Row(left_items, spacing=0)]

        # Right side - Actions
        if actions:
            header_row.append(
                ft.Row(actions, spacing=12)
            )

        super().__init__(
            content=ft.Row(
                header_row,
                alignment=ft.MainAxisAlignment.SPACE_BETWEEN,
            ),
            padding=ft.padding.only(bottom=32),
            **kwargs
        )


class SectionHeader(ft.Container):
    """A section header for organizing content within a page."""

    def __init__(
        self,
        title: str,
        subtitle: str = None,
        actions: list[ft.Control] = None,
        **kwargs
    ):
        text_items = [
            ft.Text(
                title,
                size=18,
                weight=ft.FontWeight.W_700,
                color=COLORS["text_primary"],
            )
        ]

        if subtitle:
            text_items.append(
                ft.Text(
                    subtitle,
                    size=13,
                    color=COLORS["text_secondary"],
                )
            )

        header_content = [ft.Column(text_items, spacing=4)]

        if actions:
            header_content.append(
                ft.Row(actions, spacing=10)
            )

        super().__init__(
            content=ft.Row(
                header_content,
                alignment=ft.MainAxisAlignment.SPACE_BETWEEN,
            ),
            padding=ft.padding.only(bottom=20),
            **kwargs
        )
