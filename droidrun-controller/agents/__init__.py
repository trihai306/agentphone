"""
Agents Package - Smart Android Automation Framework (DroidRun Standard)

A professional framework for Android automation using:
- Vision (screenshots) for UI understanding
- Accessibility tree for precise element detection
- Multi-LLM reasoning for intelligent action decisions
- Manager-Executor pattern for complex task planning

Usage:
    from agents import DroidAgent, run

    # Simple usage with default settings (Manager-Executor mode)
    agent = DroidAgent()
    result = await agent.run("Open Facebook and watch videos")

    # One-liner with multi-LLM support
    result = await run("Open Settings and go to Wi-Fi", provider="anthropic")

    # Advanced usage
    from agents import DroidAgent, DeviceTools, ReasoningMode

    agent = DroidAgent(
        device_serial="emulator-5554",
        provider="openai",
        model="gpt-4o",
        reasoning_mode=ReasoningMode.MANAGER_EXECUTOR
    )
    result = await agent.run("Search for iPhone on Shopee", max_steps=20)

    # With trajectory tracking
    trajectory = agent.get_trajectory()
"""

__version__ = "3.0.0"

# Core - Agent classes and types (DroidRun standard)
from agents.core import (
    # Main agent
    DroidAgent,
    ReasoningMode,

    # Manager-Executor pattern
    ManagerAgent,
    StatelessManagerAgent,
    ExecutionPlan,
    Subgoal,
    SubgoalStatus,
    ExecutorAgent,
    ExecutorResult,

    # Trajectory
    Trajectory,
    TrajectoryStep,
    TrajectoryWriter,
    ActionStatus,
    analyze_trajectory,
    compare_trajectories,

    # Types
    AgentAction,
    StepResult,
    ExecutionResult,

    # Legacy (backward compatibility)
    SmartAgent,
    Agent,
    run,
    ActionExecutor,
)

# Tools - Device interaction
from agents.tools import (
    Tools,
    ToolResult,
    describe_tools,
    DeviceTools,
    DeviceState,
    UIElement,
    PhoneState,
)

# Context - Memory management
from agents.context import (
    Memory,
)

# LLM - Multi-LLM support
from agents.utils.llm import (
    LLM,
    LLMConfig,
    LLMMessage,
    LLMResponse,
    LLMProvider,
    create_llm,
    OpenAILLM,
    AnthropicLLM,
    GoogleLLM,
    OllamaLLM,
    DeepSeekLLM,
)

# Utils - Utilities
from agents.utils import (
    setup_logging,
    get_logger,
    set_debug,
)

# Common - Constants and Events
from agents.common import (
    DEFAULT_MODEL,
    DEFAULT_DEVICE,
    DEFAULT_MAX_STEPS,
    APP_PACKAGES,
    PORTAL_PACKAGE,
    EventType,
    Event,
    EventEmitter,
    agent_events,
)

# Config (DroidRun standard)
from agents.config import (
    DroidrunConfig,
    LLMConfig as ConfigLLMConfig,
    PortalConfig,
    ADBConfig,
    TrajectoryConfig,
    load_config,
    load_env,
    # Legacy
    AgentConfig,
    load_legacy_config,
)

__all__ = [
    # Version
    "__version__",

    # Core - DroidAgent (DroidRun standard)
    "DroidAgent",
    "ReasoningMode",

    # Core - Manager-Executor pattern
    "ManagerAgent",
    "StatelessManagerAgent",
    "ExecutionPlan",
    "Subgoal",
    "SubgoalStatus",
    "ExecutorAgent",
    "ExecutorResult",

    # Core - Trajectory
    "Trajectory",
    "TrajectoryStep",
    "TrajectoryWriter",
    "ActionStatus",
    "analyze_trajectory",
    "compare_trajectories",

    # Core - Types
    "AgentAction",
    "StepResult",
    "ExecutionResult",

    # Core - Legacy (backward compatibility)
    "SmartAgent",
    "Agent",
    "run",
    "ActionExecutor",

    # Tools
    "Tools",
    "ToolResult",
    "describe_tools",
    "DeviceTools",
    "DeviceState",
    "UIElement",
    "PhoneState",

    # Context
    "Memory",

    # LLM - Multi-provider support
    "LLM",
    "LLMConfig",
    "LLMMessage",
    "LLMResponse",
    "LLMProvider",
    "create_llm",
    "OpenAILLM",
    "AnthropicLLM",
    "GoogleLLM",
    "OllamaLLM",
    "DeepSeekLLM",

    # Utils
    "setup_logging",
    "get_logger",
    "set_debug",

    # Common
    "DEFAULT_MODEL",
    "DEFAULT_DEVICE",
    "DEFAULT_MAX_STEPS",
    "APP_PACKAGES",
    "PORTAL_PACKAGE",

    # Events
    "EventType",
    "Event",
    "EventEmitter",
    "agent_events",

    # Config (DroidRun standard)
    "DroidrunConfig",
    "PortalConfig",
    "ADBConfig",
    "TrajectoryConfig",
    "load_config",
    "load_env",

    # Config - Legacy
    "AgentConfig",
    "load_legacy_config",
]
