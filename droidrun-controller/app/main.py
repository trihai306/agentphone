"""Main Flet application for Droidrun Controller - Professional Dashboard 2025."""

import flet as ft
from .theme import COLORS, get_theme, get_colors, set_theme_mode, get_theme_mode, SPACING, RADIUS
from .views import DevicesView, WorkflowsView, ExecutionsView, SettingsView, AgentRunnerView
from .views.analytics import AnalyticsView
from .views.phone_viewer import PhoneViewerView
from .components.toast import ToastManager
from .backend import backend


class DroidrunApp:
    """Main application class with professional dashboard UI."""

    # Responsive breakpoints
    BREAKPOINT_SM = 768
    BREAKPOINT_MD = 1024
    BREAKPOINT_LG = 1280

    def __init__(self, page: ft.Page):
        self.page = page
        self.current_view = "dashboard"
        self.app_state = {
            "adb_path": "adb",
            "auto_discover": True,
            "wireless_adb": False,
            "screenshot_quality": "high",
            "record_delays": True,
            "auto_save": True,
        }
        self.backend = backend
        self.toast = ToastManager(page)
        self.sidebar_collapsed = False
        self.sidebar_visible = True
        self._current_width = 1440

        self._setup_page()
        self._build_ui()
        self.page.run_task(self._initialize)
        self.page.on_resized = self._on_resize

    def _setup_page(self):
        """Configure the page settings."""
        self.page.title = "Droidrun Controller"
        self.page.theme = get_theme()
        self.page.theme_mode = ft.ThemeMode.LIGHT  # Light mode like reference
        self.page.bgcolor = COLORS["bg_primary"]
        self.page.padding = 0
        self.page.window.min_width = 375  # Mobile minimum
        self.page.window.min_height = 600
        self.page.window.width = 1440
        self.page.window.height = 900

    def _build_ui(self):
        """Build the main UI layout."""
        # Get current window width for responsive layout
        self._current_width = self.page.window.width or 1440
        is_mobile = self._current_width < self.BREAKPOINT_SM
        is_tablet = self._current_width < self.BREAKPOINT_MD

        # Auto-collapse sidebar on smaller screens
        if is_mobile:
            self.sidebar_visible = False
        elif is_tablet:
            self.sidebar_collapsed = True
            self.sidebar_visible = True
        else:
            self.sidebar_collapsed = False
            self.sidebar_visible = True

        # Create views with responsive context
        self.views = {
            "dashboard": DevicesView(self.app_state, self.toast),
            "phone_viewer": PhoneViewerView(self.app_state, self.toast),
            "agent_runner": AgentRunnerView(self.app_state, self.toast),
            "workflows": WorkflowsView(self.app_state, self.toast),
            "executions": ExecutionsView(self.app_state, self.toast),
            "analytics": AnalyticsView(self.app_state, self.toast),
            "settings": SettingsView(self.app_state, self.toast),
        }

        # Responsive padding
        content_padding = ft.padding.only(
            left=16 if is_mobile else 24 if is_tablet else 32,
            right=16 if is_mobile else 24 if is_tablet else 32,
            top=16 if is_mobile else 24,
            bottom=16 if is_mobile else 24
        )

        # Content area
        self.content_container = ft.Container(
            content=self.views["dashboard"],
            expand=True,
            padding=content_padding,
            bgcolor=COLORS["bg_primary"],
        )

        # Build layout
        controls = []
        if self.sidebar_visible:
            controls.append(self._build_sidebar())
        controls.append(self.content_container)

        # Mobile bottom navigation
        if is_mobile:
            main_layout = ft.Column(
                [
                    ft.Row(controls, spacing=0, expand=True),
                    self._build_mobile_nav(),
                ],
                spacing=0,
                expand=True,
            )
        else:
            main_layout = ft.Row(
                controls,
                spacing=0,
                expand=True,
            )

        # Mobile menu button overlay
        if is_mobile:
            main_layout = ft.Stack(
                [
                    main_layout,
                    ft.Container(
                        content=ft.IconButton(
                            icon=ft.Icons.MENU,
                            icon_color=COLORS["text_primary"],
                            icon_size=24,
                            bgcolor=COLORS["bg_card"],
                            on_click=self._toggle_mobile_menu,
                        ),
                        left=8,
                        top=8,
                    ),
                ],
                expand=True,
            )

        self.page.add(main_layout)

    def _build_sidebar(self):
        """Build professional sidebar inspired by reference design."""
        colors = COLORS
        is_collapsed = self.sidebar_collapsed

        # Logo section
        if is_collapsed:
            logo_section = ft.Container(
                content=ft.Container(
                    content=ft.Icon(
                        ft.Icons.ANDROID,
                        size=28,
                        color=colors["primary"],
                    ),
                    width=44,
                    height=44,
                    border_radius=RADIUS["md"],
                    bgcolor=colors["primary_glow"],
                    alignment=ft.alignment.center,
                ),
                padding=ft.padding.only(left=12, right=12, top=20, bottom=16),
                alignment=ft.alignment.center,
            )
        else:
            logo_section = ft.Container(
                content=ft.Row(
                    [
                        ft.Container(
                            content=ft.Icon(
                                ft.Icons.ANDROID,
                                size=28,
                                color=colors["primary"],
                            ),
                            width=44,
                            height=44,
                            border_radius=RADIUS["md"],
                            bgcolor=colors["primary_glow"],
                            alignment=ft.alignment.center,
                        ),
                        ft.Container(width=12),
                        ft.Column(
                            [
                                ft.Text(
                                    "Droidrun",
                                    size=18,
                                    weight=ft.FontWeight.W_700,
                                    color=colors["text_primary"],
                                ),
                                ft.Text(
                                    "Controller",
                                    size=11,
                                    color=colors["text_muted"],
                                ),
                            ],
                            spacing=0,
                        ),
                        ft.Container(expand=True),
                        # Theme toggle
                        ft.IconButton(
                            icon=ft.Icons.DARK_MODE if get_theme_mode() == "light" else ft.Icons.LIGHT_MODE,
                            icon_size=18,
                            icon_color=colors["text_muted"],
                            tooltip="Toggle theme",
                            on_click=self._toggle_theme,
                        ),
                    ],
                ),
                padding=ft.padding.only(left=20, right=12, top=20, bottom=16),
            )

        # Collapsed sidebar - icons only
        if is_collapsed:
            # Collapsed navigation
            main_nav_items = [
                ("dashboard", ft.Icons.DASHBOARD_OUTLINED, ft.Icons.DASHBOARD),
                ("phone_viewer", ft.Icons.SMARTPHONE_OUTLINED, ft.Icons.SMARTPHONE),
                ("agent_runner", ft.Icons.SMART_TOY_OUTLINED, ft.Icons.SMART_TOY),
                ("workflows", ft.Icons.ACCOUNT_TREE_OUTLINED, ft.Icons.ACCOUNT_TREE),
                ("executions", ft.Icons.HISTORY_OUTLINED, ft.Icons.HISTORY),
                ("analytics", ft.Icons.ANALYTICS_OUTLINED, ft.Icons.ANALYTICS),
            ]

            main_nav = ft.Column(
                [self._build_nav_item_collapsed(key, icon_outline, icon_filled)
                 for key, icon_outline, icon_filled in main_nav_items],
                spacing=4,
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            )

            # Collapse toggle
            collapse_toggle = ft.Container(
                content=ft.IconButton(
                    icon=ft.Icons.CHEVRON_RIGHT,
                    icon_size=18,
                    icon_color=colors["text_muted"],
                    tooltip="Expand sidebar",
                    on_click=self._toggle_sidebar,
                ),
                alignment=ft.alignment.center,
                padding=ft.padding.only(bottom=20),
            )

            return ft.Container(
                content=ft.Column(
                    [
                        logo_section,
                        ft.Container(height=20),
                        main_nav,
                        ft.Container(expand=True),
                        # Settings
                        self._build_nav_item_collapsed(
                            "settings", ft.Icons.SETTINGS_OUTLINED, ft.Icons.SETTINGS
                        ),
                        ft.Container(height=8),
                        collapse_toggle,
                    ],
                    spacing=0,
                    horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                ),
                width=72,
                bgcolor=colors["bg_secondary"],
                border=ft.border.only(right=ft.BorderSide(1, colors["border"])),
            )

        # Search bar
        search_bar = ft.Container(
            content=ft.Row(
                [
                    ft.Icon(ft.Icons.SEARCH, size=18, color=colors["text_muted"]),
                    ft.Container(width=10),
                    ft.Text("Search", size=13, color=colors["text_muted"]),
                    ft.Container(expand=True),
                    ft.Container(
                        content=ft.Text("⌘ K", size=11, color=colors["text_muted"]),
                        padding=ft.padding.symmetric(horizontal=8, vertical=4),
                        border_radius=4,
                        bgcolor=colors["bg_tertiary"],
                    ),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=14, vertical=10),
            margin=ft.margin.symmetric(horizontal=16),
            border_radius=RADIUS["md"],
            border=ft.border.all(1, colors["border"]),
            on_click=lambda _: self.toast.info("Search coming soon..."),
            on_hover=self._on_search_hover,
        )

        # Main navigation
        main_nav_items = [
            ("dashboard", "Dashboard", ft.Icons.DASHBOARD_OUTLINED, ft.Icons.DASHBOARD),
            ("phone_viewer", "Phone Viewer", ft.Icons.SMARTPHONE_OUTLINED, ft.Icons.SMARTPHONE),
            ("agent_runner", "Agent Runner", ft.Icons.SMART_TOY_OUTLINED, ft.Icons.SMART_TOY),
            ("workflows", "Workflows", ft.Icons.ACCOUNT_TREE_OUTLINED, ft.Icons.ACCOUNT_TREE),
            ("executions", "History", ft.Icons.HISTORY_OUTLINED, ft.Icons.HISTORY),
            ("analytics", "Analytics", ft.Icons.ANALYTICS_OUTLINED, ft.Icons.ANALYTICS),
        ]

        main_nav = ft.Column(
            [self._build_nav_item(*item) for item in main_nav_items],
            spacing=2,
        )

        # Actions section
        actions_section = ft.Container(
            content=ft.Column(
                [
                    ft.Text(
                        "QUICK ACTIONS",
                        size=10,
                        weight=ft.FontWeight.W_600,
                        color=colors["text_muted"],
                    ),
                    ft.Container(height=10),
                    self._build_action_item(
                        "New Recording",
                        ft.Icons.FIBER_MANUAL_RECORD,
                        colors["error"],
                        self._on_new_recording,
                    ),
                    ft.Container(height=6),
                    self._build_action_item(
                        "Scan Devices",
                        ft.Icons.RADAR,
                        colors["accent_cyan"],
                        self._on_scan_devices,
                    ),
                ],
            ),
            padding=ft.padding.only(left=20, right=20, top=20),
        )

        # Status indicator
        status_section = ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        width=8,
                        height=8,
                        border_radius=4,
                        bgcolor=colors["success"],
                    ),
                    ft.Container(width=10),
                    ft.Text(
                        "System Ready",
                        size=12,
                        color=colors["text_secondary"],
                    ),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=14, vertical=10),
            margin=ft.margin.symmetric(horizontal=16),
            border_radius=RADIUS["sm"],
            bgcolor=colors["bg_tertiary"],
        )

        # Settings at bottom
        settings_section = ft.Container(
            content=ft.Column(
                [
                    ft.Divider(color=colors["border"], height=1),
                    ft.Container(height=12),
                    self._build_nav_item(
                        "settings", "Settings",
                        ft.Icons.SETTINGS_OUTLINED, ft.Icons.SETTINGS
                    ),
                    ft.Container(height=8),
                    # Help & Support
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(ft.Icons.HELP_OUTLINE, size=18, color=colors["text_muted"]),
                                ft.Container(width=12),
                                ft.Text("Help & Support", size=13, color=colors["text_secondary"]),
                            ],
                        ),
                        padding=ft.padding.symmetric(horizontal=14, vertical=10),
                        border_radius=RADIUS["sm"],
                        on_click=lambda _: self.toast.info("Help coming soon..."),
                        on_hover=self._on_nav_hover_secondary,
                    ),
                    ft.Container(height=8),
                    # Collapse toggle
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(ft.Icons.CHEVRON_LEFT, size=18, color=colors["text_muted"]),
                                ft.Container(width=12),
                                ft.Text("Collapse", size=13, color=colors["text_secondary"]),
                            ],
                        ),
                        padding=ft.padding.symmetric(horizontal=14, vertical=10),
                        border_radius=RADIUS["sm"],
                        on_click=self._toggle_sidebar,
                        on_hover=self._on_nav_hover_secondary,
                    ),
                ],
            ),
            padding=ft.padding.only(left=16, right=16, bottom=20),
        )

        return ft.Container(
            content=ft.Column(
                [
                    logo_section,
                    ft.Container(height=8),
                    search_bar,
                    ft.Container(height=20),
                    status_section,
                    ft.Container(height=24),
                    # Navigation label
                    ft.Container(
                        content=ft.Text(
                            "NAVIGATION",
                            size=10,
                            weight=ft.FontWeight.W_600,
                            color=colors["text_muted"],
                        ),
                        padding=ft.padding.only(left=20, bottom=10),
                    ),
                    ft.Container(
                        content=main_nav,
                        padding=ft.padding.symmetric(horizontal=12),
                    ),
                    actions_section,
                    ft.Container(expand=True),
                    settings_section,
                ],
                spacing=0,
            ),
            width=260,
            bgcolor=colors["bg_secondary"],
            border=ft.border.only(right=ft.BorderSide(1, colors["border"])),
        )

    def _build_nav_item(self, key: str, label: str, icon_outline: str, icon_filled: str):
        """Build a navigation item."""
        is_selected = self.current_view == key
        colors = COLORS

        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(
                        icon_filled if is_selected else icon_outline,
                        size=20,
                        color=colors["primary"] if is_selected else colors["text_secondary"],
                    ),
                    ft.Container(width=12),
                    ft.Text(
                        label,
                        size=14,
                        weight=ft.FontWeight.W_600 if is_selected else ft.FontWeight.W_400,
                        color=colors["text_primary"] if is_selected else colors["text_secondary"],
                    ),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=14, vertical=12),
            border_radius=RADIUS["md"],
            bgcolor=colors["primary_glow"] if is_selected else "transparent",
            on_hover=lambda e, k=key: self._on_nav_hover(e, k) if not is_selected else None,
            on_click=lambda e, k=key: self._on_nav_click(k),
        )

    def _build_action_item(self, label: str, icon: str, color: str, on_click):
        """Build a quick action button."""
        colors = COLORS

        return ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        content=ft.Icon(icon, size=16, color=color),
                        width=32,
                        height=32,
                        border_radius=RADIUS["sm"],
                        bgcolor=f"{color}18",
                        alignment=ft.alignment.center,
                    ),
                    ft.Container(width=12),
                    ft.Text(
                        label,
                        size=13,
                        weight=ft.FontWeight.W_500,
                        color=colors["text_primary"],
                    ),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=12, vertical=8),
            border_radius=RADIUS["md"],
            border=ft.border.all(1, colors["border"]),
            on_click=on_click,
            on_hover=self._on_action_hover,
        )

    def _on_search_hover(self, e):
        """Handle search bar hover."""
        colors = COLORS
        if e.data == "true":
            e.control.border = ft.border.all(1, colors["primary"])
        else:
            e.control.border = ft.border.all(1, colors["border"])
        e.control.update()

    def _on_nav_hover(self, e, key: str):
        """Handle navigation item hover."""
        if self.current_view != key:
            colors = COLORS
            if e.data == "true":
                e.control.bgcolor = colors["bg_hover"]
            else:
                e.control.bgcolor = "transparent"
            e.control.update()

    def _on_nav_hover_secondary(self, e):
        """Handle secondary nav hover."""
        colors = COLORS
        if e.data == "true":
            e.control.bgcolor = colors["bg_hover"]
        else:
            e.control.bgcolor = "transparent"
        e.control.update()

    def _on_action_hover(self, e):
        """Handle action button hover."""
        colors = COLORS
        if e.data == "true":
            e.control.bgcolor = colors["bg_hover"]
            e.control.border = ft.border.all(1, colors["border_hover"])
        else:
            e.control.bgcolor = "transparent"
            e.control.border = ft.border.all(1, colors["border"])
        e.control.update()

    def _on_nav_click(self, key: str):
        """Handle navigation item click."""
        if self.current_view == key:
            return

        self.current_view = key
        self.content_container.content = self.views[key]

        # Update sidebar navigation items without full rebuild
        self._update_sidebar_selection()
        self.page.update()
        self.page.run_task(self._load_view_data, key)

    def _toggle_theme(self, e):
        """Toggle between light and dark theme."""
        current = get_theme_mode()
        new_mode = "dark" if current == "light" else "light"
        set_theme_mode(new_mode)

        # Update page
        self.page.theme = get_theme()
        self.page.theme_mode = ft.ThemeMode.DARK if new_mode == "dark" else ft.ThemeMode.LIGHT
        self.page.bgcolor = COLORS["bg_primary"]

        # Rebuild UI
        self.page.controls.clear()
        self._build_ui()
        self.page.update()

        self.toast.info(f"Switched to {new_mode} mode")

    def _rebuild_sidebar(self):
        """Rebuild sidebar to update selection state."""
        # Rebuild entire UI to handle responsive layout properly
        self.page.controls.clear()
        self._build_ui()
        self.page.update()

    def _update_sidebar_selection(self):
        """Update sidebar selection without full UI rebuild."""
        # For simplicity, we rebuild the sidebar container only
        if not self.sidebar_visible:
            return

        # Find and replace sidebar in the main layout
        try:
            main_layout = self.page.controls[0]
            if isinstance(main_layout, ft.Row):
                # Desktop layout - sidebar is first control
                main_layout.controls[0] = self._build_sidebar()
            elif isinstance(main_layout, ft.Column):
                # Mobile layout with bottom nav
                inner_row = main_layout.controls[0]
                if isinstance(inner_row, ft.Row):
                    inner_row.controls[0] = self._build_sidebar()
                # Also update mobile nav at bottom
                if len(main_layout.controls) > 1:
                    main_layout.controls[1] = self._build_mobile_nav()
            elif isinstance(main_layout, ft.Stack):
                # Mobile with overlay
                inner_col = main_layout.controls[0]
                if isinstance(inner_col, ft.Column) and len(inner_col.controls) > 1:
                    inner_col.controls[1] = self._build_mobile_nav()
        except (IndexError, AttributeError):
            # Fallback to full rebuild if structure unexpected
            self._rebuild_sidebar()

    async def _on_new_recording(self, e):
        """Handle new recording action."""
        self.toast.info("Select a device to start recording...")

    async def _on_scan_devices(self, e):
        """Handle scan devices action."""
        self.toast.info("Scanning for devices...")
        await self.views["dashboard"].load_devices()

    async def _load_view_data(self, key: str):
        """Load data for the selected view."""
        view = self.views.get(key)
        # Check if view is added to page before loading data
        if not view or not hasattr(view, 'page') or view.page is None:
            return
        try:
            if key == "dashboard" and hasattr(view, "load_devices"):
                await view.load_devices()
            elif key == "phone_viewer" and hasattr(view, "load_devices"):
                await view.load_devices()
            elif key == "workflows" and hasattr(view, "load_workflows"):
                await view.load_workflows()
            elif key == "executions" and hasattr(view, "load_executions"):
                await view.load_executions()
        except AssertionError:
            # View not added to page yet, ignore
            pass
        except Exception as e:
            print(f"Error loading view data: {e}")

    def _build_nav_item_collapsed(self, key: str, icon_outline: str, icon_filled: str):
        """Build a collapsed navigation item (icon only)."""
        is_selected = self.current_view == key
        colors = COLORS

        return ft.Container(
            content=ft.Icon(
                icon_filled if is_selected else icon_outline,
                size=22,
                color=colors["primary"] if is_selected else colors["text_secondary"],
            ),
            width=44,
            height=44,
            border_radius=RADIUS["md"],
            bgcolor=colors["primary_glow"] if is_selected else "transparent",
            alignment=ft.alignment.center,
            on_hover=lambda e, k=key: self._on_nav_hover(e, k) if not is_selected else None,
            on_click=lambda e, k=key: self._on_nav_click(k),
        )

    def _build_mobile_nav(self):
        """Build bottom navigation for mobile."""
        colors = COLORS
        nav_items = [
            ("dashboard", "Home", ft.Icons.DASHBOARD_OUTLINED, ft.Icons.DASHBOARD),
            ("phone_viewer", "Viewer", ft.Icons.SMARTPHONE_OUTLINED, ft.Icons.SMARTPHONE),
            ("agent_runner", "Agent", ft.Icons.SMART_TOY_OUTLINED, ft.Icons.SMART_TOY),
            ("workflows", "Flows", ft.Icons.ACCOUNT_TREE_OUTLINED, ft.Icons.ACCOUNT_TREE),
            ("settings", "Settings", ft.Icons.SETTINGS_OUTLINED, ft.Icons.SETTINGS),
        ]

        items = []
        for key, label, icon_outline, icon_filled in nav_items:
            is_selected = self.current_view == key
            items.append(
                ft.Container(
                    content=ft.Column(
                        [
                            ft.Icon(
                                icon_filled if is_selected else icon_outline,
                                size=22,
                                color=colors["primary"] if is_selected else colors["text_muted"],
                            ),
                            ft.Text(
                                label,
                                size=10,
                                color=colors["primary"] if is_selected else colors["text_muted"],
                            ),
                        ],
                        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                        spacing=2,
                    ),
                    expand=True,
                    padding=ft.padding.symmetric(vertical=8),
                    on_click=lambda e, k=key: self._on_nav_click(k),
                )
            )

        return ft.Container(
            content=ft.Row(items, spacing=0),
            bgcolor=colors["bg_secondary"],
            border=ft.border.only(top=ft.BorderSide(1, colors["border"])),
            padding=ft.padding.symmetric(horizontal=8),
        )

    def _toggle_sidebar(self, e=None):
        """Toggle sidebar collapsed state."""
        self.sidebar_collapsed = not self.sidebar_collapsed
        self.page.controls.clear()
        self._build_ui()
        self.page.update()

    def _toggle_mobile_menu(self, e=None):
        """Toggle mobile menu visibility."""
        self.sidebar_visible = not self.sidebar_visible
        self.page.controls.clear()
        self._build_ui()
        self.page.update()

    def _on_resize(self, e):
        """Handle window resize for responsive layout."""
        new_width = self.page.window.width
        if new_width is None:
            return

        # Determine if we need to rebuild based on breakpoint changes
        old_is_mobile = self._current_width < self.BREAKPOINT_SM
        old_is_tablet = self._current_width < self.BREAKPOINT_MD

        new_is_mobile = new_width < self.BREAKPOINT_SM
        new_is_tablet = new_width < self.BREAKPOINT_MD

        self._current_width = new_width

        # Only rebuild if crossing a breakpoint
        if old_is_mobile != new_is_mobile or old_is_tablet != new_is_tablet:
            self.page.controls.clear()
            self._build_ui()
            self.page.update()

    async def _initialize(self):
        """Initialize backend and load initial data."""
        try:
            await self.backend.initialize()
            self.toast.success("Ready")
            await self.views["dashboard"].load_devices()
        except Exception as ex:
            self.toast.error(f"Initialization failed: {ex}")


def main(page: ft.Page):
    """Main entry point for the Flet app."""
    DroidrunApp(page)


if __name__ == "__main__":
    ft.app(target=main)
