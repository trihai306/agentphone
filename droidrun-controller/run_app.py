#!/usr/bin/env python3
"""Run the Droidrun Controller desktop application."""

import sys
import os
from pathlib import Path
from dotenv import load_dotenv
import flet as ft
from app.main import main

# Load environment variables from .env file
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

if __name__ == "__main__":
    # Check if running with hot reload flag
    if "--reload" in sys.argv or "-r" in sys.argv:
        # Hot reload is handled by flet CLI
        ft.app(target=main)
    else:
        # Default: run with assets_dir for production
        ft.app(target=main)
