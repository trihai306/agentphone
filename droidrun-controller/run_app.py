#!/usr/bin/env python3
"""Run the Droidrun Controller desktop application."""

import sys
import flet as ft
from app.main import main

if __name__ == "__main__":
    # Check if running with hot reload flag
    if "--reload" in sys.argv or "-r" in sys.argv:
        # Hot reload is handled by flet CLI
        ft.app(target=main)
    else:
        # Default: run with assets_dir for production
        ft.app(target=main)
