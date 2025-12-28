"""Authentication service for making API requests to Laravel backend.

This module provides an API client for authentication operations:
- Register: Create new user accounts
- Login: Authenticate existing users

The service communicates with the Laravel backend API and returns typed responses
that can be used by the UI views.

Usage:
    from app.services.auth_service import AuthService, get_auth_service

    auth_service = get_auth_service()
    result = await auth_service.login("user@example.com", "password123")
    if result.success:
        print(f"Logged in! Token: {result.token}")
"""

import os
from dataclasses import dataclass
from typing import Optional

import aiohttp


@dataclass
class AuthResult:
    """Result of an authentication operation.

    Attributes:
        success: Whether the operation succeeded.
        message: Human-readable result message.
        user_id: The authenticated user's ID (on success).
        email: The authenticated user's email (on success).
        token: JWT access token (on successful login).
    """

    success: bool
    message: str
    user_id: Optional[int] = None
    email: Optional[str] = None
    name: Optional[str] = None
    token: Optional[str] = None

    @classmethod
    def from_laravel_response(cls, data: dict, status_code: int) -> "AuthResult":
        """Create AuthResult from Laravel API response.

        Args:
            data: The JSON response from the Laravel API.
            status_code: HTTP status code from the response.

        Returns:
            AuthResult populated with response data.
        """
        # Handle error responses
        if status_code >= 400:
            message = data.get("message", "Request failed")
            return cls(success=False, message=message)

        # Handle successful registration (no token returned)
        if "user" in data and "token" not in data:
            user = data["user"]
            return cls(
                success=True,
                message=data.get("message", "Registration successful"),
                user_id=user.get("id"),
                email=user.get("email"),
                name=user.get("name"),
            )

        # Handle successful login (token returned)
        if "token" in data:
            user = data.get("user", {})
            return cls(
                success=True,
                message="Login successful",
                user_id=user.get("id"),
                email=user.get("email"),
                name=user.get("name"),
                token=data["token"],
            )

        # Handle user profile response (direct user object)
        if "id" in data and "email" in data:
            return cls(
                success=True,
                message="Profile retrieved",
                user_id=data.get("id"),
                email=data.get("email"),
                name=data.get("name"),
            )

        # Unknown response format
        return cls(success=False, message="Unknown response format")

    @classmethod
    def error(cls, message: str) -> "AuthResult":
        """Create an error result.

        Args:
            message: The error message.

        Returns:
            AuthResult configured for error.
        """
        return cls(success=False, message=message)


class AuthService:
    """Service for interacting with the Laravel authentication API.

    This service provides methods to register and login users via the
    Laravel API endpoints. It handles HTTP communication, error handling,
    and response parsing.

    Attributes:
        base_url: The base URL for the Laravel API.
    """

    def __init__(self, base_url: Optional[str] = None):
        """Initialize the auth service.

        Args:
            base_url: Optional base URL for the API. If not provided,
                      reads from LARAVEL_API_URL environment variable or
                      defaults to https://laravel-backend.test.
        """
        if base_url is None:
            base_url = os.environ.get("LARAVEL_API_URL", "https://laravel-backend.test")

        self.base_url = base_url.rstrip("/")
        self._timeout = aiohttp.ClientTimeout(total=30)
        self._access_token: Optional[str] = None

        # SSL context for development (bypass certificate verification)
        # This is safe for local development with Valet/Herd self-signed certs
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

    async def register(self, email: str, password: str) -> AuthResult:
        """Register a new user account.

        Makes a POST request to /api/register with the provided
        email and password. Returns the result of the registration attempt.

        Args:
            email: The user's email address.
            password: The user's password.

        Returns:
            AuthResult with success status and user details on success,
            or error message on failure.
        """
        url = f"{self.base_url}/api/register"

        try:
            # Use connector with SSL context for HTTPS
            connector = aiohttp.TCPConnector(ssl=self._ssl_context)
            async with aiohttp.ClientSession(timeout=self._timeout, connector=connector) as session:
                async with session.post(
                    url,
                    json={"email": email, "password": password},
                    headers={
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                ) as response:
                    try:
                        data = await response.json()
                        return AuthResult.from_laravel_response(data, response.status)
                    except aiohttp.ContentTypeError:
                        # Response is not JSON
                        return AuthResult.error(
                            "Server returned invalid response format"
                        )

        except aiohttp.ClientConnectorError:
            return AuthResult.error(
                "Unable to connect to server. Please check your connection."
            )
        except asyncio.TimeoutError:
            return AuthResult.error(
                "Request timed out. Please try again."
            )
        except aiohttp.ClientError as e:
            return AuthResult.error(f"Network error: {str(e)}")
        except Exception as e:
            return AuthResult.error(f"An unexpected error occurred: {str(e)}")

    async def login(self, email: str, password: str) -> AuthResult:
        """Login with existing credentials.

        Makes a POST request to /api/login with the provided
        email and password. Returns the result including JWT token on success.

        Args:
            email: The user's email address.
            password: The user's password.

        Returns:
            AuthResult with success status, JWT token, and user details
            on success, or error message on failure.
        """
        url = f"{self.base_url}/api/login"

        try:
            # Use connector with SSL context for HTTPS
            connector = aiohttp.TCPConnector(ssl=self._ssl_context)
            async with aiohttp.ClientSession(timeout=self._timeout, connector=connector) as session:
                async with session.post(
                    url,
                    json={"email": email, "password": password},
                    headers={
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                ) as response:
                    try:
                        data = await response.json()
                        result = AuthResult.from_laravel_response(data, response.status)
                        if result.success and result.token:
                            self.token = result.token
                        return result
                    except aiohttp.ContentTypeError:
                        # Response is not JSON
                        return AuthResult.error(
                            "Server returned invalid response format"
                        )

        except aiohttp.ClientConnectorError:
            return AuthResult.error(
                "Unable to connect to server. Please check your connection."
            )
        except asyncio.TimeoutError:
            return AuthResult.error(
                "Request timed out. Please try again."
            )
        except aiohttp.ClientError as e:
            return AuthResult.error(f"Network error: {str(e)}")
        except Exception as e:
            return AuthResult.error(f"An unexpected error occurred: {str(e)}")

    async def get_user_profile(self, token: Optional[str] = None) -> AuthResult:
        """Get the authenticated user's profile.

        Makes a GET request to /api/user with the Bearer token.

        Args:
            token: The JWT access token. If None, uses stored token.

        Returns:
            AuthResult with user details on success.
        """
        target_token = token or self.token
        if not target_token:
            return AuthResult.error("No access token available. Please login first.")

        url = f"{self.base_url}/api/user"

        try:
            connector = aiohttp.TCPConnector(ssl=self._ssl_context)
            async with aiohttp.ClientSession(timeout=self._timeout, connector=connector) as session:
                async with session.get(
                    url,
                    headers={
                        "Authorization": f"Bearer {target_token}",
                        "Accept": "application/json",
                    },
                ) as response:
                    try:
                        data = await response.json()
                        return AuthResult.from_laravel_response(data, response.status)
                    except aiohttp.ContentTypeError:
                        return AuthResult.error(
                            "Server returned invalid response format"
                        )

        except aiohttp.ClientConnectorError:
            return AuthResult.error(
                "Unable to connect to server. Please check your connection."
            )
        except asyncio.TimeoutError:
            return AuthResult.error(
                "Request timed out. Please try again."
            )
        except aiohttp.ClientError as e:
            return AuthResult.error(f"Network error: {str(e)}")
        except Exception as e:
            return AuthResult.error(f"An unexpected error occurred: {str(e)}")

    async def check_health(self) -> bool:
        """Check if the Laravel API server is reachable.

        Makes a simple connection test to verify the server is running.

        Returns:
            True if server is reachable, False otherwise.
        """
        try:
            connector = aiohttp.TCPConnector(ssl=self._ssl_context)
            async with aiohttp.ClientSession(timeout=self._timeout, connector=connector) as session:
                async with session.get(f"{self.base_url}/api/user") as response:
                    # Any response means server is up (even 401 unauthorized)
                    return True
        except Exception:
            return False


# Global auth service instance (will be initialized on first use)
_auth_service: Optional[AuthService] = None


def get_auth_service(base_url: Optional[str] = None) -> AuthService:
    """Get or create the global auth service instance.

    Args:
        base_url: Optional base URL for the API. Only used when creating
                  a new instance.

    Returns:
        The global AuthService instance.
    """
    global _auth_service
    if _auth_service is None:
        _auth_service = AuthService(base_url)
    return _auth_service


def reset_auth_service() -> None:
    """Reset the global auth service instance.

    Useful for testing or reconfiguring the service.
    """
    global _auth_service
    _auth_service = None


# Import asyncio at module level for TimeoutError
import asyncio
