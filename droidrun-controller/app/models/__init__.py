"""Pydantic models for workflow recording and replay, and authentication."""

from app.models.workflow import (
    ElementSelector,
    WorkflowStep,
    Workflow,
    SelectorType,
    ActionType,
    SwipeDirection,
    SwipeData,
    InputTextData,
    WaitData,
    TapData,
)

from app.models.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    AuthResponse,
)

__all__ = [
    # Workflow models
    "ElementSelector",
    "WorkflowStep",
    "Workflow",
    "SelectorType",
    "ActionType",
    "SwipeDirection",
    "SwipeData",
    "InputTextData",
    "WaitData",
    "TapData",
    # Auth models
    "UserRegisterRequest",
    "UserLoginRequest",
    "AuthResponse",
]
