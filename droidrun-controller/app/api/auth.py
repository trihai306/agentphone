"""Authentication API endpoints using aiohttp.

This module provides REST API endpoints for user authentication:
- POST /api/auth/register - Create new user account with email/password

The API follows best practices:
- Password hashing with bcrypt
- Email validation
- Duplicate email prevention
- Proper HTTP status codes
- JSON request/response

Configuration via environment variables:
- API_HOST: Host to bind to (default: 0.0.0.0)
- API_PORT: Port to listen on (default: 8000)
- PASSWORD_MIN_LENGTH: Minimum password length (default: 8)

Usage:
    from app.api.auth import create_api_app, start_api_server

    app = create_api_app()
    await start_api_server(app)
"""

import json
import os
import re
from typing import Optional

from aiohttp import web
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.database.connection import get_session_context, init_db
from app.database.schema import UserDB
from app.utils.auth import hash_password


# Configuration
def _get_password_min_length() -> int:
    """Get minimum password length from environment."""
    try:
        return int(os.environ.get("PASSWORD_MIN_LENGTH", "8"))
    except ValueError:
        return 8


def _get_api_host() -> str:
    """Get API host from environment."""
    return os.environ.get("API_HOST", "0.0.0.0")


def _get_api_port() -> int:
    """Get API port from environment."""
    try:
        return int(os.environ.get("API_PORT", "8000"))
    except ValueError:
        return 8000


# Email validation regex - standard RFC 5322 simplified pattern
EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
)


def validate_email(email: str) -> tuple[bool, str]:
    """Validate email format.

    Args:
        email: The email address to validate.

    Returns:
        Tuple of (is_valid, error_message).
    """
    if not email:
        return False, "Email is required"

    email = email.strip().lower()

    if len(email) > 255:
        return False, "Email must be less than 255 characters"

    if not EMAIL_REGEX.match(email):
        return False, "Invalid email format"

    return True, ""


def validate_password(password: str) -> tuple[bool, str]:
    """Validate password strength.

    Requirements:
    - Minimum length from PASSWORD_MIN_LENGTH env var (default: 8)
    - At least one letter
    - At least one number

    Args:
        password: The password to validate.

    Returns:
        Tuple of (is_valid, error_message).
    """
    if not password:
        return False, "Password is required"

    min_length = _get_password_min_length()

    if len(password) < min_length:
        return False, f"Password must be at least {min_length} characters"

    if len(password) > 128:
        return False, "Password must be less than 128 characters"

    if not re.search(r"[a-zA-Z]", password):
        return False, "Password must contain at least one letter"

    if not re.search(r"\d", password):
        return False, "Password must contain at least one number"

    return True, ""


async def register_handler(request: web.Request) -> web.Response:
    """Handle user registration.

    POST /api/auth/register

    Request body:
        {
            "email": "user@example.com",
            "password": "SecurePass123"
        }

    Response (success - 201):
        {
            "success": true,
            "message": "User registered successfully",
            "user_id": 1,
            "email": "user@example.com"
        }

    Response (error - 400):
        {
            "success": false,
            "message": "Error description"
        }

    Args:
        request: The aiohttp request object.

    Returns:
        JSON response with registration result.
    """
    try:
        # Parse JSON body
        try:
            data = await request.json()
        except json.JSONDecodeError:
            return web.json_response(
                {"success": False, "message": "Invalid JSON in request body"},
                status=400,
            )

        # Extract and validate email
        email = data.get("email", "").strip().lower()
        is_valid, error = validate_email(email)
        if not is_valid:
            return web.json_response(
                {"success": False, "message": error},
                status=400,
            )

        # Extract and validate password
        password = data.get("password", "")
        is_valid, error = validate_password(password)
        if not is_valid:
            return web.json_response(
                {"success": False, "message": error},
                status=400,
            )

        # Hash password
        password_hash = hash_password(password)

        # Create user in database
        async with get_session_context() as session:
            # Check for existing user
            existing = await session.execute(
                select(UserDB).where(UserDB.email == email)
            )
            if existing.scalar_one_or_none() is not None:
                return web.json_response(
                    {"success": False, "message": "Email already exists"},
                    status=400,
                )

            # Create new user
            user = UserDB(
                email=email,
                password_hash=password_hash,
            )
            session.add(user)
            await session.flush()  # Get the user ID
            user_id = user.id

        return web.json_response(
            {
                "success": True,
                "message": "User registered successfully",
                "user_id": user_id,
                "email": email,
            },
            status=201,
        )

    except IntegrityError:
        # Handle race condition where duplicate was inserted
        return web.json_response(
            {"success": False, "message": "Email already exists"},
            status=400,
        )

    except Exception as e:
        # Log error server-side but don't expose details to client
        # In production, use proper logging
        return web.json_response(
            {"success": False, "message": "An error occurred during registration"},
            status=500,
        )


def create_api_app() -> web.Application:
    """Create the aiohttp application with auth routes.

    Returns:
        Configured aiohttp Application instance.
    """
    app = web.Application()

    # Add CORS middleware for development
    app.middlewares.append(_cors_middleware)

    # Setup routes
    app.router.add_post("/api/auth/register", register_handler)

    # Startup/shutdown hooks
    app.on_startup.append(_on_startup)
    app.on_shutdown.append(_on_shutdown)

    return app


@web.middleware
async def _cors_middleware(
    request: web.Request, handler
) -> web.Response:
    """Middleware to add CORS headers for development.

    Args:
        request: The incoming request.
        handler: The route handler.

    Returns:
        Response with CORS headers.
    """
    # Handle preflight OPTIONS request
    if request.method == "OPTIONS":
        response = web.Response(status=204)
    else:
        try:
            response = await handler(request)
        except web.HTTPException as ex:
            response = ex

    # Add CORS headers
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"

    return response


async def _on_startup(app: web.Application) -> None:
    """Initialize database on application startup."""
    await init_db()


async def _on_shutdown(app: web.Application) -> None:
    """Cleanup on application shutdown."""
    from app.database.connection import close_db
    await close_db()


# Module-level runner for the API server
_runner: Optional[web.AppRunner] = None
_site: Optional[web.TCPSite] = None


async def start_api_server(
    app: Optional[web.Application] = None,
    host: Optional[str] = None,
    port: Optional[int] = None,
) -> None:
    """Start the API server.

    Args:
        app: Optional aiohttp Application. If not provided, creates one.
        host: Host to bind to. Defaults to API_HOST env var or 0.0.0.0.
        port: Port to listen on. Defaults to API_PORT env var or 8000.
    """
    global _runner, _site

    if app is None:
        app = create_api_app()

    if host is None:
        host = _get_api_host()

    if port is None:
        port = _get_api_port()

    _runner = web.AppRunner(app)
    await _runner.setup()
    _site = web.TCPSite(_runner, host, port)
    await _site.start()


async def stop_api_server() -> None:
    """Stop the API server."""
    global _runner, _site

    if _site is not None:
        await _site.stop()
        _site = None

    if _runner is not None:
        await _runner.cleanup()
        _runner = None
