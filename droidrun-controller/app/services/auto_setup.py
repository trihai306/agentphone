"""Auto-Setup Service for DroidRun Controller.

Professional dependency installer that automatically downloads and installs:
- scrcpy (screen mirroring)
- ADB (Android Debug Bridge)
- FFmpeg (optional, for video processing)

Designed for bundled EXE distribution with first-run setup wizard.
"""

import asyncio
import hashlib
import os
import platform
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path
from typing import Optional, Callable, Dict, List
from dataclasses import dataclass
from enum import Enum
import urllib.request
import json


class DependencyStatus(Enum):
    """Status of a dependency."""
    NOT_INSTALLED = "not_installed"
    INSTALLING = "installing"
    INSTALLED = "installed"
    FAILED = "failed"
    OUTDATED = "outdated"


@dataclass
class DependencyInfo:
    """Information about a dependency."""
    name: str
    display_name: str
    description: str
    required: bool
    status: DependencyStatus = DependencyStatus.NOT_INSTALLED
    version: Optional[str] = None
    path: Optional[str] = None


class AutoSetupService:
    """Professional auto-setup service for DroidRun Controller.
    
    Features:
    - Automatic dependency detection
    - Download and install scrcpy, ADB, FFmpeg
    - Cross-platform support (Windows, macOS, Linux)
    - Progress callbacks for UI integration
    - Bundled binary support for EXE distribution
    """
    
    # App data directory
    APP_NAME = "DroidRun"
    
    # Download URLs for each platform
    SCRCPY_URLS = {
        "Windows": "https://github.com/Genymobile/scrcpy/releases/download/v3.3.1/scrcpy-win64-v3.3.1.zip",
        "Darwin": "https://github.com/Genymobile/scrcpy/releases/latest",  # Use Homebrew
        "Linux": "https://github.com/Genymobile/scrcpy/releases/latest",  # Use apt/snap
    }
    
    ADB_URLS = {
        "Windows": "https://dl.google.com/android/repository/platform-tools-latest-windows.zip",
        "Darwin": "https://dl.google.com/android/repository/platform-tools-latest-darwin.zip",
        "Linux": "https://dl.google.com/android/repository/platform-tools-latest-linux.zip",
    }
    
    def __init__(self):
        self.system = platform.system()
        self._app_dir = self._get_app_directory()
        self._bin_dir = self._app_dir / "bin"
        self._temp_dir = self._app_dir / "temp"
        self._dependencies: Dict[str, DependencyInfo] = {}
        self._setup_complete = False
        
        # Ensure directories exist
        self._bin_dir.mkdir(parents=True, exist_ok=True)
        self._temp_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize dependency info
        self._init_dependencies()
    
    def _get_app_directory(self) -> Path:
        """Get the application data directory."""
        if self.system == "Windows":
            base = Path(os.environ.get("LOCALAPPDATA", os.path.expanduser("~")))
        elif self.system == "Darwin":
            base = Path.home() / "Library" / "Application Support"
        else:
            base = Path.home() / ".local" / "share"
        
        return base / self.APP_NAME
    
    def _init_dependencies(self):
        """Initialize dependency information."""
        self._dependencies = {
            "scrcpy": DependencyInfo(
                name="scrcpy",
                display_name="scrcpy",
                description="Android screen mirroring and control",
                required=True,
            ),
            "adb": DependencyInfo(
                name="adb",
                display_name="Android Debug Bridge (ADB)",
                description="Required for device communication",
                required=True,
            ),
            "nodejs": DependencyInfo(
                name="nodejs",
                display_name="Node.js",
                description="Required for video streaming server",
                required=True,
            ),
            "ws_scrcpy": DependencyInfo(
                name="ws_scrcpy",
                display_name="ws-scrcpy Server",
                description="Real-time video streaming to browser/WebView",
                required=True,
            ),
            "ffmpeg": DependencyInfo(
                name="ffmpeg",
                display_name="FFmpeg",
                description="Video processing (optional)",
                required=False,
            ),
        }
    
    @property
    def app_directory(self) -> Path:
        """Get the application data directory."""
        return self._app_dir
    
    @property
    def bin_directory(self) -> Path:
        """Get the binary directory."""
        return self._bin_dir
    
    @property
    def is_setup_required(self) -> bool:
        """Check if setup is required."""
        return not self._check_all_required_installed()
    
    def _check_all_required_installed(self) -> bool:
        """Check if all required dependencies are installed."""
        self.check_dependencies()
        return all(
            dep.status == DependencyStatus.INSTALLED
            for dep in self._dependencies.values()
            if dep.required
        )
    
    def get_dependencies(self) -> Dict[str, DependencyInfo]:
        """Get all dependencies with current status."""
        return self._dependencies.copy()
    
    def check_dependencies(self):
        """Check status of all dependencies."""
        self._check_scrcpy()
        self._check_adb()
        self._check_nodejs()
        self._check_ws_scrcpy()
        self._check_ffmpeg()
    
    def _check_scrcpy(self):
        """Check if scrcpy is installed."""
        dep = self._dependencies["scrcpy"]
        
        # Check bundled first
        bundled_path = self._bin_dir / ("scrcpy.exe" if self.system == "Windows" else "scrcpy")
        if bundled_path.exists():
            dep.status = DependencyStatus.INSTALLED
            dep.path = str(bundled_path)
            dep.version = self._get_scrcpy_version(str(bundled_path))
            return
        
        # Check system PATH
        try:
            result = subprocess.run(
                ["scrcpy", "--version"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            if result.returncode == 0:
                dep.status = DependencyStatus.INSTALLED
                dep.path = shutil.which("scrcpy")
                dep.version = result.stdout.strip().split('\n')[0]
                return
        except (FileNotFoundError, subprocess.TimeoutExpired):
            pass
        
        # Check common paths
        common_paths = []
        if self.system == "Darwin":
            common_paths = [
                "/opt/homebrew/bin/scrcpy",
                "/usr/local/bin/scrcpy",
            ]
        elif self.system == "Linux":
            common_paths = [
                "/usr/bin/scrcpy",
                "/snap/bin/scrcpy",
            ]
        
        for path in common_paths:
            if os.path.exists(path):
                dep.status = DependencyStatus.INSTALLED
                dep.path = path
                dep.version = self._get_scrcpy_version(path)
                return
        
        dep.status = DependencyStatus.NOT_INSTALLED
    
    def _get_scrcpy_version(self, path: str) -> Optional[str]:
        """Get scrcpy version."""
        try:
            result = subprocess.run(
                [path, "--version"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            return result.stdout.strip().split('\n')[0] if result.returncode == 0 else None
        except Exception:
            return None
    
    def _check_adb(self):
        """Check if ADB is installed."""
        dep = self._dependencies["adb"]
        
        # Check bundled first
        bundled_path = self._bin_dir / "platform-tools" / ("adb.exe" if self.system == "Windows" else "adb")
        if bundled_path.exists():
            dep.status = DependencyStatus.INSTALLED
            dep.path = str(bundled_path)
            dep.version = self._get_adb_version(str(bundled_path))
            return
        
        # Check system PATH
        try:
            result = subprocess.run(
                ["adb", "version"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            if result.returncode == 0:
                dep.status = DependencyStatus.INSTALLED
                dep.path = shutil.which("adb")
                lines = result.stdout.strip().split('\n')
                dep.version = lines[0] if lines else None
                return
        except (FileNotFoundError, subprocess.TimeoutExpired):
            pass
        
        dep.status = DependencyStatus.NOT_INSTALLED
    
    def _get_adb_version(self, path: str) -> Optional[str]:
        """Get ADB version."""
        try:
            result = subprocess.run(
                [path, "version"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                return lines[0] if lines else None
            return None
        except Exception:
            return None
    
    def _check_ffmpeg(self):
        """Check if FFmpeg is installed."""
        dep = self._dependencies["ffmpeg"]
        
        try:
            result = subprocess.run(
                ["ffmpeg", "-version"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            if result.returncode == 0:
                dep.status = DependencyStatus.INSTALLED
                dep.path = shutil.which("ffmpeg")
                lines = result.stdout.strip().split('\n')
                dep.version = lines[0] if lines else None
                return
        except (FileNotFoundError, subprocess.TimeoutExpired):
            pass
        
        dep.status = DependencyStatus.NOT_INSTALLED
    
    def _check_nodejs(self):
        """Check if Node.js is installed."""
        dep = self._dependencies["nodejs"]
        
        try:
            result = subprocess.run(
                ["node", "--version"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            if result.returncode == 0:
                version = result.stdout.strip()
                dep.status = DependencyStatus.INSTALLED
                dep.path = shutil.which("node")
                dep.version = version
                
                # Check version compatibility (need v18-v20 for ws-scrcpy)
                ver_num = version.replace("v", "").split(".")[0]
                if ver_num.isdigit():
                    ver_int = int(ver_num)
                    if ver_int < 18 or ver_int > 20:
                        # Mark as outdated if not compatible
                        dep.status = DependencyStatus.OUTDATED
                        dep.description = f"Version {version} not compatible. Need v18-v20"
                return
        except (FileNotFoundError, subprocess.TimeoutExpired):
            pass
        
        dep.status = DependencyStatus.NOT_INSTALLED
    
    def _check_ws_scrcpy(self):
        """Check if ws-scrcpy is installed."""
        dep = self._dependencies["ws_scrcpy"]
        
        # Check in app data directory
        ws_scrcpy_dir = self._app_dir / "ws-scrcpy"
        node_modules = ws_scrcpy_dir / "node_modules"
        
        if node_modules.exists():
            dep.status = DependencyStatus.INSTALLED
            dep.path = str(ws_scrcpy_dir)
            return
        
        # Check in project directory
        project_ws_scrcpy = Path(__file__).parent.parent.parent / "ws-scrcpy-server"
        if (project_ws_scrcpy / "node_modules").exists():
            dep.status = DependencyStatus.INSTALLED
            dep.path = str(project_ws_scrcpy)
            return
        
        dep.status = DependencyStatus.NOT_INSTALLED
    
    async def install_all(
        self,
        progress_callback: Optional[Callable[[str, float], None]] = None,
        include_optional: bool = False,
    ) -> bool:
        """Install all dependencies.
        
        Args:
            progress_callback: Callback with (message, progress 0-1)
            include_optional: Include optional dependencies
            
        Returns:
            True if all required dependencies installed successfully
        """
        self.check_dependencies()
        
        to_install = [
            (name, dep) for name, dep in self._dependencies.items()
            if dep.status != DependencyStatus.INSTALLED
            and (dep.required or include_optional)
        ]
        
        if not to_install:
            if progress_callback:
                progress_callback("All dependencies already installed!", 1.0)
            return True
        
        total = len(to_install)
        success = True
        
        for idx, (name, dep) in enumerate(to_install):
            base_progress = idx / total
            
            if progress_callback:
                progress_callback(f"Installing {dep.display_name}...", base_progress)
            
            dep.status = DependencyStatus.INSTALLING
            
            try:
                if name == "scrcpy":
                    result = await self._install_scrcpy(
                        lambda msg, p: progress_callback(msg, base_progress + p / total) if progress_callback else None
                    )
                elif name == "adb":
                    result = await self._install_adb(
                        lambda msg, p: progress_callback(msg, base_progress + p / total) if progress_callback else None
                    )
                elif name == "nodejs":
                    result = await self._install_nodejs(
                        lambda msg, p: progress_callback(msg, base_progress + p / total) if progress_callback else None
                    )
                elif name == "ws_scrcpy":
                    result = await self._install_ws_scrcpy(
                        lambda msg, p: progress_callback(msg, base_progress + p / total) if progress_callback else None
                    )
                elif name == "ffmpeg":
                    result = await self._install_ffmpeg(
                        lambda msg, p: progress_callback(msg, base_progress + p / total) if progress_callback else None
                    )
                else:
                    result = False
                
                if result:
                    dep.status = DependencyStatus.INSTALLED
                else:
                    dep.status = DependencyStatus.FAILED
                    if dep.required:
                        success = False
                        
            except Exception as e:
                print(f"Error installing {name}: {e}")
                dep.status = DependencyStatus.FAILED
                if dep.required:
                    success = False
        
        if progress_callback:
            progress_callback("Setup complete!" if success else "Setup failed!", 1.0)
        
        self._setup_complete = success
        return success
    
    async def _install_scrcpy(
        self,
        progress_callback: Optional[Callable[[str, float], None]] = None,
    ) -> bool:
        """Install scrcpy."""
        if self.system == "Windows":
            return await self._install_scrcpy_windows(progress_callback)
        elif self.system == "Darwin":
            return await self._install_scrcpy_macos(progress_callback)
        elif self.system == "Linux":
            return await self._install_scrcpy_linux(progress_callback)
        return False
    
    async def _install_scrcpy_windows(
        self,
        progress_callback: Optional[Callable[[str, float], None]] = None,
    ) -> bool:
        """Install scrcpy on Windows by downloading portable version."""
        url = self.SCRCPY_URLS["Windows"]
        zip_path = self._temp_dir / "scrcpy.zip"
        
        try:
            # Download
            if progress_callback:
                progress_callback("Downloading scrcpy...", 0.1)
            
            await self._download_file(url, zip_path, progress_callback)
            
            # Extract
            if progress_callback:
                progress_callback("Extracting scrcpy...", 0.7)
            
            with zipfile.ZipFile(zip_path, 'r') as zf:
                # Extract to temp first
                extract_dir = self._temp_dir / "scrcpy_extract"
                zf.extractall(extract_dir)
                
                # Find the scrcpy directory (it's usually named like scrcpy-win64-vX.X.X)
                for item in extract_dir.iterdir():
                    if item.is_dir() and "scrcpy" in item.name:
                        # Copy scrcpy files to bin directory
                        for file in item.iterdir():
                            dest = self._bin_dir / file.name
                            if file.is_file():
                                shutil.copy2(file, dest)
                        break
                
                # Cleanup
                shutil.rmtree(extract_dir, ignore_errors=True)
            
            # Cleanup zip
            zip_path.unlink(missing_ok=True)
            
            # Verify
            scrcpy_path = self._bin_dir / "scrcpy.exe"
            if scrcpy_path.exists():
                self._dependencies["scrcpy"].path = str(scrcpy_path)
                if progress_callback:
                    progress_callback("scrcpy installed successfully!", 1.0)
                return True
            
            return False
            
        except Exception as e:
            print(f"Error installing scrcpy: {e}")
            return False
    
    async def _install_scrcpy_macos(
        self,
        progress_callback: Optional[Callable[[str, float], None]] = None,
    ) -> bool:
        """Install scrcpy on macOS using Homebrew."""
        if progress_callback:
            progress_callback("Installing scrcpy via Homebrew...", 0.1)
        
        try:
            proc = await asyncio.create_subprocess_exec(
                "brew", "install", "scrcpy",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await proc.communicate()
            
            if proc.returncode == 0:
                if progress_callback:
                    progress_callback("scrcpy installed successfully!", 1.0)
                self._check_scrcpy()
                return self._dependencies["scrcpy"].status == DependencyStatus.INSTALLED
            else:
                if progress_callback:
                    progress_callback(f"Failed: {stderr.decode()[:100]}", 1.0)
                return False
                
        except Exception as e:
            if progress_callback:
                progress_callback(f"Error: {e}", 1.0)
            return False
    
    async def _install_scrcpy_linux(
        self,
        progress_callback: Optional[Callable[[str, float], None]] = None,
    ) -> bool:
        """Install scrcpy on Linux using snap or apt."""
        if progress_callback:
            progress_callback("Installing scrcpy via snap...", 0.1)
        
        try:
            # Try snap first
            proc = await asyncio.create_subprocess_exec(
                "snap", "install", "scrcpy",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await proc.communicate()
            
            if proc.returncode == 0:
                if progress_callback:
                    progress_callback("scrcpy installed successfully!", 1.0)
                self._check_scrcpy()
                return True
        except FileNotFoundError:
            pass
        
        # Try apt
        try:
            if progress_callback:
                progress_callback("Installing scrcpy via apt...", 0.3)
            
            proc = await asyncio.create_subprocess_exec(
                "sudo", "apt", "install", "-y", "scrcpy",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await proc.communicate()
            
            if proc.returncode == 0:
                if progress_callback:
                    progress_callback("scrcpy installed successfully!", 1.0)
                self._check_scrcpy()
                return True
        except Exception:
            pass
        
        if progress_callback:
            progress_callback("Failed to install scrcpy", 1.0)
        return False
    
    async def _install_adb(
        self,
        progress_callback: Optional[Callable[[str, float], None]] = None,
    ) -> bool:
        """Install ADB (Android Platform Tools)."""
        url = self.ADB_URLS.get(self.system)
        if not url:
            return False
        
        zip_path = self._temp_dir / "platform-tools.zip"
        
        try:
            # Download
            if progress_callback:
                progress_callback("Downloading ADB...", 0.1)
            
            await self._download_file(url, zip_path, progress_callback)
            
            # Extract
            if progress_callback:
                progress_callback("Extracting ADB...", 0.7)
            
            with zipfile.ZipFile(zip_path, 'r') as zf:
                zf.extractall(self._bin_dir)
            
            # Cleanup
            zip_path.unlink(missing_ok=True)
            
            # Set permissions on Unix
            if self.system != "Windows":
                adb_path = self._bin_dir / "platform-tools" / "adb"
                if adb_path.exists():
                    os.chmod(adb_path, 0o755)
            
            # Verify
            adb_path = self._bin_dir / "platform-tools" / ("adb.exe" if self.system == "Windows" else "adb")
            if adb_path.exists():
                self._dependencies["adb"].path = str(adb_path)
                if progress_callback:
                    progress_callback("ADB installed successfully!", 1.0)
                return True
            
            return False
            
        except Exception as e:
            print(f"Error installing ADB: {e}")
            return False
    
    async def _install_ffmpeg(
        self,
        progress_callback: Optional[Callable[[str, float], None]] = None,
    ) -> bool:
        """Install FFmpeg."""
        if self.system == "Darwin":
            if progress_callback:
                progress_callback("Installing FFmpeg via Homebrew...", 0.1)
            
            try:
                proc = await asyncio.create_subprocess_exec(
                    "brew", "install", "ffmpeg",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                await proc.communicate()
                
                if proc.returncode == 0:
                    if progress_callback:
                        progress_callback("FFmpeg installed successfully!", 1.0)
                    self._check_ffmpeg()
                    return True
            except Exception:
                pass
        
        elif self.system == "Linux":
            if progress_callback:
                progress_callback("Installing FFmpeg via apt...", 0.1)
            
            try:
                proc = await asyncio.create_subprocess_exec(
                    "sudo", "apt", "install", "-y", "ffmpeg",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                await proc.communicate()
                
                if proc.returncode == 0:
                    if progress_callback:
                        progress_callback("FFmpeg installed successfully!", 1.0)
                    self._check_ffmpeg()
                    return True
            except Exception:
                pass
        
        elif self.system == "Windows":
            # For Windows, direct user to download or use bundled version
            if progress_callback:
                progress_callback("Please install FFmpeg manually on Windows", 1.0)
        
        return False
    
    async def _install_nodejs(
        self,
        progress_callback: Optional[Callable[[str, float], None]] = None,
    ) -> bool:
        """Install Node.js v20 LTS (compatible with ws-scrcpy)."""
        if progress_callback:
            progress_callback("Checking Node.js installation...", 0.1)
        
        # First check if already installed with correct version
        self._check_nodejs()
        if self._dependencies["nodejs"].status == DependencyStatus.INSTALLED:
            if progress_callback:
                progress_callback("Node.js already installed!", 1.0)
            return True
        
        if self.system == "Darwin":
            # macOS: Use Homebrew
            if progress_callback:
                progress_callback("Installing Node.js v20 via Homebrew...", 0.2)
            
            try:
                proc = await asyncio.create_subprocess_exec(
                    "brew", "install", "node@20",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                await proc.communicate()
                
                if proc.returncode == 0:
                    # Link node@20
                    proc = await asyncio.create_subprocess_exec(
                        "brew", "link", "--overwrite", "node@20",
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE,
                    )
                    await proc.communicate()
                    
                    if progress_callback:
                        progress_callback("Node.js v20 installed successfully!", 1.0)
                    self._check_nodejs()
                    return True
            except Exception as e:
                if progress_callback:
                    progress_callback(f"Error: {e}", 1.0)
        
        elif self.system == "Linux":
            # Linux: Use NodeSource
            if progress_callback:
                progress_callback("Installing Node.js v20 via apt...", 0.2)
            
            try:
                # Add NodeSource repository
                proc = await asyncio.create_subprocess_shell(
                    "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                await proc.communicate()
                
                # Install Node.js
                proc = await asyncio.create_subprocess_exec(
                    "sudo", "apt", "install", "-y", "nodejs",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                await proc.communicate()
                
                if proc.returncode == 0:
                    if progress_callback:
                        progress_callback("Node.js v20 installed successfully!", 1.0)
                    self._check_nodejs()
                    return True
            except Exception as e:
                if progress_callback:
                    progress_callback(f"Error: {e}", 1.0)
        
        elif self.system == "Windows":
            # Windows: Direct download portable Node.js
            if progress_callback:
                progress_callback("Downloading Node.js v20 for Windows...", 0.2)
            
            node_url = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip"
            zip_path = self._temp_dir / "nodejs.zip"
            
            try:
                await self._download_file(node_url, zip_path, progress_callback)
                
                if progress_callback:
                    progress_callback("Extracting Node.js...", 0.7)
                
                with zipfile.ZipFile(zip_path, 'r') as zf:
                    zf.extractall(self._bin_dir)
                
                # Add to PATH
                node_dir = self._bin_dir / "node-v20.11.0-win-x64"
                if node_dir.exists():
                    os.environ["PATH"] = f"{node_dir}{os.pathsep}{os.environ.get('PATH', '')}"
                    self._dependencies["nodejs"].path = str(node_dir / "node.exe")
                    self._dependencies["nodejs"].status = DependencyStatus.INSTALLED
                    self._dependencies["nodejs"].version = "v20.11.0"
                    
                    if progress_callback:
                        progress_callback("Node.js installed successfully!", 1.0)
                    return True
                
            except Exception as e:
                if progress_callback:
                    progress_callback(f"Error: {e}", 1.0)
            
            zip_path.unlink(missing_ok=True)
        
        if progress_callback:
            progress_callback("Failed to install Node.js. Please install manually.", 1.0)
        return False
    
    async def _install_ws_scrcpy(
        self,
        progress_callback: Optional[Callable[[str, float], None]] = None,
    ) -> bool:
        """Install ws-scrcpy server for live video streaming."""
        # Check if Node.js is available
        self._check_nodejs()
        if self._dependencies["nodejs"].status != DependencyStatus.INSTALLED:
            if progress_callback:
                progress_callback("Node.js required. Install Node.js first.", 1.0)
            return False
        
        ws_scrcpy_dir = self._app_dir / "ws-scrcpy"
        
        if progress_callback:
            progress_callback("Cloning ws-scrcpy repository...", 0.1)
        
        try:
            # Clone repository
            if not ws_scrcpy_dir.exists():
                proc = await asyncio.create_subprocess_exec(
                    "git", "clone", "--depth=1",
                    "https://github.com/nicnacnic/ws-scrcpy.git",
                    str(ws_scrcpy_dir),
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                await proc.communicate()
                
                if proc.returncode != 0:
                    if progress_callback:
                        progress_callback("Failed to clone ws-scrcpy", 1.0)
                    return False
            
            if progress_callback:
                progress_callback("Installing ws-scrcpy dependencies...", 0.4)
            
            # Install npm dependencies
            proc = await asyncio.create_subprocess_exec(
                "npm", "install", "--legacy-peer-deps",
                cwd=str(ws_scrcpy_dir),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await proc.communicate()
            
            if proc.returncode != 0:
                if progress_callback:
                    error_msg = stderr.decode()[:100] if stderr else "Unknown error"
                    progress_callback(f"npm install failed: {error_msg}", 1.0)
                return False
            
            if progress_callback:
                progress_callback("Building ws-scrcpy...", 0.7)
            
            # Build dist
            proc = await asyncio.create_subprocess_exec(
                "npm", "run", "dist",
                cwd=str(ws_scrcpy_dir),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await proc.communicate()
            
            # Check if installation was successful
            if (ws_scrcpy_dir / "node_modules").exists():
                self._dependencies["ws_scrcpy"].status = DependencyStatus.INSTALLED
                self._dependencies["ws_scrcpy"].path = str(ws_scrcpy_dir)
                
                if progress_callback:
                    progress_callback("ws-scrcpy installed successfully!", 1.0)
                return True
            
        except Exception as e:
            if progress_callback:
                progress_callback(f"Error: {e}", 1.0)
        
        return False
    
    async def _download_file(
        self,
        url: str,
        dest: Path,
        progress_callback: Optional[Callable[[str, float], None]] = None,
    ):
        """Download a file with progress."""
        def download():
            request = urllib.request.Request(
                url,
                headers={"User-Agent": "DroidRunController/1.0"}
            )
            with urllib.request.urlopen(request, timeout=60) as response:
                total_size = int(response.headers.get('content-length', 0))
                downloaded = 0
                block_size = 8192
                
                with open(dest, 'wb') as f:
                    while True:
                        data = response.read(block_size)
                        if not data:
                            break
                        f.write(data)
                        downloaded += len(data)
                        
                        if progress_callback and total_size > 0:
                            progress = 0.1 + (downloaded / total_size) * 0.5
                            progress_callback(
                                f"Downloading... {downloaded // 1024 // 1024}MB",
                                progress
                            )
        
        # Run download in thread pool
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, download)
    
    def get_scrcpy_path(self) -> Optional[str]:
        """Get the scrcpy executable path."""
        dep = self._dependencies.get("scrcpy")
        if dep and dep.status == DependencyStatus.INSTALLED:
            return dep.path
        return None
    
    def get_adb_path(self) -> Optional[str]:
        """Get the ADB executable path."""
        dep = self._dependencies.get("adb")
        if dep and dep.status == DependencyStatus.INSTALLED:
            return dep.path
        return None
    
    def add_to_path(self):
        """Add bin directory to system PATH for current process."""
        bin_path = str(self._bin_dir)
        platform_tools_path = str(self._bin_dir / "platform-tools")
        
        current_path = os.environ.get("PATH", "")
        if bin_path not in current_path:
            os.environ["PATH"] = f"{bin_path}{os.pathsep}{platform_tools_path}{os.pathsep}{current_path}"


# Global instance
auto_setup = AutoSetupService()


def check_and_setup() -> bool:
    """Quick check if setup is needed.
    
    Returns:
        True if all dependencies are installed
    """
    auto_setup.check_dependencies()
    return not auto_setup.is_setup_required
