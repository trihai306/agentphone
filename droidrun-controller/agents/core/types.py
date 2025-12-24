"""
Core Types - Data classes for agent execution
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field


@dataclass
class AgentAction:
    """Action that agent decides to perform"""
    action_type: str  # tap, tap_element, swipe, input, press_key, scroll, wait, complete
    params: Dict[str, Any]
    reasoning: str


@dataclass
class StepResult:
    """Result of a single step"""
    step: int
    action: AgentAction
    success: bool
    message: str
    screenshot_path: Optional[str] = None


@dataclass
class ExecutionResult:
    """Final execution result"""
    success: bool
    message: str
    steps: List[StepResult] = field(default_factory=list)
    total_steps: int = 0
    execution_time: float = 0.0
    screenshots: List[str] = field(default_factory=list)
    error: Optional[Exception] = None
