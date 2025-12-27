"""Views package for Droidrun Controller."""

from .devices import DevicesView
from .workflows import WorkflowsView
from .executions import ExecutionsView
from .settings import SettingsView
from .agent_runner import AgentRunnerView
from .login import LoginView
from .registration import RegistrationView
from .forgot_password import ForgotPasswordView

__all__ = [
    "DevicesView",
    "WorkflowsView",
    "ExecutionsView",
    "SettingsView",
    "AgentRunnerView",
    "LoginView",
    "RegistrationView",
    "ForgotPasswordView",
]
