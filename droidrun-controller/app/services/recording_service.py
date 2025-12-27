"""Recording service for managing device action recording sessions."""

import asyncio
import aiohttp
import uuid
import re
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


class SelectorType(Enum):
    """Selector types in priority order for element matching."""
    RESOURCE_ID = "resource_id"
    CONTENT_DESC = "content_desc"
    TEXT = "text"
    CLASS_WITH_TEXT = "class_with_text"
    CLASS_WITH_INDEX = "class_with_index"
    XPATH = "xpath"
    BOUNDS = "bounds"


@dataclass
class Selector:
    """Represents a single selector strategy for element matching."""
    type: SelectorType
    value: str
    confidence: float = 1.0  # 0.0 to 1.0, higher is more reliable

    def to_dict(self) -> Dict[str, Any]:
        """Convert selector to dictionary."""
        return {
            "type": self.type.value,
            "value": self.value,
            "confidence": self.confidence,
        }


def _is_dynamic_id(resource_id: str) -> bool:
    """Check if a resource ID appears to be dynamically generated.

    Dynamic IDs often contain session tokens, random strings, or numeric
    suffixes that change between sessions.
    """
    if not resource_id:
        return True

    # Check for common patterns of dynamic IDs
    dynamic_patterns = [
        r'[0-9a-f]{8,}',  # Hex strings (like UUIDs)
        r'_\d{5,}$',  # Numeric suffixes (5+ digits)
        r'session_',
        r'temp_',
        r'dynamic_',
        r'random_',
        r'generated_',
    ]

    for pattern in dynamic_patterns:
        if re.search(pattern, resource_id, re.IGNORECASE):
            return True

    return False


def _calculate_resource_id_confidence(resource_id: str) -> float:
    """Calculate confidence score for a resource ID selector."""
    if not resource_id:
        return 0.0

    # Start with high confidence
    confidence = 0.95

    # Lower confidence for dynamic-looking IDs
    if _is_dynamic_id(resource_id):
        confidence = 0.4

    # Higher confidence for well-named IDs
    good_patterns = ['btn_', 'button_', 'txt_', 'text_', 'input_', 'edit_',
                     'img_', 'image_', 'lbl_', 'label_', 'container_', 'layout_']
    for pattern in good_patterns:
        if pattern in resource_id.lower():
            confidence = min(confidence + 0.05, 1.0)
            break

    return confidence


def _generate_xpath(element_data: Dict[str, Any]) -> Optional[str]:
    """Generate an XPath selector for an element.

    Creates a simple XPath based on class name and available attributes.
    """
    class_name = element_data.get("className", "")
    if not class_name:
        return None

    # Simplify the class name (remove android.widget. prefix if present)
    simple_class = class_name.split(".")[-1] if "." in class_name else class_name

    xpath_parts = [f"//{simple_class}"]

    # Add predicates for better matching
    predicates = []

    text = element_data.get("text", "")
    if text and len(text) <= 50:  # Only use text if not too long
        # Escape quotes in text
        escaped_text = text.replace("'", "\\'")
        predicates.append(f"@text='{escaped_text}'")

    content_desc = element_data.get("contentDescription", "")
    if content_desc and not text:
        escaped_desc = content_desc.replace("'", "\\'")
        predicates.append(f"@content-desc='{escaped_desc}'")

    if predicates:
        xpath_parts.append(f"[{' and '.join(predicates)}]")
        return "".join(xpath_parts)

    # If no predicates, XPath alone is not reliable enough
    return None


def _generate_bounds_selector(element_data: Dict[str, Any]) -> Optional[str]:
    """Generate a bounds-based selector as last resort fallback."""
    bounds = element_data.get("bounds")
    if not bounds:
        return None

    left = bounds.get("left", 0)
    top = bounds.get("top", 0)
    right = bounds.get("right", 0)
    bottom = bounds.get("bottom", 0)

    if left == 0 and top == 0 and right == 0 and bottom == 0:
        return None

    return f"bounds=[{left},{top},{right},{bottom}]"


def generate_selectors(element_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate a prioritized list of selectors for an element.

    Creates multiple selector strategies in priority order:
    1. resource-id (most reliable if not dynamic)
    2. content-desc (accessibility description)
    3. text (element text content)
    4. class+text (combined for better matching)
    5. XPath (tree-based navigation)
    6. bounds (coordinates - least reliable)

    Args:
        element_data: Dictionary containing element properties:
            - resourceId: Android resource ID (e.g., "com.app:id/btn_login")
            - contentDescription: Accessibility content description
            - text: Visible text content
            - className: Android class name (e.g., "android.widget.Button")
            - bounds: Dictionary with left, top, right, bottom coordinates
            - packageName: Package name of the app

    Returns:
        List of selector dictionaries with type, value, and confidence.
        Empty list if no valid selectors can be generated.
    """
    selectors: List[Selector] = []

    # 1. Resource ID selector (highest priority)
    resource_id = element_data.get("resourceId", "")
    if resource_id:
        confidence = _calculate_resource_id_confidence(resource_id)
        selectors.append(Selector(
            type=SelectorType.RESOURCE_ID,
            value=resource_id,
            confidence=confidence,
        ))

    # 2. Content description selector
    content_desc = element_data.get("contentDescription", "")
    if content_desc and content_desc.strip():
        selectors.append(Selector(
            type=SelectorType.CONTENT_DESC,
            value=content_desc.strip(),
            confidence=0.85,
        ))

    # 3. Text selector
    text = element_data.get("text", "")
    if text and text.strip():
        # Lower confidence for very short or very long text
        text_len = len(text.strip())
        if text_len < 2:
            text_confidence = 0.5
        elif text_len > 100:
            text_confidence = 0.6
        else:
            text_confidence = 0.8
        selectors.append(Selector(
            type=SelectorType.TEXT,
            value=text.strip(),
            confidence=text_confidence,
        ))

    # 4. Class + Text combined selector
    class_name = element_data.get("className", "")
    if class_name and text and text.strip():
        simple_class = class_name.split(".")[-1] if "." in class_name else class_name
        combined_value = f"{simple_class}:text='{text.strip()}'"
        selectors.append(Selector(
            type=SelectorType.CLASS_WITH_TEXT,
            value=combined_value,
            confidence=0.75,
        ))

    # 5. XPath selector
    xpath = _generate_xpath(element_data)
    if xpath:
        selectors.append(Selector(
            type=SelectorType.XPATH,
            value=xpath,
            confidence=0.65,
        ))

    # 6. Bounds selector (last resort)
    bounds_selector = _generate_bounds_selector(element_data)
    if bounds_selector:
        selectors.append(Selector(
            type=SelectorType.BOUNDS,
            value=bounds_selector,
            confidence=0.3,  # Low confidence - positions change easily
        ))

    # Sort by confidence (highest first) and then by type priority
    type_priority = {
        SelectorType.RESOURCE_ID: 0,
        SelectorType.CONTENT_DESC: 1,
        SelectorType.TEXT: 2,
        SelectorType.CLASS_WITH_TEXT: 3,
        SelectorType.XPATH: 4,
        SelectorType.BOUNDS: 5,
    }
    selectors.sort(key=lambda s: (-(s.confidence), type_priority.get(s.type, 99)))

    return [s.to_dict() for s in selectors]


def get_element_display_name(element_data: Dict[str, Any]) -> str:
    """Get a human-readable display name for an element.

    Used for intelligent step naming in generated workflows.
    Priority: text > content-desc > resource-id > class name

    Args:
        element_data: Dictionary containing element properties.

    Returns:
        Human-readable name for the element.
    """
    # Try text first (most descriptive)
    text = element_data.get("text", "")
    if text and text.strip():
        display_text = text.strip()
        # Truncate long text
        if len(display_text) > 30:
            display_text = display_text[:27] + "..."
        return f"'{display_text}'"

    # Try content description
    content_desc = element_data.get("contentDescription", "")
    if content_desc and content_desc.strip():
        return f"'{content_desc.strip()[:30]}'"

    # Try resource ID (extract meaningful part)
    resource_id = element_data.get("resourceId", "")
    if resource_id:
        # Extract the ID part after the last /
        if "/" in resource_id:
            resource_id = resource_id.split("/")[-1]
        # Convert snake_case to readable format
        readable = resource_id.replace("_", " ").replace("-", " ")
        return readable.title()

    # Fall back to class name
    class_name = element_data.get("className", "")
    if class_name:
        simple_class = class_name.split(".")[-1] if "." in class_name else class_name
        # Common Android UI element types
        class_display = {
            "Button": "button",
            "TextView": "text",
            "EditText": "text field",
            "ImageView": "image",
            "ImageButton": "image button",
            "CheckBox": "checkbox",
            "RadioButton": "radio button",
            "Switch": "switch",
            "SeekBar": "slider",
            "ProgressBar": "progress bar",
            "Spinner": "dropdown",
            "RecyclerView": "list",
            "ListView": "list",
            "ScrollView": "scroll area",
        }
        return class_display.get(simple_class, simple_class.lower())

    return "element"


# Global recording service instance
recording_service: Optional[RecordingService] = None


def get_recording_service() -> RecordingService:
    """Get or create the global recording service instance."""
    global recording_service
    if recording_service is None:
        recording_service = RecordingService()
    return recording_service
