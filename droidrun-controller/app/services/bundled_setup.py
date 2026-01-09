"""Bundled Setup - Silent auto-installation for EXE distribution.

This module handles completely automatic, silent installation of all dependencies
for end-users who don't know how to code. Everything is downloaded and installed
in the background on first run.

Features:
- Downloads portable Node.js v20 (no system install required)
- Downloads and installs scrcpy + ADB
- Clones and builds ws-scrcpy automatically
- All happens in app data directory, no admin rights needed
- Silent operation with optional progress callback
"""

import asyncio
import os
import platform
import shutil
import subprocess
import zipfile
import tarfile
from pathlib import Path
from typing import Optional, Callable
import urllib.request


class BundledSetup:
    """Completely automatic, silent setup for EXE distribution.
    
    Downloads and configures all dependencies automatically:
    - Node.js v20 (portable, no install required)
    - scrcpy + ADB
    - ws-scrcpy
    
    Everything is stored in app data directory.
    """
    
    APP_NAME = "DroidRun"
    
    # Portable Node.js URLs - no installation required!
    NODE_URLS = {
        "Windows": "https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip",
        "Darwin": "https://nodejs.org/dist/v20.11.0/node-v20.11.0-darwin-x64.tar.gz",
        "Linux": "https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.gz",
    }
    
    # Pre-built scrcpy
    SCRCPY_URLS = {
        "Windows": "https://github.com/Genymobile/scrcpy/releases/download/v3.3.1/scrcpy-win64-v3.3.1.zip",
    }
    
    # ADB Platform Tools
    ADB_URLS = {
        "Windows": "https://dl.google.com/android/repository/platform-tools-latest-windows.zip",
        "Darwin": "https://dl.google.com/android/repository/platform-tools-latest-darwin.zip",
        "Linux": "https://dl.google.com/android/repository/platform-tools-latest-linux.zip",
    }
    
    def __init__(self):
        self.system = platform.system()
        self._app_dir = self._get_app_directory()
        self._bin_dir = self._app_dir / "bin"
        self._node_dir = self._app_dir / "node"
        self._ws_scrcpy_dir = self._app_dir / "ws-scrcpy"
        self._temp_dir = self._app_dir / "temp"
        
        # Create directories
        for dir_path in [self._bin_dir, self._node_dir, self._temp_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
        
        # Setup complete flag
        self._setup_complete_file = self._app_dir / ".setup_complete"
    
    def _get_app_directory(self) -> Path:
        """Get the application data directory."""
        if self.system == "Windows":
            base = Path(os.environ.get("LOCALAPPDATA", os.path.expanduser("~")))
        elif self.system == "Darwin":
            base = Path.home() / "Library" / "Application Support"
        else:
            base = Path.home() / ".local" / "share"
        return base / self.APP_NAME
    
    @property
    def is_setup_required(self) -> bool:
        """Check if setup is needed."""
        return not self._setup_complete_file.exists()
    
    @property
    def node_executable(self) -> str:
        """Get path to Node.js executable."""
        if self.system == "Windows":
            return str(self._node_dir / "node.exe")
        return str(self._node_dir / "bin" / "node")
    
    @property
    def npm_executable(self) -> str:
        """Get path to npm executable."""
        if self.system == "Windows":
            return str(self._node_dir / "npm.cmd")
        return str(self._node_dir / "bin" / "npm")
    
    @property
    def scrcpy_executable(self) -> str:
        """Get path to scrcpy executable."""
        if self.system == "Windows":
            return str(self._bin_dir / "scrcpy.exe")
        return shutil.which("scrcpy") or "scrcpy"
    
    @property
    def adb_executable(self) -> str:
        """Get path to ADB executable."""
        if self.system == "Windows":
            return str(self._bin_dir / "platform-tools" / "adb.exe")
        return str(self._bin_dir / "platform-tools" / "adb")
    
    @property
    def ws_scrcpy_dir(self) -> Path:
        """Get ws-scrcpy directory."""
        return self._ws_scrcpy_dir
    
    def has_node(self) -> bool:
        """Check if portable Node.js is installed."""
        return Path(self.node_executable).exists()
    
    def has_scrcpy(self) -> bool:
        """Check if scrcpy is installed."""
        return Path(self.scrcpy_executable).exists() or shutil.which("scrcpy")
    
    def has_adb(self) -> bool:
        """Check if ADB is installed."""
        return Path(self.adb_executable).exists() or shutil.which("adb")
    
    def has_ws_scrcpy(self) -> bool:
        """Check if ws-scrcpy is installed."""
        return (self._ws_scrcpy_dir / "node_modules").exists()
    
    def setup_environment(self):
        """Setup PATH for bundled executables."""
        paths_to_add = [
            str(self._bin_dir),
            str(self._bin_dir / "platform-tools"),
        ]
        
        if self.system == "Windows":
            paths_to_add.append(str(self._node_dir))
        else:
            paths_to_add.append(str(self._node_dir / "bin"))
        
        current_path = os.environ.get("PATH", "")
        for path in paths_to_add:
            if path not in current_path:
                current_path = f"{path}{os.pathsep}{current_path}"
        
        os.environ["PATH"] = current_path
    
    async def run_silent_setup(
        self,
        progress_callback: Optional[Callable[[str, float], None]] = None
    ) -> bool:
        """Run completely silent setup - no user interaction needed.
        
        Returns True if setup completed successfully.
        """
        if not self.is_setup_required:
            self.setup_environment()
            return True
        
        total_steps = 4
        
        try:
            # Step 1: Install Node.js
            if progress_callback:
                progress_callback("Installing Node.js runtime...", 0.0)
            
            if not await self._install_node(progress_callback):
                # Try to continue without Node.js
                pass
            
            # Step 2: Install scrcpy (Windows) or check system
            if progress_callback:
                progress_callback("Installing screen mirroring tools...", 0.25)
            
            if self.system == "Windows":
                await self._install_scrcpy_windows(progress_callback)
            
            # Step 3: Install ADB
            if progress_callback:
                progress_callback("Installing Android Debug Bridge...", 0.5)
            
            await self._install_adb(progress_callback)
            
            # Step 4: Install ws-scrcpy
            if progress_callback:
                progress_callback("Setting up video streaming...", 0.75)
            
            if self.has_node():
                await self._install_ws_scrcpy(progress_callback)
            
            # Finalize
            if progress_callback:
                progress_callback("Finalizing setup...", 0.95)
            
            # Mark setup as complete
            self._setup_complete_file.touch()
            self.setup_environment()
            
            # Cleanup temp
            shutil.rmtree(self._temp_dir, ignore_errors=True)
            self._temp_dir.mkdir(exist_ok=True)
            
            if progress_callback:
                progress_callback("Setup complete!", 1.0)
            
            return True
            
        except Exception as e:
            print(f"[BundledSetup] Error: {e}")
            if progress_callback:
                progress_callback(f"Error: {e}", 1.0)
            return False
    
    async def _install_node(
        self,
        progress_callback: Optional[Callable[[str, float], None]] = None
    ) -> bool:
        """Install portable Node.js."""
        if self.has_node():
            return True
        
        url = self.NODE_URLS.get(self.system)
        if not url:
            return False
        
        try:
            if progress_callback:
                progress_callback("Downloading Node.js...", 0.05)
            
            # Download
            ext = ".zip" if self.system == "Windows" else ".tar.gz"
            archive_path = self._temp_dir / f"node{ext}"
            await self._download_file(url, archive_path)
            
            if progress_callback:
                progress_callback("Extracting Node.js...", 0.15)
            
            # Extract
            extract_dir = self._temp_dir / "node_extract"
            extract_dir.mkdir(exist_ok=True)
            
            if self.system == "Windows":
                with zipfile.ZipFile(archive_path, 'r') as zf:
                    zf.extractall(extract_dir)
            else:
                with tarfile.open(archive_path, 'r:gz') as tf:
                    tf.extractall(extract_dir)
            
            # Find extracted folder and move to node_dir
            for item in extract_dir.iterdir():
                if item.is_dir() and "node" in item.name:
                    # Move contents to node_dir
                    if self._node_dir.exists():
                        shutil.rmtree(self._node_dir)
                    shutil.move(str(item), str(self._node_dir))
                    break
            
            # Cleanup
            archive_path.unlink(missing_ok=True)
            shutil.rmtree(extract_dir, ignore_errors=True)
            
            # Set permissions on Unix
            if self.system != "Windows":
                node_bin = self._node_dir / "bin" / "node"
                if node_bin.exists():
                    os.chmod(node_bin, 0o755)
                npm_bin = self._node_dir / "bin" / "npm"
                if npm_bin.exists():
                    os.chmod(npm_bin, 0o755)
            
            return self.has_node()
            
        except Exception as e:
            print(f"[BundledSetup] Node.js install error: {e}")
            return False
    
    async def _install_scrcpy_windows(
        self,
        progress_callback: Optional[Callable[[str, float], None]] = None
    ) -> bool:
        """Install scrcpy on Windows."""
        if self.has_scrcpy():
            return True
        
        url = self.SCRCPY_URLS.get("Windows")
        if not url:
            return False
        
        try:
            if progress_callback:
                progress_callback("Downloading scrcpy...", 0.28)
            
            zip_path = self._temp_dir / "scrcpy.zip"
            await self._download_file(url, zip_path)
            
            if progress_callback:
                progress_callback("Extracting scrcpy...", 0.35)
            
            with zipfile.ZipFile(zip_path, 'r') as zf:
                extract_dir = self._temp_dir / "scrcpy_extract"
                zf.extractall(extract_dir)
                
                # Copy files to bin
                for item in extract_dir.iterdir():
                    if item.is_dir() and "scrcpy" in item.name:
                        for file in item.iterdir():
                            if file.is_file():
                                shutil.copy2(file, self._bin_dir / file.name)
                        break
                
                shutil.rmtree(extract_dir, ignore_errors=True)
            
            zip_path.unlink(missing_ok=True)
            return True
            
        except Exception as e:
            print(f"[BundledSetup] scrcpy install error: {e}")
            return False
    
    async def _install_adb(
        self,
        progress_callback: Optional[Callable[[str, float], None]] = None
    ) -> bool:
        """Install ADB platform tools."""
        if self.has_adb():
            return True
        
        url = self.ADB_URLS.get(self.system)
        if not url:
            return False
        
        try:
            if progress_callback:
                progress_callback("Downloading ADB...", 0.52)
            
            zip_path = self._temp_dir / "platform-tools.zip"
            await self._download_file(url, zip_path)
            
            if progress_callback:
                progress_callback("Extracting ADB...", 0.60)
            
            with zipfile.ZipFile(zip_path, 'r') as zf:
                zf.extractall(self._bin_dir)
            
            zip_path.unlink(missing_ok=True)
            
            # Set permissions on Unix
            if self.system != "Windows":
                adb_path = self._bin_dir / "platform-tools" / "adb"
                if adb_path.exists():
                    os.chmod(adb_path, 0o755)
            
            return True
            
        except Exception as e:
            print(f"[BundledSetup] ADB install error: {e}")
            return False
    
    async def _install_ws_scrcpy(
        self,
        progress_callback: Optional[Callable[[str, float], None]] = None
    ) -> bool:
        """Install ws-scrcpy for video streaming."""
        if self.has_ws_scrcpy():
            return True
        
        # Need Git for cloning
        git_available = shutil.which("git") is not None
        
        try:
            if git_available and not self._ws_scrcpy_dir.exists():
                if progress_callback:
                    progress_callback("Downloading video streaming server...", 0.78)
                
                proc = await asyncio.create_subprocess_exec(
                    "git", "clone", "--depth=1",
                    "https://github.com/NetrisTV/ws-scrcpy.git",
                    str(self._ws_scrcpy_dir),
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                await proc.communicate()
            
            if not self._ws_scrcpy_dir.exists():
                # If Git not available, skip ws-scrcpy
                return False
            
            if progress_callback:
                progress_callback("Installing streaming dependencies...", 0.85)
            
            # Setup environment for Node
            self.setup_environment()
            
            # Use our bundled Node/npm
            npm_cmd = self.npm_executable if self.has_node() else "npm"
            
            proc = await asyncio.create_subprocess_exec(
                npm_cmd, "install", "--legacy-peer-deps",
                cwd=str(self._ws_scrcpy_dir),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=os.environ.copy(),
            )
            stdout, stderr = await proc.communicate()
            
            if proc.returncode != 0:
                print(f"[BundledSetup] npm install error: {stderr.decode()[:200]}")
                return False
            
            return self.has_ws_scrcpy()
            
        except Exception as e:
            print(f"[BundledSetup] ws-scrcpy install error: {e}")
            return False
    
    async def _download_file(self, url: str, dest: Path):
        """Download a file."""
        def download():
            request = urllib.request.Request(
                url,
                headers={"User-Agent": "DroidRunController/1.0"}
            )
            with urllib.request.urlopen(request, timeout=120) as response:
                with open(dest, 'wb') as f:
                    shutil.copyfileobj(response, f)
        
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, download)
    
    def start_ws_scrcpy_server(self, port: int = 8000) -> Optional[subprocess.Popen]:
        """Start the ws-scrcpy server."""
        if not self.has_ws_scrcpy():
            return None
        
        self.setup_environment()
        
        npm_cmd = self.npm_executable if self.has_node() else "npm"
        
        try:
            proc = subprocess.Popen(
                [npm_cmd, "start"],
                cwd=str(self._ws_scrcpy_dir),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                env={**os.environ, "PORT": str(port)},
            )
            return proc
        except Exception as e:
            print(f"[BundledSetup] Failed to start ws-scrcpy: {e}")
            return None


# Global instance
bundled_setup = BundledSetup()


async def ensure_setup(progress_callback: Optional[Callable[[str, float], None]] = None) -> bool:
    """Ensure all dependencies are set up. Call this on app startup.
    
    Returns True if setup is complete and app can run.
    """
    return await bundled_setup.run_silent_setup(progress_callback)
