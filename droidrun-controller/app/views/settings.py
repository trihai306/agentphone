"""Professional Settings view for Droidrun Controller."""

import flet as ft
from ..theme import COLORS
from ..components.card import Card
from ..components.action_button import ActionButton, IconButton
from ..services.ai_service import get_ai_service


class SettingsView(ft.Container):
    """Professional view for application settings."""

    def __init__(self, app_state, toast, **kwargs):
        self.app_state = app_state
        self.toast = toast
        self.ai_service = get_ai_service(app_state)
        self.available_models = []
        self.models_loading = False
        self.model_dropdown = None

        super().__init__(
            content=self._build_content(),
            expand=True,
            **kwargs
        )

    def _build_content(self):
        """Build the view content."""
        return ft.Column(
            [
                self._build_header(),
                ft.Container(height=28),
                self._build_api_config(),
                ft.Container(height=20),
                self._build_model_settings(),
                ft.Container(height=20),
                self._build_adb_settings(),
                ft.Container(height=20),
                self._build_recording_settings(),
                ft.Container(height=20),
                self._build_appearance_settings(),
                ft.Container(height=20),
                self._build_about_section(),
            ],
            spacing=0,
            expand=True,
            scroll=ft.ScrollMode.AUTO,
        )

    def _build_header(self):
        """Build the header section."""
        return ft.Row(
            [
                ft.Column(
                    [
                        ft.Row(
                            [
                                ft.Text(
                                    "Settings",
                                    size=28,
                                    weight=ft.FontWeight.W_700,
                                    color=COLORS["text_primary"],
                                ),
                                ft.Container(width=12),
                                ft.Container(
                                    content=ft.Icon(
                                        ft.Icons.SETTINGS,
                                        size=20,
                                        color=COLORS["accent_cyan"],
                                    ),
                                    bgcolor=f"{COLORS['accent_cyan']}20",
                                    border_radius=10,
                                    padding=8,
                                ),
                            ],
                        ),
                        ft.Text(
                            "Configure application preferences and behavior",
                            size=14,
                            color=COLORS["text_secondary"],
                        ),
                    ],
                    spacing=6,
                ),
                ft.Container(expand=True),
                ActionButton(
                    text="Reset Defaults",
                    icon=ft.Icons.RESTORE,
                    variant="ghost",
                    on_click=self._on_reset_defaults,
                ),
                ft.Container(width=12),
                ActionButton(
                    text="Save",
                    icon=ft.Icons.SAVE,
                    variant="primary",
                    on_click=self._on_save,
                ),
            ],
        )

    def _build_api_config(self):
        """Build API configuration section."""
        return Card(
            title="API Configuration",
            subtitle="Configure AI provider API keys",
            icon=ft.Icons.KEY,
            icon_color=COLORS["accent_orange"],
            content=ft.Column(
                [
                    self._build_setting_item(
                        "OpenAI API Key",
                        "Your OpenAI API key for GPT models",
                        ft.Icons.VPN_KEY,
                        ft.TextField(
                            value=self.app_state.get("openai_api_key", ""),
                            hint_text="sk-...",
                            password=True,
                            can_reveal_password=True,
                            border_color=COLORS["border"],
                            focused_border_color=COLORS["accent_orange"],
                            bgcolor=COLORS["bg_tertiary"],
                            color=COLORS["text_primary"],
                            cursor_color=COLORS["accent_orange"],
                            border_radius=10,
                            content_padding=ft.padding.symmetric(horizontal=16, vertical=12),
                            expand=True,
                            on_change=lambda e: self._on_config_change("openai_api_key", e.control.value),
                        ),
                    ),
                    self._build_divider(),
                    self._build_setting_item(
                        "Anthropic API Key",
                        "Your Anthropic API key for Claude models",
                        ft.Icons.VPN_KEY,
                        ft.TextField(
                            value=self.app_state.get("anthropic_api_key", ""),
                            hint_text="sk-ant-...",
                            password=True,
                            can_reveal_password=True,
                            border_color=COLORS["border"],
                            focused_border_color=COLORS["accent_purple"],
                            bgcolor=COLORS["bg_tertiary"],
                            color=COLORS["text_primary"],
                            cursor_color=COLORS["accent_purple"],
                            border_radius=10,
                            content_padding=ft.padding.symmetric(horizontal=16, vertical=12),
                            expand=True,
                            on_change=lambda e: self._on_config_change("anthropic_api_key", e.control.value),
                        ),
                    ),
                    self._build_divider(),
                    self._build_setting_item(
                        "Google AI API Key",
                        "Your Google AI API key for Gemini models",
                        ft.Icons.VPN_KEY,
                        ft.TextField(
                            value=self.app_state.get("google_api_key", ""),
                            hint_text="AIza...",
                            password=True,
                            can_reveal_password=True,
                            border_color=COLORS["border"],
                            focused_border_color=COLORS["primary"],
                            bgcolor=COLORS["bg_tertiary"],
                            color=COLORS["text_primary"],
                            cursor_color=COLORS["primary"],
                            border_radius=10,
                            content_padding=ft.padding.symmetric(horizontal=16, vertical=12),
                            expand=True,
                            on_change=lambda e: self._on_config_change("google_api_key", e.control.value),
                        ),
                    ),
                    self._build_divider(),
                    self._build_setting_item(
                        "Custom API Base URL",
                        "Override default API endpoint (optional)",
                        ft.Icons.LINK,
                        ft.TextField(
                            value=self.app_state.get("api_base_url", ""),
                            hint_text="https://api.openai.com/v1",
                            border_color=COLORS["border"],
                            focused_border_color=COLORS["primary"],
                            bgcolor=COLORS["bg_tertiary"],
                            color=COLORS["text_primary"],
                            cursor_color=COLORS["primary"],
                            border_radius=10,
                            content_padding=ft.padding.symmetric(horizontal=16, vertical=12),
                            expand=True,
                            on_change=lambda e: self._on_config_change("api_base_url", e.control.value),
                        ),
                    ),
                ],
                spacing=0,
            ),
        )

    def _build_model_settings(self):
        """Build model configuration section."""
        # Build dropdown with available models or default options
        if self.available_models:
            model_options = [
                ft.dropdown.Option(m["id"], f"{m['name']} ({m['provider']})")
                for m in self.available_models
            ]
        else:
            # Default options when models haven't been fetched yet
            model_options = [
                ft.dropdown.Option("gpt-4", "GPT-4 (OpenAI)"),
                ft.dropdown.Option("gpt-4-turbo", "GPT-4 Turbo (OpenAI)"),
                ft.dropdown.Option("gpt-3.5-turbo", "GPT-3.5 Turbo (OpenAI)"),
                ft.dropdown.Option("claude-3-opus-20240229", "Claude 3 Opus (Anthropic)"),
                ft.dropdown.Option("claude-3-5-sonnet-20241022", "Claude 3.5 Sonnet (Anthropic)"),
                ft.dropdown.Option("gemini-pro", "Gemini Pro (Google)"),
            ]

        self.model_dropdown = ft.Dropdown(
            value=self.app_state.get("default_model", "gpt-4"),
            options=model_options,
            border_color=COLORS["border"],
            focused_border_color=COLORS["accent_purple"],
            bgcolor=COLORS["bg_tertiary"],
            color=COLORS["text_primary"],
            border_radius=10,
            content_padding=ft.padding.symmetric(horizontal=16, vertical=8),
            width=280,
            on_change=lambda e: self._on_config_change("default_model", e.control.value),
        )

        return Card(
            title="Model Settings",
            subtitle="Configure AI model preferences",
            icon=ft.Icons.SMART_TOY,
            icon_color=COLORS["accent_purple"],
            actions=[
                ActionButton(
                    text="Refresh Models",
                    icon=ft.Icons.REFRESH,
                    variant="ghost",
                    size="small",
                    on_click=self._on_refresh_models,
                ),
            ],
            content=ft.Column(
                [
                    self._build_setting_item(
                        "Default Model",
                        "Primary AI model for automation tasks",
                        ft.Icons.PSYCHOLOGY,
                        ft.Row(
                            [
                                self.model_dropdown,
                                ft.Container(width=8),
                                ft.Container(
                                    content=ft.ProgressRing(
                                        width=20,
                                        height=20,
                                        stroke_width=2,
                                        color=COLORS["accent_purple"],
                                    ) if self.models_loading else ft.Container(),
                                    width=24,
                                    height=24,
                                ),
                            ],
                        ),
                    ),
                    self._build_divider(),
                    self._build_setting_item(
                        "Max Tokens",
                        "Maximum tokens per request",
                        ft.Icons.NUMBERS,
                        ft.TextField(
                            value=str(self.app_state.get("max_tokens", "4096")),
                            border_color=COLORS["border"],
                            focused_border_color=COLORS["accent_purple"],
                            bgcolor=COLORS["bg_tertiary"],
                            color=COLORS["text_primary"],
                            cursor_color=COLORS["accent_purple"],
                            border_radius=10,
                            content_padding=ft.padding.symmetric(horizontal=16, vertical=12),
                            width=120,
                            keyboard_type=ft.KeyboardType.NUMBER,
                            on_change=lambda e: self._on_config_change("max_tokens", e.control.value),
                        ),
                    ),
                    self._build_divider(),
                    self._build_setting_item(
                        "Temperature",
                        "Controls randomness (0.0 - 2.0)",
                        ft.Icons.THERMOSTAT,
                        ft.TextField(
                            value=str(self.app_state.get("temperature", "0.7")),
                            border_color=COLORS["border"],
                            focused_border_color=COLORS["accent_purple"],
                            bgcolor=COLORS["bg_tertiary"],
                            color=COLORS["text_primary"],
                            cursor_color=COLORS["accent_purple"],
                            border_radius=10,
                            content_padding=ft.padding.symmetric(horizontal=16, vertical=12),
                            width=100,
                            on_change=lambda e: self._on_config_change("temperature", e.control.value),
                        ),
                    ),
                    self._build_divider(),
                    self._build_setting_item(
                        "Token Limit Warning",
                        "Warn when approaching monthly token limit",
                        ft.Icons.WARNING_AMBER,
                        ft.TextField(
                            value=str(self.app_state.get("token_limit", "100000")),
                            hint_text="Monthly limit",
                            border_color=COLORS["border"],
                            focused_border_color=COLORS["warning"],
                            bgcolor=COLORS["bg_tertiary"],
                            color=COLORS["text_primary"],
                            cursor_color=COLORS["warning"],
                            border_radius=10,
                            content_padding=ft.padding.symmetric(horizontal=16, vertical=12),
                            width=140,
                            keyboard_type=ft.KeyboardType.NUMBER,
                            on_change=lambda e: self._on_config_change("token_limit", e.control.value),
                        ),
                    ),
                    self._build_divider(),
                    self._build_setting_item(
                        "Enable Streaming",
                        "Stream responses in real-time",
                        ft.Icons.STREAM,
                        ft.Switch(
                            value=self.app_state.get("enable_streaming", True),
                            active_color=COLORS["success"],
                            on_change=lambda e: self._on_config_change("enable_streaming", e.control.value),
                        ),
                    ),
                ],
                spacing=0,
            ),
        )

    def _build_adb_settings(self):
        """Build ADB settings section."""
        return Card(
            title="ADB Configuration",
            subtitle="Android Debug Bridge settings",
            icon=ft.Icons.USB,
            icon_color=COLORS["primary"],
            content=ft.Column(
                [
                    self._build_setting_item(
                        "ADB Path",
                        "Path to ADB executable",
                        ft.Icons.FOLDER,
                        ft.TextField(
                            value=self.app_state.get("adb_path", "adb"),
                            border_color=COLORS["border"],
                            focused_border_color=COLORS["primary"],
                            bgcolor=COLORS["bg_tertiary"],
                            color=COLORS["text_primary"],
                            cursor_color=COLORS["primary"],
                            border_radius=10,
                            content_padding=ft.padding.symmetric(horizontal=16, vertical=12),
                            expand=True,
                        ),
                    ),
                    self._build_divider(),
                    self._build_setting_item(
                        "Auto Discover",
                        "Automatically discover connected devices on startup",
                        ft.Icons.SEARCH,
                        ft.Switch(
                            value=self.app_state.get("auto_discover", True),
                            active_color=COLORS["success"],
                            on_change=self._on_auto_discover_change,
                        ),
                    ),
                    self._build_divider(),
                    self._build_setting_item(
                        "Wireless ADB",
                        "Enable wireless ADB connection over WiFi",
                        ft.Icons.WIFI,
                        ft.Switch(
                            value=self.app_state.get("wireless_adb", False),
                            active_color=COLORS["success"],
                            on_change=self._on_wireless_adb_change,
                        ),
                    ),
                    self._build_divider(),
                    self._build_setting_item(
                        "Default Port",
                        "Default port for wireless ADB connections",
                        ft.Icons.SETTINGS_ETHERNET,
                        ft.TextField(
                            value=self.app_state.get("default_port", "5555"),
                            border_color=COLORS["border"],
                            focused_border_color=COLORS["primary"],
                            bgcolor=COLORS["bg_tertiary"],
                            color=COLORS["text_primary"],
                            cursor_color=COLORS["primary"],
                            border_radius=10,
                            content_padding=ft.padding.symmetric(horizontal=16, vertical=12),
                            width=120,
                        ),
                    ),
                ],
                spacing=0,
            ),
        )

    def _build_recording_settings(self):
        """Build recording settings section."""
        return Card(
            title="Recording",
            subtitle="Workflow recording preferences",
            icon=ft.Icons.FIBER_MANUAL_RECORD,
            icon_color=COLORS["error"],
            content=ft.Column(
                [
                    self._build_setting_item(
                        "Screenshot Quality",
                        "Quality of captured screenshots",
                        ft.Icons.HIGH_QUALITY,
                        ft.Dropdown(
                            value=self.app_state.get("screenshot_quality", "high"),
                            options=[
                                ft.dropdown.Option("low", "Low (Fast)"),
                                ft.dropdown.Option("medium", "Medium"),
                                ft.dropdown.Option("high", "High (Best)"),
                            ],
                            border_color=COLORS["border"],
                            focused_border_color=COLORS["primary"],
                            bgcolor=COLORS["bg_tertiary"],
                            color=COLORS["text_primary"],
                            border_radius=10,
                            content_padding=ft.padding.symmetric(horizontal=16, vertical=8),
                            width=160,
                        ),
                    ),
                    self._build_divider(),
                    self._build_setting_item(
                        "Record Delays",
                        "Include timing between actions for realistic playback",
                        ft.Icons.TIMER,
                        ft.Switch(
                            value=self.app_state.get("record_delays", True),
                            active_color=COLORS["success"],
                            on_change=self._on_record_delays_change,
                        ),
                    ),
                    self._build_divider(),
                    self._build_setting_item(
                        "Auto Save",
                        "Automatically save recordings when stopped",
                        ft.Icons.SAVE_ALT,
                        ft.Switch(
                            value=self.app_state.get("auto_save", True),
                            active_color=COLORS["success"],
                            on_change=self._on_auto_save_change,
                        ),
                    ),
                    self._build_divider(),
                    self._build_setting_item(
                        "Capture Screenshots",
                        "Capture screenshots during recording for documentation",
                        ft.Icons.SCREENSHOT_MONITOR,
                        ft.Switch(
                            value=self.app_state.get("capture_screenshots", True),
                            active_color=COLORS["success"],
                            on_change=self._on_capture_screenshots_change,
                        ),
                    ),
                ],
                spacing=0,
            ),
        )

    def _build_appearance_settings(self):
        """Build appearance settings section."""
        return Card(
            title="Appearance",
            subtitle="Visual preferences",
            icon=ft.Icons.PALETTE,
            icon_color=COLORS["accent_purple"],
            content=ft.Column(
                [
                    self._build_setting_item(
                        "Theme",
                        "Application color theme",
                        ft.Icons.DARK_MODE,
                        ft.Dropdown(
                            value=self.app_state.get("theme", "dark"),
                            options=[
                                ft.dropdown.Option("dark", "Dark"),
                                ft.dropdown.Option("light", "Light"),
                                ft.dropdown.Option("system", "System"),
                            ],
                            border_color=COLORS["border"],
                            focused_border_color=COLORS["primary"],
                            bgcolor=COLORS["bg_tertiary"],
                            color=COLORS["text_primary"],
                            border_radius=10,
                            content_padding=ft.padding.symmetric(horizontal=16, vertical=8),
                            width=140,
                        ),
                    ),
                    self._build_divider(),
                    self._build_setting_item(
                        "Animations",
                        "Enable smooth UI animations",
                        ft.Icons.ANIMATION,
                        ft.Switch(
                            value=self.app_state.get("animations", True),
                            active_color=COLORS["success"],
                            on_change=self._on_animations_change,
                        ),
                    ),
                    self._build_divider(),
                    self._build_setting_item(
                        "Compact Mode",
                        "Use compact layout for smaller screens",
                        ft.Icons.VIEW_COMPACT,
                        ft.Switch(
                            value=self.app_state.get("compact_mode", False),
                            active_color=COLORS["success"],
                            on_change=self._on_compact_mode_change,
                        ),
                    ),
                ],
                spacing=0,
            ),
        )

    def _build_about_section(self):
        """Build about section."""
        return Card(
            title="About",
            subtitle="Application information",
            icon=ft.Icons.INFO,
            icon_color=COLORS["accent_cyan"],
            content=ft.Column(
                [
                    ft.Container(
                        content=ft.Row(
                            [
                                # App logo
                                ft.Container(
                                    content=ft.Icon(
                                        ft.Icons.ANDROID,
                                        size=40,
                                        color=COLORS["primary"],
                                    ),
                                    width=80,
                                    height=80,
                                    border_radius=20,
                                    bgcolor=COLORS["primary_glow"],
                                    alignment=ft.alignment.center,
                                ),
                                ft.Container(width=20),
                                # App info
                                ft.Column(
                                    [
                                        ft.Text(
                                            "Droidrun Controller",
                                            size=20,
                                            weight=ft.FontWeight.W_700,
                                            color=COLORS["text_primary"],
                                        ),
                                        ft.Container(
                                            content=ft.Text(
                                                "v0.1.0",
                                                size=11,
                                                weight=ft.FontWeight.W_600,
                                                color=COLORS["primary"],
                                            ),
                                            bgcolor=COLORS["primary_glow"],
                                            border_radius=6,
                                            padding=ft.padding.symmetric(horizontal=8, vertical=3),
                                        ),
                                        ft.Container(height=4),
                                        ft.Text(
                                            "Professional Android phone automation with workflow management",
                                            size=13,
                                            color=COLORS["text_secondary"],
                                        ),
                                    ],
                                    spacing=6,
                                ),
                            ],
                        ),
                        padding=ft.padding.symmetric(vertical=8),
                    ),
                    ft.Container(height=20),
                    ft.Row(
                        [
                            ActionButton(
                                text="Check Updates",
                                icon=ft.Icons.SYSTEM_UPDATE,
                                variant="secondary",
                                on_click=self._on_check_updates,
                            ),
                            ft.Container(width=12),
                            ActionButton(
                                text="View Logs",
                                icon=ft.Icons.DESCRIPTION,
                                variant="ghost",
                                on_click=self._on_view_logs,
                            ),
                            ft.Container(width=12),
                            ActionButton(
                                text="GitHub",
                                icon=ft.Icons.CODE,
                                variant="ghost",
                                on_click=self._on_github,
                            ),
                        ],
                    ),
                ],
                spacing=0,
            ),
        )

    def _build_divider(self):
        """Build a styled divider."""
        return ft.Container(
            content=ft.Divider(color=COLORS["border"], height=1),
            padding=ft.padding.symmetric(vertical=12),
        )

    def _build_setting_item(
        self,
        title: str,
        description: str,
        icon: str,
        control: ft.Control,
    ):
        """Build a setting item row with icon."""
        return ft.Row(
            [
                ft.Container(
                    content=ft.Icon(
                        icon,
                        size=20,
                        color=COLORS["text_muted"],
                    ),
                    width=40,
                    height=40,
                    border_radius=10,
                    bgcolor=COLORS["bg_tertiary"],
                    alignment=ft.alignment.center,
                ),
                ft.Container(width=16),
                ft.Column(
                    [
                        ft.Text(
                            title,
                            size=15,
                            weight=ft.FontWeight.W_500,
                            color=COLORS["text_primary"],
                        ),
                        ft.Text(
                            description,
                            size=13,
                            color=COLORS["text_secondary"],
                        ),
                    ],
                    spacing=4,
                    expand=True,
                ),
                control,
            ],
            alignment=ft.MainAxisAlignment.START,
        )

    def _on_auto_discover_change(self, e):
        """Handle auto discover toggle."""
        self.app_state["auto_discover"] = e.control.value
        self.toast.success("Auto discover " + ("enabled" if e.control.value else "disabled"))

    def _on_wireless_adb_change(self, e):
        """Handle wireless ADB toggle."""
        self.app_state["wireless_adb"] = e.control.value
        self.toast.success("Wireless ADB " + ("enabled" if e.control.value else "disabled"))

    def _on_record_delays_change(self, e):
        """Handle record delays toggle."""
        self.app_state["record_delays"] = e.control.value
        self.toast.success("Record delays " + ("enabled" if e.control.value else "disabled"))

    def _on_auto_save_change(self, e):
        """Handle auto save toggle."""
        self.app_state["auto_save"] = e.control.value
        self.toast.success("Auto save " + ("enabled" if e.control.value else "disabled"))

    def _on_capture_screenshots_change(self, e):
        """Handle capture screenshots toggle."""
        self.app_state["capture_screenshots"] = e.control.value
        self.toast.success("Capture screenshots " + ("enabled" if e.control.value else "disabled"))

    def _on_animations_change(self, e):
        """Handle animations toggle."""
        self.app_state["animations"] = e.control.value
        self.toast.success("Animations " + ("enabled" if e.control.value else "disabled"))

    def _on_compact_mode_change(self, e):
        """Handle compact mode toggle."""
        self.app_state["compact_mode"] = e.control.value
        self.toast.success("Compact mode " + ("enabled" if e.control.value else "disabled"))

    def _on_config_change(self, key: str, value):
        """Handle config value change."""
        self.app_state[key] = value
        # Auto-save would happen here in production

    async def _on_refresh_models(self, e):
        """Handle refresh models button click."""
        self.toast.info("Fetching available models...")
        await self.load_models()

    async def load_models(self):
        """Load models from AI providers."""
        self.models_loading = True
        self.content = self._build_content()
        self.update()

        try:
            self.available_models = await self.ai_service.fetch_all_models()
            if self.available_models:
                self.toast.success(f"Found {len(self.available_models)} models")
            else:
                self.toast.warning("No models found. Check your API keys.")
        except Exception as ex:
            self.toast.error(f"Failed to fetch models: {ex}")
        finally:
            self.models_loading = False
            self.content = self._build_content()
            self.update()

    async def _on_reset_defaults(self, e):
        """Handle reset defaults button."""
        self.toast.warning("Reset all settings to defaults?")

    async def _on_save(self, e):
        """Handle save button."""
        self.toast.success("Settings saved")

    async def _on_check_updates(self, e):
        """Handle check updates button."""
        self.toast.info("Checking for updates...")

    async def _on_view_logs(self, e):
        """Handle view logs button."""
        self.toast.info("Opening logs...")

    async def _on_github(self, e):
        """Handle GitHub button."""
        self.toast.info("Opening GitHub repository...")

    def refresh(self):
        """Refresh the view."""
        self.content = self._build_content()
        self.update()
