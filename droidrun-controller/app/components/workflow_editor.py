"""Workflow Editor component for post-recording workflow modification.

Provides an editable step list where users can modify step names, selector
strategies, timing delays, and reorder or delete steps after recording.
"""

import flet as ft
from typing import Optional, List, Dict, Any, Callable
from ..theme import get_colors, RADIUS, get_shadow, SPACING, ANIMATION


class StepEditor(ft.Container):
    """Individual step editor row in the workflow editor."""

    def __init__(
        self,
        step: Dict[str, Any],
        index: int,
        on_update: Optional[Callable] = None,
        on_delete: Optional[Callable] = None,
        on_move_up: Optional[Callable] = None,
        on_move_down: Optional[Callable] = None,
        is_first: bool = False,
        is_last: bool = False,
    ):
        self.step = step
        self.index = index
        self.on_step_update = on_update
        self.on_step_delete = on_delete
        self.on_step_move_up = on_move_up
        self.on_step_move_down = on_move_down
        self.is_first = is_first
        self.is_last = is_last

        # Editable fields
        self._name_field: Optional[ft.TextField] = None
        self._delay_field: Optional[ft.TextField] = None
        self._selector_dropdown: Optional[ft.Dropdown] = None

        colors = get_colors()
        super().__init__(
            content=self._build_content(),
            padding=ft.padding.symmetric(horizontal=16, vertical=12),
            border_radius=RADIUS["md"],
            bgcolor=colors["bg_card"],
            border=ft.border.all(1, colors["border_subtle"]),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            on_hover=self._on_hover,
        )

    def _build_content(self):
        """Build the step editor content."""
        colors = get_colors()

        # Get action type icon and color
        action_type = self.step.get("action_type", "tap")
        icon, icon_color = self._get_action_icon_and_color(action_type)

        # Step name field
        self._name_field = ft.TextField(
            value=self.step.get("name", f"Step {self.index + 1}"),
            border_color=colors["border_subtle"],
            focused_border_color=colors["primary"],
            bgcolor=colors["bg_input"],
            cursor_color=colors["primary"],
            text_size=13,
            content_padding=ft.padding.symmetric(horizontal=12, vertical=10),
            border_radius=RADIUS["sm"],
            on_change=self._on_name_change,
            expand=True,
        )

        # Delay field (in ms)
        delay_ms = self.step.get("delay_ms", 500)
        self._delay_field = ft.TextField(
            value=str(delay_ms),
            width=80,
            border_color=colors["border_subtle"],
            focused_border_color=colors["primary"],
            bgcolor=colors["bg_input"],
            cursor_color=colors["primary"],
            text_size=12,
            content_padding=ft.padding.symmetric(horizontal=8, vertical=8),
            border_radius=RADIUS["sm"],
            suffix_text="ms",
            input_filter=ft.NumbersOnlyInputFilter(),
            on_change=self._on_delay_change,
        )

        # Selector dropdown
        selectors = self.step.get("selectors", [])
        selector_options = self._build_selector_options(selectors)
        primary_selector = self._get_primary_selector_value(selectors)

        self._selector_dropdown = ft.Dropdown(
            value=primary_selector,
            options=selector_options,
            width=180,
            border_color=colors["border_subtle"],
            focused_border_color=colors["primary"],
            bgcolor=colors["bg_input"],
            text_size=11,
            content_padding=ft.padding.symmetric(horizontal=8, vertical=6),
            border_radius=RADIUS["sm"],
            on_change=self._on_selector_change,
        )

        return ft.Row(
            [
                # Step number and action type icon
                ft.Container(
                    content=ft.Column(
                        [
                            ft.Container(
                                content=ft.Text(
                                    f"#{self.index + 1}",
                                    size=10,
                                    weight=ft.FontWeight.W_600,
                                    color=colors["text_muted"],
                                ),
                                padding=ft.padding.symmetric(horizontal=8, vertical=3),
                                border_radius=RADIUS["xs"],
                                bgcolor=colors["bg_tertiary"],
                            ),
                            ft.Container(height=4),
                            ft.Container(
                                content=ft.Icon(icon, size=18, color=icon_color),
                                width=32,
                                height=32,
                                border_radius=RADIUS["sm"],
                                bgcolor=f"{icon_color}15",
                                alignment=ft.alignment.center,
                            ),
                        ],
                        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                        spacing=0,
                    ),
                    width=50,
                ),
                ft.Container(width=SPACING["md"]),
                # Step name
                ft.Column(
                    [
                        ft.Text(
                            "Step Name",
                            size=10,
                            color=colors["text_muted"],
                        ),
                        ft.Container(height=4),
                        self._name_field,
                    ],
                    spacing=0,
                    expand=True,
                ),
                ft.Container(width=SPACING["md"]),
                # Selector
                ft.Column(
                    [
                        ft.Text(
                            "Selector",
                            size=10,
                            color=colors["text_muted"],
                        ),
                        ft.Container(height=4),
                        self._selector_dropdown,
                    ],
                    spacing=0,
                ),
                ft.Container(width=SPACING["md"]),
                # Delay
                ft.Column(
                    [
                        ft.Text(
                            "Delay",
                            size=10,
                            color=colors["text_muted"],
                        ),
                        ft.Container(height=4),
                        self._delay_field,
                    ],
                    spacing=0,
                ),
                ft.Container(width=SPACING["lg"]),
                # Action buttons
                ft.Row(
                    [
                        # Move up button
                        ft.Container(
                            content=ft.Icon(
                                ft.Icons.ARROW_UPWARD,
                                size=16,
                                color=colors["text_muted"] if not self.is_first else colors["border"],
                            ),
                            width=32,
                            height=32,
                            border_radius=RADIUS["sm"],
                            bgcolor=colors["bg_tertiary"],
                            alignment=ft.alignment.center,
                            tooltip="Move Up",
                            on_click=self._handle_move_up if not self.is_first else None,
                            on_hover=self._on_action_hover if not self.is_first else None,
                            opacity=1.0 if not self.is_first else 0.5,
                        ),
                        ft.Container(width=4),
                        # Move down button
                        ft.Container(
                            content=ft.Icon(
                                ft.Icons.ARROW_DOWNWARD,
                                size=16,
                                color=colors["text_muted"] if not self.is_last else colors["border"],
                            ),
                            width=32,
                            height=32,
                            border_radius=RADIUS["sm"],
                            bgcolor=colors["bg_tertiary"],
                            alignment=ft.alignment.center,
                            tooltip="Move Down",
                            on_click=self._handle_move_down if not self.is_last else None,
                            on_hover=self._on_action_hover if not self.is_last else None,
                            opacity=1.0 if not self.is_last else 0.5,
                        ),
                        ft.Container(width=8),
                        # Delete button
                        ft.Container(
                            content=ft.Icon(
                                ft.Icons.DELETE_OUTLINE,
                                size=16,
                                color=colors["error"],
                            ),
                            width=32,
                            height=32,
                            border_radius=RADIUS["sm"],
                            bgcolor=f"{colors['error']}10",
                            alignment=ft.alignment.center,
                            tooltip="Delete Step",
                            on_click=self._handle_delete,
                            on_hover=self._on_delete_hover,
                        ),
                    ],
                    spacing=0,
                ),
            ],
            vertical_alignment=ft.CrossAxisAlignment.START,
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
        return action_styles.get(action_type, (ft.Icons.RADIO_BUTTON_CHECKED, colors["text_muted"]))

    def _build_selector_options(self, selectors: List[Dict[str, Any]]) -> List[ft.dropdown.Option]:
        """Build dropdown options from selectors list."""
        options = []
        for selector in selectors:
            selector_type = selector.get("type", "unknown")
            selector_value = selector.get("value", "")
            confidence = selector.get("confidence", 0)

            # Truncate long values
            display_value = selector_value
            if len(display_value) > 25:
                display_value = display_value[:22] + "..."

            # Format label with type and truncated value
            label = f"{selector_type}: {display_value}"
            if confidence:
                label += f" ({int(confidence * 100)}%)"

            options.append(ft.dropdown.Option(
                key=f"{selector_type}|{selector_value}",
                text=label,
            ))

        if not options:
            options.append(ft.dropdown.Option(
                key="none",
                text="No selector",
            ))

        return options

    def _get_primary_selector_value(self, selectors: List[Dict[str, Any]]) -> str:
        """Get the primary selector value for the dropdown."""
        if selectors:
            first = selectors[0]
            return f"{first.get('type', 'unknown')}|{first.get('value', '')}"
        return "none"

    def _on_name_change(self, e):
        """Handle step name change."""
        self.step["name"] = e.control.value
        if self.on_step_update:
            self.on_step_update(self.index, self.step)

    def _on_delay_change(self, e):
        """Handle delay change."""
        try:
            delay = int(e.control.value) if e.control.value else 500
            self.step["delay_ms"] = max(0, min(delay, 60000))  # Clamp 0-60000ms
        except ValueError:
            self.step["delay_ms"] = 500
        if self.on_step_update:
            self.on_step_update(self.index, self.step)

    def _on_selector_change(self, e):
        """Handle selector strategy change."""
        selected = e.control.value
        if selected and selected != "none":
            # Move selected selector to front of list
            selector_type, selector_value = selected.split("|", 1)
            selectors = self.step.get("selectors", [])

            # Find and move the selected selector to front
            for i, sel in enumerate(selectors):
                if sel.get("type") == selector_type and sel.get("value") == selector_value:
                    selectors.insert(0, selectors.pop(i))
                    break

            self.step["selectors"] = selectors
            if self.on_step_update:
                self.on_step_update(self.index, self.step)

    def _handle_move_up(self, e):
        """Handle move up button click."""
        if self.on_step_move_up and not self.is_first:
            self.on_step_move_up(self.index)

    def _handle_move_down(self, e):
        """Handle move down button click."""
        if self.on_step_move_down and not self.is_last:
            self.on_step_move_down(self.index)

    def _handle_delete(self, e):
        """Handle delete button click."""
        if self.on_step_delete:
            self.on_step_delete(self.index)

    def _on_hover(self, e):
        """Handle row hover."""
        colors = get_colors()
        if e.data == "true":
            self.bgcolor = colors["bg_hover"]
            self.border = ft.border.all(1, colors["border_light"])
        else:
            self.bgcolor = colors["bg_card"]
            self.border = ft.border.all(1, colors["border_subtle"])
        self.update()

    def _on_action_hover(self, e):
        """Handle action button hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["bg_hover"]
        else:
            e.control.bgcolor = colors["bg_tertiary"]
        e.control.update()

    def _on_delete_hover(self, e):
        """Handle delete button hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = f"{colors['error']}20"
        else:
            e.control.bgcolor = f"{colors['error']}10"
        e.control.update()


class WorkflowEditor(ft.Container):
    """Workflow editor for modifying recorded workflow steps.

    Allows editing step names, selector strategies, timing, and step order.
    """

    def __init__(
        self,
        workflow: Optional[Dict[str, Any]] = None,
        on_save: Optional[Callable] = None,
        on_cancel: Optional[Callable] = None,
        on_change: Optional[Callable] = None,
        **kwargs
    ):
        self.workflow = workflow or {"name": "", "description": "", "steps": []}
        self.on_save_workflow = on_save
        self.on_cancel_edit = on_cancel
        self.on_workflow_change = on_change

        # Track if changes have been made
        self._has_changes = False

        # Field references
        self._name_field: Optional[ft.TextField] = None
        self._description_field: Optional[ft.TextField] = None

        colors = get_colors()
        super().__init__(
            content=self._build_content(),
            bgcolor=colors["bg_secondary"],
            border_radius=RADIUS["xl"],
            border=ft.border.all(1, colors["border"]),
            expand=True,
            **kwargs
        )

    def _build_content(self):
        """Build the workflow editor content."""
        colors = get_colors()
        steps = self.workflow.get("steps", [])

        # Workflow name field
        self._name_field = ft.TextField(
            value=self.workflow.get("name", ""),
            hint_text="Workflow name",
            border_color=colors["border_subtle"],
            focused_border_color=colors["primary"],
            bgcolor=colors["bg_input"],
            cursor_color=colors["primary"],
            text_size=16,
            text_style=ft.TextStyle(weight=ft.FontWeight.W_600),
            content_padding=ft.padding.symmetric(horizontal=14, vertical=12),
            border_radius=RADIUS["md"],
            on_change=self._on_workflow_name_change,
            expand=True,
        )

        # Description field
        self._description_field = ft.TextField(
            value=self.workflow.get("description", ""),
            hint_text="Add a description (optional)",
            border_color=colors["border_subtle"],
            focused_border_color=colors["primary"],
            bgcolor=colors["bg_input"],
            cursor_color=colors["primary"],
            text_size=13,
            content_padding=ft.padding.symmetric(horizontal=14, vertical=10),
            border_radius=RADIUS["md"],
            on_change=self._on_workflow_description_change,
            multiline=True,
            min_lines=2,
            max_lines=3,
        )

        # Build step editors
        step_editors = []
        for i, step in enumerate(steps):
            step_editors.append(StepEditor(
                step=step,
                index=i,
                on_update=self._on_step_update,
                on_delete=self._on_step_delete,
                on_move_up=self._on_step_move_up,
                on_move_down=self._on_step_move_down,
                is_first=(i == 0),
                is_last=(i == len(steps) - 1),
            ))

        # Steps list or empty state
        if step_editors:
            steps_content = ft.Column(
                controls=step_editors,
                spacing=SPACING["sm"],
            )
        else:
            steps_content = self._build_empty_steps_state()

        return ft.Column(
            [
                # Header
                ft.Container(
                    content=ft.Row(
                        [
                            ft.Row(
                                [
                                    ft.Container(
                                        content=ft.Icon(
                                            ft.Icons.EDIT_NOTE,
                                            size=20,
                                            color=colors["accent_purple"],
                                        ),
                                        width=40,
                                        height=40,
                                        border_radius=RADIUS["md"],
                                        bgcolor=f"{colors['accent_purple']}12",
                                        alignment=ft.alignment.center,
                                    ),
                                    ft.Container(width=SPACING["md"]),
                                    ft.Text(
                                        "Edit Workflow",
                                        size=18,
                                        weight=ft.FontWeight.W_700,
                                        color=colors["text_primary"],
                                    ),
                                ],
                            ),
                            ft.Row(
                                [
                                    # Cancel button
                                    ft.Container(
                                        content=ft.Row(
                                            [
                                                ft.Icon(
                                                    ft.Icons.CLOSE,
                                                    size=16,
                                                    color=colors["text_muted"],
                                                ),
                                                ft.Container(width=6),
                                                ft.Text(
                                                    "Cancel",
                                                    size=13,
                                                    weight=ft.FontWeight.W_500,
                                                    color=colors["text_muted"],
                                                ),
                                            ],
                                            alignment=ft.MainAxisAlignment.CENTER,
                                        ),
                                        padding=ft.padding.symmetric(horizontal=16, vertical=10),
                                        border_radius=RADIUS["md"],
                                        bgcolor=colors["bg_tertiary"],
                                        border=ft.border.all(1, colors["border_subtle"]),
                                        animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                                        on_click=self._handle_cancel,
                                        on_hover=self._on_button_hover,
                                    ),
                                    ft.Container(width=SPACING["sm"]),
                                    # Save button
                                    ft.Container(
                                        content=ft.Row(
                                            [
                                                ft.Icon(
                                                    ft.Icons.SAVE,
                                                    size=16,
                                                    color=colors["text_inverse"],
                                                ),
                                                ft.Container(width=6),
                                                ft.Text(
                                                    "Save Changes",
                                                    size=13,
                                                    weight=ft.FontWeight.W_600,
                                                    color=colors["text_inverse"],
                                                ),
                                            ],
                                            alignment=ft.MainAxisAlignment.CENTER,
                                        ),
                                        padding=ft.padding.symmetric(horizontal=18, vertical=10),
                                        border_radius=RADIUS["md"],
                                        bgcolor=colors["primary"],
                                        shadow=ft.BoxShadow(
                                            spread_radius=0,
                                            blur_radius=12,
                                            color=f"{colors['primary']}30",
                                            offset=ft.Offset(0, 3),
                                        ),
                                        animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                                        on_click=self._handle_save,
                                        on_hover=self._on_primary_hover,
                                    ),
                                ],
                                spacing=0,
                            ),
                        ],
                        alignment=ft.MainAxisAlignment.SPACE_BETWEEN,
                    ),
                    padding=ft.padding.symmetric(horizontal=24, vertical=16),
                    border=ft.border.only(bottom=ft.BorderSide(1, colors["border"])),
                ),
                # Workflow info section
                ft.Container(
                    content=ft.Column(
                        [
                            # Name field
                            ft.Column(
                                [
                                    ft.Text(
                                        "Workflow Name",
                                        size=12,
                                        weight=ft.FontWeight.W_500,
                                        color=colors["text_secondary"],
                                    ),
                                    ft.Container(height=6),
                                    self._name_field,
                                ],
                                spacing=0,
                            ),
                            ft.Container(height=SPACING["lg"]),
                            # Description field
                            ft.Column(
                                [
                                    ft.Text(
                                        "Description",
                                        size=12,
                                        weight=ft.FontWeight.W_500,
                                        color=colors["text_secondary"],
                                    ),
                                    ft.Container(height=6),
                                    self._description_field,
                                ],
                                spacing=0,
                            ),
                        ],
                    ),
                    padding=24,
                    border=ft.border.only(bottom=ft.BorderSide(1, colors["border"])),
                ),
                # Steps section
                ft.Container(
                    content=ft.Column(
                        [
                            # Steps header
                            ft.Row(
                                [
                                    ft.Row(
                                        [
                                            ft.Icon(
                                                ft.Icons.CHECKLIST_ROUNDED,
                                                size=16,
                                                color=colors["accent_cyan"],
                                            ),
                                            ft.Container(width=8),
                                            ft.Text(
                                                "Steps",
                                                size=14,
                                                weight=ft.FontWeight.W_600,
                                                color=colors["text_primary"],
                                            ),
                                            ft.Container(width=8),
                                            ft.Container(
                                                content=ft.Text(
                                                    str(len(steps)),
                                                    size=11,
                                                    weight=ft.FontWeight.W_600,
                                                    color=colors["text_inverse"],
                                                ),
                                                padding=ft.padding.symmetric(horizontal=8, vertical=2),
                                                border_radius=10,
                                                bgcolor=colors["accent_cyan"],
                                            ),
                                        ],
                                    ),
                                    # Add step button
                                    ft.Container(
                                        content=ft.Row(
                                            [
                                                ft.Icon(
                                                    ft.Icons.ADD,
                                                    size=14,
                                                    color=colors["primary"],
                                                ),
                                                ft.Container(width=4),
                                                ft.Text(
                                                    "Add Step",
                                                    size=12,
                                                    weight=ft.FontWeight.W_500,
                                                    color=colors["primary"],
                                                ),
                                            ],
                                        ),
                                        padding=ft.padding.symmetric(horizontal=12, vertical=6),
                                        border_radius=RADIUS["sm"],
                                        bgcolor=f"{colors['primary']}10",
                                        border=ft.border.all(1, f"{colors['primary']}25"),
                                        on_click=self._handle_add_step,
                                        on_hover=self._on_add_hover,
                                        animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                                    ),
                                ],
                                alignment=ft.MainAxisAlignment.SPACE_BETWEEN,
                            ),
                            ft.Container(height=SPACING["lg"]),
                            # Steps list (scrollable)
                            ft.Container(
                                content=ft.ListView(
                                    controls=[steps_content],
                                    padding=SPACING["xs"],
                                    expand=True,
                                ),
                                expand=True,
                            ),
                        ],
                    ),
                    padding=24,
                    expand=True,
                ),
            ],
            spacing=0,
            expand=True,
        )

    def _build_empty_steps_state(self):
        """Build empty state when no steps exist."""
        colors = get_colors()
        return ft.Container(
            content=ft.Column(
                [
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.PLAYLIST_ADD,
                            size=40,
                            color=colors["text_muted"],
                        ),
                        width=72,
                        height=72,
                        border_radius=RADIUS["xl"],
                        bgcolor=colors["bg_tertiary"],
                        alignment=ft.alignment.center,
                    ),
                    ft.Container(height=SPACING["lg"]),
                    ft.Text(
                        "No steps in workflow",
                        size=14,
                        weight=ft.FontWeight.W_500,
                        color=colors["text_secondary"],
                    ),
                    ft.Container(height=SPACING["xs"]),
                    ft.Text(
                        "Add steps manually or record actions on your device",
                        size=12,
                        color=colors["text_muted"],
                        text_align=ft.TextAlign.CENTER,
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.symmetric(vertical=40),
            alignment=ft.alignment.center,
        )

    def _on_workflow_name_change(self, e):
        """Handle workflow name change."""
        self.workflow["name"] = e.control.value
        self._mark_changed()

    def _on_workflow_description_change(self, e):
        """Handle workflow description change."""
        self.workflow["description"] = e.control.value
        self._mark_changed()

    def _on_step_update(self, index: int, step: Dict[str, Any]):
        """Handle step update."""
        if 0 <= index < len(self.workflow.get("steps", [])):
            self.workflow["steps"][index] = step
            self._mark_changed()

    def _on_step_delete(self, index: int):
        """Handle step deletion."""
        steps = self.workflow.get("steps", [])
        if 0 <= index < len(steps):
            steps.pop(index)
            self._mark_changed()
            self._rebuild_content()

    def _on_step_move_up(self, index: int):
        """Handle moving a step up."""
        steps = self.workflow.get("steps", [])
        if 0 < index < len(steps):
            steps[index], steps[index - 1] = steps[index - 1], steps[index]
            self._mark_changed()
            self._rebuild_content()

    def _on_step_move_down(self, index: int):
        """Handle moving a step down."""
        steps = self.workflow.get("steps", [])
        if 0 <= index < len(steps) - 1:
            steps[index], steps[index + 1] = steps[index + 1], steps[index]
            self._mark_changed()
            self._rebuild_content()

    def _handle_add_step(self, e):
        """Handle add step button click."""
        steps = self.workflow.get("steps", [])
        new_step = {
            "id": f"step-{len(steps) + 1}",
            "name": f"New Step {len(steps) + 1}",
            "action_type": "tap",
            "selectors": [],
            "delay_ms": 500,
        }
        steps.append(new_step)
        self._mark_changed()
        self._rebuild_content()

    def _handle_save(self, e):
        """Handle save button click."""
        if self.on_save_workflow:
            self.on_save_workflow(self.workflow)

    def _handle_cancel(self, e):
        """Handle cancel button click."""
        if self.on_cancel_edit:
            self.on_cancel_edit()

    def _mark_changed(self):
        """Mark that changes have been made."""
        self._has_changes = True
        if self.on_workflow_change:
            self.on_workflow_change(self.workflow)

    def _rebuild_content(self):
        """Rebuild the editor content."""
        self.content = self._build_content()
        self.update()

    # Hover effects
    def _on_button_hover(self, e):
        """Handle button hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["bg_hover"]
            e.control.border = ft.border.all(1, colors["border_light"])
        else:
            e.control.bgcolor = colors["bg_tertiary"]
            e.control.border = ft.border.all(1, colors["border_subtle"])
        e.control.update()

    def _on_primary_hover(self, e):
        """Handle primary button hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=16,
                color=f"{colors['primary']}45",
                offset=ft.Offset(0, 5),
            )
            e.control.scale = 1.01
        else:
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=12,
                color=f"{colors['primary']}30",
                offset=ft.Offset(0, 3),
            )
            e.control.scale = 1.0
        e.control.update()

    def _on_add_hover(self, e):
        """Handle add step button hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = f"{colors['primary']}18"
            e.control.border = ft.border.all(1, f"{colors['primary']}40")
        else:
            e.control.bgcolor = f"{colors['primary']}10"
            e.control.border = ft.border.all(1, f"{colors['primary']}25")
        e.control.update()

    # Public methods
    def set_workflow(self, workflow: Dict[str, Any]):
        """Set the workflow to edit."""
        self.workflow = workflow
        self._has_changes = False
        self._rebuild_content()

    def get_workflow(self) -> Dict[str, Any]:
        """Get the current workflow data."""
        return self.workflow

    def has_unsaved_changes(self) -> bool:
        """Check if there are unsaved changes."""
        return self._has_changes

    def reset_changes(self):
        """Reset the change tracking."""
        self._has_changes = False
