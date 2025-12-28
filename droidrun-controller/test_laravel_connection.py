#!/usr/bin/env python3
"""Test Laravel API connection from Python with HTTPS."""

import asyncio
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.auth_service import get_auth_service


async def test_connection():
    """Test connection to Laravel API."""

    # Set environment
    os.environ['LARAVEL_API_URL'] = 'https://laravel-backend.test'

    print("=" * 60)
    print("Testing Laravel API Connection")
    print("=" * 60)
    print()

    # Get auth service
    auth_service = get_auth_service()
    print(f"✓ Auth service initialized")
    print(f"  Base URL: {auth_service.base_url}")
    print()

    # Test health check
    print("1. Testing server health...")
    is_healthy = await auth_service.check_health()
    if is_healthy:
        print("   ✓ Server is reachable")
    else:
        print("   ✗ Server is not reachable")
        return
    print()

    # Test login with admin account
    print("2. Testing login...")
    result = await auth_service.login("admin@example.com", "password")

    if result.success:
        print("   ✓ Login successful!")
        print(f"   User ID: {result.user_id}")
        print(f"   Email: {result.email}")
        print(f"   Token: {result.token[:30]}...")
    else:
        print(f"   ✗ Login failed: {result.message}")
    print()

    # Test register new user
    import time
    test_email = f"test_{int(time.time())}@example.com"

    print("3. Testing registration...")
    result = await auth_service.register(test_email, "password123")

    if result.success:
        print("   ✓ Registration successful!")
        print(f"   User ID: {result.user_id}")
        print(f"   Email: {result.email}")
    else:
        print(f"   ✗ Registration failed: {result.message}")
    print()

    print("=" * 60)
    print("✅ All tests completed!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_connection())
