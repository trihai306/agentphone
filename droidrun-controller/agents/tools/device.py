"""
Device Tools - Android device interaction via Portal APK (DroidRun standard)

Provides communication with device through:
- TCP Mode: HTTP requests to Portal server (Accessibility Service)
- Screenshot & State: Via Accessibility Service or ADB fallback

All UI actions are performed via Accessibility Service only.
"""

import os
import io
import json
import time
import base64
import asyncio
import logging
import requests
from typing import Dict, List, Any, Optional, Tuple
from adbutils import adb

from agents.tools.base import Tools
from agents.tools.types import UIElement, PhoneState, DeviceState

logger = logging.getLogger("agents.tools.device")


class DeviceTools(Tools):
    """
    Tools for Android device interaction via Portal APK (DroidRun standard)

    All UI actions use Accessibility Service via HTTP endpoints.
    ADB is only used for:
    - Screenshot fallback
    - App launch
    - TCP port forwarding setup
    """

    PORTAL_PACKAGE = "com.droidrun.portal"
    DEFAULT_TCP_PORT = 8080

    def __init__(
        self,
        serial: str = "emulator-5554",
        use_tcp: bool = True,
        tcp_port: int = DEFAULT_TCP_PORT,
        save_trajectories: bool = False
    ):
        """
        Initialize DeviceTools

        Args:
            serial: Device serial number
            use_tcp: Use TCP mode (required for Accessibility Service actions)
            tcp_port: Port for TCP communication
            save_trajectories: Whether to save action trajectories
        """
        super().__init__()

        self.serial = serial
        self.use_tcp = use_tcp
        self.tcp_port = tcp_port
        self.save_trajectories = save_trajectories

        # Connect to device
        self.device = adb.device(serial=serial)

        # TCP forwarding
        self.tcp_forwarded = False
        self.local_port = None
        self.tcp_base_url = None

        # Element cache
        self._element_cache: List[UIElement] = []
        self._last_state: Optional[DeviceState] = None
        self.clickable_elements_cache: List[Dict] = []

        # Setup
        if self.use_tcp:
            self._setup_tcp_forward()

        self._setup_keyboard()

        logger.info(f"DeviceTools initialized: {serial}")
        logger.info(f"Mode: {'TCP (Accessibility Service)' if self.tcp_forwarded else 'Limited (no TCP)'}")

    # ========================================================================
    # SETUP
    # ========================================================================

    def _setup_tcp_forward(self) -> bool:
        """Setup TCP port forwarding"""
        try:
            self.local_port = self.device.forward_port(self.tcp_port)
            self.tcp_base_url = f"http://localhost:{self.local_port}"

            # Test connection
            response = requests.get(f"{self.tcp_base_url}/ping", timeout=5)
            if response.status_code == 200:
                self.tcp_forwarded = True
                logger.info(f"TCP forwarding setup: {self.tcp_base_url}")
                return True
            else:
                logger.warning(f"TCP ping failed: {response.status_code}")
                return False

        except Exception as e:
            logger.error(f"TCP setup failed: {e}")
            self.tcp_forwarded = False
            return False

    def _setup_keyboard(self) -> bool:
        """Setup Portal keyboard for text input"""
        try:
            self.device.shell(f"ime enable {self.PORTAL_PACKAGE}/.keyboard.PortalKeyboardIME")
            self.device.shell(f"ime set {self.PORTAL_PACKAGE}/.keyboard.PortalKeyboardIME")
            logger.debug("Portal keyboard setup")
            return True
        except Exception as e:
            logger.error(f"Keyboard setup failed: {e}")
            return False

    def _ensure_accessibility_service(self) -> bool:
        """Check if Accessibility Service is available"""
        if not self.use_tcp or not self.tcp_forwarded:
            logger.error("Accessibility Service requires TCP mode")
            return False
        return True

    def _extract_error_message(self, response) -> str:
        """Extract error message from HTTP response safely"""
        try:
            return response.json().get("error", response.text)
        except:
            return response.text or f"HTTP {response.status_code}"

    def cleanup(self):
        """Cleanup resources"""
        if self.tcp_forwarded and self.local_port:
            try:
                cmd = f"killforward:tcp:{self.local_port}"
                c = self.device.open_transport(cmd)
                c.close()
                logger.debug("TCP forwarding removed")
            except:
                pass

    def __del__(self):
        self.cleanup()

    # ========================================================================
    # STATE & SCREENSHOT (uses Accessibility Service, ADB fallback for screenshot)
    # ========================================================================

    async def get_state(self) -> Dict[str, Any]:
        """
        Get current device state (UI elements + phone state)

        Returns:
            Dict with elements, phone_state, a11y_tree
        """
        try:
            raw_data = self._fetch_state()

            if "error" in raw_data:
                logger.error(f"Get state error: {raw_data['message']}")
                return {
                    "elements": [],
                    "phone_state": {},
                    "a11y_tree": [],
                    "timestamp": time.time()
                }

            # Parse a11y_tree
            a11y_tree = raw_data.get("a11y_tree", [])
            elements = self._parse_elements(a11y_tree)

            # Parse phone_state
            phone_data = raw_data.get("phone_state", {})
            phone_state = PhoneState(
                current_app=phone_data.get("currentApp", ""),
                current_activity=phone_data.get("currentActivity", ""),
                screen_width=phone_data.get("screenWidth", 1080),
                screen_height=phone_data.get("screenHeight", 1920),
                is_screen_on=phone_data.get("isScreenOn", True),
                orientation=phone_data.get("orientation", "portrait")
            )

            # Cache elements for index-based operations
            self._element_cache = elements
            self._update_clickable_cache(a11y_tree)

            self._last_state = DeviceState(
                elements=elements,
                phone_state=phone_state,
                raw_a11y_tree=a11y_tree,
                timestamp=time.time()
            )

            return {
                "elements": elements,
                "phone_state": phone_state.__dict__,
                "a11y_tree": a11y_tree,
                "timestamp": time.time()
            }

        except Exception as e:
            logger.error(f"Get state failed: {e}")
            return {
                "elements": [],
                "phone_state": {},
                "a11y_tree": [],
                "timestamp": time.time()
            }

    def _update_clickable_cache(self, a11y_tree: List[Dict]) -> None:
        """Update clickable elements cache for index lookup"""
        self.clickable_elements_cache = []

        def flatten(items: List[Dict]):
            for item in items:
                self.clickable_elements_cache.append(item)
                if "children" in item:
                    flatten(item["children"])

        flatten(a11y_tree)

    async def take_screenshot(self, hide_overlay: bool = True) -> bytes:
        """
        Take screenshot using ADB (faster and more reliable)

        Args:
            hide_overlay: Whether to hide Portal overlay before screenshot

        Returns:
            PNG image bytes
        """
        try:
            # Hide overlay if requested
            if hide_overlay and self.tcp_forwarded:
                try:
                    requests.post(
                        f"{self.tcp_base_url}/overlay",
                        json={"action": "stop"},
                        timeout=2
                    )
                    await asyncio.sleep(0.1)
                except:
                    pass

            # Use ADB screenshot - returns PIL Image
            img = self.device.screenshot()

            # Convert PIL Image to PNG bytes
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            screenshot_bytes = buffer.getvalue()

            # Restore overlay if it was hidden
            if hide_overlay and self.tcp_forwarded:
                try:
                    requests.post(
                        f"{self.tcp_base_url}/overlay",
                        json={"action": "show_indexes"},
                        timeout=2
                    )
                except:
                    pass

            if screenshot_bytes and len(screenshot_bytes) > 100:
                logger.debug(f"Screenshot taken via ADB: {len(screenshot_bytes)} bytes")
                return screenshot_bytes
            return b""
        except Exception as e:
            logger.error(f"Screenshot failed: {e}")
            return b""

    # ========================================================================
    # UI ACTIONS - Accessibility Service ONLY (no ADB fallback)
    # ========================================================================

    @Tools.ui_action
    async def tap_by_index(self, index: int) -> str:
        """
        Tap element by index using Accessibility Service

        Args:
            index: Element index from get_state()

        Returns:
            Result message
        """
        if not self._ensure_accessibility_service():
            return "Error: Accessibility Service not available"

        try:
            response = requests.post(
                f"{self.tcp_base_url}/action/click",
                json={"index": index},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                await asyncio.sleep(0.3)
                logger.debug(f"Tap element {index} via Accessibility Service")
                return data.get("message", f"Tapped element {index}")
            else:
                error_msg = self._extract_error_message(response)
                logger.error(f"Tap failed: {error_msg}")
                return f"Error: {error_msg}"
        except Exception as e:
            logger.error(f"Tap error: {e}")
            return f"Error: Tap failed: {e}"

    @Tools.ui_action
    async def long_click_by_index(self, index: int) -> str:
        """
        Long click on element by index using Accessibility Service

        Args:
            index: Element index from get_state()

        Returns:
            Result message
        """
        if not self._ensure_accessibility_service():
            return "Error: Accessibility Service not available"

        try:
            response = requests.post(
                f"{self.tcp_base_url}/action/longclick",
                json={"index": index},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                await asyncio.sleep(0.5)
                logger.debug(f"Long click element {index}")
                return data.get("message", f"Long clicked element {index}")
            else:
                error_msg = self._extract_error_message(response)
                logger.error(f"Long click failed: {error_msg}")
                return f"Error: {error_msg}"
        except Exception as e:
            logger.error(f"Long click error: {e}")
            return f"Error: Long click failed: {e}"

    @Tools.ui_action
    async def input_text(self, text: str, index: int = -1, clear: bool = False) -> str:
        """
        Input text using Accessibility Service setText

        Args:
            text: Text to input
            index: Element index to set text on (required)
            clear: Whether to clear existing text first (setText always replaces)

        Returns:
            Result message
        """
        if not self._ensure_accessibility_service():
            return "Error: Accessibility Service not available"

        if index < 0:
            return "Error: Element index is required for input_text"

        try:
            response = requests.post(
                f"{self.tcp_base_url}/action/setText",
                json={"index": index, "text": text},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                await asyncio.sleep(0.2)
                logger.debug(f"Set text on element {index}")
                return data.get("message", f"Set text on element {index}")
            else:
                error_msg = self._extract_error_message(response)
                logger.error(f"Set text failed: {error_msg}")
                return f"Error: {error_msg}"
        except Exception as e:
            logger.error(f"Set text error: {e}")
            return f"Error: Set text failed: {e}"

    @Tools.ui_action
    async def scroll_by_index(self, index: int, direction: str = "down") -> str:
        """
        Scroll element by index using Accessibility Service

        Args:
            index: Element index from get_state()
            direction: "down", "up", "forward", "backward"

        Returns:
            Result message
        """
        if not self._ensure_accessibility_service():
            return "Error: Accessibility Service not available"

        # Normalize direction
        direction_map = {
            "down": "forward",
            "up": "backward",
            "right": "forward",
            "left": "backward",
        }
        normalized = direction_map.get(direction.lower(), direction.lower())

        try:
            response = requests.post(
                f"{self.tcp_base_url}/action/scroll",
                json={"index": index, "direction": normalized},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                await asyncio.sleep(0.3)
                logger.debug(f"Scroll element {index} {direction}")
                return data.get("message", f"Scrolled element {index} {direction}")
            else:
                error_msg = self._extract_error_message(response)
                logger.error(f"Scroll failed: {error_msg}")
                return f"Error: {error_msg}"
        except Exception as e:
            logger.error(f"Scroll error: {e}")
            return f"Error: Scroll failed: {e}"

    @Tools.ui_action
    async def focus_by_index(self, index: int) -> str:
        """
        Focus element by index using Accessibility Service

        Args:
            index: Element index from get_state()

        Returns:
            Result message
        """
        if not self._ensure_accessibility_service():
            return "Error: Accessibility Service not available"

        try:
            response = requests.post(
                f"{self.tcp_base_url}/action/focus",
                json={"index": index},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                await asyncio.sleep(0.2)
                logger.debug(f"Focus element {index}")
                return data.get("message", f"Focused element {index}")
            else:
                error_msg = self._extract_error_message(response)
                logger.error(f"Focus failed: {error_msg}")
                return f"Error: {error_msg}"
        except Exception as e:
            logger.error(f"Focus error: {e}")
            return f"Error: Focus failed: {e}"

    # ========================================================================
    # COORDINATE-BASED ACTIONS - Uses Accessibility Service dispatchGesture
    # ========================================================================

    @Tools.ui_action
    async def tap_by_coordinates(self, x: int, y: int) -> str:
        """
        Tap at specific screen coordinates using Accessibility Service

        Args:
            x: X coordinate
            y: Y coordinate

        Returns:
            Result message
        """
        if not self._ensure_accessibility_service():
            return "Error: Accessibility Service not available"

        try:
            response = requests.post(
                f"{self.tcp_base_url}/action/tap",
                json={"x": x, "y": y},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                await asyncio.sleep(0.3)
                logger.debug(f"Tap coordinates ({x}, {y})")
                return data.get("message", f"Tapped at ({x}, {y})")
            else:
                error_msg = self._extract_error_message(response)
                logger.error(f"Tap coordinates failed: {error_msg}")
                return f"Error: {error_msg}"
        except Exception as e:
            logger.error(f"Tap coordinates error: {e}")
            return f"Error: Tap at ({x}, {y}) failed: {e}"

    @Tools.ui_action
    async def swipe(
        self,
        start_x: int,
        start_y: int,
        end_x: int,
        end_y: int,
        duration_ms: int = 300
    ) -> str:
        """
        Perform a swipe gesture using Accessibility Service or ADB fallback

        Args:
            start_x, start_y: Start coordinates
            end_x, end_y: End coordinates
            duration_ms: Duration in milliseconds

        Returns:
            Result message
        """
        # Try Accessibility Service first
        if self.tcp_forwarded and self._ensure_accessibility_service():
            try:
                response = requests.post(
                    f"{self.tcp_base_url}/action/swipe",
                    json={
                        "startX": start_x,
                        "startY": start_y,
                        "endX": end_x,
                        "endY": end_y,
                        "duration": duration_ms
                    },
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") != "error":
                        await asyncio.sleep(0.3)
                        logger.debug(f"Swipe from ({start_x}, {start_y}) to ({end_x}, {end_y})")
                        return data.get("message", f"Swiped from ({start_x}, {start_y}) to ({end_x}, {end_y})")
                # If Portal failed, fall through to ADB
                logger.warning("Portal swipe failed, trying ADB fallback...")
            except Exception as e:
                logger.warning(f"Portal swipe error: {e}, trying ADB fallback...")

        # ADB fallback
        try:
            self.device.shell(f"input swipe {start_x} {start_y} {end_x} {end_y} {duration_ms}")
            await asyncio.sleep(0.3)
            logger.debug(f"ADB swipe from ({start_x}, {start_y}) to ({end_x}, {end_y})")
            return f"Swiped from ({start_x}, {start_y}) to ({end_x}, {end_y}) via ADB"
        except Exception as e:
            logger.error(f"ADB swipe error: {e}")
            return f"Error: Swipe failed: {e}"

    @Tools.ui_action
    async def drag(
        self,
        start_x: int,
        start_y: int,
        end_x: int,
        end_y: int,
        duration_ms: int = 500
    ) -> str:
        """
        Perform a drag and drop gesture using Accessibility Service

        Args:
            start_x, start_y: Start coordinates
            end_x, end_y: End coordinates
            duration_ms: Duration in milliseconds

        Returns:
            Result message
        """
        if not self._ensure_accessibility_service():
            return "Error: Accessibility Service not available"

        try:
            response = requests.post(
                f"{self.tcp_base_url}/action/drag",
                json={
                    "startX": start_x,
                    "startY": start_y,
                    "endX": end_x,
                    "endY": end_y,
                    "duration": duration_ms
                },
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                await asyncio.sleep(0.5)
                logger.debug(f"Drag from ({start_x}, {start_y}) to ({end_x}, {end_y})")
                return data.get("message", f"Dragged from ({start_x}, {start_y}) to ({end_x}, {end_y})")
            else:
                error_msg = self._extract_error_message(response)
                logger.error(f"Drag failed: {error_msg}")
                return f"Error: {error_msg}"
        except Exception as e:
            logger.error(f"Drag error: {e}")
            return f"Error: Drag failed: {e}"

    @Tools.ui_action
    async def press_key(self, keycode: int) -> str:
        """
        Press a hardware key using Accessibility Service global actions

        Args:
            keycode: Android keycode or key name
                     Supported: back, home, recents, notifications,
                     quick_settings, power_dialog, lock_screen, take_screenshot

        Returns:
            Result message
        """
        if not self._ensure_accessibility_service():
            return "Error: Accessibility Service not available"

        # Map common keycodes to action names
        keycode_map = {
            4: "back",      # KEYCODE_BACK
            3: "home",      # KEYCODE_HOME
            187: "recents", # KEYCODE_APP_SWITCH
        }

        key_name = keycode_map.get(keycode, str(keycode))

        try:
            response = requests.post(
                f"{self.tcp_base_url}/action/pressKey",
                json={"key": key_name},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                await asyncio.sleep(0.2)
                logger.debug(f"Press key {keycode}")
                return data.get("message", f"Pressed key {keycode}")
            else:
                error_msg = self._extract_error_message(response)
                logger.error(f"Press key failed: {error_msg}")
                return f"Error: {error_msg}"
        except Exception as e:
            logger.error(f"Press key error: {e}")
            return f"Error: Press key {keycode} failed: {e}"

    async def get_date(self) -> str:
        """
        Get current date/time from device

        Returns:
            Date string
        """
        try:
            result = self.device.shell("date")
            return result.strip()
        except Exception as e:
            logger.error(f"Get date error: {e}")
            return f"Error: Get date failed: {e}"

    # ========================================================================
    # GLOBAL ACTIONS - Accessibility Service ONLY
    # ========================================================================

    @Tools.ui_action
    async def back(self) -> str:
        """Press the back button"""
        return await self._global_action("back")

    @Tools.ui_action
    async def home(self) -> str:
        """Press the home button"""
        return await self._global_action("home")

    @Tools.ui_action
    async def recents(self) -> str:
        """Open recent apps"""
        return await self._global_action("recents")

    @Tools.ui_action
    async def notifications(self) -> str:
        """Open notification panel"""
        return await self._global_action("notifications")

    @Tools.ui_action
    async def quick_settings(self) -> str:
        """Open quick settings"""
        return await self._global_action("quick_settings")

    @Tools.ui_action
    async def power_dialog(self) -> str:
        """Open power dialog"""
        return await self._global_action("power_dialog")

    @Tools.ui_action
    async def lock_screen(self) -> str:
        """Lock the screen (Android P+)"""
        return await self._global_action("lock_screen")

    async def _global_action(self, action: str) -> str:
        """Execute global action via Accessibility Service"""
        if not self._ensure_accessibility_service():
            return f"Error: Accessibility Service not available"

        try:
            response = requests.post(
                f"{self.tcp_base_url}/action/global",
                json={"action": action},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                await asyncio.sleep(0.3)
                logger.debug(f"Global action: {action}")
                return data.get("message", f"Executed {action}")
            else:
                error_msg = self._extract_error_message(response)
                logger.error(f"Global action failed: {error_msg}")
                return f"Error: {error_msg}"
        except Exception as e:
            logger.error(f"Global action error: {e}")
            return f"Error: {action} failed: {e}"

    # ========================================================================
    # NODE INFO
    # ========================================================================

    async def get_node_info(self, index: int) -> Optional[Dict[str, Any]]:
        """
        Get detailed info for a node by index

        Args:
            index: Element index from get_state()

        Returns:
            Node info dict or None
        """
        if not self._ensure_accessibility_service():
            return None

        try:
            response = requests.get(
                f"{self.tcp_base_url}/action/node",
                params={"index": index},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("data")
        except Exception as e:
            logger.error(f"Get node info error: {e}")
        return None

    # ========================================================================
    # APP MANAGEMENT (uses Accessibility Service)
    # ========================================================================

    @Tools.ui_action
    async def start_app(self, package: str, activity: Optional[str] = None) -> str:
        """
        Start an app using Accessibility Service

        Args:
            package: Package name (e.g., "com.facebook.katana")
            activity: Optional activity name

        Returns:
            Result message
        """
        if not self._ensure_accessibility_service():
            return "Error: Accessibility Service not available"

        try:
            payload = {"package": package}
            if activity:
                payload["activity"] = activity

            response = requests.post(
                f"{self.tcp_base_url}/app/start",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                await asyncio.sleep(1)
                logger.debug(f"Start app: {package}")
                return data.get("message", f"Started {package}")
            else:
                error_msg = self._extract_error_message(response)
                logger.error(f"Start app failed: {error_msg}")
                return f"Error: {error_msg}"
        except Exception as e:
            logger.error(f"Start app failed: {e}")
            return f"Error: Start app failed: {e}"

    async def list_packages(self, include_system: bool = False) -> List[str]:
        """List installed packages via Accessibility Service"""
        if not self._ensure_accessibility_service():
            return []

        try:
            response = requests.get(
                f"{self.tcp_base_url}/app/packages",
                params={"includeSystem": str(include_system).lower()},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("packages", [])
            return []
        except Exception as e:
            logger.error(f"List packages failed: {e}")
            return []

    async def get_apps(self) -> List[Dict[str, str]]:
        """Get list of installed apps with details"""
        try:
            packages = await self.list_packages()
            apps = []
            for pkg in packages:
                apps.append({
                    "package": pkg,
                    "name": pkg.split(".")[-1]
                })
            return apps
        except Exception as e:
            logger.error(f"Get apps failed: {e}")
            return []

    # ========================================================================
    # LEGACY SYNC METHODS (for backward compatibility)
    # ========================================================================

    def get_state_sync(self) -> DeviceState:
        """Synchronous version of get_state"""
        try:
            raw_data = self._fetch_state()

            if "error" in raw_data:
                logger.error(f"Get state error: {raw_data['message']}")
                return DeviceState(
                    elements=[],
                    phone_state=PhoneState("", "", 0, 0, True, "portrait"),
                    raw_a11y_tree=[],
                    timestamp=time.time()
                )

            a11y_tree = raw_data.get("a11y_tree", [])
            elements = self._parse_elements(a11y_tree)

            phone_data = raw_data.get("phone_state", {})
            phone_state = PhoneState(
                current_app=phone_data.get("currentApp", ""),
                current_activity=phone_data.get("currentActivity", ""),
                screen_width=phone_data.get("screenWidth", 1080),
                screen_height=phone_data.get("screenHeight", 1920),
                is_screen_on=phone_data.get("isScreenOn", True),
                orientation=phone_data.get("orientation", "portrait")
            )

            self._element_cache = elements
            self._update_clickable_cache(a11y_tree)

            self._last_state = DeviceState(
                elements=elements,
                phone_state=phone_state,
                raw_a11y_tree=a11y_tree,
                timestamp=time.time()
            )

            return self._last_state

        except Exception as e:
            logger.error(f"Get state failed: {e}")
            return DeviceState(
                elements=[],
                phone_state=PhoneState("", "", 0, 0, True, "portrait"),
                raw_a11y_tree=[],
                timestamp=time.time()
            )

    def tap_element(self, index: int) -> bool:
        """Sync tap element by index"""
        if not self._ensure_accessibility_service():
            return False

        try:
            response = requests.post(
                f"{self.tcp_base_url}/action/click",
                json={"index": index},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 200:
                time.sleep(0.3)
                logger.debug(f"Tap element {index}")
                return True
            return False
        except Exception as e:
            logger.error(f"Tap error: {e}")
            return False

    def input_text_sync(self, text: str, index: int) -> bool:
        """Sync input text on element"""
        if not self._ensure_accessibility_service():
            return False

        try:
            response = requests.post(
                f"{self.tcp_base_url}/action/setText",
                json={"index": index, "text": text},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 200:
                time.sleep(0.2)
                logger.debug(f"Set text on element {index}")
                return True
            return False
        except Exception as e:
            logger.error(f"Set text error: {e}")
            return False

    def back_sync(self) -> bool:
        """Sync press back button"""
        return self._global_action_sync("back")

    def home_sync(self) -> bool:
        """Sync press home button"""
        return self._global_action_sync("home")

    def scroll_element_sync(self, index: int, direction: str = "down") -> bool:
        """Sync scroll element"""
        if not self._ensure_accessibility_service():
            return False

        direction_map = {"down": "forward", "up": "backward"}
        normalized = direction_map.get(direction.lower(), direction.lower())

        try:
            response = requests.post(
                f"{self.tcp_base_url}/action/scroll",
                json={"index": index, "direction": normalized},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 200:
                time.sleep(0.3)
                logger.debug(f"Scroll element {index} {direction}")
                return True
            return False
        except Exception as e:
            logger.error(f"Scroll error: {e}")
            return False

    def long_click_sync(self, index: int) -> bool:
        """Sync long click on element"""
        if not self._ensure_accessibility_service():
            return False

        try:
            response = requests.post(
                f"{self.tcp_base_url}/action/longclick",
                json={"index": index},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 200:
                time.sleep(0.5)
                logger.debug(f"Long click element {index}")
                return True
            return False
        except Exception as e:
            logger.error(f"Long click error: {e}")
            return False

    def swipe_sync(
        self,
        start_x: int,
        start_y: int,
        end_x: int,
        end_y: int,
        duration_ms: int = 300
    ) -> bool:
        """
        Sync swipe gesture using ADB (Portal often fails for swipe)

        Args:
            start_x, start_y: Start coordinates
            end_x, end_y: End coordinates
            duration_ms: Duration in milliseconds

        Returns:
            True if successful
        """
        try:
            self.device.shell(f"input swipe {start_x} {start_y} {end_x} {end_y} {duration_ms}")
            time.sleep(0.3)
            logger.debug(f"Swipe from ({start_x}, {start_y}) to ({end_x}, {end_y})")
            return True
        except Exception as e:
            logger.error(f"Swipe error: {e}")
            return False

    def scroll_up(self) -> bool:
        """
        Scroll up on screen using ADB swipe (content moves down)

        Returns:
            True if successful
        """
        try:
            # Swipe from bottom to top - content scrolls up (shows higher content)
            self.device.shell("input swipe 540 800 540 1500 300")
            time.sleep(0.3)
            logger.debug("Scroll up")
            return True
        except Exception as e:
            logger.error(f"Scroll up error: {e}")
            return False

    def scroll_down(self) -> bool:
        """
        Scroll down on screen using ADB swipe (content moves up)

        Returns:
            True if successful
        """
        try:
            # Swipe from top to bottom - content scrolls down (shows lower content)
            self.device.shell("input swipe 540 1500 540 800 300")
            time.sleep(0.3)
            logger.debug("Scroll down")
            return True
        except Exception as e:
            logger.error(f"Scroll down error: {e}")
            return False

    def _global_action_sync(self, action: str) -> bool:
        """Sync global action"""
        if not self._ensure_accessibility_service():
            return False

        try:
            response = requests.post(
                f"{self.tcp_base_url}/action/global",
                json={"action": action},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 200:
                time.sleep(0.3)
                logger.debug(f"Global action: {action}")
                return True
            return False
        except Exception as e:
            logger.error(f"Global action error: {e}")
            return False

    def take_screenshot_sync(self) -> Optional[bytes]:
        """Sync take screenshot using ADB"""
        try:
            # Use ADB screenshot - returns PIL Image
            img = self.device.screenshot()

            # Convert PIL Image to PNG bytes
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            screenshot_bytes = buffer.getvalue()

            if screenshot_bytes and len(screenshot_bytes) > 100:
                return screenshot_bytes
            return None
        except Exception as e:
            logger.error(f"Screenshot failed: {e}")
            return None

    def save_screenshot(self, path: str) -> bool:
        """Take and save screenshot to file"""
        img_bytes = self.take_screenshot_sync()
        if img_bytes:
            os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
            with open(path, 'wb') as f:
                f.write(img_bytes)
            logger.debug(f"Screenshot saved: {path}")
            return True
        return False

    def start_app_sync(self, package: str, activity: str = None) -> bool:
        """Sync start app via Accessibility Service"""
        if not self._ensure_accessibility_service():
            return False

        try:
            payload = {"package": package}
            if activity:
                payload["activity"] = activity

            response = requests.post(
                f"{self.tcp_base_url}/app/start",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 200:
                time.sleep(1)
                logger.debug(f"Start app: {package}")
                return True
            return False
        except Exception as e:
            logger.error(f"Start app failed: {e}")
            return False

    # ========================================================================
    # INTERNAL METHODS
    # ========================================================================

    def _fetch_state(self) -> Dict:
        """Fetch raw state from device via TCP"""
        if not self.use_tcp or not self.tcp_forwarded:
            return {"error": True, "message": "TCP not available"}

        try:
            response = requests.get(f"{self.tcp_base_url}/state", timeout=10)

            if response.status_code == 200:
                tcp_response = response.json()

                if "data" in tcp_response:
                    data_str = tcp_response["data"]
                    return json.loads(data_str)
                else:
                    return tcp_response
            else:
                return {"error": True, "message": f"HTTP {response.status_code}"}

        except Exception as e:
            return {"error": True, "message": str(e)}

    def _parse_elements(self, a11y_tree: List[Dict]) -> List[UIElement]:
        """Parse accessibility tree to list of UIElement"""
        elements = []

        def parse_recursive(items: List[Dict]) -> List[UIElement]:
            result = []
            for item in items:
                element = self._parse_single_element(item)
                if element:
                    result.append(element)
            return result

        return parse_recursive(a11y_tree)

    def _parse_single_element(self, item: Dict) -> Optional[UIElement]:
        """Parse single element from a11y tree"""
        try:
            bounds_str = item.get("bounds", "0,0,0,0")
            try:
                left, top, right, bottom = map(int, bounds_str.split(","))
            except:
                left, top, right, bottom = 0, 0, 0, 0

            center_x = (left + right) // 2
            center_y = (top + bottom) // 2
            width = right - left
            height = bottom - top

            children = []
            if "children" in item:
                for child in item["children"]:
                    child_elem = self._parse_single_element(child)
                    if child_elem:
                        children.append(child_elem)

            return UIElement(
                index=item.get("index", -1),
                text=item.get("text", ""),
                class_name=item.get("className", ""),
                bounds=bounds_str,
                center_x=center_x,
                center_y=center_y,
                width=width,
                height=height,
                clickable=item.get("clickable", False),
                focusable=item.get("focusable", False),
                children=children,
                raw_data=item
            )

        except Exception as e:
            logger.error(f"Parse element failed: {e}")
            return None

    # ========================================================================
    # ELEMENT FINDING
    # ========================================================================

    def find_element_by_index(self, index: int) -> Optional[UIElement]:
        """Find element by index"""
        def search_recursive(elements: List[UIElement]) -> Optional[UIElement]:
            for elem in elements:
                if elem.index == index:
                    return elem
                found = search_recursive(elem.children)
                if found:
                    return found
            return None

        return search_recursive(self._element_cache)

    def find_elements_by_text(
        self,
        text: str,
        exact: bool = False
    ) -> List[UIElement]:
        """Find elements containing text"""
        results = []

        def search_recursive(elements: List[UIElement]):
            for elem in elements:
                if exact:
                    if elem.text == text:
                        results.append(elem)
                else:
                    if text.lower() in elem.text.lower():
                        results.append(elem)
                search_recursive(elem.children)

        search_recursive(self._element_cache)
        return results

    def find_elements_by_class(self, class_name: str) -> List[UIElement]:
        """Find elements by class name"""
        results = []

        def search_recursive(elements: List[UIElement]):
            for elem in elements:
                if class_name.lower() in elem.class_name.lower():
                    results.append(elem)
                search_recursive(elem.children)

        search_recursive(self._element_cache)
        return results

    def find_clickable_elements(self) -> List[UIElement]:
        """Find all clickable elements"""
        results = []

        def search_recursive(elements: List[UIElement]):
            for elem in elements:
                if elem.clickable:
                    results.append(elem)
                search_recursive(elem.children)

        search_recursive(self._element_cache)
        return results

    # ========================================================================
    # UTILITIES
    # ========================================================================

    def get_current_app(self) -> str:
        """Get current foreground app package"""
        if self._last_state:
            return self._last_state.phone_state.current_app
        state = self.get_state_sync()
        return state.phone_state.current_app

    def is_app_open(self, package: str) -> bool:
        """Check if app is in foreground"""
        return self.get_current_app() == package

    def format_state_for_llm(self) -> str:
        """Format current state for LLM consumption"""
        state = self._last_state or self.get_state_sync()

        lines = [
            f"Current App: {state.phone_state.current_app}",
            f"Screen: {state.phone_state.screen_width}x{state.phone_state.screen_height}",
            f"Orientation: {state.phone_state.orientation}",
            "",
            "UI Elements:",
        ]

        def format_element(elem: UIElement, indent: int = 0) -> str:
            prefix = "  " * indent
            text = elem.text[:50] + "..." if len(elem.text) > 50 else elem.text
            return (
                f"{prefix}[{elem.index}] {elem.class_name.split('.')[-1]}"
                f"{f': \"{text}\"' if text else ''}"
                f" {'[clickable]' if elem.clickable else ''}"
            )

        def add_elements(elements: List[UIElement], indent: int = 0):
            for elem in elements:
                lines.append(format_element(elem, indent))
                if elem.children:
                    add_elements(elem.children, indent + 1)

        add_elements(state.elements)

        return "\n".join(lines)
