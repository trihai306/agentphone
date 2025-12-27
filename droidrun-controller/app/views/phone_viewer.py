"""Phone Viewer view - Cloud device farm style grid management."""

import flet as ft
import asyncio
from typing import List, Dict, Set
from ..theme import COLORS, RADIUS, SPACING, SHADOWS, get_shadow, ANIMATION, get_colors
from ..components.device_card import DeviceCard, DeviceGridToolbar
from ..components.empty_state import EmptyState
from ..components.search_filter import SearchFilter, SearchFilterCompact
from ..components.view_toggle import ViewToggle, ViewToggleCompact
from ..components.device_detail_modal import DeviceDetailModal, show_device_detail_modal
from ..backend import backend
from ..services.screen_service import screen_service


class PhoneViewerView(ft.Container):
    """Cloud device farm style grid view for managing multiple devices."""

    def __init__(self, app_state, toast, **kwargs):
        self.app_state = app_state
        self.toast = toast
        self.devices = []
        self.selected_devices: Set[str] = set()
        self.loading = False
        self.scrcpy_available = False
        self.scrcpy_version = None

        # Filter state
        self._search_query = ""
        self._status_filter = "all"
        self._version_filter = "all"
        self._sort_by = "name"
        self._view_mode = "grid"  # "grid" or "list"

        # Bulk operation progress state
        self._bulk_operation_active = False
        self._bulk_operation_name = ""
        self._bulk_operation_progress = 0.0
        self._bulk_operation_total = 0
        self._bulk_operation_completed = 0

        # Modal reference
        self._current_modal = None

        super().__init__(
            content=self._build_content(),
            expand=True,
            **kwargs
        )

    def _get_container_width(self):
        """Get the current container width for responsive layout."""
        try:
            if hasattr(self, 'page') and self.page:
                return self.page.window.width or 1440
        except:
            pass
        return 1440

    def _is_mobile(self):
        return self._get_container_width() < 768

    def _is_tablet(self):
        width = self._get_container_width()
        return width >= 768 and width < 1024

    def _get_grid_columns(self):
        """Get number of columns based on screen width."""
        width = self._get_container_width()
        if width < 600:
            return 2
        elif width < 900:
            return 4
        elif width < 1200:
            return 6
        elif width < 1600:
            return 8
        else:
            return 10

    def _get_unique_android_versions(self) -> List[str]:
        """Get unique Android versions from all devices."""
        versions = set()
        for device in self.devices:
            version = device.get("android_version", "")
            if version and version != "?":
                versions.add(version)
        return sorted(versions, key=lambda v: self._parse_version(v), reverse=True)

    def _parse_version(self, version_str: str) -> tuple:
        """Parse version string for sorting."""
        try:
            parts = version_str.split(".")
            return tuple(int(p) for p in parts if p.isdigit())
        except (ValueError, AttributeError):
            return (0,)

    def _get_filtered_devices(self) -> List[Dict]:
        """Get filtered and sorted list of devices based on current filter state."""
        filtered = self.devices.copy()

        # Apply search filter
        if self._search_query:
            query = self._search_query.lower()
            filtered = [
                d for d in filtered
                if query in d.get("model", "").lower()
                or query in d.get("adb_serial", "").lower()
                or query in d.get("device_name", "").lower()
                or query in d.get("brand", "").lower()
            ]

        # Apply status filter
        if self._status_filter == "online":
            filtered = [d for d in filtered if d.get("status") == "connected"]
        elif self._status_filter == "offline":
            filtered = [d for d in filtered if d.get("status") != "connected"]

        # Apply version filter
        if self._version_filter != "all":
            filtered = [d for d in filtered if d.get("android_version") == self._version_filter]

        # Apply sorting
        if self._sort_by == "name":
            filtered.sort(key=lambda d: d.get("model", "").lower())
        elif self._sort_by == "status":
            # Online devices first, then offline
            filtered.sort(key=lambda d: (0 if d.get("status") == "connected" else 1, d.get("model", "").lower()))
        elif self._sort_by == "model":
            filtered.sort(key=lambda d: d.get("model", "").lower())
        elif self._sort_by == "version":
            # Sort by version number (descending), then by name
            filtered.sort(key=lambda d: (self._parse_version(d.get("android_version", "0")), d.get("model", "").lower()), reverse=True)

        return filtered

    def _on_search_change(self, query: str):
        """Handle search input change."""
        self._search_query = query
        self.content = self._build_content()
        self.update()

    def _on_status_filter_change(self, status: str):
        """Handle status filter change."""
        self._status_filter = status
        self.content = self._build_content()
        self.update()

    def _on_version_filter_change(self, version: str):
        """Handle version filter change."""
        self._version_filter = version
        self.content = self._build_content()
        self.update()

    def _on_sort_change(self, sort_by: str):
        """Handle sort selection change."""
        self._sort_by = sort_by
        self.content = self._build_content()
        self.update()

    def _on_view_mode_change(self, mode: str):
        """Handle view mode toggle change."""
        self._view_mode = mode
        self.content = self._build_content()
        self.update()

    def _build_content(self):
        """Build the view content."""
        # Choose device display based on view mode
        device_display = self._build_device_list() if self._view_mode == "list" else self._build_device_grid()

        main_content = ft.Column(
            [
                self._build_header(),
                ft.Container(height=SPACING["lg"]),
                self._build_search_filter(),
                self._build_toolbar(),
                device_display,
            ],
            spacing=0,
            expand=True,
        )

        # Use Stack to overlay progress indicator when bulk operation is active
        if self._bulk_operation_active:
            return ft.Stack(
                [
                    main_content,
                    self._build_progress_overlay(),
                ],
                expand=True,
            )

        return main_content

    def _build_search_filter(self):
        """Build the search and filter toolbar with view toggle."""
        is_mobile = self._is_mobile()
        android_versions = self._get_unique_android_versions()

        if is_mobile:
            # Mobile: search bar with compact view toggle
            return ft.Container(
                content=ft.Row(
                    [
                        ft.Container(
                            content=SearchFilterCompact(
                                on_search=self._on_search_change,
                            ),
                            expand=True,
                        ),
                        ViewToggleCompact(
                            on_change=self._on_view_mode_change,
                            initial_mode=self._view_mode,
                        ),
                    ],
                    spacing=SPACING["sm"],
                ),
                padding=ft.padding.symmetric(horizontal=SPACING["md"]),
            )

        # Desktop: full search filter with view toggle
        return ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        content=SearchFilter(
                            on_search=self._on_search_change,
                            on_status_filter=self._on_status_filter_change,
                            on_version_filter=self._on_version_filter_change,
                            on_sort=self._on_sort_change,
                            android_versions=android_versions,
                            is_mobile=is_mobile,
                        ),
                        expand=True,
                    ),
                    ViewToggle(
                        on_change=self._on_view_mode_change,
                        initial_mode=self._view_mode,
                    ),
                ],
                spacing=SPACING["md"],
                alignment=ft.MainAxisAlignment.SPACE_BETWEEN,
            ),
            padding=ft.padding.symmetric(horizontal=SPACING["lg"]),
        )

    def _build_header(self):
        """Build the header section with polished styling."""
        is_mobile = self._is_mobile()
        selected_count = len(self.selected_devices)
        total_count = len(self.devices)
        online_count = len([d for d in self.devices if d.get("status") == "connected"])

        # Calculate filtered count for display
        filtered_count = len(self._get_filtered_devices())
        has_active_filters = (
            self._search_query or
            self._status_filter != "all" or
            self._version_filter != "all"
        )

        if is_mobile:
            # Show filtered count on mobile when filters are active
            badge_text = f"{filtered_count}/{total_count}" if has_active_filters else f"{online_count}/{total_count}"
            return ft.Container(
                content=ft.Column(
                    [
                        ft.Row(
                            [
                                ft.Text(
                                    "Device Farm",
                                    size=22,
                                    weight=ft.FontWeight.W_700,
                                    color=COLORS["text_primary"],
                                ),
                                ft.Container(expand=True),
                                # Stats badges with improved styling
                                self._build_status_badge(
                                    badge_text,
                                    COLORS["primary"] if has_active_filters else COLORS["success"],
                                    COLORS["primary_glow"] if has_active_filters else COLORS["success_glow"],
                                ),
                            ],
                        ),
                        ft.Container(height=SPACING["sm"]),
                        ft.Row(
                            [
                                self._build_right_actions(),
                            ],
                        ),
                    ],
                ),
                padding=ft.padding.only(bottom=SPACING["sm"]),
            )

        return ft.Container(
            content=ft.Row(
                [
                    ft.Column(
                        [
                            ft.Row(
                                [
                                    # Title with gradient-like effect
                                    ft.Text(
                                        "Device Farm",
                                        size=28,
                                        weight=ft.FontWeight.W_700,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Container(width=SPACING["md"]),
                                    # Online count badge with pulse indicator
                                    self._build_online_badge(online_count),
                                    ft.Container(width=SPACING["sm"]),
                                    # Filtered count badge (shown when filters are active)
                                    self._build_filtered_badge(filtered_count, total_count) if has_active_filters else ft.Container(),
                                    ft.Container(width=SPACING["sm"]) if has_active_filters else ft.Container(),
                                    # Selected count badge
                                    self._build_selected_badge(selected_count) if selected_count > 0 else ft.Container(),
                                ],
                            ),
                            ft.Container(height=SPACING["xs"]),
                            ft.Text(
                                "Manage and control your cloud devices",
                                size=14,
                                color=COLORS["text_secondary"],
                            ),
                        ],
                        spacing=0,
                    ),
                    ft.Container(expand=True),
                    self._build_right_actions(),
                ],
            ),
            padding=ft.padding.only(bottom=SPACING["sm"]),
        )

    def _build_status_badge(self, text: str, color: str, bg_color: str):
        """Build a polished status badge."""
        return ft.Container(
            content=ft.Text(
                text,
                size=11,
                weight=ft.FontWeight.W_600,
                color=color,
            ),
            bgcolor=bg_color,
            border_radius=RADIUS["full"],
            padding=ft.padding.symmetric(horizontal=10, vertical=4),
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_online_badge(self, online_count: int):
        """Build an enhanced online status badge with pulse indicator."""
        return ft.Container(
            content=ft.Row(
                [
                    # Animated pulse dot
                    ft.Container(
                        width=8,
                        height=8,
                        border_radius=4,
                        bgcolor=COLORS["success"],
                        shadow=ft.BoxShadow(
                            spread_radius=0,
                            blur_radius=6,
                            color=COLORS["success_glow"],
                            offset=ft.Offset(0, 0),
                        ),
                    ),
                    ft.Container(width=6),
                    ft.Text(
                        f"{online_count} online",
                        size=12,
                        weight=ft.FontWeight.W_500,
                        color=COLORS["success"],
                    ),
                ],
            ),
            bgcolor=COLORS["success_glow"],
            border_radius=RADIUS["full"],
            padding=ft.padding.symmetric(horizontal=12, vertical=5),
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_selected_badge(self, selected_count: int):
        """Build a selected count badge."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(
                        ft.Icons.CHECK_CIRCLE_OUTLINE,
                        size=14,
                        color=COLORS["accent_purple"],
                    ),
                    ft.Container(width=4),
                    ft.Text(
                        f"{selected_count} selected",
                        size=12,
                        weight=ft.FontWeight.W_500,
                        color=COLORS["accent_purple"],
                    ),
                ],
            ),
            bgcolor=f"{COLORS['accent_purple']}15",
            border_radius=RADIUS["full"],
            padding=ft.padding.symmetric(horizontal=12, vertical=5),
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_filtered_badge(self, filtered_count: int, total_count: int):
        """Build a filtered count badge to show when filters are active."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(
                        ft.Icons.FILTER_LIST_ROUNDED,
                        size=14,
                        color=COLORS["primary"],
                    ),
                    ft.Container(width=4),
                    ft.Text(
                        f"{filtered_count}/{total_count}",
                        size=12,
                        weight=ft.FontWeight.W_500,
                        color=COLORS["primary"],
                    ),
                ],
            ),
            bgcolor=COLORS["primary_glow"],
            border_radius=RADIUS["full"],
            padding=ft.padding.symmetric(horizontal=12, vertical=5),
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_right_actions(self):
        """Build right side action buttons with polished styling."""
        return ft.Row(
            [
                # Payment button
                self._build_header_button(
                    "Payment",
                    ft.Icons.PAYMENT_OUTLINED,
                    lambda e: self.toast.info("Payment coming soon..."),
                ),
                ft.Container(width=SPACING["sm"]),
                # Docs button
                self._build_header_button(
                    "Docs",
                    ft.Icons.DESCRIPTION_OUTLINED,
                    lambda e: self.toast.info("Docs coming soon..."),
                ),
            ],
            spacing=0,
        )

    def _build_header_button(self, label: str, icon: str, on_click):
        """Build a polished header action button."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(icon, size=16, color=COLORS["text_secondary"]),
                    ft.Container(width=6),
                    ft.Text(
                        label,
                        size=12,
                        weight=ft.FontWeight.W_500,
                        color=COLORS["text_secondary"],
                    ),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=14, vertical=9),
            border_radius=RADIUS["md"],
            border=ft.border.all(1, COLORS["border"]),
            bgcolor="transparent",
            on_click=on_click,
            on_hover=self._on_button_hover,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_toolbar(self):
        """Build the toolbar section with enhanced styling."""
        is_mobile = self._is_mobile()
        all_selected = len(self.selected_devices) == len(self.devices) and len(self.devices) > 0

        if is_mobile:
            # Simplified mobile toolbar
            return ft.Container(
                content=ft.Row(
                    [
                        # Select all checkbox with label
                        ft.Row(
                            [
                                ft.Checkbox(
                                    value=all_selected,
                                    on_change=self._on_select_all,
                                    active_color=COLORS["primary"],
                                    check_color=COLORS["text_inverse"],
                                ),
                                ft.Text(
                                    f"{len(self.selected_devices)}",
                                    size=12,
                                    weight=ft.FontWeight.W_500,
                                    color=COLORS["text_secondary"],
                                ),
                            ],
                            spacing=4,
                        ),
                        ft.Container(expand=True),
                        # Action buttons
                        self._build_icon_action_button(
                            ft.Icons.PLAY_ARROW_ROUNDED,
                            COLORS["primary"],
                            "Automate",
                            self._on_automate,
                        ),
                        self._build_icon_action_button(
                            ft.Icons.REFRESH_ROUNDED,
                            COLORS["text_muted"],
                            "Refresh",
                            self._on_refresh,
                        ),
                    ],
                ),
                padding=ft.padding.symmetric(horizontal=SPACING["md"], vertical=SPACING["sm"]),
                bgcolor=COLORS["bg_card"],
                border=ft.border.only(bottom=ft.BorderSide(1, COLORS["border"])),
            )

        # Build bulk actions section (shown when devices are selected)
        bulk_actions = self._build_bulk_actions_section() if self.selected_devices else ft.Container()

        return ft.Container(
            content=ft.Row(
                [
                    # Left side - Select all and action buttons
                    ft.Row(
                        [
                            # Enhanced checkbox with subtle background
                            ft.Container(
                                content=ft.Checkbox(
                                    value=all_selected,
                                    on_change=self._on_select_all,
                                    active_color=COLORS["primary"],
                                    check_color=COLORS["text_inverse"],
                                ),
                                padding=ft.padding.only(right=SPACING["sm"]),
                            ),
                            # Action buttons with improved styling
                            self._build_toolbar_button(
                                "Automate",
                                ft.Icons.PLAY_CIRCLE_OUTLINE,
                                self._on_automate,
                                primary=True,
                            ),
                            self._build_toolbar_button(
                                "Proxy Data",
                                ft.Icons.VPN_KEY_OUTLINED,
                                self._on_proxy_data,
                            ),
                            self._build_toolbar_button(
                                "Change Device",
                                ft.Icons.SWAP_HORIZ_ROUNDED,
                                self._on_change_device,
                            ),
                            self._build_toolbar_button(
                                "Functions",
                                ft.Icons.TUNE_ROUNDED,
                                self._on_functions,
                            ),
                            self._build_toolbar_button(
                                "Copy",
                                ft.Icons.CONTENT_COPY_ROUNDED,
                                self._on_copy,
                            ),
                        ],
                        spacing=SPACING["sm"],
                    ),
                    ft.Container(width=SPACING["md"]),
                    bulk_actions,
                    ft.Container(expand=True),
                    # Right side - Refresh with enhanced styling
                    self._build_refresh_button(),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=SPACING["lg"], vertical=SPACING["md"]),
            bgcolor=COLORS["bg_card"],
            border=ft.border.only(bottom=ft.BorderSide(1, COLORS["border"])),
        )

    def _build_icon_action_button(self, icon: str, color: str, tooltip: str, on_click):
        """Build an icon-only action button for mobile."""
        return ft.Container(
            content=ft.Icon(icon, size=20, color=color),
            padding=SPACING["sm"],
            border_radius=RADIUS["md"],
            on_click=on_click,
            on_hover=self._on_button_hover,
            tooltip=tooltip,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_toolbar_button(self, label: str, icon: str, on_click, primary: bool = False):
        """Build a polished toolbar action button with dropdown indicator."""
        text_color = COLORS["text_inverse"] if primary else COLORS["text_secondary"]
        bg_color = COLORS["primary"] if primary else "transparent"

        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(icon, size=16, color=text_color),
                    ft.Container(width=6),
                    ft.Text(
                        label,
                        size=12,
                        weight=ft.FontWeight.W_500,
                        color=text_color,
                    ),
                    ft.Container(width=2),
                    ft.Icon(
                        ft.Icons.KEYBOARD_ARROW_DOWN_ROUNDED,
                        size=16,
                        color=text_color,
                    ),
                ],
                spacing=0,
            ),
            padding=ft.padding.symmetric(horizontal=14, vertical=8),
            border_radius=RADIUS["md"],
            bgcolor=bg_color,
            border=None if primary else ft.border.all(1, COLORS["border"]),
            on_click=on_click,
            on_hover=self._on_primary_hover if primary else self._on_button_hover,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_refresh_button(self):
        """Build an enhanced refresh button."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(ft.Icons.REFRESH_ROUNDED, size=18, color=COLORS["text_secondary"]),
                    ft.Container(width=6),
                    ft.Text(
                        "Refresh",
                        size=12,
                        weight=ft.FontWeight.W_500,
                        color=COLORS["text_secondary"],
                    ),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=12, vertical=8),
            border_radius=RADIUS["md"],
            border=ft.border.all(1, COLORS["border"]),
            on_click=self._on_refresh,
            on_hover=self._on_button_hover,
            tooltip="Refresh devices",
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_bulk_actions_section(self):
        """Build the bulk actions section shown when devices are selected.

        Returns:
            Container with selection indicator and bulk action buttons
        """
        colors = get_colors()
        count = len(self.selected_devices)

        return ft.Container(
            content=ft.Row(
                [
                    # Selection indicator
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(ft.Icons.CHECK_CIRCLE, size=14, color=colors["primary"]),
                                ft.Text(
                                    f"{count} selected",
                                    size=12,
                                    weight=ft.FontWeight.W_500,
                                    color=colors["primary"],
                                ),
                            ],
                            spacing=4,
                        ),
                        padding=ft.padding.symmetric(horizontal=8, vertical=4),
                        border_radius=RADIUS["sm"],
                        bgcolor=colors["primary_glow"],
                    ),
                    ft.Container(width=8),
                    # Bulk action buttons
                    self._build_bulk_action_button(
                        "Screenshot All",
                        ft.Icons.SCREENSHOT_MONITOR,
                        colors["accent_blue"],
                        lambda e: self._on_bulk_screenshot_all(),
                    ),
                    self._build_bulk_action_button(
                        "Restart",
                        ft.Icons.RESTART_ALT,
                        colors["warning"],
                        lambda e: self._on_bulk_restart_selected(),
                    ),
                    self._build_bulk_action_button(
                        "Clear Data",
                        ft.Icons.DELETE_SWEEP,
                        colors["warning"],
                        lambda e: self._on_bulk_clear_data(),
                    ),
                    self._build_bulk_action_button(
                        "Disconnect",
                        ft.Icons.POWER_SETTINGS_NEW,
                        colors["error"],
                        lambda e: self._on_bulk_disconnect_all(),
                    ),
                ],
                spacing=6,
            ),
            padding=ft.padding.symmetric(horizontal=8, vertical=4),
            border_radius=RADIUS["md"],
            bgcolor=colors["bg_secondary"],
            border=ft.border.all(1, colors["border"]),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_bulk_action_button(self, label: str, icon: str, color: str, on_click):
        """Build a compact bulk action button.

        Args:
            label: Button text
            icon: Icon to display
            color: Icon/text color
            on_click: Click callback

        Returns:
            Container styled as a compact action button
        """
        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(icon, size=14, color=color),
                    ft.Text(
                        label,
                        size=11,
                        weight=ft.FontWeight.W_500,
                        color=color,
                    ),
                ],
                spacing=4,
            ),
            padding=ft.padding.symmetric(horizontal=8, vertical=4),
            border_radius=RADIUS["sm"],
            on_click=on_click,
            on_hover=self._on_button_hover,
        )

    def _build_device_grid(self):
        """Build the device grid section with enhanced styling."""
        if self.loading:
            return self._build_loading()

        if not self.devices:
            return self._build_empty_state()

        # Get filtered devices
        filtered_devices = self._get_filtered_devices()

        # Show no results message if filters match nothing
        if not filtered_devices:
            return self._build_no_results_state()

        # Build device cards with enhanced phone frames
        cards = []
        for idx, device in enumerate(filtered_devices):
            serial = device.get("adb_serial", str(idx))
            # Use original device index for device_id to maintain consistency
            original_idx = self.devices.index(device) if device in self.devices else idx
            cards.append(
                self._build_phone_frame(
                    device_id=str(400 + original_idx),
                    device=device,
                    serial=serial,
                    idx=original_idx,
                )
            )

        # Wrap in scrollable grid with padding
        return ft.Container(
            content=ft.Column(
                [
                    ft.Container(
                        content=ft.Row(
                            cards,
                            wrap=True,
                            spacing=SPACING["lg"],
                            run_spacing=SPACING["lg"],
                        ),
                        padding=ft.padding.all(SPACING["xl"]),
                    ),
                ],
                scroll=ft.ScrollMode.AUTO,
                expand=True,
            ),
            expand=True,
            bgcolor=COLORS["bg_primary"],
        )

    def _build_device_list(self):
        """Build the device list view with row layout."""
        if self.loading:
            return self._build_loading()

        if not self.devices:
            return self._build_empty_state()

        # Get filtered devices
        filtered_devices = self._get_filtered_devices()

        # Show no results message if filters match nothing
        if not filtered_devices:
            return self._build_no_results_state()

        colors = get_colors()

        # Build device rows
        rows = []
        for idx, device in enumerate(filtered_devices):
            serial = device.get("adb_serial", str(idx))
            original_idx = self.devices.index(device) if device in self.devices else idx
            rows.append(
                self._build_device_list_row(
                    device_id=str(400 + original_idx),
                    device=device,
                    serial=serial,
                    idx=original_idx,
                )
            )

        # Wrap in scrollable list with header
        return ft.Container(
            content=ft.Column(
                [
                    # List header
                    self._build_list_header(),
                    # Device rows
                    ft.Container(
                        content=ft.Column(
                            rows,
                            spacing=0,
                        ),
                        padding=ft.padding.symmetric(horizontal=SPACING["lg"]),
                    ),
                ],
                scroll=ft.ScrollMode.AUTO,
                expand=True,
            ),
            expand=True,
            bgcolor=colors["bg_primary"],
        )

    def _build_list_header(self):
        """Build the list view header row."""
        colors = get_colors()
        return ft.Container(
            content=ft.Row(
                [
                    ft.Container(width=48),  # Checkbox column
                    ft.Container(
                        content=ft.Text(
                            "Device",
                            size=11,
                            weight=ft.FontWeight.W_600,
                            color=colors["text_muted"],
                        ),
                        expand=2,
                    ),
                    ft.Container(
                        content=ft.Text(
                            "Status",
                            size=11,
                            weight=ft.FontWeight.W_600,
                            color=colors["text_muted"],
                        ),
                        width=100,
                    ),
                    ft.Container(
                        content=ft.Text(
                            "Android",
                            size=11,
                            weight=ft.FontWeight.W_600,
                            color=colors["text_muted"],
                        ),
                        width=80,
                    ),
                    ft.Container(
                        content=ft.Text(
                            "Serial",
                            size=11,
                            weight=ft.FontWeight.W_600,
                            color=colors["text_muted"],
                        ),
                        expand=1,
                    ),
                    ft.Container(
                        content=ft.Text(
                            "Actions",
                            size=11,
                            weight=ft.FontWeight.W_600,
                            color=colors["text_muted"],
                            text_align=ft.TextAlign.CENTER,
                        ),
                        width=120,
                    ),
                ],
                spacing=SPACING["md"],
            ),
            padding=ft.padding.symmetric(horizontal=SPACING["lg"], vertical=SPACING["sm"]),
            bgcolor=colors["bg_tertiary"],
            border=ft.border.only(bottom=ft.BorderSide(1, colors["border"])),
        )

    def _build_device_list_row(self, device_id: str, device: dict, serial: str, idx: int):
        """Build a single device row for list view."""
        colors = get_colors()
        status = device.get("status", "offline")
        status_color = colors["success"] if status == "connected" else colors["text_muted"]
        is_selected = serial in self.selected_devices
        model = device.get("model", "Unknown Device")
        brand = device.get("brand", "")
        android_version = device.get("android_version", "?")

        return ft.Container(
            content=ft.Row(
                [
                    # Checkbox
                    ft.Container(
                        content=ft.Checkbox(
                            value=is_selected,
                            on_change=lambda e, did=device_id: self._on_device_select(did, e.control.value),
                            active_color=colors["primary"],
                            check_color=colors["text_inverse"],
                        ),
                        width=48,
                        alignment=ft.alignment.center,
                    ),
                    # Device info (model + brand)
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Container(
                                    content=ft.Icon(
                                        ft.Icons.PHONE_ANDROID_ROUNDED,
                                        size=24,
                                        color=colors["primary"],
                                    ),
                                    width=40,
                                    height=40,
                                    border_radius=RADIUS["md"],
                                    bgcolor=colors["primary_glow"],
                                    alignment=ft.alignment.center,
                                ),
                                ft.Container(width=SPACING["sm"]),
                                ft.Column(
                                    [
                                        ft.Text(
                                            model[:24] + "..." if len(model) > 24 else model,
                                            size=13,
                                            weight=ft.FontWeight.W_600,
                                            color=colors["text_primary"],
                                        ),
                                        ft.Text(
                                            brand,
                                            size=11,
                                            color=colors["text_muted"],
                                        ) if brand else ft.Container(),
                                    ],
                                    spacing=2,
                                ),
                            ],
                        ),
                        expand=2,
                    ),
                    # Status
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Container(
                                    width=8,
                                    height=8,
                                    border_radius=4,
                                    bgcolor=status_color,
                                    shadow=ft.BoxShadow(
                                        spread_radius=0,
                                        blur_radius=4,
                                        color=f"{status_color}60",
                                        offset=ft.Offset(0, 0),
                                    ) if status == "connected" else None,
                                ),
                                ft.Container(width=6),
                                ft.Text(
                                    "Online" if status == "connected" else "Offline",
                                    size=12,
                                    weight=ft.FontWeight.W_500,
                                    color=status_color,
                                ),
                            ],
                        ),
                        width=100,
                    ),
                    # Android version
                    ft.Container(
                        content=ft.Container(
                            content=ft.Text(
                                f"v{android_version}",
                                size=11,
                                weight=ft.FontWeight.W_500,
                                color=colors["text_secondary"],
                            ),
                            padding=ft.padding.symmetric(horizontal=8, vertical=3),
                            border_radius=RADIUS["sm"],
                            bgcolor=colors["bg_tertiary"],
                        ),
                        width=80,
                    ),
                    # Serial
                    ft.Container(
                        content=ft.Text(
                            serial[:16] + "..." if len(serial) > 16 else serial,
                            size=11,
                            color=colors["text_muted"],
                            font_family="monospace",
                        ),
                        expand=1,
                    ),
                    # Actions
                    ft.Container(
                        content=ft.Row(
                            [
                                self._build_list_action_icon(
                                    ft.Icons.PLAY_ARROW_ROUNDED,
                                    colors["success"],
                                    "Run",
                                    lambda e, s=serial: self.toast.info(f"Running {s}..."),
                                ),
                                self._build_list_action_icon(
                                    ft.Icons.REFRESH_ROUNDED,
                                    colors["info"],
                                    "Refresh",
                                    lambda e, s=serial: self.toast.info(f"Refreshing {s}..."),
                                ),
                                self._build_list_action_icon(
                                    ft.Icons.MORE_VERT_ROUNDED,
                                    colors["text_muted"],
                                    "More",
                                    lambda e, s=serial: self._on_device_click(s),
                                ),
                            ],
                            spacing=4,
                            alignment=ft.MainAxisAlignment.CENTER,
                        ),
                        width=120,
                    ),
                ],
                spacing=SPACING["md"],
            ),
            padding=ft.padding.symmetric(
                horizontal=SPACING["lg"],
                vertical=SPACING["list_item_padding_y"],
            ),
            border=ft.border.only(bottom=ft.BorderSide(1, colors["list_item_border"])),
            bgcolor=colors["list_item_selected"] if is_selected else colors["bg_card"],
            on_click=lambda e, s=serial: self._on_device_click(s),
            on_hover=lambda e: self._on_list_row_hover(e, is_selected),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_list_action_icon(self, icon: str, color: str, tooltip: str, on_click):
        """Build an action icon for list view rows."""
        colors = get_colors()
        return ft.Container(
            content=ft.Icon(icon, size=16, color=color),
            width=28,
            height=28,
            border_radius=RADIUS["sm"],
            alignment=ft.alignment.center,
            on_click=on_click,
            on_hover=self._on_action_icon_hover,
            tooltip=tooltip,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

    def _on_list_row_hover(self, e, is_selected: bool):
        """Handle list row hover effect."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["list_item_hover"]
        else:
            e.control.bgcolor = colors["list_item_selected"] if is_selected else colors["bg_card"]
        e.control.update()

    def _build_no_results_state(self):
        """Build a 'no results' state when filters match no devices."""
        return ft.Container(
            content=ft.Column(
                [
                    # Icon container with subtle background
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.SEARCH_OFF_ROUNDED,
                            size=48,
                            color=COLORS["text_muted"],
                        ),
                        width=90,
                        height=90,
                        border_radius=RADIUS["xl"],
                        bgcolor=COLORS["bg_tertiary"],
                        alignment=ft.alignment.center,
                        border=ft.border.all(1, COLORS["border"]),
                    ),
                    ft.Container(height=SPACING["xl"]),
                    ft.Text(
                        "No Matching Devices",
                        size=18,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["text_primary"],
                    ),
                    ft.Container(height=SPACING["sm"]),
                    ft.Text(
                        "Try adjusting your search or filters",
                        size=14,
                        color=COLORS["text_secondary"],
                    ),
                    ft.Container(height=SPACING["xl"]),
                    # Clear filters button
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(
                                    ft.Icons.FILTER_ALT_OFF_ROUNDED,
                                    size=16,
                                    color=COLORS["primary"],
                                ),
                                ft.Container(width=6),
                                ft.Text(
                                    "Clear Filters",
                                    size=13,
                                    weight=ft.FontWeight.W_500,
                                    color=COLORS["primary"],
                                ),
                            ],
                            alignment=ft.MainAxisAlignment.CENTER,
                        ),
                        padding=ft.padding.symmetric(horizontal=20, vertical=10),
                        border_radius=RADIUS["md"],
                        border=ft.border.all(1, COLORS["primary"]),
                        on_click=self._on_clear_filters,
                        on_hover=self._on_clear_filters_hover,
                        animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=SPACING["xxxl"],
            alignment=ft.alignment.center,
            expand=True,
        )

    def _on_clear_filters(self, e):
        """Handle clear filters button click."""
        self._search_query = ""
        self._status_filter = "all"
        self._version_filter = "all"
        self._sort_by = "name"
        self.content = self._build_content()
        self.update()

    def _on_clear_filters_hover(self, e):
        """Handle clear filters button hover."""
        if e.data == "true":
            e.control.bgcolor = COLORS["primary_glow"]
        else:
            e.control.bgcolor = "transparent"
        e.control.update()

    def _build_phone_frame(self, device_id: str, device: dict, serial: str, idx: int):
        """Build an enhanced phone frame with realistic styling."""
        status = device.get("status", "offline")
        status_color = COLORS["success"] if status == "connected" else COLORS["text_muted"]
        is_selected = serial in self.selected_devices
        screenshot_url = screen_service.get_cached_screenshot(serial)

        # Phone frame styling
        frame_border = ft.border.all(
            2 if is_selected else 1,
            COLORS["primary"] if is_selected else COLORS["border"]
        )

        # Header with status indicator and device ID
        header = ft.Container(
            content=ft.Row(
                [
                    # Status badge with cloud indicator
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Container(
                                    width=6,
                                    height=6,
                                    border_radius=3,
                                    bgcolor=status_color,
                                    shadow=ft.BoxShadow(
                                        spread_radius=0,
                                        blur_radius=4,
                                        color=f"{status_color}60",
                                        offset=ft.Offset(0, 0),
                                    ) if status == "connected" else None,
                                ),
                                ft.Container(width=4),
                                ft.Text(
                                    "Cloud",
                                    size=9,
                                    color=COLORS["primary"],
                                    weight=ft.FontWeight.W_600,
                                ),
                            ],
                            spacing=0,
                        ),
                        padding=ft.padding.symmetric(horizontal=8, vertical=3),
                        border_radius=RADIUS["sm"],
                        bgcolor=COLORS["primary_glow"],
                    ),
                    ft.Container(expand=True),
                    # Device ID with enhanced styling
                    ft.Text(
                        device_id[:3] if len(device_id) >= 3 else device_id,
                        size=14,
                        weight=ft.FontWeight.W_700,
                        color=COLORS["primary"],
                    ),
                ],
            ),
            padding=ft.padding.only(left=10, right=10, top=8, bottom=4),
        )

        # Device model name
        device_model = device.get("model", "Galaxy S7")
        device_info = ft.Container(
            content=ft.Text(
                device_model[:14] + "..." if len(device_model) > 14 else device_model,
                size=11,
                weight=ft.FontWeight.W_600,
                color=COLORS["primary"],
                text_align=ft.TextAlign.CENTER,
            ),
            padding=ft.padding.symmetric(horizontal=10),
            alignment=ft.alignment.center,
        )

        # Screenshot preview with phone frame aesthetic
        android_version = device.get("android_version", "?")
        preview = self._build_screenshot_preview(screenshot_url, android_version)

        # Task status with enhanced styling
        task_status = device.get("task_status", "")
        task_widget = ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        width=6,
                        height=6,
                        border_radius=3,
                        bgcolor=COLORS["success"] if task_status else COLORS["text_muted"],
                    ),
                    ft.Container(width=6),
                    ft.Text(
                        task_status or "Ready",
                        size=10,
                        color=COLORS["text_secondary"],
                        weight=ft.FontWeight.W_500,
                    ),
                ],
                alignment=ft.MainAxisAlignment.CENTER,
            ),
            padding=ft.padding.symmetric(horizontal=10, vertical=6),
            alignment=ft.alignment.center,
        )

        # Enhanced action bar with polished buttons
        action_bar = self._build_device_action_bar(serial)

        # Selection checkbox with better positioning
        checkbox = ft.Container(
            content=ft.Checkbox(
                value=is_selected,
                on_change=lambda e, did=device_id: self._on_device_select(did, e.control.value),
                active_color=COLORS["primary"],
                check_color=COLORS["text_inverse"],
            ),
            alignment=ft.alignment.top_left,
            padding=2,
        )

        # Main phone frame container
        return ft.Container(
            content=ft.Stack(
                [
                    ft.Column(
                        [
                            header,
                            device_info,
                            ft.Container(height=6),
                            preview,
                            task_widget,
                            action_bar,
                        ],
                        spacing=0,
                    ),
                    checkbox,
                ],
            ),
            width=165,
            height=290,
            border_radius=RADIUS["lg"],
            bgcolor=COLORS["bg_card"],
            border=frame_border,
            shadow=ft.BoxShadow(
                spread_radius=0,
                blur_radius=12 if is_selected else 6,
                color=f"{COLORS['primary']}25" if is_selected else "#00000010",
                offset=ft.Offset(0, 4 if is_selected else 2),
            ),
            on_click=lambda e, sid=serial: self._on_device_click(sid),
            on_hover=lambda e, sel=is_selected: self._on_card_hover(e, sel),
            animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_screenshot_preview(self, screenshot_url: str, android_version: str):
        """Build an enhanced screenshot preview with phone frame aesthetic."""
        if screenshot_url:
            content = ft.Image(
                src=screenshot_url,
                fit=ft.ImageFit.CONTAIN,
            )
        else:
            # Enhanced placeholder with phone outline
            content = ft.Column(
                [
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.PHONE_ANDROID_ROUNDED,
                            size=36,
                            color=COLORS["text_muted"],
                        ),
                        width=60,
                        height=60,
                        border_radius=RADIUS["md"],
                        bgcolor=COLORS["bg_hover"],
                        alignment=ft.alignment.center,
                    ),
                    ft.Container(height=8),
                    ft.Text(
                        f"Android {android_version}",
                        size=10,
                        color=COLORS["text_muted"],
                        weight=ft.FontWeight.W_500,
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                alignment=ft.MainAxisAlignment.CENTER,
                spacing=0,
            )

        return ft.Container(
            content=content,
            height=145,
            bgcolor=COLORS["bg_tertiary"],
            border_radius=RADIUS["md"],
            margin=ft.margin.symmetric(horizontal=10),
            alignment=ft.alignment.center,
            border=ft.border.all(1, COLORS["border_subtle"]),
        )

    def _build_device_action_bar(self, serial: str):
        """Build an enhanced action bar for device cards."""
        return ft.Container(
            content=ft.Row(
                [
                    self._build_action_icon(
                        ft.Icons.PLAY_ARROW_ROUNDED,
                        COLORS["success"],
                        "Run",
                        lambda e: self.toast.info(f"Running {serial}..."),
                    ),
                    self._build_action_icon(
                        ft.Icons.STOP_ROUNDED,
                        COLORS["error"],
                        "Stop",
                        lambda e: self.toast.info(f"Stopping {serial}..."),
                    ),
                    self._build_action_icon(
                        ft.Icons.REFRESH_ROUNDED,
                        COLORS["info"],
                        "Refresh",
                        lambda e: self.toast.info(f"Refreshing {serial}..."),
                    ),
                    self._build_action_icon(
                        ft.Icons.MORE_VERT_ROUNDED,
                        COLORS["text_muted"],
                        "More",
                        lambda e: self.toast.info("More options..."),
                    ),
                ],
                alignment=ft.MainAxisAlignment.SPACE_AROUND,
            ),
            padding=ft.padding.only(bottom=6, top=2),
        )

    def _build_action_icon(self, icon: str, color: str, tooltip: str, on_click):
        """Build an enhanced action icon button."""
        return ft.Container(
            content=ft.Icon(icon, size=18, color=color),
            width=32,
            height=32,
            border_radius=RADIUS["sm"],
            alignment=ft.alignment.center,
            on_click=on_click,
            on_hover=self._on_action_icon_hover,
            tooltip=tooltip,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_empty_state(self):
        """Build an enhanced empty state with setup guide and troubleshooting tips."""
        colors = get_colors()
        is_mobile = self._is_mobile()

        # Setup guide steps
        setup_steps = [
            {
                "number": "1",
                "title": "Enable USB Debugging",
                "description": "Go to Settings > Developer Options > Enable USB Debugging",
                "icon": ft.Icons.BUG_REPORT_ROUNDED,
            },
            {
                "number": "2",
                "title": "Connect Device",
                "description": "Connect via USB cable or WiFi ADB (adb tcpip 5555)",
                "icon": ft.Icons.USB_ROUNDED,
            },
            {
                "number": "3",
                "title": "Trust Computer",
                "description": "Accept the 'Allow USB debugging' prompt on your device",
                "icon": ft.Icons.VERIFIED_USER_ROUNDED,
            },
        ]

        # Troubleshooting tips
        troubleshooting_tips = [
            {"icon": ft.Icons.CABLE, "text": "Try a different USB cable or port"},
            {"icon": ft.Icons.REFRESH, "text": "Run 'adb kill-server && adb start-server'"},
            {"icon": ft.Icons.WIFI, "text": "For WiFi: adb connect <device-ip>:5555"},
        ]

        # Build setup step cards
        def build_step_card(step):
            return ft.Container(
                content=ft.Row(
                    [
                        # Step number badge
                        ft.Container(
                            content=ft.Text(
                                step["number"],
                                size=14,
                                weight=ft.FontWeight.W_700,
                                color=colors["primary"],
                            ),
                            width=32,
                            height=32,
                            border_radius=16,
                            bgcolor=colors["primary_glow"],
                            alignment=ft.alignment.center,
                        ),
                        ft.Container(width=SPACING["md"]),
                        # Step content
                        ft.Column(
                            [
                                ft.Row(
                                    [
                                        ft.Icon(step["icon"], size=16, color=colors["text_primary"]),
                                        ft.Container(width=6),
                                        ft.Text(
                                            step["title"],
                                            size=14,
                                            weight=ft.FontWeight.W_600,
                                            color=colors["text_primary"],
                                        ),
                                    ],
                                    spacing=0,
                                ),
                                ft.Text(
                                    step["description"],
                                    size=12,
                                    color=colors["text_secondary"],
                                ),
                            ],
                            spacing=2,
                            expand=True,
                        ),
                    ],
                    vertical_alignment=ft.CrossAxisAlignment.CENTER,
                ),
                padding=ft.padding.symmetric(horizontal=SPACING["md"], vertical=SPACING["sm"]),
                border_radius=RADIUS["md"],
                bgcolor=colors["bg_secondary"],
                border=ft.border.all(1, colors["border"]),
                animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            )

        # Build troubleshooting tip items
        def build_tip_item(tip):
            return ft.Row(
                [
                    ft.Icon(tip["icon"], size=14, color=colors["text_muted"]),
                    ft.Container(width=8),
                    ft.Text(
                        tip["text"],
                        size=12,
                        color=colors["text_muted"],
                    ),
                ],
                spacing=0,
            )

        # Main content
        return ft.Container(
            content=ft.Column(
                [
                    # Header with icon
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.PHONE_ANDROID_ROUNDED,
                            size=48,
                            color=colors["text_muted"],
                        ),
                        width=88,
                        height=88,
                        border_radius=44,
                        bgcolor=colors["bg_tertiary"],
                        alignment=ft.alignment.center,
                        border=ft.border.all(1, colors["border"]),
                        shadow=ft.BoxShadow(
                            spread_radius=0,
                            blur_radius=20,
                            color=f"{colors['text_muted']}12",
                            offset=ft.Offset(0, 6),
                        ),
                    ),
                    ft.Container(height=SPACING["lg"]),
                    ft.Text(
                        "No Devices Connected",
                        size=22,
                        weight=ft.FontWeight.W_700,
                        color=colors["text_primary"],
                    ),
                    ft.Container(height=SPACING["xs"]),
                    ft.Text(
                        "Follow the steps below to connect your Android device",
                        size=14,
                        color=colors["text_secondary"],
                    ),
                    ft.Container(height=SPACING["xl"]),
                    # Setup guide section
                    ft.Container(
                        content=ft.Column(
                            [
                                ft.Row(
                                    [
                                        ft.Icon(ft.Icons.CHECKLIST_ROUNDED, size=16, color=colors["primary"]),
                                        ft.Container(width=6),
                                        ft.Text(
                                            "Setup Guide",
                                            size=13,
                                            weight=ft.FontWeight.W_600,
                                            color=colors["text_primary"],
                                        ),
                                    ],
                                    spacing=0,
                                ),
                                ft.Container(height=SPACING["sm"]),
                                ft.Column(
                                    [build_step_card(step) for step in setup_steps],
                                    spacing=SPACING["sm"],
                                ),
                            ],
                            spacing=0,
                        ),
                        width=400 if not is_mobile else None,
                        padding=ft.padding.all(SPACING["md"]),
                        border_radius=RADIUS["lg"],
                        bgcolor=colors["bg_card"],
                        border=ft.border.all(1, colors["border"]),
                    ),
                    ft.Container(height=SPACING["lg"]),
                    # Troubleshooting section
                    ft.Container(
                        content=ft.Column(
                            [
                                ft.Row(
                                    [
                                        ft.Icon(ft.Icons.LIGHTBULB_OUTLINE, size=14, color=colors["warning"]),
                                        ft.Container(width=6),
                                        ft.Text(
                                            "Troubleshooting Tips",
                                            size=12,
                                            weight=ft.FontWeight.W_600,
                                            color=colors["text_secondary"],
                                        ),
                                    ],
                                    spacing=0,
                                ),
                                ft.Container(height=SPACING["xs"]),
                                ft.Column(
                                    [build_tip_item(tip) for tip in troubleshooting_tips],
                                    spacing=4,
                                ),
                            ],
                            spacing=0,
                        ),
                        width=400 if not is_mobile else None,
                        padding=ft.padding.all(SPACING["md"]),
                        border_radius=RADIUS["md"],
                        bgcolor=f"{colors['warning']}08",
                        border=ft.border.all(1, f"{colors['warning']}20"),
                    ),
                    ft.Container(height=SPACING["xl"]),
                    # Scan button
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(
                                    ft.Icons.RADAR_ROUNDED,
                                    size=18,
                                    color=COLORS["text_inverse"],
                                ),
                                ft.Container(width=8),
                                ft.Text(
                                    "Scan for Devices",
                                    size=14,
                                    weight=ft.FontWeight.W_600,
                                    color=COLORS["text_inverse"],
                                ),
                            ],
                            alignment=ft.MainAxisAlignment.CENTER,
                        ),
                        padding=ft.padding.symmetric(horizontal=32, vertical=14),
                        border_radius=RADIUS["md"],
                        bgcolor=COLORS["primary"],
                        on_click=self._on_refresh,
                        on_hover=self._on_primary_hover,
                        shadow=ft.BoxShadow(
                            spread_radius=0,
                            blur_radius=16,
                            color=COLORS.get("primary_glow", f"{COLORS['primary']}25"),
                            offset=ft.Offset(0, 4),
                        ),
                        animate=ft.Animation(ANIMATION["normal"], ft.AnimationCurve.EASE_OUT),
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                scroll=ft.ScrollMode.AUTO,
            ),
            padding=SPACING["xl"] if is_mobile else SPACING["xxl"],
            alignment=ft.alignment.center,
            expand=True,
        )

    def _build_loading(self):
        """Build enhanced loading state with polished animation."""
        return ft.Container(
            content=ft.Column(
                [
                    # Loading spinner with glow effect
                    ft.Container(
                        content=ft.ProgressRing(
                            width=48,
                            height=48,
                            stroke_width=4,
                            color=COLORS["primary"],
                        ),
                        width=80,
                        height=80,
                        border_radius=RADIUS["xl"],
                        bgcolor=COLORS["bg_tertiary"],
                        alignment=ft.alignment.center,
                        shadow=ft.BoxShadow(
                            spread_radius=0,
                            blur_radius=20,
                            color=COLORS["primary_glow"],
                            offset=ft.Offset(0, 0),
                        ),
                    ),
                    ft.Container(height=SPACING["xl"]),
                    ft.Text(
                        "Scanning devices...",
                        size=16,
                        weight=ft.FontWeight.W_500,
                        color=COLORS["text_primary"],
                    ),
                    ft.Container(height=SPACING["sm"]),
                    ft.Text(
                        "This may take a moment",
                        size=13,
                        color=COLORS["text_muted"],
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=SPACING["xxxl"],
            alignment=ft.alignment.center,
            expand=True,
        )

    # Event handlers
    def _on_button_hover(self, e):
        """Handle button hover with smooth transition."""
        if e.data == "true":
            e.control.bgcolor = COLORS["bg_hover"]
            e.control.border = ft.border.all(1, COLORS["border_hover"])
        else:
            e.control.bgcolor = "transparent"
            e.control.border = ft.border.all(1, COLORS["border"])
        e.control.update()

    def _on_primary_hover(self, e):
        """Handle primary button hover."""
        if e.data == "true":
            e.control.bgcolor = COLORS["primary_dark"]
        else:
            e.control.bgcolor = COLORS["primary"]
        e.control.update()

    def _on_action_icon_hover(self, e):
        """Handle action icon hover."""
        if e.data == "true":
            e.control.bgcolor = COLORS["bg_hover"]
        else:
            e.control.bgcolor = "transparent"
        e.control.update()

    def _on_card_hover(self, e, is_selected: bool):
        """Handle device card hover with enhanced effect."""
        if e.data == "true":
            e.control.border = ft.border.all(
                2 if is_selected else 1,
                COLORS["primary"]
            )
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=16,
                color=f"{COLORS['primary']}30",
                offset=ft.Offset(0, 6),
            )
        else:
            e.control.border = ft.border.all(
                2 if is_selected else 1,
                COLORS["primary"] if is_selected else COLORS["border"]
            )
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=12 if is_selected else 6,
                color=f"{COLORS['primary']}25" if is_selected else "#00000010",
                offset=ft.Offset(0, 4 if is_selected else 2),
            )
        e.control.update()

    def _on_device_click(self, serial: str):
        """Handle device card/row click - open device detail modal."""
        # Find the device by serial
        device = None
        for d in self.devices:
            if d.get("adb_serial") == serial:
                device = d
                break

        if not device:
            self.toast.error(f"Device not found: {serial}")
            return

        # Define modal action callbacks
        def on_close():
            if self.page:
                self.page.close(self._current_modal)
                self._current_modal = None

        def on_screenshot(e):
            self.toast.info(f"Taking screenshot of {device.get('model', 'device')}...")
            on_close()

        def on_restart(e):
            self.toast.info(f"Restarting {device.get('model', 'device')}...")
            on_close()

        def on_disconnect(e):
            self.toast.info(f"Disconnecting {device.get('model', 'device')}...")
            on_close()

        def on_run_agent(e):
            self.toast.info(f"Running agent on {device.get('model', 'device')}...")
            on_close()

        # Show the device detail modal
        if self.page:
            self._current_modal = show_device_detail_modal(
                page=self.page,
                device=device,
                on_close=on_close,
                on_screenshot=on_screenshot,
                on_restart=on_restart,
                on_disconnect=on_disconnect,
                on_run_agent=on_run_agent,
            )

    def _on_device_select(self, device_id: str, selected: bool):
        """Handle device selection."""
        try:
            idx = int(device_id) - 400
            if 0 <= idx < len(self.devices):
                serial = self.devices[idx].get("adb_serial", device_id)
                if selected:
                    self.selected_devices.add(serial)
                else:
                    self.selected_devices.discard(serial)
                self.content = self._build_content()
                self.update()
        except:
            pass

    def _on_select_all(self, e):
        """Handle select all checkbox."""
        if e.control.value:
            self.selected_devices = {d.get("adb_serial", "") for d in self.devices}
        else:
            self.selected_devices = set()
        self.content = self._build_content()
        self.update()

    async def _on_automate(self, e):
        """Handle automate action."""
        if not self.selected_devices:
            self.toast.warning("Select devices to automate")
            return
        self.toast.info(f"Automating {len(self.selected_devices)} devices...")

    async def _on_proxy_data(self, e):
        """Handle proxy data action."""
        self.toast.info("Proxy data coming soon...")

    async def _on_change_device(self, e):
        """Handle change device action."""
        self.toast.info("Change device coming soon...")

    async def _on_functions(self, e):
        """Handle functions action."""
        self.toast.info("Functions coming soon...")

    async def _on_copy(self, e):
        """Handle copy action."""
        self.toast.info("Copy coming soon...")

    async def _on_refresh(self, e):
        """Handle refresh button click."""
        self.loading = True
        self.content = self._build_content()
        self.update()
        await self.load_devices()

    async def load_devices(self):
        """Load devices."""
        self.loading = True

        # Check scrcpy
        self.scrcpy_available = screen_service.check_scrcpy_installed()
        if self.scrcpy_available:
            self.scrcpy_version = screen_service.get_scrcpy_version()

        try:
            try:
                self.devices = await backend.discover_devices()
            except Exception:
                self.devices = await backend.get_devices()

            if self.devices:
                self.toast.success(f"Found {len(self.devices)} device(s)")
            else:
                self.toast.info("No devices found")
        except Exception as ex:
            self.toast.error(f"Failed to load devices: {ex}")
            self.devices = []
        finally:
            self.loading = False
            self.content = self._build_content()
            self.update()

    def refresh(self):
        """Refresh the view."""
        self.content = self._build_content()
        self.update()

    # ===== Bulk Operation Progress Methods =====

    def _build_progress_overlay(self):
        """Build the progress overlay for bulk operations.

        Returns:
            Container with semi-transparent overlay and progress indicator
        """
        colors = get_colors()

        # Progress text
        progress_text = f"{self._bulk_operation_completed}/{self._bulk_operation_total}"

        return ft.Container(
            content=ft.Column(
                [
                    ft.Container(
                        content=ft.Column(
                            [
                                ft.Text(
                                    self._bulk_operation_name,
                                    size=16,
                                    weight=ft.FontWeight.W_600,
                                    color=colors["text_primary"],
                                ),
                                ft.Container(height=SPACING["md"]),
                                ft.ProgressBar(
                                    value=self._bulk_operation_progress,
                                    width=300,
                                    height=8,
                                    border_radius=4,
                                    bgcolor=colors["bg_tertiary"],
                                    color=colors["primary"],
                                ),
                                ft.Container(height=SPACING["sm"]),
                                ft.Text(
                                    progress_text,
                                    size=12,
                                    color=colors["text_secondary"],
                                ),
                            ],
                            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                        ),
                        padding=ft.padding.all(SPACING["xl"]),
                        border_radius=RADIUS["lg"],
                        bgcolor=colors["bg_card"],
                        shadow=get_shadow("lg"),
                    ),
                ],
                alignment=ft.MainAxisAlignment.CENTER,
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                expand=True,
            ),
            expand=True,
            bgcolor=f"{colors['bg_primary']}CC",  # Semi-transparent
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

    async def _run_bulk_operation(self, operation_name: str, device_ids: List[str], operation_func):
        """Run a bulk operation on multiple devices with progress tracking.

        Args:
            operation_name: Display name for the operation (e.g., "Taking Screenshots")
            device_ids: List of device IDs to operate on
            operation_func: Async function to call for each device, takes device_id as argument
        """
        if not device_ids:
            self.toast.warning("No devices selected")
            return

        # Start progress tracking
        self._bulk_operation_active = True
        self._bulk_operation_name = operation_name
        self._bulk_operation_total = len(device_ids)
        self._bulk_operation_completed = 0
        self._bulk_operation_progress = 0.0

        self.content = self._build_content()
        self.update()

        success_count = 0
        error_count = 0

        for device_id in device_ids:
            try:
                await operation_func(device_id)
                success_count += 1
            except Exception as ex:
                error_count += 1
                # Log error but continue with other devices

            # Update progress
            self._bulk_operation_completed += 1
            self._bulk_operation_progress = self._bulk_operation_completed / self._bulk_operation_total
            self.content = self._build_content()
            self.update()

            # Small delay for visual feedback
            await asyncio.sleep(0.1)

        # Complete
        self._bulk_operation_active = False
        self.content = self._build_content()
        self.update()

        # Show completion toast
        if error_count == 0:
            self.toast.success(f"{operation_name} completed for {success_count} device(s)")
        else:
            self.toast.warning(f"{operation_name}: {success_count} succeeded, {error_count} failed")

    def _on_bulk_screenshot_all(self):
        """Handle bulk screenshot action."""
        device_ids = list(self.selected_devices) if self.selected_devices else [d.get("adb_serial") for d in self.devices]

        async def take_screenshot(device_id):
            # Placeholder for actual screenshot logic
            await asyncio.sleep(0.5)  # Simulate operation

        if self.page:
            self.page.run_task(
                lambda: self._run_bulk_operation("Taking Screenshots", device_ids, take_screenshot)
            )

    def _on_bulk_restart_selected(self):
        """Handle bulk restart action for selected devices."""
        if not self.selected_devices:
            self.toast.warning("No devices selected")
            return

        device_ids = list(self.selected_devices)

        async def restart_device(device_id):
            # Placeholder for actual restart logic
            await asyncio.sleep(0.5)  # Simulate operation

        if self.page:
            self.page.run_task(
                lambda: self._run_bulk_operation("Restarting Devices", device_ids, restart_device)
            )

    def _on_bulk_clear_data(self):
        """Handle bulk clear app data action."""
        if not self.selected_devices:
            self.toast.warning("No devices selected")
            return

        device_ids = list(self.selected_devices)

        async def clear_data(device_id):
            # Placeholder for actual clear data logic
            await asyncio.sleep(0.3)  # Simulate operation

        if self.page:
            self.page.run_task(
                lambda: self._run_bulk_operation("Clearing App Data", device_ids, clear_data)
            )

    def _on_bulk_disconnect_all(self):
        """Handle bulk disconnect action."""
        device_ids = list(self.selected_devices) if self.selected_devices else [d.get("adb_serial") for d in self.devices]

        async def disconnect_device(device_id):
            # Placeholder for actual disconnect logic
            await asyncio.sleep(0.2)  # Simulate operation

        if self.page:
            self.page.run_task(
                lambda: self._run_bulk_operation("Disconnecting Devices", device_ids, disconnect_device)
            )
