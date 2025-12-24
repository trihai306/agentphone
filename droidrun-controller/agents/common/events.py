"""
Events - Agent event system for tracking and callbacks

Provides:
- Event types for agent lifecycle
- EventEmitter for pub/sub pattern
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional
from enum import Enum


class EventType(Enum):
    """Agent event types"""
    # Lifecycle events
    AGENT_START = "agent_start"
    AGENT_STOP = "agent_stop"
    AGENT_ERROR = "agent_error"

    # Execution events
    STEP_START = "step_start"
    STEP_COMPLETE = "step_complete"
    STEP_ERROR = "step_error"

    # Action events
    ACTION_DECIDE = "action_decide"
    ACTION_EXECUTE = "action_execute"
    ACTION_SUCCESS = "action_success"
    ACTION_FAIL = "action_fail"

    # State events
    STATE_UPDATE = "state_update"
    SCREENSHOT_TAKEN = "screenshot_taken"

    # LLM events
    LLM_REQUEST = "llm_request"
    LLM_RESPONSE = "llm_response"
    LLM_ERROR = "llm_error"

    # Goal events
    GOAL_START = "goal_start"
    GOAL_COMPLETE = "goal_complete"
    GOAL_FAIL = "goal_fail"


@dataclass
class Event:
    """Base event class"""
    type: EventType
    timestamp: datetime = field(default_factory=datetime.now)
    data: Dict[str, Any] = field(default_factory=dict)

    def __str__(self) -> str:
        return f"[{self.timestamp.strftime('%H:%M:%S')}] {self.type.value}: {self.data}"


@dataclass
class StepEvent(Event):
    """Step-related event"""
    step: int = 0
    goal: str = ""


@dataclass
class ActionEvent(Event):
    """Action-related event"""
    action_type: str = ""
    params: Dict[str, Any] = field(default_factory=dict)
    reasoning: str = ""


class EventEmitter:
    """
    Simple event emitter for agent lifecycle events

    Usage:
        emitter = EventEmitter()

        @emitter.on(EventType.STEP_COMPLETE)
        def on_step(event):
            print(f"Step {event.step} complete")

        emitter.emit(StepEvent(type=EventType.STEP_COMPLETE, step=1))
    """

    def __init__(self):
        self._listeners: Dict[EventType, List[Callable]] = {}
        self._history: List[Event] = []
        self._max_history = 100

    def on(self, event_type: EventType):
        """Decorator to register event listener"""
        def decorator(func: Callable):
            if event_type not in self._listeners:
                self._listeners[event_type] = []
            self._listeners[event_type].append(func)
            return func
        return decorator

    def add_listener(self, event_type: EventType, callback: Callable):
        """Add event listener"""
        if event_type not in self._listeners:
            self._listeners[event_type] = []
        self._listeners[event_type].append(callback)

    def remove_listener(self, event_type: EventType, callback: Callable):
        """Remove event listener"""
        if event_type in self._listeners:
            self._listeners[event_type] = [
                cb for cb in self._listeners[event_type] if cb != callback
            ]

    def emit(self, event: Event):
        """Emit event to all listeners"""
        # Store in history
        self._history.append(event)
        if len(self._history) > self._max_history:
            self._history = self._history[-self._max_history:]

        # Notify listeners
        if event.type in self._listeners:
            for callback in self._listeners[event.type]:
                try:
                    callback(event)
                except Exception as e:
                    # Don't let listener errors break execution
                    pass

    def get_history(self, event_type: Optional[EventType] = None) -> List[Event]:
        """Get event history, optionally filtered by type"""
        if event_type:
            return [e for e in self._history if e.type == event_type]
        return self._history.copy()

    def clear_history(self):
        """Clear event history"""
        self._history = []


# Global event emitter for agent events
agent_events = EventEmitter()
