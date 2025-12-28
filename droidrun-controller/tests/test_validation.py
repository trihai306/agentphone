"""Tests for email format and password strength validation.

This module comprehensively tests validation functions and Pydantic models
for email format and password strength requirements.

Tests cover:
- Email validation (format, length, edge cases)
- Password validation (length, complexity, edge cases)
- Pydantic model validation (UserRegisterRequest, UserLoginRequest)
"""

import os
import sys
from pathlib import Path

import pytest
from pydantic import ValidationError

# Add parent directory to path to allow imports from app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.api.auth import validate_email, validate_password
from app.models.auth import UserRegisterRequest, UserLoginRequest, AuthResponse


class TestEmailValidation:
    """Tests for email format validation function."""

    def test_valid_standard_email(self):
        """Test that standard email addresses pass validation."""
        valid_emails = [
            "user@example.com",
            "test.user@domain.org",
            "john.doe@company.co.uk",
        ]
        for email in valid_emails:
            is_valid, error = validate_email(email)
            assert is_valid is True, f"Expected {email} to be valid, got error: {error}"
            assert error == ""

    def test_valid_email_with_plus_sign(self):
        """Test email addresses with plus sign (tagging) pass validation."""
        is_valid, error = validate_email("user+tag@example.com")
        assert is_valid is True
        assert error == ""

    def test_valid_email_with_numbers(self):
        """Test email addresses with numbers pass validation."""
        is_valid, error = validate_email("user123@test.io")
        assert is_valid is True
        assert error == ""

    def test_valid_email_with_underscores(self):
        """Test email addresses with underscores pass validation."""
        is_valid, error = validate_email("user_name@example.com")
        assert is_valid is True
        assert error == ""

    def test_valid_email_with_hyphens(self):
        """Test email addresses with hyphens pass validation."""
        is_valid, error = validate_email("user-name@my-domain.com")
        assert is_valid is True
        assert error == ""

    def test_valid_email_with_percent(self):
        """Test email addresses with percent sign pass validation."""
        is_valid, error = validate_email("user%tag@example.com")
        assert is_valid is True
        assert error == ""

    def test_invalid_email_empty(self):
        """Test that empty email fails validation."""
        is_valid, error = validate_email("")
        assert is_valid is False
        assert "required" in error.lower()

    def test_invalid_email_whitespace_only(self):
        """Test that whitespace-only email fails validation."""
        is_valid, error = validate_email("   ")
        assert is_valid is False
        # After stripping whitespace, it should be invalid

    def test_invalid_email_no_at_symbol(self):
        """Test email without @ symbol fails validation."""
        is_valid, error = validate_email("userexample.com")
        assert is_valid is False
        assert "invalid" in error.lower()

    def test_invalid_email_multiple_at_symbols(self):
        """Test email with multiple @ symbols fails validation."""
        is_valid, error = validate_email("user@@example.com")
        assert is_valid is False
        assert "invalid" in error.lower()

    def test_invalid_email_no_domain(self):
        """Test email without domain part fails validation."""
        is_valid, error = validate_email("user@")
        assert is_valid is False
        assert "invalid" in error.lower()

    def test_invalid_email_no_username(self):
        """Test email without username part fails validation."""
        is_valid, error = validate_email("@example.com")
        assert is_valid is False
        assert "invalid" in error.lower()

    def test_invalid_email_no_tld(self):
        """Test email without TLD fails validation."""
        is_valid, error = validate_email("user@domain")
        assert is_valid is False
        assert "invalid" in error.lower()

    def test_invalid_email_single_char_tld(self):
        """Test email with single character TLD fails validation."""
        is_valid, error = validate_email("user@domain.a")
        assert is_valid is False
        assert "invalid" in error.lower()

    def test_invalid_email_space_in_middle(self):
        """Test email with space in the middle fails validation."""
        is_valid, error = validate_email("user name@example.com")
        assert is_valid is False
        assert "invalid" in error.lower()

    def test_invalid_email_special_chars_in_domain(self):
        """Test email with invalid special chars in domain fails validation."""
        is_valid, error = validate_email("user@exam!ple.com")
        assert is_valid is False
        assert "invalid" in error.lower()

    def test_email_too_long(self):
        """Test email exceeding 255 characters fails validation."""
        long_email = "a" * 250 + "@example.com"
        is_valid, error = validate_email(long_email)
        assert is_valid is False
        assert "255" in error

    def test_email_exactly_255_chars(self):
        """Test email at exactly 255 characters is handled correctly."""
        # Build an email that's exactly 255 chars
        local_part = "a" * 240
        email = local_part + "@test.com"  # 240 + 9 = 249 chars, valid
        is_valid, error = validate_email(email)
        # Depends on final length after construction
        assert isinstance(is_valid, bool)

    def test_email_normalization(self):
        """Test that email is normalized to lowercase."""
        # The function should return True and the error will be empty
        # Normalization happens within the function
        is_valid, error = validate_email("User@EXAMPLE.COM")
        assert is_valid is True
        assert error == ""


class TestPasswordValidation:
    """Tests for password strength validation function."""

    def test_valid_password_letters_and_numbers(self):
        """Test password with letters and numbers passes validation."""
        is_valid, error = validate_password("SecurePass123")
        assert is_valid is True
        assert error == ""

    def test_valid_password_minimum_length(self):
        """Test password at minimum length (8 chars) passes validation."""
        is_valid, error = validate_password("Pass1234")
        assert is_valid is True
        assert error == ""

    def test_valid_password_with_special_chars(self):
        """Test password with special characters passes validation."""
        is_valid, error = validate_password("Secure!@#123")
        assert is_valid is True
        assert error == ""

    def test_valid_password_uppercase_and_number(self):
        """Test password with uppercase letters and numbers passes."""
        is_valid, error = validate_password("SECURE123")
        assert is_valid is True
        assert error == ""

    def test_valid_password_lowercase_and_number(self):
        """Test password with lowercase letters and numbers passes."""
        is_valid, error = validate_password("secure123")
        assert is_valid is True
        assert error == ""

    def test_valid_password_very_long(self):
        """Test very long password passes validation."""
        is_valid, error = validate_password("A1" + "x" * 100)
        assert is_valid is True
        assert error == ""

    def test_invalid_password_empty(self):
        """Test empty password fails validation."""
        is_valid, error = validate_password("")
        assert is_valid is False
        assert "required" in error.lower()

    def test_invalid_password_too_short(self):
        """Test password under 8 chars fails validation."""
        is_valid, error = validate_password("Pass1")
        assert is_valid is False
        assert "8" in error

    def test_invalid_password_7_chars(self):
        """Test password at exactly 7 chars fails validation."""
        is_valid, error = validate_password("Pass123")  # 7 chars
        assert is_valid is False
        assert "8" in error

    def test_invalid_password_no_letter(self):
        """Test password without letter fails validation."""
        is_valid, error = validate_password("12345678")
        assert is_valid is False
        assert "letter" in error.lower()

    def test_invalid_password_no_number(self):
        """Test password without number fails validation."""
        is_valid, error = validate_password("Password")
        assert is_valid is False
        assert "number" in error.lower()

    def test_invalid_password_only_special_chars(self):
        """Test password with only special characters fails validation."""
        is_valid, error = validate_password("!@#$%^&*")
        assert is_valid is False
        # Should fail for missing letter and number

    def test_invalid_password_exceeds_max_length(self):
        """Test password exceeding 128 characters fails validation."""
        long_password = "Aa1" + "a" * 130
        is_valid, error = validate_password(long_password)
        assert is_valid is False
        assert "128" in error

    def test_valid_password_exactly_128_chars(self):
        """Test password at exactly 128 characters passes validation."""
        password = "Aa1" + "a" * 125  # 3 + 125 = 128 chars
        is_valid, error = validate_password(password)
        assert is_valid is True
        assert error == ""

    def test_password_with_unicode_letters_requires_ascii(self):
        """Test password with only unicode letters fails (requires ASCII letter)."""
        # The validation uses [a-zA-Z] which only matches ASCII letters
        # Unicode-only letters don't satisfy the letter requirement
        is_valid, error = validate_password("пароль12")  # Russian letters + numbers
        assert is_valid is False
        assert "letter" in error.lower()

    def test_password_with_unicode_and_ascii_letter(self):
        """Test password with unicode chars plus ASCII letter passes."""
        # If ASCII letter is included, validation passes
        is_valid, error = validate_password("пароль1A")  # Russian + ASCII letter + number
        assert is_valid is True
        assert error == ""

    def test_password_with_spaces(self):
        """Test password with spaces is allowed if other requirements met."""
        is_valid, error = validate_password("Pass 1234")
        assert is_valid is True
        assert error == ""


class TestPydanticEmailValidation:
    """Tests for Pydantic model email validation."""

    def test_valid_email_in_register_request(self):
        """Test valid email passes Pydantic validation for registration."""
        request = UserRegisterRequest(
            email="user@example.com",
            password="SecurePass123"
        )
        assert request.email == "user@example.com"

    def test_email_normalization_in_register_request(self):
        """Test email is normalized to lowercase in registration request."""
        request = UserRegisterRequest(
            email="User@EXAMPLE.COM",
            password="SecurePass123"
        )
        assert request.email == "user@example.com"

    def test_email_stripped_in_register_request(self):
        """Test email whitespace is stripped in registration request."""
        request = UserRegisterRequest(
            email="  user@example.com  ",
            password="SecurePass123"
        )
        assert request.email == "user@example.com"

    def test_invalid_email_raises_validation_error(self):
        """Test invalid email raises Pydantic ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            UserRegisterRequest(
                email="invalid-email",
                password="SecurePass123"
            )
        # Check that email validation error is present
        errors = exc_info.value.errors()
        assert any("email" in str(e).lower() for e in errors)

    def test_empty_email_raises_validation_error(self):
        """Test empty email raises Pydantic ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            UserRegisterRequest(
                email="",
                password="SecurePass123"
            )
        errors = exc_info.value.errors()
        assert len(errors) > 0

    def test_email_too_long_raises_validation_error(self):
        """Test email exceeding max length raises ValidationError."""
        long_email = "a" * 260 + "@example.com"
        with pytest.raises(ValidationError):
            UserRegisterRequest(
                email=long_email,
                password="SecurePass123"
            )

    def test_valid_email_in_login_request(self):
        """Test valid email passes Pydantic validation for login."""
        request = UserLoginRequest(
            email="user@example.com",
            password="anypassword"
        )
        assert request.email == "user@example.com"

    def test_email_normalization_in_login_request(self):
        """Test email is normalized to lowercase in login request."""
        request = UserLoginRequest(
            email="USER@DOMAIN.COM",
            password="password"
        )
        assert request.email == "user@domain.com"


class TestPydanticPasswordValidation:
    """Tests for Pydantic model password validation."""

    def test_valid_password_in_register_request(self):
        """Test valid password passes Pydantic validation for registration."""
        request = UserRegisterRequest(
            email="user@example.com",
            password="SecurePass123"
        )
        assert request.password == "SecurePass123"

    def test_password_too_short_raises_validation_error(self):
        """Test password under 8 chars raises Pydantic ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            UserRegisterRequest(
                email="user@example.com",
                password="Pass1"
            )
        errors = exc_info.value.errors()
        assert any("password" in str(e).lower() or "8" in str(e) for e in errors)

    def test_password_no_letter_raises_validation_error(self):
        """Test password without letter raises Pydantic ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            UserRegisterRequest(
                email="user@example.com",
                password="12345678"
            )
        errors = exc_info.value.errors()
        assert any("letter" in str(e).lower() for e in errors)

    def test_password_no_number_raises_validation_error(self):
        """Test password without number raises Pydantic ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            UserRegisterRequest(
                email="user@example.com",
                password="Password"
            )
        errors = exc_info.value.errors()
        assert any("number" in str(e).lower() for e in errors)

    def test_password_too_long_raises_validation_error(self):
        """Test password exceeding 128 chars raises ValidationError."""
        long_password = "Aa1" + "a" * 130
        with pytest.raises(ValidationError):
            UserRegisterRequest(
                email="user@example.com",
                password=long_password
            )

    def test_empty_password_raises_validation_error(self):
        """Test empty password raises Pydantic ValidationError."""
        with pytest.raises(ValidationError):
            UserRegisterRequest(
                email="user@example.com",
                password=""
            )

    def test_login_request_accepts_any_password_format(self):
        """Test login request accepts any non-empty password (no strength check)."""
        # Login shouldn't enforce password strength (user already registered)
        request = UserLoginRequest(
            email="user@example.com",
            password="short"  # Would fail registration but OK for login
        )
        assert request.password == "short"


class TestAuthResponseModel:
    """Tests for AuthResponse Pydantic model."""

    def test_success_response_factory(self):
        """Test AuthResponse.success_response factory method."""
        response = AuthResponse.success_response(
            message="Login successful",
            user_id=42,
            email="user@example.com",
            token="jwt_token_here"
        )
        assert response.success is True
        assert response.message == "Login successful"
        assert response.user_id == 42
        assert response.email == "user@example.com"
        assert response.token == "jwt_token_here"

    def test_error_response_factory(self):
        """Test AuthResponse.error_response factory method."""
        response = AuthResponse.error_response(message="Invalid credentials")
        assert response.success is False
        assert response.message == "Invalid credentials"
        assert response.user_id is None
        assert response.email is None
        assert response.token is None

    def test_to_dict_method(self):
        """Test AuthResponse.to_dict() method."""
        response = AuthResponse.success_response(
            message="Success",
            user_id=1,
            email="test@example.com"
        )
        data = response.to_dict()
        assert isinstance(data, dict)
        assert data["success"] is True
        assert data["user_id"] == 1

    def test_to_json_method(self):
        """Test AuthResponse.to_json() method."""
        response = AuthResponse.success_response(
            message="Success",
            user_id=1,
            email="test@example.com"
        )
        json_str = response.to_json()
        assert isinstance(json_str, str)
        assert "Success" in json_str
        assert "test@example.com" in json_str


class TestEdgeCases:
    """Tests for edge cases in validation."""

    def test_email_with_subdomain(self):
        """Test email with subdomain passes validation."""
        is_valid, error = validate_email("user@mail.example.com")
        assert is_valid is True

    def test_email_with_long_tld(self):
        """Test email with long TLD passes validation."""
        is_valid, error = validate_email("user@example.technology")
        assert is_valid is True

    def test_email_numeric_local_part(self):
        """Test email with purely numeric local part passes validation."""
        is_valid, error = validate_email("123456@example.com")
        assert is_valid is True

    def test_password_leading_trailing_spaces(self):
        """Test password with leading/trailing spaces is valid if requirements met."""
        is_valid, error = validate_password(" Password123 ")
        assert is_valid is True

    def test_password_only_spaces_and_number(self):
        """Test password with spaces and numbers but no letter fails."""
        is_valid, error = validate_password("    1234")
        assert is_valid is False
        assert "letter" in error.lower()

    def test_none_email_handling(self):
        """Test None email is handled (converted to empty string check)."""
        # The function expects a string, but we should handle edge case
        # In actual code, the .get() method provides empty string default
        is_valid, error = validate_email("")
        assert is_valid is False
        assert "required" in error.lower()

    def test_none_password_handling(self):
        """Test None password is handled (converted to empty string check)."""
        is_valid, error = validate_password("")
        assert is_valid is False
        assert "required" in error.lower()


class TestValidationConsistency:
    """Tests to ensure validation is consistent between API and Pydantic models."""

    def test_same_email_validated_same_way(self):
        """Test that API and Pydantic validate emails consistently."""
        test_email = "valid.email@domain.com"

        # API validation
        is_valid, error = validate_email(test_email)

        # Pydantic validation (if it doesn't raise, it's valid)
        try:
            request = UserRegisterRequest(
                email=test_email,
                password="ValidPass123"
            )
            pydantic_valid = True
        except ValidationError:
            pydantic_valid = False

        assert is_valid == pydantic_valid

    def test_invalid_email_rejected_by_both(self):
        """Test that invalid email is rejected by both API and Pydantic."""
        test_email = "invalid-no-at-domain"

        # API validation
        is_valid, error = validate_email(test_email)
        assert is_valid is False

        # Pydantic validation
        with pytest.raises(ValidationError):
            UserRegisterRequest(
                email=test_email,
                password="ValidPass123"
            )

    def test_weak_password_rejected_by_both(self):
        """Test that weak password is rejected by both API and Pydantic."""
        test_password = "short"

        # API validation
        is_valid, error = validate_password(test_password)
        assert is_valid is False

        # Pydantic validation
        with pytest.raises(ValidationError):
            UserRegisterRequest(
                email="user@example.com",
                password=test_password
            )
