"""Authentication API module for Droidrun Controller.

This module provides HTTP API endpoints for user authentication:
- POST /api/auth/register - Create new user account
- POST /api/auth/login - Authenticate and get JWT token

Usage:
    from app.api import create_api_app, start_api_server

    # Create and run the API server
    app = create_api_app()
    await start_api_server(app, host="0.0.0.0", port=8000)
"""

from .auth import (
    create_api_app,
    start_api_server,
    stop_api_server,
    register_handler,
)

__all__ = [
    "create_api_app",
    "start_api_server",
    "stop_api_server",
    "register_handler",
]
