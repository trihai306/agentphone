"""Tests for authentication utility functions.

This module tests password hashing and JWT token management utilities
from app.utils.auth.
"""

import os
import sys
from datetime import timedelta
from pathlib import Path
from unittest.mock import patch

import pytest

# Add parent directory to path to allow imports from app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.utils.auth import (
    create_access_token,
    hash_password,
    verify_access_token,
    verify_password,
)


class TestPasswordHashing:
    """Tests for password hashing functions."""

    def test_hash_password_returns_string(self):
        """Test that hash_password returns a string."""
        hashed = hash_password("test_password")
        assert isinstance(hashed, str)

    def test_hash_password_produces_bcrypt_hash(self):
        """Test that hash produces bcrypt format (starts with $2b$)."""
        hashed = hash_password("test_password")
        assert hashed.startswith("$2b$")

    def test_hash_password_different_each_time(self):
        """Test that same password produces different hash each time (due to salt)."""
        password = "same_password"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        # Hashes should be different due to unique salt
        assert hash1 != hash2

    def test_hash_password_not_plain_text(self):
        """Test that the hash is not the plain text password."""
        password = "my_secret_password"
        hashed = hash_password(password)
        assert hashed != password
        assert password not in hashed

    def test_hash_password_handles_special_characters(self):
        """Test hashing passwords with special characters."""
        password = "p@ssw0rd!#$%^&*()_+-=[]{}|;':\",./<>?"
        hashed = hash_password(password)
        assert hashed.startswith("$2b$")

    def test_hash_password_handles_unicode(self):
        """Test hashing passwords with unicode characters."""
        password = "пароль密码🔐"
        hashed = hash_password(password)
        assert hashed.startswith("$2b$")

    def test_hash_password_handles_empty_string(self):
        """Test hashing an empty password (edge case)."""
        hashed = hash_password("")
        assert hashed.startswith("$2b$")

    def test_hash_password_handles_very_long_password(self):
        """Test hashing a very long password (bcrypt truncates at 72 bytes)."""
        # Create a password longer than 72 bytes
        password = "a" * 100
        hashed = hash_password(password)
        assert hashed.startswith("$2b$")


class TestPasswordVerification:
    """Tests for password verification function."""

    def test_verify_password_correct_password(self):
        """Test that correct password verifies successfully."""
        password = "correct_password"
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect_password(self):
        """Test that incorrect password fails verification."""
        hashed = hash_password("correct_password")
        assert verify_password("wrong_password", hashed) is False

    def test_verify_password_case_sensitive(self):
        """Test that password verification is case-sensitive."""
        hashed = hash_password("Password123")
        assert verify_password("password123", hashed) is False
        assert verify_password("PASSWORD123", hashed) is False

    def test_verify_password_invalid_hash_format(self):
        """Test verification with invalid hash format returns False."""
        assert verify_password("password", "not_a_valid_hash") is False

    def test_verify_password_empty_password_against_valid_hash(self):
        """Test empty password against a valid hash."""
        hashed = hash_password("non_empty_password")
        assert verify_password("", hashed) is False

    def test_verify_password_empty_password_hash(self):
        """Test verifying empty password when that was the original."""
        hashed = hash_password("")
        assert verify_password("", hashed) is True
        assert verify_password("not_empty", hashed) is False

    def test_verify_password_handles_unicode(self):
        """Test verification works with unicode passwords."""
        password = "密码🔐пароль"
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True
        assert verify_password("wrong", hashed) is False

    def test_verify_password_special_characters(self):
        """Test verification with special characters in password."""
        password = "!@#$%^&*()_+-=[]{}|;':\",./<>?"
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True


class TestJWTTokenCreation:
    """Tests for JWT token creation."""

    @pytest.fixture(autouse=True)
    def setup_jwt_secret(self):
        """Set up JWT_SECRET environment variable for tests."""
        with patch.dict(os.environ, {"JWT_SECRET": "test_secret_key_12345"}):
            yield

    def test_create_access_token_returns_string(self):
        """Test that create_access_token returns a string."""
        token = create_access_token(user_id=1, email="test@example.com")
        assert isinstance(token, str)

    def test_create_access_token_not_empty(self):
        """Test that token is not empty."""
        token = create_access_token(user_id=1, email="test@example.com")
        assert len(token) > 0

    def test_create_access_token_jwt_format(self):
        """Test that token has JWT format (3 parts separated by dots)."""
        token = create_access_token(user_id=1, email="test@example.com")
        parts = token.split(".")
        assert len(parts) == 3

    def test_create_access_token_different_users_different_tokens(self):
        """Test that different users get different tokens."""
        token1 = create_access_token(user_id=1, email="user1@example.com")
        token2 = create_access_token(user_id=2, email="user2@example.com")
        assert token1 != token2

    def test_create_access_token_custom_expiration(self):
        """Test creating token with custom expiration."""
        token = create_access_token(
            user_id=1,
            email="test@example.com",
            expires_delta=timedelta(hours=1),
        )
        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_access_token_missing_secret_raises_error(self):
        """Test that missing JWT_SECRET raises ValueError."""
        with patch.dict(os.environ, {}, clear=True):
            # Remove JWT_SECRET to test error handling
            os.environ.pop("JWT_SECRET", None)
            with pytest.raises(ValueError, match="JWT_SECRET"):
                create_access_token(user_id=1, email="test@example.com")


class TestJWTTokenVerification:
    """Tests for JWT token verification."""

    @pytest.fixture(autouse=True)
    def setup_jwt_secret(self):
        """Set up JWT_SECRET environment variable for tests."""
        with patch.dict(os.environ, {"JWT_SECRET": "test_secret_key_12345"}):
            yield

    def test_verify_access_token_valid_token(self):
        """Test verifying a valid token returns payload."""
        token = create_access_token(user_id=42, email="user@example.com")
        payload = verify_access_token(token)

        assert payload is not None
        assert payload["user_id"] == 42
        assert payload["email"] == "user@example.com"

    def test_verify_access_token_contains_expiration(self):
        """Test that verified token contains expiration timestamp."""
        token = create_access_token(user_id=1, email="test@example.com")
        payload = verify_access_token(token)

        assert payload is not None
        assert "exp" in payload
        assert payload["exp"] is not None

    def test_verify_access_token_contains_issued_at(self):
        """Test that verified token contains issued-at timestamp."""
        token = create_access_token(user_id=1, email="test@example.com")
        payload = verify_access_token(token)

        assert payload is not None
        assert "iat" in payload
        assert payload["iat"] is not None

    def test_verify_access_token_invalid_token(self):
        """Test that invalid token returns None."""
        payload = verify_access_token("not.a.valid.token")
        assert payload is None

    def test_verify_access_token_tampered_token(self):
        """Test that tampered token returns None."""
        token = create_access_token(user_id=1, email="test@example.com")
        # Tamper with the token by modifying a character
        tampered = token[:-5] + "XXXXX"
        payload = verify_access_token(tampered)
        assert payload is None

    def test_verify_access_token_wrong_secret(self):
        """Test that token signed with different secret fails verification."""
        # Create token with one secret
        with patch.dict(os.environ, {"JWT_SECRET": "secret_one"}):
            token = create_access_token(user_id=1, email="test@example.com")

        # Verify with different secret
        with patch.dict(os.environ, {"JWT_SECRET": "secret_two"}):
            payload = verify_access_token(token)
            assert payload is None

    def test_verify_access_token_expired_token(self):
        """Test that expired token returns None."""
        # Create token that expires immediately
        token = create_access_token(
            user_id=1,
            email="test@example.com",
            expires_delta=timedelta(seconds=-1),  # Already expired
        )
        payload = verify_access_token(token)
        assert payload is None

    def test_verify_access_token_empty_string(self):
        """Test that empty string returns None."""
        payload = verify_access_token("")
        assert payload is None

    def test_verify_access_token_malformed_token(self):
        """Test that malformed token returns None."""
        # Various malformed tokens
        assert verify_access_token("abc") is None
        assert verify_access_token("a.b") is None
        assert verify_access_token("...") is None


class TestJWTConfiguration:
    """Tests for JWT configuration handling."""

    def test_jwt_algorithm_default(self):
        """Test that default JWT algorithm is HS256."""
        with patch.dict(os.environ, {"JWT_SECRET": "test_secret"}):
            token = create_access_token(user_id=1, email="test@example.com")
            # Token should be verifiable (using default HS256)
            payload = verify_access_token(token)
            assert payload is not None

    def test_jwt_expiration_default(self):
        """Test that default JWT expiration is 24 hours."""
        from datetime import datetime, timezone

        with patch.dict(os.environ, {"JWT_SECRET": "test_secret"}):
            token = create_access_token(user_id=1, email="test@example.com")
            payload = verify_access_token(token)

            assert payload is not None
            # Expiration should be roughly 24 hours from issued time
            delta = payload["exp"] - payload["iat"]
            # Allow some tolerance (23-25 hours in seconds)
            assert timedelta(hours=23) <= delta <= timedelta(hours=25)

    def test_jwt_custom_expiration_hours(self):
        """Test custom JWT_EXPIRATION_HOURS environment variable."""
        with patch.dict(
            os.environ,
            {"JWT_SECRET": "test_secret", "JWT_EXPIRATION_HOURS": "48"},
        ):
            token = create_access_token(user_id=1, email="test@example.com")
            payload = verify_access_token(token)

            assert payload is not None
            delta = payload["exp"] - payload["iat"]
            # Should be roughly 48 hours
            assert timedelta(hours=47) <= delta <= timedelta(hours=49)
