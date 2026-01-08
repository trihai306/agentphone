"""Notification service for fetching notifications from Laravel backend."""

import os
from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime

import aiohttp


@dataclass
class Notification:
    """Notification data model.

    Attributes:
        id: Notification ID
        title: Notification title
        message: Notification message
        type: Notification type (info, success, warning, error)
        is_read: Whether the notification has been read
        created_at: When the notification was created
        link: Optional link associated with the notification
    """

    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: str
    link: Optional[str] = None

    @classmethod
    def from_api_response(cls, data: dict) -> "Notification":
        """Create Notification from API response.

        Args:
            data: The JSON notification object from the API.

        Returns:
            Notification instance.
        """
        return cls(
            id=data.get("id", 0),
            title=data.get("title", ""),
            message=data.get("message", ""),
            type=data.get("type", "info"),
            is_read=bool(data.get("is_read", False)),
            created_at=data.get("created_at", ""),
            link=data.get("link"),
        )


@dataclass
class NotificationResult:
    """Result of a notification operation.

    Attributes:
        success: Whether the operation succeeded
        message: Human-readable result message
        notifications: List of notifications (if applicable)
        unread_count: Number of unread notifications (if applicable)
    """

    success: bool
    message: str
    notifications: List[Notification] = None
    unread_count: int = 0

    def __post_init__(self):
        """Initialize default values."""
        if self.notifications is None:
            self.notifications = []


class NotificationService:
    """Service for interacting with the Laravel notification API.

    This service provides methods to fetch and manage user notifications.
    """

    def __init__(self, base_url: Optional[str] = None, token: Optional[str] = None):
        """Initialize the notification service.

        Args:
            base_url: Optional base URL for the API. If not provided,
                      reads from LARAVEL_API_URL environment variable.
            token: Optional authentication token. Must be provided before making requests.
        """
        if base_url is None:
            base_url = os.environ.get("LARAVEL_API_URL", "https://laravel-backend.test")

        self.base_url = base_url.rstrip("/")
        self._access_token: Optional[str] = token
        self._timeout = aiohttp.ClientTimeout(total=30)

        # SSL context for development (bypass certificate verification)
        import ssl
        self._ssl_context = ssl.create_default_context()
        self._ssl_context.check_hostname = False
        self._ssl_context.verify_mode = ssl.CERT_NONE

    @property
    def token(self) -> Optional[str]:
        """Get the current access token."""
        return self._access_token

    @token.setter
    def token(self, value: Optional[str]):
        """Set the access token."""
        self._access_token = value

    async def get_notifications(self, page: int = 1, limit: int = 20) -> NotificationResult:
        """Get user notifications with pagination.

        Args:
            page: Page number (default: 1)
            limit: Number of notifications per page (default: 20)

        Returns:
            NotificationResult with list of notifications.
        """
        if not self._access_token:
            return NotificationResult(
                success=False,
                message="No access token available. Please login first."
            )

        url = f"{self.base_url}/api/notifications"
        params = {"page": page, "limit": limit}

        try:
            connector = aiohttp.TCPConnector(ssl=self._ssl_context)
            async with aiohttp.ClientSession(timeout=self._timeout, connector=connector) as session:
                async with session.get(
                    url,
                    params=params,
                    headers={
                        "Authorization": f"Bearer {self._access_token}",
                        "Accept": "application/json",
                    },
                ) as response:
                    if response.status >= 400:
                        data = await response.json()
                        return NotificationResult(
                            success=False,
                            message=data.get("message", "Failed to fetch notifications")
                        )

                    data = await response.json()

                    # API returns: { "success": true, "data": { "notifications": [...], "unread_count": N } }
                    response_data = data.get("data", {})
                    notifications_data = response_data.get("notifications", [])

                    notifications = [
                        Notification.from_api_response(n)
                        for n in notifications_data
                        if isinstance(n, dict)  # Safety check
                    ]

                    return NotificationResult(
                        success=True,
                        message="Notifications fetched successfully",
                        notifications=notifications,
                        unread_count=response_data.get("unread_count", 0)
                    )

        except aiohttp.ClientConnectorError:
            return NotificationResult(
                success=False,
                message="Unable to connect to server"
            )
        except Exception as e:
            return NotificationResult(
                success=False,
                message=f"An error occurred: {str(e)}"
            )

    async def get_unread_count(self) -> NotificationResult:
        """Get count of unread notifications.

        Returns:
            NotificationResult with unread_count.
        """
        if not self._access_token:
            return NotificationResult(
                success=False,
                message="No access token available. Please login first."
            )

        url = f"{self.base_url}/api/notifications/unread-count"

        try:
            connector = aiohttp.TCPConnector(ssl=self._ssl_context)
            async with aiohttp.ClientSession(timeout=self._timeout, connector=connector) as session:
                async with session.get(
                    url,
                    headers={
                        "Authorization": f"Bearer {self._access_token}",
                        "Accept": "application/json",
                    },
                ) as response:
                    if response.status >= 400:
                        data = await response.json()
                        return NotificationResult(
                            success=False,
                            message=data.get("message", "Failed to fetch unread count")
                        )

                    data = await response.json()

                    return NotificationResult(
                        success=True,
                        message="Unread count fetched successfully",
                        unread_count=data.get("unread_count", 0)
                    )

        except aiohttp.ClientConnectorError:
            return NotificationResult(
                success=False,
                message="Unable to connect to server"
            )
        except Exception as e:
            return NotificationResult(
                success=False,
                message=f"An error occurred: {str(e)}"
            )

    async def mark_as_read(self, notification_id: int) -> NotificationResult:
        """Mark a notification as read.

        Args:
            notification_id: ID of the notification to mark as read.

        Returns:
            NotificationResult indicating success or failure.
        """
        if not self._access_token:
            return NotificationResult(
                success=False,
                message="No access token available. Please login first."
            )

        url = f"{self.base_url}/api/notifications/{notification_id}/read"

        try:
            connector = aiohttp.TCPConnector(ssl=self._ssl_context)
            async with aiohttp.ClientSession(timeout=self._timeout, connector=connector) as session:
                async with session.post(
                    url,
                    headers={
                        "Authorization": f"Bearer {self._access_token}",
                        "Accept": "application/json",
                    },
                ) as response:
                    if response.status >= 400:
                        data = await response.json()
                        return NotificationResult(
                            success=False,
                            message=data.get("message", "Failed to mark notification as read")
                        )

                    return NotificationResult(
                        success=True,
                        message="Notification marked as read"
                    )

        except aiohttp.ClientConnectorError:
            return NotificationResult(
                success=False,
                message="Unable to connect to server"
            )
        except Exception as e:
            return NotificationResult(
                success=False,
                message=f"An error occurred: {str(e)}"
            )

    async def mark_all_as_read(self) -> NotificationResult:
        """Mark all notifications as read.

        Returns:
            NotificationResult indicating success or failure.
        """
        if not self._access_token:
            return NotificationResult(
                success=False,
                message="No access token available. Please login first."
            )

        url = f"{self.base_url}/api/notifications/read-all"

        try:
            connector = aiohttp.TCPConnector(ssl=self._ssl_context)
            async with aiohttp.ClientSession(timeout=self._timeout, connector=connector) as session:
                async with session.post(
                    url,
                    headers={
                        "Authorization": f"Bearer {self._access_token}",
                        "Accept": "application/json",
                    },
                ) as response:
                    if response.status >= 400:
                        data = await response.json()
                        return NotificationResult(
                            success=False,
                            message=data.get("message", "Failed to mark all notifications as read")
                        )

                    return NotificationResult(
                        success=True,
                        message="All notifications marked as read"
                    )

        except aiohttp.ClientConnectorError:
            return NotificationResult(
                success=False,
                message="Unable to connect to server"
            )
        except Exception as e:
            return NotificationResult(
                success=False,
                message=f"An error occurred: {str(e)}"
            )


# Global notification service instance
_notification_service: Optional[NotificationService] = None


def get_notification_service(base_url: Optional[str] = None, token: Optional[str] = None) -> NotificationService:
    """Get or create the global notification service instance.

    Args:
        base_url: Optional base URL for the API.
        token: Optional authentication token.

    Returns:
        The global NotificationService instance.
    """
    global _notification_service
    if _notification_service is None:
        _notification_service = NotificationService(base_url, token)
    elif token is not None:
        _notification_service.token = token
    return _notification_service


def reset_notification_service() -> None:
    """Reset the global notification service instance."""
    global _notification_service
    _notification_service = None
