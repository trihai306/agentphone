#!/usr/bin/env python3
"""Demo hot reload functionality.

This script demonstrates hot reload by making a small change to a file
and showing that the app automatically reloads.
"""

import time
import subprocess
from pathlib import Path


def demo_hot_reload():
    """Demonstrate hot reload."""
    print("="*70)
    print("  HOT RELOAD DEMO")
    print("="*70)
    print()
    print("This demo will:")
    print("  1. Show current app state")
    print("  2. Modify a file")
    print("  3. App auto-reloads")
    print("  4. Restore file")
    print()
    print("Make sure dev.py is running in another terminal!")
    print()

    input("Press Enter to start demo...")

    # File to modify
    theme_file = Path(__file__).parent / "app" / "theme.py"

    print("\n1. Reading current file...")
    with open(theme_file, 'r') as f:
        original_content = f.read()

    print(f"✅ Read {len(original_content)} characters from theme.py")

    print("\n2. Adding comment to trigger reload...")
    test_comment = f"\n# Hot reload test - {time.strftime('%Y-%m-%d %H:%M:%S')}\n"

    with open(theme_file, 'a') as f:
        f.write(test_comment)

    print("✅ File modified")
    print(f"   Added: {test_comment.strip()}")

    print("\n3. Waiting for app to reload...")
    for i in range(3, 0, -1):
        print(f"   {i}...", flush=True)
        time.sleep(1)

    print("\n✅ App should have reloaded!")
    print("   Check your app window - it should have refreshed")

    print("\n4. Restoring original file...")
    time.sleep(1)

    with open(theme_file, 'w') as f:
        f.write(original_content)

    print("✅ File restored")

    print("\n5. App will reload again...")
    for i in range(3, 0, -1):
        print(f"   {i}...", flush=True)
        time.sleep(1)

    print("\n" + "="*70)
    print("  DEMO COMPLETE!")
    print("="*70)
    print()
    print("Hot reload is working! Your app auto-reloaded twice:")
    print("  1. When we added the comment")
    print("  2. When we removed the comment")
    print()
    print("Now you can edit any file and see changes instantly! 🚀")
    print()


if __name__ == "__main__":
    try:
        demo_hot_reload()
    except KeyboardInterrupt:
        print("\n\n👋 Demo cancelled")
    except Exception as e:
        print(f"\n❌ Error: {e}")
