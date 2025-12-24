"""Toast notification manager."""

import flet as ft
from ..theme import COLORS


class ToastManager:
    """Manages toast notifications."""

    def __init__(self, page: ft.Page):
        self.page = page

    def show(
        self,
        message: str,
        type: str = "info",
        duration: int = 4000,
    ):
        """Show a toast notification."""
        # Type configurations
        types = {
            "info": {
                "icon": ft.Icons.INFO_OUTLINED,
                "color": COLORS["info"],
                "bgcolor": f"{COLORS['info']}15",
            },
            "success": {
                "icon": ft.Icons.CHECK_CIRCLE_OUTLINED,
                "color": COLORS["success"],
                "bgcolor": f"{COLORS['success']}15",
            },
            "warning": {
                "icon": ft.Icons.WARNING_AMBER_OUTLINED,
                "color": COLORS["warning"],
                "bgcolor": f"{COLORS['warning']}15",
            },
            "error": {
                "icon": ft.Icons.ERROR_OUTLINED,
                "color": COLORS["error"],
                "bgcolor": f"{COLORS['error']}15",
            },
        }
        config = types.get(type, types["info"])

        # Create snackbar
        snackbar = ft.SnackBar(
            content=ft.Row(
                [
                    ft.Icon(
                        config["icon"],
                        size=20,
                        color=config["color"],
                    ),
                    ft.Text(
                        message,
                        size=14,
                        color=COLORS["text_primary"],
                    ),
                ],
                spacing=12,
            ),
            bgcolor=COLORS["bg_card"],
            duration=duration,
        )

        self.page.snack_bar = snackbar
        self.page.snack_bar.open = True
        self.page.update()

    def success(self, message: str):
        """Show a success toast."""
        self.show(message, "success")

    def error(self, message: str):
        """Show an error toast."""
        self.show(message, "error")

    def warning(self, message: str):
        """Show a warning toast."""
        self.show(message, "warning")

    def info(self, message: str):
        """Show an info toast."""
        self.show(message, "info")
