"""Integration tests for authentication API endpoints.

This module tests the registration and login API endpoints:
- POST /api/auth/register - User registration
- POST /api/auth/login - User login

Tests verify:
- Successful registration creates database record
- Duplicate email registration returns 400 error
- Valid login returns JWT token
- Invalid credentials return 401 error
- Input validation works correctly
"""

import asyncio
import os
import sys
from pathlib import Path
from unittest.mock import patch

import pytest
import pytest_asyncio
from aiohttp import web
from aiohttp.test_utils import TestServer, TestClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

# Add parent directory to path to allow imports from app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database.schema import Base, UserDB
from app.api.auth import (
    create_api_app,
    register_handler,
    login_handler,
    validate_email,
    validate_password,
)
from app.utils.auth import hash_password, verify_access_token


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
def setup_jwt_secret():
    """Set up JWT_SECRET environment variable for tests."""
    with patch.dict(os.environ, {"JWT_SECRET": "test_secret_key_for_integration_tests_12345"}):
        yield


class TestValidateEmail:
    """Tests for email validation function."""

    def test_valid_email(self):
        """Test valid email addresses pass validation."""
        valid_emails = [
            "user@example.com",
            "test.user@domain.org",
            "user+tag@example.com",
            "user123@test.io",
        ]
        for email in valid_emails:
            is_valid, error = validate_email(email)
            assert is_valid is True, f"Expected {email} to be valid, got error: {error}"

    def test_invalid_email_empty(self):
        """Test empty email fails validation."""
        is_valid, error = validate_email("")
        assert is_valid is False
        assert "required" in error.lower()

    def test_invalid_email_no_at(self):
        """Test email without @ fails validation."""
        is_valid, error = validate_email("userexample.com")
        assert is_valid is False
        assert "invalid" in error.lower()

    def test_invalid_email_no_domain(self):
        """Test email without domain fails validation."""
        is_valid, error = validate_email("user@")
        assert is_valid is False
        assert "invalid" in error.lower()

    def test_invalid_email_no_tld(self):
        """Test email without TLD fails validation."""
        is_valid, error = validate_email("user@domain")
        assert is_valid is False
        assert "invalid" in error.lower()

    def test_email_too_long(self):
        """Test email exceeding 255 chars fails validation."""
        long_email = "a" * 250 + "@example.com"
        is_valid, error = validate_email(long_email)
        assert is_valid is False
        assert "255" in error


class TestValidatePassword:
    """Tests for password validation function."""

    def test_valid_password(self):
        """Test valid passwords pass validation."""
        is_valid, error = validate_password("SecurePass123")
        assert is_valid is True
        assert error == ""

    def test_password_empty(self):
        """Test empty password fails validation."""
        is_valid, error = validate_password("")
        assert is_valid is False
        assert "required" in error.lower()

    def test_password_too_short(self):
        """Test password under 8 chars fails validation."""
        is_valid, error = validate_password("Pass1")
        assert is_valid is False
        assert "8" in error

    def test_password_no_letter(self):
        """Test password without letter fails validation."""
        is_valid, error = validate_password("12345678")
        assert is_valid is False
        assert "letter" in error.lower()

    def test_password_no_number(self):
        """Test password without number fails validation."""
        is_valid, error = validate_password("Password")
        assert is_valid is False
        assert "number" in error.lower()

    def test_password_too_long(self):
        """Test password exceeding 128 chars fails validation."""
        long_password = "Aa1" + "a" * 130
        is_valid, error = validate_password(long_password)
        assert is_valid is False
        assert "128" in error


class TestRegistrationAPI:
    """Integration tests for registration API endpoint."""

    @pytest_asyncio.fixture
    async def api_client(self):
        """Create test client with in-memory database."""
        from app.database.connection import get_db_manager

        db_manager = get_db_manager()
        await db_manager.initialize("sqlite+aiosqlite:///:memory:")

        app = create_api_app()
        # Clear startup hooks to prevent re-initialization
        app._on_startup.clear()

        server = TestServer(app)
        client = TestClient(server)
        await client.start_server()

        yield client

        await client.close()
        await db_manager.close()

    @pytest.mark.asyncio
    async def test_register_user_success(self, api_client):
        """Test successful user registration creates database record."""
        from app.database.connection import get_session_context

        response = await api_client.post(
            "/api/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "SecurePass123"
            }
        )

        data = await response.json()

        assert response.status == 201
        assert data["success"] is True
        assert data["message"] == "User registered successfully"
        assert "user_id" in data
        assert data["email"] == "newuser@example.com"

        # Verify user was created in database
        async with get_session_context() as session:
            result = await session.execute(
                select(UserDB).where(UserDB.email == "newuser@example.com")
            )
            user = result.scalar_one_or_none()
            assert user is not None
            assert user.email == "newuser@example.com"
            # Password should be hashed
            assert user.password_hash.startswith("$2b$")

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, api_client):
        """Test registering with existing email returns 400 error."""
        # Register first user
        await api_client.post(
            "/api/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "SecurePass123"
            }
        )

        # Try to register with same email
        response = await api_client.post(
            "/api/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "DifferentPass456"
            }
        )

        data = await response.json()

        assert response.status == 400
        assert data["success"] is False
        assert "already exists" in data["message"].lower()

    @pytest.mark.asyncio
    async def test_register_invalid_email(self, api_client):
        """Test registering with invalid email returns 400 error."""
        response = await api_client.post(
            "/api/auth/register",
            json={
                "email": "invalid-email",
                "password": "SecurePass123"
            }
        )

        data = await response.json()

        assert response.status == 400
        assert data["success"] is False
        assert "invalid" in data["message"].lower() or "email" in data["message"].lower()

    @pytest.mark.asyncio
    async def test_register_weak_password(self, api_client):
        """Test registering with weak password returns 400 error."""
        response = await api_client.post(
            "/api/auth/register",
            json={
                "email": "user@example.com",
                "password": "short"
            }
        )

        data = await response.json()

        assert response.status == 400
        assert data["success"] is False
        assert "8" in data["message"] or "password" in data["message"].lower()

    @pytest.mark.asyncio
    async def test_register_missing_email(self, api_client):
        """Test registering without email returns 400 error."""
        response = await api_client.post(
            "/api/auth/register",
            json={
                "password": "SecurePass123"
            }
        )

        data = await response.json()

        assert response.status == 400
        assert data["success"] is False

    @pytest.mark.asyncio
    async def test_register_missing_password(self, api_client):
        """Test registering without password returns 400 error."""
        response = await api_client.post(
            "/api/auth/register",
            json={
                "email": "user@example.com"
            }
        )

        data = await response.json()

        assert response.status == 400
        assert data["success"] is False

    @pytest.mark.asyncio
    async def test_register_invalid_json(self, api_client):
        """Test registering with invalid JSON returns 400 error."""
        response = await api_client.post(
            "/api/auth/register",
            data="not json",
            headers={"Content-Type": "application/json"}
        )

        data = await response.json()

        assert response.status == 400
        assert data["success"] is False
        assert "json" in data["message"].lower()

    @pytest.mark.asyncio
    async def test_register_email_normalized(self, api_client):
        """Test that email is normalized (lowercase, trimmed)."""
        response = await api_client.post(
            "/api/auth/register",
            json={
                "email": "  User@EXAMPLE.com  ",
                "password": "SecurePass123"
            }
        )

        data = await response.json()

        assert response.status == 201
        assert data["email"] == "user@example.com"


class TestLoginAPI:
    """Integration tests for login API endpoint."""

    @pytest_asyncio.fixture
    async def api_client(self):
        """Create test client with in-memory database."""
        from app.database.connection import get_db_manager

        db_manager = get_db_manager()
        await db_manager.initialize("sqlite+aiosqlite:///:memory:")

        app = create_api_app()
        # Clear startup hooks to prevent re-initialization
        app._on_startup.clear()

        server = TestServer(app)
        client = TestClient(server)
        await client.start_server()

        yield client

        await client.close()
        await db_manager.close()

    @pytest.mark.asyncio
    async def test_login_valid_credentials(self, api_client):
        """Test login with valid credentials returns JWT token."""
        # First register a user
        await api_client.post(
            "/api/auth/register",
            json={
                "email": "login@example.com",
                "password": "SecurePass123"
            }
        )

        # Now login
        response = await api_client.post(
            "/api/auth/login",
            json={
                "email": "login@example.com",
                "password": "SecurePass123"
            }
        )

        data = await response.json()

        assert response.status == 200
        assert data["success"] is True
        assert data["message"] == "Login successful"
        assert "token" in data
        assert data["email"] == "login@example.com"
        assert "user_id" in data

        # Verify token is valid JWT
        token = data["token"]
        payload = verify_access_token(token)
        assert payload is not None
        assert payload["email"] == "login@example.com"

    @pytest.mark.asyncio
    async def test_login_invalid_password(self, api_client):
        """Test login with wrong password returns 401 error."""
        # First register a user
        await api_client.post(
            "/api/auth/register",
            json={
                "email": "wrongpass@example.com",
                "password": "SecurePass123"
            }
        )

        # Try to login with wrong password
        response = await api_client.post(
            "/api/auth/login",
            json={
                "email": "wrongpass@example.com",
                "password": "WrongPassword456"
            }
        )

        data = await response.json()

        assert response.status == 401
        assert data["success"] is False
        assert "invalid credentials" in data["message"].lower()

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, api_client):
        """Test login with non-existent user returns 401 error."""
        response = await api_client.post(
            "/api/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "SecurePass123"
            }
        )

        data = await response.json()

        assert response.status == 401
        assert data["success"] is False
        # Should be generic message (no user enumeration)
        assert "invalid credentials" in data["message"].lower()

    @pytest.mark.asyncio
    async def test_login_missing_email(self, api_client):
        """Test login without email returns 400 error."""
        response = await api_client.post(
            "/api/auth/login",
            json={
                "password": "SecurePass123"
            }
        )

        data = await response.json()

        assert response.status == 400
        assert data["success"] is False
        assert "email" in data["message"].lower()

    @pytest.mark.asyncio
    async def test_login_missing_password(self, api_client):
        """Test login without password returns 400 error."""
        response = await api_client.post(
            "/api/auth/login",
            json={
                "email": "user@example.com"
            }
        )

        data = await response.json()

        assert response.status == 400
        assert data["success"] is False
        assert "password" in data["message"].lower()

    @pytest.mark.asyncio
    async def test_login_invalid_json(self, api_client):
        """Test login with invalid JSON returns 400 error."""
        response = await api_client.post(
            "/api/auth/login",
            data="not json",
            headers={"Content-Type": "application/json"}
        )

        data = await response.json()

        assert response.status == 400
        assert data["success"] is False
        assert "json" in data["message"].lower()

    @pytest.mark.asyncio
    async def test_login_email_case_insensitive(self, api_client):
        """Test that login works with different email cases."""
        # Register with lowercase
        await api_client.post(
            "/api/auth/register",
            json={
                "email": "casetest@example.com",
                "password": "SecurePass123"
            }
        )

        # Login with different case
        response = await api_client.post(
            "/api/auth/login",
            json={
                "email": "CASETEST@Example.COM",
                "password": "SecurePass123"
            }
        )

        data = await response.json()

        assert response.status == 200
        assert data["success"] is True


class TestEndToEndFlow:
    """End-to-end integration tests for complete authentication flow."""

    @pytest_asyncio.fixture
    async def api_client(self):
        """Create test client with in-memory database."""
        from app.database.connection import get_db_manager

        db_manager = get_db_manager()
        await db_manager.initialize("sqlite+aiosqlite:///:memory:")

        app = create_api_app()
        # Clear startup hooks to prevent re-initialization
        app._on_startup.clear()

        server = TestServer(app)
        client = TestClient(server)
        await client.start_server()

        yield client

        await client.close()
        await db_manager.close()

    @pytest.mark.asyncio
    async def test_registration_flow_end_to_end(self, api_client):
        """Test complete registration flow: register -> verify DB -> login."""
        from app.database.connection import get_session_context

        # Step 1: Register new user
        register_response = await api_client.post(
            "/api/auth/register",
            json={
                "email": "e2e@example.com",
                "password": "E2ETestPass123"
            }
        )

        register_data = await register_response.json()
        assert register_response.status == 201
        assert register_data["success"] is True
        user_id = register_data["user_id"]

        # Step 2: Verify user in database
        async with get_session_context() as session:
            result = await session.execute(
                select(UserDB).where(UserDB.id == user_id)
            )
            user = result.scalar_one_or_none()
            assert user is not None
            assert user.email == "e2e@example.com"
            assert user.password_hash.startswith("$2b$")  # bcrypt hash

        # Step 3: Login with registered credentials
        login_response = await api_client.post(
            "/api/auth/login",
            json={
                "email": "e2e@example.com",
                "password": "E2ETestPass123"
            }
        )

        login_data = await login_response.json()
        assert login_response.status == 200
        assert login_data["success"] is True
        assert "token" in login_data
        assert login_data["user_id"] == user_id

    @pytest.mark.asyncio
    async def test_login_flow_end_to_end(self, api_client):
        """Test login flow returns valid token that can be verified."""
        # Register
        await api_client.post(
            "/api/auth/register",
            json={
                "email": "tokentest@example.com",
                "password": "TokenTestPass123"
            }
        )

        # Login
        login_response = await api_client.post(
            "/api/auth/login",
            json={
                "email": "tokentest@example.com",
                "password": "TokenTestPass123"
            }
        )

        login_data = await login_response.json()
        token = login_data["token"]

        # Verify token
        payload = verify_access_token(token)
        assert payload is not None
        assert payload["email"] == "tokentest@example.com"
        assert payload["user_id"] == login_data["user_id"]
        assert "exp" in payload
        assert "iat" in payload

    @pytest.mark.asyncio
    async def test_duplicate_registration_prevention(self, api_client):
        """Test that duplicate email registration is prevented."""
        from app.database.connection import get_session_context

        # Register first user
        first_response = await api_client.post(
            "/api/auth/register",
            json={
                "email": "unique@example.com",
                "password": "FirstPass123"
            }
        )
        assert first_response.status == 201

        # Try to register same email again
        second_response = await api_client.post(
            "/api/auth/register",
            json={
                "email": "unique@example.com",
                "password": "SecondPass456"
            }
        )

        second_data = await second_response.json()
        assert second_response.status == 400
        assert "already exists" in second_data["message"].lower()

        # Verify only one user exists in database
        async with get_session_context() as session:
            result = await session.execute(
                select(UserDB).where(UserDB.email == "unique@example.com")
            )
            users = result.scalars().all()
            assert len(users) == 1

    @pytest.mark.asyncio
    async def test_password_security(self, api_client):
        """Test that passwords are hashed and not stored in plain text."""
        from app.database.connection import get_session_context
        from app.utils.auth import verify_password

        plain_password = "PlainTextPass123"

        # Register user
        await api_client.post(
            "/api/auth/register",
            json={
                "email": "security@example.com",
                "password": plain_password
            }
        )

        # Check password is hashed in database
        async with get_session_context() as session:
            result = await session.execute(
                select(UserDB).where(UserDB.email == "security@example.com")
            )
            user = result.scalar_one_or_none()

            # Password hash should NOT be the plain password
            assert user.password_hash != plain_password
            # Password hash should be bcrypt format
            assert user.password_hash.startswith("$2b$")
            # But should verify correctly
            assert verify_password(plain_password, user.password_hash) is True
