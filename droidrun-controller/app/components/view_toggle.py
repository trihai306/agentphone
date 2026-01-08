"""View toggle component for switching between grid and list view modes.

Provides icon buttons with active state styling for toggling between:
- Grid view (card layout)
- List view (row layout)

Follows existing button patterns from DeviceGridToolbar.
"""

import flet as ft
from typing import Optional, Callable
from ..theme import get_colors, RADIUS, SPACING, ANIMATION, get_shadow


class ViewToggle(ft.Container):
    """Toggle buttons for switching between grid and list view modes.

    Features:
    - Grid and list icon buttons
    - Active state styling with primary color
    - Smooth hover effects and animations
    - Callback for view mode changes
    """

    # View mode constants
    VIEW_GRID = "grid"
    VIEW_LIST = "list"

    def __init__(
        self,
        on_change: Optional[Callable[[str], None]] = None,
        initial_mode: str = "grid",
        **kwargs
    ):
        """Initialize the ViewToggle component.

        Args:
            on_change: Callback when view mode changes, receives 'grid' or 'list'
            initial_mode: Initial view mode ('grid' or 'list')
        """
        self.on_change = on_change
        self._current_mode = initial_mode if initial_mode in (self.VIEW_GRID, self.VIEW_LIST) else self.VIEW_GRID

        colors = get_colors()
        super().__init__(
            content=self._build_content(),
            padding=ft.padding.all(2),
            border_radius=RADIUS["md"],
            bgcolor=colors["bg_input"],
            border=ft.border.all(1, colors["border"]),
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
            **kwargs
        )

    def _build_content(self):
        """Build the toggle button content."""
        colors = get_colors()

        # Grid view button
        self._grid_button = self._build_toggle_button(
            icon=ft.Icons.GRID_VIEW_ROUNDED,
            mode=self.VIEW_GRID,
            tooltip="Grid view",
        )

        # List view button
        self._list_button = self._build_toggle_button(
            icon=ft.Icons.VIEW_LIST_ROUNDED,
            mode=self.VIEW_LIST,
            tooltip="List view",
        )

        return ft.Row(
            [
                self._grid_button,
                self._list_button,
            ],
            spacing=2,
        )

    def _build_toggle_button(
        self,
        icon: str,
        mode: str,
        tooltip: str,
    ) -> ft.Container:
        """Build a toggle button with active state styling.

        Args:
            icon: The icon to display
            mode: The view mode this button represents
            tooltip: Tooltip text

        Returns:
            Container with styled icon button
        """
        colors = get_colors()
        is_active = self._current_mode == mode

        return ft.Container(
            content=ft.Icon(
                icon,
                size=18,
                color=colors["text_inverse"] if is_active else colors["text_secondary"],
            ),
            width=32,
            height=32,
            border_radius=RADIUS["sm"],
            bgcolor=colors["primary"] if is_active else "transparent",
            alignment=ft.Alignment(0, 0),
            on_click=lambda e, m=mode: self._on_toggle_click(m),
            on_hover=lambda e, m=mode: self._on_toggle_hover(e, m),
            tooltip=tooltip,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            shadow=get_shadow("xs") if is_active else None,
        )

    def _on_toggle_click(self, mode: str):
        """Handle toggle button click.

        Args:
            mode: The view mode that was clicked
        """
        if self._current_mode == mode:
            return  # Already active, no change needed

        self._current_mode = mode
        self._update_buttons()

        if self.on_change:
            self.on_change(mode)

    def _on_toggle_hover(self, e, mode: str):
        """Handle toggle button hover.

        Args:
            e: The hover event
            mode: The view mode of the hovered button
        """
        colors = get_colors()
        is_active = self._current_mode == mode

        if is_active:
            # Active button has different hover behavior
            if e.data == "true":
                e.control.bgcolor = colors["primary_dark"]
            else:
                e.control.bgcolor = colors["primary"]
        else:
            # Inactive button hover
            if e.data == "true":
                e.control.bgcolor = colors["bg_hover"]
            else:
                e.control.bgcolor = "transparent"

        e.control.update()

    def _update_buttons(self):
        """Update button states after mode change."""
        colors = get_colors()

        # Update grid button
        grid_active = self._current_mode == self.VIEW_GRID
        self._grid_button.bgcolor = colors["primary"] if grid_active else "transparent"
        self._grid_button.content.color = colors["text_inverse"] if grid_active else colors["text_secondary"]
        self._grid_button.shadow = get_shadow("xs") if grid_active else None

        # Update list button
        list_active = self._current_mode == self.VIEW_LIST
        self._list_button.bgcolor = colors["primary"] if list_active else "transparent"
        self._list_button.content.color = colors["text_inverse"] if list_active else colors["text_secondary"]
        self._list_button.shadow = get_shadow("xs") if list_active else None

        self._grid_button.update()
        self._list_button.update()

    # Public methods for external control
    def get_mode(self) -> str:
        """Get current view mode.

        Returns:
            Current mode ('grid' or 'list')
        """
        return self._current_mode

    def set_mode(self, mode: str):
        """Set view mode programmatically.

        Args:
            mode: The view mode to set ('grid' or 'list')
        """
        if mode not in (self.VIEW_GRID, self.VIEW_LIST):
            return

        if self._current_mode == mode:
            return

        self._current_mode = mode
        self._update_buttons()

    def is_grid_mode(self) -> bool:
        """Check if current mode is grid.

        Returns:
            True if in grid mode
        """
        return self._current_mode == self.VIEW_GRID

    def is_list_mode(self) -> bool:
        """Check if current mode is list.

        Returns:
            True if in list mode
        """
        return self._current_mode == self.VIEW_LIST


class ViewToggleCompact(ft.Container):
    """A compact single-button toggle for view mode.

    Shows the current mode icon and toggles on click.
    Useful for mobile layouts or limited space.
    """

    def __init__(
        self,
        on_change: Optional[Callable[[str], None]] = None,
        initial_mode: str = "grid",
        **kwargs
    ):
        """Initialize the compact ViewToggle.

        Args:
            on_change: Callback when view mode changes
            initial_mode: Initial view mode ('grid' or 'list')
        """
        self.on_change = on_change
        self._current_mode = initial_mode if initial_mode in (ViewToggle.VIEW_GRID, ViewToggle.VIEW_LIST) else ViewToggle.VIEW_GRID

        colors = get_colors()
        super().__init__(
            content=self._build_content(),
            padding=ft.padding.all(SPACING["xs"]),
            border_radius=RADIUS["md"],
            border=ft.border.all(1, colors["border"]),
            on_click=self._on_click,
            on_hover=self._on_hover,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            **kwargs
        )

    def _build_content(self):
        """Build the toggle button content."""
        colors = get_colors()
        icon = ft.Icons.GRID_VIEW_ROUNDED if self._current_mode == ViewToggle.VIEW_GRID else ft.Icons.VIEW_LIST_ROUNDED
        tooltip = "Switch to list view" if self._current_mode == ViewToggle.VIEW_GRID else "Switch to grid view"

        self._icon = ft.Icon(
            icon,
            size=18,
            color=colors["text_secondary"],
        )

        return ft.Container(
            content=self._icon,
            width=28,
            height=28,
            alignment=ft.Alignment(0, 0),
            tooltip=tooltip,
        )

    def _on_click(self, e):
        """Handle button click - toggle between modes."""
        self._current_mode = ViewToggle.VIEW_LIST if self._current_mode == ViewToggle.VIEW_GRID else ViewToggle.VIEW_GRID

        # Update icon
        self._icon.name = ft.Icons.GRID_VIEW_ROUNDED if self._current_mode == ViewToggle.VIEW_GRID else ft.Icons.VIEW_LIST_ROUNDED

        # Update tooltip
        tooltip = "Switch to list view" if self._current_mode == ViewToggle.VIEW_GRID else "Switch to grid view"
        self.content.tooltip = tooltip

        self._icon.update()
        self.content.update()

        if self.on_change:
            self.on_change(self._current_mode)

    def _on_hover(self, e):
        """Handle hover effect."""
        colors = get_colors()
        if e.data == "true":
            self.bgcolor = colors["bg_hover"]
            self.border = ft.border.all(1, colors["border_hover"])
        else:
            self.bgcolor = "transparent"
            self.border = ft.border.all(1, colors["border"])
        self.update()

    def get_mode(self) -> str:
        """Get current view mode."""
        return self._current_mode

    def set_mode(self, mode: str):
        """Set view mode programmatically."""
        if mode not in (ViewToggle.VIEW_GRID, ViewToggle.VIEW_LIST):
            return

        if self._current_mode == mode:
            return

        self._current_mode = mode
        self._icon.name = ft.Icons.GRID_VIEW_ROUNDED if mode == ViewToggle.VIEW_GRID else ft.Icons.VIEW_LIST_ROUNDED
        self.content.tooltip = "Switch to list view" if mode == ViewToggle.VIEW_GRID else "Switch to grid view"
        self._icon.update()
        self.content.update()
