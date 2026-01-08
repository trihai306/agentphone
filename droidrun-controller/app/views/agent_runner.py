"""Agent Runner View - Professional Chat-style UI for AI Agent Interaction."""

import asyncio
import flet as ft
from datetime import datetime
from typing import Optional, List
from enum import Enum
from dataclasses import dataclass

from ..theme import get_colors, RADIUS, get_shadow, ANIMATION, SPACING, get_colored_shadow
from ..backend import backend
from ..services.ai_service import get_ai_service

# Animation curve constants
EASE_OUT = ft.AnimationCurve.EASE_OUT
EASE_IN_OUT = ft.AnimationCurve.EASE_IN_OUT



# Dynamic color proxy - acts like a dict but always gets current theme colors
class _DynamicColors:
    def get(self, key, default=None):
        return get_colors().get(key, default)
    
    def __getitem__(self, key):
        return get_colors()[key]

COLORS = _DynamicColors()

class MessageType(Enum):
    """Message types for chat."""
    USER = "user"
    AGENT = "agent"
    SYSTEM = "system"
    ACTION = "action"
    ERROR = "error"
    SUCCESS = "success"
    THINKING = "thinking"


@dataclass
class ChatMessage:
    """A chat message."""
    type: MessageType
    content: str
    timestamp: datetime
    step: Optional[int] = None
    action_type: Optional[str] = None
    is_streaming: bool = False


class AgentRunnerView(ft.Column):
    """Professional chat-style view for running AI agents."""

    def __init__(self, app_state: dict, toast):
        self.app_state = app_state
        self.toast = toast
        self.backend = backend

        # Agent state
        self.is_running = False
        self.should_stop = False
        self.current_step = 0
        self.max_steps = 30

        # Chat messages
        self.messages: List[ChatMessage] = []

        # Selected device
        self.selected_device = None
        self._selected_device_info = None
        self.devices = []

        # Selected model
        self.selected_model = None
        self.models = []

        # UI References
        self.chat_container: Optional[ft.Column] = None
        self.input_field: Optional[ft.TextField] = None
        self.send_button: Optional[ft.Container] = None
        self.stop_button: Optional[ft.Container] = None
        self.device_info_container: Optional[ft.Container] = None
        self.model_info_container: Optional[ft.Container] = None
        self.input_container: Optional[ft.Container] = None
        self.progress_container: Optional[ft.Container] = None
        self.progress_bar: Optional[ft.ProgressBar] = None
        self.progress_text: Optional[ft.Text] = None
        self.execution_status_container: Optional[ft.Container] = None

        super().__init__(
            controls=self._build_controls(),
            spacing=0,
            expand=True,
        )

    def did_mount(self):
        """Called when the view is mounted to the page."""
        # Load devices and models when view is mounted
        self.page.run_task(self._initial_load)

    def _build_controls(self):
        """Build the main controls."""
        return [
            self._build_header(),
            ft.Container(height=16),
            self._build_main_content(),
        ]

    def _build_header(self):
        """Build the polished header section with enhanced styling."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Row(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.SMART_TOY,
                                    size=24,
                                    color=COLORS["primary"],
                                ),
                                width=52,
                                height=52,
                                border_radius=RADIUS["lg"],
                                bgcolor=f"{COLORS['primary']}12",
                                alignment=ft.Alignment(0, 0),
                                border=ft.border.all(1, f"{COLORS['primary']}20")
                            ),
                            ft.Container(width=16),
                            ft.Column(
                                [
                                    ft.Text(
                                        "AI Agent",
                                        size=24,
                                        weight=ft.FontWeight.W_800,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Text(
                                        "Intelligent Android Automation",
                                        size=13,
                                        weight=ft.FontWeight.W_400,
                                        color=COLORS["text_secondary"],
                                    ),
                                ],
                                spacing=2,
                            ),
                        ],
                    ),
                    ft.Container(expand=True),
                    # Model selector card
                    self._build_model_selector_card(),
                    ft.Container(width=12),
                    # Device selector card
                    self._build_device_selector_card(),
                    ft.Container(width=12),
                    # Action buttons with polished styling
                    ft.Row(
                        [
                            self._build_header_action_button(
                                ft.Icons.REFRESH,
                                "Refresh devices",
                                self._on_refresh_devices,
                            ),
                            ft.Container(width=8),
                            self._build_header_action_button(
                                ft.Icons.TUNE,
                                "Agent settings",
                                self._on_settings,
                            ),
                            ft.Container(width=8),
                            self._build_header_action_button(
                                ft.Icons.DELETE_OUTLINE,
                                "Clear chat",
                                self._on_clear_chat,
                                color=COLORS["error"],
                            ),
                        ],
                        spacing=0,
                    ),
                ],
            ),
        )

    def _build_header_action_button(self, icon, tooltip, on_click, color=None):
        """Build a polished header action button."""
        btn_color = color or COLORS["text_secondary"]
        return ft.Container(
            content=ft.Icon(
                icon,
                size=20,
                color=btn_color,
            ),
            width=44,
            height=44,
            border_radius=RADIUS["md"],
            bgcolor=COLORS["bg_tertiary"],
            alignment=ft.Alignment(0, 0),
            border=ft.border.all(1, COLORS["border_subtle"]),
            tooltip=tooltip,
            animate=ft.Animation(ANIMATION["fast"], EASE_OUT),
            on_click=on_click,
            on_hover=lambda e: self._on_header_btn_hover(e, btn_color),
        )

    def _on_header_btn_hover(self, e, color):
        """Handle header button hover effect."""
        if e.data == "true":
            e.control.bgcolor = COLORS["bg_hover"]
            e.control.border = ft.border.all(1, f"{color}40")
            
        else:
            e.control.bgcolor = COLORS["bg_tertiary"]
            e.control.border = ft.border.all(1, COLORS["border_subtle"])
            pass  # shadow removed
        e.control.update()

    def _build_device_selector_card(self):
        """Build the device selector card with full info."""
        # Device info display
        self.device_info_container = ft.Container(
            content=self._build_no_device_selected(),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["md"],
            padding=ft.padding.symmetric(horizontal=12, vertical=8),
            border=ft.border.all(1, COLORS["border"]),
            on_click=self._show_device_picker,
            on_hover=self._on_device_card_hover,
        )
        return self.device_info_container

    def _build_model_selector_card(self):
        """Build the model selector card."""
        self.model_info_container = ft.Container(
            content=self._build_no_model_selected(),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["md"],
            padding=ft.padding.symmetric(horizontal=12, vertical=8),
            border=ft.border.all(1, COLORS["border"]),
            on_click=self._show_model_picker,
            on_hover=self._on_model_card_hover,
        )
        return self.model_info_container

    def _build_no_model_selected(self):
        """Build UI when no model is selected."""
        return ft.Row(
            [
                ft.Container(
                    content=ft.Icon(
                        ft.Icons.AUTO_AWESOME,
                        size=20,
                        color=COLORS["text_muted"],
                    ),
                    width=36,
                    height=36,
                    border_radius=8,
                    bgcolor=COLORS["bg_tertiary"],
                    alignment=ft.Alignment(0, 0),
                ),
                ft.Container(width=10),
                ft.Column(
                    [
                        ft.Text(
                            "No model selected",
                            size=13,
                            weight=ft.FontWeight.W_500,
                            color=COLORS["text_primary"],
                        ),
                        ft.Text(
                            "Click to select model",
                            size=11,
                            color=COLORS["text_muted"],
                        ),
                    ],
                    spacing=1,
                ),
                ft.Container(width=8),
                ft.Icon(
                    ft.Icons.KEYBOARD_ARROW_DOWN,
                    size=18,
                    color=COLORS["text_muted"],
                ),
            ],
        )

    def _build_model_selected_info(self, model: dict):
        """Build UI showing selected model info."""
        name = model.get("name", model.get("id", "Unknown"))
        provider = model.get("provider", "").title()

        # Provider colors
        provider_colors = {
            "openai": COLORS["success"],
            "anthropic": COLORS["accent_purple"],
            "google": COLORS["accent_cyan"],
        }
        provider_color = provider_colors.get(model.get("provider", ""), COLORS["text_muted"])

        return ft.Row(
            [
                ft.Container(
                    content=ft.Icon(
                        ft.Icons.AUTO_AWESOME,
                        size=20,
                        color=provider_color,
                    ),
                    width=36,
                    height=36,
                    border_radius=8,
                    bgcolor=f"{provider_color}20",
                    alignment=ft.Alignment(0, 0),
                ),
                ft.Container(width=10),
                ft.Column(
                    [
                        ft.Text(
                            name[:20] + "..." if len(name) > 20 else name,
                            size=13,
                            weight=ft.FontWeight.W_600,
                            color=COLORS["text_primary"],
                        ),
                        ft.Text(
                            provider,
                            size=11,
                            color=provider_color,
                        ),
                    ],
                    spacing=1,
                ),
                ft.Container(width=8),
                ft.Icon(
                    ft.Icons.KEYBOARD_ARROW_DOWN,
                    size=18,
                    color=COLORS["text_muted"],
                ),
            ],
        )

    def _on_model_card_hover(self, e):
        """Handle model card hover."""
        if e.data == "true":
            e.control.border = ft.border.all(1, COLORS["primary"])
            e.control.bgcolor = COLORS["bg_hover"]
        else:
            e.control.border = ft.border.all(1, COLORS["border"])
            e.control.bgcolor = COLORS["bg_card"]
        e.control.update()

    def _show_model_picker(self, e):
        """Show model picker dialog."""
        self._build_and_show_model_dialog()

    def _build_and_show_model_dialog(self):
        """Build and show the model picker dialog."""
        def close_dialog(e):
            dialog.open = False
            self.page.update()

        def select_model(model):
            def handler(e):
                self.selected_model = model.get("id")
                self._selected_model_info = model
                self._update_model_display()
                self._add_message(
                    MessageType.SYSTEM,
                    f"Model selected: {model.get('name') or model.get('id')}",
                )
                close_dialog(e)
            return handler

        # Group models by provider
        models_by_provider = {}
        for model in self.models:
            provider = model.get("provider", "other")
            if provider not in models_by_provider:
                models_by_provider[provider] = []
            models_by_provider[provider].append(model)

        # Build model list
        model_items = []

        if not self.models:
            model_items.append(
                ft.Container(
                    content=ft.Column(
                        [
                            ft.Icon(
                                ft.Icons.AUTO_AWESOME,
                                size=48,
                                color=COLORS["text_muted"],
                            ),
                            ft.Container(height=12),
                            ft.Text(
                                "No models available",
                                size=16,
                                weight=ft.FontWeight.W_600,
                                color=COLORS["text_primary"],
                            ),
                            ft.Container(height=4),
                            ft.Text(
                                "Configure your API keys in Settings",
                                size=13,
                                color=COLORS["text_secondary"],
                                text_align=ft.TextAlign.CENTER,
                            ),
                            ft.Container(height=16),
                            ft.ElevatedButton(
                                content=ft.Row(
                                    [
                                        ft.Icon(ft.Icons.REFRESH, size=16, color=COLORS["text_inverse"]),
                                        ft.Container(width=6),
                                        ft.Text("Refresh models", size=13, color=COLORS["text_inverse"]),
                                    ],
                                    alignment=ft.MainAxisAlignment.CENTER,
                                ),
                                bgcolor=COLORS["primary"],
                                on_click=lambda e: self.page.run_task(self._refresh_and_rebuild_model_dialog),
                            ),
                        ],
                        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                    ),
                    padding=40,
                    alignment=ft.Alignment(0, 0),
                )
            )
        else:
            # Provider icons and colors
            provider_info = {
                "openai": (ft.Icons.CLOUD, COLORS["success"], "OpenAI"),
                "anthropic": (ft.Icons.PSYCHOLOGY, COLORS["accent_purple"], "Anthropic"),
                "google": (ft.Icons.BLUR_ON, COLORS["accent_cyan"], "Google"),
            }

            for provider, models in models_by_provider.items():
                icon, color, name = provider_info.get(provider, (ft.Icons.AUTO_AWESOME, COLORS["text_muted"], provider.title()))

                # Provider header
                model_items.append(
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(icon, size=16, color=color),
                                ft.Container(width=8),
                                ft.Text(
                                    name,
                                    size=12,
                                    weight=ft.FontWeight.W_600,
                                    color=color,
                                ),
                                ft.Container(expand=True),
                                ft.Text(
                                    f"{len(models)} models",
                                    size=11,
                                    color=COLORS["text_muted"],
                                ),
                            ],
                        ),
                        padding=ft.padding.symmetric(horizontal=12, vertical=8),
                        bgcolor=f"{color}10",
                        border_radius=RADIUS["sm"],
                        margin=ft.margin.only(top=8 if model_items else 0),
                    )
                )

                # Models in this provider
                for model in models:
                    is_selected = self.selected_model == model.get("id")
                    model_items.append(self._build_model_list_item(model, is_selected, select_model(model), color))

        dialog = ft.AlertDialog(
            modal=True,
            title=ft.Row(
                [
                    ft.Icon(ft.Icons.AUTO_AWESOME, size=24, color=COLORS["primary"]),
                    ft.Container(width=12),
                    ft.Text(
                        "Select Model",
                        size=18,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["text_primary"],
                    ),
                    ft.Container(expand=True),
                    ft.IconButton(
                        icon=ft.Icons.REFRESH,
                        icon_color=COLORS["text_muted"],
                        icon_size=20,
                        tooltip="Refresh",
                        on_click=lambda e: self.page.run_task(self._refresh_and_rebuild_model_dialog),
                    ),
                    ft.IconButton(
                        icon=ft.Icons.CLOSE,
                        icon_color=COLORS["text_muted"],
                        icon_size=20,
                        on_click=close_dialog,
                    ),
                ],
            ),
            content=ft.Container(
                content=ft.Column(
                    model_items,
                    spacing=4,
                    scroll=ft.ScrollMode.AUTO,
                ),
                width=450,
                height=400 if self.models else 250,
            ),
            actions_alignment=ft.MainAxisAlignment.END,
            bgcolor=COLORS["bg_card"],
            shape=ft.RoundedRectangleBorder(radius=RADIUS["lg"]),
        )

        self.page.overlay.append(dialog)
        dialog.open = True
        self.page.update()

    def _build_model_list_item(self, model: dict, is_selected: bool, on_click, provider_color):
        """Build a model list item for the picker."""
        name = model.get("name", model.get("id", "Unknown"))
        model_id = model.get("id", "")

        return ft.Container(
            content=ft.Row(
                [
                    ft.Column(
                        [
                            ft.Text(
                                name,
                                size=14,
                                weight=ft.FontWeight.W_500,
                                color=COLORS["text_primary"],
                            ),
                            ft.Text(
                                model_id,
                                size=11,
                                color=COLORS["text_muted"],
                            ),
                        ],
                        spacing=2,
                        expand=True,
                    ),
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.CHECK_CIRCLE if is_selected else ft.Icons.RADIO_BUTTON_UNCHECKED,
                            size=20,
                            color=COLORS["primary"] if is_selected else COLORS["text_muted"],
                        ),
                    ),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=12, vertical=10),
            border_radius=RADIUS["sm"],
            bgcolor=COLORS["primary_glow"] if is_selected else "transparent",
            border=ft.border.all(1, COLORS["primary"]) if is_selected else None,
            on_click=on_click,
            on_hover=self._on_model_item_hover if not is_selected else None,
        )

    def _on_model_item_hover(self, e):
        """Handle model item hover."""
        if e.data == "true":
            e.control.bgcolor = COLORS["bg_hover"]
        else:
            e.control.bgcolor = "transparent"
        e.control.update()

    def _update_model_display(self):
        """Update the model display in header."""
        if self.selected_model and hasattr(self, '_selected_model_info'):
            self.model_info_container.content = self._build_model_selected_info(self._selected_model_info)
        else:
            self.model_info_container.content = self._build_no_model_selected()
        if self.page:
            self.model_info_container.update()

    async def _refresh_and_rebuild_model_dialog(self):
        """Refresh models and rebuild dialog."""
        await self._load_models()
        if self.page.overlay:
            self.page.overlay.clear()
            self.page.update()
        self._build_and_show_model_dialog()

    async def _initial_load(self):
        """Initial load of devices and models."""
        await self._load_devices()
        await self._load_models()

    async def _load_devices(self):
        """Load available devices."""
        try:
            self.devices = await self.backend.get_devices()
            # Auto-select first device if available
            if self.devices and not self.selected_device:
                first_device = self.devices[0]
                self.selected_device = first_device.get("adb_serial")
                self._selected_device_info = first_device
                self._update_device_display()
        except Exception as ex:
            print(f"Error loading devices: {ex}")

    async def _load_models(self):
        """Load available models from API."""
        try:
            ai_service = get_ai_service(self.app_state)
            self.models = await ai_service.fetch_all_models()
            # Auto-select first model if available
            if self.models and not self.selected_model:
                first_model = self.models[0]
                self.selected_model = first_model.get("id")
                self._selected_model_info = first_model
                self._update_model_display()
        except Exception as ex:
            print(f"Error loading models: {ex}")

    def _build_no_device_selected(self):
        """Build UI when no device is selected."""
        return ft.Row(
            [
                ft.Container(
                    content=ft.Icon(
                        ft.Icons.PHONE_ANDROID,
                        size=20,
                        color=COLORS["text_muted"],
                    ),
                    width=36,
                    height=36,
                    border_radius=8,
                    bgcolor=COLORS["bg_tertiary"],
                    alignment=ft.Alignment(0, 0),
                ),
                ft.Container(width=10),
                ft.Column(
                    [
                        ft.Text(
                            "No device selected",
                            size=13,
                            weight=ft.FontWeight.W_500,
                            color=COLORS["text_primary"],
                        ),
                        ft.Text(
                            "Click to select a device",
                            size=11,
                            color=COLORS["text_muted"],
                        ),
                    ],
                    spacing=1,
                ),
                ft.Container(width=8),
                ft.Icon(
                    ft.Icons.KEYBOARD_ARROW_DOWN,
                    size=18,
                    color=COLORS["text_muted"],
                ),
            ],
        )

    def _build_device_selected_info(self, device: dict):
        """Build UI showing selected device info."""
        name = device.get("name") or device.get("model") or "Unknown"
        serial = device.get("adb_serial", "")
        android_version = device.get("android_version", "?")
        status = device.get("status", "offline")
        is_online = status == "connected"

        return ft.Row(
            [
                ft.Stack(
                    [
                        ft.Container(
                            content=ft.Icon(
                                ft.Icons.PHONE_ANDROID,
                                size=20,
                                color=COLORS["primary"] if is_online else COLORS["text_muted"],
                            ),
                            width=36,
                            height=36,
                            border_radius=8,
                            bgcolor=COLORS["primary_glow"] if is_online else COLORS["bg_tertiary"],
                            alignment=ft.Alignment(0, 0),
                        ),
                        ft.Container(
                            width=10,
                            height=10,
                            border_radius=5,
                            bgcolor=COLORS["success"] if is_online else COLORS["text_muted"],
                            border=ft.border.all(2, COLORS["bg_card"]),
                            right=0,
                            bottom=0,
                        ),
                    ],
                ),
                ft.Container(width=10),
                ft.Column(
                    [
                        ft.Text(
                            name[:18] + "..." if len(name) > 18 else name,
                            size=13,
                            weight=ft.FontWeight.W_600,
                            color=COLORS["text_primary"],
                        ),
                        ft.Row(
                            [
                                ft.Text(
                                    f"Android {android_version}",
                                    size=10,
                                    color=COLORS["text_muted"],
                                ),
                                ft.Container(
                                    width=4,
                                    height=4,
                                    border_radius=2,
                                    bgcolor=COLORS["text_muted"],
                                ),
                                ft.Text(
                                    "Online" if is_online else "Offline",
                                    size=10,
                                    color=COLORS["success"] if is_online else COLORS["text_muted"],
                                ),
                            ],
                            spacing=6,
                        ),
                    ],
                    spacing=1,
                ),
                ft.Container(width=8),
                ft.Icon(
                    ft.Icons.KEYBOARD_ARROW_DOWN,
                    size=18,
                    color=COLORS["text_muted"],
                ),
            ],
        )

    def _on_device_card_hover(self, e):
        """Handle device card hover."""
        if e.data == "true":
            e.control.border = ft.border.all(1, COLORS["primary"])
            e.control.bgcolor = COLORS["bg_hover"]
        else:
            e.control.border = ft.border.all(1, COLORS["border"])
            e.control.bgcolor = COLORS["bg_card"]
        e.control.update()

    def _show_device_picker(self, e):
        """Show device picker dialog."""
        self._build_and_show_device_dialog()

    def _build_and_show_device_dialog(self):
        """Build and show the device picker dialog."""
        def close_dialog(e):
            dialog.open = False
            self.page.update()

        def select_device(device):
            def handler(e):
                self.selected_device = device.get("adb_serial")
                self._selected_device_info = device
                self._update_device_display()
                self._add_message(
                    MessageType.SYSTEM,
                    f"Device selected: {device.get('name') or device.get('model') or device.get('adb_serial')}",
                )
                close_dialog(e)
            return handler

        # Build device list
        device_items = []

        if not self.devices:
            device_items.append(
                ft.Container(
                    content=ft.Column(
                        [
                            ft.Icon(
                                ft.Icons.PHONE_ANDROID,
                                size=48,
                                color=COLORS["text_muted"],
                            ),
                            ft.Container(height=12),
                            ft.Text(
                                "No devices found",
                                size=16,
                                weight=ft.FontWeight.W_600,
                                color=COLORS["text_primary"],
                            ),
                            ft.Container(height=4),
                            ft.Text(
                                "Connect a device via USB or WiFi ADB",
                                size=13,
                                color=COLORS["text_secondary"],
                                text_align=ft.TextAlign.CENTER,
                            ),
                            ft.Container(height=16),
                            ft.ElevatedButton(
                                content=ft.Row(
                                    [
                                        ft.Icon(ft.Icons.RADAR, size=16, color=COLORS["text_inverse"]),
                                        ft.Container(width=6),
                                        ft.Text("Scan for devices", size=13, color=COLORS["text_inverse"]),
                                    ],
                                    alignment=ft.MainAxisAlignment.CENTER,
                                ),
                                bgcolor=COLORS["primary"],
                                on_click=lambda e: self.page.run_task(self._refresh_and_rebuild_dialog),
                            ),
                        ],
                        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                    ),
                    padding=40,
                    alignment=ft.Alignment(0, 0),
                )
            )
        else:
            for device in self.devices:
                is_selected = self.selected_device == device.get("adb_serial")
                device_items.append(self._build_device_list_item(device, is_selected, select_device(device)))

        dialog = ft.AlertDialog(
            modal=True,
            title=ft.Row(
                [
                    ft.Icon(ft.Icons.DEVICES, size=24, color=COLORS["primary"]),
                    ft.Container(width=12),
                    ft.Text(
                        "Select Device",
                        size=18,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["text_primary"],
                    ),
                    ft.Container(expand=True),
                    ft.IconButton(
                        icon=ft.Icons.REFRESH,
                        icon_color=COLORS["text_muted"],
                        icon_size=20,
                        tooltip="Refresh",
                        on_click=lambda e: self.page.run_task(self._refresh_and_rebuild_dialog),
                    ),
                    ft.IconButton(
                        icon=ft.Icons.CLOSE,
                        icon_color=COLORS["text_muted"],
                        icon_size=20,
                        on_click=close_dialog,
                    ),
                ],
            ),
            content=ft.Container(
                content=ft.Column(
                    device_items,
                    spacing=8,
                    scroll=ft.ScrollMode.AUTO,
                ),
                width=450,
                height=400 if self.devices else 250,
            ),
            actions_alignment=ft.MainAxisAlignment.END,
            bgcolor=COLORS["bg_card"],
            shape=ft.RoundedRectangleBorder(radius=RADIUS["lg"]),
        )

        self.page.overlay.append(dialog)
        dialog.open = True
        self.page.update()

    def _build_device_list_item(self, device: dict, is_selected: bool, on_click):
        """Build a device list item for the picker."""
        name = device.get("name") or device.get("model") or "Unknown Device"
        serial = device.get("adb_serial", "")
        android_version = device.get("android_version", "?")
        status = device.get("status", "offline")
        is_online = status == "connected"
        manufacturer = device.get("manufacturer", "")
        screen_size = device.get("screen_size", "")

        return ft.Container(
            content=ft.Row(
                [
                    # Device icon with status
                    ft.Stack(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.PHONE_ANDROID,
                                    size=28,
                                    color=COLORS["primary"] if is_online else COLORS["text_secondary"],
                                ),
                                width=56,
                                height=56,
                                border_radius=12,
                                bgcolor=COLORS["primary_glow"] if is_online else COLORS["bg_tertiary"],
                                alignment=ft.Alignment(0, 0),
                            ),
                            ft.Container(
                                width=14,
                                height=14,
                                border_radius=7,
                                bgcolor=COLORS["success"] if is_online else COLORS["text_muted"],
                                border=ft.border.all(2, COLORS["bg_card"]),
                                right=0,
                                bottom=0,
                            ),
                        ],
                    ),
                    ft.Container(width=16),
                    # Device info
                    ft.Column(
                        [
                            ft.Text(
                                name,
                                size=15,
                                weight=ft.FontWeight.W_600,
                                color=COLORS["text_primary"],
                            ),
                            ft.Container(height=2),
                            ft.Row(
                                [
                                    ft.Container(
                                        content=ft.Text(
                                            f"Android {android_version}",
                                            size=11,
                                            color=COLORS["text_secondary"],
                                        ),
                                        padding=ft.padding.symmetric(horizontal=6, vertical=2),
                                        border_radius=4,
                                        bgcolor=COLORS["bg_tertiary"],
                                    ),
                                    ft.Container(
                                        content=ft.Text(
                                            "Online" if is_online else "Offline",
                                            size=11,
                                            color=COLORS["success"] if is_online else COLORS["text_muted"],
                                        ),
                                        padding=ft.padding.symmetric(horizontal=6, vertical=2),
                                        border_radius=4,
                                        bgcolor=f"{COLORS['success']}15" if is_online else COLORS["bg_tertiary"],
                                    ),
                                ],
                                spacing=6,
                            ),
                            ft.Container(height=2),
                            ft.Text(
                                serial,
                                size=11,
                                color=COLORS["text_muted"],
                            ),
                        ],
                        spacing=0,
                        expand=True,
                    ),
                    # Selection indicator
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.CHECK_CIRCLE if is_selected else ft.Icons.RADIO_BUTTON_UNCHECKED,
                            size=24,
                            color=COLORS["primary"] if is_selected else COLORS["text_muted"],
                        ),
                    ),
                ],
            ),
            padding=ft.padding.all(12),
            border_radius=RADIUS["md"],
            bgcolor=COLORS["primary_glow"] if is_selected else COLORS["bg_tertiary"],
            border=ft.border.all(2, COLORS["primary"]) if is_selected else ft.border.all(1, COLORS["border"]),
            on_click=on_click,
            on_hover=self._on_device_item_hover if not is_selected else None,
        )

    def _on_device_item_hover(self, e):
        """Handle device item hover."""
        if e.data == "true":
            e.control.bgcolor = COLORS["bg_hover"]
            e.control.border = ft.border.all(1, COLORS["primary"])
        else:
            e.control.bgcolor = COLORS["bg_tertiary"]
            e.control.border = ft.border.all(1, COLORS["border"])
        e.control.update()

    def _update_device_display(self):
        """Update the device display in header."""
        if self.selected_device and hasattr(self, '_selected_device_info'):
            self.device_info_container.content = self._build_device_selected_info(self._selected_device_info)
        else:
            self.device_info_container.content = self._build_no_device_selected()
        if self.page:
            self.device_info_container.update()

    async def _refresh_and_rebuild_dialog(self):
        """Refresh devices and rebuild dialog."""
        await self.load_devices()
        # Close current dialog
        if self.page.overlay:
            self.page.overlay.clear()
            self.page.update()
        # Reopen with new data
        self._build_and_show_device_dialog()

    async def _on_refresh_devices(self, e):
        """Handle refresh devices button."""
        self.toast.info("Scanning for devices...")
        await self._load_devices()
        if self.devices:
            self.toast.success(f"Found {len(self.devices)} device(s)")
        else:
            self.toast.warning("No devices found")

    def _build_main_content(self):
        """Build the main chat content with enhanced styling."""
        # Chat messages container
        self.chat_container = ft.Column(
            controls=self._build_welcome_message(),
            spacing=16,
            scroll=ft.ScrollMode.AUTO,
            expand=True,
        )

        # Input area with polished styling
        self.input_field = ft.TextField(
            hint_text="Describe what you want the agent to do...",
            multiline=True,
            min_lines=1,
            max_lines=4,
            border_color="transparent",
            focused_border_color="transparent",
            bgcolor="transparent",
            border_radius=RADIUS["lg"],
            text_style=ft.TextStyle(color=COLORS["text_primary"], size=14),
            hint_style=ft.TextStyle(color=COLORS["text_muted"], size=14),
            expand=True,
            on_submit=self._on_send,
            on_focus=self._on_input_focus,
            on_blur=self._on_input_blur,
            cursor_color=COLORS["primary"],
            selection_color=f"{COLORS['primary']}30",
        )

        # Enhanced send button
        self.send_button = self._build_send_button()

        # Stop button (hidden by default)
        self.stop_button = self._build_stop_button()

        # Progress bar for execution
        self.progress_bar = ft.ProgressBar(
            value=0,
            bgcolor=COLORS["bg_tertiary"],
            color=COLORS["primary"],
            bar_height=3,
            border_radius=2,
        )

        self.progress_text = ft.Text(
            "Ready",
            size=11,
            color=COLORS["text_muted"],
            weight=ft.FontWeight.W_500,
        )

        # Execution status container (shown during execution)
        self.execution_status_container = ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        content=ft.ProgressRing(
                            width=16,
                            height=16,
                            stroke_width=2,
                            color=COLORS["primary"],
                        ),
                    ),
                    ft.Container(width=10),
                    self.progress_text,
                    ft.Container(expand=True),
                    ft.Container(
                        content=ft.Text(
                            "0/30 steps",
                            size=11,
                            color=COLORS["text_muted"],
                        ),
                    ),
                ],
            ),
            visible=False,
            padding=ft.padding.symmetric(horizontal=16, vertical=8),
            bgcolor=f"{COLORS['primary']}08",
            border_radius=RADIUS["md"],
            border=ft.border.all(1, f"{COLORS['primary']}20"),
        )

        # Input container with enhanced styling
        self.input_container = ft.Container(
            content=ft.Column(
                [
                    # Execution status bar
                    self.execution_status_container,
                    # Main input row
                    ft.Container(
                        content=ft.Row(
                            [
                                # Quick actions menu with enhanced styling
                                self._build_quick_actions_menu(),
                                ft.Container(width=8),
                                self.input_field,
                                ft.Container(width=8),
                                # Button container (send/stop)
                                ft.Stack(
                                    [
                                        self.send_button,
                                        self.stop_button,
                                    ],
                                ),
                            ],
                            vertical_alignment=ft.CrossAxisAlignment.END,
                        ),
                        padding=ft.padding.symmetric(horizontal=12, vertical=10),
                    ),
                ],
                spacing=0,
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["lg"],
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("sm"),
            animate=ft.Animation(ANIMATION["normal"], EASE_OUT),
        )

        return ft.Container(
            content=ft.Column(
                [
                    # Chat area with polished styling
                    ft.Container(
                        content=self.chat_container,
                        expand=True,
                        bgcolor=COLORS["bg_primary"],
                        border_radius=RADIUS["lg"],
                        padding=20,
                        border=ft.border.all(1, COLORS["border_subtle"]),
                    ),
                    ft.Container(height=16),
                    # Input area
                    self.input_container,
                ],
                expand=True,
            ),
            expand=True,
        )

    def _build_send_button(self):
        """Build the polished send button."""
        return ft.Container(
            content=ft.Icon(
                ft.Icons.SEND_ROUNDED,
                size=20,
                color=COLORS["text_inverse"],
            ),
            width=44,
            height=44,
            border_radius=RADIUS["md"],
            bgcolor=COLORS["primary"],
            alignment=ft.Alignment(0, 0),
            tooltip="Send message",
            animate=ft.Animation(ANIMATION["fast"], EASE_OUT),
            on_click=self._on_send,
            on_hover=self._on_send_hover,
        )

    def _build_stop_button(self):
        """Build the stop button (shown during execution)."""
        return ft.Container(
            content=ft.Icon(
                ft.Icons.STOP_ROUNDED,
                size=20,
                color=COLORS["text_inverse"],
            ),
            width=44,
            height=44,
            border_radius=RADIUS["md"],
            bgcolor=COLORS["error"],
            alignment=ft.Alignment(0, 0),
            tooltip="Stop execution",
            visible=False,
            animate=ft.Animation(ANIMATION["fast"], EASE_OUT),
            on_click=self._on_stop,
            on_hover=self._on_stop_hover,
        )

    def _on_send_hover(self, e):
        """Handle send button hover."""
        if e.data == "true":
            e.control.scale = 1.05
            
        else:
            e.control.scale = 1.0
            
        e.control.update()

    def _on_stop_hover(self, e):
        """Handle stop button hover."""
        if e.data == "true":
            e.control.scale = 1.05
            
        else:
            e.control.scale = 1.0
            
        e.control.update()

    def _on_input_focus(self, e):
        """Handle input focus with visual feedback."""
        if self.input_container:
            self.input_container.border = ft.border.all(1, COLORS["primary"])
            
            self.input_container.update()

    def _on_input_blur(self, e):
        """Handle input blur."""
        if self.input_container:
            self.input_container.border = ft.border.all(1, COLORS["border"])
            self.input_container.shadow = get_shadow("sm")
            self.input_container.update()

    def _build_quick_actions_menu(self):
        """Build enhanced quick actions menu."""
        return ft.Container(
            content=ft.PopupMenuButton(
                content=ft.Container(
                    content=ft.Icon(
                        ft.Icons.ADD_CIRCLE_OUTLINE,
                        size=22,
                        color=COLORS["text_secondary"],
                    ),
                    width=40,
                    height=40,
                    border_radius=RADIUS["md"],
                    bgcolor=COLORS["bg_tertiary"],
                    alignment=ft.Alignment(0, 0),
                ),
                tooltip="Quick actions",
                items=[
                    ft.PopupMenuItem(
                        content=ft.Row(
                            [
                                ft.Container(
                                    content=ft.Icon(ft.Icons.FACEBOOK, size=18, color=COLORS["accent_blue"]),
                                    width=32,
                                    height=32,
                                    border_radius=RADIUS["sm"],
                                    bgcolor=f"{COLORS['accent_blue']}15",
                                    alignment=ft.Alignment(0, 0),
                                ),
                                ft.Container(width=10),
                                ft.Column(
                                    [
                                        ft.Text("Browse Facebook", size=13, color=COLORS["text_primary"], weight=ft.FontWeight.W_500),
                                        ft.Text("Open and interact with feed", size=11, color=COLORS["text_muted"]),
                                    ],
                                    spacing=2,
                                ),
                            ],
                        ),
                        on_click=lambda _: self._set_input("Open Facebook and browse the feed, like some interesting posts"),
                    ),
                    ft.PopupMenuItem(
                        content=ft.Row(
                            [
                                ft.Container(
                                    content=ft.Icon(ft.Icons.PLAY_CIRCLE, size=18, color=COLORS["error"]),
                                    width=32,
                                    height=32,
                                    border_radius=RADIUS["sm"],
                                    bgcolor=f"{COLORS['error']}15",
                                    alignment=ft.Alignment(0, 0),
                                ),
                                ft.Container(width=10),
                                ft.Column(
                                    [
                                        ft.Text("Watch YouTube", size=13, color=COLORS["text_primary"], weight=ft.FontWeight.W_500),
                                        ft.Text("Find and play a video", size=11, color=COLORS["text_muted"]),
                                    ],
                                    spacing=2,
                                ),
                            ],
                        ),
                        on_click=lambda _: self._set_input("Open YouTube and watch a video about technology"),
                    ),
                    ft.PopupMenuItem(
                        content=ft.Row(
                            [
                                ft.Container(
                                    content=ft.Icon(ft.Icons.SETTINGS, size=18, color=COLORS["text_secondary"]),
                                    width=32,
                                    height=32,
                                    border_radius=RADIUS["sm"],
                                    bgcolor=f"{COLORS['text_secondary']}15",
                                    alignment=ft.Alignment(0, 0),
                                ),
                                ft.Container(width=10),
                                ft.Column(
                                    [
                                        ft.Text("Check Settings", size=13, color=COLORS["text_primary"], weight=ft.FontWeight.W_500),
                                        ft.Text("Verify WiFi connection status", size=11, color=COLORS["text_muted"]),
                                    ],
                                    spacing=2,
                                ),
                            ],
                        ),
                        on_click=lambda _: self._set_input("Open Settings and check the WiFi connection"),
                    ),
                    ft.PopupMenuItem(
                        content=ft.Row(
                            [
                                ft.Container(
                                    content=ft.Icon(ft.Icons.CAMERA_ALT, size=18, color=COLORS["accent_purple"]),
                                    width=32,
                                    height=32,
                                    border_radius=RADIUS["sm"],
                                    bgcolor=f"{COLORS['accent_purple']}15",
                                    alignment=ft.Alignment(0, 0),
                                ),
                                ft.Container(width=10),
                                ft.Column(
                                    [
                                        ft.Text("Take a Photo", size=13, color=COLORS["text_primary"], weight=ft.FontWeight.W_500),
                                        ft.Text("Open camera and capture", size=11, color=COLORS["text_muted"]),
                                    ],
                                    spacing=2,
                                ),
                            ],
                        ),
                        on_click=lambda _: self._set_input("Open the Camera app and take a photo"),
                    ),
                ],
            ),
        )

    def _build_welcome_message(self):
        """Build the enhanced welcome message with polished design."""
        return [
            ft.Container(
                content=ft.Column(
                    [
                        # Animated AI icon with glow
                        ft.Container(
                            content=ft.Stack(
                                [
                                    # Outer glow ring
                                    ft.Container(
                                        width=100,
                                        height=100,
                                        border_radius=25,
                                        bgcolor=f"{COLORS['primary']}08",
                                        border=ft.border.all(1, f"{COLORS['primary']}15"),
                                    ),
                                    # Inner icon container
                                    ft.Container(
                                        content=ft.Icon(
                                            ft.Icons.SMART_TOY,
                                            size=40,
                                            color=COLORS["primary"],
                                        ),
                                        width=72,
                                        height=72,
                                        border_radius=18,
                                        bgcolor=f"{COLORS['primary']}15",
                                        alignment=ft.Alignment(0, 0),
                                        left=14,
                                        top=14
                                    ),
                                ],
                            ),
                            width=100,
                            height=100,
                        ),
                        ft.Container(height=24),
                        # Title with gradient feel
                        ft.Text(
                            "Welcome to AI Agent",
                            size=26,
                            weight=ft.FontWeight.W_800,
                            color=COLORS["text_primary"],
                            text_align=ft.TextAlign.CENTER,
                        ),
                        ft.Container(height=8),
                        # Subtitle with softer styling
                        ft.Text(
                            "I can help you automate tasks on your Android device.\nJust describe what you want me to do!",
                            size=14,
                            color=COLORS["text_secondary"],
                            text_align=ft.TextAlign.CENTER,
                        ),
                        ft.Container(height=32),
                        # Feature highlights
                        ft.Row(
                            [
                                self._build_feature_badge(ft.Icons.VISIBILITY, "Vision AI", "Sees your screen"),
                                self._build_feature_badge(ft.Icons.TOUCH_APP, "Smart Actions", "Taps & swipes"),
                                self._build_feature_badge(ft.Icons.AUTO_AWESOME, "AI Powered", "GPT-4 Vision"),
                            ],
                            alignment=ft.MainAxisAlignment.CENTER,
                            spacing=16,
                        ),
                        ft.Container(height=32),
                        # Example prompts with enhanced styling
                        ft.Text(
                            "Try one of these:",
                            size=12,
                            weight=ft.FontWeight.W_500,
                            color=COLORS["text_muted"],
                        ),
                        ft.Container(height=12),
                        ft.Row(
                            [
                                self._build_example_chip("Browse social media", ft.Icons.PEOPLE_OUTLINE),
                                self._build_example_chip("Check notifications", ft.Icons.NOTIFICATIONS_OUTLINED),
                                self._build_example_chip("Open an app", ft.Icons.APPS_OUTLINED),
                            ],
                            alignment=ft.MainAxisAlignment.CENTER,
                            wrap=True,
                            spacing=10,
                        ),
                    ],
                    horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                ),
                alignment=ft.Alignment(0, 0),
                expand=True,
            ),
        ]

    def _build_feature_badge(self, icon, title: str, subtitle: str):
        """Build a feature highlight badge."""
        return ft.Container(
            content=ft.Column(
                [
                    ft.Container(
                        content=ft.Icon(icon, size=22, color=COLORS["primary"]),
                        width=48,
                        height=48,
                        border_radius=RADIUS["md"],
                        bgcolor=f"{COLORS['primary']}12",
                        alignment=ft.Alignment(0, 0),
                        border=ft.border.all(1, f"{COLORS['primary']}20"),
                    ),
                    ft.Container(height=10),
                    ft.Text(
                        title,
                        size=13,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["text_primary"],
                        text_align=ft.TextAlign.CENTER,
                    ),
                    ft.Text(
                        subtitle,
                        size=11,
                        color=COLORS["text_muted"],
                        text_align=ft.TextAlign.CENTER,
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                spacing=0,
            ),
            padding=ft.padding.symmetric(horizontal=16, vertical=12),
            border_radius=RADIUS["lg"],
            bgcolor=COLORS["bg_card"],
            border=ft.border.all(1, COLORS["border_subtle"]),
            animate=ft.Animation(ANIMATION["fast"], EASE_OUT),
            on_hover=self._on_feature_hover,
        )

    def _on_feature_hover(self, e):
        """Handle feature badge hover."""
        if e.data == "true":
            e.control.bgcolor = COLORS["bg_hover"]
            e.control.border = ft.border.all(1, f"{COLORS['primary']}30")
            
        else:
            e.control.bgcolor = COLORS["bg_card"]
            e.control.border = ft.border.all(1, COLORS["border_subtle"])
            pass  # shadow removed
        e.control.update()

    def _build_example_chip(self, text: str, icon=None):
        """Build an enhanced example prompt chip."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(icon, size=16, color=COLORS["primary"]) if icon else ft.Container(),
                    ft.Container(width=6) if icon else ft.Container(),
                    ft.Text(
                        text,
                        size=12,
                        weight=ft.FontWeight.W_500,
                        color=COLORS["primary"],
                    ),
                ],
                spacing=0,
            ),
            padding=ft.padding.symmetric(horizontal=16, vertical=10),
            border_radius=RADIUS["full"],
            bgcolor=f"{COLORS['primary']}08",
            border=ft.border.all(1, f"{COLORS['primary']}30"),
            animate=ft.Animation(ANIMATION["fast"], EASE_OUT),
            on_click=lambda _: self._set_input(text),
            on_hover=self._on_chip_hover,
        )

    def _on_chip_hover(self, e):
        """Handle chip hover with enhanced feedback."""
        if e.data == "true":
            e.control.bgcolor = f"{COLORS['primary']}15"
            e.control.border = ft.border.all(1, COLORS["primary"])
            e.control.scale = 1.02
        else:
            e.control.bgcolor = f"{COLORS['primary']}08"
            e.control.border = ft.border.all(1, f"{COLORS['primary']}30")
            e.control.scale = 1.0
        e.control.update()

    def _build_message_bubble(self, message: ChatMessage):
        """Build a chat message bubble."""
        is_user = message.type == MessageType.USER
        is_system = message.type == MessageType.SYSTEM
        is_thinking = message.type == MessageType.THINKING
        is_error = message.type == MessageType.ERROR
        is_success = message.type == MessageType.SUCCESS
        is_action = message.type == MessageType.ACTION

        # Determine colors and alignment
        if is_user:
            bg_color = COLORS["primary"]
            text_color = COLORS["text_inverse"]
            align = ft.MainAxisAlignment.END
            icon = ft.Icons.PERSON
            icon_color = COLORS["primary"]
        elif is_error:
            bg_color = f"{COLORS['error']}15"
            text_color = COLORS["text_primary"]
            align = ft.MainAxisAlignment.START
            icon = ft.Icons.ERROR_OUTLINE
            icon_color = COLORS["error"]
        elif is_success:
            bg_color = f"{COLORS['success']}15"
            text_color = COLORS["text_primary"]
            align = ft.MainAxisAlignment.START
            icon = ft.Icons.CHECK_CIRCLE_OUTLINE
            icon_color = COLORS["success"]
        elif is_action:
            bg_color = f"{COLORS['accent_cyan']}15"
            text_color = COLORS["text_primary"]
            align = ft.MainAxisAlignment.START
            icon = ft.Icons.TOUCH_APP
            icon_color = COLORS["accent_cyan"]
        elif is_thinking:
            bg_color = f"{COLORS['accent_purple']}15"
            text_color = COLORS["text_primary"]
            align = ft.MainAxisAlignment.START
            icon = ft.Icons.PSYCHOLOGY
            icon_color = COLORS["accent_purple"]
        elif is_system:
            bg_color = COLORS["bg_tertiary"]
            text_color = COLORS["text_secondary"]
            align = ft.MainAxisAlignment.CENTER
            icon = ft.Icons.INFO_OUTLINE
            icon_color = COLORS["text_muted"]
        else:  # Agent message
            bg_color = COLORS["bg_card"]
            text_color = COLORS["text_primary"]
            align = ft.MainAxisAlignment.START
            icon = ft.Icons.SMART_TOY
            icon_color = COLORS["primary"]

        # Time string
        time_str = message.timestamp.strftime("%H:%M")

        # Build message content
        if is_user:
            # User message - right aligned, no avatar
            bubble = ft.Container(
                content=ft.Column(
                    [
                        ft.Text(
                            message.content,
                            size=14,
                            color=text_color,
                        ),
                        ft.Container(height=4),
                        ft.Text(
                            time_str,
                            size=10,
                            color=f"{text_color}80",
                        ),
                    ],
                    spacing=0,
                ),
                bgcolor=bg_color,
                border_radius=ft.border_radius.only(
                    top_left=RADIUS["lg"],
                    top_right=4,
                    bottom_left=RADIUS["lg"],
                    bottom_right=RADIUS["lg"],
                ),
                padding=ft.padding.symmetric(horizontal=16, vertical=12),
                max_width=500,
            )
            return ft.Row([bubble], alignment=align)

        elif is_system:
            # System message - centered, small
            return ft.Row(
                [
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(icon, size=14, color=icon_color),
                                ft.Container(width=6),
                                ft.Text(
                                    message.content,
                                    size=12,
                                    color=text_color,
                                ),
                            ],
                        ),
                        padding=ft.padding.symmetric(horizontal=12, vertical=6),
                        border_radius=RADIUS["full"],
                        bgcolor=bg_color,
                    ),
                ],
                alignment=align,
            )

        else:
            # Agent/Action/Thinking message - left aligned with avatar
            # Step badge if available
            step_badge = None
            if message.step:
                step_badge = ft.Container(
                    content=ft.Text(
                        f"Step {message.step}",
                        size=10,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["text_inverse"],
                    ),
                    padding=ft.padding.symmetric(horizontal=8, vertical=3),
                    border_radius=RADIUS["sm"],
                    bgcolor=COLORS["primary"],
                )

            # Action type badge
            action_badge = None
            if message.action_type:
                action_badge = ft.Container(
                    content=ft.Text(
                        message.action_type,
                        size=10,
                        weight=ft.FontWeight.W_500,
                        color=COLORS["accent_cyan"],
                    ),
                    padding=ft.padding.symmetric(horizontal=8, vertical=3),
                    border_radius=RADIUS["sm"],
                    bgcolor=f"{COLORS['accent_cyan']}20",
                )

            # Header with badges
            header_items = [
                ft.Text(
                    "AI Agent" if message.type == MessageType.AGENT else message.type.value.title(),
                    size=12,
                    weight=ft.FontWeight.W_600,
                    color=icon_color,
                ),
            ]
            if step_badge:
                header_items.extend([ft.Container(width=8), step_badge])
            if action_badge:
                header_items.extend([ft.Container(width=8), action_badge])
            header_items.extend([
                ft.Container(width=8),
                ft.Text(time_str, size=10, color=COLORS["text_muted"]),
            ])

            # Streaming indicator
            content_items = [
                ft.Text(
                    message.content,
                    size=14,
                    color=text_color,
                ),
            ]
            if message.is_streaming:
                content_items.append(
                    ft.Container(
                        content=ft.ProgressRing(
                            width=14,
                            height=14,
                            stroke_width=2,
                            color=icon_color,
                        ),
                        margin=ft.margin.only(left=8),
                    )
                )

            bubble = ft.Container(
                content=ft.Column(
                    [
                        ft.Row(header_items),
                        ft.Container(height=6),
                        ft.Row(content_items) if message.is_streaming else content_items[0],
                    ],
                    spacing=0,
                ),
                bgcolor=bg_color,
                border_radius=ft.border_radius.only(
                    top_left=4,
                    top_right=RADIUS["lg"],
                    bottom_left=RADIUS["lg"],
                    bottom_right=RADIUS["lg"],
                ),
                padding=ft.padding.symmetric(horizontal=16, vertical=12),
                border=ft.border.all(1, COLORS["border"]) if not is_error and not is_success and not is_action and not is_thinking else None,
                max_width=600,
            )

            return ft.Row(
                [
                    # Avatar
                    ft.Container(
                        content=ft.Icon(icon, size=18, color=icon_color),
                        width=36,
                        height=36,
                        border_radius=RADIUS["md"],
                        bgcolor=f"{icon_color}20",
                        alignment=ft.Alignment(0, 0),
                    ),
                    ft.Container(width=12),
                    bubble,
                ],
                alignment=align,
                vertical_alignment=ft.CrossAxisAlignment.START,
            )

    def _add_message(self, msg_type: MessageType, content: str, step: int = None, action_type: str = None, streaming: bool = False):
        """Add a message to the chat."""
        message = ChatMessage(
            type=msg_type,
            content=content,
            timestamp=datetime.now(),
            step=step,
            action_type=action_type,
            is_streaming=streaming,
        )
        self.messages.append(message)

        # Clear welcome message if first real message
        if len(self.messages) == 1:
            self.chat_container.controls.clear()

        bubble = self._build_message_bubble(message)
        self.chat_container.controls.append(bubble)

        if self.page:
            self.chat_container.update()
            self.chat_container.scroll_to(offset=-1, duration=200)

        return len(self.messages) - 1  # Return index for updating

    def _update_message(self, index: int, content: str = None, streaming: bool = None):
        """Update an existing message."""
        if 0 <= index < len(self.messages):
            msg = self.messages[index]
            if content is not None:
                msg.content = content
            if streaming is not None:
                msg.is_streaming = streaming

            # Rebuild the bubble
            bubble = self._build_message_bubble(msg)
            # Account for welcome message clearing
            ctrl_index = index
            if ctrl_index < len(self.chat_container.controls):
                self.chat_container.controls[ctrl_index] = bubble
                if self.page:
                    self.chat_container.update()

    def _set_input(self, text: str):
        """Set input field text."""
        self.input_field.value = text
        if self.page:
            self.input_field.update()
            self.input_field.focus()

    async def _on_send(self, e):
        """Handle send button click."""
        if self.is_running:
            return

        text = self.input_field.value
        if not text or not text.strip():
            return

        # Check device selected
        if not self.selected_device:
            self.toast.warning("Please select a device first")
            return

        # Clear input
        self.input_field.value = ""
        self.input_field.update()

        # Add user message
        self._add_message(MessageType.USER, text.strip())

        # Run agent
        self.page.run_task(self._run_agent, text.strip())

    async def _on_device_change(self, e):
        """Handle device selection change."""
        self.selected_device = e.data if e.data else None
        if self.selected_device:
            self._add_message(MessageType.SYSTEM, f"Device selected: {self.selected_device}")

    def _on_settings(self, e):
        """Handle settings button click."""
        self._show_settings_dialog()

    def _show_settings_dialog(self):
        """Show agent settings dialog."""
        def close_dialog(e):
            dialog.open = False
            self.page.update()

        def save_settings(e):
            try:
                self.max_steps = int(max_steps_field.value) if max_steps_field.value else 30
                self.toast.success("Settings saved")
                close_dialog(e)
            except ValueError:
                self.toast.error("Invalid max steps value")

        max_steps_field = ft.TextField(
            value=str(self.max_steps),
            label="Max Steps",
            hint_text="Maximum steps per execution",
            border_color=COLORS["border"],
            focused_border_color=COLORS["primary"],
            bgcolor=COLORS["bg_tertiary"],
            border_radius=RADIUS["md"],
            text_style=ft.TextStyle(color=COLORS["text_primary"]),
            label_style=ft.TextStyle(color=COLORS["text_secondary"]),
            width=200,
        )

        dialog = ft.AlertDialog(
            modal=True,
            title=ft.Row(
                [
                    ft.Icon(ft.Icons.TUNE, size=24, color=COLORS["primary"]),
                    ft.Container(width=12),
                    ft.Text(
                        "Agent Settings",
                        size=18,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["text_primary"],
                    ),
                    ft.Container(expand=True),
                    ft.IconButton(
                        icon=ft.Icons.CLOSE,
                        icon_color=COLORS["text_muted"],
                        icon_size=20,
                        on_click=close_dialog,
                    ),
                ],
            ),
            content=ft.Container(
                content=ft.Column(
                    [
                        ft.Text(
                            "Execution Settings",
                            size=14,
                            weight=ft.FontWeight.W_600,
                            color=COLORS["text_primary"],
                        ),
                        ft.Container(height=12),
                        max_steps_field,
                        ft.Container(height=8),
                        ft.Text(
                            "Maximum number of steps the agent will execute before stopping.",
                            size=12,
                            color=COLORS["text_muted"],
                        ),
                        ft.Container(height=20),
                        ft.Text(
                            "Model Settings",
                            size=14,
                            weight=ft.FontWeight.W_600,
                            color=COLORS["text_primary"],
                        ),
                        ft.Container(height=12),
                        ft.Container(
                            content=ft.Row(
                                [
                                    ft.Icon(ft.Icons.AUTO_AWESOME, size=20, color=COLORS["accent_purple"]),
                                    ft.Container(width=12),
                                    ft.Column(
                                        [
                                            ft.Text(
                                                "GPT-4 Vision",
                                                size=13,
                                                weight=ft.FontWeight.W_500,
                                                color=COLORS["text_primary"],
                                            ),
                                            ft.Text(
                                                "Best for complex visual tasks",
                                                size=11,
                                                color=COLORS["text_muted"],
                                            ),
                                        ],
                                        spacing=2,
                                        expand=True,
                                    ),
                                    ft.Icon(ft.Icons.CHECK_CIRCLE, size=20, color=COLORS["primary"]),
                                ],
                            ),
                            padding=12,
                            border_radius=RADIUS["md"],
                            bgcolor=COLORS["primary_glow"],
                            border=ft.border.all(1, COLORS["primary"]),
                        ),
                    ],
                    spacing=0,
                ),
                width=350,
                padding=ft.padding.only(bottom=10),
            ),
            actions=[
                ft.TextButton("Cancel", on_click=close_dialog),
                ft.ElevatedButton(
                    "Save",
                    bgcolor=COLORS["primary"],
                    color=COLORS["text_inverse"],
                    on_click=save_settings,
                ),
            ],
            actions_alignment=ft.MainAxisAlignment.END,
            bgcolor=COLORS["bg_card"],
            shape=ft.RoundedRectangleBorder(radius=RADIUS["lg"]),
        )

        self.page.overlay.append(dialog)
        dialog.open = True
        self.page.update()

    def _on_clear_chat(self, e):
        """Clear all chat messages."""
        self.messages.clear()
        self.chat_container.controls = self._build_welcome_message()
        self.chat_container.update()
        self.toast.info("Chat cleared")

    async def _run_agent(self, goal: str):
        """Run the agent with the given goal with enhanced visual feedback."""
        self.is_running = True
        self.should_stop = False
        self.current_step = 0

        # Update UI - switch buttons and show execution status
        self._show_execution_mode()

        # Add thinking message
        thinking_idx = self._add_message(
            MessageType.THINKING,
            "Analyzing your request...",
            streaming=True,
        )

        try:
            # Import agent
            from agents import Agent, load_env

            load_env('.env')

            self._update_progress("Initializing agent...", 0)
            self._update_message(thinking_idx, "Initializing agent...", streaming=True)
            await asyncio.sleep(0.5)

            agent = Agent(device=self.selected_device, debug=False)

            self._update_message(thinking_idx, "Agent ready! Starting execution...", streaming=False)
            self._update_progress("Agent ready", 0)

            # Add system message
            self._add_message(
                MessageType.SYSTEM,
                f"Running on {self.selected_device} | Max {self.max_steps} steps",
            )

            # Run with logging
            result = await self._run_with_chat_logging(agent, goal)

            if result.success:
                self._add_message(
                    MessageType.SUCCESS,
                    f"Task completed successfully in {result.total_steps} steps ({result.execution_time:.1f}s)",
                )
            else:
                if self.should_stop:
                    self._add_message(
                        MessageType.SYSTEM,
                        "Agent stopped by user",
                    )
                else:
                    self._add_message(
                        MessageType.ERROR,
                        f"Task failed: {result.message}",
                    )

        except ImportError:
            self._update_message(thinking_idx, "Agent module not available. Using demo mode.", streaming=False)
            await self._demo_run(goal)

        except Exception as ex:
            self._add_message(MessageType.ERROR, f"Error: {str(ex)}")

        finally:
            self._hide_execution_mode()

    def _show_execution_mode(self):
        """Switch to execution mode UI."""
        self.send_button.visible = False
        self.stop_button.visible = True
        self.execution_status_container.visible = True
        self._update_progress("Starting...", 0)
        if self.page:
            self.send_button.update()
            self.stop_button.update()
            self.execution_status_container.update()

    def _hide_execution_mode(self):
        """Switch back to normal mode UI."""
        self.is_running = False
        self.send_button.visible = True
        self.stop_button.visible = False
        self.execution_status_container.visible = False
        if self.page:
            self.send_button.update()
            self.stop_button.update()
            self.execution_status_container.update()

    def _update_progress(self, message: str, step: int = None):
        """Update execution progress display."""
        if self.progress_text:
            self.progress_text.value = message
            self.progress_text.update()

        # Update step counter
        if step is not None and self.execution_status_container:
            step_text = self.execution_status_container.content.controls[-1].content
            step_text.value = f"{step}/{self.max_steps} steps"
            step_text.update()

    async def _demo_run(self, goal: str):
        """Demo run without actual agent with enhanced progress feedback."""
        steps = [
            ("Analyzing screen content...", "thinking"),
            ("Found home screen with app icons", "agent"),
            ("Tapping on target app...", "action", "tap"),
            ("App launched successfully", "success"),
            ("Navigating to desired section...", "action", "scroll"),
            ("Task completed!", "success"),
        ]

        for i, step_data in enumerate(steps):
            if self.should_stop:
                break

            await asyncio.sleep(1)

            content = step_data[0]
            msg_type = step_data[1]
            action = step_data[2] if len(step_data) > 2 else None

            # Update progress
            self._update_progress(content[:40] + "..." if len(content) > 40 else content, i + 1)

            if msg_type == "thinking":
                self._add_message(MessageType.THINKING, content, step=i+1)
            elif msg_type == "agent":
                self._add_message(MessageType.AGENT, content, step=i+1)
            elif msg_type == "action":
                self._add_message(MessageType.ACTION, content, step=i+1, action_type=action)
            elif msg_type == "success":
                self._add_message(MessageType.SUCCESS, content)

    async def _on_stop(self, e):
        """Handle stop button click."""
        if self.is_running:
            self.should_stop = True
            self._add_message(MessageType.SYSTEM, "Stopping agent...")

    async def _run_with_chat_logging(self, agent, goal: str):
        """Run agent with chat-style logging and enhanced progress feedback."""
        from agents.core.types import ExecutionResult
        from datetime import datetime

        start_time = datetime.now()
        steps = []
        screenshots = []

        try:
            internal_agent = agent._agent

            for step_num in range(1, self.max_steps + 1):
                if self.should_stop:
                    exec_time = (datetime.now() - start_time).total_seconds()
                    return ExecutionResult(
                        success=False,
                        message="Stopped by user",
                        steps=steps,
                        total_steps=step_num - 1,
                        execution_time=exec_time,
                        screenshots=screenshots,
                    )

                self.current_step = step_num

                # Get state
                state = internal_agent.tools.get_state()

                # Update progress
                self._update_progress(f"Step {step_num}: Capturing screen...", step_num)

                # Take screenshot
                timestamp = datetime.now().strftime("%H%M%S")
                screenshot_path = f"screenshots/agent/step_{step_num}_{timestamp}.png"
                internal_agent.tools.save_screenshot(screenshot_path)
                screenshots.append(screenshot_path)

                # Add thinking message
                thinking_idx = self._add_message(
                    MessageType.THINKING,
                    f"Analyzing screen... (App: {state.phone_state.current_app})",
                    step=step_num,
                    streaming=True,
                )

                self._update_progress(f"Step {step_num}: Analyzing with AI...", step_num)

                # LLM reasoning
                action = await internal_agent._reason(
                    goal=goal,
                    state=state,
                    screenshot_path=screenshot_path,
                    step=step_num,
                    max_steps=self.max_steps,
                    history=steps[-3:] if steps else [],
                )

                # Update with reasoning
                self._update_message(
                    thinking_idx,
                    action.reasoning[:150] + ("..." if len(action.reasoning) > 150 else ""),
                    streaming=False,
                )

                # Add action message
                action_detail = action.action_type
                if action.params:
                    params_str = ", ".join(f"{k}={v}" for k, v in list(action.params.items())[:2])
                    action_detail = f"{action.action_type}({params_str})"

                self._add_message(
                    MessageType.ACTION,
                    f"Executing: {action_detail}",
                    step=step_num,
                    action_type=action.action_type,
                )

                self._update_progress(f"Step {step_num}: Executing {action.action_type}...", step_num)

                # Execute
                success, message = await internal_agent.executor.execute(action)

                # Result message
                if success:
                    self._add_message(MessageType.AGENT, f"Done: {message}", step=step_num)
                else:
                    self._add_message(MessageType.ERROR, f"Failed: {message}", step=step_num)

                # Record step
                from agents.core.types import StepResult
                step_result = StepResult(
                    step=step_num,
                    action=action,
                    success=success,
                    message=message,
                    screenshot_path=screenshot_path,
                )
                steps.append(step_result)

                # Check completion
                if action.action_type == "complete":
                    exec_time = (datetime.now() - start_time).total_seconds()
                    return ExecutionResult(
                        success=action.params.get("success", True),
                        message=action.reasoning,
                        steps=steps,
                        total_steps=step_num,
                        execution_time=exec_time,
                        screenshots=screenshots,
                    )

                await asyncio.sleep(0.5)

            # Max steps reached
            exec_time = (datetime.now() - start_time).total_seconds()
            return ExecutionResult(
                success=False,
                message=f"Max steps ({self.max_steps}) reached",
                steps=steps,
                total_steps=self.max_steps,
                execution_time=exec_time,
                screenshots=screenshots,
            )

        except Exception as e:
            exec_time = (datetime.now() - start_time).total_seconds()
            return ExecutionResult(
                success=False,
                message=str(e),
                steps=steps,
                total_steps=len(steps),
                execution_time=exec_time,
                screenshots=screenshots,
                error=e,
            )

    def refresh(self):
        """Refresh the view."""
        self.controls = self._build_controls()
        self.update()
        # Reload devices and models
        if self.page:
            self.page.run_task(self._initial_load)
