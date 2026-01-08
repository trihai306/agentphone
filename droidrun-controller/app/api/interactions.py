"""Interaction history API endpoints using aiohttp.

This module provides REST API endpoints for managing interaction history:
- POST /api/interactions - Save a single interaction from portal-apk
- POST /api/interactions/batch - Save multiple interactions
- GET /api/interactions - Query interactions with filters
- GET /api/interactions/{id} - Get a single interaction
- DELETE /api/interactions/{id} - Delete an interaction
- GET /api/interactions/stats - Get interaction statistics
- GET /api/interactions/sessions - Get recent sessions

Usage:
    from app.api.interactions import add_interaction_routes

    app = web.Application()
    add_interaction_routes(app)
"""

import json
from datetime import datetime
from typing import Optional

from aiohttp import web

from app.services.interaction_service import interaction_service


async def save_interaction_handler(request: web.Request) -> web.Response:
    """Handle saving a single interaction.

    POST /api/interactions

    Request body:
        {
            "device_serial": "abc123",
            "package_name": "com.example.app",
            "activity_name": "MainActivity",
            "node": {
                "class": "android.widget.Button",
                "text": "Login",
                "content_desc": "Login button",
                "resource_id": "com.example.app:id/login_btn",
                "bounds": [100, 200, 300, 250],
                "clickable": true,
                "enabled": true
            },
            "action_type": "tap",
            "tap_x": 200,
            "tap_y": 225
        }

    Response (success - 201):
        {
            "success": true,
            "message": "Interaction saved",
            "interaction_id": 1
        }
    """
    try:
        data = await request.json()
    except json.JSONDecodeError:
        return web.json_response(
            {"success": False, "message": "Invalid JSON"},
            status=400,
        )

    # Validate required fields
    if not data.get("device_serial"):
        return web.json_response(
            {"success": False, "message": "device_serial is required"},
            status=400,
        )

    try:
        interaction = await interaction_service.save_interaction(data)
        return web.json_response(
            {
                "success": True,
                "message": "Interaction saved",
                "interaction_id": interaction.id,
            },
            status=201,
        )
    except Exception as e:
        return web.json_response(
            {"success": False, "message": f"Failed to save: {str(e)}"},
            status=500,
        )


async def save_interactions_batch_handler(request: web.Request) -> web.Response:
    """Handle saving multiple interactions.

    POST /api/interactions/batch

    Request body:
        {
            "interactions": [
                { ... interaction data ... },
                { ... interaction data ... }
            ]
        }

    Response (success - 201):
        {
            "success": true,
            "message": "Interactions saved",
            "saved_count": 5,
            "interaction_ids": [1, 2, 3, 4, 5]
        }
    """
    try:
        data = await request.json()
    except json.JSONDecodeError:
        return web.json_response(
            {"success": False, "message": "Invalid JSON"},
            status=400,
        )

    interactions = data.get("interactions", [])
    if not interactions:
        return web.json_response(
            {"success": False, "message": "No interactions provided"},
            status=400,
        )

    try:
        saved_ids = await interaction_service.save_interactions_batch(interactions)
        return web.json_response(
            {
                "success": True,
                "message": "Interactions saved",
                "saved_count": len(saved_ids),
                "interaction_ids": saved_ids,
            },
            status=201,
        )
    except Exception as e:
        return web.json_response(
            {"success": False, "message": f"Failed to save: {str(e)}"},
            status=500,
        )


async def get_interactions_handler(request: web.Request) -> web.Response:
    """Handle querying interactions.

    GET /api/interactions?device_serial=abc&package_name=com.app&limit=50

    Query parameters:
        - device_serial: Filter by device
        - package_name: Filter by package
        - user_id: Filter by user
        - session_id: Filter by session
        - action_type: Filter by action type
        - start_date: Filter by start date (ISO format)
        - end_date: Filter by end date (ISO format)
        - limit: Max results (default 100)
        - offset: Pagination offset (default 0)

    Response (success - 200):
        {
            "success": true,
            "interactions": [...],
            "count": 50
        }
    """
    # Parse query parameters
    device_serial = request.query.get("device_serial")
    package_name = request.query.get("package_name")
    session_id = request.query.get("session_id")
    action_type = request.query.get("action_type")

    user_id = None
    if request.query.get("user_id"):
        try:
            user_id = int(request.query.get("user_id"))
        except ValueError:
            pass

    start_date = None
    if request.query.get("start_date"):
        try:
            start_date = datetime.fromisoformat(request.query.get("start_date"))
        except ValueError:
            pass

    end_date = None
    if request.query.get("end_date"):
        try:
            end_date = datetime.fromisoformat(request.query.get("end_date"))
        except ValueError:
            pass

    try:
        limit = int(request.query.get("limit", "100"))
        limit = min(limit, 500)  # Cap at 500
    except ValueError:
        limit = 100

    try:
        offset = int(request.query.get("offset", "0"))
    except ValueError:
        offset = 0

    try:
        interactions = await interaction_service.get_interactions(
            device_serial=device_serial,
            package_name=package_name,
            user_id=user_id,
            session_id=session_id,
            action_type=action_type,
            start_date=start_date,
            end_date=end_date,
            limit=limit,
            offset=offset,
        )

        return web.json_response(
            {
                "success": True,
                "interactions": [i.to_dict() for i in interactions],
                "count": len(interactions),
            },
            status=200,
        )
    except Exception as e:
        return web.json_response(
            {"success": False, "message": f"Query failed: {str(e)}"},
            status=500,
        )


async def get_interaction_handler(request: web.Request) -> web.Response:
    """Handle getting a single interaction.

    GET /api/interactions/{id}

    Response (success - 200):
        {
            "success": true,
            "interaction": {...}
        }
    """
    try:
        interaction_id = int(request.match_info["id"])
    except ValueError:
        return web.json_response(
            {"success": False, "message": "Invalid interaction ID"},
            status=400,
        )

    try:
        interaction = await interaction_service.get_interaction_by_id(interaction_id)
        if interaction:
            return web.json_response(
                {"success": True, "interaction": interaction.to_dict()},
                status=200,
            )
        else:
            return web.json_response(
                {"success": False, "message": "Interaction not found"},
                status=404,
            )
    except Exception as e:
        return web.json_response(
            {"success": False, "message": f"Query failed: {str(e)}"},
            status=500,
        )


async def delete_interaction_handler(request: web.Request) -> web.Response:
    """Handle deleting an interaction.

    DELETE /api/interactions/{id}

    Response (success - 200):
        {
            "success": true,
            "message": "Interaction deleted"
        }
    """
    try:
        interaction_id = int(request.match_info["id"])
    except ValueError:
        return web.json_response(
            {"success": False, "message": "Invalid interaction ID"},
            status=400,
        )

    try:
        deleted = await interaction_service.delete_interaction(interaction_id)
        if deleted:
            return web.json_response(
                {"success": True, "message": "Interaction deleted"},
                status=200,
            )
        else:
            return web.json_response(
                {"success": False, "message": "Interaction not found"},
                status=404,
            )
    except Exception as e:
        return web.json_response(
            {"success": False, "message": f"Delete failed: {str(e)}"},
            status=500,
        )


async def get_statistics_handler(request: web.Request) -> web.Response:
    """Handle getting interaction statistics.

    GET /api/interactions/stats?device_serial=abc&package_name=com.app

    Response (success - 200):
        {
            "success": true,
            "statistics": {
                "total_interactions": 1000,
                "unique_devices": 5,
                "by_action_type": {"tap": 800, "swipe": 150, ...},
                "by_package": {"com.app1": 500, "com.app2": 500}
            }
        }
    """
    device_serial = request.query.get("device_serial")
    package_name = request.query.get("package_name")

    start_date = None
    if request.query.get("start_date"):
        try:
            start_date = datetime.fromisoformat(request.query.get("start_date"))
        except ValueError:
            pass

    end_date = None
    if request.query.get("end_date"):
        try:
            end_date = datetime.fromisoformat(request.query.get("end_date"))
        except ValueError:
            pass

    try:
        stats = await interaction_service.get_statistics(
            device_serial=device_serial,
            package_name=package_name,
            start_date=start_date,
            end_date=end_date,
        )
        return web.json_response(
            {"success": True, "statistics": stats},
            status=200,
        )
    except Exception as e:
        return web.json_response(
            {"success": False, "message": f"Stats failed: {str(e)}"},
            status=500,
        )


async def get_sessions_handler(request: web.Request) -> web.Response:
    """Handle getting recent sessions.

    GET /api/interactions/sessions?device_serial=abc&limit=10

    Response (success - 200):
        {
            "success": true,
            "sessions": [
                {
                    "session_id": "uuid",
                    "device_serial": "abc",
                    "package_name": "com.app",
                    "interaction_count": 50,
                    "started_at": "2024-01-01T00:00:00",
                    "ended_at": "2024-01-01T00:30:00"
                }
            ]
        }
    """
    device_serial = request.query.get("device_serial")

    try:
        limit = int(request.query.get("limit", "10"))
        limit = min(limit, 50)
    except ValueError:
        limit = 10

    try:
        sessions = await interaction_service.get_recent_sessions(
            device_serial=device_serial,
            limit=limit,
        )
        return web.json_response(
            {"success": True, "sessions": sessions},
            status=200,
        )
    except Exception as e:
        return web.json_response(
            {"success": False, "message": f"Sessions failed: {str(e)}"},
            status=500,
        )


async def create_session_handler(request: web.Request) -> web.Response:
    """Handle creating a new session ID.

    POST /api/interactions/session/new

    Response (success - 201):
        {
            "success": true,
            "session_id": "uuid-string"
        }
    """
    session_id = interaction_service.create_session_id()
    return web.json_response(
        {"success": True, "session_id": session_id},
        status=201,
    )


def add_interaction_routes(app: web.Application) -> None:
    """Add interaction history routes to the application.

    Args:
        app: The aiohttp Application instance.
    """
    app.router.add_post("/api/interactions", save_interaction_handler)
    app.router.add_post("/api/interactions/batch", save_interactions_batch_handler)
    app.router.add_get("/api/interactions", get_interactions_handler)
    app.router.add_get("/api/interactions/stats", get_statistics_handler)
    app.router.add_get("/api/interactions/sessions", get_sessions_handler)
    app.router.add_post("/api/interactions/session/new", create_session_handler)
    app.router.add_get("/api/interactions/{id}", get_interaction_handler)
    app.router.add_delete("/api/interactions/{id}", delete_interaction_handler)
