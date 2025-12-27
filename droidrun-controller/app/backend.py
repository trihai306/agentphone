"""Backend service integration for Flet app."""

import asyncio
import subprocess
import aiohttp
from typing import Optional, List, Dict, Any
from datetime import datetime

from agents.tools import DeviceTools


# Default port for the Portal HTTP server on Android
PORTAL_HTTP_PORT = 8080


class BackendService:
    """Manages backend service connections using agents module."""

    def __init__(self):
        self._initialized = False
        self._devices: List[Dict[str, Any]] = []
        self._http_session: Optional[aiohttp.ClientSession] = None

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
        """Get all workflows (placeholder)."""
        return []

    async def get_workflow(self, workflow_id: int) -> Optional[Dict[str, Any]]:
        """Get a workflow by ID (placeholder)."""
        return None

    async def create_workflow(self, name: str, description: str = None, steps: list = None) -> Dict[str, Any]:
        """Create a new workflow (placeholder)."""
        return {
            "id": 1,
            "name": name,
            "description": description,
            "is_active": True,
            "steps": steps or [],
        }

    async def delete_workflow(self, workflow_id: int) -> bool:
        """Delete a workflow (placeholder)."""
        return True

    async def take_screenshot(self, device_serial: str) -> Optional[bytes]:
        """Take a screenshot from a device."""
        try:
            tools = DeviceTools(serial=device_serial, use_tcp=True)
            screenshot_data = tools.take_screenshot()
            tools.cleanup()
            return screenshot_data
        except Exception as e:
            return None

    # ==================== Recording Control Methods ====================

    def _get_device_url(self, device_serial: str) -> str:
        """Get the HTTP URL for a device's Portal server.

        Uses ADB port forwarding to communicate with the device.
        """
        return f"http://localhost:{PORTAL_HTTP_PORT}"

    async def _get_http_session(self) -> aiohttp.ClientSession:
        """Get or create an HTTP session for backend communication."""
        if self._http_session is None or self._http_session.closed:
            timeout = aiohttp.ClientTimeout(total=30)
            self._http_session = aiohttp.ClientSession(timeout=timeout)
        return self._http_session

    async def _setup_port_forwarding(self, device_serial: str) -> bool:
        """Setup ADB port forwarding for device communication."""
        try:
            result = subprocess.run(
                ["adb", "-s", device_serial, "forward", f"tcp:{PORTAL_HTTP_PORT}", f"tcp:{PORTAL_HTTP_PORT}"],
                capture_output=True,
                text=True,
                timeout=10
            )
            return result.returncode == 0
        except Exception:
            return False

    async def start_recording(self, device_serial: str) -> bool:
        """Start recording on the Android device.

        Args:
            device_serial: The device serial/ID to record from.

        Returns:
            True if recording started successfully, False otherwise.
        """
        try:
            # Setup port forwarding first
            if not await self._setup_port_forwarding(device_serial):
                return False

            session = await self._get_http_session()
            url = f"{self._get_device_url(device_serial)}/recording/start"

            async with session.post(url, json={}) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("success", False)
                return False
        except Exception:
            return False

    async def stop_recording(self, device_serial: str) -> bool:
        """Stop recording on the Android device.

        Args:
            device_serial: The device serial/ID to stop recording on.

        Returns:
            True if recording stopped successfully, False otherwise.
        """
        try:
            session = await self._get_http_session()
            url = f"{self._get_device_url(device_serial)}/recording/stop"

            async with session.post(url, json={}) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("success", False)
                return False
        except Exception:
            return False

    async def pause_recording(self, device_serial: str) -> bool:
        """Pause recording on the Android device.

        Args:
            device_serial: The device serial/ID.

        Returns:
            True if recording paused successfully, False otherwise.
        """
        try:
            session = await self._get_http_session()
            url = f"{self._get_device_url(device_serial)}/recording/pause"

            async with session.post(url, json={}) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("success", False)
                return False
        except Exception:
            return False

    async def resume_recording(self, device_serial: str) -> bool:
        """Resume recording on the Android device.

        Args:
            device_serial: The device serial/ID.

        Returns:
            True if recording resumed successfully, False otherwise.
        """
        try:
            session = await self._get_http_session()
            url = f"{self._get_device_url(device_serial)}/recording/resume"

            async with session.post(url, json={}) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("success", False)
                return False
        except Exception:
            return False

    async def get_recorded_events(self, device_serial: str) -> List[Dict[str, Any]]:
        """Get recorded events from the Android device.

        Args:
            device_serial: The device serial/ID to get events from.

        Returns:
            List of recorded event dictionaries.
        """
        try:
            session = await self._get_http_session()
            url = f"{self._get_device_url(device_serial)}/recording/events"

            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("events", [])
                return []
        except Exception:
            return []

    async def get_recording_status(self, device_serial: str) -> Dict[str, Any]:
        """Get the current recording status from the Android device.

        Args:
            device_serial: The device serial/ID.

        Returns:
            Dictionary with recording status information.
        """
        try:
            session = await self._get_http_session()
            url = f"{self._get_device_url(device_serial)}/recording/status"

            async with session.get(url) as response:
                if response.status == 200:
                    return await response.json()
                return {"status": "unknown", "event_count": 0}
        except Exception:
            return {"status": "error", "event_count": 0}

    # ==================== Replay Methods ====================

    async def replay_workflow(
        self,
        workflow: Dict[str, Any],
        device_serial: str,
        on_progress: Optional[Any] = None,
        stop_on_error: bool = True,
    ) -> Dict[str, Any]:
        """Replay a workflow on the Android device.

        Loads the workflow, connects to the device, and executes each step
        via the ReplayEngine.

        Args:
            workflow: The workflow dictionary with steps to execute.
            device_serial: The device serial/ID to replay on.
            on_progress: Optional callback for progress updates.
            stop_on_error: Whether to stop on first error (default: True).

        Returns:
            Dictionary with replay results including success status and step results.
        """
        from app.services.replay_engine import ReplayEngine
        from app.models.workflow import Workflow as WorkflowModel

        # Setup port forwarding first
        if not await self._setup_port_forwarding(device_serial):
            return {
                "success": False,
                "error": "Failed to setup port forwarding",
                "status": "failed",
            }

        # Create replay engine and connect
        engine = ReplayEngine(
            device_host="localhost",
            device_port=PORTAL_HTTP_PORT,
        )

        try:
            # Connect to device
            connected = await engine.connect()
            if not connected:
                return {
                    "success": False,
                    "error": "Failed to connect to device",
                    "status": "failed",
                }

            # Add progress callback if provided
            if on_progress:
                engine.add_progress_callback(on_progress)

            # Convert dict to Workflow model
            try:
                workflow_model = WorkflowModel.model_validate(workflow)
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Invalid workflow format: {str(e)}",
                    "status": "failed",
                }

            # Execute workflow
            progress = await engine.execute_workflow(
                workflow_model,
                stop_on_error=stop_on_error,
            )

            # Build result
            return {
                "success": progress.status.value == "completed",
                "status": progress.status.value,
                "total_steps": progress.total_steps,
                "completed_steps": progress.completed_steps,
                "success_count": progress.success_count,
                "failed_count": progress.failed_count,
                "error": progress.error,
                "step_results": [r.to_dict() for r in progress.step_results],
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "status": "failed",
            }
        finally:
            await engine.disconnect()

    async def execute_single_step(
        self,
        step: Dict[str, Any],
        device_serial: str,
    ) -> Dict[str, Any]:
        """Execute a single workflow step for testing/debugging.

        Args:
            step: The step dictionary to execute.
            device_serial: The device serial/ID.

        Returns:
            Dictionary with execution result.
        """
        from app.services.replay_engine import ReplayEngine
        from app.models.workflow import WorkflowStep

        # Setup port forwarding
        if not await self._setup_port_forwarding(device_serial):
            return {
                "success": False,
                "error": "Failed to setup port forwarding",
            }

        engine = ReplayEngine(
            device_host="localhost",
            device_port=PORTAL_HTTP_PORT,
        )

        try:
            connected = await engine.connect()
            if not connected:
                return {
                    "success": False,
                    "error": "Failed to connect to device",
                }

            # Convert dict to WorkflowStep model
            try:
                step_model = WorkflowStep.model_validate(step)
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Invalid step format: {str(e)}",
                }

            # Execute the step
            result = await engine.execute_single_step(step_model)

            return {
                "success": result.result.value == "success",
                "result": result.result.value,
                "message": result.message,
                "duration_ms": result.duration_ms,
                "selector_used": result.selector_used,
                "fallback_used": result.fallback_used,
                "error": result.error,
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }
        finally:
            await engine.disconnect()

    async def ping_device(self, device_serial: str) -> bool:
        """Ping the Android device to check if the Portal server is running.

        Args:
            device_serial: The device serial/ID.

        Returns:
            True if device responds, False otherwise.
        """
        try:
            # Setup port forwarding
            if not await self._setup_port_forwarding(device_serial):
                return False

            session = await self._get_http_session()
            url = f"{self._get_device_url(device_serial)}/ping"

            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("status") == "success"
                return False
        except Exception:
            return False

    async def close(self):
        """Close the backend service and cleanup resources."""
        if self._http_session and not self._http_session.closed:
            await self._http_session.close()
            self._http_session = None


# Global backend instance
backend = BackendService()
