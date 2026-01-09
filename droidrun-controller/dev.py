#!/usr/bin/env python3
"""Development server with hot reload.

Run this script for development with automatic reload when files change.
Usage: python dev.py
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

# Make sure we're in the right directory
os.chdir(Path(__file__).parent)

# Run with Flet CLI hot reload
if __name__ == "__main__":
    import subprocess

    print("🔥 Starting Flet app with HOT RELOAD...")
    print("📁 Watching for file changes in app/")
    print("🔄 App will auto-reload when you save files")
    print("Press Ctrl+C to stop\n")

    # Use flet run with hot reload
    # -d: watch directory
    # -r: recursive watch
    # -v: verbose
    cmd = [
        "flet", "run",
        "-d",  # Watch directory
        "-r",  # Recursive
        "--ignore-dirs", ".venv,venv,__pycache__,.git,workflows.db,portal-apk,storage",  # Ignore these
        "run_app.py"
    ]

    try:
        subprocess.run(cmd)
    except KeyboardInterrupt:
        print("\n\n👋 Hot reload server stopped")
