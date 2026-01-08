"""Professional page header components for Droidrun Controller.

Features breadcrumb navigation, search, and action buttons with refined animations.
"""

import flet as ft
from typing import Optional, List, Callable
from ..theme import get_colors, get_shadow, ANIMATION, RADIUS, Typography, Easing


class Breadcrumb(ft.Row):
    """Professional breadcrumb navigation component."""

    def __init__(
        self,
        items: List[tuple[str, Optional[Callable]]] = None,
        separator: str = "/",
        **kwargs
    ):
        """
        Initialize breadcrumb.

        Args:
            items: List of tuples (label, on_click_callback). Last item has no callback.
            separator: Separator character between items.
        """
        colors = get_colors()
        controls = []

        if items:
            for i, (label, on_click) in enumerate(items):
                is_last = i == len(items) - 1

                # Breadcrumb item
                item = ft.Container(
                    content=ft.Text(
                        label,
                        size=Typography.BODY_SM,
                        weight=ft.FontWeight.W_500 if is_last else ft.FontWeight.W_400,
                        color=colors["text_primary"] if is_last else colors["text_muted"],
                    ),
                    padding=ft.padding.symmetric(horizontal=8, vertical=4),
                    border_radius=RADIUS["sm"],
                    animate=ft.Animation(ANIMATION["fast"], Easing.EASE_OUT),
                    on_click=on_click if not is_last else None,
                    on_hover=self._create_hover_handler() if not is_last else None,
                )
                controls.append(item)

                # Separator (except for last item)
                if not is_last:
                    controls.append(
                        ft.Text(
                            separator,
                            size=Typography.BODY_SM,
                            color=colors["text_muted"],
                        )
                    )

        super().__init__(
            controls=controls,
            spacing=4,
            vertical_alignment=ft.CrossAxisAlignment.CENTER,
            **kwargs
        )

    def _create_hover_handler(self):
        colors = get_colors()

        def on_hover(e):
            if e.data == "true":
                e.control.bgcolor = colors["bg_hover"]
                e.control.content.color = colors["text_primary"]
            else:
                e.control.bgcolor = "transparent"
                e.control.content.color = colors["text_muted"]
            e.control.update()
        return on_hover


class PageHeader(ft.Container):
    """Professional page header with title, breadcrumb, and action buttons."""

    def __init__(
        self,
        title: str,
        subtitle: str = None,
        icon: str = None,
        icon_color: str = None,
        breadcrumb: List[tuple[str, Optional[Callable]]] = None,
        actions: List[ft.Control] = None,
        search_enabled: bool = False,
        on_search: Callable[[str], None] = None,
        **kwargs
    ):
        colors = get_colors()
        self._icon_color = icon_color or colors["primary"]

        content_rows = []

        # Breadcrumb row (if provided)
        if breadcrumb:
            content_rows.append(Breadcrumb(items=breadcrumb))
            content_rows.append(ft.Container(height=8))

        # Main header row
        header_left = []

        # Icon - clean without shadow
        if icon:
            header_left.append(
                ft.Container(
                    content=ft.Icon(
                        icon,
                        size=28,
                        color=self._icon_color,
                    ),
                    width=56,
                    height=56,
                    border_radius=RADIUS["lg"],
                    bgcolor=f"{self._icon_color}15",
                    alignment=ft.Alignment(0, 0),
                    border=ft.border.all(1, f"{self._icon_color}25"),
                    animate=ft.Animation(ANIMATION["normal"], Easing.EASE_OUT),
                )
            )
            header_left.append(ft.Container(width=20))

        # Title and subtitle
        text_items = [
            ft.Text(
                title,
                size=Typography.H1,
                weight=ft.FontWeight.W_800,
                color=colors["text_primary"],
            )
        ]

        if subtitle:
            text_items.append(ft.Container(height=4))
            text_items.append(
                ft.Text(
                    subtitle,
                    size=Typography.BODY_MD,
                    weight=ft.FontWeight.W_400,
                    color=colors["text_secondary"],
                )
            )

        header_left.append(
            ft.Column(text_items, spacing=0)
        )

        # Right side - search and actions
        header_right = []

        # Search bar (if enabled)
        if search_enabled:
            header_right.append(
                self._build_search_bar(on_search)
            )
            if actions:
                header_right.append(ft.Container(width=16))

        # Action buttons
        if actions:
            header_right.extend(actions)

        # Combine into main row
        main_row = ft.Row(
            [
                ft.Row(header_left, spacing=0),
                ft.Container(expand=True),
                ft.Row(header_right, spacing=12),
            ],
            vertical_alignment=ft.CrossAxisAlignment.CENTER,
        )
        content_rows.append(main_row)

        super().__init__(
            content=ft.Column(content_rows, spacing=0),
            padding=ft.padding.only(bottom=28),
            **kwargs
        )

    def _build_search_bar(self, on_search: Callable = None):
        """Build the search bar component."""
        colors = get_colors()

        search_field = ft.TextField(
            hint_text="Search...",
            prefix_icon=ft.Icons.SEARCH,
            border_color=colors["border"],
            focused_border_color=colors["primary"],
            bgcolor=colors["bg_input"],
            color=colors["text_primary"],
            hint_style=ft.TextStyle(color=colors["text_muted"], size=13),
            cursor_color=colors["primary"],
            border_radius=RADIUS["md"],
            content_padding=ft.padding.symmetric(horizontal=16, vertical=12),
            text_size=14,
            width=280,
            on_change=lambda e: on_search(e.control.value) if on_search else None,
        )

        return ft.Container(
            content=search_field,
            animate=ft.Animation(ANIMATION["fast"], Easing.EASE_OUT),
        )


class SectionHeader(ft.Container):
    """A polished section header for organizing content within a page."""

    def __init__(
        self,
        title: str,
        subtitle: str = None,
        icon: str = None,
        icon_color: str = None,
        actions: List[ft.Control] = None,
        badge_text: str = None,
        badge_color: str = None,
        **kwargs
    ):
        colors = get_colors()
        _icon_color = icon_color or colors["text_secondary"]

        left_items = []

        # Optional icon
        if icon:
            left_items.append(
                ft.Container(
                    content=ft.Icon(
                        icon,
                        size=20,
                        color=_icon_color,
                    ),
                    width=40,
                    height=40,
                    border_radius=RADIUS["md"],
                    bgcolor=f"{_icon_color}12",
                    alignment=ft.Alignment(0, 0),
                    border=ft.border.all(1, f"{_icon_color}20"),
                )
            )
            left_items.append(ft.Container(width=14))

        # Title row with optional badge
        title_row = [
            ft.Text(
                title,
                size=Typography.H5,
                weight=ft.FontWeight.W_700,
                color=colors["text_primary"],
            )
        ]

        if badge_text:
            _badge_color = badge_color or colors["primary"]
            title_row.append(ft.Container(width=10))
            title_row.append(
                ft.Container(
                    content=ft.Text(
                        badge_text,
                        size=Typography.LABEL_XS,
                        weight=ft.FontWeight.W_600,
                        color=_badge_color,
                    ),
                    padding=ft.padding.symmetric(horizontal=10, vertical=4),
                    border_radius=RADIUS["full"],
                    bgcolor=f"{_badge_color}15",
                    border=ft.border.all(1, f"{_badge_color}25"),
                )
            )

        text_items = [ft.Row(title_row, spacing=0)]

        if subtitle:
            text_items.append(
                ft.Text(
                    subtitle,
                    size=Typography.BODY_SM,
                    weight=ft.FontWeight.W_400,
                    color=colors["text_secondary"],
                )
            )

        left_items.append(
            ft.Column(text_items, spacing=4)
        )

        header_content = [ft.Row(left_items, spacing=0, expand=True)]

        if actions:
            header_content.append(
                ft.Row(actions, spacing=10)
            )

        super().__init__(
            content=ft.Row(
                header_content,
                alignment=ft.MainAxisAlignment.SPACE_BETWEEN,
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.only(bottom=20),
            **kwargs
        )


class PageTitle(ft.Text):
    """Simple page title with consistent styling."""

    def __init__(self, text: str, **kwargs):
        colors = get_colors()
        super().__init__(
            text,
            size=Typography.H1,
            weight=ft.FontWeight.W_800,
            color=colors["text_primary"],
            **kwargs
        )


class PageSubtitle(ft.Text):
    """Simple page subtitle with consistent styling."""

    def __init__(self, text: str, **kwargs):
        colors = get_colors()
        super().__init__(
            text,
            size=Typography.BODY_MD,
            weight=ft.FontWeight.W_400,
            color=colors["text_secondary"],
            **kwargs
        )
