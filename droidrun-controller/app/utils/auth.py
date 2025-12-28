"""Authentication utility functions for password hashing and JWT token management.

This module provides secure authentication utilities using:
- bcrypt for password hashing (industry standard)
- PyJWT for JSON Web Token generation and verification

Configuration is loaded from environment variables:
- JWT_SECRET: Secret key for signing tokens (required)
- JWT_ALGORITHM: Algorithm for JWT signing (default: HS256)
- JWT_EXPIRATION_HOURS: Token expiration time in hours (default: 24)

Usage:
    from app.utils.auth import hash_password, verify_password, create_access_token

    # Password hashing
    hashed = hash_password("user_password")
    is_valid = verify_password("user_password", hashed)

    # JWT tokens
    token = create_access_token(user_id=1, email="user@example.com")
    payload = verify_access_token(token)
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional, TypedDict

import bcrypt
import jwt


# JWT Configuration with sensible defaults
def _get_jwt_secret() -> str:
    """Get JWT secret from environment.

    Returns:
        JWT secret key.

    Raises:
        ValueError: If JWT_SECRET is not set.
    """
    secret = os.environ.get("JWT_SECRET")
    if not secret:
        raise ValueError(
            "JWT_SECRET environment variable is not set. "
            "Please set it in your .env file."
        )
    return secret


def _get_jwt_algorithm() -> str:
    """Get JWT algorithm from environment or use default."""
    return os.environ.get("JWT_ALGORITHM", "HS256")


def _get_jwt_expiration_hours() -> int:
    """Get JWT expiration hours from environment or use default."""
    try:
        return int(os.environ.get("JWT_EXPIRATION_HOURS", "24"))
    except ValueError:
        return 24


class TokenPayload(TypedDict):
    """Type definition for JWT token payload.

    Attributes:
        user_id: The user's database ID.
        email: The user's email address.
        exp: Token expiration timestamp.
        iat: Token issued-at timestamp.
    """

    user_id: int
    email: str
    exp: datetime
    iat: datetime


def hash_password(password: str) -> str:
    """Hash a password using bcrypt.

    Uses bcrypt for secure password hashing with automatic salt generation.
    Each hash includes a unique salt, so the same password produces different
    hashes each time (this is expected and secure behavior).

    Args:
        password: The plain text password to hash.

    Returns:
        The bcrypt hashed password string (starts with $2b$).

    Example:
        >>> hashed = hash_password("my_secure_password")
        >>> hashed.startswith("$2b$")
        True
    """
    # Encode password to bytes, truncate to 72 bytes (bcrypt limit)
    password_bytes = password.encode("utf-8")[:72]
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash.

    Uses bcrypt's constant-time comparison to prevent timing attacks.

    Args:
        plain_password: The plain text password to verify.
        hashed_password: The bcrypt hash to verify against.

    Returns:
        True if the password matches, False otherwise.

    Example:
        >>> hashed = hash_password("my_password")
        >>> verify_password("my_password", hashed)
        True
        >>> verify_password("wrong_password", hashed)
        False
    """
    try:
        # Encode both to bytes, truncate password to 72 bytes (bcrypt limit)
        password_bytes = plain_password.encode("utf-8")[:72]
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except (ValueError, TypeError):
        # Invalid hash format or other error
        return False


def create_access_token(
    user_id: int,
    email: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a JWT access token for a user.

    Generates a signed JWT token containing user identification and expiration.

    Args:
        user_id: The user's database ID.
        email: The user's email address.
        expires_delta: Optional custom expiration time. If not provided,
                      uses JWT_EXPIRATION_HOURS from environment (default: 24 hours).

    Returns:
        Encoded JWT token string.

    Raises:
        ValueError: If JWT_SECRET is not configured.

    Example:
        >>> token = create_access_token(user_id=1, email="user@example.com")
        >>> isinstance(token, str)
        True
    """
    now = datetime.now(timezone.utc)

    if expires_delta is None:
        expires_delta = timedelta(hours=_get_jwt_expiration_hours())

    expire = now + expires_delta

    payload = {
        "user_id": user_id,
        "email": email,
        "exp": expire,
        "iat": now,
    }

    return jwt.encode(
        payload,
        _get_jwt_secret(),
        algorithm=_get_jwt_algorithm(),
    )


def verify_access_token(token: str) -> Optional[TokenPayload]:
    """Verify and decode a JWT access token.

    Validates the token signature and expiration time.

    Args:
        token: The JWT token string to verify.

    Returns:
        TokenPayload dict containing user_id, email, exp, and iat if valid.
        None if the token is invalid, expired, or malformed.

    Example:
        >>> token = create_access_token(user_id=1, email="user@example.com")
        >>> payload = verify_access_token(token)
        >>> payload["user_id"]
        1
        >>> payload["email"]
        'user@example.com'
    """
    try:
        payload = jwt.decode(
            token,
            _get_jwt_secret(),
            algorithms=[_get_jwt_algorithm()],
        )

        # Convert timestamps back to datetime objects
        return TokenPayload(
            user_id=payload["user_id"],
            email=payload["email"],
            exp=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
            iat=datetime.fromtimestamp(payload["iat"], tz=timezone.utc),
        )

    except jwt.ExpiredSignatureError:
        # Token has expired
        return None
    except jwt.InvalidTokenError:
        # Token is invalid (malformed, bad signature, etc.)
        return None
