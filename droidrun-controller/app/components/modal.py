"""Modal and dialog components with polished styling.

Refined with improved backdrop, enhanced borders, and professional button styling.
Enhanced with subtle glow effects, refined borders, and smooth animations.
"""

import flet as ft
from ..theme import COLORS, ANIMATION, RADIUS, get_shadow, get_colored_shadow


class Modal(ft.AlertDialog):
    """A polished modal dialog with refined styling and improved backdrop.

    Features:
    - Enhanced backdrop with refined opacity
    - Subtle border for better visual definition
    - Smooth elevation with soft shadow
    - Professional typography and spacing
    """

    def __init__(
        self,
        title: str,
        content: ft.Control,
        actions: list[ft.Control] = None,
        width: int = 500,
        show_divider: bool = True,
        show_close_button: bool = False,
        on_close=None,
        **kwargs
    ):
        # Title row with optional close button
        title_row_children = [
            ft.Text(
                title,
                size=20,
                weight=ft.FontWeight.W_700,
                color=COLORS["text_primary"],
                expand=True,
            ),
        ]

        # Add close button if requested
        if show_close_button:
            title_row_children.append(
                ft.Container(
                    content=ft.Icon(
                        ft.Icons.CLOSE_ROUNDED,
                        size=20,
                        color=COLORS["text_muted"],
                    ),
                    width=32,
                    height=32,
                    border_radius=RADIUS["md"],
                    alignment=ft.alignment.center,
                    on_click=on_close,
                    ink=True,
                    animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                )
            )

        # Title with enhanced styling
        title_content = ft.Container(
            content=ft.Row(
                title_row_children,
                alignment=ft.MainAxisAlignment.SPACE_BETWEEN,
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.only(bottom=8),
        )

        # Content container with optional top divider - refined styling
        content_children = []
        if show_divider:
            content_children.append(
                ft.Container(
                    content=ft.Container(
                        height=1,
                        gradient=ft.LinearGradient(
                            begin=ft.alignment.center_left,
                            end=ft.alignment.center_right,
                            colors=[
                                "transparent",
                                COLORS["border_light"],
                                COLORS["border_light"],
                                "transparent",
                            ],
                            stops=[0, 0.1, 0.9, 1],
                        ),
                    ),
                    margin=ft.margin.only(bottom=20),
                )
            )
        content_children.append(content)

        content_container = ft.Container(
            content=ft.Column(content_children, spacing=0),
            width=width,
            padding=ft.padding.symmetric(vertical=4),
        )

        super().__init__(
            modal=True,
            title=title_content,
            title_padding=ft.padding.only(left=28, right=28, top=24, bottom=0),
            content=content_container,
            content_padding=ft.padding.symmetric(horizontal=28),
            actions=actions or [],
            actions_alignment=ft.MainAxisAlignment.END,
            actions_padding=ft.padding.only(left=28, right=28, bottom=24, top=16),
            bgcolor=COLORS["bg_card"],
            shape=ft.RoundedRectangleBorder(radius=RADIUS["xl"]),
            surface_tint_color="transparent",
            shadow_color="#00000040",
            elevation=32,
            barrier_color=COLORS["backdrop"],
            **kwargs
        )


class ConfirmDialog(ft.AlertDialog):
    """A polished confirmation dialog with professional button styling.

    Features:
    - Variant-colored icon with subtle glow effect
    - Ghost-styled cancel button with refined border
    - Primary action button with colored shadow
    - Smooth animations on all interactive elements
    """

    def __init__(
        self,
        title: str,
        message: str,
        confirm_text: str = "Confirm",
        cancel_text: str = "Cancel",
        confirm_variant: str = "primary",
        on_confirm=None,
        on_cancel=None,
        icon: str = None,
        **kwargs
    ):
        # Variant configurations with enhanced colors and gradients
        variants = {
            "primary": {
                "color": COLORS["primary"],
                "hover": COLORS["primary_dark"],
                "glow": COLORS["primary_glow"],
                "subtle": COLORS.get("primary_subtle", f"{COLORS['primary']}10"),
                "icon": ft.Icons.CHECK_CIRCLE_OUTLINE,
            },
            "danger": {
                "color": COLORS["error"],
                "hover": COLORS["error_dark"],
                "glow": COLORS["error_glow"],
                "subtle": COLORS.get("error_subtle", f"{COLORS['error']}10"),
                "icon": ft.Icons.WARNING_AMBER_ROUNDED,
            },
            "success": {
                "color": COLORS["success"],
                "hover": COLORS["success_dark"],
                "glow": COLORS["success_glow"],
                "subtle": COLORS.get("success_subtle", f"{COLORS['success']}10"),
                "icon": ft.Icons.CHECK_CIRCLE_OUTLINE,
            },
            "warning": {
                "color": COLORS["warning"],
                "hover": COLORS["warning_dark"],
                "glow": COLORS["warning_glow"],
                "subtle": COLORS.get("warning_subtle", f"{COLORS['warning']}10"),
                "icon": ft.Icons.WARNING_AMBER_ROUNDED,
            },
        }
        variant_config = variants.get(confirm_variant, variants["primary"])
        selected_icon = icon or variant_config["icon"]

        # Header with icon and title - enhanced icon container with border
        header_content = ft.Row(
            [
                ft.Container(
                    content=ft.Icon(
                        selected_icon,
                        size=24,
                        color=variant_config["color"],
                    ),
                    width=48,
                    height=48,
                    border_radius=RADIUS["lg"],
                    bgcolor=f"{variant_config['color']}12",
                    border=ft.border.all(1, f"{variant_config['color']}20"),
                    alignment=ft.alignment.center,
                    shadow=ft.BoxShadow(
                        spread_radius=0,
                        blur_radius=16,
                        color=f"{variant_config['color']}15",
                        offset=ft.Offset(0, 4),
                    ),
                ),
                ft.Container(width=16),
                ft.Column(
                    [
                        ft.Text(
                            title,
                            size=18,
                            weight=ft.FontWeight.W_700,
                            color=COLORS["text_primary"],
                        ),
                    ],
                    spacing=2,
                ),
            ],
            alignment=ft.MainAxisAlignment.START,
            vertical_alignment=ft.CrossAxisAlignment.CENTER,
        )

        # Message content with refined styling and left alignment with icon
        message_content = ft.Container(
            content=ft.Text(
                message,
                size=14,
                color=COLORS["text_secondary"],
                height=1.6,
            ),
            padding=ft.padding.only(top=12, left=64),  # Align with title text
        )

        # Cancel button with refined ghost styling
        cancel_button = ft.Container(
            content=ft.Text(
                cancel_text,
                size=14,
                weight=ft.FontWeight.W_600,
                color=COLORS["text_secondary"],
            ),
            padding=ft.padding.symmetric(horizontal=20, vertical=12),
            border_radius=RADIUS["md"],
            bgcolor=COLORS["bg_hover"],
            border=ft.border.all(1, COLORS["border"]),
            on_click=on_cancel,
            ink=True,
            ink_color=f"{COLORS['text_secondary']}10",
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
        )

        # Confirm button with variant styling, enhanced glow, and subtle border
        confirm_button = ft.Container(
            content=ft.Text(
                confirm_text,
                size=14,
                weight=ft.FontWeight.W_600,
                color=COLORS["text_inverse"],
            ),
            padding=ft.padding.symmetric(horizontal=24, vertical=12),
            border_radius=RADIUS["md"],
            bgcolor=variant_config["color"],
            border=ft.border.all(1, f"{variant_config['hover']}80"),
            shadow=ft.BoxShadow(
                spread_radius=0,
                blur_radius=20,
                color=variant_config["glow"],
                offset=ft.Offset(0, 6),
            ),
            on_click=on_confirm,
            ink=True,
            ink_color=f"{COLORS['text_inverse']}20",
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
        )

        super().__init__(
            modal=True,
            title=header_content,
            title_padding=ft.padding.only(left=28, right=28, top=24, bottom=8),
            content=message_content,
            content_padding=ft.padding.only(left=28, right=28),
            actions=[
                cancel_button,
                ft.Container(width=12),
                confirm_button,
            ],
            actions_alignment=ft.MainAxisAlignment.END,
            actions_padding=ft.padding.only(left=28, right=28, bottom=24, top=20),
            bgcolor=COLORS["bg_card"],
            shape=ft.RoundedRectangleBorder(radius=RADIUS["xl"]),
            surface_tint_color="transparent",
            shadow_color="#00000040",
            elevation=32,
            barrier_color=COLORS["backdrop"],
            **kwargs
        )


class InfoDialog(ft.AlertDialog):
    """An informational dialog with professional styling for displaying messages.

    Features:
    - Variant-colored icon with subtle glow effect
    - Clean single-action button with colored shadow
    - Consistent styling with ConfirmDialog
    """

    def __init__(
        self,
        title: str,
        message: str,
        button_text: str = "OK",
        variant: str = "info",
        on_close=None,
        **kwargs
    ):
        # Variant configurations with enhanced colors
        variants = {
            "info": {
                "color": COLORS["info"],
                "dark": COLORS.get("info_dark", COLORS["info"]),
                "glow": COLORS.get("info_glow", f"{COLORS['info']}20"),
                "icon": ft.Icons.INFO_OUTLINE,
            },
            "success": {
                "color": COLORS["success"],
                "dark": COLORS.get("success_dark", COLORS["success"]),
                "glow": COLORS.get("success_glow", f"{COLORS['success']}20"),
                "icon": ft.Icons.CHECK_CIRCLE_OUTLINE,
            },
            "warning": {
                "color": COLORS["warning"],
                "dark": COLORS.get("warning_dark", COLORS["warning"]),
                "glow": COLORS.get("warning_glow", f"{COLORS['warning']}20"),
                "icon": ft.Icons.WARNING_AMBER_ROUNDED,
            },
            "error": {
                "color": COLORS["error"],
                "dark": COLORS.get("error_dark", COLORS["error"]),
                "glow": COLORS.get("error_glow", f"{COLORS['error']}20"),
                "icon": ft.Icons.ERROR_OUTLINE,
            },
        }
        variant_config = variants.get(variant, variants["info"])

        # Header with icon and title - enhanced icon container with border
        header_content = ft.Row(
            [
                ft.Container(
                    content=ft.Icon(
                        variant_config["icon"],
                        size=24,
                        color=variant_config["color"],
                    ),
                    width=48,
                    height=48,
                    border_radius=RADIUS["lg"],
                    bgcolor=f"{variant_config['color']}12",
                    border=ft.border.all(1, f"{variant_config['color']}20"),
                    alignment=ft.alignment.center,
                    shadow=ft.BoxShadow(
                        spread_radius=0,
                        blur_radius=16,
                        color=f"{variant_config['color']}15",
                        offset=ft.Offset(0, 4),
                    ),
                ),
                ft.Container(width=16),
                ft.Text(
                    title,
                    size=18,
                    weight=ft.FontWeight.W_700,
                    color=COLORS["text_primary"],
                ),
            ],
            alignment=ft.MainAxisAlignment.START,
            vertical_alignment=ft.CrossAxisAlignment.CENTER,
        )

        # Message content with refined styling
        message_content = ft.Container(
            content=ft.Text(
                message,
                size=14,
                color=COLORS["text_secondary"],
                height=1.6,
            ),
            padding=ft.padding.only(top=12, left=64),  # Align with title text
        )

        # Close button with variant styling and enhanced glow
        close_button = ft.Container(
            content=ft.Text(
                button_text,
                size=14,
                weight=ft.FontWeight.W_600,
                color=COLORS["text_inverse"],
            ),
            padding=ft.padding.symmetric(horizontal=24, vertical=12),
            border_radius=RADIUS["md"],
            bgcolor=variant_config["color"],
            border=ft.border.all(1, f"{variant_config['dark']}80"),
            shadow=ft.BoxShadow(
                spread_radius=0,
                blur_radius=20,
                color=variant_config["glow"],
                offset=ft.Offset(0, 6),
            ),
            on_click=on_close,
            ink=True,
            ink_color=f"{COLORS['text_inverse']}20",
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
        )

        super().__init__(
            modal=True,
            title=header_content,
            title_padding=ft.padding.only(left=28, right=28, top=24, bottom=8),
            content=message_content,
            content_padding=ft.padding.only(left=28, right=28),
            actions=[close_button],
            actions_alignment=ft.MainAxisAlignment.END,
            actions_padding=ft.padding.only(left=28, right=28, bottom=24, top=20),
            bgcolor=COLORS["bg_card"],
            shape=ft.RoundedRectangleBorder(radius=RADIUS["xl"]),
            surface_tint_color="transparent",
            shadow_color="#00000040",
            elevation=32,
            barrier_color=COLORS["backdrop"],
            **kwargs
        )
