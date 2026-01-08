"""Notification panel component for displaying notifications."""

import flet as ft
from ..theme import get_colors, RADIUS, SPACING, ANIMATION, get_shadow
from ..services.notification_service import get_notification_service, Notification


# Dynamic color proxy - acts like a dict but always gets current theme colors
class _DynamicColors:
    def get(self, key, default=None):
        return get_colors().get(key, default)
    
    def __getitem__(self, key):
        return get_colors()[key]

COLORS = _DynamicColors()


def create_notification_panel(on_close=None):
    """Create a notification panel component.

    Args:
        on_close: Callback when panel is closed

    Returns:
        NotificationPanel instance
    """
    return NotificationPanel(on_close=on_close)


class NotificationPanel:
    """Panel for displaying user notifications.

    Shows a dropdown/modal with list of notifications when opened.
    """

    def __init__(self, on_close=None):
        """Initialize notification panel.

        Args:
            on_close: Callback when panel is closed
        """
        self.on_close = on_close
        self._notifications = []
        self._notification_service = get_notification_service()
        self.page = None
        self.notifications_list = None
        self._container = None

    def build(self):
        """Build the notification panel UI."""
        colors = COLORS

        # Enhanced Header with gradient accent
        header = ft.Container(
            content=ft.Column(
                [
                    # Top accent bar with gradient
                    ft.Container(
                        height=3,
                        border_radius=ft.border_radius.only(top_left=12, top_right=12),
                        gradient=ft.LinearGradient(
                            begin=ft.alignment.Alignment(-1, 0),
                            end=ft.alignment.Alignment(1, 0),
                            colors=[colors["primary"], colors["accent_purple"], colors["accent_blue"]],
                        ),
                    ),
                    ft.Container(height=16),
                    # Header content
                    ft.Row(
                        [
                            # Icon with gradient background
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.NOTIFICATIONS_OUTLINED,
                                    size=20,
                                    color=colors["primary"],
                                ),
                                width=40,
                                height=40,
                                border_radius=10,
                                gradient=ft.LinearGradient(
                                    begin=ft.alignment.Alignment(-1, -1),
                                    end=ft.alignment.Alignment(1, 1),
                                    colors=[f"{colors['primary']}25", f"{colors['primary']}10"],
                                ),
                                border=ft.border.all(1, f"{colors['primary']}30"),
                                alignment=ft.alignment.Alignment(0, 0),
                            ),
                            ft.Container(width=12),
                            ft.Column(
                                [
                                    ft.Text(
                                        "Notifications",
                                        size=18,
                                        weight=ft.FontWeight.W_700,
                                        color=colors["text_primary"],
                                    ),
                                    ft.Text(
                                        "Stay updated with your activity",
                                        size=11,
                                        color=colors["text_muted"],
                                    ),
                                ],
                                spacing=2,
                                expand=True,
                            ),
                            # Close button with hover effect
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.CLOSE,
                                    size=18,
                                    color=colors["text_muted"],
                                ),
                                width=36,
                                height=36,
                                border_radius=8,
                                alignment=ft.alignment.Alignment(0, 0),
                                on_click=lambda _: self._close_panel(),
                                on_hover=self._on_close_hover,
                                animate=ft.Animation(150, ft.AnimationCurve.EASE_OUT),
                            ),
                        ],
                    ),
                ],
                spacing=0,
            ),
            padding=ft.padding.only(left=20, right=20, top=0, bottom=16),
            border=ft.border.only(bottom=ft.BorderSide(1, colors["border_light"])),
        )

        # Notifications list with custom scrollbar
        self.notifications_list = ft.Column(
            [
                ft.Container(
                    content=ft.Column(
                        [
                            ft.ProgressRing(
                                width=32,
                                height=32,
                                stroke_width=3,
                                color=colors["primary"],
                            ),
                            ft.Container(height=12),
                            ft.Text(
                                "Loading notifications...",
                                size=13,
                                color=colors["text_muted"],
                            ),
                        ],
                        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                    ),
                    alignment=ft.alignment.Alignment(0, 0),
                    padding=ft.padding.symmetric(vertical=60),
                )
            ],
            spacing=0,
            scroll=ft.ScrollMode.AUTO,
        )

        # Enhanced Footer with modern buttons
        footer = ft.Container(
            content=ft.Row(
                [
                    # Mark all as read button
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(
                                    ft.Icons.DONE_ALL,
                                    size=16,
                                    color=colors["primary"],
                                ),
                                ft.Container(width=6),
                                ft.Text(
                                    "Mark all read",
                                    size=13,
                                    weight=ft.FontWeight.W_600,
                                    color=colors["primary"],
                                ),
                            ],
                        ),
                        padding=ft.padding.symmetric(horizontal=14, vertical=10),
                        border_radius=8,
                        bgcolor=f"{colors['primary']}15",
                        border=ft.border.all(1, f"{colors['primary']}30"),
                        on_click=self._mark_all_read,
                        on_hover=self._on_button_hover,
                        animate=ft.Animation(150, ft.AnimationCurve.EASE_OUT),
                    ),
                    ft.Container(expand=True),
                    # View all button
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Text(
                                    "View all",
                                    size=13,
                                    weight=ft.FontWeight.W_600,
                                    color=colors["text_secondary"],
                                ),
                                ft.Container(width=4),
                                ft.Icon(
                                    ft.Icons.ARROW_FORWARD,
                                    size=14,
                                    color=colors["text_secondary"],
                                ),
                            ],
                        ),
                        padding=ft.padding.symmetric(horizontal=14, vertical=10),
                        border_radius=8,
                        on_click=lambda _: None,  # TODO: Navigate to notifications page
                        on_hover=self._on_secondary_button_hover,
                        animate=ft.Animation(150, ft.AnimationCurve.EASE_OUT),
                    ),
                ],
            ),
            padding=ft.padding.all(16),
            border=ft.border.only(top=ft.BorderSide(1, colors["border_light"])),
            bgcolor=colors["bg_tertiary"],
        )

        # Main panel with enhanced shadow and border
        self._container = ft.Container(
            content=ft.Column(
                [
                    header,
                    ft.Container(
                        content=self.notifications_list,
                        expand=True,
                    ),
                    footer,
                ],
                spacing=0,
            ),
            width=420,
            height=540,
            bgcolor=colors["bg_card"],
            border_radius=RADIUS["xl"],
            border=ft.border.all(1.5, colors["border"]),
            shadow=ft.BoxShadow(
                spread_radius=0,
                blur_radius=40,
                color="#00000030",
                offset=ft.Offset(0, 10),
            ),
        )
        return self._container
    
    def _on_close_hover(self, e):
        """Handle close button hover."""
        colors = COLORS
        if e.data == "true":
            e.control.bgcolor = colors["bg_hover"]
        else:
            e.control.bgcolor = None
        e.control.update()
    
    def _on_button_hover(self, e):
        """Handle primary button hover."""
        colors = COLORS
        if e.data == "true":
            e.control.bgcolor = f"{colors['primary']}25"
            e.control.border = ft.border.all(1, f"{colors['primary']}50")
        else:
            e.control.bgcolor = f"{colors['primary']}15"
            e.control.border = ft.border.all(1, f"{colors['primary']}30")
        e.control.update()
    
    def _on_secondary_button_hover(self, e):
        """Handle secondary button hover."""
        colors = COLORS
        if e.data == "true":
            e.control.bgcolor = colors["bg_hover"]
        else:
            e.control.bgcolor = None
        e.control.update()

    async def load_notifications(self):
        """Load notifications from API."""
        # Ensure UI is built
        if self._container is None:
            self.build()

        result = await self._notification_service.get_notifications(limit=20)

        if result.success:
            self._notifications = result.notifications
            self._build_notifications_list()
        else:
            self._show_error(result.message)

    def _build_notifications_list(self):
        """Build the notifications list UI."""
        colors = COLORS

        if not self._notifications:
            # Enhanced empty state
            self.notifications_list.controls = [
                ft.Container(
                    content=ft.Column(
                        [
                            # Icon with gradient background
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.NOTIFICATIONS_OFF,
                                    size=56,
                                    color=colors["text_muted"],
                                ),
                                width=100,
                                height=100,
                                border_radius=50,
                                gradient=ft.LinearGradient(
                                    begin=ft.alignment.Alignment(-1, -1),
                                    end=ft.alignment.Alignment(1, 1),
                                    colors=[f"{colors['primary']}15", f"{colors['primary']}05"],
                                ),
                                border=ft.border.all(1, f"{colors['border_light']}"),
                                alignment=ft.alignment.Alignment(0, 0),
                            ),
                            ft.Container(height=20),
                            ft.Text(
                                "All caught up!",
                                size=18,
                                weight=ft.FontWeight.W_700,
                                color=colors["text_primary"],
                            ),
                            ft.Container(height=6),
                            ft.Text(
                                "You have no new notifications",
                                size=13,
                                color=colors["text_secondary"],
                            ),
                        ],
                        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                    ),
                    alignment=ft.alignment.Alignment(0, 0),
                    padding=ft.padding.symmetric(vertical=80),
                )
            ]
        else:
            # Build notification items
            self.notifications_list.controls = [
                self._build_notification_item(notif)
                for notif in self._notifications
            ]

        if self.page:
            self.notifications_list.update()

    def _build_notification_item(self, notification: Notification):
        """Build a single notification item.

        Args:
            notification: Notification data

        Returns:
            Container with notification UI
        """
        colors = COLORS

        # Icon based on type with enhanced styling
        icon_map = {
            "info": (ft.Icons.INFO_OUTLINE, colors["accent_blue"]),
            "success": (ft.Icons.CHECK_CIRCLE, colors["success"]),
            "warning": (ft.Icons.WARNING_AMBER, colors["warning"]),
            "error": (ft.Icons.ERROR_OUTLINE, colors["error"]),
        }
        icon, icon_color = icon_map.get(notification.type, (ft.Icons.NOTIFICATIONS_OUTLINED, colors["primary"]))

        # Unread indicator dot
        unread_dot = None
        if not notification.is_read:
            unread_dot = ft.Container(
                width=8,
                height=8,
                border_radius=4,
                bgcolor=colors["primary"],
                border=ft.border.all(2, colors["bg_card"]),
            )

        # Mark as read button (only show for unread)
        action_button = None
        if not notification.is_read:
            action_button = ft.Container(
                content=ft.Icon(
                    ft.Icons.CIRCLE,
                    size=10,
                    color=colors["primary"],
                ),
                width=32,
                height=32,
                border_radius=8,
                bgcolor=f"{colors['primary']}15",
                alignment=ft.alignment.Alignment(0, 0),
                tooltip="Mark as read",
                on_click=lambda _, nid=notification.id: self._mark_as_read(nid),
                on_hover=self._on_action_button_hover,
                animate=ft.Animation(150, ft.AnimationCurve.EASE_OUT),
            )
        else:
            action_button = ft.Container(
                content=ft.Icon(
                    ft.Icons.CHECK_CIRCLE,
                    size=16,
                    color=colors["success"],
                    opacity=0.5,
                ),
                width=32,
                height=32,
                alignment=ft.alignment.Alignment(0, 0),
            )

        # Main notification card
        card_content = ft.Row(
            [
                # Icon with gradient background
                ft.Container(
                    content=ft.Icon(icon, size=20, color=icon_color),
                    width=44,
                    height=44,
                    border_radius=12,
                    gradient=ft.LinearGradient(
                        begin=ft.alignment.Alignment(-1, -1),
                        end=ft.alignment.Alignment(1, 1),
                        colors=[f"{icon_color}25", f"{icon_color}10"],
                    ),
                    border=ft.border.all(1, f"{icon_color}30"),
                    alignment=ft.alignment.Alignment(0, 0),
                ),
                ft.Container(width=14),
                # Content
                ft.Column(
                    [
                        # Title with unread indicator
                        ft.Row(
                            [
                                ft.Text(
                                    notification.title,
                                    size=14,
                                    weight=ft.FontWeight.W_600 if not notification.is_read else ft.FontWeight.W_500,
                                    color=colors["text_primary"],
                                    no_wrap=False,
                                    max_lines=2,
                                    overflow=ft.TextOverflow.ELLIPSIS,
                                ),
                                ft.Container(width=6) if unread_dot else ft.Container(),
                                unread_dot if unread_dot else ft.Container(),
                            ],
                        ),
                        ft.Container(height=4),
                        # Message
                        ft.Text(
                            notification.message,
                            size=13,
                            color=colors["text_secondary"],
                            no_wrap=False,
                            max_lines=2,
                            overflow=ft.TextOverflow.ELLIPSIS,
                        ),
                        ft.Container(height=8),
                        # Time badge
                        ft.Container(
                            content=ft.Row(
                                [
                                    ft.Icon(
                                        ft.Icons.SCHEDULE,
                                        size=12,
                                        color=colors["text_muted"],
                                    ),
                                    ft.Container(width=4),
                                    ft.Text(
                                        self._format_time(notification.created_at),
                                        size=11,
                                        color=colors["text_muted"],
                                        weight=ft.FontWeight.W_500,
                                    ),
                                ],
                            ),
                            padding=ft.padding.symmetric(horizontal=8, vertical=4),
                            border_radius=6,
                            bgcolor=colors["bg_tertiary"],
                        ),
                    ],
                    spacing=0,
                    expand=True,
                ),
                ft.Container(width=8),
                # Action button
                action_button,
            ],
            vertical_alignment=ft.CrossAxisAlignment.START,
        )

        # Wrapper with hover effect
        return ft.Container(
            content=card_content,
            padding=ft.padding.all(16),
            bgcolor=f"{colors['bg_hover']}80" if not notification.is_read else "transparent",
            border=ft.border.only(bottom=ft.BorderSide(1, colors["border_light"])),
            on_click=lambda _, nid=notification.id: self._on_notification_click(nid),
            on_hover=self._on_notification_hover,
            animate=ft.Animation(200, ft.AnimationCurve.EASE_OUT),
        )
    
    def _on_notification_hover(self, e):
        """Handle notification item hover."""
        colors = COLORS
        if e.data == "true":
            e.control.bgcolor = colors["bg_hover"]
        else:
            # Check if notification is unread to maintain background
            e.control.bgcolor = "transparent"
        e.control.update()
    
    def _on_action_button_hover(self, e):
        """Handle action button hover."""
        colors = COLORS
        if e.data == "true":
            e.control.bgcolor = f"{colors['primary']}25"
            e.control.border = ft.border.all(1, f"{colors['primary']}40")
        else:
            e.control.bgcolor = f"{colors['primary']}15"
            e.control.border = None
        e.control.update()

    def _format_time(self, timestamp: str) -> str:
        """Format timestamp to relative time.

        Args:
            timestamp: ISO timestamp string

        Returns:
            Formatted time string (e.g., "5 minutes ago")
        """
        # Simple implementation - in production, use a proper library
        from datetime import datetime
        try:
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            now = datetime.now(dt.tzinfo)
            diff = now - dt

            if diff.days > 0:
                return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
            elif diff.seconds >= 3600:
                hours = diff.seconds // 3600
                return f"{hours} hour{'s' if hours > 1 else ''} ago"
            elif diff.seconds >= 60:
                minutes = diff.seconds // 60
                return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
            else:
                return "Just now"
        except Exception:
            return timestamp[:10]  # Return date only

    async def _mark_as_read(self, notification_id: int):
        """Mark notification as read.

        Args:
            notification_id: ID of notification to mark
        """
        result = await self._notification_service.mark_as_read(notification_id)
        if result.success:
            # Update local state
            for notif in self._notifications:
                if notif.id == notification_id:
                    notif.is_read = True
                    break
            self._build_notifications_list()

    async def _mark_all_read(self, e):
        """Mark all notifications as read."""
        result = await self._notification_service.mark_all_as_read()
        if result.success:
            # Update local state
            for notif in self._notifications:
                notif.is_read = True
            self._build_notifications_list()

    def _on_notification_click(self, notification_id: int):
        """Handle notification click.

        Args:
            notification_id: ID of clicked notification
        """
        # Mark as read and navigate if there's a link
        self.page.run_task(self._mark_as_read, notification_id)

    def _show_error(self, message: str):
        """Show error message.

        Args:
            message: Error message
        """
        colors = COLORS
        self.notifications_list.controls = [
            ft.Container(
                content=ft.Column(
                    [
                        # Error icon with gradient background
                        ft.Container(
                            content=ft.Icon(
                                ft.Icons.ERROR_OUTLINE,
                                size=56,
                                color=colors["error"],
                            ),
                            width=100,
                            height=100,
                            border_radius=50,
                            gradient=ft.LinearGradient(
                                begin=ft.alignment.Alignment(-1, -1),
                                end=ft.alignment.Alignment(1, 1),
                                colors=[f"{colors['error']}15", f"{colors['error']}05"],
                            ),
                            border=ft.border.all(1, f"{colors['error']}30"),
                            alignment=ft.alignment.Alignment(0, 0),
                        ),
                        ft.Container(height=20),
                        ft.Text(
                            "Oops! Something went wrong",
                            size=18,
                            color=colors["text_primary"],
                            weight=ft.FontWeight.W_700,
                        ),
                        ft.Container(height=6),
                        ft.Text(
                            message,
                            size=13,
                            color=colors["text_secondary"],
                            text_align=ft.TextAlign.CENTER,
                        ),
                        ft.Container(height=20),
                        # Retry button
                        ft.Container(
                            content=ft.Row(
                                [
                                    ft.Icon(
                                        ft.Icons.REFRESH,
                                        size=16,
                                        color=colors["primary"],
                                    ),
                                    ft.Container(width=6),
                                    ft.Text(
                                        "Try again",
                                        size=13,
                                        weight=ft.FontWeight.W_600,
                                        color=colors["primary"],
                                    ),
                                ],
                            ),
                            padding=ft.padding.symmetric(horizontal=20, vertical=10),
                            border_radius=8,
                            bgcolor=f"{colors['primary']}15",
                            border=ft.border.all(1, f"{colors['primary']}30"),
                            on_click=lambda _: self.page.run_task(self.load_notifications),
                            on_hover=self._on_button_hover,
                            animate=ft.Animation(150, ft.AnimationCurve.EASE_OUT),
                        ),
                    ],
                    horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                ),
                alignment=ft.alignment.Alignment(0, 0),
                padding=ft.padding.symmetric(horizontal=20, vertical=60),
            )
        ]
        if self.page:
            self.notifications_list.update()

    def _close_panel(self):
        """Close the notification panel."""
        if self.on_close:
            self.on_close()

    def get_container(self):
        """Get the container control.

        Returns:
            The main container for this panel
        """
        if self._container is None:
            self.build()
        return self._container
