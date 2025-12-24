"""
Tools Types - Data classes for device interaction

Provides:
- UIElement: UI component representation
- PhoneState: Device state information
- DeviceState: Combined state snapshot
"""

from typing import Dict, List, Tuple
from dataclasses import dataclass


@dataclass
class UIElement:
    """Represents a UI element on screen"""
    index: int
    text: str
    class_name: str
    bounds: str  # "left,top,right,bottom"
    center_x: int
    center_y: int
    width: int
    height: int
    clickable: bool
    focusable: bool
    children: List['UIElement']
    raw_data: Dict

    @property
    def bounds_tuple(self) -> Tuple[int, int, int, int]:
        """Parse bounds string to tuple (left, top, right, bottom)"""
        try:
            parts = self.bounds.split(",")
            return tuple(map(int, parts))
        except:
            return (0, 0, 0, 0)


@dataclass
class PhoneState:
    """Current device state"""
    current_app: str
    current_activity: str
    screen_width: int
    screen_height: int
    is_screen_on: bool
    orientation: str  # portrait/landscape


@dataclass
class DeviceState:
    """Combined device state snapshot"""
    elements: List[UIElement]
    phone_state: PhoneState
    raw_a11y_tree: List[Dict]
    timestamp: float
