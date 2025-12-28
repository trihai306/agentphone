"""Pydantic v2 models for authentication request/response validation.

This module defines the data models for authentication:
- UserRegisterRequest: Request model for user registration
- UserLoginRequest: Request model for user login
- AuthResponse: Response model for authentication operations

All models use Pydantic v2 syntax:
- model_dump() instead of dict()
- field_validator with @classmethod decorator
- Field() for constraints
"""

import re
from typing import Optional

from pydantic import BaseModel, Field, field_validator, EmailStr


# Email validation regex - standard RFC 5322 simplified pattern
EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
)


class UserRegisterRequest(BaseModel):
    """Request model for user registration.

    Validates email format and password strength requirements.

    Attributes:
        email: User's email address (must be valid format).
        password: User's password (minimum 8 characters, must contain letter and number).
    """

    email: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="User's email address",
    )
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="User's password (minimum 8 characters)",
    )

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        """Validate email format and normalize to lowercase.

        Args:
            v: The email value to validate.

        Returns:
            Normalized (lowercase, stripped) email.

        Raises:
            ValueError: If email format is invalid.
        """
        email = v.strip().lower()

        if not email:
            raise ValueError("Email is required")

        if not EMAIL_REGEX.match(email):
            raise ValueError("Invalid email format")

        return email

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength requirements.

        Requirements:
        - Minimum 8 characters (enforced by Field constraint)
        - At least one letter
        - At least one number

        Args:
            v: The password value to validate.

        Returns:
            The validated password.

        Raises:
            ValueError: If password doesn't meet strength requirements.
        """
        if not v:
            raise ValueError("Password is required")

        if not re.search(r"[a-zA-Z]", v):
            raise ValueError("Password must contain at least one letter")

        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")

        return v

    def to_dict(self) -> dict:
        """Convert to dictionary using Pydantic v2 syntax."""
        return self.model_dump()


class UserLoginRequest(BaseModel):
    """Request model for user login.

    Validates that email and password are provided.

    Attributes:
        email: User's email address.
        password: User's password.
    """

    email: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="User's email address",
    )
    password: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="User's password",
    )

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        """Normalize email to lowercase and strip whitespace.

        Args:
            v: The email value to validate.

        Returns:
            Normalized (lowercase, stripped) email.

        Raises:
            ValueError: If email is empty.
        """
        email = v.strip().lower()

        if not email:
            raise ValueError("Email is required")

        return email

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate that password is not empty.

        Args:
            v: The password value to validate.

        Returns:
            The password.

        Raises:
            ValueError: If password is empty.
        """
        if not v:
            raise ValueError("Password is required")

        return v

    def to_dict(self) -> dict:
        """Convert to dictionary using Pydantic v2 syntax."""
        return self.model_dump()


class AuthResponse(BaseModel):
    """Response model for authentication operations.

    Used for both registration and login responses.

    Attributes:
        success: Whether the operation was successful.
        message: Human-readable message about the result.
        user_id: The user's database ID (present on success).
        email: The user's email address (present on success).
        token: JWT access token (present on successful login).
    """

    success: bool = Field(
        ...,
        description="Whether the operation was successful",
    )
    message: str = Field(
        ...,
        min_length=1,
        description="Human-readable result message",
    )
    user_id: Optional[int] = Field(
        default=None,
        description="The user's database ID (on success)",
    )
    email: Optional[str] = Field(
        default=None,
        max_length=255,
        description="The user's email address (on success)",
    )
    token: Optional[str] = Field(
        default=None,
        description="JWT access token (on successful login)",
    )

    def to_dict(self) -> dict:
        """Convert to dictionary using Pydantic v2 syntax."""
        return self.model_dump()

    def to_json(self) -> str:
        """Convert to JSON string."""
        return self.model_dump_json()

    @classmethod
    def success_response(
        cls,
        message: str,
        user_id: int,
        email: str,
        token: Optional[str] = None,
    ) -> "AuthResponse":
        """Create a successful auth response.

        Args:
            message: Success message.
            user_id: The user's database ID.
            email: The user's email address.
            token: Optional JWT token (for login responses).

        Returns:
            AuthResponse configured for success.
        """
        return cls(
            success=True,
            message=message,
            user_id=user_id,
            email=email,
            token=token,
        )

    @classmethod
    def error_response(cls, message: str) -> "AuthResponse":
        """Create an error auth response.

        Args:
            message: Error message.

        Returns:
            AuthResponse configured for error.
        """
        return cls(
            success=False,
            message=message,
        )
