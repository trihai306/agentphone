"""API module for Droidrun Controller.

This module provides HTTP API endpoints for:
- User authentication (register, login)
- Interaction history (save, query, stats)

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
from .interactions import add_interaction_routes

__all__ = [
    "create_api_app",
    "start_api_server",
    "stop_api_server",
    "register_handler",
    "add_interaction_routes",
]
