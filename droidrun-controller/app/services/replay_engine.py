"""Replay engine for executing workflows on Android devices.

This module implements the HTTP client that sends workflow steps to Android
devices via NanoHTTPD endpoints. It handles:
- Executing individual workflow steps (tap, swipe, input_text, wait, etc.)
- Retry logic for network failures
- Selector fallback when primary selector fails
- Progress tracking and error reporting

The replay engine communicates with the Android Portal app's HTTP server
running on port 8080 (default).
"""

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Tuple

import aiohttp

from app.models.workflow import (
    ActionType,
    ElementSelector,
    SelectorType,
    SwipeDirection,
    Workflow,
    WorkflowStep,
)
from app.services.selector_generator import SelectorGenerator


# Configure logging
logger = logging.getLogger(__name__)


class ReplayStatus(str, Enum):
    """Status of a workflow replay session."""
    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class StepResult(str, Enum):
    """Result of executing a single step."""
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"
    TIMEOUT = "timeout"


@dataclass
class StepExecutionResult:
    """Result of executing a workflow step."""
    step_id: str
    step_name: str
    result: StepResult
    message: str = ""
    duration_ms: int = 0
    selector_used: Optional[str] = None
    fallback_used: bool = False
    error: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "step_id": self.step_id,
            "step_name": self.step_name,
            "result": self.result.value,
            "message": self.message,
            "duration_ms": self.duration_ms,
            "selector_used": self.selector_used,
            "fallback_used": self.fallback_used,
            "error": self.error,
            "timestamp": self.timestamp.isoformat(),
        }


@dataclass
class ReplayProgress:
    """Progress information for a workflow replay."""
    workflow_id: str
    workflow_name: str
    status: ReplayStatus
    total_steps: int
    completed_steps: int
    current_step: Optional[str] = None
    current_step_name: Optional[str] = None
    step_results: List[StepExecutionResult] = field(default_factory=list)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None

    @property
    def progress_percent(self) -> float:
        """Get progress as a percentage."""
        if self.total_steps == 0:
            return 0.0
        return (self.completed_steps / self.total_steps) * 100

    @property
    def success_count(self) -> int:
        """Get count of successful steps."""
        return sum(1 for r in self.step_results if r.result == StepResult.SUCCESS)

    @property
    def failed_count(self) -> int:
        """Get count of failed steps."""
        return sum(1 for r in self.step_results if r.result == StepResult.FAILED)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "workflow_id": self.workflow_id,
            "workflow_name": self.workflow_name,
            "status": self.status.value,
            "total_steps": self.total_steps,
            "completed_steps": self.completed_steps,
            "progress_percent": self.progress_percent,
            "current_step": self.current_step,
            "current_step_name": self.current_step_name,
            "success_count": self.success_count,
            "failed_count": self.failed_count,
            "step_results": [r.to_dict() for r in self.step_results],
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "error": self.error,
        }


class ReplayEngine:
    """Executes workflows on Android devices via HTTP.

    This class manages workflow replay sessions, sending action commands
    to the Android Portal app's HTTP server and handling responses.

    Usage:
        engine = ReplayEngine(device_host="localhost", device_port=8080)
        await engine.connect()

        progress = await engine.execute_workflow(workflow)
        print(f"Completed: {progress.success_count}/{progress.total_steps}")

        await engine.disconnect()
    """

    # Default configuration
    DEFAULT_HOST = "localhost"
    DEFAULT_PORT = 8080
    DEFAULT_TIMEOUT = 30.0  # seconds
    DEFAULT_STEP_DELAY = 500  # ms between steps
    DEFAULT_RETRY_COUNT = 3
    DEFAULT_RETRY_DELAY = 1.0  # seconds

    def __init__(
        self,
        device_host: str = DEFAULT_HOST,
        device_port: int = DEFAULT_PORT,
        timeout: float = DEFAULT_TIMEOUT,
        step_delay_ms: int = DEFAULT_STEP_DELAY,
        retry_count: int = DEFAULT_RETRY_COUNT,
        retry_delay: float = DEFAULT_RETRY_DELAY,
    ):
        """Initialize the replay engine.

        Args:
            device_host: Android device HTTP server host.
            device_port: Android device HTTP server port.
            timeout: HTTP request timeout in seconds.
            step_delay_ms: Delay between workflow steps in milliseconds.
            retry_count: Number of retries for failed requests.
            retry_delay: Delay between retries in seconds.
        """
        self.device_host = device_host
        self.device_port = device_port
        self.timeout = timeout
        self.step_delay_ms = step_delay_ms
        self.retry_count = retry_count
        self.retry_delay = retry_delay

        self._session: Optional[aiohttp.ClientSession] = None
        self._current_progress: Optional[ReplayProgress] = None
        self._is_cancelled = False
        self._is_paused = False
        self._pause_event = asyncio.Event()
        self._pause_event.set()  # Not paused by default

        self._progress_callbacks: List[Callable[[ReplayProgress], None]] = []
        self._selector_generator = SelectorGenerator(include_fallbacks=True)

    @property
    def base_url(self) -> str:
        """Get the base URL for the Android HTTP server."""
        return f"http://{self.device_host}:{self.device_port}"

    @property
    def is_connected(self) -> bool:
        """Check if connected to the device."""
        return self._session is not None and not self._session.closed

    @property
    def current_progress(self) -> Optional[ReplayProgress]:
        """Get the current replay progress."""
        return self._current_progress

    async def connect(self) -> bool:
        """Connect to the Android device HTTP server.

        Returns:
            True if connection successful, False otherwise.
        """
        if self._session is not None:
            await self.disconnect()

        try:
            timeout = aiohttp.ClientTimeout(total=self.timeout)
            self._session = aiohttp.ClientSession(timeout=timeout)

            # Verify connection with ping
            async with self._session.get(f"{self.base_url}/ping") as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("status") == "success":
                        logger.info(f"Connected to Android device at {self.base_url}")
                        return True

            logger.warning(f"Device at {self.base_url} did not respond correctly")
            return False

        except aiohttp.ClientError as e:
            logger.error(f"Failed to connect to device: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error connecting to device: {e}")
            return False

    async def disconnect(self) -> None:
        """Disconnect from the Android device."""
        if self._session is not None:
            await self._session.close()
            self._session = None
            logger.info("Disconnected from Android device")

    async def ping(self) -> bool:
        """Ping the Android device to check connection.

        Returns:
            True if device responds, False otherwise.
        """
        if not self.is_connected:
            return False

        try:
            async with self._session.get(f"{self.base_url}/ping") as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("status") == "success"
                return False
        except Exception:
            return False

    def add_progress_callback(
        self, callback: Callable[[ReplayProgress], None]
    ) -> None:
        """Add a callback for progress updates.

        Args:
            callback: Function to call with progress updates.
        """
        self._progress_callbacks.append(callback)

    def remove_progress_callback(
        self, callback: Callable[[ReplayProgress], None]
    ) -> None:
        """Remove a progress callback.

        Args:
            callback: The callback to remove.
        """
        if callback in self._progress_callbacks:
            self._progress_callbacks.remove(callback)

    def _notify_progress(self) -> None:
        """Notify all progress callbacks."""
        if self._current_progress is not None:
            for callback in self._progress_callbacks:
                try:
                    callback(self._current_progress)
                except Exception as e:
                    logger.error(f"Error in progress callback: {e}")

    async def execute_workflow(
        self,
        workflow: Workflow,
        start_step: int = 0,
        stop_on_error: bool = True,
    ) -> ReplayProgress:
        """Execute a workflow on the connected device.

        Args:
            workflow: The workflow to execute.
            start_step: Index of the step to start from (for resuming).
            stop_on_error: Whether to stop on first error.

        Returns:
            ReplayProgress with execution results.

        Raises:
            RuntimeError: If not connected to a device.
        """
        if not self.is_connected:
            raise RuntimeError("Not connected to device. Call connect() first.")

        # Initialize progress
        self._current_progress = ReplayProgress(
            workflow_id=workflow.id,
            workflow_name=workflow.name,
            status=ReplayStatus.RUNNING,
            total_steps=len(workflow.steps),
            completed_steps=0,
            started_at=datetime.utcnow(),
        )
        self._is_cancelled = False
        self._is_paused = False
        self._pause_event.set()

        self._notify_progress()

        try:
            # Execute each step
            for i, step in enumerate(workflow.steps[start_step:], start=start_step):
                # Check for cancellation
                if self._is_cancelled:
                    self._current_progress.status = ReplayStatus.CANCELLED
                    self._current_progress.error = "Replay cancelled by user"
                    break

                # Wait if paused
                await self._pause_event.wait()
                if self._is_cancelled:
                    self._current_progress.status = ReplayStatus.CANCELLED
                    self._current_progress.error = "Replay cancelled by user"
                    break

                # Update current step info
                self._current_progress.current_step = step.id
                self._current_progress.current_step_name = step.name
                self._notify_progress()

                # Execute the step
                result = await self._execute_step(step)
                self._current_progress.step_results.append(result)
                self._current_progress.completed_steps = i + 1

                self._notify_progress()

                # Handle failure
                if result.result == StepResult.FAILED and stop_on_error:
                    self._current_progress.status = ReplayStatus.FAILED
                    self._current_progress.error = f"Step '{step.name}' failed: {result.error}"
                    break

                # Delay before next step
                if i < len(workflow.steps) - 1:
                    await asyncio.sleep(self.step_delay_ms / 1000.0)

            # Mark as completed if not failed/cancelled
            if self._current_progress.status == ReplayStatus.RUNNING:
                self._current_progress.status = ReplayStatus.COMPLETED

        except Exception as e:
            logger.error(f"Workflow execution failed: {e}")
            self._current_progress.status = ReplayStatus.FAILED
            self._current_progress.error = str(e)

        finally:
            self._current_progress.completed_at = datetime.utcnow()
            self._current_progress.current_step = None
            self._current_progress.current_step_name = None
            self._notify_progress()

        return self._current_progress

    async def _execute_step(self, step: WorkflowStep) -> StepExecutionResult:
        """Execute a single workflow step.

        Args:
            step: The workflow step to execute.

        Returns:
            StepExecutionResult with execution details.
        """
        start_time = datetime.utcnow()

        try:
            # Handle wait actions specially (no HTTP call needed)
            if step.action == ActionType.WAIT:
                duration_ms = step.wait_data.duration_ms if step.wait_data else 1000
                await asyncio.sleep(duration_ms / 1000.0)
                return StepExecutionResult(
                    step_id=step.id,
                    step_name=step.name,
                    result=StepResult.SUCCESS,
                    message=f"Waited {duration_ms}ms",
                    duration_ms=duration_ms,
                )

            # Execute action based on type
            if step.action == ActionType.TAP:
                success, message, selector_used, fallback_used = await self._execute_tap(step)
            elif step.action == ActionType.LONG_TAP:
                success, message, selector_used, fallback_used = await self._execute_long_tap(step)
            elif step.action == ActionType.SWIPE:
                success, message, selector_used, fallback_used = await self._execute_swipe(step)
            elif step.action == ActionType.SCROLL:
                success, message, selector_used, fallback_used = await self._execute_scroll(step)
            elif step.action == ActionType.INPUT_TEXT:
                success, message, selector_used, fallback_used = await self._execute_input_text(step)
            else:
                return StepExecutionResult(
                    step_id=step.id,
                    step_name=step.name,
                    result=StepResult.SKIPPED,
                    message=f"Unknown action type: {step.action}",
                )

            end_time = datetime.utcnow()
            duration_ms = int((end_time - start_time).total_seconds() * 1000)

            return StepExecutionResult(
                step_id=step.id,
                step_name=step.name,
                result=StepResult.SUCCESS if success else StepResult.FAILED,
                message=message,
                duration_ms=duration_ms,
                selector_used=selector_used,
                fallback_used=fallback_used,
                error=None if success else message,
            )

        except asyncio.TimeoutError:
            return StepExecutionResult(
                step_id=step.id,
                step_name=step.name,
                result=StepResult.TIMEOUT,
                message="Step execution timed out",
                error="Timeout",
            )
        except Exception as e:
            logger.error(f"Error executing step '{step.name}': {e}")
            return StepExecutionResult(
                step_id=step.id,
                step_name=step.name,
                result=StepResult.FAILED,
                message=str(e),
                error=str(e),
            )

    async def _execute_tap(
        self, step: WorkflowStep
    ) -> Tuple[bool, str, Optional[str], bool]:
        """Execute a tap action.

        Returns:
            Tuple of (success, message, selector_used, fallback_used).
        """
        # Try with coordinates if available
        if step.tap_data and step.tap_data.x is not None and step.tap_data.y is not None:
            success, message = await self._tap_coordinates(
                step.tap_data.x,
                step.tap_data.y,
            )
            return success, message, f"coordinates({step.tap_data.x},{step.tap_data.y})", False

        # Try with selector
        return await self._execute_with_selector_fallback(
            step.selector,
            self._tap_by_selector,
        )

    async def _execute_long_tap(
        self, step: WorkflowStep
    ) -> Tuple[bool, str, Optional[str], bool]:
        """Execute a long tap action.

        Returns:
            Tuple of (success, message, selector_used, fallback_used).
        """
        duration = 1000  # Default 1 second
        if step.tap_data:
            duration = step.tap_data.duration_ms or duration

        # Try with coordinates if available
        if step.tap_data and step.tap_data.x is not None and step.tap_data.y is not None:
            success, message = await self._long_press_coordinates(
                step.tap_data.x,
                step.tap_data.y,
                duration,
            )
            return success, message, f"coordinates({step.tap_data.x},{step.tap_data.y})", False

        # Try with selector
        return await self._execute_with_selector_fallback(
            step.selector,
            lambda sel: self._long_press_by_selector(sel, duration),
        )

    async def _execute_swipe(
        self, step: WorkflowStep
    ) -> Tuple[bool, str, Optional[str], bool]:
        """Execute a swipe action.

        Returns:
            Tuple of (success, message, selector_used, fallback_used).
        """
        if not step.swipe_data:
            return False, "Missing swipe data", None, False

        # If we have explicit coordinates, use them
        if all([
            step.swipe_data.start_x is not None,
            step.swipe_data.start_y is not None,
            step.swipe_data.end_x is not None,
            step.swipe_data.end_y is not None,
        ]):
            success, message = await self._swipe_coordinates(
                step.swipe_data.start_x,
                step.swipe_data.start_y,
                step.swipe_data.end_x,
                step.swipe_data.end_y,
                step.swipe_data.duration_ms,
            )
            return success, message, "coordinates", False

        # Otherwise, generate swipe from direction and screen center
        # This requires getting screen dimensions first
        success, message = await self._swipe_direction(step.swipe_data.direction)
        return success, message, f"direction:{step.swipe_data.direction.value}", False

    async def _execute_scroll(
        self, step: WorkflowStep
    ) -> Tuple[bool, str, Optional[str], bool]:
        """Execute a scroll action.

        Returns:
            Tuple of (success, message, selector_used, fallback_used).
        """
        # Scroll by selector if available
        if step.selector:
            return await self._execute_with_selector_fallback(
                step.selector,
                lambda sel: self._scroll_by_selector(sel, step.swipe_data),
            )

        # Otherwise use swipe for scroll
        if step.swipe_data:
            direction = step.swipe_data.direction
            success, message = await self._swipe_direction(direction)
            return success, message, f"scroll:{direction.value}", False

        return False, "Missing scroll data", None, False

    async def _execute_input_text(
        self, step: WorkflowStep
    ) -> Tuple[bool, str, Optional[str], bool]:
        """Execute a text input action.

        Returns:
            Tuple of (success, message, selector_used, fallback_used).
        """
        if not step.input_data:
            return False, "Missing input data", None, False

        text = step.input_data.text

        # If we have a selector, first focus/click on the element
        if step.selector:
            # First tap to focus
            success, message, selector_used, fallback_used = await self._execute_with_selector_fallback(
                step.selector,
                self._tap_by_selector,
            )
            if not success:
                return success, f"Failed to focus input: {message}", selector_used, fallback_used

            # Small delay before typing
            await asyncio.sleep(0.2)

            # Then set text
            success, message = await self._set_text_by_selector(step.selector, text)
            return success, message, selector_used, fallback_used

        # Direct text input (assumes element is already focused)
        success, message = await self._input_text_keyboard(text)
        return success, message, None, False

    async def _execute_with_selector_fallback(
        self,
        selector: Optional[ElementSelector],
        action_fn: Callable[[ElementSelector], Any],
    ) -> Tuple[bool, str, Optional[str], bool]:
        """Execute an action with selector fallback chain.

        Tries the primary selector first, then falls back to alternatives.

        Args:
            selector: The primary selector (with optional fallbacks).
            action_fn: The action function to execute with the selector.

        Returns:
            Tuple of (success, message, selector_used, fallback_used).
        """
        if selector is None:
            return False, "No selector provided", None, False

        current_selector = selector
        fallback_used = False
        attempt = 0

        while current_selector is not None:
            try:
                success, message = await action_fn(current_selector)
                if success:
                    selector_str = f"{current_selector.type.value}:{current_selector.value[:50]}"
                    return True, message, selector_str, fallback_used

                # Move to fallback
                if current_selector.fallback is not None:
                    logger.info(f"Primary selector failed, trying fallback: {current_selector.fallback.type.value}")
                    current_selector = current_selector.fallback
                    fallback_used = True
                    attempt += 1
                else:
                    break

            except Exception as e:
                logger.warning(f"Selector attempt {attempt} failed: {e}")
                if current_selector.fallback is not None:
                    current_selector = current_selector.fallback
                    fallback_used = True
                    attempt += 1
                else:
                    return False, str(e), None, fallback_used

        return False, "All selectors failed", None, fallback_used

    # =========================================================================
    # HTTP ACTION METHODS
    # =========================================================================

    async def _request_with_retry(
        self,
        method: str,
        endpoint: str,
        json_data: Optional[Dict[str, Any]] = None,
    ) -> Tuple[bool, Dict[str, Any]]:
        """Make an HTTP request with retry logic.

        Args:
            method: HTTP method (GET, POST).
            endpoint: API endpoint path.
            json_data: Optional JSON body for POST requests.

        Returns:
            Tuple of (success, response_data).
        """
        url = f"{self.base_url}{endpoint}"

        for attempt in range(self.retry_count):
            try:
                if method.upper() == "GET":
                    async with self._session.get(url) as response:
                        data = await response.json()
                        if response.status == 200 and data.get("status") == "success":
                            return True, data
                        return False, data
                else:  # POST
                    async with self._session.post(url, json=json_data) as response:
                        data = await response.json()
                        if response.status == 200 and data.get("status") == "success":
                            return True, data
                        return False, data

            except aiohttp.ClientError as e:
                logger.warning(f"Request attempt {attempt + 1} failed: {e}")
                if attempt < self.retry_count - 1:
                    await asyncio.sleep(self.retry_delay)
                else:
                    return False, {"error": str(e)}

            except Exception as e:
                logger.error(f"Unexpected error in request: {e}")
                return False, {"error": str(e)}

        return False, {"error": "Max retries exceeded"}

    async def _tap_coordinates(self, x: int, y: int) -> Tuple[bool, str]:
        """Tap at specific coordinates.

        Args:
            x: X coordinate.
            y: Y coordinate.

        Returns:
            Tuple of (success, message).
        """
        success, data = await self._request_with_retry(
            "POST",
            "/action/tap",
            {"x": x, "y": y},
        )
        message = data.get("message", data.get("error", "Unknown error"))
        return success, message

    async def _tap_by_selector(
        self, selector: ElementSelector
    ) -> Tuple[bool, str]:
        """Tap an element by selector.

        Args:
            selector: The element selector.

        Returns:
            Tuple of (success, message).
        """
        # For bounds selector, extract coordinates and tap
        if selector.type == SelectorType.BOUNDS:
            center = self._selector_generator.get_center_from_bounds(selector.value)
            if center:
                return await self._tap_coordinates(center[0], center[1])
            return False, f"Invalid bounds format: {selector.value}"

        # For other selectors, we need to find the element first
        # Get the element's position from the accessibility tree
        success, element_info = await self._find_element_by_selector(selector)
        if not success or element_info is None:
            return False, f"Element not found with selector: {selector.type.value}"

        # Extract bounds and tap center
        bounds = element_info.get("bounds") or element_info.get("boundsInScreen")
        if bounds:
            center = self._selector_generator.get_center_from_bounds(bounds)
            if center:
                return await self._tap_coordinates(center[0], center[1])

        # Fallback: try to click by index if available
        index = element_info.get("index")
        if index is not None:
            success, data = await self._request_with_retry(
                "POST",
                "/action/click",
                {"index": index},
            )
            message = data.get("message", data.get("error", "Unknown error"))
            return success, message

        return False, "Could not determine element position"

    async def _long_press_coordinates(
        self, x: int, y: int, duration: int = 1000
    ) -> Tuple[bool, str]:
        """Long press at specific coordinates.

        Args:
            x: X coordinate.
            y: Y coordinate.
            duration: Press duration in milliseconds.

        Returns:
            Tuple of (success, message).
        """
        success, data = await self._request_with_retry(
            "POST",
            "/action/longpress",
            {"x": x, "y": y, "duration": duration},
        )
        message = data.get("message", data.get("error", "Unknown error"))
        return success, message

    async def _long_press_by_selector(
        self, selector: ElementSelector, duration: int = 1000
    ) -> Tuple[bool, str]:
        """Long press an element by selector.

        Args:
            selector: The element selector.
            duration: Press duration in milliseconds.

        Returns:
            Tuple of (success, message).
        """
        # For bounds selector, extract coordinates
        if selector.type == SelectorType.BOUNDS:
            center = self._selector_generator.get_center_from_bounds(selector.value)
            if center:
                return await self._long_press_coordinates(center[0], center[1], duration)
            return False, f"Invalid bounds format: {selector.value}"

        # Find element and long press
        success, element_info = await self._find_element_by_selector(selector)
        if not success or element_info is None:
            return False, f"Element not found with selector: {selector.type.value}"

        bounds = element_info.get("bounds") or element_info.get("boundsInScreen")
        if bounds:
            center = self._selector_generator.get_center_from_bounds(bounds)
            if center:
                return await self._long_press_coordinates(center[0], center[1], duration)

        # Fallback to index-based long click
        index = element_info.get("index")
        if index is not None:
            success, data = await self._request_with_retry(
                "POST",
                "/action/longclick",
                {"index": index},
            )
            message = data.get("message", data.get("error", "Unknown error"))
            return success, message

        return False, "Could not determine element position"

    async def _swipe_coordinates(
        self,
        start_x: int,
        start_y: int,
        end_x: int,
        end_y: int,
        duration: int = 300,
    ) -> Tuple[bool, str]:
        """Swipe from one point to another.

        Args:
            start_x: Starting X coordinate.
            start_y: Starting Y coordinate.
            end_x: Ending X coordinate.
            end_y: Ending Y coordinate.
            duration: Swipe duration in milliseconds.

        Returns:
            Tuple of (success, message).
        """
        success, data = await self._request_with_retry(
            "POST",
            "/action/swipe",
            {
                "startX": start_x,
                "startY": start_y,
                "endX": end_x,
                "endY": end_y,
                "duration": duration,
            },
        )
        message = data.get("message", data.get("error", "Unknown error"))
        return success, message

    async def _swipe_direction(
        self, direction: SwipeDirection, distance: int = 500
    ) -> Tuple[bool, str]:
        """Swipe in a direction from screen center.

        Args:
            direction: Swipe direction.
            distance: Swipe distance in pixels.

        Returns:
            Tuple of (success, message).
        """
        # Default screen dimensions (will be overridden if we can get actual size)
        center_x = 540
        center_y = 960

        # Calculate swipe coordinates based on direction
        if direction == SwipeDirection.UP:
            start_y = center_y + distance // 2
            end_y = center_y - distance // 2
            start_x = end_x = center_x
        elif direction == SwipeDirection.DOWN:
            start_y = center_y - distance // 2
            end_y = center_y + distance // 2
            start_x = end_x = center_x
        elif direction == SwipeDirection.LEFT:
            start_x = center_x + distance // 2
            end_x = center_x - distance // 2
            start_y = end_y = center_y
        elif direction == SwipeDirection.RIGHT:
            start_x = center_x - distance // 2
            end_x = center_x + distance // 2
            start_y = end_y = center_y
        else:
            return False, f"Unknown direction: {direction}"

        return await self._swipe_coordinates(start_x, start_y, end_x, end_y)

    async def _scroll_by_selector(
        self, selector: ElementSelector, swipe_data: Optional[Any] = None
    ) -> Tuple[bool, str]:
        """Scroll a scrollable element by selector.

        Args:
            selector: The element selector.
            swipe_data: Optional swipe data with direction.

        Returns:
            Tuple of (success, message).
        """
        # Find the scrollable element
        success, element_info = await self._find_element_by_selector(selector)
        if not success or element_info is None:
            return False, f"Scrollable element not found: {selector.type.value}"

        index = element_info.get("index")
        if index is None:
            return False, "Element index not found"

        direction = "forward"
        if swipe_data and hasattr(swipe_data, "direction"):
            dir_val = swipe_data.direction
            if dir_val in (SwipeDirection.UP, SwipeDirection.LEFT):
                direction = "backward"
            else:
                direction = "forward"

        success, data = await self._request_with_retry(
            "POST",
            "/action/scroll",
            {"index": index, "direction": direction},
        )
        message = data.get("message", data.get("error", "Unknown error"))
        return success, message

    async def _set_text_by_selector(
        self, selector: ElementSelector, text: str
    ) -> Tuple[bool, str]:
        """Set text on an element by selector.

        Args:
            selector: The element selector.
            text: Text to input.

        Returns:
            Tuple of (success, message).
        """
        # Find the input element
        success, element_info = await self._find_element_by_selector(selector)
        if not success or element_info is None:
            return False, f"Input element not found: {selector.type.value}"

        index = element_info.get("index")
        if index is not None:
            success, data = await self._request_with_retry(
                "POST",
                "/action/setText",
                {"index": index, "text": text},
            )
            message = data.get("message", data.get("error", "Unknown error"))
            return success, message

        # Fallback to keyboard input
        return await self._input_text_keyboard(text)

    async def _input_text_keyboard(self, text: str) -> Tuple[bool, str]:
        """Input text via keyboard service.

        Args:
            text: Text to input.

        Returns:
            Tuple of (success, message).
        """
        import base64
        encoded_text = base64.b64encode(text.encode()).decode()

        success, data = await self._request_with_retry(
            "POST",
            "/keyboard/input",
            {"base64_text": encoded_text},
        )
        message = data.get("message", data.get("error", "Unknown error"))
        return success, message

    async def _find_element_by_selector(
        self, selector: ElementSelector
    ) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """Find an element in the accessibility tree by selector.

        Args:
            selector: The element selector.

        Returns:
            Tuple of (success, element_info).
        """
        # Get the current accessibility tree
        success, data = await self._request_with_retry("GET", "/state")
        if not success:
            return False, None

        # Parse the state data
        try:
            state_data = data.get("data", "{}")
            if isinstance(state_data, str):
                import json
                state_data = json.loads(state_data)

            a11y_tree = state_data.get("a11y_tree", [])

            # Search for element matching selector
            for node in a11y_tree:
                if self._node_matches_selector(node, selector):
                    return True, node

            return False, None

        except Exception as e:
            logger.error(f"Error parsing accessibility tree: {e}")
            return False, None

    def _node_matches_selector(
        self, node: Dict[str, Any], selector: ElementSelector
    ) -> bool:
        """Check if an accessibility node matches a selector.

        Args:
            node: Accessibility tree node.
            selector: Element selector to match.

        Returns:
            True if the node matches the selector.
        """
        if selector.type == SelectorType.RESOURCE_ID:
            resource_id = node.get("resourceId") or node.get("resource-id", "")
            # Match full ID or just the name part
            if selector.value in resource_id or resource_id.endswith(f"/{selector.value}"):
                return True

        elif selector.type == SelectorType.CONTENT_DESC:
            content_desc = node.get("contentDescription") or node.get("content-desc", "")
            if selector.value.lower() in content_desc.lower():
                return True

        elif selector.type == SelectorType.TEXT:
            text = node.get("text", "")
            if selector.value.lower() in text.lower():
                return True

        elif selector.type == SelectorType.BOUNDS:
            bounds = node.get("bounds") or node.get("boundsInScreen", "")
            if selector.value == bounds:
                return True

        elif selector.type == SelectorType.XPATH:
            # XPath matching is more complex - for now, just check class name
            class_name = node.get("className") or node.get("class", "")
            if class_name and class_name in selector.value:
                return True

        return False

    # =========================================================================
    # CONTROL METHODS
    # =========================================================================

    def pause(self) -> None:
        """Pause the current replay."""
        self._is_paused = True
        self._pause_event.clear()
        if self._current_progress:
            self._current_progress.status = ReplayStatus.PAUSED
            self._notify_progress()
        logger.info("Replay paused")

    def resume(self) -> None:
        """Resume a paused replay."""
        self._is_paused = False
        self._pause_event.set()
        if self._current_progress:
            self._current_progress.status = ReplayStatus.RUNNING
            self._notify_progress()
        logger.info("Replay resumed")

    def cancel(self) -> None:
        """Cancel the current replay."""
        self._is_cancelled = True
        self._pause_event.set()  # Unblock if paused
        logger.info("Replay cancelled")

    async def execute_single_step(
        self, step: WorkflowStep
    ) -> StepExecutionResult:
        """Execute a single workflow step (for testing/debugging).

        Args:
            step: The workflow step to execute.

        Returns:
            StepExecutionResult with execution details.

        Raises:
            RuntimeError: If not connected to a device.
        """
        if not self.is_connected:
            raise RuntimeError("Not connected to device. Call connect() first.")

        return await self._execute_step(step)

    async def perform_global_action(self, action: str) -> Tuple[bool, str]:
        """Perform a global action (back, home, etc.).

        Args:
            action: Action name (back, home, recents, notifications, etc.).

        Returns:
            Tuple of (success, message).
        """
        if not self.is_connected:
            return False, "Not connected to device"

        success, data = await self._request_with_retry(
            "POST",
            "/action/global",
            {"action": action},
        )
        message = data.get("message", data.get("error", "Unknown error"))
        return success, message


# Module-level singleton instance
replay_engine: Optional[ReplayEngine] = None


def get_replay_engine(
    device_host: str = ReplayEngine.DEFAULT_HOST,
    device_port: int = ReplayEngine.DEFAULT_PORT,
) -> ReplayEngine:
    """Get or create the replay engine singleton.

    Args:
        device_host: Android device HTTP server host.
        device_port: Android device HTTP server port.

    Returns:
        ReplayEngine instance.
    """
    global replay_engine
    if replay_engine is None:
        replay_engine = ReplayEngine(device_host=device_host, device_port=device_port)
    return replay_engine


async def create_replay_engine(
    device_host: str = ReplayEngine.DEFAULT_HOST,
    device_port: int = ReplayEngine.DEFAULT_PORT,
    auto_connect: bool = True,
) -> ReplayEngine:
    """Create a new replay engine and optionally connect.

    Args:
        device_host: Android device HTTP server host.
        device_port: Android device HTTP server port.
        auto_connect: Whether to automatically connect to the device.

    Returns:
        ReplayEngine instance.
    """
    engine = ReplayEngine(device_host=device_host, device_port=device_port)
    if auto_connect:
        await engine.connect()
    return engine
