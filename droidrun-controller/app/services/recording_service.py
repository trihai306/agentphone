"""Recording service for managing device action recording sessions."""

import asyncio
import aiohttp
import uuid
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field


class SessionState(Enum):
    """Recording session states."""
    IDLE = "idle"
    RECORDING = "recording"
    PAUSED = "paused"
    STOPPED = "stopped"


@dataclass
class ActionEvent:
    """Represents a recorded action event from the device."""
    type: str  # tap, swipe, long_press, input, scroll
    timestamp: int  # Unix timestamp in milliseconds
    x: Optional[int] = None
    y: Optional[int] = None
    end_x: Optional[int] = None  # For swipe actions
    end_y: Optional[int] = None  # For swipe actions
    resource_id: Optional[str] = None
    content_desc: Optional[str] = None
    text: Optional[str] = None
    class_name: Optional[str] = None
    package_name: Optional[str] = None
    bounds: Optional[Dict[str, int]] = None  # {left, top, right, bottom}
    input_text: Optional[str] = None  # For text input actions

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ActionEvent":
        """Create ActionEvent from dictionary data."""
        return cls(
            type=data.get("type", "unknown"),
            timestamp=data.get("timestamp", 0),
            x=data.get("x"),
            y=data.get("y"),
            end_x=data.get("endX"),
            end_y=data.get("endY"),
            resource_id=data.get("resourceId"),
            content_desc=data.get("contentDescription"),
            text=data.get("text"),
            class_name=data.get("className"),
            package_name=data.get("packageName"),
            bounds=data.get("bounds"),
            input_text=data.get("inputText"),
        )


@dataclass
class RecordingSession:
    """Represents a recording session."""
    session_id: str
    device_serial: str
    state: SessionState
    started_at: datetime
    actions: List[ActionEvent] = field(default_factory=list)
    stopped_at: Optional[datetime] = None
    last_poll_timestamp: int = 0


class RecordingService:
    """Service for managing device action recording sessions."""

    def __init__(self):
        self._sessions: Dict[str, RecordingSession] = {}
        self._active_session_by_device: Dict[str, str] = {}
        self._polling_tasks: Dict[str, asyncio.Task] = {}
        self._action_callbacks: Dict[str, List[Callable[[ActionEvent], None]]] = {}

    def get_device_base_url(self, device_serial: str) -> str:
        """Get the base URL for device HTTP communication.

        For USB-connected devices, we need to use localhost with port forwarding.
        For network-connected devices (IP:port format), use the IP directly.
        """
        if ":" in device_serial and not device_serial.startswith("localhost"):
            # Network device format like "192.168.1.100:5555"
            ip = device_serial.split(":")[0]
            return f"http://{ip}:8080"
        else:
            # USB device - assumes port forwarding is set up
            # adb forward tcp:8080 tcp:8080
            return "http://localhost:8080"

    async def start_recording(
        self,
        device_serial: str,
        poll_interval: float = 0.5
    ) -> Optional[str]:
        """Start a new recording session on the device.

        Args:
            device_serial: The ADB serial of the device
            poll_interval: How often to poll for new actions (in seconds)

        Returns:
            Session ID if successful, None if failed
        """
        # Check if there's already an active session for this device
        if device_serial in self._active_session_by_device:
            existing_session_id = self._active_session_by_device[device_serial]
            existing_session = self._sessions.get(existing_session_id)
            if existing_session and existing_session.state == SessionState.RECORDING:
                return existing_session_id

        base_url = self.get_device_base_url(device_serial)

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{base_url}/recording/start",
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        apk_session_id = data.get("session_id", "")

                        # Create local session
                        session_id = str(uuid.uuid4())
                        recording_session = RecordingSession(
                            session_id=session_id,
                            device_serial=device_serial,
                            state=SessionState.RECORDING,
                            started_at=datetime.now(),
                        )

                        self._sessions[session_id] = recording_session
                        self._active_session_by_device[device_serial] = session_id

                        # Start polling for actions
                        self._start_polling(session_id, device_serial, poll_interval)

                        return session_id
                    elif response.status == 409:
                        # Already recording - try to get existing session
                        return None
                    else:
                        return None
        except Exception as e:
            # Log error but don't expose to caller
            return None

    async def stop_recording(self, session_id: str) -> Optional[List[ActionEvent]]:
        """Stop a recording session and return all captured actions.

        Args:
            session_id: The session ID to stop

        Returns:
            List of captured actions if successful, None if failed
        """
        session = self._sessions.get(session_id)
        if not session:
            return None

        if session.state != SessionState.RECORDING:
            return session.actions

        # Stop polling
        self._stop_polling(session_id)

        base_url = self.get_device_base_url(session.device_serial)

        try:
            async with aiohttp.ClientSession() as http_session:
                async with http_session.post(
                    f"{base_url}/recording/stop",
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        data = await response.json()

                        # Parse any remaining actions from the response
                        actions_data = data.get("actions", [])
                        for action_data in actions_data:
                            action = ActionEvent.from_dict(action_data)
                            if action not in session.actions:
                                session.actions.append(action)

                        # Update session state
                        session.state = SessionState.STOPPED
                        session.stopped_at = datetime.now()

                        # Clean up device mapping
                        if session.device_serial in self._active_session_by_device:
                            del self._active_session_by_device[session.device_serial]

                        return session.actions
                    else:
                        # Still mark as stopped locally
                        session.state = SessionState.STOPPED
                        session.stopped_at = datetime.now()
                        return session.actions
        except Exception as e:
            # Mark as stopped even on error
            session.state = SessionState.STOPPED
            session.stopped_at = datetime.now()
            return session.actions

    async def poll_actions(self, session_id: str) -> List[ActionEvent]:
        """Poll for new actions since last poll.

        Args:
            session_id: The session ID to poll

        Returns:
            List of new actions since last poll
        """
        session = self._sessions.get(session_id)
        if not session or session.state != SessionState.RECORDING:
            return []

        base_url = self.get_device_base_url(session.device_serial)

        try:
            async with aiohttp.ClientSession() as http_session:
                params = {}
                if session.last_poll_timestamp > 0:
                    params["since"] = str(session.last_poll_timestamp)

                async with http_session.get(
                    f"{base_url}/recording/actions",
                    params=params,
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        actions_data = data.get("actions", [])

                        new_actions = []
                        for action_data in actions_data:
                            action = ActionEvent.from_dict(action_data)
                            session.actions.append(action)
                            new_actions.append(action)

                            # Update last poll timestamp
                            if action.timestamp > session.last_poll_timestamp:
                                session.last_poll_timestamp = action.timestamp

                            # Notify callbacks
                            self._notify_action_callbacks(session_id, action)

                        return new_actions
                    return []
        except Exception as e:
            return []

    def _start_polling(
        self,
        session_id: str,
        device_serial: str,
        interval: float
    ):
        """Start background polling task for a session."""
        async def poll_loop():
            while True:
                session = self._sessions.get(session_id)
                if not session or session.state != SessionState.RECORDING:
                    break
                await self.poll_actions(session_id)
                await asyncio.sleep(interval)

        task = asyncio.create_task(poll_loop())
        self._polling_tasks[session_id] = task

    def _stop_polling(self, session_id: str):
        """Stop background polling task for a session."""
        task = self._polling_tasks.get(session_id)
        if task and not task.done():
            task.cancel()
            try:
                # Wait for cancellation
                pass
            except asyncio.CancelledError:
                pass
        if session_id in self._polling_tasks:
            del self._polling_tasks[session_id]

    def add_action_callback(
        self,
        session_id: str,
        callback: Callable[[ActionEvent], None]
    ):
        """Add a callback to be notified when new actions are captured.

        Args:
            session_id: The session ID to watch
            callback: Function to call with each new action
        """
        if session_id not in self._action_callbacks:
            self._action_callbacks[session_id] = []
        self._action_callbacks[session_id].append(callback)

    def remove_action_callback(
        self,
        session_id: str,
        callback: Callable[[ActionEvent], None]
    ):
        """Remove an action callback."""
        if session_id in self._action_callbacks:
            try:
                self._action_callbacks[session_id].remove(callback)
            except ValueError:
                pass

    def _notify_action_callbacks(self, session_id: str, action: ActionEvent):
        """Notify all callbacks for a session about a new action."""
        callbacks = self._action_callbacks.get(session_id, [])
        for callback in callbacks:
            try:
                callback(action)
            except Exception:
                pass

    def get_session(self, session_id: str) -> Optional[RecordingSession]:
        """Get a recording session by ID."""
        return self._sessions.get(session_id)

    def get_active_session(self, device_serial: str) -> Optional[RecordingSession]:
        """Get the active recording session for a device."""
        session_id = self._active_session_by_device.get(device_serial)
        if session_id:
            return self._sessions.get(session_id)
        return None

    def get_session_actions(self, session_id: str) -> List[ActionEvent]:
        """Get all actions for a session."""
        session = self._sessions.get(session_id)
        if session:
            return session.actions
        return []

    def get_session_state(self, session_id: str) -> Optional[SessionState]:
        """Get the current state of a session."""
        session = self._sessions.get(session_id)
        if session:
            return session.state
        return None

    def is_recording(self, device_serial: str) -> bool:
        """Check if a device is currently recording."""
        session = self.get_active_session(device_serial)
        return session is not None and session.state == SessionState.RECORDING

    async def get_recording_status(self, device_serial: str) -> Dict[str, Any]:
        """Get recording status from the device.

        Returns status dict with is_recording and action_count.
        """
        base_url = self.get_device_base_url(device_serial)

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{base_url}/recording/status",
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    if response.status == 200:
                        return await response.json()
                    return {"is_recording": False, "action_count": 0}
        except Exception:
            return {"is_recording": False, "action_count": 0}

    def cleanup_session(self, session_id: str):
        """Clean up a session and release resources."""
        self._stop_polling(session_id)

        session = self._sessions.get(session_id)
        if session and session.device_serial in self._active_session_by_device:
            del self._active_session_by_device[session.device_serial]

        if session_id in self._sessions:
            del self._sessions[session_id]

        if session_id in self._action_callbacks:
            del self._action_callbacks[session_id]

    def cleanup_all(self):
        """Clean up all sessions and resources."""
        for session_id in list(self._sessions.keys()):
            self.cleanup_session(session_id)


# Global recording service instance
recording_service: Optional[RecordingService] = None


def get_recording_service() -> RecordingService:
    """Get or create the global recording service instance."""
    global recording_service
    if recording_service is None:
        recording_service = RecordingService()
    return recording_service
