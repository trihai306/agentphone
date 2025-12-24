"""
Config - Agent configuration management (DroidRun standard)

Provides:
- DroidrunConfig: Main configuration dataclass
- LLMConfig: LLM provider configuration
- PortalConfig: Portal APK connection settings
- load_config: Load from environment/file
"""

import os
from dataclasses import dataclass, field
from typing import Optional, Dict, Any, Literal, List

from agents.common.constants import (
    DEFAULT_MODEL,
    DEFAULT_DEVICE,
    DEFAULT_MAX_STEPS,
    DEFAULT_TCP_PORT,
    LLM_TEMPERATURE,
    LLM_MAX_TOKENS,
    TCP_TIMEOUT,
    PORTAL_PACKAGE,
)


@dataclass
class LLMConfig:
    """Configuration for LLM provider"""

    # Provider: openai, anthropic, google, ollama, deepseek
    provider: str = "openai"

    # Model name (uses provider default if not specified)
    model: Optional[str] = None

    # API key (from environment if not specified)
    api_key: Optional[str] = None

    # Generation settings
    temperature: float = LLM_TEMPERATURE
    max_tokens: int = LLM_MAX_TOKENS

    # Provider-specific settings
    base_url: Optional[str] = None  # For Ollama or custom endpoints

    def __post_init__(self):
        """Load API key from environment based on provider"""
        if self.api_key is None:
            env_map = {
                "openai": "OPENAI_API_KEY",
                "anthropic": "ANTHROPIC_API_KEY",
                "google": "GOOGLE_API_KEY",
                "deepseek": "DEEPSEEK_API_KEY",
            }
            env_key = env_map.get(self.provider.lower())
            if env_key:
                self.api_key = os.getenv(env_key)


@dataclass
class PortalConfig:
    """Configuration for Portal APK connection (DroidRun standard)"""

    # Connection mode: tcp or content_provider
    mode: Literal["tcp", "content_provider"] = "tcp"

    # TCP settings
    host: str = "localhost"
    port: int = DEFAULT_TCP_PORT
    timeout: int = TCP_TIMEOUT

    # Package name (DroidRun standard)
    package: str = PORTAL_PACKAGE


@dataclass
class ADBConfig:
    """Configuration for ADB"""

    path: str = "adb"
    android_home: Optional[str] = None

    def __post_init__(self):
        if self.android_home is None:
            self.android_home = os.getenv("ANDROID_HOME", os.path.expanduser("~/Library/Android/sdk"))


@dataclass
class TrajectoryConfig:
    """Configuration for trajectory tracking"""

    # Whether to save trajectories
    enabled: bool = True

    # Directory to save trajectories
    directory: str = "./trajectories"

    # Whether to include screenshots in trajectory
    include_screenshots: bool = True


@dataclass
class DroidrunConfig:
    """
    Main configuration for DroidAgent (DroidRun standard)

    This is the primary configuration class following DroidRun pattern.
    """

    # Device settings
    device_serial: str = DEFAULT_DEVICE
    use_tcp: bool = True

    # LLM settings
    llm: LLMConfig = field(default_factory=LLMConfig)

    # Reasoning mode: simple or manager_executor
    reasoning_mode: Literal["simple", "manager_executor"] = "manager_executor"

    # Execution settings
    max_steps: int = DEFAULT_MAX_STEPS
    step_delay: float = 0.5
    debug: bool = False

    # Screenshot settings
    screenshot_dir: str = "./screenshots/agent"
    save_screenshots: bool = True

    # Portal settings
    portal: PortalConfig = field(default_factory=PortalConfig)

    # ADB settings
    adb: ADBConfig = field(default_factory=ADBConfig)

    # Trajectory settings
    trajectory: TrajectoryConfig = field(default_factory=TrajectoryConfig)

    # Extra settings
    extra: Dict[str, Any] = field(default_factory=dict)

    @property
    def portal_url(self) -> str:
        """Get Portal APK HTTP URL"""
        return f"http://{self.portal.host}:{self.portal.port}"

    @property
    def provider(self) -> str:
        """Get LLM provider name"""
        return self.llm.provider

    @property
    def model(self) -> Optional[str]:
        """Get LLM model name"""
        return self.llm.model

    @property
    def api_key(self) -> Optional[str]:
        """Get LLM API key"""
        return self.llm.api_key


# Legacy alias for backward compatibility
@dataclass
class AgentConfig:
    """
    Legacy configuration for SmartAgent

    Use DroidrunConfig for new code.
    """

    # Device settings
    device_serial: str = DEFAULT_DEVICE
    use_tcp: bool = True
    tcp_port: int = DEFAULT_TCP_PORT

    # LLM settings (legacy - OpenAI only)
    model: str = DEFAULT_MODEL
    api_key: Optional[str] = None
    temperature: float = LLM_TEMPERATURE
    max_tokens: int = LLM_MAX_TOKENS

    # Execution settings
    max_steps: int = DEFAULT_MAX_STEPS
    step_delay: float = 0.5
    debug: bool = False

    # Screenshot settings
    screenshot_dir: str = "./screenshots/agent"
    save_screenshots: bool = True

    # Portal settings
    portal: PortalConfig = field(default_factory=PortalConfig)

    # ADB settings
    adb: ADBConfig = field(default_factory=ADBConfig)

    # Extra settings
    extra: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        """Load API key from environment if not provided"""
        if self.api_key is None:
            self.api_key = os.getenv("OPENAI_API_KEY")

    @property
    def portal_url(self) -> str:
        """Get Portal APK HTTP URL"""
        return f"http://{self.portal.host}:{self.portal.port}"

    def to_droidrun_config(self) -> DroidrunConfig:
        """Convert to DroidrunConfig"""
        return DroidrunConfig(
            device_serial=self.device_serial,
            use_tcp=self.use_tcp,
            llm=LLMConfig(
                provider="openai",
                model=self.model,
                api_key=self.api_key,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
            ),
            reasoning_mode="simple",
            max_steps=self.max_steps,
            step_delay=self.step_delay,
            debug=self.debug,
            screenshot_dir=self.screenshot_dir,
            save_screenshots=self.save_screenshots,
            portal=self.portal,
            adb=self.adb,
            extra=self.extra,
        )


def load_config(
    config_file: Optional[str] = None,
    **overrides
) -> DroidrunConfig:
    """
    Load configuration from environment and optional file (DroidRun standard)

    Args:
        config_file: Optional path to config file (JSON/YAML)
        **overrides: Override specific settings

    Returns:
        DroidrunConfig instance
    """
    config_dict: Dict[str, Any] = {}

    # Load LLM config from environment
    llm_config = LLMConfig(
        provider=os.getenv("LLM_PROVIDER", os.getenv("AGENT_PROVIDER", "openai")),
        model=os.getenv("LLM_MODEL", os.getenv("OPENAI_MODEL")),
        temperature=float(os.getenv("LLM_TEMPERATURE", str(LLM_TEMPERATURE))),
        max_tokens=int(os.getenv("LLM_MAX_TOKENS", str(LLM_MAX_TOKENS))),
        base_url=os.getenv("LLM_BASE_URL"),
    )
    config_dict["llm"] = llm_config

    # Load Portal config from environment
    portal_config = PortalConfig(
        mode=os.getenv("PORTAL_MODE", "tcp"),  # type: ignore
        host=os.getenv("PORTAL_HOST", "localhost"),
        port=int(os.getenv("PORTAL_PORT", str(DEFAULT_TCP_PORT))),
        timeout=int(os.getenv("PORTAL_TIMEOUT", str(TCP_TIMEOUT))),
        package=os.getenv("PORTAL_PACKAGE", PORTAL_PACKAGE),
    )
    config_dict["portal"] = portal_config

    # Load ADB config from environment
    adb_config = ADBConfig(
        path=os.getenv("ADB_PATH", "adb"),
        android_home=os.getenv("ANDROID_HOME"),
    )
    config_dict["adb"] = adb_config

    # Load Trajectory config from environment
    trajectory_config = TrajectoryConfig(
        enabled=os.getenv("TRAJECTORY_ENABLED", "true").lower() in ("true", "1", "yes"),
        directory=os.getenv("TRAJECTORY_DIR", "./trajectories"),
        include_screenshots=os.getenv("TRAJECTORY_SCREENSHOTS", "true").lower() in ("true", "1", "yes"),
    )
    config_dict["trajectory"] = trajectory_config

    # Load from environment
    env_mappings = {
        "AGENT_DEVICE": "device_serial",
        "AGENT_MAX_STEPS": "max_steps",
        "AGENT_DEBUG": "debug",
        "AGENT_REASONING_MODE": "reasoning_mode",
    }

    for env_key, config_key in env_mappings.items():
        value = os.getenv(env_key)
        if value is not None:
            # Convert types
            if config_key == "max_steps":
                value = int(value)
            elif config_key == "debug":
                value = value.lower() in ("true", "1", "yes")
            config_dict[config_key] = value

    # Load from file if provided
    if config_file and os.path.exists(config_file):
        import json
        with open(config_file, 'r') as f:
            file_config = json.load(f)
            config_dict.update(file_config)

    # Apply overrides
    config_dict.update(overrides)

    return DroidrunConfig(**config_dict)


def load_legacy_config(
    config_file: Optional[str] = None,
    **overrides
) -> AgentConfig:
    """
    Load legacy AgentConfig (for backward compatibility)

    Args:
        config_file: Optional path to config file (JSON/YAML)
        **overrides: Override specific settings

    Returns:
        AgentConfig instance
    """
    # Start with defaults
    config_dict: Dict[str, Any] = {}

    # Load Portal config from environment
    portal_config = PortalConfig(
        mode=os.getenv("PORTAL_MODE", "tcp"),  # type: ignore
        host=os.getenv("PORTAL_HOST", "localhost"),
        port=int(os.getenv("PORTAL_PORT", str(DEFAULT_TCP_PORT))),
        timeout=int(os.getenv("PORTAL_TIMEOUT", str(TCP_TIMEOUT))),
        package=os.getenv("PORTAL_PACKAGE", PORTAL_PACKAGE),
    )
    config_dict["portal"] = portal_config

    # Load ADB config from environment
    adb_config = ADBConfig(
        path=os.getenv("ADB_PATH", "adb"),
        android_home=os.getenv("ANDROID_HOME"),
    )
    config_dict["adb"] = adb_config

    # Load from environment
    env_mappings = {
        "AGENT_DEVICE": "device_serial",
        "AGENT_MODEL": "model",
        "OPENAI_API_KEY": "api_key",
        "OPENAI_MODEL": "model",
        "AGENT_MAX_STEPS": "max_steps",
        "AGENT_DEBUG": "debug",
        "PORTAL_PORT": "tcp_port",
    }

    for env_key, config_key in env_mappings.items():
        value = os.getenv(env_key)
        if value is not None:
            # Convert types
            if config_key in ("max_steps", "tcp_port"):
                value = int(value)
            elif config_key == "debug":
                value = value.lower() in ("true", "1", "yes")
            config_dict[config_key] = value

    # Load from file if provided
    if config_file and os.path.exists(config_file):
        import json
        with open(config_file, 'r') as f:
            file_config = json.load(f)
            config_dict.update(file_config)

    # Apply overrides
    config_dict.update(overrides)

    return AgentConfig(**config_dict)


def load_env(env_file: str = ".env") -> None:
    """
    Load environment variables from .env file

    Args:
        env_file: Path to .env file
    """
    if not os.path.exists(env_file):
        return

    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            # Skip comments and empty lines
            if not line or line.startswith('#'):
                continue
            # Parse key=value
            if '=' in line:
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip()
                # Remove quotes if present
                if value.startswith('"') and value.endswith('"'):
                    value = value[1:-1]
                elif value.startswith("'") and value.endswith("'"):
                    value = value[1:-1]
                os.environ[key] = value


# Default config instances
default_config = DroidrunConfig()
legacy_config = AgentConfig()
