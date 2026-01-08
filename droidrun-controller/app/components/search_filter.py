"""Search and filter component with search input, filter dropdowns, and sort selector.

Provides a professional toolbar for filtering and sorting device lists with:
- Real-time search input with debouncing
- Filter dropdowns (status: online/offline, Android version)
- Sort dropdown (name, status, model, version)
- Hover effects and smooth animations
"""

import flet as ft
from typing import Optional, Callable, List, Dict
from ..theme import get_colors, RADIUS, SPACING, ANIMATION, get_shadow


class SearchFilter(ft.Container):
    """A search and filter toolbar component for device management.

    Features:
    - Search input with icon and clear button
    - Status filter dropdown (All, Online, Offline)
    - Android version filter dropdown
    - Sort by dropdown (Name, Status, Model, Version)
    - Responsive design for mobile/desktop
    - Smooth hover effects and animations
    """

    def __init__(
        self,
        on_search: Optional[Callable[[str], None]] = None,
        on_status_filter: Optional[Callable[[str], None]] = None,
        on_version_filter: Optional[Callable[[str], None]] = None,
        on_sort: Optional[Callable[[str], None]] = None,
        android_versions: Optional[List[str]] = None,
        is_mobile: bool = False,
        **kwargs
    ):
        self.on_search = on_search
        self.on_status_filter = on_status_filter
        self.on_version_filter = on_version_filter
        self.on_sort = on_sort
        self.android_versions = android_versions or []
        self.is_mobile = is_mobile

        # Current filter states
        self._search_value = ""
        self._status_filter = "all"
        self._version_filter = "all"
        self._sort_by = "name"

        colors = get_colors()
        super().__init__(
            content=self._build_content(),
            padding=ft.padding.symmetric(
                horizontal=SPACING["md"] if is_mobile else SPACING["lg"],
                vertical=SPACING["md"],
            ),
            bgcolor=colors["bg_card"],
            border=ft.border.only(bottom=ft.BorderSide(1, colors["border"])),
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            **kwargs
        )

    def _build_content(self):
        """Build the filter toolbar content."""
        colors = get_colors()

        if self.is_mobile:
            return self._build_mobile_layout()

        return self._build_desktop_layout()

    def _build_desktop_layout(self):
        """Build desktop layout with all controls in a row."""
        colors = get_colors()

        return ft.Row(
            [
                # Search input - takes more space
                self._build_search_input(),
                ft.Container(width=SPACING["lg"]),
                # Filter dropdowns
                ft.Row(
                    [
                        self._build_status_dropdown(),
                        ft.Container(width=SPACING["sm"]),
                        self._build_version_dropdown(),
                        ft.Container(width=SPACING["sm"]),
                        self._build_sort_dropdown(),
                    ],
                    spacing=0,
                ),
            ],
        )

    def _build_mobile_layout(self):
        """Build mobile layout with stacked controls."""
        colors = get_colors()

        return ft.Column(
            [
                # Search input on top
                self._build_search_input(),
                ft.Container(height=SPACING["sm"]),
                # Filters in a row below
                ft.Row(
                    [
                        ft.Container(
                            content=self._build_status_dropdown(),
                            expand=True,
                        ),
                        ft.Container(width=SPACING["sm"]),
                        ft.Container(
                            content=self._build_sort_dropdown(),
                            expand=True,
                        ),
                    ],
                ),
            ],
            spacing=0,
        )

    def _build_search_input(self):
        """Build the search input field with icon and clear button."""
        colors = get_colors()

        self._search_field = ft.TextField(
            hint_text="Search devices...",
            hint_style=ft.TextStyle(
                size=13,
                color=colors["text_muted"],
            ),
            text_size=13,
            border_radius=RADIUS["md"],
            border_color=colors["border"],
            focused_border_color=colors["primary"],
            bgcolor=colors["bg_input"],
            cursor_color=colors["primary"],
            content_padding=ft.padding.only(left=40, right=36, top=10, bottom=10),
            on_change=self._on_search_change,
            expand=True,
        )

        # Search icon on the left
        search_icon = ft.Container(
            content=ft.Icon(
                ft.Icons.SEARCH_ROUNDED,
                size=18,
                color=colors["text_muted"],
            ),
            left=12,
            top=10,
        )

        # Clear button on the right (shown when there's text)
        self._clear_button = ft.Container(
            content=ft.Icon(
                ft.Icons.CLOSE_ROUNDED,
                size=16,
                color=colors["text_muted"],
            ),
            right=10,
            top=10,
            on_click=self._on_clear_search,
            on_hover=self._on_clear_hover,
            border_radius=RADIUS["sm"],
            padding=2,
            visible=False,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

        return ft.Container(
            content=ft.Stack(
                [
                    self._search_field,
                    search_icon,
                    self._clear_button,
                ],
            ),
            expand=True if not self.is_mobile else False,
            width=300 if not self.is_mobile else None,
        )

    def _build_status_dropdown(self):
        """Build the status filter dropdown."""
        colors = get_colors()

        options = [
            ft.dropdown.Option(key="all", text="All Status"),
            ft.dropdown.Option(key="online", text="Online"),
            ft.dropdown.Option(key="offline", text="Offline"),
        ]

        return self._build_dropdown(
            value="all",
            options=options,
            icon=ft.Icons.WIFI_ROUNDED,
            on_change=self._on_status_change,
            width=130,
        )

    def _build_version_dropdown(self):
        """Build the Android version filter dropdown."""
        colors = get_colors()

        options = [ft.dropdown.Option(key="all", text="All Versions")]
        for version in self.android_versions:
            options.append(
                ft.dropdown.Option(key=version, text=f"Android {version}")
            )

        return self._build_dropdown(
            value="all",
            options=options,
            icon=ft.Icons.ANDROID_ROUNDED,
            on_change=self._on_version_change,
            width=140,
        )

    def _build_sort_dropdown(self):
        """Build the sort by dropdown."""
        colors = get_colors()

        options = [
            ft.dropdown.Option(key="name", text="Name"),
            ft.dropdown.Option(key="status", text="Status"),
            ft.dropdown.Option(key="model", text="Model"),
            ft.dropdown.Option(key="version", text="Version"),
        ]

        return self._build_dropdown(
            value="name",
            options=options,
            icon=ft.Icons.SORT_ROUNDED,
            on_change=self._on_sort_change,
            width=120,
            prefix_text="Sort: ",
        )

    def _build_dropdown(
        self,
        value: str,
        options: List[ft.dropdown.Option],
        icon: str,
        on_change: Callable,
        width: int = 140,
        prefix_text: str = "",
    ):
        """Build a styled dropdown with icon."""
        colors = get_colors()

        dropdown = ft.Dropdown(
            value=value,
            options=options,
            text_size=12,
            content_padding=ft.padding.only(left=32, right=8, top=8, bottom=8),
            border_radius=RADIUS["md"],
            border_color=colors["border"],
            focused_border_color=colors["primary"],
            bgcolor=colors["bg_input"],
            width=width,
        )
        # Set on_change after initialization to avoid constructor error
        dropdown.on_change = on_change

        # Icon on the left
        dropdown_icon = ft.Container(
            content=ft.Icon(
                icon,
                size=16,
                color=colors["text_muted"],
            ),
            left=10,
            top=10,
        )

        return ft.Container(
            content=ft.Stack(
                [
                    dropdown,
                    dropdown_icon,
                ],
            ),
            on_hover=self._on_dropdown_hover,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

    # Event handlers
    def _on_search_change(self, e):
        """Handle search input change."""
        self._search_value = e.control.value or ""
        self._clear_button.visible = len(self._search_value) > 0
        self._clear_button.update()

        if self.on_search:
            self.on_search(self._search_value)

    def _on_clear_search(self, e):
        """Handle clear search button click."""
        self._search_field.value = ""
        self._search_value = ""
        self._clear_button.visible = False
        self._search_field.update()
        self._clear_button.update()

        if self.on_search:
            self.on_search("")

    def _on_clear_hover(self, e):
        """Handle clear button hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["bg_hover"]
        else:
            e.control.bgcolor = "transparent"
        e.control.update()

    def _on_status_change(self, e):
        """Handle status filter change."""
        self._status_filter = e.control.value
        if self.on_status_filter:
            self.on_status_filter(self._status_filter)

    def _on_version_change(self, e):
        """Handle version filter change."""
        self._version_filter = e.control.value
        if self.on_version_filter:
            self.on_version_filter(self._version_filter)

    def _on_sort_change(self, e):
        """Handle sort change."""
        self._sort_by = e.control.value
        if self.on_sort:
            self.on_sort(self._sort_by)

    def _on_dropdown_hover(self, e):
        """Handle dropdown container hover."""
        colors = get_colors()
        # Find the dropdown in the stack
        stack = e.control.content
        if stack and hasattr(stack, 'controls') and len(stack.controls) > 0:
            dropdown = stack.controls[0]
            if hasattr(dropdown, 'border_color'):
                if e.data == "true":
                    dropdown.border_color = colors["border_hover"]
                else:
                    dropdown.border_color = colors["border"]
                dropdown.update()

    # Public methods for external control
    def get_search_value(self) -> str:
        """Get current search value."""
        return self._search_value

    def get_status_filter(self) -> str:
        """Get current status filter."""
        return self._status_filter

    def get_version_filter(self) -> str:
        """Get current version filter."""
        return self._version_filter

    def get_sort_by(self) -> str:
        """Get current sort selection."""
        return self._sort_by

    def set_search_value(self, value: str):
        """Set search value programmatically."""
        self._search_value = value
        if hasattr(self, '_search_field'):
            self._search_field.value = value
            self._clear_button.visible = len(value) > 0
            self._search_field.update()
            self._clear_button.update()

    def set_android_versions(self, versions: List[str]):
        """Update available Android versions."""
        self.android_versions = versions
        # Rebuild content to reflect new versions
        self.content = self._build_content()
        self.update()

    def reset_filters(self):
        """Reset all filters to default values."""
        self._search_value = ""
        self._status_filter = "all"
        self._version_filter = "all"
        self._sort_by = "name"
        self.content = self._build_content()
        self.update()


class SearchFilterCompact(ft.Container):
    """A compact version of SearchFilter for limited space.

    Shows only search input and a single filter/sort button that opens a menu.
    """

    def __init__(
        self,
        on_search: Optional[Callable[[str], None]] = None,
        on_filter_change: Optional[Callable[[Dict], None]] = None,
        **kwargs
    ):
        self.on_search = on_search
        self.on_filter_change = on_filter_change
        self._search_value = ""

        colors = get_colors()
        super().__init__(
            content=self._build_content(),
            padding=ft.padding.symmetric(horizontal=SPACING["md"], vertical=SPACING["sm"]),
            bgcolor=colors["bg_card"],
            border=ft.border.only(bottom=ft.BorderSide(1, colors["border"])),
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            **kwargs
        )

    def _build_content(self):
        """Build compact filter content."""
        colors = get_colors()

        self._search_field = ft.TextField(
            hint_text="Search...",
            hint_style=ft.TextStyle(size=12, color=colors["text_muted"]),
            text_size=12,
            border_radius=RADIUS["md"],
            border_color=colors["border"],
            focused_border_color=colors["primary"],
            bgcolor=colors["bg_input"],
            content_padding=ft.padding.symmetric(horizontal=12, vertical=8),
            on_change=self._on_search_change,
            expand=True,
        )

        filter_button = ft.Container(
            content=ft.Row(
                [
                    ft.Icon(ft.Icons.FILTER_LIST_ROUNDED, size=16, color=colors["text_secondary"]),
                    ft.Container(width=4),
                    ft.Text("Filter", size=11, weight=ft.FontWeight.W_500, color=colors["text_secondary"]),
                ],
                spacing=0,
            ),
            padding=ft.padding.symmetric(horizontal=10, vertical=8),
            border_radius=RADIUS["md"],
            border=ft.border.all(1, colors["border"]),
            on_click=self._on_filter_click,
            on_hover=self._on_button_hover,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

        return ft.Row(
            [
                ft.Container(content=self._search_field, expand=True),
                ft.Container(width=SPACING["sm"]),
                filter_button,
            ],
        )

    def _on_search_change(self, e):
        """Handle search input change."""
        self._search_value = e.control.value or ""
        if self.on_search:
            self.on_search(self._search_value)

    def _on_filter_click(self, e):
        """Handle filter button click."""
        # This would typically open a bottom sheet or popup with filter options
        pass

    def _on_button_hover(self, e):
        """Handle button hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["bg_hover"]
            e.control.border = ft.border.all(1, colors["border_hover"])
        else:
            e.control.bgcolor = "transparent"
            e.control.border = ft.border.all(1, colors["border"])
        e.control.update()

    def get_search_value(self) -> str:
        """Get current search value."""
        return self._search_value
