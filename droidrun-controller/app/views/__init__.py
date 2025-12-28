"""Views package for Droidrun Controller."""

from .devices import DevicesView
from .workflows import WorkflowsView
from .executions import ExecutionsView
from .settings import SettingsView
from .agent_runner import AgentRunnerView
from .recording_panel import RecordingPanelView
from .register import RegisterView
from .login import LoginView

__all__ = [
    "DevicesView",
    "WorkflowsView",
    "ExecutionsView",
    "SettingsView",
    "AgentRunnerView",
    "RecordingPanelView",
    "RegisterView",
    "LoginView",
]
