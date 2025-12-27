"""Backend service integration for Flet app."""

import asyncio
import subprocess
import re
from typing import Optional, List, Dict, Any, Callable, Tuple
from datetime import datetime
from enum import Enum
from dataclasses import dataclass

from agents.tools import DeviceTools


class ReplayStatus(Enum):
    """Status of a workflow replay step."""
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class StepResult:
    """Result of executing a single workflow step."""
    step_id: str
    step_name: str
    status: ReplayStatus
    message: str
    selector_used: Optional[str] = None
    element_index: Optional[int] = None
    duration_ms: int = 0


def match_element(
    a11y_tree: List[Dict[str, Any]],
    selectors: List[Dict[str, Any]]
) -> Tuple[Optional[int], Optional[str]]:
    """Match an element in the accessibility tree using selector strategies.

    Tries each selector in priority order until an element is found.

    Args:
        a11y_tree: The accessibility tree from get_state()
        selectors: List of selector dictionaries with type, value, confidence

    Returns:
        Tuple of (element_index, selector_value) if found, (None, None) if not found
    """
    if not a11y_tree or not selectors:
        return None, None

    # Flatten the a11y tree for searching
    def flatten_tree(items: List[Dict], result: List[Dict]):
        for item in items:
            result.append(item)
            if "children" in item:
                flatten_tree(item["children"], result)

    flat_elements: List[Dict] = []
    flatten_tree(a11y_tree, flat_elements)

    # Try each selector in order
    for selector in selectors:
        selector_type = selector.get("type", "")
        selector_value = selector.get("value", "")

        if not selector_type or not selector_value:
            continue

        # Try to match based on selector type
        matched_index = _try_selector(flat_elements, selector_type, selector_value)
        if matched_index is not None:
            return matched_index, selector_value

    return None, None


def _try_selector(
    elements: List[Dict[str, Any]],
    selector_type: str,
    selector_value: str
) -> Optional[int]:
    """Try to match an element using a specific selector strategy.

    Args:
        elements: Flattened list of accessibility tree elements
        selector_type: Type of selector (resource_id, text, content_desc, etc.)
        selector_value: Value to match

    Returns:
        Element index if found, None otherwise
    """
    for element in elements:
        index = element.get("index")
        if index is None:
            continue

        if selector_type == "resource_id":
            # Match by resource ID (viewIdResourceName)
            resource_id = element.get("viewIdResourceName", "") or element.get("resourceId", "")
            if resource_id == selector_value:
                return index
            # Also try matching the ID part after the last /
            if "/" in selector_value:
                short_id = selector_value.split("/")[-1]
                if resource_id.endswith(short_id):
                    return index

        elif selector_type == "content_desc":
            # Match by content description
            content_desc = element.get("contentDescription", "") or element.get("contentDesc", "")
            if content_desc == selector_value:
                return index

        elif selector_type == "text":
            # Match by text content
            text = element.get("text", "")
            if text == selector_value:
                return index

        elif selector_type == "class_with_text":
            # Match by class name and text combined
            # Format: "ClassName:text='value'"
            if ":text='" in selector_value:
                parts = selector_value.split(":text='")
                if len(parts) == 2:
                    class_part = parts[0]
                    text_part = parts[1].rstrip("'")
                    elem_class = element.get("className", "")
                    elem_text = element.get("text", "")
                    # Check if class name ends with the specified class
                    if elem_class.endswith(class_part) and elem_text == text_part:
                        return index

        elif selector_type == "xpath":
            # Basic XPath matching - supports //ClassName[@attr='value'] format
            match = _match_xpath(element, selector_value)
            if match:
                return index

        elif selector_type == "bounds":
            # Match by bounds coordinates
            # Format: "bounds=[left,top,right,bottom]"
            bounds_match = re.match(r"bounds=\[(\d+),(\d+),(\d+),(\d+)\]", selector_value)
            if bounds_match:
                target_left, target_top, target_right, target_bottom = map(int, bounds_match.groups())
                elem_bounds = element.get("bounds", "")
                if isinstance(elem_bounds, str):
                    try:
                        left, top, right, bottom = map(int, elem_bounds.split(","))
                        # Allow some tolerance for bounds matching
                        tolerance = 10
                        if (abs(left - target_left) <= tolerance and
                            abs(top - target_top) <= tolerance and
                            abs(right - target_right) <= tolerance and
                            abs(bottom - target_bottom) <= tolerance):
                            return index
                    except (ValueError, AttributeError):
                        pass

    return None


def _match_xpath(element: Dict[str, Any], xpath: str) -> bool:
    """Match an element against an XPath selector.

    Supports basic XPath format: //ClassName[@attr='value']

    Args:
        element: Element dictionary from accessibility tree
        xpath: XPath selector string

    Returns:
        True if element matches, False otherwise
    """
    # Parse XPath pattern: //ClassName[@text='value' and @content-desc='value']
    match = re.match(r"//(\w+)(?:\[(.+)\])?", xpath)
    if not match:
        return False

    class_name = match.group(1)
    predicates = match.group(2)

    # Check class name
    elem_class = element.get("className", "")
    if not elem_class.endswith(class_name):
        return False

    # If no predicates, class match is enough
    if not predicates:
        return True

    # Parse predicates
    # Handle @text='value' and @content-desc='value'
    predicate_parts = re.findall(r"@([\w-]+)='([^']*)'", predicates)

    for attr, value in predicate_parts:
        if attr == "text":
            if element.get("text", "") != value:
                return False
        elif attr == "content-desc":
            content_desc = element.get("contentDescription", "") or element.get("contentDesc", "")
            if content_desc != value:
                return False
        elif attr == "resource-id":
            resource_id = element.get("viewIdResourceName", "") or element.get("resourceId", "")
            if resource_id != value:
                return False

    return True


class BackendService:
    """Manages backend service connections using agents module."""

    def __init__(self):
        self._initialized = False
        self._devices: List[Dict[str, Any]] = []
        self._workflows: Dict[str, Dict[str, Any]] = {}

    async def initialize(self):
        """Initialize backend services."""
        if self._initialized:
            return
        self._initialized = True

    async def discover_devices(self) -> List[Dict[str, Any]]:
        """Discover connected Android devices via ADB."""
        try:
            result = subprocess.run(
                ["adb", "devices", "-l"],
                capture_output=True,
                text=True,
                timeout=10
            )

            devices = []
            lines = result.stdout.strip().split('\n')[1:]  # Skip header

            for line in lines:
                if not line.strip():
                    continue

                parts = line.split()
                if len(parts) >= 2:
                    serial = parts[0]
                    status = parts[1]

                    if status == "device":
                        # Get device info
                        device_info = self._get_device_info(serial)
                        devices.append({
                            "id": serial,
                            "name": device_info.get("name", serial),
                            "model": device_info.get("model", "Unknown"),
                            "manufacturer": device_info.get("manufacturer", "Unknown"),
                            "adb_serial": serial,
                            "status": "connected",
                            "android_version": device_info.get("android_version", ""),
                            "screen_resolution": device_info.get("resolution", ""),
                        })

            self._devices = devices
            return devices

        except Exception as e:
            print(f"Error discovering devices: {e}")
            return []

    def _get_device_info(self, serial: str) -> Dict[str, str]:
        """Get detailed device info via ADB."""
        info = {}

        try:
            # Get model
            result = subprocess.run(
                ["adb", "-s", serial, "shell", "getprop", "ro.product.model"],
                capture_output=True, text=True, timeout=5
            )
            info["model"] = result.stdout.strip()

            # Get manufacturer
            result = subprocess.run(
                ["adb", "-s", serial, "shell", "getprop", "ro.product.manufacturer"],
                capture_output=True, text=True, timeout=5
            )
            info["manufacturer"] = result.stdout.strip()

            # Get Android version
            result = subprocess.run(
                ["adb", "-s", serial, "shell", "getprop", "ro.build.version.release"],
                capture_output=True, text=True, timeout=5
            )
            info["android_version"] = result.stdout.strip()

            # Get device name
            result = subprocess.run(
                ["adb", "-s", serial, "shell", "getprop", "ro.product.name"],
                capture_output=True, text=True, timeout=5
            )
            info["name"] = result.stdout.strip() or info.get("model", serial)

            # Get screen resolution
            result = subprocess.run(
                ["adb", "-s", serial, "shell", "wm", "size"],
                capture_output=True, text=True, timeout=5
            )
            size_output = result.stdout.strip()
            if "Physical size:" in size_output:
                info["resolution"] = size_output.split(":")[-1].strip()

        except Exception as e:
            print(f"Error getting device info: {e}")

        return info

    async def get_devices(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all devices."""
        if not self._devices:
            await self.discover_devices()

        if status:
            return [d for d in self._devices if d.get("status") == status]
        return self._devices

    async def get_workflows(self) -> List[Dict[str, Any]]:
        """Get all workflows.

        Returns:
            List of workflow dictionaries sorted by creation time (newest first)
        """
        workflows = list(self._workflows.values())
        # Sort by created_at descending (newest first)
        workflows.sort(key=lambda w: w.get("created_at", ""), reverse=True)
        return workflows

    async def get_workflow(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """Get a workflow by ID.

        Args:
            workflow_id: The workflow ID to retrieve

        Returns:
            Workflow dictionary or None if not found
        """
        return self._workflows.get(workflow_id)

    async def create_workflow(self, name: str, description: str = None, steps: list = None) -> Dict[str, Any]:
        """Create a new workflow.

        Args:
            name: Workflow name
            description: Optional description
            steps: Optional list of workflow steps

        Returns:
            Created workflow dictionary
        """
        import uuid
        workflow_id = str(uuid.uuid4())
        workflow = {
            "id": workflow_id,
            "name": name,
            "description": description,
            "is_active": True,
            "steps": steps or [],
            "created_at": datetime.now().isoformat(),
            "metadata": {
                "action_count": len(steps) if steps else 0,
            },
        }
        self._workflows[workflow_id] = workflow
        return workflow

    async def delete_workflow(self, workflow_id: str) -> bool:
        """Delete a workflow by ID.

        Args:
            workflow_id: The workflow ID to delete

        Returns:
            True if deleted, False if not found
        """
        if workflow_id in self._workflows:
            del self._workflows[workflow_id]
            return True
        return False

    async def save_workflow(self, workflow_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save a workflow from recorded actions.

        This method is used to persist workflows generated by the recording service.
        It handles both new workflows and updates to existing ones.

        Args:
            workflow_data: Workflow dictionary with:
                - name: Workflow name (required)
                - description: Optional description
                - steps: List of workflow step dictionaries
                - metadata: Optional metadata dictionary
                - id: Optional workflow ID (generated if not provided)
                - created_at: Optional timestamp (generated if not provided)

        Returns:
            Saved workflow dictionary with assigned ID

        Raises:
            ValueError: If workflow name is missing
        """
        import uuid

        # Validate required fields
        if not workflow_data.get("name"):
            raise ValueError("Workflow name is required")

        # Generate ID if not present
        if "id" not in workflow_data:
            workflow_data["id"] = str(uuid.uuid4())

        # Ensure created_at timestamp exists
        if "created_at" not in workflow_data:
            workflow_data["created_at"] = datetime.now().isoformat()

        # Ensure steps is a list
        if "steps" not in workflow_data:
            workflow_data["steps"] = []

        # Ensure is_active flag
        if "is_active" not in workflow_data:
            workflow_data["is_active"] = True

        # Store workflow
        self._workflows[workflow_data["id"]] = workflow_data

        return workflow_data

    async def update_workflow(self, workflow_id: str, workflow_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an existing workflow.

        Args:
            workflow_id: ID of the workflow to update
            workflow_data: Updated workflow data

        Returns:
            Updated workflow dictionary or None if not found
        """
        if workflow_id not in self._workflows:
            return None

        # Preserve original ID and created_at
        workflow_data["id"] = workflow_id
        if "created_at" not in workflow_data:
            workflow_data["created_at"] = self._workflows[workflow_id].get(
                "created_at", datetime.now().isoformat()
            )

        # Update timestamp
        workflow_data["updated_at"] = datetime.now().isoformat()

        self._workflows[workflow_id] = workflow_data
        return workflow_data

    async def replay_workflow(
        self,
        workflow_id: str,
        device_serial: str,
        step_callback: Optional[Callable[[StepResult], None]] = None,
        stop_on_error: bool = True,
    ) -> List[StepResult]:
        """Replay a workflow on a connected device.

        Iterates through workflow steps, uses element matching with fallback
        selectors, and executes actions using DeviceTools.

        Args:
            workflow_id: ID of the workflow to replay
            device_serial: ADB serial of the target device
            step_callback: Optional callback called after each step with StepResult
            stop_on_error: If True, stop replay on first error; if False, continue

        Returns:
            List of StepResult objects for each executed step

        Raises:
            ValueError: If workflow not found or device not available
        """
        import time

        # Get workflow
        workflow = await self.get_workflow(workflow_id)
        if not workflow:
            raise ValueError(f"Workflow not found: {workflow_id}")

        steps = workflow.get("steps", [])
        if not steps:
            return []

        # Initialize DeviceTools
        try:
            tools = DeviceTools(serial=device_serial, use_tcp=True)
        except Exception as e:
            raise ValueError(f"Failed to connect to device {device_serial}: {e}")

        results: List[StepResult] = []

        try:
            for step in steps:
                step_id = step.get("id", "unknown")
                step_name = step.get("name", "Unknown step")
                action_type = step.get("action_type", "tap")
                selectors = step.get("selectors", [])
                delay_ms = step.get("delay_ms", 0)
                input_text = step.get("input_text")
                end_x = step.get("end_x")
                end_y = step.get("end_y")

                start_time = time.time()

                # Apply delay before step
                if delay_ms > 0:
                    await asyncio.sleep(delay_ms / 1000.0)

                # Get current device state
                try:
                    state = await tools.get_state()
                    a11y_tree = state.get("a11y_tree", [])
                except Exception as e:
                    result = StepResult(
                        step_id=step_id,
                        step_name=step_name,
                        status=ReplayStatus.FAILED,
                        message=f"Failed to get device state: {e}",
                        duration_ms=int((time.time() - start_time) * 1000),
                    )
                    results.append(result)
                    if step_callback:
                        step_callback(result)
                    if stop_on_error:
                        break
                    continue

                # Match element using selectors
                element_index, selector_used = match_element(a11y_tree, selectors)

                if element_index is None:
                    # Element not found - try coordinate fallback for bounds selector
                    coords = self._extract_coords_from_step(step, selectors)
                    if coords:
                        # Use coordinate-based action as fallback
                        result = await self._execute_coordinate_action(
                            tools, action_type, coords, input_text, step_id, step_name, start_time
                        )
                    else:
                        result = StepResult(
                            step_id=step_id,
                            step_name=step_name,
                            status=ReplayStatus.FAILED,
                            message="Element not found: all selectors failed",
                            duration_ms=int((time.time() - start_time) * 1000),
                        )
                    results.append(result)
                    if step_callback:
                        step_callback(result)
                    if stop_on_error:
                        break
                    continue

                # Execute action on matched element
                result = await self._execute_step_action(
                    tools=tools,
                    action_type=action_type,
                    element_index=element_index,
                    selector_used=selector_used,
                    input_text=input_text,
                    end_x=end_x,
                    end_y=end_y,
                    step_id=step_id,
                    step_name=step_name,
                    start_time=start_time,
                )
                results.append(result)

                if step_callback:
                    step_callback(result)

                if result.status == ReplayStatus.FAILED and stop_on_error:
                    break

                # Small delay between actions
                await asyncio.sleep(0.3)

        finally:
            tools.cleanup()

        return results

    async def _execute_step_action(
        self,
        tools: DeviceTools,
        action_type: str,
        element_index: int,
        selector_used: Optional[str],
        input_text: Optional[str],
        end_x: Optional[int],
        end_y: Optional[int],
        step_id: str,
        step_name: str,
        start_time: float,
    ) -> StepResult:
        """Execute a single step action on an element.

        Args:
            tools: DeviceTools instance
            action_type: Type of action (tap, input, swipe, etc.)
            element_index: Index of the element to act on
            selector_used: Selector that matched the element
            input_text: Text for input actions
            end_x, end_y: End coordinates for swipe actions
            step_id: Step identifier
            step_name: Human-readable step name
            start_time: Start time for duration calculation

        Returns:
            StepResult with success or failure status
        """
        import time

        try:
            if action_type == "tap":
                result_msg = await tools.tap_by_index(element_index)
            elif action_type == "long_press":
                result_msg = await tools.long_click_by_index(element_index)
            elif action_type == "input":
                if input_text is not None:
                    result_msg = await tools.input_text(input_text, index=element_index)
                else:
                    result_msg = "No input text provided"
            elif action_type == "scroll":
                result_msg = await tools.scroll_by_index(element_index, direction="down")
            elif action_type == "swipe":
                # For swipe, get element center and swipe to end coordinates
                node_info = await tools.get_node_info(element_index)
                if node_info and end_x is not None and end_y is not None:
                    bounds = node_info.get("bounds", "0,0,0,0")
                    try:
                        left, top, right, bottom = map(int, bounds.split(","))
                        start_x = (left + right) // 2
                        start_y = (top + bottom) // 2
                        result_msg = await tools.swipe(start_x, start_y, end_x, end_y)
                    except (ValueError, AttributeError):
                        result_msg = "Error: Could not parse element bounds for swipe"
                else:
                    result_msg = "Error: Missing coordinates for swipe action"
            else:
                result_msg = f"Unknown action type: {action_type}"

            # Check if action succeeded
            if result_msg and "error" in result_msg.lower():
                return StepResult(
                    step_id=step_id,
                    step_name=step_name,
                    status=ReplayStatus.FAILED,
                    message=result_msg,
                    selector_used=selector_used,
                    element_index=element_index,
                    duration_ms=int((time.time() - start_time) * 1000),
                )

            return StepResult(
                step_id=step_id,
                step_name=step_name,
                status=ReplayStatus.SUCCESS,
                message=result_msg or f"Executed {action_type}",
                selector_used=selector_used,
                element_index=element_index,
                duration_ms=int((time.time() - start_time) * 1000),
            )

        except Exception as e:
            return StepResult(
                step_id=step_id,
                step_name=step_name,
                status=ReplayStatus.FAILED,
                message=f"Action failed: {e}",
                selector_used=selector_used,
                element_index=element_index,
                duration_ms=int((time.time() - start_time) * 1000),
            )

    async def _execute_coordinate_action(
        self,
        tools: DeviceTools,
        action_type: str,
        coords: Tuple[int, int],
        input_text: Optional[str],
        step_id: str,
        step_name: str,
        start_time: float,
    ) -> StepResult:
        """Execute an action using coordinates as fallback.

        Args:
            tools: DeviceTools instance
            action_type: Type of action
            coords: (x, y) coordinates
            input_text: Text for input actions
            step_id: Step identifier
            step_name: Human-readable step name
            start_time: Start time for duration calculation

        Returns:
            StepResult with success or failure status
        """
        import time

        x, y = coords
        try:
            if action_type == "tap":
                result_msg = await tools.tap_by_coordinates(x, y)
            elif action_type == "long_press":
                # Long press using coordinates - not directly supported, try tap
                result_msg = await tools.tap_by_coordinates(x, y)
            else:
                return StepResult(
                    step_id=step_id,
                    step_name=step_name,
                    status=ReplayStatus.FAILED,
                    message=f"Coordinate fallback not supported for action: {action_type}",
                    selector_used=f"coords=({x},{y})",
                    duration_ms=int((time.time() - start_time) * 1000),
                )

            if result_msg and "error" in result_msg.lower():
                return StepResult(
                    step_id=step_id,
                    step_name=step_name,
                    status=ReplayStatus.FAILED,
                    message=result_msg,
                    selector_used=f"coords=({x},{y})",
                    duration_ms=int((time.time() - start_time) * 1000),
                )

            return StepResult(
                step_id=step_id,
                step_name=step_name,
                status=ReplayStatus.SUCCESS,
                message=f"{result_msg} (coordinate fallback)",
                selector_used=f"coords=({x},{y})",
                duration_ms=int((time.time() - start_time) * 1000),
            )

        except Exception as e:
            return StepResult(
                step_id=step_id,
                step_name=step_name,
                status=ReplayStatus.FAILED,
                message=f"Coordinate action failed: {e}",
                selector_used=f"coords=({x},{y})",
                duration_ms=int((time.time() - start_time) * 1000),
            )

    def _extract_coords_from_step(
        self,
        step: Dict[str, Any],
        selectors: List[Dict[str, Any]],
    ) -> Optional[Tuple[int, int]]:
        """Extract coordinates from step data or bounds selector.

        Used as fallback when element matching fails.

        Args:
            step: Step dictionary
            selectors: List of selectors to check for bounds

        Returns:
            (x, y) tuple if coordinates found, None otherwise
        """
        # Check for bounds selector
        for selector in selectors:
            if selector.get("type") == "bounds":
                value = selector.get("value", "")
                bounds_match = re.match(r"bounds=\[(\d+),(\d+),(\d+),(\d+)\]", value)
                if bounds_match:
                    left, top, right, bottom = map(int, bounds_match.groups())
                    x = (left + right) // 2
                    y = (top + bottom) // 2
                    return (x, y)
        return None

    async def take_screenshot(self, device_serial: str) -> Optional[bytes]:
        """Take a screenshot from a device."""
        try:
            tools = DeviceTools(serial=device_serial, use_tcp=True)
            screenshot_data = tools.take_screenshot()
            tools.cleanup()
            return screenshot_data
        except Exception as e:
            print(f"Error taking screenshot: {e}")
            return None


# Global backend instance
backend = BackendService()
