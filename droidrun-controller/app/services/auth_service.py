"""Authentication service for making API requests to auth endpoints.

This module provides an API client for authentication operations:
- Register: Create new user accounts
- Login: Authenticate existing users

The service communicates with the auth API server and returns typed responses
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
    token: Optional[str] = None

    @classmethod
    def from_api_response(cls, data: dict) -> "AuthResult":
        """Create AuthResult from API response JSON.

        Args:
            data: The JSON response from the auth API.

        Returns:
            AuthResult populated with response data.
        """
        return cls(
            success=data.get("success", False),
            message=data.get("message", "Unknown response"),
            user_id=data.get("user_id"),
            email=data.get("email"),
            token=data.get("token"),
        )

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
    """Service for interacting with the authentication API.

    This service provides methods to register and login users via the
    auth API endpoints. It handles HTTP communication, error handling,
    and response parsing.

    Attributes:
        base_url: The base URL for the auth API.
    """

    def __init__(self, base_url: Optional[str] = None):
        """Initialize the auth service.

        Args:
            base_url: Optional base URL for the API. If not provided,
                      reads from API_BASE_URL environment variable or
                      defaults to http://localhost:8000.
        """
        if base_url is None:
            host = os.environ.get("API_HOST", "localhost")
            port = os.environ.get("API_PORT", "8000")
            # For client requests, use localhost instead of 0.0.0.0
            if host == "0.0.0.0":
                host = "localhost"
            base_url = f"http://{host}:{port}"

        self.base_url = base_url.rstrip("/")
        self._timeout = aiohttp.ClientTimeout(total=30)

    async def register(self, email: str, password: str) -> AuthResult:
        """Register a new user account.

        Makes a POST request to /api/auth/register with the provided
        email and password. Returns the result of the registration attempt.

        Args:
            email: The user's email address.
            password: The user's password.

        Returns:
            AuthResult with success status and user details on success,
            or error message on failure.
        """
        url = f"{self.base_url}/api/auth/register"

        try:
            async with aiohttp.ClientSession(timeout=self._timeout) as session:
                async with session.post(
                    url,
                    json={"email": email, "password": password},
                    headers={"Content-Type": "application/json"},
                ) as response:
                    try:
                        data = await response.json()
                        return AuthResult.from_api_response(data)
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

        Makes a POST request to /api/auth/login with the provided
        email and password. Returns the result including JWT token on success.

        Args:
            email: The user's email address.
            password: The user's password.

        Returns:
            AuthResult with success status, JWT token, and user details
            on success, or error message on failure.
        """
        url = f"{self.base_url}/api/auth/login"

        try:
            async with aiohttp.ClientSession(timeout=self._timeout) as session:
                async with session.post(
                    url,
                    json={"email": email, "password": password},
                    headers={"Content-Type": "application/json"},
                ) as response:
                    try:
                        data = await response.json()
                        return AuthResult.from_api_response(data)
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

    async def check_health(self) -> bool:
        """Check if the auth API server is reachable.

        Makes a simple connection test to verify the server is running.

        Returns:
            True if server is reachable, False otherwise.
        """
        try:
            async with aiohttp.ClientSession(timeout=self._timeout) as session:
                async with session.get(self.base_url) as response:
                    # Any response means server is up
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
