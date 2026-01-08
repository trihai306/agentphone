"""Test authentication check endpoints.

This test demonstrates how to use the auth verification endpoints.
"""

import asyncio
import aiohttp


async def test_auth_flow():
    """Test the complete authentication flow including verification."""

    base_url = "http://localhost:8000"

    async with aiohttp.ClientSession() as session:
        # 1. Register a test user
        print("\n1. Registering test user...")
        register_data = {
            "email": "testuser@example.com",
            "password": "TestPass123"
        }

        async with session.post(
            f"{base_url}/api/auth/register",
            json=register_data
        ) as resp:
            result = await resp.json()
            print(f"   Status: {resp.status}")
            print(f"   Response: {result}")

        # 2. Login
        print("\n2. Logging in...")
        login_data = {
            "email": "testuser@example.com",
            "password": "TestPass123"
        }

        async with session.post(
            f"{base_url}/api/auth/login",
            json=login_data
        ) as resp:
            result = await resp.json()
            print(f"   Status: {resp.status}")
            print(f"   Response: {result}")

            if not result.get("success"):
                print("   Login failed, stopping test")
                return

            token = result.get("token")
            print(f"   Token: {token[:50]}...")

        # 3. Verify token
        print("\n3. Verifying token...")
        headers = {"Authorization": f"Bearer {token}"}

        async with session.get(
            f"{base_url}/api/auth/verify",
            headers=headers
        ) as resp:
            result = await resp.json()
            print(f"   Status: {resp.status}")
            print(f"   Response: {result}")

        # 4. Get user info
        print("\n4. Getting user info...")
        async with session.get(
            f"{base_url}/api/auth/me",
            headers=headers
        ) as resp:
            result = await resp.json()
            print(f"   Status: {resp.status}")
            print(f"   Response: {result}")

        # 5. Test with invalid token
        print("\n5. Testing with invalid token...")
        invalid_headers = {"Authorization": "Bearer invalid_token"}

        async with session.get(
            f"{base_url}/api/auth/verify",
            headers=invalid_headers
        ) as resp:
            result = await resp.json()
            print(f"   Status: {resp.status}")
            print(f"   Response: {result}")

        # 6. Test without token
        print("\n6. Testing without token...")
        async with session.get(
            f"{base_url}/api/auth/verify"
        ) as resp:
            result = await resp.json()
            print(f"   Status: {resp.status}")
            print(f"   Response: {result}")

        print("\n✅ Test completed!")


if __name__ == "__main__":
    print("=== Authentication Check Test ===")
    print("Make sure the API server is running on http://localhost:8000")
    print("You can start it with: python -m app.main")

    asyncio.run(test_auth_flow())
