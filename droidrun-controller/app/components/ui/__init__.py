"""UI Components Package - Bootstrap-style reusable components.

Provides a consistent set of UI components for the Droidrun Controller app.
All components support dark/light mode and follow the design system.

Example:
    from app.components.ui import TextField, SearchInput, PasswordInput
    
    # Create a text field
    email_field = TextField(
        label="Email",
        placeholder="Enter your email",
        prefix_icon=ft.Icons.EMAIL
    )
"""

from .input import TextField, SearchInput, PasswordInput, InputSize

__all__ = [
    # Input components
    "TextField",
    "SearchInput", 
    "PasswordInput",
    "InputSize",
]
