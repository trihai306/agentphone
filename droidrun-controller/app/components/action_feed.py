"""Real-time Action Feed component for recording UI.

Displays a scrolling list of captured actions during recording sessions.
Shows action type icons, element names, timestamps, and auto-scrolls to
show the latest actions.
"""

import flet as ft
from typing import Optional, List, Dict, Any, Callable
from datetime import datetime
from ..theme import get_colors, RADIUS, get_shadow, SPACING, ANIMATION


class ActionItem(ft.Container):
    """Individual action item in the feed."""

    def __init__(
        self,
        action_type: str,
        element_name: str,
        timestamp: int,
        index: int,
        coordinates: Optional[tuple] = None,
        input_text: Optional[str] = None,
        on_click: Optional[Callable] = None,
    ):
        self.action_type = action_type
        self.element_name = element_name
        self.timestamp = timestamp
        self.index = index
        self.coordinates = coordinates
        self.input_text = input_text
        self.on_item_click = on_click

        colors = get_colors()
        super().__init__(
            content=self._build_content(),
            padding=ft.padding.symmetric(horizontal=14, vertical=10),
            border_radius=RADIUS["md"],
            bgcolor=colors["bg_card"],
            border=ft.border.all(1, colors["border_subtle"]),
            on_click=self._handle_click,
            on_hover=self._on_hover,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )

    def _build_content(self):
        """Build the action item content."""
        colors = get_colors()

        # Get icon and color for action type
        icon, icon_color = self._get_action_icon_and_color()

        # Format timestamp
        time_str = self._format_timestamp()

        # Build description based on action type
        description = self._get_action_description()

        return ft.Row(
            [
                # Action type icon
                ft.Container(
                    content=ft.Icon(
                        icon,
                        size=18,
                        color=icon_color,
                    ),
                    width=36,
                    height=36,
                    border_radius=RADIUS["sm"],
                    bgcolor=f"{icon_color}15",
                    alignment=ft.alignment.center,
                ),
                ft.Container(width=SPACING["md"]),
                # Action details
                ft.Column(
                    [
                        ft.Row(
                            [
                                ft.Text(
                                    f"#{self.index + 1}",
                                    size=10,
                                    weight=ft.FontWeight.W_600,
                                    color=colors["text_muted"],
                                ),
                                ft.Container(width=6),
                                ft.Container(
                                    content=ft.Text(
                                        self._get_action_label(),
                                        size=10,
                                        weight=ft.FontWeight.W_600,
                                        color=icon_color,
                                    ),
                                    padding=ft.padding.symmetric(horizontal=6, vertical=2),
                                    border_radius=4,
                                    bgcolor=f"{icon_color}12",
                                ),
                            ],
                        ),
                        ft.Container(height=2),
                        ft.Text(
                            description,
                            size=13,
                            weight=ft.FontWeight.W_500,
                            color=colors["text_primary"],
                            max_lines=1,
                            overflow=ft.TextOverflow.ELLIPSIS,
                        ),
                    ],
                    spacing=0,
                    expand=True,
                ),
                # Timestamp
                ft.Container(
                    content=ft.Text(
                        time_str,
                        size=10,
                        color=colors["text_muted"],
                        font_family="monospace",
                    ),
                    padding=ft.padding.symmetric(horizontal=8, vertical=4),
                    border_radius=RADIUS["xs"],
                    bgcolor=colors["bg_tertiary"],
                ),
            ],
            vertical_alignment=ft.CrossAxisAlignment.CENTER,
        )

    def _get_action_icon_and_color(self) -> tuple:
        """Get icon and color based on action type."""
        colors = get_colors()

        action_styles = {
            "tap": (ft.Icons.TOUCH_APP, colors["accent_blue"]),
            "long_press": (ft.Icons.TOUCH_APP, colors["accent_purple"]),
            "swipe": (ft.Icons.SWIPE, colors["accent_cyan"]),
            "scroll": (ft.Icons.UNFOLD_MORE, colors["accent_teal"]),
            "input": (ft.Icons.KEYBOARD, colors["accent_orange"]),
            "text_changed": (ft.Icons.EDIT, colors["accent_amber"]),
        }

        return action_styles.get(
            self.action_type,
            (ft.Icons.RADIO_BUTTON_CHECKED, colors["text_muted"])
        )

    def _get_action_label(self) -> str:
        """Get a short label for the action type."""
        labels = {
            "tap": "TAP",
            "long_press": "LONG PRESS",
            "swipe": "SWIPE",
            "scroll": "SCROLL",
            "input": "INPUT",
            "text_changed": "TEXT",
        }
        return labels.get(self.action_type, self.action_type.upper())

    def _get_action_description(self) -> str:
        """Get a description of the action."""
        if self.action_type == "input" and self.input_text:
            # Truncate long input text
            display_text = self.input_text if len(self.input_text) <= 25 else self.input_text[:22] + "..."
            if self.element_name:
                return f"'{display_text}' in {self.element_name}"
            return f"'{display_text}'"

        if self.element_name:
            return self.element_name

        if self.coordinates:
            return f"at ({self.coordinates[0]}, {self.coordinates[1]})"

        return self._get_action_label()

    def _format_timestamp(self) -> str:
        """Format the timestamp for display."""
        if self.timestamp <= 0:
            return "--:--"

        # Convert milliseconds to datetime
        try:
            dt = datetime.fromtimestamp(self.timestamp / 1000)
            return dt.strftime("%H:%M:%S")
        except (ValueError, OSError):
            return "--:--"

    def _handle_click(self, e):
        """Handle item click."""
        if self.on_item_click:
            self.on_item_click(self.index)

    def _on_hover(self, e):
        """Handle hover effect."""
        colors = get_colors()
        if e.data == "true":
            self.bgcolor = colors["bg_hover"]
            self.border = ft.border.all(1, colors["border_light"])
        else:
            self.bgcolor = colors["bg_card"]
            self.border = ft.border.all(1, colors["border_subtle"])
        self.update()


class ActionFeed(ft.Container):
    """Real-time feed of recorded actions during recording sessions."""

    def __init__(
        self,
        on_action_click: Optional[Callable] = None,
        max_visible_items: int = 100,
        **kwargs
    ):
        self.on_action_click = on_action_click
        self.max_visible_items = max_visible_items
        self._actions: List[Dict[str, Any]] = []

        # ListView reference for auto-scroll
        self._list_view: Optional[ft.ListView] = None

        colors = get_colors()
        super().__init__(
            content=self._build_content(),
            bgcolor=colors["bg_secondary"],
            border_radius=RADIUS["lg"],
            border=ft.border.all(1, colors["border"]),
            expand=True,
            **kwargs
        )

    def _build_content(self):
        """Build the action feed content."""
        colors = get_colors()

        if not self._actions:
            return self._build_empty_state()

        # Create action items
        action_items = []
        for i, action in enumerate(self._actions[-self.max_visible_items:]):
            # Calculate actual index if we're limiting visible items
            actual_index = len(self._actions) - min(len(self._actions), self.max_visible_items) + i
            item = self._create_action_item(action, actual_index)
            action_items.append(item)

        # Create ListView with auto-scroll enabled
        self._list_view = ft.ListView(
            controls=action_items,
            spacing=SPACING["xs"],
            padding=ft.padding.symmetric(horizontal=SPACING["sm"], vertical=SPACING["sm"]),
            auto_scroll=True,  # Auto-scroll to show latest items
            expand=True,
        )

        return ft.Column(
            [
                # Header
                ft.Container(
                    content=ft.Row(
                        [
                            ft.Row(
                                [
                                    ft.Icon(
                                        ft.Icons.LIST_ALT,
                                        size=16,
                                        color=colors["text_secondary"],
                                    ),
                                    ft.Container(width=8),
                                    ft.Text(
                                        "Action Feed",
                                        size=13,
                                        weight=ft.FontWeight.W_600,
                                        color=colors["text_secondary"],
                                    ),
                                ],
                            ),
                            ft.Container(
                                content=ft.Text(
                                    f"{len(self._actions)} actions",
                                    size=11,
                                    color=colors["text_muted"],
                                ),
                                padding=ft.padding.symmetric(horizontal=8, vertical=3),
                                border_radius=RADIUS["sm"],
                                bgcolor=colors["bg_tertiary"],
                            ),
                        ],
                        alignment=ft.MainAxisAlignment.SPACE_BETWEEN,
                    ),
                    padding=ft.padding.symmetric(horizontal=14, vertical=10),
                    border=ft.border.only(bottom=ft.BorderSide(1, colors["border_subtle"])),
                ),
                # Action list
                self._list_view,
            ],
            spacing=0,
            expand=True,
        )

    def _build_empty_state(self):
        """Build the empty state UI."""
        colors = get_colors()

        return ft.Column(
            [
                # Header
                ft.Container(
                    content=ft.Row(
                        [
                            ft.Row(
                                [
                                    ft.Icon(
                                        ft.Icons.LIST_ALT,
                                        size=16,
                                        color=colors["text_secondary"],
                                    ),
                                    ft.Container(width=8),
                                    ft.Text(
                                        "Action Feed",
                                        size=13,
                                        weight=ft.FontWeight.W_600,
                                        color=colors["text_secondary"],
                                    ),
                                ],
                            ),
                            ft.Container(
                                content=ft.Text(
                                    "0 actions",
                                    size=11,
                                    color=colors["text_muted"],
                                ),
                                padding=ft.padding.symmetric(horizontal=8, vertical=3),
                                border_radius=RADIUS["sm"],
                                bgcolor=colors["bg_tertiary"],
                            ),
                        ],
                        alignment=ft.MainAxisAlignment.SPACE_BETWEEN,
                    ),
                    padding=ft.padding.symmetric(horizontal=14, vertical=10),
                    border=ft.border.only(bottom=ft.BorderSide(1, colors["border_subtle"])),
                ),
                # Empty state content
                ft.Container(
                    content=ft.Column(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.TOUCH_APP_OUTLINED,
                                    size=48,
                                    color=colors["text_muted"],
                                ),
                                width=80,
                                height=80,
                                border_radius=RADIUS["xl"],
                                bgcolor=colors["bg_tertiary"],
                                alignment=ft.alignment.center,
                            ),
                            ft.Container(height=SPACING["lg"]),
                            ft.Text(
                                "No actions recorded yet",
                                size=14,
                                weight=ft.FontWeight.W_500,
                                color=colors["text_secondary"],
                            ),
                            ft.Container(height=SPACING["xs"]),
                            ft.Text(
                                "Interact with the device to start capturing actions",
                                size=12,
                                color=colors["text_muted"],
                                text_align=ft.TextAlign.CENTER,
                            ),
                        ],
                        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                    ),
                    expand=True,
                    alignment=ft.alignment.center,
                ),
            ],
            spacing=0,
            expand=True,
        )

    def _create_action_item(self, action: Dict[str, Any], index: int) -> ActionItem:
        """Create an ActionItem from action data."""
        # Extract element name using priority: text > content_desc > resource_id > class_name
        element_name = self._get_element_display_name(action)

        # Get coordinates if available
        coordinates = None
        x = action.get("x")
        y = action.get("y")
        if x is not None and y is not None:
            coordinates = (x, y)

        return ActionItem(
            action_type=action.get("type", "unknown"),
            element_name=element_name,
            timestamp=action.get("timestamp", 0),
            index=index,
            coordinates=coordinates,
            input_text=action.get("input_text") or action.get("inputText"),
            on_click=self._handle_action_click,
        )

    def _get_element_display_name(self, action: Dict[str, Any]) -> str:
        """Get a human-readable display name for the element.

        Priority: text > content_desc > resource_id > class_name
        """
        # Try text first
        text = action.get("text") or action.get("element_text")
        if text and str(text).strip():
            display_text = str(text).strip()
            if len(display_text) > 30:
                display_text = display_text[:27] + "..."
            return f"'{display_text}'"

        # Try content description
        content_desc = action.get("content_desc") or action.get("contentDescription")
        if content_desc and str(content_desc).strip():
            return f"'{str(content_desc).strip()[:30]}'"

        # Try resource ID
        resource_id = action.get("resource_id") or action.get("resourceId")
        if resource_id:
            # Extract just the ID part after the last /
            if "/" in resource_id:
                resource_id = resource_id.split("/")[-1]
            # Convert snake_case to readable format
            readable = resource_id.replace("_", " ").replace("-", " ")
            if len(readable) > 25:
                readable = readable[:22] + "..."
            return readable.title()

        # Try class name
        class_name = action.get("class_name") or action.get("className")
        if class_name:
            simple_class = class_name.split(".")[-1] if "." in class_name else class_name
            # Map common Android UI element types
            class_display = {
                "Button": "button",
                "TextView": "text",
                "EditText": "text field",
                "ImageView": "image",
                "ImageButton": "image button",
                "CheckBox": "checkbox",
                "RadioButton": "radio button",
                "Switch": "switch",
                "SeekBar": "slider",
                "Spinner": "dropdown",
            }
            return class_display.get(simple_class, simple_class.lower())

        return ""

    def _handle_action_click(self, index: int):
        """Handle action item click."""
        if self.on_action_click:
            self.on_action_click(index)

    # Public methods for updating the feed
    def add_action(self, action: Dict[str, Any]):
        """Add a new action to the feed.

        Args:
            action: Dictionary containing action data with keys:
                - type: Action type (tap, swipe, input, etc.)
                - timestamp: Unix timestamp in milliseconds
                - x, y: Coordinates
                - resource_id, content_desc, text, class_name: Element info
                - input_text: Text for input actions
        """
        self._actions.append(action)
        self._rebuild_content()

    def add_actions(self, actions: List[Dict[str, Any]]):
        """Add multiple actions to the feed.

        Args:
            actions: List of action dictionaries
        """
        if not actions:
            return
        self._actions.extend(actions)
        self._rebuild_content()

    def set_actions(self, actions: List[Dict[str, Any]]):
        """Replace all actions in the feed.

        Args:
            actions: List of action dictionaries
        """
        self._actions = list(actions) if actions else []
        self._rebuild_content()

    def clear_actions(self):
        """Clear all actions from the feed."""
        self._actions = []
        self._rebuild_content()

    def get_action_count(self) -> int:
        """Get the current action count."""
        return len(self._actions)

    def get_actions(self) -> List[Dict[str, Any]]:
        """Get all recorded actions."""
        return list(self._actions)

    def _rebuild_content(self):
        """Rebuild the feed content and update the display."""
        self.content = self._build_content()
        self.update()


class CompactActionFeed(ft.Container):
    """Compact version of the action feed for smaller spaces."""

    def __init__(
        self,
        max_visible_items: int = 5,
        **kwargs
    ):
        self.max_visible_items = max_visible_items
        self._actions: List[Dict[str, Any]] = []

        colors = get_colors()
        super().__init__(
            content=self._build_content(),
            bgcolor=colors["bg_tertiary"],
            border_radius=RADIUS["md"],
            padding=SPACING["sm"],
            **kwargs
        )

    def _build_content(self):
        """Build the compact feed content."""
        colors = get_colors()

        if not self._actions:
            return ft.Container(
                content=ft.Text(
                    "No actions yet",
                    size=11,
                    color=colors["text_muted"],
                    italic=True,
                ),
                alignment=ft.alignment.center,
                height=40,
            )

        # Show only the most recent items
        recent_actions = self._actions[-self.max_visible_items:]

        items = []
        for i, action in enumerate(recent_actions):
            actual_index = len(self._actions) - len(recent_actions) + i
            item = self._create_compact_item(action, actual_index)
            items.append(item)

        return ft.Column(
            controls=items,
            spacing=4,
        )

    def _create_compact_item(self, action: Dict[str, Any], index: int) -> ft.Container:
        """Create a compact action item."""
        colors = get_colors()

        # Get action icon and color
        icon, icon_color = self._get_action_icon_and_color(action.get("type", ""))

        # Get element name
        element_name = self._get_element_display_name(action)
        if not element_name:
            element_name = action.get("type", "action").capitalize()

        return ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        content=ft.Icon(icon, size=12, color=icon_color),
                        width=20,
                        height=20,
                        border_radius=4,
                        bgcolor=f"{icon_color}15",
                        alignment=ft.alignment.center,
                    ),
                    ft.Container(width=6),
                    ft.Text(
                        f"#{index + 1}",
                        size=9,
                        color=colors["text_muted"],
                    ),
                    ft.Container(width=4),
                    ft.Text(
                        element_name,
                        size=11,
                        color=colors["text_secondary"],
                        max_lines=1,
                        overflow=ft.TextOverflow.ELLIPSIS,
                        expand=True,
                    ),
                ],
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.symmetric(horizontal=6, vertical=4),
            border_radius=4,
            bgcolor=colors["bg_card"],
        )

    def _get_action_icon_and_color(self, action_type: str) -> tuple:
        """Get icon and color for action type."""
        colors = get_colors()

        action_styles = {
            "tap": (ft.Icons.TOUCH_APP, colors["accent_blue"]),
            "long_press": (ft.Icons.TOUCH_APP, colors["accent_purple"]),
            "swipe": (ft.Icons.SWIPE, colors["accent_cyan"]),
            "scroll": (ft.Icons.UNFOLD_MORE, colors["accent_teal"]),
            "input": (ft.Icons.KEYBOARD, colors["accent_orange"]),
            "text_changed": (ft.Icons.EDIT, colors["accent_amber"]),
        }

        return action_styles.get(
            action_type,
            (ft.Icons.RADIO_BUTTON_CHECKED, colors["text_muted"])
        )

    def _get_element_display_name(self, action: Dict[str, Any]) -> str:
        """Get element display name (same logic as ActionFeed)."""
        text = action.get("text") or action.get("element_text")
        if text and str(text).strip():
            display = str(text).strip()
            return f"'{display[:20]}'" if len(display) > 20 else f"'{display}'"

        content_desc = action.get("content_desc") or action.get("contentDescription")
        if content_desc:
            return str(content_desc)[:20]

        resource_id = action.get("resource_id") or action.get("resourceId")
        if resource_id:
            if "/" in resource_id:
                resource_id = resource_id.split("/")[-1]
            return resource_id[:20]

        return ""

    def add_action(self, action: Dict[str, Any]):
        """Add a new action."""
        self._actions.append(action)
        self.content = self._build_content()
        self.update()

    def add_actions(self, actions: List[Dict[str, Any]]):
        """Add multiple actions."""
        if actions:
            self._actions.extend(actions)
            self.content = self._build_content()
            self.update()

    def set_actions(self, actions: List[Dict[str, Any]]):
        """Replace all actions."""
        self._actions = list(actions) if actions else []
        self.content = self._build_content()
        self.update()

    def clear_actions(self):
        """Clear all actions."""
        self._actions = []
        self.content = self._build_content()
        self.update()

    def get_action_count(self) -> int:
        """Get action count."""
        return len(self._actions)
