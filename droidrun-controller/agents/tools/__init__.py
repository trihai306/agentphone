"""
Tools Package - Device interaction and control (DroidRun standard)

Provides:
- Tools: Abstract base class for all tools
- DeviceTools: Main device interaction class (Android)
- UIElement, PhoneState, DeviceState: Data types
- describe_tools: Helper to expose tools for LLM
"""

from agents.tools.base import Tools, ToolResult, describe_tools
from agents.tools.types import UIElement, PhoneState, DeviceState
from agents.tools.device import DeviceTools

__all__ = [
    # Base class
    "Tools",
    "ToolResult",
    "describe_tools",

    # Device tools
    "DeviceTools",

    # Types
    "UIElement",
    "PhoneState",
    "DeviceState",
]
