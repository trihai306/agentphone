"""Backend service integration for Flet app."""

import asyncio
import subprocess
from typing import Optional, List, Dict, Any
from datetime import datetime

from agents.tools import DeviceTools


class BackendService:
    """Manages backend service connections using agents module."""

    def __init__(self):
        self._initialized = False
        self._devices: List[Dict[str, Any]] = []

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
            print(f"Error taking screenshot: {e}")
            return None


# Global backend instance
backend = BackendService()
