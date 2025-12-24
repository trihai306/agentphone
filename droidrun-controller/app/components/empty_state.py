"""Empty state component."""

import flet as ft
from ..theme import COLORS


class EmptyState(ft.Container):
    """An empty state placeholder."""

    def __init__(
        self,
        title: str,
        message: str,
        icon: str = ft.Icons.INBOX_OUTLINED,
        action_text: str = None,
        on_action=None,
        **kwargs
    ):
        content_items = [
            ft.Container(
                content=ft.Icon(
                    icon,
                    size=64,
                    color=COLORS["text_muted"],
                ),
                bgcolor=COLORS["bg_tertiary"],
                border_radius=50,
                padding=20,
            ),
            ft.Container(height=20),
            ft.Text(
                title,
                size=18,
                weight=ft.FontWeight.W_600,
                color=COLORS["text_primary"],
                text_align=ft.TextAlign.CENTER,
            ),
            ft.Container(height=8),
            ft.Text(
                message,
                size=14,
                color=COLORS["text_secondary"],
                text_align=ft.TextAlign.CENTER,
            ),
        ]

        if action_text and on_action:
            content_items.append(ft.Container(height=20))
            content_items.append(
                ft.ElevatedButton(
                    text=action_text,
                    on_click=on_action,
                    style=ft.ButtonStyle(
                        bgcolor=COLORS["primary"],
                        color=COLORS["text_primary"],
                        shape=ft.RoundedRectangleBorder(radius=8),
                    ),
                )
            )

        super().__init__(
            content=ft.Column(
                content_items,
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                spacing=0,
            ),
            padding=60,
            alignment=ft.alignment.center,
            expand=True,
            **kwargs
        )
