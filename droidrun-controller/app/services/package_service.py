"""Package service for making API requests to Laravel backend.

This module provides an API client for package and subscription operations:
- List available packages
- Get user's active subscription
- Subscribe to a package
- Cancel subscription
- Get subscription history

The service communicates with the Laravel backend API and returns typed responses
that can be used by the UI views.

Usage:
    from app.services.package_service import PackageService, get_package_service

    package_service = get_package_service()
    result = await package_service.get_available_packages()
    if result.success:
        print(f"Found {len(result.packages)} packages")
"""

import os
from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime

import aiohttp


@dataclass
class Package:
    """Represents a subscription package.

    Attributes:
        id: Package ID
        name: Package name
        description: Package description
        price: Package price
        currency: Currency code (e.g., "VND", "USD")
        duration_days: Duration in days
        features: List of features
        is_popular: Whether this is a popular package
    """
    id: int
    name: str
    description: str
    price: float
    currency: str
    duration_days: int
    features: List[str]
    is_popular: bool = False

    @classmethod
    def from_dict(cls, data: dict) -> "Package":
        """Create Package from dictionary."""
        return cls(
            id=data.get("id", 0),
            name=data.get("name", ""),
            description=data.get("description", ""),
            price=float(data.get("price", 0)),
            currency=data.get("currency", "VND"),
            duration_days=data.get("duration_days", 30),
            features=data.get("features", []),
            is_popular=data.get("is_popular", False),
        )


@dataclass
class Subscription:
    """Represents a user subscription.

    Attributes:
        id: Subscription ID
        package_id: Related package ID
        package_name: Package name
        status: Subscription status (active, cancelled, expired)
        started_at: Start date
        expires_at: Expiration date
        auto_renew: Whether auto-renewal is enabled
    """
    id: int
    package_id: int
    package_name: str
    status: str
    started_at: datetime
    expires_at: datetime
    auto_renew: bool = False

    @classmethod
    def from_dict(cls, data: dict) -> "Subscription":
        """Create Subscription from dictionary."""
        started_at = data.get("started_at")
        expires_at = data.get("expires_at")

        # Parse datetime strings if they are strings
        if isinstance(started_at, str):
            started_at = datetime.fromisoformat(started_at.replace("Z", "+00:00"))
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))

        return cls(
            id=data.get("id", 0),
            package_id=data.get("package_id", 0),
            package_name=data.get("package_name", ""),
            status=data.get("status", "inactive"),
            started_at=started_at or datetime.now(),
            expires_at=expires_at or datetime.now(),
            auto_renew=data.get("auto_renew", False),
        )


@dataclass
class PackageResult:
    """Result of a package operation.

    Attributes:
        success: Whether the operation succeeded
        message: Human-readable result message
        packages: List of packages (for list operations)
        subscription: Current subscription (for subscription operations)
        subscriptions: List of subscriptions (for history operations)
    """
    success: bool
    message: str
    packages: Optional[List[Package]] = None
    subscription: Optional[Subscription] = None
    subscriptions: Optional[List[Subscription]] = None

    @classmethod
    def from_laravel_response(cls, data: dict, status_code: int) -> "PackageResult":
        """Create PackageResult from Laravel API response."""
        # Handle error responses
        if status_code >= 400:
            message = data.get("message", "Request failed")
            return cls(success=False, message=message)

        # Handle package list response
        if "packages" in data:
            packages = [Package.from_dict(p) for p in data["packages"]]
            return cls(
                success=True,
                message=data.get("message", "Packages retrieved"),
                packages=packages,
            )

        # Handle subscription response
        if "subscription" in data:
            subscription = Subscription.from_dict(data["subscription"])
            return cls(
                success=True,
                message=data.get("message", "Subscription retrieved"),
                subscription=subscription,
            )

        # Handle subscription list response
        if "subscriptions" in data:
            subscriptions = [Subscription.from_dict(s) for s in data["subscriptions"]]
            return cls(
                success=True,
                message=data.get("message", "Subscriptions retrieved"),
                subscriptions=subscriptions,
            )

        # Generic success
        return cls(
            success=True,
            message=data.get("message", "Operation successful"),
        )

    @classmethod
    def error(cls, message: str) -> "PackageResult":
        """Create an error result."""
        return cls(success=False, message=message)


class PackageService:
    """Service for interacting with the Laravel package API.

    This service provides methods to manage packages and subscriptions.
    """

    def __init__(self, base_url: Optional[str] = None, auth_token: Optional[str] = None):
        """Initialize the package service.

        Args:
            base_url: Optional base URL for the API
            auth_token: Optional authentication token
        """
        if base_url is None:
            base_url = os.environ.get("LARAVEL_API_URL", "https://laravel-backend.test")

        self.base_url = base_url.rstrip("/")
        self._timeout = aiohttp.ClientTimeout(total=30)
        self._auth_token = auth_token

        # SSL context for development
        import ssl
        self._ssl_context = ssl.create_default_context()
        self._ssl_context.check_hostname = False
        self._ssl_context.verify_mode = ssl.CERT_NONE

    @property
    def token(self) -> Optional[str]:
        """Get the current access token."""
        return self._auth_token

    @token.setter
    def token(self, value: Optional[str]):
        """Set the access token."""
        self._auth_token = value

    def _get_headers(self) -> dict:
        """Get request headers with authentication."""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if self._auth_token:
            headers["Authorization"] = f"Bearer {self._auth_token}"
        return headers

    async def get_available_packages(self) -> PackageResult:
        """Get all available packages.

        Returns:
            PackageResult with list of available packages.
        """
        url = f"{self.base_url}/api/packages"

        try:
            connector = aiohttp.TCPConnector(ssl=self._ssl_context)
            async with aiohttp.ClientSession(timeout=self._timeout, connector=connector) as session:
                async with session.get(
                    url,
                    headers=self._get_headers(),
                ) as response:
                    try:
                        data = await response.json()
                        return PackageResult.from_laravel_response(data, response.status)
                    except aiohttp.ContentTypeError:
                        return PackageResult.error("Server returned invalid response format")

        except aiohttp.ClientConnectorError:
            return PackageResult.error("Unable to connect to server. Please check your connection.")
        except asyncio.TimeoutError:
            return PackageResult.error("Request timed out. Please try again.")
        except Exception as e:
            return PackageResult.error(f"An unexpected error occurred: {str(e)}")

    async def get_current_subscription(self) -> PackageResult:
        """Get user's current active subscription.

        Returns:
            PackageResult with current subscription details.
        """
        url = f"{self.base_url}/api/subscriptions/current"

        try:
            connector = aiohttp.TCPConnector(ssl=self._ssl_context)
            async with aiohttp.ClientSession(timeout=self._timeout, connector=connector) as session:
                async with session.get(
                    url,
                    headers=self._get_headers(),
                ) as response:
                    try:
                        data = await response.json()
                        return PackageResult.from_laravel_response(data, response.status)
                    except aiohttp.ContentTypeError:
                        return PackageResult.error("Server returned invalid response format")

        except aiohttp.ClientConnectorError:
            return PackageResult.error("Unable to connect to server. Please check your connection.")
        except asyncio.TimeoutError:
            return PackageResult.error("Request timed out. Please try again.")
        except Exception as e:
            return PackageResult.error(f"An unexpected error occurred: {str(e)}")

    async def get_subscription_history(self) -> PackageResult:
        """Get user's subscription history.

        Returns:
            PackageResult with list of subscriptions.
        """
        url = f"{self.base_url}/api/subscriptions"

        try:
            connector = aiohttp.TCPConnector(ssl=self._ssl_context)
            async with aiohttp.ClientSession(timeout=self._timeout, connector=connector) as session:
                async with session.get(
                    url,
                    headers=self._get_headers(),
                ) as response:
                    try:
                        data = await response.json()
                        return PackageResult.from_laravel_response(data, response.status)
                    except aiohttp.ContentTypeError:
                        return PackageResult.error("Server returned invalid response format")

        except aiohttp.ClientConnectorError:
            return PackageResult.error("Unable to connect to server. Please check your connection.")
        except asyncio.TimeoutError:
            return PackageResult.error("Request timed out. Please try again.")
        except Exception as e:
            return PackageResult.error(f"An unexpected error occurred: {str(e)}")

    async def subscribe(self, package_id: int) -> PackageResult:
        """Subscribe to a package.

        Args:
            package_id: The package ID to subscribe to

        Returns:
            PackageResult with subscription details.
        """
        url = f"{self.base_url}/api/subscriptions"

        try:
            connector = aiohttp.TCPConnector(ssl=self._ssl_context)
            async with aiohttp.ClientSession(timeout=self._timeout, connector=connector) as session:
                async with session.post(
                    url,
                    json={"package_id": package_id},
                    headers=self._get_headers(),
                ) as response:
                    try:
                        data = await response.json()
                        return PackageResult.from_laravel_response(data, response.status)
                    except aiohttp.ContentTypeError:
                        return PackageResult.error("Server returned invalid response format")

        except aiohttp.ClientConnectorError:
            return PackageResult.error("Unable to connect to server. Please check your connection.")
        except asyncio.TimeoutError:
            return PackageResult.error("Request timed out. Please try again.")
        except Exception as e:
            return PackageResult.error(f"An unexpected error occurred: {str(e)}")

    async def cancel_subscription(self, subscription_id: int) -> PackageResult:
        """Cancel a subscription.

        Args:
            subscription_id: The subscription ID to cancel

        Returns:
            PackageResult with operation status.
        """
        url = f"{self.base_url}/api/subscriptions/{subscription_id}"

        try:
            connector = aiohttp.TCPConnector(ssl=self._ssl_context)
            async with aiohttp.ClientSession(timeout=self._timeout, connector=connector) as session:
                async with session.delete(
                    url,
                    headers=self._get_headers(),
                ) as response:
                    try:
                        data = await response.json()
                        return PackageResult.from_laravel_response(data, response.status)
                    except aiohttp.ContentTypeError:
                        return PackageResult.error("Server returned invalid response format")

        except aiohttp.ClientConnectorError:
            return PackageResult.error("Unable to connect to server. Please check your connection.")
        except asyncio.TimeoutError:
            return PackageResult.error("Request timed out. Please try again.")
        except Exception as e:
            return PackageResult.error(f"An unexpected error occurred: {str(e)}")


# Global package service instance
_package_service: Optional[PackageService] = None


def get_package_service(base_url: Optional[str] = None, auth_token: Optional[str] = None) -> PackageService:
    """Get or create the global package service instance."""
    global _package_service
    if _package_service is None:
        _package_service = PackageService(base_url, auth_token)
    return _package_service


def reset_package_service() -> None:
    """Reset the global package service instance."""
    global _package_service
    _package_service = None


# Import asyncio at module level
import asyncio
