"""Modal and dialog components."""

import flet as ft
from ..theme import COLORS


class Modal(ft.AlertDialog):
    """A styled modal dialog."""

    def __init__(
        self,
        title: str,
        content: ft.Control,
        actions: list[ft.Control] = None,
        width: int = 500,
        **kwargs
    ):
        super().__init__(
            modal=True,
            title=ft.Text(
                title,
                size=20,
                weight=ft.FontWeight.W_600,
                color=COLORS["text_primary"],
            ),
            content=ft.Container(
                content=content,
                width=width,
            ),
            actions=actions or [],
            actions_alignment=ft.MainAxisAlignment.END,
            bgcolor=COLORS["bg_card"],
            shape=ft.RoundedRectangleBorder(radius=16),
            **kwargs
        )


class ConfirmDialog(ft.AlertDialog):
    """A confirmation dialog."""

    def __init__(
        self,
        title: str,
        message: str,
        confirm_text: str = "Confirm",
        cancel_text: str = "Cancel",
        confirm_variant: str = "primary",
        on_confirm=None,
        on_cancel=None,
        **kwargs
    ):
        # Variant colors for confirm button
        variants = {
            "primary": COLORS["primary"],
            "danger": COLORS["error"],
            "success": COLORS["success"],
        }
        confirm_color = variants.get(confirm_variant, COLORS["primary"])

        super().__init__(
            modal=True,
            title=ft.Text(
                title,
                size=18,
                weight=ft.FontWeight.W_600,
                color=COLORS["text_primary"],
            ),
            content=ft.Text(
                message,
                size=14,
                color=COLORS["text_secondary"],
            ),
            actions=[
                ft.TextButton(
                    text=cancel_text,
                    on_click=on_cancel,
                    style=ft.ButtonStyle(
                        color=COLORS["text_secondary"],
                    ),
                ),
                ft.ElevatedButton(
                    text=confirm_text,
                    on_click=on_confirm,
                    style=ft.ButtonStyle(
                        bgcolor=confirm_color,
                        color=COLORS["text_primary"],
                        shape=ft.RoundedRectangleBorder(radius=8),
                    ),
                ),
            ],
            actions_alignment=ft.MainAxisAlignment.END,
            bgcolor=COLORS["bg_card"],
            shape=ft.RoundedRectangleBorder(radius=16),
            **kwargs
        )
