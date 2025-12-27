"""Pydantic v2 models for workflow recording and replay.

This module defines the data models for smart action recording:
- ElementSelector: Strategies to locate UI elements (resource-id, xpath, content-desc, bounds)
- WorkflowStep: Individual action in a workflow (tap, swipe, input_text, wait)
- Workflow: Complete workflow with metadata and steps

All models use Pydantic v2 syntax:
- model_dump() instead of dict()
- field_validator with @classmethod decorator
- Field() for constraints
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional, Union, Literal
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator, model_validator


class SelectorType(str, Enum):
    """Types of element selectors in priority order."""
    RESOURCE_ID = "resource-id"
    CONTENT_DESC = "content-desc"
    XPATH = "xpath"
    BOUNDS = "bounds"
    TEXT = "text"


class ActionType(str, Enum):
    """Types of workflow actions."""
    TAP = "tap"
    LONG_TAP = "long_tap"
    SWIPE = "swipe"
    INPUT_TEXT = "input_text"
    WAIT = "wait"
    SCROLL = "scroll"


class SwipeDirection(str, Enum):
    """Swipe direction for swipe actions."""
    UP = "up"
    DOWN = "down"
    LEFT = "left"
    RIGHT = "right"


class ElementSelector(BaseModel):
    """Represents a strategy to locate a UI element.

    Selectors are generated with confidence scores based on reliability:
    - resource-id: 0.95 (most stable, but app-specific)
    - content-desc: 0.85 (accessibility label, fairly stable)
    - text: 0.75 (visible text, may change with translations)
    - xpath: 0.70 (hierarchy path, fragile to UI changes)
    - bounds: 0.50 (pixel coordinates, least reliable)

    Attributes:
        type: The selector strategy type.
        value: The selector value (e.g., "com.app:id/login_btn", "//Button[@text='Login']").
        confidence: Reliability score between 0.0 and 1.0.
        fallback: Optional fallback selector if primary fails.
    """
    type: SelectorType
    value: str = Field(..., min_length=1)
    confidence: float = Field(ge=0.0, le=1.0, default=0.5)
    fallback: Optional["ElementSelector"] = None

    @field_validator("value")
    @classmethod
    def validate_value(cls, v: str) -> str:
        """Validate that selector value is not empty or whitespace."""
        stripped = v.strip()
        if not stripped:
            raise ValueError("Selector value cannot be empty or whitespace")
        return stripped

    @field_validator("confidence")
    @classmethod
    def validate_confidence(cls, v: float) -> float:
        """Ensure confidence is within valid range."""
        return max(0.0, min(1.0, v))

    def to_dict(self) -> dict:
        """Convert to dictionary using Pydantic v2 syntax."""
        return self.model_dump()


class TapData(BaseModel):
    """Additional data for tap actions."""
    x: Optional[int] = None
    y: Optional[int] = None
    duration_ms: int = Field(default=100, ge=0)


class SwipeData(BaseModel):
    """Additional data for swipe actions."""
    direction: SwipeDirection
    start_x: Optional[int] = None
    start_y: Optional[int] = None
    end_x: Optional[int] = None
    end_y: Optional[int] = None
    duration_ms: int = Field(default=300, ge=0)


class InputTextData(BaseModel):
    """Additional data for text input actions."""
    text: str = Field(..., min_length=0)
    clear_first: bool = False

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        """Text can be empty for clearing a field."""
        return v


class WaitData(BaseModel):
    """Additional data for wait actions."""
    duration_ms: int = Field(default=1000, ge=0, le=60000)
    wait_for_element: bool = False


class WorkflowStep(BaseModel):
    """Represents a single action in a workflow.

    Each step captures:
    - The action type (tap, swipe, input_text, wait)
    - Element selector for locating the target
    - Human-readable name (auto-generated or user-edited)
    - Optional action-specific data

    Attributes:
        id: Unique identifier for the step.
        action: Type of action to perform.
        selector: Element selector for the action target.
        name: Human-readable step name (e.g., "Tap Login Button").
        description: Optional detailed description.
        order: Position in the workflow sequence.
        tap_data: Additional data for tap actions.
        swipe_data: Additional data for swipe actions.
        input_data: Additional data for text input actions.
        wait_data: Additional data for wait actions.
        timestamp: When the action was recorded (if from recording).
        screenshot_before: Path to screenshot taken before action.
        screenshot_after: Path to screenshot taken after action.
        metadata: Additional metadata captured during recording.
    """
    id: str = Field(default_factory=lambda: str(uuid4()))
    action: ActionType
    selector: Optional[ElementSelector] = None
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    order: int = Field(default=0, ge=0)

    # Action-specific data
    tap_data: Optional[TapData] = None
    swipe_data: Optional[SwipeData] = None
    input_data: Optional[InputTextData] = None
    wait_data: Optional[WaitData] = None

    # Recording metadata
    timestamp: Optional[datetime] = None
    screenshot_before: Optional[str] = None
    screenshot_after: Optional[str] = None
    metadata: Optional[dict] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate step name is not empty."""
        stripped = v.strip()
        if not stripped:
            raise ValueError("Step name cannot be empty")
        return stripped

    @model_validator(mode="after")
    def validate_action_data(self) -> "WorkflowStep":
        """Ensure action-specific data matches action type."""
        # Wait actions don't require a selector
        if self.action == ActionType.WAIT:
            if self.wait_data is None:
                self.wait_data = WaitData()
        # Other actions typically need selectors (but not strictly required for bounds-based)
        return self

    def to_dict(self) -> dict:
        """Convert to dictionary using Pydantic v2 syntax."""
        return self.model_dump()


class Workflow(BaseModel):
    """Represents a complete workflow with multiple steps.

    A workflow is a sequence of recorded or manually created actions
    that can be replayed on an Android device.

    Attributes:
        id: Unique identifier for the workflow.
        name: Human-readable workflow name.
        description: Optional detailed description.
        steps: List of workflow steps in execution order.
        is_active: Whether the workflow is enabled for execution.
        created_at: When the workflow was created.
        updated_at: When the workflow was last modified.
        device_info: Information about the device used during recording.
        app_package: Package name of the app (if app-specific).
        tags: Optional tags for categorization.
        version: Workflow version for tracking changes.
    """
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    steps: List[WorkflowStep] = Field(default_factory=list)
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Recording context
    device_info: Optional[dict] = None
    app_package: Optional[str] = None

    # Organization
    tags: List[str] = Field(default_factory=list)
    version: int = Field(default=1, ge=1)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate workflow name is not empty."""
        stripped = v.strip()
        if not stripped:
            raise ValueError("Workflow name cannot be empty")
        return stripped

    @field_validator("steps")
    @classmethod
    def validate_steps(cls, v: List[WorkflowStep]) -> List[WorkflowStep]:
        """Ensure steps have correct order values."""
        for i, step in enumerate(v):
            step.order = i
        return v

    def add_step(self, step: WorkflowStep) -> None:
        """Add a step to the workflow."""
        step.order = len(self.steps)
        self.steps.append(step)
        self.updated_at = datetime.utcnow()

    def remove_step(self, step_id: str) -> bool:
        """Remove a step by ID."""
        original_length = len(self.steps)
        self.steps = [s for s in self.steps if s.id != step_id]
        if len(self.steps) < original_length:
            # Reorder remaining steps
            for i, step in enumerate(self.steps):
                step.order = i
            self.updated_at = datetime.utcnow()
            return True
        return False

    def reorder_steps(self, step_ids: List[str]) -> None:
        """Reorder steps based on the provided ID list."""
        id_to_step = {s.id: s for s in self.steps}
        reordered = []
        for step_id in step_ids:
            if step_id in id_to_step:
                step = id_to_step[step_id]
                step.order = len(reordered)
                reordered.append(step)
        self.steps = reordered
        self.updated_at = datetime.utcnow()

    def get_step_by_id(self, step_id: str) -> Optional[WorkflowStep]:
        """Get a step by its ID."""
        for step in self.steps:
            if step.id == step_id:
                return step
        return None

    def to_dict(self) -> dict:
        """Convert to dictionary using Pydantic v2 syntax."""
        return self.model_dump()

    def to_json(self) -> str:
        """Convert to JSON string."""
        return self.model_dump_json()

    @classmethod
    def from_json(cls, json_str: str) -> "Workflow":
        """Create a Workflow from JSON string."""
        return cls.model_validate_json(json_str)

    @property
    def step_count(self) -> int:
        """Get the number of steps in the workflow."""
        return len(self.steps)
