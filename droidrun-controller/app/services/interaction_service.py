"""Interaction history service for managing user interaction data.

This module provides services for:
- Saving interaction history from portal-apk
- Querying interaction history
- Syncing with Laravel backend
- Generating analytics from interactions

Usage:
    from app.services.interaction_service import interaction_service

    # Save an interaction
    await interaction_service.save_interaction(data)

    # Get interactions for a device
    interactions = await interaction_service.get_interactions(device_serial="abc123")
"""

import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import uuid4

import httpx
from sqlalchemy import select, desc, func, and_

from app.database.connection import get_session_context
from app.database.schema import InteractionHistoryDB


class InteractionService:
    """Service for managing interaction history."""

    def __init__(self):
        self._backend_url: Optional[str] = None
        self._auth_token: Optional[str] = None

    def configure(self, backend_url: str, auth_token: Optional[str] = None):
        """Configure the service with backend URL and auth token.

        Args:
            backend_url: URL of the Laravel backend API.
            auth_token: JWT token for authentication.
        """
        self._backend_url = backend_url.rstrip("/")
        self._auth_token = auth_token

    async def save_interaction(self, data: Dict[str, Any]) -> InteractionHistoryDB:
        """Save an interaction to the local database.

        Args:
            data: Interaction data from portal-apk containing:
                - device_serial: Device identifier
                - package_name: App package name
                - activity_name: Current activity
                - node: Node information dict
                - action_type: tap, long_tap, swipe, etc.
                - tap_x, tap_y: Coordinates
                - screenshot_path: Optional screenshot

        Returns:
            The saved InteractionHistoryDB instance.
        """
        async with get_session_context() as session:
            interaction = InteractionHistoryDB.from_api_data(data)
            session.add(interaction)
            await session.flush()
            interaction_id = interaction.id

            # Return a copy of the data for response
            return interaction

    async def save_interactions_batch(
        self, interactions: List[Dict[str, Any]]
    ) -> List[int]:
        """Save multiple interactions in a single transaction.

        Args:
            interactions: List of interaction data dictionaries.

        Returns:
            List of saved interaction IDs.
        """
        async with get_session_context() as session:
            saved_ids = []
            for data in interactions:
                interaction = InteractionHistoryDB.from_api_data(data)
                session.add(interaction)
                await session.flush()
                saved_ids.append(interaction.id)
            return saved_ids

    async def get_interactions(
        self,
        device_serial: Optional[str] = None,
        package_name: Optional[str] = None,
        user_id: Optional[int] = None,
        session_id: Optional[str] = None,
        action_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[InteractionHistoryDB]:
        """Query interactions with various filters.

        Args:
            device_serial: Filter by device serial.
            package_name: Filter by package name.
            user_id: Filter by user ID.
            session_id: Filter by session ID.
            action_type: Filter by action type.
            start_date: Filter by start date.
            end_date: Filter by end date.
            limit: Maximum number of results.
            offset: Offset for pagination.

        Returns:
            List of matching InteractionHistoryDB instances.
        """
        async with get_session_context() as session:
            query = select(InteractionHistoryDB)

            # Apply filters
            conditions = []
            if device_serial:
                conditions.append(InteractionHistoryDB.device_serial == device_serial)
            if package_name:
                conditions.append(InteractionHistoryDB.package_name == package_name)
            if user_id:
                conditions.append(InteractionHistoryDB.user_id == user_id)
            if session_id:
                conditions.append(InteractionHistoryDB.session_id == session_id)
            if action_type:
                conditions.append(InteractionHistoryDB.action_type == action_type)
            if start_date:
                conditions.append(InteractionHistoryDB.created_at >= start_date)
            if end_date:
                conditions.append(InteractionHistoryDB.created_at <= end_date)

            if conditions:
                query = query.where(and_(*conditions))

            # Order by most recent first
            query = query.order_by(desc(InteractionHistoryDB.created_at))
            query = query.limit(limit).offset(offset)

            result = await session.execute(query)
            return list(result.scalars().all())

    async def get_interaction_by_id(
        self, interaction_id: int
    ) -> Optional[InteractionHistoryDB]:
        """Get a single interaction by ID.

        Args:
            interaction_id: The interaction ID.

        Returns:
            The InteractionHistoryDB instance or None.
        """
        async with get_session_context() as session:
            result = await session.execute(
                select(InteractionHistoryDB).where(
                    InteractionHistoryDB.id == interaction_id
                )
            )
            return result.scalar_one_or_none()

    async def delete_interaction(self, interaction_id: int) -> bool:
        """Delete an interaction by ID.

        Args:
            interaction_id: The interaction ID.

        Returns:
            True if deleted, False if not found.
        """
        async with get_session_context() as session:
            result = await session.execute(
                select(InteractionHistoryDB).where(
                    InteractionHistoryDB.id == interaction_id
                )
            )
            interaction = result.scalar_one_or_none()
            if interaction:
                await session.delete(interaction)
                return True
            return False

    async def get_statistics(
        self,
        device_serial: Optional[str] = None,
        package_name: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """Get interaction statistics.

        Args:
            device_serial: Filter by device serial.
            package_name: Filter by package name.
            start_date: Filter by start date.
            end_date: Filter by end date.

        Returns:
            Dictionary containing statistics.
        """
        async with get_session_context() as session:
            # Build base conditions
            conditions = []
            if device_serial:
                conditions.append(InteractionHistoryDB.device_serial == device_serial)
            if package_name:
                conditions.append(InteractionHistoryDB.package_name == package_name)
            if start_date:
                conditions.append(InteractionHistoryDB.created_at >= start_date)
            if end_date:
                conditions.append(InteractionHistoryDB.created_at <= end_date)

            # Total count
            count_query = select(func.count(InteractionHistoryDB.id))
            if conditions:
                count_query = count_query.where(and_(*conditions))
            total_count = await session.scalar(count_query)

            # Count by action type
            action_query = select(
                InteractionHistoryDB.action_type,
                func.count(InteractionHistoryDB.id).label("count"),
            ).group_by(InteractionHistoryDB.action_type)
            if conditions:
                action_query = action_query.where(and_(*conditions))
            action_result = await session.execute(action_query)
            action_counts = {row[0]: row[1] for row in action_result.all()}

            # Count by package
            package_query = select(
                InteractionHistoryDB.package_name,
                func.count(InteractionHistoryDB.id).label("count"),
            ).group_by(InteractionHistoryDB.package_name)
            if conditions:
                package_query = package_query.where(and_(*conditions))
            package_result = await session.execute(package_query)
            package_counts = {
                row[0] or "unknown": row[1] for row in package_result.all()
            }

            # Unique devices
            device_query = select(
                func.count(func.distinct(InteractionHistoryDB.device_serial))
            )
            if conditions:
                device_query = device_query.where(and_(*conditions))
            unique_devices = await session.scalar(device_query)

            return {
                "total_interactions": total_count or 0,
                "unique_devices": unique_devices or 0,
                "by_action_type": action_counts,
                "by_package": package_counts,
            }

    async def sync_to_backend(
        self, limit: int = 100
    ) -> Dict[str, Any]:
        """Sync unsynced interactions to Laravel backend.

        Args:
            limit: Maximum number of interactions to sync.

        Returns:
            Dictionary with sync results.
        """
        if not self._backend_url:
            return {"success": False, "message": "Backend URL not configured"}

        async with get_session_context() as session:
            # Get unsynced interactions
            query = (
                select(InteractionHistoryDB)
                .where(InteractionHistoryDB.synced_at.is_(None))
                .order_by(InteractionHistoryDB.created_at)
                .limit(limit)
            )
            result = await session.execute(query)
            interactions = list(result.scalars().all())

            if not interactions:
                return {"success": True, "synced": 0, "message": "No pending syncs"}

            # Prepare data for backend
            sync_data = [interaction.to_dict() for interaction in interactions]

            # Send to backend
            headers = {"Content-Type": "application/json"}
            if self._auth_token:
                headers["Authorization"] = f"Bearer {self._auth_token}"

            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        f"{self._backend_url}/api/interactions/sync",
                        json={"interactions": sync_data},
                        headers=headers,
                    )

                if response.status_code == 200:
                    # Mark as synced
                    now = datetime.utcnow()
                    for interaction in interactions:
                        interaction.synced_at = now

                    return {
                        "success": True,
                        "synced": len(interactions),
                        "message": "Sync completed",
                    }
                else:
                    return {
                        "success": False,
                        "synced": 0,
                        "message": f"Backend returned {response.status_code}",
                    }

            except Exception as e:
                return {
                    "success": False,
                    "synced": 0,
                    "message": f"Sync failed: {str(e)}",
                }

    async def get_recent_sessions(
        self, device_serial: Optional[str] = None, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get recent interaction sessions.

        Args:
            device_serial: Filter by device serial.
            limit: Maximum number of sessions.

        Returns:
            List of session summaries.
        """
        async with get_session_context() as session:
            query = select(
                InteractionHistoryDB.session_id,
                InteractionHistoryDB.device_serial,
                InteractionHistoryDB.package_name,
                func.count(InteractionHistoryDB.id).label("interaction_count"),
                func.min(InteractionHistoryDB.created_at).label("started_at"),
                func.max(InteractionHistoryDB.created_at).label("ended_at"),
            ).where(
                InteractionHistoryDB.session_id.isnot(None)
            ).group_by(
                InteractionHistoryDB.session_id,
                InteractionHistoryDB.device_serial,
                InteractionHistoryDB.package_name,
            ).order_by(
                desc(func.max(InteractionHistoryDB.created_at))
            ).limit(limit)

            if device_serial:
                query = query.where(
                    InteractionHistoryDB.device_serial == device_serial
                )

            result = await session.execute(query)
            sessions = []
            for row in result.all():
                sessions.append({
                    "session_id": row[0],
                    "device_serial": row[1],
                    "package_name": row[2],
                    "interaction_count": row[3],
                    "started_at": row[4].isoformat() if row[4] else None,
                    "ended_at": row[5].isoformat() if row[5] else None,
                })
            return sessions

    def create_session_id(self) -> str:
        """Generate a new session ID.

        Returns:
            A unique session ID string.
        """
        return str(uuid4())


# Global instance
interaction_service = InteractionService()
