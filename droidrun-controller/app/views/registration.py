"""Professional Registration view for Droidrun Controller - 2025 Edition.

Polished with form styling, password strength validation, and enhanced visual design.
"""

import flet as ft
import re
from ..theme import COLORS, RADIUS, get_shadow, ANIMATION


# Animation curve for smooth transitions
EASE_OUT = ft.AnimationCurve.EASE_OUT


class RegistrationView(ft.Container):
    """Professional view for user registration with polished UI."""

    def __init__(self, app_state, toast, on_navigate=None, **kwargs):
        self.app_state = app_state
        self.toast = toast
        self.on_navigate = on_navigate
        self.name_field = None
        self.email_field = None
        self.password_field = None
        self.confirm_password_field = None
        self.terms_checkbox = None
        self.name_error = None
        self.email_error = None
        self.password_error = None
        self.confirm_password_error = None
        # Password strength indicator components
        self.strength_segment_1 = None
        self.strength_segment_2 = None
        self.strength_segment_3 = None
        self.strength_label = None
        self.strength_container = None
        self.is_loading = False

        super().__init__(
            content=self._build_content(),
            expand=True,
            **kwargs
        )

    def _build_content(self):
        """Build the view content."""
        return ft.Column(
            [
                ft.Container(expand=True),
                self._build_registration_card(),
                ft.Container(expand=True),
            ],
            spacing=0,
            expand=True,
            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            scroll=ft.ScrollMode.AUTO,
        )

    def _build_registration_card(self):
        """Build the centered registration card with form."""
        return ft.Container(
            content=ft.Column(
                [
                    self._build_header(),
                    ft.Container(height=28),
                    self._build_form(),
                    ft.Container(height=20),
                    self._build_terms_section(),
                    ft.Container(height=24),
                    self._build_submit_button(),
                    ft.Container(height=20),
                    self._build_divider(),
                    ft.Container(height=20),
                    self._build_login_link(),
                ],
                spacing=0,
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            width=420,
            bgcolor=COLORS["bg_card"],
            border_radius=RADIUS["xl"],
            padding=40,
            border=ft.border.all(1, COLORS["border"]),
            shadow=get_shadow("lg"),
            animate=ft.Animation(ANIMATION["normal"], EASE_OUT),
        )

    def _build_header(self):
        """Build the polished header section with logo and title."""
        return ft.Column(
            [
                # Logo container with glow effect
                ft.Container(
                    content=ft.Icon(
                        ft.Icons.PERSON_ADD_ROUNDED,
                        size=48,
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
                ft.Container(height=24),
                ft.Text(
                    "Create Account",
                    size=28,
                    weight=ft.FontWeight.W_700,
                    color=COLORS["text_primary"],
                ),
                ft.Container(height=8),
                ft.Text(
                    "Sign up to get started with Droidrun Controller",
                    size=14,
                    weight=ft.FontWeight.W_400,
                    color=COLORS["text_secondary"],
                    text_align=ft.TextAlign.CENTER,
                ),
            ],
            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            spacing=0,
        )

    def _build_form(self):
        """Build the registration form with all fields."""
        # Full name field
        self.name_field = ft.TextField(
            hint_text="Full name",
            prefix_icon=ft.Icons.PERSON_ROUNDED,
            border_color=COLORS["border"],
            focused_border_color=COLORS["primary"],
            bgcolor=COLORS["bg_input"],
            color=COLORS["text_primary"],
            hint_style=ft.TextStyle(color=COLORS["text_muted"], size=14),
            cursor_color=COLORS["primary"],
            border_radius=RADIUS["md"],
            content_padding=ft.padding.symmetric(horizontal=16, vertical=16),
            text_size=14,
            on_change=self._on_name_change,
            on_submit=self._on_submit,
        )

        self.name_error = ft.Text(
            "",
            size=12,
            color=COLORS["error"],
            visible=False,
        )

        # Email field
        self.email_field = ft.TextField(
            hint_text="Email address",
            prefix_icon=ft.Icons.EMAIL_ROUNDED,
            border_color=COLORS["border"],
            focused_border_color=COLORS["primary"],
            bgcolor=COLORS["bg_input"],
            color=COLORS["text_primary"],
            hint_style=ft.TextStyle(color=COLORS["text_muted"], size=14),
            cursor_color=COLORS["primary"],
            border_radius=RADIUS["md"],
            content_padding=ft.padding.symmetric(horizontal=16, vertical=16),
            text_size=14,
            keyboard_type=ft.KeyboardType.EMAIL,
            on_change=self._on_email_change,
            on_submit=self._on_submit,
        )

        self.email_error = ft.Text(
            "",
            size=12,
            color=COLORS["error"],
            visible=False,
        )

        # Password field
        self.password_field = ft.TextField(
            hint_text="Password",
            prefix_icon=ft.Icons.LOCK_ROUNDED,
            password=True,
            can_reveal_password=True,
            border_color=COLORS["border"],
            focused_border_color=COLORS["primary"],
            bgcolor=COLORS["bg_input"],
            color=COLORS["text_primary"],
            hint_style=ft.TextStyle(color=COLORS["text_muted"], size=14),
            cursor_color=COLORS["primary"],
            border_radius=RADIUS["md"],
            content_padding=ft.padding.symmetric(horizontal=16, vertical=16),
            text_size=14,
            on_change=self._on_password_change,
            on_submit=self._on_submit,
        )

        self.password_error = ft.Text(
            "",
            size=12,
            color=COLORS["error"],
            visible=False,
        )

        # Password strength indicator
        self.password_strength_bar = ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        height=4,
                        width=0,
                        bgcolor=COLORS["text_muted"],
                        border_radius=2,
                        animate=ft.Animation(ANIMATION["fast"], EASE_OUT),
                    ),
                ],
                spacing=4,
            ),
            visible=False,
        )

        self.password_strength_text = ft.Text(
            "",
            size=11,
            color=COLORS["text_muted"],
            visible=False,
        )

        # Confirm password field
        self.confirm_password_field = ft.TextField(
            hint_text="Confirm password",
            prefix_icon=ft.Icons.LOCK_OUTLINE_ROUNDED,
            password=True,
            can_reveal_password=True,
            border_color=COLORS["border"],
            focused_border_color=COLORS["primary"],
            bgcolor=COLORS["bg_input"],
            color=COLORS["text_primary"],
            hint_style=ft.TextStyle(color=COLORS["text_muted"], size=14),
            cursor_color=COLORS["primary"],
            border_radius=RADIUS["md"],
            content_padding=ft.padding.symmetric(horizontal=16, vertical=16),
            text_size=14,
            on_change=self._on_confirm_password_change,
            on_submit=self._on_submit,
        )

        self.confirm_password_error = ft.Text(
            "",
            size=12,
            color=COLORS["error"],
            visible=False,
        )

        return ft.Column(
            [
                # Full name field section
                ft.Column(
                    [
                        ft.Text(
                            "Full Name",
                            size=13,
                            weight=ft.FontWeight.W_500,
                            color=COLORS["text_primary"],
                        ),
                        ft.Container(height=8),
                        self.name_field,
                        ft.Container(height=4),
                        self.name_error,
                    ],
                    spacing=0,
                ),
                ft.Container(height=16),
                # Email field section
                ft.Column(
                    [
                        ft.Text(
                            "Email",
                            size=13,
                            weight=ft.FontWeight.W_500,
                            color=COLORS["text_primary"],
                        ),
                        ft.Container(height=8),
                        self.email_field,
                        ft.Container(height=4),
                        self.email_error,
                    ],
                    spacing=0,
                ),
                ft.Container(height=16),
                # Password field section
                ft.Column(
                    [
                        ft.Text(
                            "Password",
                            size=13,
                            weight=ft.FontWeight.W_500,
                            color=COLORS["text_primary"],
                        ),
                        ft.Container(height=8),
                        self.password_field,
                        ft.Container(height=8),
                        self._build_password_strength_indicator(),
                        ft.Container(height=4),
                        self.password_error,
                    ],
                    spacing=0,
                ),
                ft.Container(height=16),
                # Confirm password field section
                ft.Column(
                    [
                        ft.Text(
                            "Confirm Password",
                            size=13,
                            weight=ft.FontWeight.W_500,
                            color=COLORS["text_primary"],
                        ),
                        ft.Container(height=8),
                        self.confirm_password_field,
                        ft.Container(height=4),
                        self.confirm_password_error,
                    ],
                    spacing=0,
                ),
            ],
            spacing=0,
        )

    def _build_password_strength_indicator(self):
        """Build the password strength indicator with segmented bars."""
        # Create three segment bars for weak/medium/strong
        self.strength_segment_1 = ft.Container(
            height=4,
            expand=True,
            bgcolor=COLORS["border"],
            border_radius=2,
            animate=ft.Animation(ANIMATION["fast"], EASE_OUT),
        )
        self.strength_segment_2 = ft.Container(
            height=4,
            expand=True,
            bgcolor=COLORS["border"],
            border_radius=2,
            animate=ft.Animation(ANIMATION["fast"], EASE_OUT),
        )
        self.strength_segment_3 = ft.Container(
            height=4,
            expand=True,
            bgcolor=COLORS["border"],
            border_radius=2,
            animate=ft.Animation(ANIMATION["fast"], EASE_OUT),
        )

        self.strength_label = ft.Text(
            "",
            size=11,
            weight=ft.FontWeight.W_600,
            color=COLORS["text_muted"],
        )

        self.strength_container = ft.Container(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            self.strength_segment_1,
                            ft.Container(width=4),
                            self.strength_segment_2,
                            ft.Container(width=4),
                            self.strength_segment_3,
                        ],
                    ),
                    ft.Container(height=6),
                    ft.Row(
                        [
                            ft.Text(
                                "Password strength: ",
                                size=11,
                                color=COLORS["text_muted"],
                            ),
                            self.strength_label,
                        ],
                    ),
                ],
                spacing=0,
            ),
            visible=False,
        )

        return self.strength_container

    def _build_terms_section(self):
        """Build the terms and conditions checkbox section."""
        self.terms_checkbox = ft.Checkbox(
            value=False,
            active_color=COLORS["primary"],
            check_color=COLORS["text_inverse"],
            on_change=self._on_terms_change,
        )

        return ft.Row(
            [
                self.terms_checkbox,
                ft.Container(width=8),
                ft.Column(
                    [
                        ft.Row(
                            [
                                ft.Text(
                                    "I agree to the ",
                                    size=13,
                                    color=COLORS["text_secondary"],
                                ),
                                ft.TextButton(
                                    content=ft.Text(
                                        "Terms of Service",
                                        size=13,
                                        weight=ft.FontWeight.W_600,
                                        color=COLORS["primary"],
                                    ),
                                    on_click=self._on_terms_click,
                                ),
                            ],
                            spacing=0,
                        ),
                        ft.Row(
                            [
                                ft.Text(
                                    "and ",
                                    size=13,
                                    color=COLORS["text_secondary"],
                                ),
                                ft.TextButton(
                                    content=ft.Text(
                                        "Privacy Policy",
                                        size=13,
                                        weight=ft.FontWeight.W_600,
                                        color=COLORS["primary"],
                                    ),
                                    on_click=self._on_privacy_click,
                                ),
                            ],
                            spacing=0,
                        ),
                    ],
                    spacing=0,
                ),
            ],
            vertical_alignment=ft.CrossAxisAlignment.START,
        )

    def _build_submit_button(self):
        """Build the polished submit button."""
        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(
                        ft.Icons.HOW_TO_REG_ROUNDED,
                        size=18,
                        color=COLORS["text_inverse"],
                    ),
                    ft.Container(width=10),
                    ft.Text(
                        "Create Account",
                        size=15,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["text_inverse"],
                    ),
                ],
                alignment=ft.MainAxisAlignment.CENTER,
            ),
            width=340,
            height=48,
            bgcolor=COLORS["primary"],
            border_radius=RADIUS["md"],
            alignment=ft.alignment.center,
            shadow=ft.BoxShadow(
                spread_radius=0,
                blur_radius=16,
                color=f"{COLORS['primary']}40",
                offset=ft.Offset(0, 6),
            ),
            animate=ft.Animation(ANIMATION["normal"], EASE_OUT),
            animate_scale=ft.Animation(ANIMATION["normal"], EASE_OUT),
            on_click=self._on_submit,
            on_hover=self._on_submit_button_hover,
        )

    def _build_divider(self):
        """Build an 'or' divider section."""
        return ft.Row(
            [
                ft.Container(
                    height=1,
                    bgcolor=COLORS["border"],
                    expand=True,
                ),
                ft.Container(width=16),
                ft.Text(
                    "or",
                    size=12,
                    color=COLORS["text_muted"],
                ),
                ft.Container(width=16),
                ft.Container(
                    height=1,
                    bgcolor=COLORS["border"],
                    expand=True,
                ),
            ],
        )

    def _build_login_link(self):
        """Build the login link section."""
        return ft.Row(
            [
                ft.Text(
                    "Already have an account?",
                    size=14,
                    color=COLORS["text_secondary"],
                ),
                ft.Container(width=6),
                ft.TextButton(
                    content=ft.Text(
                        "Sign in",
                        size=14,
                        weight=ft.FontWeight.W_600,
                        color=COLORS["primary"],
                    ),
                    on_click=self._on_login_click,
                ),
            ],
            alignment=ft.MainAxisAlignment.CENTER,
        )

    # Password strength calculation
    def _calculate_password_strength(self, password: str) -> tuple:
        """Calculate password strength and return (score, label, color)."""
        if not password:
            return (0, "", COLORS["text_muted"])

        score = 0
        # Length check
        if len(password) >= 8:
            score += 1
        if len(password) >= 12:
            score += 1

        # Character variety checks
        if re.search(r"[a-z]", password):
            score += 1
        if re.search(r"[A-Z]", password):
            score += 1
        if re.search(r"\d", password):
            score += 1
        if re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            score += 1

        # Determine strength level
        if score <= 2:
            return (score / 6, "Weak", COLORS["error"])
        elif score <= 4:
            return (score / 6, "Medium", COLORS["warning"])
        else:
            return (score / 6, "Strong", COLORS["success"])

    # Event handlers
    def _on_submit_button_hover(self, e):
        """Handle submit button hover effect."""
        if e.data == "true":
            e.control.scale = 1.02
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=24,
                color=f"{COLORS['primary']}50",
                offset=ft.Offset(0, 10),
            )
        else:
            e.control.scale = 1.0
            e.control.shadow = ft.BoxShadow(
                spread_radius=0,
                blur_radius=16,
                color=f"{COLORS['primary']}40",
                offset=ft.Offset(0, 6),
            )
        e.control.update()

    def _on_name_change(self, e):
        """Handle name field change - clear error."""
        if self.name_error and self.name_error.visible:
            self.name_error.visible = False
            self.name_error.update()
            self.name_field.border_color = COLORS["border"]
            self.name_field.update()

    def _on_email_change(self, e):
        """Handle email field change - clear error."""
        if self.email_error and self.email_error.visible:
            self.email_error.visible = False
            self.email_error.update()
            self.email_field.border_color = COLORS["border"]
            self.email_field.update()

    def _on_password_change(self, e):
        """Handle password field change - update strength indicator."""
        password = e.control.value or ""

        # Clear error if visible
        if self.password_error and self.password_error.visible:
            self.password_error.visible = False
            self.password_error.update()
            self.password_field.border_color = COLORS["border"]
            self.password_field.update()

        # Update strength indicator
        self._update_password_strength(password)

    def _update_password_strength(self, password: str):
        """Update the password strength indicator with segmented bars."""
        if not hasattr(self, 'strength_container') or not self.strength_container:
            return

        if not password:
            self.strength_container.visible = False
            self.strength_container.update()
            return

        self.strength_container.visible = True
        score, label, color = self._calculate_password_strength(password)

        # Update segments based on strength level
        # Weak: 1 segment, Medium: 2 segments, Strong: 3 segments
        if label == "Weak":
            self.strength_segment_1.bgcolor = color
            self.strength_segment_2.bgcolor = COLORS["border"]
            self.strength_segment_3.bgcolor = COLORS["border"]
        elif label == "Medium":
            self.strength_segment_1.bgcolor = color
            self.strength_segment_2.bgcolor = color
            self.strength_segment_3.bgcolor = COLORS["border"]
        elif label == "Strong":
            self.strength_segment_1.bgcolor = color
            self.strength_segment_2.bgcolor = color
            self.strength_segment_3.bgcolor = color
        else:
            # Reset all segments
            self.strength_segment_1.bgcolor = COLORS["border"]
            self.strength_segment_2.bgcolor = COLORS["border"]
            self.strength_segment_3.bgcolor = COLORS["border"]

        # Update label
        self.strength_label.value = label
        self.strength_label.color = color

        # Update all components
        self.strength_segment_1.update()
        self.strength_segment_2.update()
        self.strength_segment_3.update()
        self.strength_label.update()
        self.strength_container.update()

    def _on_confirm_password_change(self, e):
        """Handle confirm password field change - clear error."""
        if self.confirm_password_error and self.confirm_password_error.visible:
            self.confirm_password_error.visible = False
            self.confirm_password_error.update()
            self.confirm_password_field.border_color = COLORS["border"]
            self.confirm_password_field.update()

    def _on_terms_change(self, e):
        """Handle terms checkbox change."""
        pass

    async def _on_terms_click(self, e):
        """Handle terms of service link click."""
        self.toast.info("Terms of Service - Coming soon")

    async def _on_privacy_click(self, e):
        """Handle privacy policy link click."""
        self.toast.info("Privacy Policy - Coming soon")

    async def _on_submit(self, e):
        """Handle form submission."""
        if self.is_loading:
            return

        # Validate fields
        name = self.name_field.value or ""
        email = self.email_field.value or ""
        password = self.password_field.value or ""
        confirm_password = self.confirm_password_field.value or ""
        terms_accepted = self.terms_checkbox.value

        is_valid = True

        # Validate name
        if not name.strip():
            self.name_error.value = "Full name is required"
            self.name_error.visible = True
            self.name_field.border_color = COLORS["error"]
            is_valid = False

        # Validate email
        if not email:
            self.email_error.value = "Email is required"
            self.email_error.visible = True
            self.email_field.border_color = COLORS["error"]
            is_valid = False
        elif "@" not in email or "." not in email:
            self.email_error.value = "Please enter a valid email address"
            self.email_error.visible = True
            self.email_field.border_color = COLORS["error"]
            is_valid = False

        # Validate password
        if not password:
            self.password_error.value = "Password is required"
            self.password_error.visible = True
            self.password_field.border_color = COLORS["error"]
            is_valid = False
        elif len(password) < 8:
            self.password_error.value = "Password must be at least 8 characters"
            self.password_error.visible = True
            self.password_field.border_color = COLORS["error"]
            is_valid = False
        else:
            # Check password strength requirements
            has_upper = bool(re.search(r"[A-Z]", password))
            has_lower = bool(re.search(r"[a-z]", password))
            has_digit = bool(re.search(r"\d", password))

            if not (has_upper and has_lower and has_digit):
                self.password_error.value = "Password must contain uppercase, lowercase, and number"
                self.password_error.visible = True
                self.password_field.border_color = COLORS["error"]
                is_valid = False

        # Validate confirm password
        if not confirm_password:
            self.confirm_password_error.value = "Please confirm your password"
            self.confirm_password_error.visible = True
            self.confirm_password_field.border_color = COLORS["error"]
            is_valid = False
        elif password != confirm_password:
            self.confirm_password_error.value = "Passwords do not match"
            self.confirm_password_error.visible = True
            self.confirm_password_field.border_color = COLORS["error"]
            is_valid = False

        # Validate terms acceptance
        if not terms_accepted:
            self.toast.warning("Please accept the Terms of Service and Privacy Policy")
            is_valid = False

        if not is_valid:
            self.update()
            return

        # Show loading state
        self.is_loading = True
        self.toast.info("Creating account...")

        # Simulate registration (will be replaced with actual auth)
        self.is_loading = False
        self.toast.success("Account created successfully!")

    async def _on_login_click(self, e):
        """Handle login link click."""
        if self.on_navigate:
            self.on_navigate("login")
        else:
            self.toast.info("Navigate to login page")

    def refresh(self):
        """Refresh the view."""
        self.content = self._build_content()
        self.update()
