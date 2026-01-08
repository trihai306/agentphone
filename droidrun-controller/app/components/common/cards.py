"""Professional Card Components for Droidrun Controller.

Provides consistent, beautiful card layouts with proper elevation and spacing.
"""

import flet as ft
from typing import Optional, Callable, List
from ...theme import get_colors, RADIUS, SPACING, get_shadow, ANIMATION



# Dynamic color proxy - acts like a dict but always gets current theme colors
class _DynamicColors:
    def get(self, key, default=None):
        return get_colors().get(key, default)
    
    def __getitem__(self, key):
        return get_colors()[key]

COLORS = _DynamicColors()

class Card(ft.Container):
    """Base professional card component.

    Features:
    - Consistent elevation and shadows
    - Hover effects (optional)
    - Click handling (optional)
    - Proper padding and border radius

    Example:
        Card(
            content=ft.Text("Card content"),
            on_click=handle_click,
            hoverable=True,
        )
    """

    def __init__(
        self,
        content: ft.Control,
        hoverable: bool = False,
        clickable: bool = False,
        on_click: Optional[Callable] = None,
        padding: Optional[float] = None,
        elevation: str = "md",  # xs, sm, md, lg, xl
        **kwargs
    ):
        colors = get_colors()
        self.hoverable = hoverable
        self.clickable = clickable or (on_click is not None)
        self.elevation = elevation
        self._on_click = on_click

        # Default padding
        if padding is None:
            padding = SPACING["xl"]

        super().__init__(
            content=content,
            padding=padding,
            border_radius=RADIUS["xl"],
            bgcolor=colors["bg_card"],
            border=ft.border.all(1, colors["border"]),
            shadow=get_shadow(elevation),
            on_click=self._handle_click if self.clickable else None,
            on_hover=self._handle_hover if (self.hoverable or self.clickable) else None,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT) if (self.hoverable or self.clickable) else None,
            **kwargs
        )

    def _handle_click(self, e):
        """Handle click event."""
        if self._on_click:
            self._on_click(e)

    def _handle_hover(self, e):
        """Handle hover state."""
        if e.data == "true":  # Mouse enter
            self.shadow = get_shadow("lg")
            self.scale = ft.transform.Scale(1.01)
        else:  # Mouse leave
            self.shadow = get_shadow(self.elevation)
            self.scale = ft.transform.Scale(1.0)
        self.update()


class StatCard(ft.Container):
    """Statistical card for displaying metrics.

    Features:
    - Large number display
    - Label and description
    - Optional trend indicator
    - Optional icon

    Example:
        StatCard(
            value="1,234",
            label="Total Devices",
            description="+12% from last month",
            icon=ft.Icons.DEVICES,
            trend="up",
        )
    """

    def __init__(
        self,
        value: str,
        label: str,
        description: Optional[str] = None,
        icon: Optional[str] = None,
        trend: Optional[str] = None,  # "up", "down", "neutral"
        color: Optional[str] = None,
        **kwargs
    ):
        colors = get_colors()

        # Determine color based on trend if not specified
        if color is None:
            if trend == "up":
                color = colors["success"]
            elif trend == "down":
                color = colors["error"]
            else:
                color = colors["primary"]

        # Build trend indicator
        trend_icon = None
        if trend == "up":
            trend_icon = ft.Icon(ft.Icons.TRENDING_UP, size=20, color=colors["success"])
        elif trend == "down":
            trend_icon = ft.Icon(ft.Icons.TRENDING_DOWN, size=20, color=colors["error"])
        elif trend == "neutral":
            trend_icon = ft.Icon(ft.Icons.TRENDING_FLAT, size=20, color=colors["text_muted"])

        # Build content
        content_items = []

        # Header row with icon and trend
        header_items = []
        if icon:
            header_items.append(
                ft.Container(
                    content=ft.Icon(icon, size=24, color=color),
                    width=48,
                    height=48,
                    border_radius=RADIUS["md"],
                    bgcolor=f"{color}15",
                    border=ft.border.all(1, f"{color}30"),
                    alignment=ft.Alignment(0, 0),
                )
            )
            header_items.append(ft.Container(expand=True))

        if trend_icon:
            header_items.append(trend_icon)

        if header_items:
            content_items.append(
                ft.Row(header_items)
            )
            content_items.append(ft.Container(height=SPACING["lg"]))

        # Value
        content_items.append(
            ft.Text(
                value,
                size=36,
                weight=ft.FontWeight.BOLD,
                color=colors["text_primary"],
            )
        )

        # Label
        content_items.append(
            ft.Container(height=SPACING["xs"])
        )
        content_items.append(
            ft.Text(
                label,
                size=14,
                weight=ft.FontWeight.W_500,
                color=colors["text_secondary"],
            )
        )

        # Description
        if description:
            content_items.append(
                ft.Container(height=SPACING["sm"])
            )
            content_items.append(
                ft.Text(
                    description,
                    size=12,
                    color=colors["text_muted"],
                )
            )

        super().__init__(
            content=ft.Column(
                content_items,
                spacing=0,
            ),
            padding=SPACING["xl"],
            border_radius=RADIUS["xl"],
            bgcolor=colors["bg_card"],
            border=ft.border.all(1, colors["border"]),
            shadow=get_shadow("md"),
            **kwargs
        )


class InfoCard(ft.Container):
    """Information card with header and content sections.

    Features:
    - Header with title and optional actions
    - Content area
    - Optional footer

    Example:
        InfoCard(
            title="System Status",
            subtitle="Last updated 5 minutes ago",
            content=status_content,
            actions=[refresh_button],
        )
    """

    def __init__(
        self,
        title: str,
        content: ft.Control,
        subtitle: Optional[str] = None,
        actions: Optional[List[ft.Control]] = None,
        footer: Optional[ft.Control] = None,
        **kwargs
    ):
        colors = get_colors()

        # Build header
        header_left = ft.Column(
            [
                ft.Text(
                    title,
                    size=18,
                    weight=ft.FontWeight.BOLD,
                    color=colors["text_primary"],
                ),
            ],
            spacing=SPACING["xxs"],
        )

        if subtitle:
            header_left.controls.append(
                ft.Text(
                    subtitle,
                    size=12,
                    color=colors["text_muted"],
                )
            )

        header_items = [header_left]

        if actions:
            header_items.append(ft.Container(expand=True))
            header_items.append(
                ft.Row(
                    actions,
                    spacing=SPACING["sm"],
                )
            )

        header = ft.Container(
            content=ft.Row(header_items),
            padding=ft.padding.only(
                left=SPACING["xl"],
                right=SPACING["xl"],
                top=SPACING["xl"],
                bottom=SPACING["md"],
            ),
        )

        # Build main content area
        content_area = ft.Container(
            content=content,
            padding=ft.padding.symmetric(
                horizontal=SPACING["xl"],
                vertical=SPACING["md"],
            ),
        )

        # Build card
        card_items = [header, content_area]

        if footer:
            card_items.append(
                ft.Container(
                    content=footer,
                    padding=ft.padding.only(
                        left=SPACING["xl"],
                        right=SPACING["xl"],
                        top=SPACING["md"],
                        bottom=SPACING["xl"],
                    ),
                    border=ft.border.only(top=ft.BorderSide(1, colors["border"])),
                )
            )

        super().__init__(
            content=ft.Column(
                card_items,
                spacing=0,
            ),
            border_radius=RADIUS["xl"],
            bgcolor=colors["bg_card"],
            border=ft.border.all(1, colors["border"]),
            shadow=get_shadow("md"),
            **kwargs
        )


class AlertCard(ft.Container):
    """Alert/notification card with different severity levels.

    Features:
    - Color-coded by severity
    - Icon indicator
    - Title and message
    - Optional dismiss button

    Example:
        AlertCard(
            severity="warning",
            title="Low Battery",
            message="Device battery is below 20%",
            dismissible=True,
            on_dismiss=handle_dismiss,
        )
    """

    def __init__(
        self,
        title: str,
        message: str,
        severity: str = "info",  # info, success, warning, error
        dismissible: bool = False,
        on_dismiss: Optional[Callable] = None,
        **kwargs
    ):
        colors = get_colors()

        # Map severity to colors and icons
        severity_map = {
            "info": {
                "color": colors["info"],
                "bg": colors["info_subtle"],
                "icon": ft.Icons.INFO_OUTLINE,
            },
            "success": {
                "color": colors["success"],
                "bg": colors["success_subtle"],
                "icon": ft.Icons.CHECK_CIRCLE_OUTLINE,
            },
            "warning": {
                "color": colors["warning"],
                "bg": colors["warning_subtle"],
                "icon": ft.Icons.WARNING_AMBER_OUTLINED,
            },
            "error": {
                "color": colors["error"],
                "bg": colors["error_subtle"],
                "icon": ft.Icons.ERROR_OUTLINE,
            },
        }

        severity_config = severity_map.get(severity, severity_map["info"])

        # Build content
        content_items = [
            # Icon
            ft.Container(
                content=ft.Icon(
                    severity_config["icon"],
                    size=24,
                    color=severity_config["color"],
                ),
                width=40,
                height=40,
                border_radius=RADIUS["md"],
                bgcolor=f"{severity_config['color']}20",
                alignment=ft.Alignment(0, 0),
            ),
            ft.Container(width=SPACING["md"]),
            # Text content
            ft.Column(
                [
                    ft.Text(
                        title,
                        size=14,
                        weight=ft.FontWeight.W_600,
                        color=colors["text_primary"],
                    ),
                    ft.Container(height=SPACING["xxs"]),
                    ft.Text(
                        message,
                        size=13,
                        color=colors["text_secondary"],
                    ),
                ],
                spacing=0,
                expand=True,
            ),
        ]

        # Add dismiss button if dismissible
        if dismissible and on_dismiss:
            content_items.append(
                ft.IconButton(
                    icon=ft.Icons.CLOSE,
                    icon_size=18,
                    icon_color=colors["text_muted"],
                    on_click=on_dismiss,
                )
            )

        super().__init__(
            content=ft.Row(
                content_items,
                alignment=ft.MainAxisAlignment.START,
            ),
            padding=SPACING["lg"],
            border_radius=RADIUS["lg"],
            bgcolor=severity_config["bg"],
            border=ft.border.all(1, f"{severity_config['color']}40"),
            **kwargs
        )


class ListItemCard(ft.Container):
    """Card for list items with consistent layout.

    Features:
    - Leading icon or avatar
    - Title and subtitle
    - Trailing content
    - Hover and click states

    Example:
        ListItemCard(
            leading=ft.Icon(ft.Icons.DEVICE_UNKNOWN),
            title="Device Name",
            subtitle="Last seen 5 minutes ago",
            trailing=status_badge,
            on_click=handle_click,
        )
    """

    def __init__(
        self,
        title: str,
        leading: Optional[ft.Control] = None,
        subtitle: Optional[str] = None,
        trailing: Optional[ft.Control] = None,
        on_click: Optional[Callable] = None,
        **kwargs
    ):
        colors = get_colors()

        # Build content
        content_items = []

        # Leading
        if leading:
            content_items.append(leading)
            content_items.append(ft.Container(width=SPACING["md"]))

        # Text content
        text_items = [
            ft.Text(
                title,
                size=14,
                weight=ft.FontWeight.W_600,
                color=colors["text_primary"],
            ),
        ]

        if subtitle:
            text_items.append(ft.Container(height=SPACING["xxs"]))
            text_items.append(
                ft.Text(
                    subtitle,
                    size=12,
                    color=colors["text_secondary"],
                )
            )

        content_items.append(
            ft.Column(
                text_items,
                spacing=0,
                expand=True,
            )
        )

        # Trailing
        if trailing:
            content_items.append(trailing)

        super().__init__(
            content=ft.Row(
                content_items,
                alignment=ft.MainAxisAlignment.START,
            ),
            padding=SPACING["lg"],
            border_radius=RADIUS["lg"],
            bgcolor=colors["bg_card"],
            border=ft.border.all(1, colors["border"]),
            on_click=on_click,
            on_hover=self._handle_hover if on_click else None,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT) if on_click else None,
            **kwargs
        )

    def _handle_hover(self, e):
        """Handle hover state."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["bg_hover"]
            e.control.border = ft.border.all(1, colors["border_hover"])
        else:
            e.control.bgcolor = colors["bg_card"]
            e.control.border = ft.border.all(1, colors["border"])
        e.control.update()
