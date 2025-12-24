"""
Core Package - Agent core logic and execution (DroidRun standard)

Components:
- DroidAgent: Main agent with Manager-Executor pattern
- ManagerAgent: Planning agent for complex tasks
- ExecutorAgent: Action execution agent
- Trajectory: Action tracking and replay
"""

from agents.core.types import AgentAction, StepResult, ExecutionResult
from agents.core.executor import ActionExecutor, ExecutorAgent, ExecutorResult
from agents.core.manager import (
    ManagerAgent,
    StatelessManagerAgent,
    ExecutionPlan,
    Subgoal,
    SubgoalStatus
)
from agents.core.trajectory import (
    Trajectory,
    TrajectoryStep,
    TrajectoryWriter,
    ActionStatus,
    analyze_trajectory,
    compare_trajectories
)
from agents.core.agent import DroidAgent, SmartAgent, Agent, ReasoningMode, run

__all__ = [
    # Types
    "AgentAction",
    "StepResult",
    "ExecutionResult",

    # Agent (DroidRun standard)
    "DroidAgent",
    "ReasoningMode",

    # Manager-Executor pattern
    "ManagerAgent",
    "StatelessManagerAgent",
    "ExecutionPlan",
    "Subgoal",
    "SubgoalStatus",
    "ExecutorAgent",
    "ExecutorResult",

    # Trajectory
    "Trajectory",
    "TrajectoryStep",
    "TrajectoryWriter",
    "ActionStatus",
    "analyze_trajectory",
    "compare_trajectories",

    # Legacy (backward compatibility)
    "ActionExecutor",
    "SmartAgent",
    "Agent",
    "run",
]
