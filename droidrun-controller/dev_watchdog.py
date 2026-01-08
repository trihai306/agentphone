#!/usr/bin/env python3
"""Advanced development server with custom hot reload using watchdog.

This provides more control over the reload behavior.
Usage: python dev_watchdog.py
"""

import os
import sys
import time
import subprocess
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    print("❌ watchdog not installed. Installing...")
    subprocess.run([sys.executable, "-m", "pip", "install", "watchdog"])
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler


class AppReloadHandler(FileSystemEventHandler):
    """Handle file changes and reload the app."""

    def __init__(self, restart_callback):
        self.restart_callback = restart_callback
        self.last_reload = time.time()
        self.reload_delay = 1.0  # Debounce: wait 1 second after last change

    def should_reload(self, event):
        """Check if we should reload based on file type."""
        if event.is_directory:
            return False

        # Only reload for Python files
        if not event.src_path.endswith('.py'):
            return False

        # Ignore certain directories
        ignore_patterns = [
            '__pycache__',
            '.git',
            '.venv',
            'venv',
            'workflows.db',
            'portal-apk',
            '.pytest_cache',
            'tests',
        ]

        for pattern in ignore_patterns:
            if pattern in event.src_path:
                return False

        return True

    def on_modified(self, event):
        """Handle file modification."""
        if not self.should_reload(event):
            return

        # Debounce: only reload if enough time has passed
        current_time = time.time()
        if current_time - self.last_reload < self.reload_delay:
            return

        self.last_reload = current_time

        # Get relative path for display
        try:
            rel_path = Path(event.src_path).relative_to(Path.cwd())
        except ValueError:
            rel_path = Path(event.src_path)

        print(f"\n🔄 File changed: {rel_path}")
        print("⚡ Reloading app...\n")

        self.restart_callback()


class AppRunner:
    """Manage the Flet app process."""

    def __init__(self):
        self.process = None
        self.watch_path = Path(__file__).parent / "app"

    def start(self):
        """Start the Flet app."""
        if self.process:
            self.stop()

        print("🚀 Starting app...")

        # Start the app as a subprocess
        self.process = subprocess.Popen(
            [sys.executable, "run_app.py"],
            cwd=Path(__file__).parent,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,  # Line buffered
        )

        # Give it a moment to start
        time.sleep(0.5)

        if self.process.poll() is None:
            print("✅ App started successfully")
        else:
            print("❌ App failed to start")
            stdout, stderr = self.process.communicate()
            if stderr:
                print(f"Error: {stderr}")

    def stop(self):
        """Stop the running app."""
        if self.process and self.process.poll() is None:
            print("🛑 Stopping app...")
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
            print("✅ App stopped")

    def restart(self):
        """Restart the app."""
        self.stop()
        time.sleep(0.5)
        self.start()

    def run_with_reload(self):
        """Run the app with file watching."""
        # Start the app
        self.start()

        # Setup file watcher
        event_handler = AppReloadHandler(self.restart)
        observer = Observer()
        observer.schedule(event_handler, str(self.watch_path), recursive=True)
        observer.start()

        print(f"\n👀 Watching for changes in: {self.watch_path}")
        print("🔥 Hot reload enabled")
        print("Press Ctrl+C to stop\n")

        try:
            # Keep running until interrupted
            while True:
                time.sleep(1)

                # Check if app crashed
                if self.process and self.process.poll() is not None:
                    print("\n⚠️  App exited unexpectedly")
                    stdout, stderr = self.process.communicate()
                    if stderr:
                        print(f"Error output:\n{stderr}")

                    print("\n🔄 Restarting in 2 seconds...")
                    time.sleep(2)
                    self.start()

        except KeyboardInterrupt:
            print("\n\n👋 Shutting down...")
            observer.stop()
            self.stop()
            observer.join()
            print("✅ Hot reload server stopped")


if __name__ == "__main__":
    print("="*60)
    print("  DROIDRUN CONTROLLER - DEVELOPMENT MODE")
    print("="*60)
    print()
    print("Features:")
    print("  ✅ Hot reload on file changes")
    print("  ✅ Auto-restart on crash")
    print("  ✅ Watch app/ directory recursively")
    print()

    runner = AppRunner()
    runner.run_with_reload()
