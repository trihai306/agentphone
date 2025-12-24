"""
Trajectory - Action recording and replay (DroidRun standard)

Provides:
- Trajectory: Record agent actions for analysis/replay
- TrajectoryWriter: Save trajectories to files
- TrajectoryStep: Single step in a trajectory
"""

import os
import json
import logging
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Dict, List, Any, Optional
from enum import Enum

logger = logging.getLogger("agents.core.trajectory")


class ActionStatus(Enum):
    """Status of an action"""
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class TrajectoryStep:
    """Single step in a trajectory"""
    step_number: int
    action_type: str
    action_params: Dict[str, Any]
    reasoning: str
    status: ActionStatus = ActionStatus.PENDING
    result: Optional[str] = None
    error: Optional[str] = None
    screenshot_path: Optional[str] = None
    ui_state: Optional[Dict] = None
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    duration_ms: float = 0.0

    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        data = asdict(self)
        data["status"] = self.status.value
        return data

    @classmethod
    def from_dict(cls, data: Dict) -> "TrajectoryStep":
        """Create from dictionary"""
        data["status"] = ActionStatus(data.get("status", "pending"))
        return cls(**data)


@dataclass
class Trajectory:
    """
    Record of agent execution trajectory (DroidRun standard)

    Stores all steps taken by the agent for:
    - Analysis and debugging
    - Replay and testing
    - Training data collection
    """
    goal: str
    steps: List[TrajectoryStep] = field(default_factory=list)
    start_time: str = field(default_factory=lambda: datetime.now().isoformat())
    end_time: Optional[str] = None
    success: bool = False
    final_message: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)

    # Session info
    device_serial: Optional[str] = None
    model_name: Optional[str] = None
    provider: Optional[str] = None

    def add_step(
        self,
        action_type: str,
        action_params: Dict[str, Any],
        reasoning: str,
        **kwargs
    ) -> TrajectoryStep:
        """
        Add a new step to the trajectory

        Args:
            action_type: Type of action (tap, swipe, input, etc.)
            action_params: Action parameters
            reasoning: LLM reasoning for this action
            **kwargs: Additional step attributes

        Returns:
            The created TrajectoryStep
        """
        step = TrajectoryStep(
            step_number=len(self.steps) + 1,
            action_type=action_type,
            action_params=action_params,
            reasoning=reasoning,
            **kwargs
        )
        self.steps.append(step)
        return step

    def update_step(
        self,
        step_number: int,
        status: ActionStatus,
        result: Optional[str] = None,
        error: Optional[str] = None,
        duration_ms: float = 0.0,
        **kwargs
    ) -> Optional[TrajectoryStep]:
        """
        Update an existing step

        Args:
            step_number: Step number to update
            status: New status
            result: Action result
            error: Error message if failed
            duration_ms: Execution duration
            **kwargs: Additional updates

        Returns:
            Updated step or None if not found
        """
        for step in self.steps:
            if step.step_number == step_number:
                step.status = status
                step.result = result
                step.error = error
                step.duration_ms = duration_ms
                for key, value in kwargs.items():
                    if hasattr(step, key):
                        setattr(step, key, value)
                return step
        return None

    def complete(self, success: bool, message: str = ""):
        """Mark trajectory as complete"""
        self.end_time = datetime.now().isoformat()
        self.success = success
        self.final_message = message

    def get_last_step(self) -> Optional[TrajectoryStep]:
        """Get the last step"""
        return self.steps[-1] if self.steps else None

    def get_successful_steps(self) -> List[TrajectoryStep]:
        """Get all successful steps"""
        return [s for s in self.steps if s.status == ActionStatus.SUCCESS]

    def get_failed_steps(self) -> List[TrajectoryStep]:
        """Get all failed steps"""
        return [s for s in self.steps if s.status == ActionStatus.FAILED]

    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            "goal": self.goal,
            "steps": [s.to_dict() for s in self.steps],
            "start_time": self.start_time,
            "end_time": self.end_time,
            "success": self.success,
            "final_message": self.final_message,
            "metadata": self.metadata,
            "device_serial": self.device_serial,
            "model_name": self.model_name,
            "provider": self.provider,
            "total_steps": len(self.steps),
            "successful_steps": len(self.get_successful_steps()),
            "failed_steps": len(self.get_failed_steps()),
        }

    @classmethod
    def from_dict(cls, data: Dict) -> "Trajectory":
        """Create from dictionary"""
        steps = [TrajectoryStep.from_dict(s) for s in data.get("steps", [])]
        return cls(
            goal=data["goal"],
            steps=steps,
            start_time=data.get("start_time", ""),
            end_time=data.get("end_time"),
            success=data.get("success", False),
            final_message=data.get("final_message", ""),
            metadata=data.get("metadata", {}),
            device_serial=data.get("device_serial"),
            model_name=data.get("model_name"),
            provider=data.get("provider"),
        )

    def to_json(self, indent: int = 2) -> str:
        """Convert to JSON string"""
        return json.dumps(self.to_dict(), indent=indent)

    @classmethod
    def from_json(cls, json_str: str) -> "Trajectory":
        """Create from JSON string"""
        return cls.from_dict(json.loads(json_str))


class TrajectoryWriter:
    """
    Write trajectories to files (DroidRun standard)

    Saves trajectories in JSON format for:
    - Post-execution analysis
    - Replay testing
    - Training data collection
    """

    def __init__(
        self,
        output_dir: str = "./trajectories",
        save_screenshots: bool = True,
        save_ui_states: bool = True
    ):
        """
        Initialize TrajectoryWriter

        Args:
            output_dir: Directory to save trajectories
            save_screenshots: Whether to save screenshots
            save_ui_states: Whether to save UI states
        """
        self.output_dir = output_dir
        self.save_screenshots = save_screenshots
        self.save_ui_states = save_ui_states

        os.makedirs(output_dir, exist_ok=True)

    def save(self, trajectory: Trajectory, filename: Optional[str] = None) -> str:
        """
        Save trajectory to file

        Args:
            trajectory: Trajectory to save
            filename: Optional filename (auto-generated if not provided)

        Returns:
            Path to saved file
        """
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            goal_slug = trajectory.goal[:30].replace(" ", "_").replace("/", "_")
            filename = f"trajectory_{timestamp}_{goal_slug}.json"

        filepath = os.path.join(self.output_dir, filename)

        with open(filepath, 'w') as f:
            f.write(trajectory.to_json())

        logger.info(f"Trajectory saved: {filepath}")
        return filepath

    def load(self, filepath: str) -> Trajectory:
        """
        Load trajectory from file

        Args:
            filepath: Path to trajectory file

        Returns:
            Loaded Trajectory
        """
        with open(filepath, 'r') as f:
            return Trajectory.from_json(f.read())

    def list_trajectories(self) -> List[str]:
        """
        List all trajectory files in output directory

        Returns:
            List of file paths
        """
        files = []
        for f in os.listdir(self.output_dir):
            if f.endswith(".json"):
                files.append(os.path.join(self.output_dir, f))
        return sorted(files, reverse=True)

    def save_step_screenshot(
        self,
        trajectory: Trajectory,
        step_number: int,
        screenshot_bytes: bytes
    ) -> Optional[str]:
        """
        Save screenshot for a step

        Args:
            trajectory: Trajectory instance
            step_number: Step number
            screenshot_bytes: PNG image bytes

        Returns:
            Path to saved screenshot or None
        """
        if not self.save_screenshots or not screenshot_bytes:
            return None

        screenshots_dir = os.path.join(self.output_dir, "screenshots")
        os.makedirs(screenshots_dir, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"step_{step_number}_{timestamp}.png"
        filepath = os.path.join(screenshots_dir, filename)

        with open(filepath, 'wb') as f:
            f.write(screenshot_bytes)

        # Update step with screenshot path
        for step in trajectory.steps:
            if step.step_number == step_number:
                step.screenshot_path = filepath
                break

        return filepath


# ============================================================================
# TRAJECTORY ANALYSIS HELPERS
# ============================================================================

def analyze_trajectory(trajectory: Trajectory) -> Dict[str, Any]:
    """
    Analyze a trajectory for insights

    Args:
        trajectory: Trajectory to analyze

    Returns:
        Analysis results
    """
    total_steps = len(trajectory.steps)
    successful_steps = len(trajectory.get_successful_steps())
    failed_steps = len(trajectory.get_failed_steps())

    action_counts = {}
    for step in trajectory.steps:
        action_counts[step.action_type] = action_counts.get(step.action_type, 0) + 1

    total_duration = sum(s.duration_ms for s in trajectory.steps)

    return {
        "goal": trajectory.goal,
        "success": trajectory.success,
        "total_steps": total_steps,
        "successful_steps": successful_steps,
        "failed_steps": failed_steps,
        "success_rate": successful_steps / total_steps if total_steps > 0 else 0,
        "action_distribution": action_counts,
        "total_duration_ms": total_duration,
        "average_step_duration_ms": total_duration / total_steps if total_steps > 0 else 0,
        "start_time": trajectory.start_time,
        "end_time": trajectory.end_time,
    }


def compare_trajectories(
    trajectory1: Trajectory,
    trajectory2: Trajectory
) -> Dict[str, Any]:
    """
    Compare two trajectories

    Args:
        trajectory1: First trajectory
        trajectory2: Second trajectory

    Returns:
        Comparison results
    """
    analysis1 = analyze_trajectory(trajectory1)
    analysis2 = analyze_trajectory(trajectory2)

    return {
        "trajectory1": analysis1,
        "trajectory2": analysis2,
        "step_difference": analysis1["total_steps"] - analysis2["total_steps"],
        "duration_difference_ms": analysis1["total_duration_ms"] - analysis2["total_duration_ms"],
        "both_successful": trajectory1.success and trajectory2.success,
    }
