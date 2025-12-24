"""
Tools Base - Abstract base class for device tools (DroidRun standard)

Provides:
- Tools: Abstract base class for all device tools
- @ui_action decorator for capturing UI state changes
"""

import functools
import logging
from abc import ABC, abstractmethod
from typing import Any, Callable, Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime

logger = logging.getLogger("agents.tools.base")


@dataclass
class ToolResult:
    """Result of a tool action"""
    success: bool
    message: str
    data: Dict[str, Any] = field(default_factory=dict)
    screenshot_before: Optional[bytes] = None
    screenshot_after: Optional[bytes] = None
    ui_state_before: Optional[Dict] = None
    ui_state_after: Optional[Dict] = None
    timestamp: datetime = field(default_factory=datetime.now)


class Tools(ABC):
    """
    Abstract base class for device tools (DroidRun standard)

    All device interaction tools should inherit from this class
    and implement the abstract methods.

    Features:
    - Standardized interface for device actions
    - @ui_action decorator for tracking UI changes
    - Memory system for storing context
    - Trajectory tracking support
    """

    def __init__(self):
        self._memory: Dict[str, Any] = {}
        self._trajectory: List[Dict] = []
        self.save_trajectories: bool = False
        self._step_screenshots: List[bytes] = []
        self._step_ui_states: List[Dict] = []
        self.clickable_elements_cache: List[Dict] = []

    # ========================================================================
    # DECORATOR
    # ========================================================================

    @staticmethod
    def ui_action(func: Callable) -> Callable:
        """
        Decorator to capture screenshots and UI states for actions that modify the UI.

        Usage:
            @Tools.ui_action
            async def tap(self, x: int, y: int) -> str:
                ...
        """
        @functools.wraps(func)
        async def wrapper(self, *args, **kwargs):
            # Capture state before action if trajectory saving is enabled
            screenshot_before = None
            ui_state_before = None

            if getattr(self, 'save_trajectories', False):
                try:
                    screenshot_before = await self.take_screenshot()
                    ui_state_before = await self.get_state()
                except Exception as e:
                    logger.warning(f"Failed to capture pre-action state: {e}")

            # Execute the action
            result = await func(self, *args, **kwargs)

            # Capture state after action if trajectory saving is enabled
            if getattr(self, 'save_trajectories', False):
                try:
                    screenshot_after = await self.take_screenshot()
                    ui_state_after = await self.get_state()

                    self._step_screenshots.append(screenshot_after)
                    self._step_ui_states.append(ui_state_after)

                    # Record trajectory
                    self._trajectory.append({
                        "action": func.__name__,
                        "args": args,
                        "kwargs": kwargs,
                        "result": result,
                        "timestamp": datetime.now().isoformat(),
                    })
                except Exception as e:
                    logger.warning(f"Failed to capture post-action state: {e}")

            return result

        return wrapper

    # ========================================================================
    # ABSTRACT METHODS - State
    # ========================================================================

    @abstractmethod
    async def get_state(self) -> Dict[str, Any]:
        """
        Get current device state including UI elements and phone state

        Returns:
            Dict containing:
            - elements: List of UI elements
            - phone_state: Current device state
            - a11y_tree: Raw accessibility tree
        """
        pass

    @abstractmethod
    async def take_screenshot(self, hide_overlay: bool = True) -> bytes:
        """
        Take a screenshot of the current screen

        Args:
            hide_overlay: Whether to hide Portal overlay

        Returns:
            PNG image bytes
        """
        pass

    # ========================================================================
    # ABSTRACT METHODS - Actions
    # ========================================================================

    @abstractmethod
    async def tap_by_index(self, index: int) -> str:
        """
        Tap a UI element by its index from the accessibility tree

        Args:
            index: Element index

        Returns:
            Result message
        """
        pass

    @abstractmethod
    async def tap_by_coordinates(self, x: int, y: int) -> str:
        """
        Tap at specific screen coordinates

        Args:
            x: X coordinate
            y: Y coordinate

        Returns:
            Result message
        """
        pass

    @abstractmethod
    async def swipe(
        self,
        start_x: int,
        start_y: int,
        end_x: int,
        end_y: int,
        duration_ms: int = 300
    ) -> str:
        """
        Perform a swipe gesture

        Args:
            start_x, start_y: Start coordinates
            end_x, end_y: End coordinates
            duration_ms: Duration in milliseconds

        Returns:
            Result message
        """
        pass

    @abstractmethod
    async def drag(
        self,
        start_x: int,
        start_y: int,
        end_x: int,
        end_y: int,
        duration_ms: int = 500
    ) -> str:
        """
        Perform a drag and drop gesture

        Args:
            start_x, start_y: Start coordinates
            end_x, end_y: End coordinates
            duration_ms: Duration in milliseconds

        Returns:
            Result message
        """
        pass

    @abstractmethod
    async def input_text(self, text: str, index: int = -1, clear: bool = False) -> str:
        """
        Input text on the device

        Args:
            text: Text to input
            index: Optional element index to focus first
            clear: Whether to clear existing text first

        Returns:
            Result message
        """
        pass

    @abstractmethod
    async def back(self) -> str:
        """
        Press the back button

        Returns:
            Result message
        """
        pass

    @abstractmethod
    async def press_key(self, keycode: int) -> str:
        """
        Press a hardware key

        Args:
            keycode: Android keycode

        Returns:
            Result message
        """
        pass

    # ========================================================================
    # ABSTRACT METHODS - App Management
    # ========================================================================

    @abstractmethod
    async def start_app(self, package: str, activity: Optional[str] = None) -> str:
        """
        Start an app

        Args:
            package: Package name
            activity: Optional activity name

        Returns:
            Result message
        """
        pass

    @abstractmethod
    async def list_packages(self, include_system: bool = False) -> List[str]:
        """
        List installed packages

        Args:
            include_system: Include system packages

        Returns:
            List of package names
        """
        pass

    @abstractmethod
    async def get_apps(self) -> List[Dict[str, str]]:
        """
        Get list of installed apps with details

        Returns:
            List of app info dicts
        """
        pass

    # ========================================================================
    # ABSTRACT METHODS - Device State
    # ========================================================================

    @abstractmethod
    async def get_date(self) -> str:
        """
        Get current date/time from device

        Returns:
            Date string
        """
        pass

    # ========================================================================
    # MEMORY - Non-abstract (shared implementation)
    # ========================================================================

    async def remember(self, information: str) -> str:
        """
        Store important information to remember for future context

        Args:
            information: Information to store

        Returns:
            Confirmation message
        """
        key = f"memory_{len(self._memory)}"
        self._memory[key] = {
            "content": information,
            "timestamp": datetime.now().isoformat()
        }
        logger.debug(f"Remembered: {information[:50]}...")
        return f"Stored: {information[:50]}..."

    async def get_memory(self) -> Dict[str, Any]:
        """
        Get all stored memory

        Returns:
            Memory dict
        """
        return self._memory.copy()

    async def clear_memory(self) -> str:
        """
        Clear all stored memory

        Returns:
            Confirmation message
        """
        self._memory.clear()
        return "Memory cleared"

    # ========================================================================
    # COMPLETION
    # ========================================================================

    async def complete(self, success: bool, reason: str = "") -> str:
        """
        Mark the current task as completed

        Args:
            success: Whether the task was successful
            reason: Reason for completion/failure

        Returns:
            Completion message
        """
        status = "SUCCESS" if success else "FAILED"
        message = f"Task {status}: {reason}" if reason else f"Task {status}"
        logger.info(message)
        return message

    # ========================================================================
    # TRAJECTORY
    # ========================================================================

    def get_trajectory(self) -> List[Dict]:
        """
        Get recorded trajectory

        Returns:
            List of action records
        """
        return self._trajectory.copy()

    def clear_trajectory(self) -> None:
        """Clear recorded trajectory"""
        self._trajectory.clear()
        self._step_screenshots.clear()
        self._step_ui_states.clear()

    # ========================================================================
    # HELPER - Element coordinates
    # ========================================================================

    def _extract_element_coordinates_by_index(self, index: int) -> Optional[Tuple[int, int]]:
        """
        Extract center coordinates of element by index from cache

        Args:
            index: Element index

        Returns:
            Tuple of (x, y) coordinates or None if not found
        """
        for element in self.clickable_elements_cache:
            if element.get("index") == index:
                bounds = element.get("bounds", "0,0,0,0")
                try:
                    left, top, right, bottom = map(int, bounds.split(","))
                    center_x = (left + right) // 2
                    center_y = (top + bottom) // 2
                    return (center_x, center_y)
                except:
                    pass
        return None


def describe_tools(tools: Tools) -> Dict[str, Callable]:
    """
    Get a dictionary of available tool methods for LLM function calling

    Args:
        tools: Tools instance

    Returns:
        Dict mapping tool names to methods
    """
    return {
        "tap": tools.tap_by_index,
        "tap_by_index": tools.tap_by_index,
        "tap_by_coordinates": tools.tap_by_coordinates,
        "swipe": tools.swipe,
        "drag": tools.drag,
        "input_text": tools.input_text,
        "back": tools.back,
        "press_key": tools.press_key,
        "start_app": tools.start_app,
        "remember": tools.remember,
        "complete": tools.complete,
    }
