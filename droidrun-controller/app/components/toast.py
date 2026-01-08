"""Toast notification manager with enhanced styling."""

import flet as ft
from ..theme import get_colors, RADIUS, SPACING, get_shadow



# Dynamic color proxy - acts like a dict but always gets current theme colors
class _DynamicColors:
    def get(self, key, default=None):
        return get_colors().get(key, default)
    
    def __getitem__(self, key):
        return get_colors()[key]

COLORS = _DynamicColors()

class ToastManager:
    """Manages toast notifications with polished styling."""

    def __init__(self, page: ft.Page):
        self.page = page

    def show(
        self,
        message: str,
        type: str = "info",
        duration: int = 4000,
    ):
        """Show a toast notification with enhanced styling."""
        # Type configurations with improved icons and colors
        types = {
            "info": {
                "icon": ft.Icons.INFO_ROUNDED,
                "color": COLORS["info"],
                "bgcolor": COLORS.get("info_subtle", f"{COLORS['info']}15"),
                "border_color": f"{COLORS['info']}30",
            },
            "success": {
                "icon": ft.Icons.CHECK_CIRCLE_ROUNDED,
                "color": COLORS["success"],
                "bgcolor": COLORS.get("success_subtle", f"{COLORS['success']}15"),
                "border_color": f"{COLORS['success']}30",
            },
            "warning": {
                "icon": ft.Icons.WARNING_ROUNDED,
                "color": COLORS["warning"],
                "bgcolor": COLORS.get("warning_subtle", f"{COLORS['warning']}15"),
                "border_color": f"{COLORS['warning']}30",
            },
            "error": {
                "icon": ft.Icons.ERROR_ROUNDED,
                "color": COLORS["error"],
                "bgcolor": COLORS.get("error_subtle", f"{COLORS['error']}15"),
                "border_color": f"{COLORS['error']}30",
            },
        }
        config = types.get(type, types["info"])

        # Icon container with pill-shaped background
        icon_container = ft.Container(
            content=ft.Icon(
                config["icon"],
                size=18,
                color=config["color"],
            ),
            width=32,
            height=32,
            border_radius=RADIUS["md"],
            bgcolor=config["bgcolor"],
            alignment=ft.Alignment(0, 0),
        )

        # Toast content with improved layout
        toast_content = ft.Container(
            content=ft.Row(
                [
                    icon_container,
                    ft.Text(
                        message,
                        size=14,
                        weight=ft.FontWeight.W_500,
                        color=COLORS["text_primary"],
                        expand=True,
                    ),
                ],
                spacing=SPACING["md"],
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.symmetric(
                horizontal=SPACING["lg"],
                vertical=SPACING["md"],
            ),
        )

        # Enhanced snackbar with floating behavior
        snackbar = ft.SnackBar(
            content=toast_content,
            bgcolor=COLORS["bg_card"],
            duration=duration,
            elevation=8,
            behavior=ft.SnackBarBehavior.FLOATING,
            shape=ft.RoundedRectangleBorder(radius=RADIUS["lg"]),
            margin=ft.margin.only(
                bottom=SPACING["xl"],
                left=SPACING["xl"],
                right=SPACING["xl"],
            ),
            padding=ft.padding.all(0),
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
