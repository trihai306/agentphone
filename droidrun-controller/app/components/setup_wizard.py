"""Setup Wizard UI for first-run dependency installation.

Premium UI component that guides users through initial setup,
showing dependency status and installation progress.
"""

import flet as ft
from typing import Optional, Callable
from ..theme import get_colors, RADIUS, SPACING, ANIMATION, get_shadow


class SetupWizard(ft.Container):
    """Premium Setup Wizard UI for first-run experience.
    
    Features:
    - Dependency detection and status display
    - One-click install all
    - Progress tracking with animations
    - Professional design
    """
    
    def __init__(
        self,
        on_complete: Optional[Callable] = None,
        on_skip: Optional[Callable] = None,
    ):
        self.on_complete = on_complete
        self.on_skip = on_skip
        self._is_installing = False
        self._install_progress = 0.0
        self._status_message = "Checking dependencies..."
        self._dependencies = {}
        
        colors = get_colors()
        
        super().__init__(
            content=self._build_content(),
            expand=True,
            bgcolor=colors["bg_primary"],
            padding=0,
        )
    
    def did_mount(self):
        """Called when the control is mounted."""
        # Check dependencies on mount
        self.page.run_task(self._check_dependencies)
    
    async def _check_dependencies(self):
        """Check dependency status."""
        from ..services.auto_setup import auto_setup
        
        auto_setup.check_dependencies()
        self._dependencies = auto_setup.get_dependencies()
        
        # Check if all required are installed
        all_installed = all(
            dep.status.value == "installed"
            for dep in self._dependencies.values()
            if dep.required
        )
        
        if all_installed:
            self._status_message = "All dependencies installed!"
            if self.on_complete:
                import asyncio
                await asyncio.sleep(1)
                self.on_complete()
        else:
            self._status_message = "Some dependencies need to be installed"
        
        self.content = self._build_content()
        if self.page:
            self.update()
    
    def _build_content(self):
        """Build the wizard content."""
        colors = get_colors()
        
        # Header
        header = ft.Container(
            content=ft.Column(
                [
                    # Logo
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.ROCKET_LAUNCH_ROUNDED,
                            size=64,
                            color=colors["primary"],
                        ),
                        width=100,
                        height=100,
                        border_radius=RADIUS["xl"],
                        bgcolor=colors["primary_glow"],
                        alignment=ft.Alignment(0, 0),
                    ),
                    ft.Container(height=20),
                    ft.Text(
                        "Welcome to DroidRun",
                        size=28,
                        weight=ft.FontWeight.W_800,
                        color=colors["text_primary"],
                    ),
                    ft.Container(height=8),
                    ft.Text(
                        "Let's set up your device control environment",
                        size=14,
                        color=colors["text_secondary"],
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.only(top=40, bottom=30),
        )
        
        # Dependency cards
        dep_cards = self._build_dependency_cards(colors)
        
        # Progress section
        progress_section = self._build_progress_section(colors) if self._is_installing else ft.Container()
        
        # Action buttons
        actions = self._build_actions(colors)
        
        return ft.Column(
            [
                header,
                ft.Container(
                    content=ft.Column(
                        [dep_cards, progress_section],
                        spacing=20,
                    ),
                    expand=True,
                    padding=ft.padding.symmetric(horizontal=40),
                ),
                actions,
            ],
            spacing=0,
            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
        )
    
    def _build_dependency_cards(self, colors):
        """Build dependency status cards."""
        cards = []
        
        for name, dep in self._dependencies.items():
            status = dep.status.value
            
            # Status icon and color
            if status == "installed":
                icon = ft.Icons.CHECK_CIRCLE_ROUNDED
                icon_color = colors["success"]
                status_text = "Installed"
                status_bg = f"{colors['success']}15"
            elif status == "installing":
                icon = ft.Icons.SYNC_ROUNDED
                icon_color = colors["primary"]
                status_text = "Installing..."
                status_bg = f"{colors['primary']}15"
            elif status == "failed":
                icon = ft.Icons.ERROR_ROUNDED
                icon_color = colors["error"]
                status_text = "Failed"
                status_bg = f"{colors['error']}15"
            elif status == "outdated":
                icon = ft.Icons.WARNING_ROUNDED
                icon_color = colors["warning"]
                status_text = "Outdated"
                status_bg = f"{colors['warning']}15"
            else:
                icon = ft.Icons.DOWNLOAD_ROUNDED
                icon_color = colors["text_muted"]
                status_text = "Not installed"
                status_bg = colors["bg_tertiary"]
            
            card = ft.Container(
                content=ft.Row(
                    [
                        # Icon
                        ft.Container(
                            content=ft.Icon(icon, size=24, color=icon_color),
                            width=48,
                            height=48,
                            border_radius=RADIUS["lg"],
                            bgcolor=status_bg,
                            alignment=ft.Alignment(0, 0),
                        ),
                        ft.Container(width=16),
                        # Info
                        ft.Column(
                            [
                                ft.Text(
                                    dep.display_name,
                                    size=14,
                                    weight=ft.FontWeight.W_600,
                                    color=colors["text_primary"],
                                ),
                                ft.Text(
                                    dep.description,
                                    size=12,
                                    color=colors["text_secondary"],
                                ),
                            ],
                            spacing=2,
                            expand=True,
                        ),
                        # Status badge
                        ft.Container(
                            content=ft.Text(
                                status_text,
                                size=11,
                                weight=ft.FontWeight.W_600,
                                color=icon_color,
                            ),
                            padding=ft.padding.symmetric(horizontal=10, vertical=5),
                            border_radius=RADIUS["full"],
                            bgcolor=status_bg,
                        ),
                        # Required badge
                        ft.Container(
                            content=ft.Text(
                                "Required" if dep.required else "Optional",
                                size=10,
                                color=colors["error"] if dep.required else colors["text_muted"],
                            ),
                            padding=ft.padding.symmetric(horizontal=8, vertical=4),
                            border_radius=RADIUS["sm"],
                            bgcolor=f"{colors['error']}10" if dep.required else colors["bg_tertiary"],
                        ) if not dep.required else ft.Container(),
                    ],
                ),
                padding=16,
                border_radius=RADIUS["lg"],
                bgcolor=colors["bg_card"],
                border=ft.border.all(1, colors["border"]),
                margin=ft.margin.only(bottom=10),
            )
            cards.append(card)
        
        return ft.Column(cards, spacing=0)
    
    def _build_progress_section(self, colors):
        """Build progress section during installation."""
        return ft.Container(
            content=ft.Column(
                [
                    ft.Row(
                        [
                            ft.ProgressRing(
                                width=20,
                                height=20,
                                stroke_width=2,
                                color=colors["primary"],
                            ),
                            ft.Container(width=12),
                            ft.Text(
                                self._status_message,
                                size=13,
                                color=colors["text_secondary"],
                            ),
                        ],
                    ),
                    ft.Container(height=12),
                    ft.ProgressBar(
                        value=self._install_progress,
                        color=colors["primary"],
                        bgcolor=colors["bg_tertiary"],
                        height=6,
                        border_radius=3,
                    ),
                ],
            ),
            padding=ft.padding.all(16),
            border_radius=RADIUS["lg"],
            bgcolor=f"{colors['primary']}08",
            border=ft.border.all(1, f"{colors['primary']}20"),
        )
    
    def _build_actions(self, colors):
        """Build action buttons."""
        has_missing = any(
            dep.status.value != "installed"
            for dep in self._dependencies.values()
            if dep.required
        )
        
        return ft.Container(
            content=ft.Row(
                [
                    # Skip button
                    ft.Container(
                        content=ft.Text(
                            "Skip for now",
                            size=13,
                            color=colors["text_muted"],
                        ),
                        padding=ft.padding.symmetric(horizontal=20, vertical=12),
                        border_radius=RADIUS["md"],
                        on_click=lambda e: self.on_skip() if self.on_skip else None,
                        on_hover=self._on_skip_hover,
                    ),
                    ft.Container(expand=True),
                    # Install button
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(
                                    ft.Icons.DOWNLOAD_ROUNDED if has_missing else ft.Icons.CHECK_ROUNDED,
                                    size=18,
                                    color=colors["text_inverse"],
                                ),
                                ft.Container(width=8),
                                ft.Text(
                                    "Install All" if has_missing else "Continue",
                                    size=14,
                                    weight=ft.FontWeight.W_600,
                                    color=colors["text_inverse"],
                                ),
                            ],
                        ),
                        padding=ft.padding.symmetric(horizontal=24, vertical=14),
                        border_radius=RADIUS["lg"],
                        bgcolor=colors["primary"],
                        on_click=self._on_install_click if has_missing else lambda e: self.on_complete() if self.on_complete else None,
                        on_hover=self._on_install_hover,
                        shadow=get_shadow("sm"),
                        animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
                    ),
                ],
            ),
            padding=ft.padding.all(30),
            bgcolor=colors["bg_secondary"],
            border=ft.border.only(top=ft.BorderSide(1, colors["border"])),
        )
    
    def _on_skip_hover(self, e):
        """Handle skip button hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["bg_hover"]
        else:
            e.control.bgcolor = "transparent"
        e.control.update()
    
    def _on_install_hover(self, e):
        """Handle install button hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["primary_dark"]
            e.control.scale = 1.02
        else:
            e.control.bgcolor = colors["primary"]
            e.control.scale = 1.0
        e.control.update()
    
    def _on_install_click(self, e):
        """Handle install button click."""
        if self._is_installing:
            return
        
        self._is_installing = True
        self.content = self._build_content()
        if self.page:
            self.update()
            self.page.run_task(self._install_all)
    
    async def _install_all(self):
        """Install all dependencies."""
        from ..services.auto_setup import auto_setup
        
        def progress_callback(message: str, progress: float):
            self._status_message = message
            self._install_progress = progress
            self._dependencies = auto_setup.get_dependencies()
            self.content = self._build_content()
            if self.page:
                self.update()
        
        success = await auto_setup.install_all(progress_callback, include_optional=False)
        
        self._is_installing = False
        self._dependencies = auto_setup.get_dependencies()
        self.content = self._build_content()
        if self.page:
            self.update()
        
        if success and self.on_complete:
            import asyncio
            await asyncio.sleep(1)
            self.on_complete()


class SetupWizardDialog(ft.AlertDialog):
    """Setup Wizard as a modal dialog."""
    
    def __init__(
        self,
        on_complete: Optional[Callable] = None,
        on_skip: Optional[Callable] = None,
    ):
        self.wizard = SetupWizard(
            on_complete=on_complete,
            on_skip=on_skip,
        )
        
        colors = get_colors()
        
        super().__init__(
            modal=True,
            content=ft.Container(
                content=self.wizard,
                width=500,
                height=600,
                border_radius=RADIUS["xl"],
                clip_behavior=ft.ClipBehavior.ANTI_ALIAS,
            ),
            bgcolor=colors["bg_primary"],
            shape=ft.RoundedRectangleBorder(radius=RADIUS["xl"]),
        )
