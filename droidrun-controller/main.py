"""Main entry point for Droidrun Controller."""

import argparse
import asyncio
import sys


def main():
    parser = argparse.ArgumentParser(description="Droidrun Controller")
    parser.add_argument("--ipc", action="store_true", help="Run in IPC mode for Electron")
    parser.add_argument("--init", action="store_true", help="Initialize database")

    args = parser.parse_args()

    if args.ipc:
        from droidrun_controller.ipc.handlers import run_ipc_server
        asyncio.run(run_ipc_server())
    elif args.init:
        from droidrun_controller.models import init_db
        asyncio.run(init_db())
        print("Database initialized successfully")
    else:
        # Default: run CLI
        from droidrun_controller.cli.main import app
        app()


if __name__ == "__main__":
    main()
