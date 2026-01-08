"""Main Flet application for Droidrun Controller - Professional Dashboard 2025."""

import flet as ft
from .theme import get_theme, get_colors, set_theme_mode, get_theme_mode, SPACING, RADIUS, ANIMATION, get_shadow
from .views import DevicesView, WorkflowsView, ExecutionsView, SettingsView, AgentRunnerView, LoginView, RegisterView
from .views.phone_viewer import PhoneViewerView
from .components.toast import ToastManager
from .components.notification_panel import NotificationPanel
from .backend import backend
from .services.auth_service import get_auth_service, AuthResult
from .services.notification_service import get_notification_service


# Storage keys for session persistence
SESSION_TOKEN_KEY = "droidrun.auth.token"
SESSION_EMAIL_KEY = "droidrun.auth.email"
SESSION_USER_ID_KEY = "droidrun.auth.user_id"

# File-based session storage for development (persists across hot reloads)
SESSION_FILE = ".session_cache.json"


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

        # Authentication state
        self._is_authenticated = False
        self._auth_token: str | None = None
        self._current_user_email: str | None = None
        self._current_user_id: int | None = None
        self._current_user_name: str | None = None
        self._current_auth_view = "login"  # "login" or "register"
        self._auth_service = get_auth_service()
        self._notification_service = get_notification_service()
        self._unread_notifications_count = 0
        self._notification_panel_visible = False
        self._notification_panel = None
        self._session_restore_completed = False  # Prevent multiple restore attempts

        self._setup_page()
        # Start with auth UI, then check for stored session
        self._build_auth_ui_initial()
        self.page.on_resized = self._on_resize
        # Check for stored session after page is ready
        self.page.run_task(self._restore_session)

    def _setup_page(self):
        """Configure the page settings."""
        # Load saved theme preference
        from .theme import initialize_theme
        saved_mode = initialize_theme()
        
        self.page.title = "Droidrun Controller"
        self.page.theme = get_theme()
        self.page.theme_mode = ft.ThemeMode.DARK if saved_mode == "dark" else ft.ThemeMode.LIGHT
        self.page.bgcolor = get_colors()["bg_primary"]
        self.page.padding = 0
        self.page.window.min_width = 375  # Mobile minimum
        self.page.window.min_height = 600
        self.page.window.width = 1440
        self.page.window.height = 900

    def _build_auth_ui_initial(self):
        """Build initial auth UI with loading state while checking session."""
        self.page.controls.clear()
        # Show a loading container initially
        loading_container = ft.Container(
            content=ft.Column(
                [
                    ft.ProgressRing(width=40, height=40),
                    ft.Text("Loading...", color=get_colors()["text_secondary"]),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                alignment=ft.MainAxisAlignment.CENTER,
                spacing=16,
            ),
            expand=True,
            bgcolor=get_colors()["bg_primary"],
            alignment=ft.Alignment(0, 0),
        )
        self.page.add(loading_container)
        self.page.update()

    async def _restore_session(self):
        """Restore session from file (dev) or client storage if a valid token exists."""
        if self._session_restore_completed:
            print("[DEBUG] Session restore already completed, skipping")
            return

        print("[DEBUG] _restore_session started")
        try:
            token = None
            email = None
            user_id = None

            # First, try to load from file (persists across hot reloads)
            try:
                import json
                import os
                if os.path.exists(SESSION_FILE):
                    print(f"[DEBUG] Found session file: {SESSION_FILE}")
                    with open(SESSION_FILE, 'r') as f:
                        session_data = json.load(f)
                        token = session_data.get("token")
                        email = session_data.get("email")
                        user_id = session_data.get("user_id")
                    print(f"[DEBUG] Loaded session from file: {email}")
            except Exception as e:
                print(f"[DEBUG] Failed to load session from file: {e}")

            # Fallback to client storage if file doesn't exist (for production)
            # Note: client_storage may not be available in all Flet versions
            if not token:
                print(f"[DEBUG] Checking client storage for token...")
                try:
                    if hasattr(self.page, 'client_storage') and self.page.client_storage:
                        if self.page.client_storage.contains_key(SESSION_TOKEN_KEY):
                            token = self.page.client_storage.get(SESSION_TOKEN_KEY)
                            email = self.page.client_storage.get(SESSION_EMAIL_KEY)
                            user_id = self.page.client_storage.get(SESSION_USER_ID_KEY)
                            print(f"[DEBUG] Loaded session from client storage")
                except Exception as e:
                    print(f"[DEBUG] Client storage not available: {e}")

            if token:
                print(f"[DEBUG] Found token: {token[:20]}...")
                # Verify the token by calling the Laravel API (Sanctum tokens can't be decoded locally)
                print("[DEBUG] Verifying token via API...")

                # Set token in auth service for the API call
                self._auth_service.token = token
                profile_result = await self._auth_service.get_user_profile(token)

                if profile_result.success:
                    print(f"[DEBUG] Token is valid, user: {profile_result.name}")
                    # Token is valid - restore session
                    self._is_authenticated = True
                    self._auth_token = token
                    self._current_user_email = profile_result.email or email
                    self._current_user_id = profile_result.user_id or user_id
                    self._current_user_name = profile_result.name

                    # Set token in notification service
                    self._notification_service.token = token

                    # Fetch unread notifications count
                    try:
                        notif_result = await self._notification_service.get_unread_count()
                        if notif_result.success:
                            self._unread_notifications_count = notif_result.unread_count
                            print(f"[DEBUG] Unread notifications: {self._unread_notifications_count}")
                    except Exception as e:
                        print(f"[DEBUG] Failed to fetch notifications: {e}")

                    # Mark restore as completed
                    self._session_restore_completed = True

                    # Build main app UI
                    print("[DEBUG] Building main app with restored session...")
                    self._build_app()
                    welcome_msg = f"Welcome back, {self._current_user_name}!" if self._current_user_name else "Welcome back!"
                    self.toast.success(welcome_msg)
                    print("[DEBUG] Session restored successfully")
                    return
                else:
                    print(f"[DEBUG] Token verification failed: {profile_result.message}")
                    # Clear invalid session
                    self._clear_stored_session()
            else:
                print("[DEBUG] No token found in storage or file")

            # Mark restore as completed even if no session found
            self._session_restore_completed = True

            # No valid session - show login page
            print("[DEBUG] No valid session, showing login page")
            self._build_app()

        except Exception as e:
            # On any error, clear storage and show login
            print(f"[DEBUG] ERROR in _restore_session: {e}")
            import traceback
            traceback.print_exc()
            self._session_restore_completed = True
            self._clear_stored_session()
            self._build_app()

    def _build_app(self):
        """Build the application - routes to auth or main UI based on authentication state."""
        print(f"[DEBUG] _build_app called: authenticated={self._is_authenticated}")
        self.page.controls.clear()

        if self._is_authenticated:
            # Show main application UI
            print("[DEBUG] Building main UI...")
            try:
                self._build_ui()
                print("[DEBUG] Main UI built successfully")
                self.page.run_task(self._initialize)
            except Exception as e:
                print(f"[DEBUG] ERROR building UI: {e}")
                import traceback
                traceback.print_exc()
        else:
            # Show authentication UI (login or register)
            print("[DEBUG] Building auth UI...")
            self._build_auth_ui()

        print("[DEBUG] Updating page...")
        self.page.update()
        print("[DEBUG] Page updated")

    def _build_auth_ui(self):
        """Build the authentication UI (login or register page)."""
        if self._current_auth_view == "login":
            auth_view = LoginView(
                on_login=self._handle_login,
                on_navigate_to_register=self._navigate_to_register,
            )
        else:
            auth_view = RegisterView(
                on_register=self._handle_register,
                on_navigate_to_login=self._navigate_to_login,
            )

        # Wrap in a container with background
        auth_container = ft.Container(
            content=auth_view,
            expand=True,
            bgcolor=get_colors()["bg_primary"],
        )

        self.page.add(auth_container)

    async def _handle_login(self, email: str, password: str):
        """Handle login attempt from LoginView.

        Args:
            email: The user's email address.
            password: The user's password.
        """
        print(f"[DEBUG] Login attempt for: {email}")
        result = await self._auth_service.login(email, password)
        print(f"[DEBUG] Login result: success={result.success}, token={result.token is not None}")

        if result.success:
            # Update authentication state
            self._is_authenticated = True
            self._auth_token = result.token
            self._current_user_email = result.email
            self._current_user_id = result.user_id
            self._current_user_name = result.name
            print(f"[DEBUG] Auth state updated: authenticated={self._is_authenticated}, user={self._current_user_name}")

            # Set token in auth service for future requests
            self._auth_service.token = result.token
            self._notification_service.token = result.token

            # Store session in client storage for persistence
            self._store_session(result.token, result.email, result.user_id)
            print("[DEBUG] Session stored")

            # Mark session restore as completed to prevent _restore_session from running again
            self._session_restore_completed = True
            print("[DEBUG] Session restore marked as completed")

            # Fetch unread notifications count
            try:
                notif_result = await self._notification_service.get_unread_count()
                if notif_result.success:
                    self._unread_notifications_count = notif_result.unread_count
                    print(f"[DEBUG] Unread notifications: {self._unread_notifications_count}")
                    if self._unread_notifications_count > 0:
                        self.page.run_task(self._show_notifications_toast)
            except Exception as e:
                print(f"[DEBUG] Failed to fetch notifications: {e}")

            # Rebuild UI to show main app
            print("[DEBUG] Calling _build_app()")
            self._build_app()
            print("[DEBUG] _build_app() completed")
            self.toast.success("Welcome back!")
        else:
            # Show error in the login view
            print(f"[DEBUG] Login failed: {result.message}")
            raise Exception(result.message)

    async def _handle_register(self, email: str, password: str):
        """Handle registration attempt from RegisterView.

        Args:
            email: The user's email address.
            password: The user's password.
        """
        result = await self._auth_service.register(email, password)

        if result.success:
            # Registration successful - navigate to login
            self._current_auth_view = "login"
            self._build_app()
            self.toast.success("Account created! Please sign in.")
        else:
            # Show error in the register view
            raise Exception(result.message)

    def _navigate_to_register(self):
        """Navigate from login page to register page."""
        self._current_auth_view = "register"
        self._build_app()

    def _navigate_to_login(self):
        """Navigate from register page to login page."""
        self._current_auth_view = "login"
        self._build_app()

    def logout(self):
        """Logout the current user and return to login page."""
        self._is_authenticated = False
        self._auth_token = None
        self._current_user_email = None
        self._current_user_id = None
        self._current_user_name = None
        self._current_auth_view = "login"
        self._auth_service.token = None
        self._notification_service.token = None
        self._unread_notifications_count = 0

        # Clear stored session
        self._clear_stored_session()

        self._build_app()
        self.toast.info("You have been logged out.")

    def _store_session(self, token: str, email: str, user_id: int):
        """Store authentication session in client storage AND file for persistence.

        Args:
            token: JWT access token.
            email: User's email address.
            user_id: User's database ID.
        """
        # Store in client storage (browser storage) if available
        try:
            if hasattr(self.page, 'client_storage') and self.page.client_storage:
                self.page.client_storage.set(SESSION_TOKEN_KEY, token)
                self.page.client_storage.set(SESSION_EMAIL_KEY, email)
                self.page.client_storage.set(SESSION_USER_ID_KEY, user_id)
                print("[DEBUG] Session saved to client storage")
        except Exception as e:
            # Storage might not be available, fail silently
            print(f"[DEBUG] Client storage not available: {e}")

        # Also store in file for development (persists across hot reloads)
        try:
            import json
            session_data = {
                "token": token,
                "email": email,
                "user_id": user_id
            }
            with open(SESSION_FILE, 'w') as f:
                json.dump(session_data, f)
            print(f"[DEBUG] Session saved to file: {SESSION_FILE}")
        except Exception as e:
            print(f"[DEBUG] Failed to save session to file: {e}")

    def _clear_stored_session(self):
        """Clear stored authentication session from client storage AND file."""
        # Clear client storage if available
        try:
            if hasattr(self.page, 'client_storage') and self.page.client_storage:
                self.page.client_storage.remove(SESSION_TOKEN_KEY)
                self.page.client_storage.remove(SESSION_EMAIL_KEY)
                self.page.client_storage.remove(SESSION_USER_ID_KEY)
                print("[DEBUG] Session cleared from client storage")
        except Exception as e:
            # Storage might not be available, fail silently
            print(f"[DEBUG] Client storage not available: {e}")

        # Clear file storage
        try:
            import os
            if os.path.exists(SESSION_FILE):
                os.remove(SESSION_FILE)
                print(f"[DEBUG] Session file removed: {SESSION_FILE}")
        except Exception as e:
            print(f"[DEBUG] Failed to remove session file: {e}")

    def _build_ui(self):
        """Build the main UI layout."""
        print("[DEBUG] _build_ui started")
        # Get current window width for responsive layout
        self._current_width = self.page.window.width or 1440
        is_mobile = self._current_width < self.BREAKPOINT_SM
        is_tablet = self._current_width < self.BREAKPOINT_MD
        print(f"[DEBUG] Screen size: {self._current_width}, mobile={is_mobile}, tablet={is_tablet}")

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
        print("[DEBUG] Creating views...")
        try:
            self.views = {
                "dashboard": DevicesView(
                    self.app_state,
                    self.toast,
                    on_notification_click=lambda e: self._toggle_notifications(e),
                    on_settings_click=lambda _: self._on_nav_click("settings"),
                ),
                "phone_viewer": PhoneViewerView(self.app_state, self.toast),
                "agent_runner": AgentRunnerView(self.app_state, self.toast),
                "workflows": WorkflowsView(self.app_state, self.toast),
                "executions": ExecutionsView(self.app_state, self.toast),
                "settings": SettingsView(self.app_state, self.toast),
            }
            print("[DEBUG] Views created successfully")
        except Exception as e:
            print(f"[DEBUG] ERROR creating views: {e}")
            raise

        # Responsive padding
        content_padding = ft.padding.only(
            left=16 if is_mobile else 24 if is_tablet else 32,
            right=16 if is_mobile else 24 if is_tablet else 32,
            top=16 if is_mobile else 24,
            bottom=16 if is_mobile else 24
        )

        # Content area - use current_view instead of hardcoded "dashboard"
        self.content_container = ft.Container(
            content=self.views.get(self.current_view, self.views["dashboard"]),
            expand=True,
            padding=content_padding,
            bgcolor=get_colors()["bg_primary"],
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
                            icon_color=get_colors()["text_primary"],
                            icon_size=24,
                            bgcolor=get_colors()["bg_card"],
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
        colors = get_colors()
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
                    alignment=ft.Alignment(0, 0),
                ),
                padding=ft.padding.only(left=12, right=12, top=20, bottom=16),
                alignment=ft.Alignment(0, 0),
            )
        else:
            # Logo and branding
            logo_section = ft.Container(
                content=ft.Column(
                    [
                        ft.Row(
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
                                    alignment=ft.Alignment(0, 0),
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
                            ],
                        ),
                        ft.Container(height=12),
                        # Action buttons row
                        ft.Row(
                            [
                                ft.Container(expand=True),
                                # Notification bell
                                self._build_notification_bell(),
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
                    ],
                    spacing=0,
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
                alignment=ft.Alignment(0, 0),
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
                        # Logout button - collapsed version
                        ft.Container(
                            content=ft.Icon(
                                ft.Icons.LOGOUT,
                                size=22,
                                color=colors["error"],
                            ),
                            width=46,
                            height=46,
                            border_radius=RADIUS["md"],
                            bgcolor="transparent",
                            alignment=ft.Alignment(0, 0),
                            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                            on_hover=self._on_logout_hover,
                            on_click=lambda _: self.logout(),
                            tooltip="Logout",
                        ),
                        ft.Container(height=8),
                        collapse_toggle,
                    ],
                    spacing=0,
                    horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                    scroll=ft.ScrollMode.AUTO,
                ),
                width=72,
                bgcolor=colors["bg_secondary"],
                border=ft.border.only(right=ft.BorderSide(1, colors["border"])),
            )

        # Search bar - refined with subtle shadow and improved hover
        search_bar = ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        content=ft.Icon(ft.Icons.SEARCH, size=16, color=colors["text_muted"]),
                        width=32,
                        height=32,
                        border_radius=RADIUS["sm"],
                        bgcolor=colors["bg_tertiary"],
                        alignment=ft.Alignment(0, 0),
                    ),
                    ft.Container(width=SPACING["sm"]),
                    ft.Text(
                        "Search...",
                        size=13,
                        color=colors["text_muted"],
                        weight=ft.FontWeight.W_400,
                    ),
                    ft.Container(expand=True),
                    ft.Container(
                        content=ft.Text(
                            "⌘K",
                            size=10,
                            color=colors["text_muted"],
                            weight=ft.FontWeight.W_500,
                        ),
                        padding=ft.padding.symmetric(horizontal=8, vertical=4),
                        border_radius=RADIUS["xs"],
                        bgcolor=colors["bg_hover"],
                        border=ft.border.all(1, colors["border_light"]),
                    ),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=12, vertical=10),
            margin=ft.margin.symmetric(horizontal=16),
            border_radius=RADIUS["md"],
            bgcolor=colors["bg_input"],
            border=ft.border.all(1, colors["border"]),
            shadow=get_shadow("xs"),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
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
        ]

        main_nav = ft.Column(
            [self._build_nav_item(*item) for item in main_nav_items],
            spacing=SPACING["xxs"],
        )

        # Actions section - refined with letter spacing and consistent spacing
        actions_section = ft.Container(
            content=ft.Column(
                [
                    ft.Text(
                        "QUICK ACTIONS",
                        size=10,
                        weight=ft.FontWeight.W_600,
                        color=colors["text_muted"],
                    ),
                    ft.Container(height=SPACING["md"]),
                    self._build_action_item(
                        "New Recording",
                        ft.Icons.FIBER_MANUAL_RECORD,
                        colors["error"],
                        self._on_new_recording,
                    ),
                    ft.Container(height=SPACING["sm"]),
                    self._build_action_item(
                        "Scan Devices",
                        ft.Icons.RADAR,
                        colors["accent_cyan"],
                        self._on_scan_devices,
                    ),
                ],
            ),
            padding=ft.padding.only(left=22, right=20, top=SPACING["xl"]),
        )

        # Status indicator - enhanced with pulse animation hint
        status_section = ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        content=ft.Container(
                            width=6,
                            height=6,
                            border_radius=3,
                            bgcolor=colors["success"],
                        ),
                        width=22,
                        height=22,
                        border_radius=11,
                        bgcolor=colors["success_subtle"],
                        alignment=ft.Alignment(0, 0),
                    ),
                    ft.Container(width=SPACING["sm"]),
                    ft.Text(
                        "System Ready",
                        size=12,
                        color=colors["text_secondary"],
                        weight=ft.FontWeight.W_500,
                    ),
                    ft.Container(expand=True),
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.CHECK_CIRCLE,
                            size=14,
                            color=colors["success"],
                        ),
                    ),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=14, vertical=10),
            margin=ft.margin.symmetric(horizontal=16),
            border_radius=RADIUS["sm"],
            bgcolor=colors["bg_tertiary"],
            border=ft.border.all(1, colors["border_light"]),
        )

        # Settings at bottom - refined with better divider and item styling
        settings_section = ft.Container(
            content=ft.Column(
                [
                    # Gradient divider effect
                    ft.Container(
                        content=ft.Container(
                            height=1,
                            bgcolor=colors["border"],
                        ),
                        margin=ft.margin.symmetric(horizontal=16),
                    ),
                    ft.Container(height=SPACING["md"]),

                    # User Profile Card
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Container(
                                    content=ft.Text(
                                        (self._current_user_name[0].upper() if self._current_user_name else "U"),
                                        size=14,
                                        weight=ft.FontWeight.W_600,
                                        color=colors["text_inverse"],
                                    ),
                                    width=32,
                                    height=32,
                                    border_radius=16,
                                    bgcolor=colors["primary"],
                                    alignment=ft.Alignment(0, 0),
                                ),
                                ft.Container(width=SPACING["sm"]),
                                ft.Column(
                                    [
                                        ft.Text(
                                            self._current_user_name or "User",
                                            size=13,
                                            weight=ft.FontWeight.W_600,
                                            color=colors["text_primary"],
                                            no_wrap=True,
                                        ),
                                        ft.Text(
                                            self._current_user_email or "",
                                            size=10,
                                            color=colors["text_secondary"],
                                            no_wrap=True,
                                            overflow=ft.TextOverflow.ELLIPSIS,
                                            width=160,
                                        ),
                                    ],
                                    spacing=2,
                                    alignment=ft.MainAxisAlignment.CENTER,
                                    expand=True,
                                ),
                            ],
                        ),
                        padding=ft.padding.symmetric(horizontal=12, vertical=8),
                        margin=ft.margin.only(bottom=SPACING["sm"]),
                    ),

                    self._build_nav_item(
                        "settings", "Settings",
                        ft.Icons.SETTINGS_OUTLINED, ft.Icons.SETTINGS
                    ),
                    ft.Container(height=SPACING["sm"]),
                    # Help & Support - polished secondary nav item
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Container(
                                    content=ft.Icon(ft.Icons.HELP_OUTLINE, size=18, color=colors["text_muted"]),
                                    width=36,
                                    height=36,
                                    border_radius=RADIUS["sm"],
                                    alignment=ft.Alignment(0, 0),
                                ),
                                ft.Container(width=SPACING["sm"]),
                                ft.Text(
                                    "Help & Support",
                                    size=13,
                                    weight=ft.FontWeight.W_500,
                                    color=colors["text_secondary"],
                                ),
                            ],
                        ),
                        padding=ft.padding.only(left=10, right=14, top=8, bottom=8),
                        border_radius=RADIUS["md"],
                        border=ft.border.all(1, "transparent"),
                        animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                        on_click=lambda _: self.toast.info("Help coming soon..."),
                        on_hover=self._on_nav_hover_secondary,
                    ),
                    ft.Container(height=SPACING["sm"]),
                    # Logout button - polished secondary nav item
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Container(
                                    content=ft.Icon(ft.Icons.LOGOUT, size=18, color=colors["error"]),
                                    width=36,
                                    height=36,
                                    border_radius=RADIUS["sm"],
                                    alignment=ft.Alignment(0, 0),
                                ),
                                ft.Container(width=SPACING["sm"]),
                                ft.Text(
                                    "Logout",
                                    size=13,
                                    weight=ft.FontWeight.W_500,
                                    color=colors["text_secondary"],
                                ),
                            ],
                        ),
                        padding=ft.padding.only(left=10, right=14, top=8, bottom=8),
                        border_radius=RADIUS["md"],
                        border=ft.border.all(1, "transparent"),
                        animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                        on_click=lambda _: self.logout(),
                        on_hover=self._on_logout_hover,
                    ),
                    ft.Container(height=SPACING["sm"]),
                    # Collapse toggle - polished
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Container(
                                    content=ft.Icon(ft.Icons.CHEVRON_LEFT, size=18, color=colors["text_muted"]),
                                    width=36,
                                    height=36,
                                    border_radius=RADIUS["sm"],
                                    alignment=ft.Alignment(0, 0),
                                ),
                                ft.Container(width=SPACING["sm"]),
                                ft.Text(
                                    "Collapse",
                                    size=13,
                                    weight=ft.FontWeight.W_500,
                                    color=colors["text_secondary"],
                                ),
                            ],
                        ),
                        padding=ft.padding.only(left=10, right=14, top=8, bottom=8),
                        border_radius=RADIUS["md"],
                        border=ft.border.all(1, "transparent"),
                        animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                        on_click=self._toggle_sidebar,
                        on_hover=self._on_nav_hover_secondary,
                    ),
                ],
            ),
            padding=ft.padding.only(left=12, right=12, bottom=20),
        )

        return ft.Container(
            content=ft.Column(
                [
                    logo_section,
                    ft.Container(height=SPACING["sm"]),
                    search_bar,
                    ft.Container(height=SPACING["lg"]),
                    status_section,
                    ft.Container(height=SPACING["xl"]),
                    # Navigation label - refined
                    ft.Container(
                        content=ft.Text(
                            "NAVIGATION",
                            size=10,
                            weight=ft.FontWeight.W_600,
                            color=colors["text_muted"],
                        ),
                        padding=ft.padding.only(left=22, bottom=SPACING["sm"]),
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
                scroll=ft.ScrollMode.AUTO,
            ),
            width=264,
            bgcolor=colors["bg_secondary"],
            border=ft.border.only(right=ft.BorderSide(1, colors["border"])),
        )

    def _build_nav_item(self, key: str, label: str, icon_outline: str, icon_filled: str):
        """Build a navigation item with polished hover effects."""
        is_selected = self.current_view == key
        colors = get_colors()

        # Icon container with subtle background when selected
        icon_container = ft.Container(
            content=ft.Icon(
                icon_filled if is_selected else icon_outline,
                size=20,
                color=colors["primary"] if is_selected else colors["text_secondary"],
            ),
            width=36,
            height=36,
            border_radius=RADIUS["sm"],
            bgcolor=colors["primary_glow"] if is_selected else "transparent",
            alignment=ft.Alignment(0, 0),
        )

        return ft.Container(
            content=ft.Row(
                [
                    icon_container,
                    ft.Container(width=SPACING["sm"]),
                    ft.Text(
                        label,
                        size=14,
                        weight=ft.FontWeight.W_600 if is_selected else ft.FontWeight.W_500,
                        color=colors["text_primary"] if is_selected else colors["text_secondary"],
                    ),
                    ft.Container(expand=True),
                    # Active indicator
                    ft.Container(
                        width=4 if is_selected else 0,
                        height=24,
                        border_radius=2,
                        bgcolor=colors["primary"] if is_selected else "transparent",
                    ),
                ],
            ),
            padding=ft.padding.only(left=10, right=14, top=8, bottom=8),
            border_radius=RADIUS["md"],
            bgcolor=colors["primary_subtle"] if is_selected else "transparent",
            border=ft.border.all(1, colors["primary_glow"] if is_selected else "transparent"),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            on_hover=lambda e, k=key: self._on_nav_hover(e, k) if not is_selected else None,
            on_click=lambda e, k=key: self._on_nav_click(k),
        )

    def _build_action_item(self, label: str, icon: str, color: str, on_click):
        """Build a quick action button with enhanced styling."""
        colors = get_colors()

        return ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        content=ft.Icon(icon, size=16, color=color),
                        width=34,
                        height=34,
                        border_radius=RADIUS["sm"],
                        bgcolor=f"{color}15",
                        border=ft.border.all(1, f"{color}30"),
                        alignment=ft.Alignment(0, 0),
                    ),
                    ft.Container(width=SPACING["md"]),
                    ft.Text(
                        label,
                        size=13,
                        weight=ft.FontWeight.W_500,
                        color=colors["text_primary"],
                    ),
                    ft.Container(expand=True),
                    ft.Icon(
                        ft.Icons.ARROW_FORWARD_IOS,
                        size=12,
                        color=colors["text_muted"],
                    ),
                ],
            ),
            padding=ft.padding.symmetric(horizontal=12, vertical=10),
            border_radius=RADIUS["md"],
            bgcolor=colors["bg_card"],
            border=ft.border.all(1, colors["border"]),
            shadow=get_shadow("xs"),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            on_click=on_click,
            on_hover=self._on_action_hover,
        )

    def _on_search_hover(self, e):
        """Handle search bar hover with enhanced effects."""
        colors = get_colors()
        if e.data == "true":
            e.control.border = ft.border.all(1, colors["primary"])
            e.control.bgcolor = colors["bg_card"]
            e.control.shadow = get_shadow("sm")
        else:
            e.control.border = ft.border.all(1, colors["border"])
            e.control.bgcolor = colors["bg_input"]
            e.control.shadow = get_shadow("xs")
        e.control.update()

    def _on_nav_hover(self, e, key: str):
        """Handle navigation item hover with smooth transitions."""
        if self.current_view != key:
            colors = get_colors()
            if e.data == "true":
                e.control.bgcolor = colors["bg_hover"]
                e.control.border = ft.border.all(1, colors["border_light"])
            else:
                e.control.bgcolor = "transparent"
                e.control.border = ft.border.all(1, "transparent")
            e.control.update()

    def _on_nav_hover_secondary(self, e):
        """Handle secondary nav hover with refined feedback."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["bg_hover"]
            e.control.border = ft.border.all(1, colors["border_light"])
        else:
            e.control.bgcolor = "transparent"
            e.control.border = ft.border.all(1, "transparent")
        e.control.update()

    def _on_logout_hover(self, e):
        """Handle logout button hover with error-tinted feedback."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = f"{colors['error']}15"
            e.control.border = ft.border.all(1, f"{colors['error']}30")
        else:
            e.control.bgcolor = "transparent"
            e.control.border = ft.border.all(1, "transparent")
        e.control.update()

    def _on_action_hover(self, e):
        """Handle action button hover with elevation effect."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["bg_hover"]
            e.control.border = ft.border.all(1, colors["border_hover"])
            e.control.shadow = get_shadow("sm")
        else:
            e.control.bgcolor = colors["bg_card"]
            e.control.border = ft.border.all(1, colors["border"])
            e.control.shadow = get_shadow("xs")
        e.control.update()

    def _on_nav_click(self, key: str):
        """Handle navigation item click."""
        print(f"[DEBUG] Navigation clicked: {key}")
        if self.current_view == key:
            print(f"[DEBUG] Already on view: {key}")
            return

        print(f"[DEBUG] Changing view from {self.current_view} to {key}")
        self.current_view = key
        self.content_container.content = self.views[key]

        # Rebuild entire UI to ensure navigation items update correctly
        print("[DEBUG] Rebuilding UI after navigation...")
        self._build_app()
        print("[DEBUG] UI rebuild complete")

        # Load view data
        self.page.run_task(self._load_view_data, key)

    def _on_auth_navigate(self, target: str):
        """Handle navigation from auth views (login/registration)."""
        if target in self.views:
            self._on_nav_click(target)

    def _toggle_theme(self, e):
        """Toggle between light and dark theme."""
        print("[DEBUG] Theme toggle clicked!")
        current = get_theme_mode()
        new_mode = "dark" if current == "light" else "light"
        set_theme_mode(new_mode)
        
        # Save theme preference to file
        from .theme import save_theme_preference
        save_theme_preference(new_mode)

        # Update page
        self.page.theme = get_theme()
        self.page.theme_mode = ft.ThemeMode.DARK if new_mode == "dark" else ft.ThemeMode.LIGHT
        self.page.bgcolor = get_colors()["bg_primary"]

        # Rebuild UI - use _build_app to preserve auth state
        self.page.controls.clear()
        if self._is_authenticated:
            self._build_ui()
        else:
            self._build_auth_ui()
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

    def _build_notification_bell(self):
        """Build notification bell button with badge."""
        colors = get_colors()

        # For now, return just the simple button to test clickability
        # TODO: Add badge back once we confirm button is clickable
        return ft.IconButton(
            icon=ft.Icons.NOTIFICATIONS_OUTLINED,
            icon_size=20,
            icon_color=colors["text_muted"],
            tooltip="Notifications",
            on_click=self._toggle_notifications,
        )

    async def _show_notifications_toast(self):
        """Show toast about unread notifications."""
        count = self._unread_notifications_count
        if count > 0:
            msg = f"You have {count} unread notification{'s' if count > 1 else ''}"
            self.toast.info(msg)

    def _toggle_notifications(self, e):
        """Toggle notification panel visibility."""
        print(f"[DEBUG] Notification bell clicked! Current state: {self._notification_panel_visible}")
        self._notification_panel_visible = not self._notification_panel_visible

        if self._notification_panel_visible:
            # Create and show notification panel as overlay
            print("[DEBUG] Showing notification panel...")
            self._show_notification_panel()
        else:
            # Hide notification panel
            print("[DEBUG] Hiding notification panel...")
            self._hide_notification_panel()

    def _show_notification_panel(self):
        """Show notification panel as overlay."""
        colors = get_colors()

        # Create notification panel if not exists
        if self._notification_panel is None:
            self._notification_panel = NotificationPanel(
                on_close=self._hide_notification_panel
            )
            self._notification_panel.page = self.page

        # Get the panel container
        panel_container = self._notification_panel.get_container()

        # Create overlay with backdrop
        overlay = ft.Stack(
            [
                # Backdrop (semi-transparent)
                ft.Container(
                    bgcolor="#00000040",
                    expand=True,
                    on_click=lambda _: self._hide_notification_panel(),
                ),
                # Notification panel (positioned top-right, under notification bell)
                ft.Container(
                    content=panel_container,
                    right=230,
                    top=55,
                ),
            ],
            expand=True,
        )

        # Add overlay to page
        self.page.overlay.append(overlay)
        self.page.update()

        # Load notifications
        self.page.run_task(self._notification_panel.load_notifications)

    def _hide_notification_panel(self):
        """Hide notification panel."""
        self._notification_panel_visible = False

        # Remove overlay from page
        if self.page.overlay:
            self.page.overlay.clear()
            self.page.update()

    def _build_nav_item_collapsed(self, key: str, icon_outline: str, icon_filled: str):
        """Build a collapsed navigation item (icon only) with enhanced styling."""
        is_selected = self.current_view == key
        colors = get_colors()

        return ft.Container(
            content=ft.Icon(
                icon_filled if is_selected else icon_outline,
                size=22,
                color=colors["primary"] if is_selected else colors["text_secondary"],
            ),
            width=46,
            height=46,
            border_radius=RADIUS["md"],
            bgcolor=colors["primary_subtle"] if is_selected else "transparent",
            border=ft.border.all(1, colors["primary_glow"] if is_selected else "transparent"),
            alignment=ft.Alignment(0, 0),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
            on_hover=lambda e, k=key: self._on_nav_hover(e, k) if not is_selected else None,
            on_click=lambda e, k=key: self._on_nav_click(k),
            tooltip=key.replace("_", " ").title() if not is_selected else None,
        )

    def _build_mobile_nav(self):
        """Build bottom navigation for mobile with polished styling."""
        colors = get_colors()
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
                            ft.Container(
                                content=ft.Icon(
                                    icon_filled if is_selected else icon_outline,
                                    size=22,
                                    color=colors["primary"] if is_selected else colors["text_muted"],
                                ),
                                width=40,
                                height=32,
                                border_radius=RADIUS["lg"],
                                bgcolor=colors["primary_glow"] if is_selected else "transparent",
                                alignment=ft.Alignment(0, 0),
                            ),
                            ft.Text(
                                label,
                                size=10,
                                weight=ft.FontWeight.W_600 if is_selected else ft.FontWeight.W_400,
                                color=colors["primary"] if is_selected else colors["text_muted"],
                            ),
                        ],
                        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                        spacing=SPACING["xxs"],
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
            padding=ft.padding.symmetric(horizontal=8, vertical=4),
            shadow=get_shadow("sm"),
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

        # Only rebuild if crossing a breakpoint and authenticated (main UI)
        if old_is_mobile != new_is_mobile or old_is_tablet != new_is_tablet:
            self.page.controls.clear()
            if self._is_authenticated:
                self._build_ui()
            else:
                self._build_auth_ui()
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
