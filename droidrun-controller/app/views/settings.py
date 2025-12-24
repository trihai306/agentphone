"""Professional Settings view for Droidrun Controller - 2025 Edition.

Polished with improved form styling, better section organization, and enhanced toggle switches.
"""

import flet as ft
from ..theme import COLORS, RADIUS, get_shadow, ANIMATION
from ..components.card import Card
from ..components.action_button import ActionButton, IconButton
from ..services.ai_service import get_ai_service


# Animation curve for smooth transitions
EASE_OUT = ft.AnimationCurve.EASE_OUT


class SettingsView(ft.Container):
    """Professional view for application settings with polished UI."""

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
                ft.Container(height=24),
                self._build_model_settings(),
                ft.Container(height=24),
                self._build_adb_settings(),
                ft.Container(height=24),
                self._build_recording_settings(),
                ft.Container(height=24),
                self._build_appearance_settings(),
                ft.Container(height=24),
                self._build_about_section(),
                ft.Container(height=40),
            ],
            spacing=0,
            expand=True,
            scroll=ft.ScrollMode.AUTO,
        )

    def _build_header(self):
        """Build the polished header section with enhanced styling."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Column(
                        [
                            ft.Row(
                                [
                                    ft.Text(
                                        "Settings",
                                        size=32,
                                        weight=ft.FontWeight.W_800,
                                        color=COLORS["text_primary"],
                                    ),
                                    ft.Container(width=16),
                                    ft.Container(
                                        content=ft.Icon(
                                            ft.Icons.SETTINGS_ROUNDED,
                                            size=22,
                                            color=COLORS["accent_cyan"],
                                        ),
                                        width=44,
                                        height=44,
                                        bgcolor=f"{COLORS['accent_cyan']}12",
                                        border_radius=RADIUS["lg"],
                                        alignment=ft.alignment.center,
                                        border=ft.border.all(1, f"{COLORS['accent_cyan']}20"),
                                        shadow=ft.BoxShadow(
                                            spread_radius=0,
                                            blur_radius=16,
                                            color=f"{COLORS['accent_cyan']}25",
                                            offset=ft.Offset(0, 4),
                                        ),
                                    ),
                                ],
                                vertical_alignment=ft.CrossAxisAlignment.CENTER,
                            ),
                            ft.Container(height=4),
                            ft.Text(
                                "Configure application preferences and behavior",
                                size=14,
                                weight=ft.FontWeight.W_400,
                                color=COLORS["text_secondary"],
                            ),
                        ],
                        spacing=4,
                    ),
                    ft.Container(expand=True),
                    # Action buttons
                    ft.Row(
                        [
                            ft.Container(
                                content=ft.Row(
                                    [
                                        ft.Container(
                                            content=ft.Icon(
                                                ft.Icons.RESTORE_ROUNDED,
                                                size=16,
                                                color=COLORS["text_secondary"],
                                            ),
                                            width=32,
                                            height=32,
                                            bgcolor=COLORS["bg_tertiary"],
                                            border_radius=RADIUS["sm"],
                                            alignment=ft.alignment.center,
                                        ),
                                        ft.Container(width=10),
                                        ft.Text(
                                            "Reset Defaults",
                                            size=13,
                                            weight=ft.FontWeight.W_500,
                                            color=COLORS["text_secondary"],
                                        ),
                                    ],
                                ),
                                bgcolor=COLORS["bg_card"],
                                padding=ft.padding.only(left=8, right=18, top=10, bottom=10),
                                border_radius=RADIUS["lg"],
                                border=ft.border.all(1, COLORS["border"]),
                                animate=ft.Animation(ANIMATION["normal"], EASE_OUT),
                                animate_scale=ft.Animation(ANIMATION["normal"], EASE_OUT),
                                on_click=self._on_reset_defaults,
                                on_hover=self._on_ghost_button_hover,
                            ),
                            ft.Container(width=12),
                            ft.Container(
                                content=ft.Row(
                                    [
                                        ft.Container(
                                            content=ft.Icon(
                                                ft.Icons.SAVE_ROUNDED,
                                                size=16,
                                                color=COLORS["text_inverse"],
                                            ),
                                            width=32,
                                            height=32,
                                            bgcolor=f"{COLORS['primary_dark']}40",
                                            border_radius=RADIUS["sm"],
                                            alignment=ft.alignment.center,
                                        ),
                                        ft.Container(width=10),
                                        ft.Text(
                                            "Save Changes",
                                            size=13,
                                            weight=ft.FontWeight.W_600,
                                            color=COLORS["text_inverse"],
                                        ),
                                    ],
                                ),
                                bgcolor=COLORS["primary"],
                                padding=ft.padding.only(left=8, right=18, top=10, bottom=10),
                                border_radius=RADIUS["lg"],
                                shadow=ft.BoxShadow(
                                    spread_radius=0,
                                    blur_radius=20,
                                    color=f"{COLORS['primary']}40",
                                    offset=ft.Offset(0, 6),
                                ),
                                animate=ft.Animation(ANIMATION["normal"], EASE_OUT),
                                animate_scale=ft.Animation(ANIMATION["normal"], EASE_OUT),
                                on_click=self._on_save,
                                on_hover=self._on_primary_button_hover,
                            ),
                        ],
                        spacing=0,
                    ),
                ],
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.only(bottom=8),
        )

    def _build_section_header(self, title: str, subtitle: str, icon: str, color: str):
        """Build a polished section header with icon container."""
        return ft.Row(
            [
                ft.Container(
                    content=ft.Icon(
                        icon,
                        size=20,
                        color=color,
                    ),
                    width=44,
                    height=44,
                    border_radius=RADIUS["lg"],
                    bgcolor=f"{color}12",
                    alignment=ft.alignment.center,
                    border=ft.border.all(1, f"{color}20"),
                    shadow=ft.BoxShadow(
                        spread_radius=0,
                        blur_radius=12,
                        color=f"{color}20",
                        offset=ft.Offset(0, 4),
                    ),
                ),
                ft.Container(width=16),
                ft.Column(
                    [
                        ft.Text(
                            title,
                            size=17,
                            weight=ft.FontWeight.W_700,
                            color=COLORS["text_primary"],
                        ),
                        ft.Text(
                            subtitle,
                            size=12,
                            weight=ft.FontWeight.W_400,
                            color=COLORS["text_secondary"],
                        ),
                    ],
                    spacing=2,
                    expand=True,
                ),
            ],
            vertical_alignment=ft.CrossAxisAlignment.CENTER,
        )

    def _build_api_config(self):
        """Build API configuration section with polished styling."""
        return ft.Container(
            content=ft.Column(
                [
                    self._build_section_header(
                        "API Configuration",
                        "Configure AI provider API keys",
                        ft.Icons.KEY_ROUNDED,
                        COLORS["accent_orange"],
                    ),
                    ft.Container(height=24),
                    self._build_polished_field(
                        "OpenAI API Key",
                        "Your OpenAI API key for GPT models",
                        ft.Icons.VPN_KEY_ROUNDED,
                        COLORS["accent_orange"],
                        self._build_api_input(
                            value=self.app_state.get("openai_api_key", ""),
                            hint="sk-...",
                            color=COLORS["accent_orange"],
                            key="openai_api_key",
                            is_password=True,
                        ),
                    ),
                    self._build_polished_divider(),
                    self._build_polished_field(
                        "Anthropic API Key",
                        "Your Anthropic API key for Claude models",
                        ft.Icons.VPN_KEY_ROUNDED,
                        COLORS["accent_purple"],
                        self._build_api_input(
                            value=self.app_state.get("anthropic_api_key", ""),
                            hint="sk-ant-...",
                            color=COLORS["accent_purple"],
                            key="anthropic_api_key",
                            is_password=True,
                        ),
                    ),
                    self._build_polished_divider(),
                    self._build_polished_field(
                        "Google AI API Key",
                        "Your Google AI API key for Gemini models",
                        ft.Icons.VPN_KEY_ROUNDED,
                        COLORS["primary"],
                        self._build_api_input(
                            value=self.app_state.get("google_api_key", ""),
                            hint="AIza...",
                            color=COLORS["primary"],
                            key="google_api_key",
                            is_password=True,
                        ),
                    ),
                    self._build_polished_divider(),
                    self._build_polished_field(
                        "Custom API Base URL",
                        "Override default API endpoint (optional)",
                        ft.Icons.LINK_ROUNDED,
                        COLORS["accent_cyan"],
                        self._build_api_input(
                            value=self.app_state.get("api_base_url", ""),
                            hint="https://api.openai.com/v1",
                            color=COLORS["accent_cyan"],
                            key="api_base_url",
                            is_password=False,
                        ),
                    ),
                ],
                spacing=0,
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["xl"],
            padding=28,
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("xs"),
            animate=ft.Animation(ANIMATION["normal"], EASE_OUT),
        )

    def _build_api_input(self, value: str, hint: str, color: str, key: str, is_password: bool = False):
        """Build a polished API input field."""
        return ft.Container(
            content=ft.TextField(
                value=value,
                hint_text=hint,
                password=is_password,
                can_reveal_password=is_password,
                border_color=COLORS["border"],
                focused_border_color=color,
                bgcolor=COLORS["bg_input"],
                color=COLORS["text_primary"],
                hint_style=ft.TextStyle(color=COLORS["text_muted"], size=13),
                cursor_color=color,
                border_radius=RADIUS["md"],
                content_padding=ft.padding.symmetric(horizontal=16, vertical=14),
                text_size=14,
                on_change=lambda e: self._on_config_change(key, e.control.value),
            ),
            expand=True,
            animate=ft.Animation(ANIMATION["fast"], EASE_OUT),
        )

    def _build_model_settings(self):
        """Build model configuration section with polished styling."""
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
            bgcolor=COLORS["bg_input"],
            color=COLORS["text_primary"],
            border_radius=RADIUS["md"],
            content_padding=ft.padding.symmetric(horizontal=16, vertical=10),
            width=300,
            text_size=14,
            on_change=lambda e: self._on_config_change("default_model", e.control.value),
        )

        return ft.Container(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            self._build_section_header(
                                "Model Settings",
                                "Configure AI model preferences",
                                ft.Icons.SMART_TOY_ROUNDED,
                                COLORS["accent_purple"],
                            ),
                            ft.Container(expand=True),
                            ft.Container(
                                content=ft.Row(
                                    [
                                        ft.Icon(
                                            ft.Icons.REFRESH_ROUNDED,
                                            size=16,
                                            color=COLORS["accent_purple"],
                                        ),
                                        ft.Container(width=8),
                                        ft.Text(
                                            "Refresh Models",
                                            size=12,
                                            weight=ft.FontWeight.W_500,
                                            color=COLORS["accent_purple"],
                                        ),
                                    ],
                                ),
                                padding=ft.padding.symmetric(horizontal=14, vertical=8),
                                border_radius=RADIUS["md"],
                                bgcolor=f"{COLORS['accent_purple']}12",
                                border=ft.border.all(1, f"{COLORS['accent_purple']}25"),
                                animate=ft.Animation(ANIMATION["fast"], EASE_OUT),
                                on_click=self._on_refresh_models,
                                on_hover=self._on_accent_button_hover,
                                data={"color": COLORS["accent_purple"]},
                            ),
                        ],
                    ),
                    ft.Container(height=24),
                    self._build_polished_field(
                        "Default Model",
                        "Primary AI model for automation tasks",
                        ft.Icons.PSYCHOLOGY_ROUNDED,
                        COLORS["accent_purple"],
                        ft.Row(
                            [
                                self.model_dropdown,
                                ft.Container(width=12),
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
                    self._build_polished_divider(),
                    self._build_polished_field(
                        "Max Tokens",
                        "Maximum tokens per request",
                        ft.Icons.NUMBERS_ROUNDED,
                        COLORS["accent_purple"],
                        self._build_number_input(
                            value=str(self.app_state.get("max_tokens", "4096")),
                            color=COLORS["accent_purple"],
                            key="max_tokens",
                            width=140,
                        ),
                    ),
                    self._build_polished_divider(),
                    self._build_polished_field(
                        "Temperature",
                        "Controls randomness (0.0 - 2.0)",
                        ft.Icons.THERMOSTAT_ROUNDED,
                        COLORS["accent_purple"],
                        self._build_number_input(
                            value=str(self.app_state.get("temperature", "0.7")),
                            color=COLORS["accent_purple"],
                            key="temperature",
                            width=120,
                        ),
                    ),
                    self._build_polished_divider(),
                    self._build_polished_field(
                        "Token Limit Warning",
                        "Warn when approaching monthly token limit",
                        ft.Icons.WARNING_AMBER_ROUNDED,
                        COLORS["warning"],
                        self._build_number_input(
                            value=str(self.app_state.get("token_limit", "100000")),
                            color=COLORS["warning"],
                            key="token_limit",
                            width=160,
                            hint="Monthly limit",
                        ),
                    ),
                    self._build_polished_divider(),
                    self._build_polished_field(
                        "Enable Streaming",
                        "Stream responses in real-time",
                        ft.Icons.STREAM_ROUNDED,
                        COLORS["success"],
                        self._build_polished_toggle(
                            value=self.app_state.get("enable_streaming", True),
                            color=COLORS["success"],
                            on_change=lambda e: self._on_config_change("enable_streaming", e.control.value),
                        ),
                    ),
                ],
                spacing=0,
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["xl"],
            padding=28,
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("xs"),
            animate=ft.Animation(ANIMATION["normal"], EASE_OUT),
        )

    def _build_number_input(self, value: str, color: str, key: str, width: int = 120, hint: str = None):
        """Build a polished number input field."""
        return ft.TextField(
            value=value,
            hint_text=hint,
            border_color=COLORS["border"],
            focused_border_color=color,
            bgcolor=COLORS["bg_input"],
            color=COLORS["text_primary"],
            hint_style=ft.TextStyle(color=COLORS["text_muted"], size=13),
            cursor_color=color,
            border_radius=RADIUS["md"],
            content_padding=ft.padding.symmetric(horizontal=16, vertical=14),
            width=width,
            text_size=14,
            keyboard_type=ft.KeyboardType.NUMBER,
            on_change=lambda e: self._on_config_change(key, e.control.value),
        )

    def _build_adb_settings(self):
        """Build ADB settings section with polished styling."""
        return ft.Container(
            content=ft.Column(
                [
                    self._build_section_header(
                        "ADB Configuration",
                        "Android Debug Bridge settings",
                        ft.Icons.USB_ROUNDED,
                        COLORS["primary"],
                    ),
                    ft.Container(height=24),
                    self._build_polished_field(
                        "ADB Path",
                        "Path to ADB executable",
                        ft.Icons.FOLDER_ROUNDED,
                        COLORS["primary"],
                        self._build_api_input(
                            value=self.app_state.get("adb_path", "adb"),
                            hint="/path/to/adb",
                            color=COLORS["primary"],
                            key="adb_path",
                            is_password=False,
                        ),
                    ),
                    self._build_polished_divider(),
                    self._build_polished_field(
                        "Auto Discover",
                        "Automatically discover connected devices on startup",
                        ft.Icons.SEARCH_ROUNDED,
                        COLORS["success"],
                        self._build_polished_toggle(
                            value=self.app_state.get("auto_discover", True),
                            color=COLORS["success"],
                            on_change=self._on_auto_discover_change,
                        ),
                    ),
                    self._build_polished_divider(),
                    self._build_polished_field(
                        "Wireless ADB",
                        "Enable wireless ADB connection over WiFi",
                        ft.Icons.WIFI_ROUNDED,
                        COLORS["accent_cyan"],
                        self._build_polished_toggle(
                            value=self.app_state.get("wireless_adb", False),
                            color=COLORS["accent_cyan"],
                            on_change=self._on_wireless_adb_change,
                        ),
                    ),
                    self._build_polished_divider(),
                    self._build_polished_field(
                        "Default Port",
                        "Default port for wireless ADB connections",
                        ft.Icons.SETTINGS_ETHERNET_ROUNDED,
                        COLORS["primary"],
                        self._build_number_input(
                            value=self.app_state.get("default_port", "5555"),
                            color=COLORS["primary"],
                            key="default_port",
                            width=140,
                        ),
                    ),
                ],
                spacing=0,
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["xl"],
            padding=28,
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("xs"),
            animate=ft.Animation(ANIMATION["normal"], EASE_OUT),
        )

    def _build_recording_settings(self):
        """Build recording settings section with polished styling."""
        return ft.Container(
            content=ft.Column(
                [
                    self._build_section_header(
                        "Recording",
                        "Workflow recording preferences",
                        ft.Icons.FIBER_MANUAL_RECORD_ROUNDED,
                        COLORS["error"],
                    ),
                    ft.Container(height=24),
                    self._build_polished_field(
                        "Screenshot Quality",
                        "Quality of captured screenshots",
                        ft.Icons.HIGH_QUALITY_ROUNDED,
                        COLORS["accent_blue"],
                        ft.Dropdown(
                            value=self.app_state.get("screenshot_quality", "high"),
                            options=[
                                ft.dropdown.Option("low", "Low (Fast)"),
                                ft.dropdown.Option("medium", "Medium"),
                                ft.dropdown.Option("high", "High (Best)"),
                            ],
                            border_color=COLORS["border"],
                            focused_border_color=COLORS["accent_blue"],
                            bgcolor=COLORS["bg_input"],
                            color=COLORS["text_primary"],
                            border_radius=RADIUS["md"],
                            content_padding=ft.padding.symmetric(horizontal=16, vertical=10),
                            width=180,
                            text_size=14,
                            on_change=lambda e: self._on_config_change("screenshot_quality", e.control.value),
                        ),
                    ),
                    self._build_polished_divider(),
                    self._build_polished_field(
                        "Record Delays",
                        "Include timing between actions for realistic playback",
                        ft.Icons.TIMER_ROUNDED,
                        COLORS["warning"],
                        self._build_polished_toggle(
                            value=self.app_state.get("record_delays", True),
                            color=COLORS["warning"],
                            on_change=self._on_record_delays_change,
                        ),
                    ),
                    self._build_polished_divider(),
                    self._build_polished_field(
                        "Auto Save",
                        "Automatically save recordings when stopped",
                        ft.Icons.SAVE_ALT_ROUNDED,
                        COLORS["success"],
                        self._build_polished_toggle(
                            value=self.app_state.get("auto_save", True),
                            color=COLORS["success"],
                            on_change=self._on_auto_save_change,
                        ),
                    ),
                    self._build_polished_divider(),
                    self._build_polished_field(
                        "Capture Screenshots",
                        "Capture screenshots during recording for documentation",
                        ft.Icons.SCREENSHOT_MONITOR_ROUNDED,
                        COLORS["accent_purple"],
                        self._build_polished_toggle(
                            value=self.app_state.get("capture_screenshots", True),
                            color=COLORS["accent_purple"],
                            on_change=self._on_capture_screenshots_change,
                        ),
                    ),
                ],
                spacing=0,
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["xl"],
            padding=28,
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("xs"),
            animate=ft.Animation(ANIMATION["normal"], EASE_OUT),
        )

    def _build_appearance_settings(self):
        """Build appearance settings section with polished styling."""
        return ft.Container(
            content=ft.Column(
                [
                    self._build_section_header(
                        "Appearance",
                        "Visual preferences",
                        ft.Icons.PALETTE_ROUNDED,
                        COLORS["accent_pink"],
                    ),
                    ft.Container(height=24),
                    self._build_polished_field(
                        "Theme",
                        "Application color theme",
                        ft.Icons.DARK_MODE_ROUNDED,
                        COLORS["accent_indigo"],
                        ft.Dropdown(
                            value=self.app_state.get("theme", "dark"),
                            options=[
                                ft.dropdown.Option("dark", "Dark"),
                                ft.dropdown.Option("light", "Light"),
                                ft.dropdown.Option("system", "System"),
                            ],
                            border_color=COLORS["border"],
                            focused_border_color=COLORS["accent_indigo"],
                            bgcolor=COLORS["bg_input"],
                            color=COLORS["text_primary"],
                            border_radius=RADIUS["md"],
                            content_padding=ft.padding.symmetric(horizontal=16, vertical=10),
                            width=160,
                            text_size=14,
                            on_change=lambda e: self._on_config_change("theme", e.control.value),
                        ),
                    ),
                    self._build_polished_divider(),
                    self._build_polished_field(
                        "Animations",
                        "Enable smooth UI animations",
                        ft.Icons.ANIMATION_ROUNDED,
                        COLORS["accent_cyan"],
                        self._build_polished_toggle(
                            value=self.app_state.get("animations", True),
                            color=COLORS["accent_cyan"],
                            on_change=self._on_animations_change,
                        ),
                    ),
                    self._build_polished_divider(),
                    self._build_polished_field(
                        "Compact Mode",
                        "Use compact layout for smaller screens",
                        ft.Icons.VIEW_COMPACT_ROUNDED,
                        COLORS["text_secondary"],
                        self._build_polished_toggle(
                            value=self.app_state.get("compact_mode", False),
                            color=COLORS["primary"],
                            on_change=self._on_compact_mode_change,
                        ),
                    ),
                ],
                spacing=0,
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["xl"],
            padding=28,
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("xs"),
            animate=ft.Animation(ANIMATION["normal"], EASE_OUT),
        )

    def _build_about_section(self):
        """Build about section with polished styling."""
        return ft.Container(
            content=ft.Column(
                [
                    self._build_section_header(
                        "About",
                        "Application information",
                        ft.Icons.INFO_ROUNDED,
                        COLORS["accent_cyan"],
                    ),
                    ft.Container(height=24),
                    ft.Container(
                        content=ft.Row(
                            [
                                # App logo with glow effect
                                ft.Container(
                                    content=ft.Icon(
                                        ft.Icons.ANDROID_ROUNDED,
                                        size=44,
                                        color=COLORS["primary"],
                                    ),
                                    width=88,
                                    height=88,
                                    border_radius=RADIUS["xl"],
                                    bgcolor=f"{COLORS['primary']}12",
                                    alignment=ft.alignment.center,
                                    border=ft.border.all(1, f"{COLORS['primary']}20"),
                                    shadow=ft.BoxShadow(
                                        spread_radius=0,
                                        blur_radius=24,
                                        color=f"{COLORS['primary']}30",
                                        offset=ft.Offset(0, 8),
                                    ),
                                ),
                                ft.Container(width=24),
                                # App info
                                ft.Column(
                                    [
                                        ft.Text(
                                            "Droidrun Controller",
                                            size=22,
                                            weight=ft.FontWeight.W_700,
                                            color=COLORS["text_primary"],
                                        ),
                                        ft.Container(height=6),
                                        ft.Container(
                                            content=ft.Text(
                                                "v0.1.0",
                                                size=11,
                                                weight=ft.FontWeight.W_600,
                                                color=COLORS["primary"],
                                            ),
                                            bgcolor=f"{COLORS['primary']}15",
                                            border_radius=8,
                                            padding=ft.padding.symmetric(horizontal=10, vertical=4),
                                        ),
                                        ft.Container(height=8),
                                        ft.Text(
                                            "Professional Android phone automation\nwith workflow management",
                                            size=13,
                                            color=COLORS["text_secondary"],
                                        ),
                                    ],
                                    spacing=0,
                                ),
                            ],
                            vertical_alignment=ft.CrossAxisAlignment.CENTER,
                        ),
                        padding=ft.padding.only(top=4, bottom=16),
                    ),
                    ft.Container(height=16),
                    ft.Container(
                        content=ft.Divider(color=COLORS["border_subtle"], height=1),
                    ),
                    ft.Container(height=20),
                    ft.Row(
                        [
                            self._build_about_action_button(
                                "Check Updates",
                                ft.Icons.SYSTEM_UPDATE_ROUNDED,
                                COLORS["accent_blue"],
                                self._on_check_updates,
                            ),
                            ft.Container(width=12),
                            self._build_about_action_button(
                                "View Logs",
                                ft.Icons.DESCRIPTION_ROUNDED,
                                COLORS["text_secondary"],
                                self._on_view_logs,
                            ),
                            ft.Container(width=12),
                            self._build_about_action_button(
                                "GitHub",
                                ft.Icons.CODE_ROUNDED,
                                COLORS["text_secondary"],
                                self._on_github,
                            ),
                        ],
                    ),
                ],
                spacing=0,
            ),
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["xl"],
            padding=28,
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("xs"),
            animate=ft.Animation(ANIMATION["normal"], EASE_OUT),
        )

    def _build_about_action_button(self, text: str, icon: str, color: str, on_click):
        """Build a polished action button for the about section."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        content=ft.Icon(
                            icon,
                            size=16,
                            color=color,
                        ),
                        width=32,
                        height=32,
                        border_radius=RADIUS["sm"],
                        bgcolor=f"{color}12",
                        alignment=ft.alignment.center,
                    ),
                    ft.Container(width=10),
                    ft.Text(
                        text,
                        size=13,
                        weight=ft.FontWeight.W_500,
                        color=COLORS["text_secondary"],
                    ),
                ],
            ),
            padding=ft.padding.only(left=8, right=16, top=10, bottom=10),
            border_radius=RADIUS["md"],
            bgcolor=COLORS["bg_tertiary"],
            border=ft.border.all(1, COLORS["border_subtle"]),
            animate=ft.Animation(ANIMATION["fast"], EASE_OUT),
            on_click=on_click,
            on_hover=self._on_ghost_button_hover,
        )

    def _build_polished_divider(self):
        """Build a polished divider with gradient fade effect."""
        return ft.Container(
            content=ft.Container(
                bgcolor=COLORS["border"],
                height=1,
            ),
            padding=ft.padding.symmetric(vertical=16),
            margin=ft.margin.only(left=60),
        )

    def _build_polished_field(
        self,
        title: str,
        description: str,
        icon: str,
        color: str,
        control: ft.Control,
    ):
        """Build a polished setting field row with icon container."""
        return ft.Row(
            [
                ft.Container(
                    content=ft.Icon(
                        icon,
                        size=20,
                        color=color,
                    ),
                    width=44,
                    height=44,
                    border_radius=RADIUS["md"],
                    bgcolor=f"{color}10",
                    alignment=ft.alignment.center,
                    border=ft.border.all(1, f"{color}15"),
                ),
                ft.Container(width=16),
                ft.Column(
                    [
                        ft.Text(
                            title,
                            size=15,
                            weight=ft.FontWeight.W_600,
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
            vertical_alignment=ft.CrossAxisAlignment.CENTER,
        )

    def _build_polished_toggle(self, value: bool, color: str, on_change):
        """Build a polished toggle switch with enhanced styling."""
        return ft.Container(
            content=ft.Switch(
                value=value,
                active_color=color,
                active_track_color=f"{color}40",
                inactive_thumb_color=COLORS["text_muted"],
                inactive_track_color=COLORS["bg_tertiary"],
                on_change=on_change,
            ),
            padding=ft.padding.only(left=8),
        )

    # Event handlers
    def _on_primary_button_hover(self, e):
        """Handle primary button hover effect."""
        if e.data == "true":
            e.control.scale = 1.02
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=28,
                color=f"{COLORS['primary']}50",
                offset=ft.Offset(0, 10),
            )
        else:
            e.control.scale = 1.0
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=20,
                color=f"{COLORS['primary']}40",
                offset=ft.Offset(0, 6),
            )
        e.control.update()

    def _on_ghost_button_hover(self, e):
        """Handle ghost button hover effect."""
        if e.data == "true":
            e.control.bgcolor = COLORS["bg_hover"]
            e.control.border = ft.border.all(1, COLORS["border_light"])
        else:
            e.control.bgcolor = COLORS["bg_card"] if hasattr(e.control, 'data') and e.control.data else COLORS["bg_tertiary"]
            e.control.border = ft.border.all(1, COLORS["border_subtle"] if hasattr(e.control, 'data') else COLORS["border"])
        e.control.update()

    def _on_accent_button_hover(self, e):
        """Handle accent button hover effect."""
        color = e.control.data.get("color", COLORS["accent_purple"]) if e.control.data else COLORS["accent_purple"]
        if e.data == "true":
            e.control.bgcolor = f"{color}20"
            e.control.border = ft.border.all(1, f"{color}40")
        else:
            e.control.bgcolor = f"{color}12"
            e.control.border = ft.border.all(1, f"{color}25")
        e.control.update()

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
