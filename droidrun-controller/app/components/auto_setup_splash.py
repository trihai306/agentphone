"""Auto Setup Splash Screen - Shows progress during silent dependency installation.

This is a professional loading screen that displays while the app is
automatically setting up all required dependencies. Users don't need to
do anything - just watch the progress.
"""

import flet as ft
from typing import Optional, Callable
from ..theme import get_colors, RADIUS, ANIMATION


class AutoSetupSplash(ft.Container):
    """Professional splash screen for automatic silent setup.
    
    Shows animated progress while dependencies are being installed.
    User doesn't need to click anything.
    """
    
    def __init__(
        self,
        on_complete: Optional[Callable] = None,
    ):
        self.on_complete = on_complete
        self._status = "Initializing..."
        self._progress = 0.0
        self._is_complete = False
        
        colors = get_colors()
        
        super().__init__(
            content=self._build_content(),
            expand=True,
            bgcolor=colors["bg_primary"],
            alignment=ft.Alignment(0, 0),
        )
    
    def did_mount(self):
        """Start auto-setup when mounted."""
        if self.page:
            self.page.run_task(self._run_setup)
    
    async def _run_setup(self):
        """Run silent setup with progress updates."""
        from ..services.bundled_setup import bundled_setup
        
        def progress_callback(message: str, progress: float):
            self._status = message
            self._progress = progress
            self._update_ui()
        
        # Check if already set up
        if not bundled_setup.is_setup_required:
            bundled_setup.setup_environment()
            self._status = "Ready!"
            self._progress = 1.0
            self._is_complete = True
            self._update_ui()
            
            # Short delay then complete
            import asyncio
            await asyncio.sleep(0.5)
            if self.on_complete:
                self.on_complete()
            return
        
        # Run setup
        success = await bundled_setup.run_silent_setup(progress_callback)
        
        self._is_complete = True
        if success:
            self._status = "Ready!"
        else:
            self._status = "Setup completed with warnings"
        
        self._update_ui()
        
        # Short delay then complete
        import asyncio
        await asyncio.sleep(1)
        if self.on_complete:
            self.on_complete()
    
    def _update_ui(self):
        """Update the UI with new status/progress."""
        self.content = self._build_content()
        if self.page:
            self.update()
    
    def _build_content(self):
        """Build the splash screen content."""
        colors = get_colors()
        
        # Main content
        return ft.Column(
            [
                ft.Container(expand=True),
                
                # Logo and title
                ft.Container(
                    content=ft.Column(
                        [
                            # Animated logo
                            ft.Container(
                                content=ft.Stack(
                                    [
                                        # Outer glow ring
                                        ft.Container(
                                            width=120,
                                            height=120,
                                            border_radius=60,
                                            bgcolor=f"{colors['primary']}10",
                                            alignment=ft.Alignment(0, 0),
                                            animate=ft.Animation(1500, ft.AnimationCurve.EASE_IN_OUT),
                                        ),
                                        # Inner circle with icon
                                        ft.Container(
                                            content=ft.Icon(
                                                ft.Icons.PHONELINK_SETUP_ROUNDED,
                                                size=48,
                                                color=colors["primary"],
                                            ),
                                            width=100,
                                            height=100,
                                            border_radius=50,
                                            bgcolor=colors["primary_glow"],
                                            alignment=ft.Alignment(0, 0),
                                            shadow=ft.BoxShadow(
                                                spread_radius=0,
                                                blur_radius=30,
                                                color=f"{colors['primary']}40",
                                            ),
                                        ),
                                    ],
                                    width=120,
                                    height=120,
                                    alignment=ft.Alignment(0, 0),
                                ),
                            ),
                            
                            ft.Container(height=30),
                            
                            # App name
                            ft.Text(
                                "DroidRun Controller",
                                size=28,
                                weight=ft.FontWeight.W_800,
                                color=colors["text_primary"],
                            ),
                            
                            ft.Container(height=8),
                            
                            ft.Text(
                                "Setting up your device control environment",
                                size=14,
                                color=colors["text_secondary"],
                            ),
                        ],
                        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                    ),
                ),
                
                ft.Container(height=50),
                
                # Progress section
                ft.Container(
                    content=ft.Column(
                        [
                            # Progress bar
                            ft.Container(
                                content=ft.ProgressBar(
                                    value=self._progress,
                                    color=colors["success"] if self._is_complete else colors["primary"],
                                    bgcolor=colors["bg_tertiary"],
                                    height=6,
                                    border_radius=3,
                                ),
                                width=300,
                            ),
                            
                            ft.Container(height=16),
                            
                            # Status message
                            ft.Row(
                                [
                                    # Spinner (hidden when complete)
                                    ft.ProgressRing(
                                        width=16,
                                        height=16,
                                        stroke_width=2,
                                        color=colors["primary"],
                                    ) if not self._is_complete else ft.Icon(
                                        ft.Icons.CHECK_CIRCLE_ROUNDED,
                                        size=18,
                                        color=colors["success"],
                                    ),
                                    ft.Container(width=10),
                                    ft.Text(
                                        self._status,
                                        size=13,
                                        color=colors["text_secondary"] if not self._is_complete else colors["success"],
                                    ),
                                ],
                                alignment=ft.MainAxisAlignment.CENTER,
                            ),
                        ],
                        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                    ),
                    width=350,
                ),
                
                ft.Container(expand=True),
                
                # Footer
                ft.Container(
                    content=ft.Text(
                        "Installing required components automatically...",
                        size=11,
                        color=colors["text_muted"],
                    ) if not self._is_complete else ft.Container(),
                    padding=ft.padding.only(bottom=30),
                ),
            ],
            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
        )
