"""Screen service for managing device screen capture and mirroring."""

import asyncio
import subprocess
import tempfile
import os
import platform
import sys
from typing import Dict, Optional, List, Callable
from pathlib import Path


class ScreenService:
    """Service for screen capture and scrcpy integration."""

    def __init__(self):
        self.scrcpy_processes: Dict[str, subprocess.Popen] = {}
        self.screenshot_cache: Dict[str, str] = {}  # device_serial -> image path
        self._scrcpy_path: Optional[str] = None
        self._installing = False

    def check_scrcpy_installed(self) -> bool:
        """Check if scrcpy is installed and available."""
        try:
            result = subprocess.run(
                ["scrcpy", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                self._scrcpy_path = "scrcpy"
                return True
        except (FileNotFoundError, subprocess.TimeoutExpired):
            pass

        # Try common installation paths on macOS
        common_paths = [
            "/opt/homebrew/bin/scrcpy",
            "/usr/local/bin/scrcpy",
            os.path.expanduser("~/bin/scrcpy"),
        ]

        for path in common_paths:
            if os.path.exists(path):
                self._scrcpy_path = path
                return True

        return False

    def get_scrcpy_version(self) -> Optional[str]:
        """Get scrcpy version string."""
        if not self._scrcpy_path:
            if not self.check_scrcpy_installed():
                return None

        try:
            result = subprocess.run(
                [self._scrcpy_path, "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            # Get first line and clean it
            first_line = result.stdout.strip().split('\n')[0]
            return first_line
        except Exception:
            return None

    async def install_scrcpy(self, progress_callback: Callable[[str], None] = None) -> bool:
        """Install scrcpy automatically based on platform."""
        if self._installing:
            return False

        self._installing = True
        system = platform.system()

        try:
            if system == "Darwin":  # macOS
                return await self._install_macos(progress_callback)
            elif system == "Linux":
                return await self._install_linux(progress_callback)
            elif system == "Windows":
                return await self._install_windows(progress_callback)
            else:
                if progress_callback:
                    progress_callback(f"Unsupported platform: {system}")
                return False
        finally:
            self._installing = False

    async def _install_macos(self, progress_callback: Callable[[str], None] = None) -> bool:
        """Install scrcpy on macOS using Homebrew."""
        # Check if Homebrew is installed
        try:
            proc = await asyncio.create_subprocess_exec(
                "brew", "--version",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            await proc.communicate()

            if proc.returncode != 0:
                if progress_callback:
                    progress_callback("Homebrew not found. Installing Homebrew first...")

                # Install Homebrew
                install_cmd = '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
                proc = await asyncio.create_subprocess_shell(
                    install_cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                await proc.communicate()

        except FileNotFoundError:
            if progress_callback:
                progress_callback("Installing Homebrew...")

        # Install scrcpy using Homebrew
        if progress_callback:
            progress_callback("Installing scrcpy via Homebrew...")

        proc = await asyncio.create_subprocess_exec(
            "brew", "install", "scrcpy",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()

        if proc.returncode == 0:
            if progress_callback:
                progress_callback("scrcpy installed successfully!")
            self.check_scrcpy_installed()
            return True
        else:
            if progress_callback:
                progress_callback(f"Installation failed: {stderr.decode()[:100]}")
            return False

    async def _install_linux(self, progress_callback: Callable[[str], None] = None) -> bool:
        """Install scrcpy on Linux."""
        if progress_callback:
            progress_callback("Installing scrcpy via apt/snap...")

        # Try snap first
        proc = await asyncio.create_subprocess_exec(
            "snap", "install", "scrcpy",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()

        if proc.returncode == 0:
            if progress_callback:
                progress_callback("scrcpy installed successfully!")
            self.check_scrcpy_installed()
            return True

        # Try apt
        proc = await asyncio.create_subprocess_exec(
            "sudo", "apt", "install", "-y", "scrcpy",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()

        if proc.returncode == 0:
            if progress_callback:
                progress_callback("scrcpy installed successfully!")
            self.check_scrcpy_installed()
            return True

        if progress_callback:
            progress_callback("Installation failed. Please install manually.")
        return False

    async def _install_windows(self, progress_callback: Callable[[str], None] = None) -> bool:
        """Install scrcpy on Windows using winget or chocolatey."""
        if progress_callback:
            progress_callback("Installing scrcpy via winget...")

        # Try winget first
        proc = await asyncio.create_subprocess_exec(
            "winget", "install", "Genymobile.scrcpy",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()

        if proc.returncode == 0:
            if progress_callback:
                progress_callback("scrcpy installed successfully!")
            self.check_scrcpy_installed()
            return True

        # Try chocolatey
        if progress_callback:
            progress_callback("Trying Chocolatey...")

        proc = await asyncio.create_subprocess_exec(
            "choco", "install", "scrcpy", "-y",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()

        if proc.returncode == 0:
            if progress_callback:
                progress_callback("scrcpy installed successfully!")
            self.check_scrcpy_installed()
            return True

        if progress_callback:
            progress_callback("Installation failed. Please install manually from https://github.com/Genymobile/scrcpy")
        return False

    def start_scrcpy(
        self,
        device_serial: str,
        title: str = None,
        max_size: int = 1024,
        bit_rate: str = "8M",
        max_fps: int = 30,
        window_x: int = None,
        window_y: int = None,
        window_width: int = None,
        window_height: int = None,
        always_on_top: bool = False,
        stay_awake: bool = True,
        show_touches: bool = False,
        turn_screen_off: bool = False,
        no_audio: bool = True,
    ) -> bool:
        """Start scrcpy for a specific device."""
        if not self._scrcpy_path:
            if not self.check_scrcpy_installed():
                return False

        # Kill existing process for this device if any
        self.stop_scrcpy(device_serial)

        cmd = [self._scrcpy_path]

        # Device selection
        cmd.extend(["-s", device_serial])

        # Window title
        if title:
            cmd.extend(["--window-title", title])

        # Quality settings
        cmd.extend(["--max-size", str(max_size)])
        cmd.extend(["--video-bit-rate", bit_rate])
        cmd.extend(["--max-fps", str(max_fps)])

        # Window position and size
        if window_x is not None:
            cmd.extend(["--window-x", str(window_x)])
        if window_y is not None:
            cmd.extend(["--window-y", str(window_y)])
        if window_width is not None:
            cmd.extend(["--window-width", str(window_width)])
        if window_height is not None:
            cmd.extend(["--window-height", str(window_height)])

        # Options
        if always_on_top:
            cmd.append("--always-on-top")
        if stay_awake:
            cmd.append("--stay-awake")
        if show_touches:
            cmd.append("--show-touches")
        if turn_screen_off:
            cmd.append("--turn-screen-off")
        if no_audio:
            cmd.append("--no-audio")

        try:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            self.scrcpy_processes[device_serial] = process
            return True
        except Exception as e:
            print(f"Failed to start scrcpy: {e}")
            return False

    def stop_scrcpy(self, device_serial: str) -> bool:
        """Stop scrcpy for a specific device."""
        process = self.scrcpy_processes.get(device_serial)
        if process:
            try:
                process.terminate()
                process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                process.kill()
            except Exception:
                pass
            del self.scrcpy_processes[device_serial]
            return True
        return False

    def stop_all_scrcpy(self):
        """Stop all running scrcpy processes."""
        for serial in list(self.scrcpy_processes.keys()):
            self.stop_scrcpy(serial)

    def is_scrcpy_running(self, device_serial: str) -> bool:
        """Check if scrcpy is running for a device."""
        process = self.scrcpy_processes.get(device_serial)
        if process:
            return process.poll() is None
        return False

    def get_running_devices(self) -> List[str]:
        """Get list of devices with running scrcpy."""
        return [
            serial for serial, process in self.scrcpy_processes.items()
            if process.poll() is None
        ]

    async def take_screenshot(self, device_serial: str) -> Optional[str]:
        """Take a screenshot from device using ADB."""
        try:
            # Create temp file for screenshot
            temp_dir = tempfile.gettempdir()
            screenshot_path = os.path.join(temp_dir, f"screenshot_{device_serial.replace(':', '_')}.png")

            # Take screenshot on device
            proc = await asyncio.create_subprocess_exec(
                "adb", "-s", device_serial, "exec-out", "screencap", "-p",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=10)

            if proc.returncode == 0 and stdout:
                # Save to file
                with open(screenshot_path, 'wb') as f:
                    f.write(stdout)
                self.screenshot_cache[device_serial] = screenshot_path
                return screenshot_path

            return None
        except Exception as e:
            print(f"Screenshot failed: {e}")
            return None

    def get_cached_screenshot(self, device_serial: str) -> Optional[str]:
        """Get cached screenshot path for a device."""
        path = self.screenshot_cache.get(device_serial)
        if path and os.path.exists(path):
            return path
        return None

    def start_multi_view(
        self,
        devices: List[dict],
        screen_width: int = 1920,
        screen_height: int = 1080,
        columns: int = 2,
        window_size: int = 480,
        gap: int = 10,
    ):
        """Start scrcpy for multiple devices in a grid layout."""
        if not devices:
            return

        # Calculate window positions
        start_x = 50
        start_y = 50

        for i, device in enumerate(devices):
            serial = device.get("adb_serial", "")
            name = device.get("name", serial)

            if not serial:
                continue

            row = i // columns
            col = i % columns

            x = start_x + col * (window_size + gap)
            y = start_y + row * (window_size + gap + 50)  # +50 for title bar

            self.start_scrcpy(
                device_serial=serial,
                title=name,
                max_size=window_size,
                window_x=x,
                window_y=y,
                window_width=window_size,
                always_on_top=False,
                no_audio=True,
            )


# Global instance
screen_service = ScreenService()
