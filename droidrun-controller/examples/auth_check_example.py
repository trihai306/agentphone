"""Example: How to check login status in your Flet app.

This demonstrates how to integrate authentication checks into your views.
"""

import aiohttp
import flet as ft


class AuthService:
    """Service to handle authentication operations."""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.token = None

    async def login(self, email: str, password: str) -> dict:
        """Login and store token."""
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/api/auth/login",
                json={"email": email, "password": password}
            ) as resp:
                result = await resp.json()

                if result.get("success"):
                    self.token = result.get("token")

                return result

    async def check_login(self) -> tuple[bool, dict]:
        """Check if user is logged in.

        Returns:
            Tuple of (is_logged_in, user_info)
        """
        if not self.token:
            return False, {}

        async with aiohttp.ClientSession() as session:
            headers = {"Authorization": f"Bearer {self.token}"}

            async with session.get(
                f"{self.base_url}/api/auth/verify",
                headers=headers
            ) as resp:
                result = await resp.json()

                if result.get("success"):
                    return True, result.get("user", {})
                else:
                    # Token invalid or expired, clear it
                    self.token = None
                    return False, {}

    async def get_user_info(self) -> dict | None:
        """Get full user information from database.

        Returns:
            User info dict or None if not logged in
        """
        if not self.token:
            return None

        async with aiohttp.ClientSession() as session:
            headers = {"Authorization": f"Bearer {self.token}"}

            async with session.get(
                f"{self.base_url}/api/auth/me",
                headers=headers
            ) as resp:
                result = await resp.json()

                if result.get("success"):
                    return result.get("user")
                else:
                    return None

    def logout(self):
        """Logout by clearing token."""
        self.token = None


# Example usage in your main app
async def main(page: ft.Page):
    """Example app with authentication."""

    page.title = "Auth Example"
    auth_service = AuthService()

    # Check if user is logged in on app start
    is_logged_in, user_info = await auth_service.check_login()

    if is_logged_in:
        page.add(
            ft.Text(f"Welcome back, {user_info.get('email')}!")
        )
    else:
        page.add(
            ft.Text("Please login")
        )

    async def on_login_clicked(email: str, password: str):
        """Handle login."""
        result = await auth_service.login(email, password)

        if result.get("success"):
            # Login successful, check status
            is_logged_in, user_info = await auth_service.check_login()

            if is_logged_in:
                page.clean()
                page.add(
                    ft.Text(f"Welcome, {user_info.get('email')}!")
                )
                page.update()
        else:
            # Show error
            page.add(
                ft.Text(f"Login failed: {result.get('message')}", color="red")
            )
            page.update()


# Example: Protected view that requires login
class ProtectedView(ft.Container):
    """A view that requires authentication."""

    def __init__(self, auth_service: AuthService, on_unauthorized=None, **kwargs):
        self.auth_service = auth_service
        self.on_unauthorized = on_unauthorized
        super().__init__(**kwargs)

    async def check_access(self) -> bool:
        """Check if user has access to this view.

        Returns:
            True if user is logged in, False otherwise
        """
        is_logged_in, user_info = await self.auth_service.check_login()

        if not is_logged_in:
            # User not logged in, redirect or show error
            if self.on_unauthorized:
                self.on_unauthorized()
            return False

        # User is logged in, show content
        return True

    async def load_content(self):
        """Load content after checking authentication."""
        has_access = await self.check_access()

        if has_access:
            # Get full user info
            user_info = await self.auth_service.get_user_info()

            # Build your protected content here
            self.content = ft.Column([
                ft.Text(f"Protected content for {user_info.get('email')}"),
                # ... more content
            ])
        else:
            self.content = ft.Text("Please login to access this page")

        self.update()


# Example: Middleware-style authentication check
async def require_auth(auth_service: AuthService, on_success, on_failure):
    """Decorator-style function to require authentication.

    Args:
        auth_service: The auth service instance
        on_success: Function to call if authenticated (receives user_info)
        on_failure: Function to call if not authenticated
    """
    is_logged_in, user_info = await auth_service.check_login()

    if is_logged_in:
        await on_success(user_info)
    else:
        await on_failure()


# Example usage:
async def show_dashboard(user_info: dict):
    """Show dashboard for authenticated user."""
    print(f"Showing dashboard for {user_info.get('email')}")


async def show_login():
    """Show login page."""
    print("Redirecting to login...")


# In your app:
# await require_auth(auth_service, show_dashboard, show_login)
