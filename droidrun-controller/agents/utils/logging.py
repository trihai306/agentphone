"""
Logging Utilities - Configure logging for agents package

Features:
- File-based logging for each agent run
- Colored console output
- Structured logging with run context
- Log rotation
"""

import logging
import sys
import os
from datetime import datetime
from typing import Optional, Callable, List, Dict, Any
from logging.handlers import RotatingFileHandler
from dataclasses import dataclass, field
from enum import Enum
import json


# ============================================================================
# COLORS FOR CONSOLE OUTPUT
# ============================================================================

class Colors:
    """ANSI color codes for console output"""
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"

    # Colors
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"
    GRAY = "\033[90m"

    @classmethod
    def colorize(cls, text: str, color: str) -> str:
        """Apply color to text"""
        return f"{color}{text}{cls.RESET}"


class ColoredFormatter(logging.Formatter):
    """Colored formatter for console output"""

    LEVEL_COLORS = {
        logging.DEBUG: Colors.GRAY,
        logging.INFO: Colors.GREEN,
        logging.WARNING: Colors.YELLOW,
        logging.ERROR: Colors.RED,
        logging.CRITICAL: Colors.RED + Colors.BOLD,
    }

    def format(self, record: logging.LogRecord) -> str:
        # Add color to level name
        color = self.LEVEL_COLORS.get(record.levelno, Colors.WHITE)
        record.levelname = Colors.colorize(record.levelname, color)

        # Color the message based on content
        msg = record.getMessage()
        if "Step" in msg and "---" in msg:
            record.msg = Colors.colorize(msg, Colors.CYAN + Colors.BOLD)
        elif "Goal:" in msg or "Mode:" in msg:
            record.msg = Colors.colorize(msg, Colors.MAGENTA)
        elif "Action:" in msg:
            record.msg = Colors.colorize(msg, Colors.BLUE)
        elif "Result:" in msg:
            if "OK" in msg or "success" in msg.lower():
                record.msg = Colors.colorize(msg, Colors.GREEN)
            else:
                record.msg = Colors.colorize(msg, Colors.RED)
        elif "completed" in msg.lower() or "success" in msg.lower():
            record.msg = Colors.colorize(msg, Colors.GREEN)
        elif "failed" in msg.lower() or "error" in msg.lower():
            record.msg = Colors.colorize(msg, Colors.RED)
        elif "==" in msg:
            record.msg = Colors.colorize(msg, Colors.CYAN)

        return super().format(record)


# ============================================================================
# LOG EVENT TYPES
# ============================================================================

class LogEventType(Enum):
    """Types of log events for callbacks"""
    RUN_START = "run_start"
    RUN_END = "run_end"
    STEP_START = "step_start"
    STEP_END = "step_end"
    ACTION = "action"
    RESULT = "result"
    PLAN_CREATED = "plan_created"
    SUBGOAL_START = "subgoal_start"
    SUBGOAL_END = "subgoal_end"
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"
    DEBUG = "debug"


@dataclass
class LogEvent:
    """Structured log event"""
    event_type: LogEventType
    message: str
    timestamp: datetime = field(default_factory=datetime.now)
    run_id: Optional[str] = None
    step: Optional[int] = None
    subgoal_id: Optional[int] = None
    action: Optional[str] = None
    success: Optional[bool] = None
    data: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_type": self.event_type.value,
            "message": self.message,
            "timestamp": self.timestamp.isoformat(),
            "run_id": self.run_id,
            "step": self.step,
            "subgoal_id": self.subgoal_id,
            "action": self.action,
            "success": self.success,
            "data": self.data,
        }


# ============================================================================
# AGENT RUN LOGGER
# ============================================================================

class AgentRunLogger:
    """
    Logger for a specific agent run.

    Creates a dedicated log file for each run and provides
    structured logging with callbacks for UI integration.
    """

    def __init__(
        self,
        run_id: Optional[str] = None,
        log_dir: str = "./logs/agent_runs",
        console_output: bool = True,
        file_output: bool = True,
        json_output: bool = True,
        level: int = logging.INFO,
        max_file_size: int = 10 * 1024 * 1024,  # 10MB
        backup_count: int = 5,
    ):
        """
        Initialize agent run logger.

        Args:
            run_id: Unique run identifier (auto-generated if not provided)
            log_dir: Directory to store log files
            console_output: Enable console logging
            file_output: Enable file logging
            json_output: Enable JSON interaction log file (auto-saved on run_end)
            level: Logging level
            max_file_size: Max size per log file (for rotation)
            backup_count: Number of backup files to keep
        """
        self.run_id = run_id or datetime.now().strftime("%Y%m%d_%H%M%S")
        self.log_dir = log_dir
        self.level = level
        self.start_time = datetime.now()
        self.current_step = 0
        self.current_subgoal = 0
        self.goal: Optional[str] = None
        self.json_output = json_output

        # Event callbacks
        self._callbacks: List[Callable[[LogEvent], None]] = []

        # Events history
        self.events: List[LogEvent] = []

        # Create log directory
        os.makedirs(log_dir, exist_ok=True)

        # Create logger
        self.logger = logging.getLogger(f"agents.run.{self.run_id}")
        self.logger.setLevel(level)
        self.logger.handlers = []  # Clear existing handlers
        self.logger.propagate = False  # Don't propagate to parent

        # File handler
        if file_output:
            log_file = os.path.join(log_dir, f"run_{self.run_id}.log")
            file_handler = RotatingFileHandler(
                log_file,
                maxBytes=max_file_size,
                backupCount=backup_count,
                encoding='utf-8'
            )
            file_formatter = logging.Formatter(
                "%(asctime)s | %(levelname)-8s | %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S"
            )
            file_handler.setFormatter(file_formatter)
            self.logger.addHandler(file_handler)
            self.log_file = log_file
        else:
            self.log_file = None

        # JSON file path (set when saved)
        self.json_file: Optional[str] = None

        # Console handler with colors
        if console_output:
            console_handler = logging.StreamHandler(sys.stdout)
            console_formatter = ColoredFormatter(
                "%(asctime)s | %(levelname)-8s | %(message)s",
                datefmt="%H:%M:%S"
            )
            console_handler.setFormatter(console_formatter)
            self.logger.addHandler(console_handler)

    def add_callback(self, callback: Callable[[LogEvent], None]):
        """Add callback for log events"""
        self._callbacks.append(callback)

    def remove_callback(self, callback: Callable[[LogEvent], None]):
        """Remove callback"""
        if callback in self._callbacks:
            self._callbacks.remove(callback)

    def _emit_event(self, event: LogEvent):
        """Emit event to all callbacks"""
        self.events.append(event)
        for callback in self._callbacks:
            try:
                callback(event)
            except Exception as e:
                self.logger.warning(f"Callback error: {e}")

    # ========================================================================
    # RUN LIFECYCLE
    # ========================================================================

    def run_start(self, goal: str, mode: str = "manager_executor", **kwargs):
        """Log run start"""
        self.goal = goal
        self.start_time = datetime.now()

        self.logger.info("=" * 70)
        self.logger.info(f"AGENT RUN STARTED")
        self.logger.info(f"   Run ID: {self.run_id}")
        self.logger.info(f"   Goal: {goal}")
        self.logger.info(f"   Mode: {mode}")
        for key, value in kwargs.items():
            self.logger.info(f"   {key}: {value}")
        self.logger.info("=" * 70)

        self._emit_event(LogEvent(
            event_type=LogEventType.RUN_START,
            message=f"Run started: {goal}",
            run_id=self.run_id,
            data={"goal": goal, "mode": mode, **kwargs}
        ))

    def run_end(self, success: bool, message: str, total_steps: int, **kwargs):
        """Log run end"""
        elapsed = (datetime.now() - self.start_time).total_seconds()

        self.logger.info("=" * 70)
        if success:
            self.logger.info(f"AGENT RUN COMPLETED SUCCESSFULLY")
        else:
            self.logger.info(f"AGENT RUN FAILED")
        self.logger.info(f"   Message: {message}")
        self.logger.info(f"   Total Steps: {total_steps}")
        self.logger.info(f"   Duration: {elapsed:.2f}s")
        for key, value in kwargs.items():
            self.logger.info(f"   {key}: {value}")
        self.logger.info("=" * 70)

        self._emit_event(LogEvent(
            event_type=LogEventType.RUN_END,
            message=message,
            run_id=self.run_id,
            success=success,
            data={"total_steps": total_steps, "duration": elapsed, **kwargs}
        ))

        # Auto-save interaction log to JSON file
        if self.json_output:
            self._save_interaction_log(success, message, total_steps, elapsed)

    # ========================================================================
    # PLAN
    # ========================================================================

    def plan_created(self, subgoals: List[str]):
        """Log plan creation"""
        self.logger.info("-" * 50)
        self.logger.info(f"EXECUTION PLAN ({len(subgoals)} subgoals):")
        for i, sg in enumerate(subgoals, 1):
            self.logger.info(f"   {i}. {sg}")
        self.logger.info("-" * 50)

        self._emit_event(LogEvent(
            event_type=LogEventType.PLAN_CREATED,
            message=f"Plan created with {len(subgoals)} subgoals",
            run_id=self.run_id,
            data={"subgoals": subgoals}
        ))

    # ========================================================================
    # SUBGOAL
    # ========================================================================

    def subgoal_start(self, subgoal_id: int, description: str):
        """Log subgoal start"""
        self.current_subgoal = subgoal_id

        self.logger.info("")
        self.logger.info(f"SUBGOAL {subgoal_id}: {description}")
        self.logger.info("-" * 40)

        self._emit_event(LogEvent(
            event_type=LogEventType.SUBGOAL_START,
            message=description,
            run_id=self.run_id,
            subgoal_id=subgoal_id,
        ))

    def subgoal_end(self, subgoal_id: int, success: bool, message: str):
        """Log subgoal end"""
        if success:
            self.logger.info(f"Subgoal {subgoal_id} completed: {message}")
        else:
            self.logger.info(f"Subgoal {subgoal_id} failed: {message}")

        self._emit_event(LogEvent(
            event_type=LogEventType.SUBGOAL_END,
            message=message,
            run_id=self.run_id,
            subgoal_id=subgoal_id,
            success=success,
        ))

    # ========================================================================
    # STEP
    # ========================================================================

    def step_start(self, step: int, max_steps: int, subgoal_step: Optional[int] = None):
        """Log step start"""
        self.current_step = step

        if subgoal_step is not None:
            self.logger.info(f"")
            self.logger.info(f"--- Step {step}/{max_steps} (subgoal step {subgoal_step}) ---")
        else:
            self.logger.info(f"")
            self.logger.info(f"--- Step {step}/{max_steps} ---")

        self._emit_event(LogEvent(
            event_type=LogEventType.STEP_START,
            message=f"Step {step} started",
            run_id=self.run_id,
            step=step,
            data={"max_steps": max_steps, "subgoal_step": subgoal_step}
        ))

    def step_end(self, step: int, success: bool, message: str):
        """Log step end"""
        self._emit_event(LogEvent(
            event_type=LogEventType.STEP_END,
            message=message,
            run_id=self.run_id,
            step=step,
            success=success,
        ))

    # ========================================================================
    # ACTION
    # ========================================================================

    def action(self, action_type: str, params: Dict[str, Any], reasoning: str):
        """Log action"""
        reasoning_short = reasoning[:100] + "..." if len(reasoning) > 100 else reasoning
        self.logger.info(f"Action: {action_type}")
        self.logger.info(f"   Params: {params}")
        self.logger.info(f"   Reasoning: {reasoning_short}")

        self._emit_event(LogEvent(
            event_type=LogEventType.ACTION,
            message=f"{action_type}: {reasoning_short}",
            run_id=self.run_id,
            step=self.current_step,
            action=action_type,
            data={"params": params, "reasoning": reasoning}
        ))

    def result(self, success: bool, message: str, **kwargs):
        """Log action result"""
        if success:
            self.logger.info(f"Result: OK - {message}")
        else:
            self.logger.info(f"Result: FAIL - {message}")

        self._emit_event(LogEvent(
            event_type=LogEventType.RESULT,
            message=message,
            run_id=self.run_id,
            step=self.current_step,
            success=success,
            data=kwargs
        ))

    # ========================================================================
    # GENERAL LOGGING
    # ========================================================================

    def info(self, message: str, **kwargs):
        """Log info message"""
        self.logger.info(message)
        self._emit_event(LogEvent(
            event_type=LogEventType.INFO,
            message=message,
            run_id=self.run_id,
            step=self.current_step,
            data=kwargs if kwargs else None
        ))

    def debug(self, message: str, **kwargs):
        """Log debug message"""
        self.logger.debug(message)
        self._emit_event(LogEvent(
            event_type=LogEventType.DEBUG,
            message=message,
            run_id=self.run_id,
            step=self.current_step,
            data=kwargs if kwargs else None
        ))

    def warning(self, message: str, **kwargs):
        """Log warning message"""
        self.logger.warning(f"Warning: {message}")
        self._emit_event(LogEvent(
            event_type=LogEventType.WARNING,
            message=message,
            run_id=self.run_id,
            step=self.current_step,
            data=kwargs if kwargs else None
        ))

    def error(self, message: str, exception: Optional[Exception] = None, **kwargs):
        """Log error message"""
        self.logger.error(f"Error: {message}")
        if exception:
            self.logger.exception(exception)

        self._emit_event(LogEvent(
            event_type=LogEventType.ERROR,
            message=message,
            run_id=self.run_id,
            step=self.current_step,
            data={"exception": str(exception) if exception else None, **kwargs}
        ))

    # ========================================================================
    # STATE LOGGING
    # ========================================================================

    def log_state(self, elements_count: int, current_app: str, screenshot_path: Optional[str] = None):
        """Log device state"""
        self.logger.debug(f"State: {elements_count} elements, App: {current_app}")
        if screenshot_path:
            self.logger.debug(f"   Screenshot: {screenshot_path}")

    def log_llm_call(self, provider: str, model: str, tokens: Optional[int] = None):
        """Log LLM call"""
        if tokens:
            self.logger.debug(f"LLM: {provider}/{model} ({tokens} tokens)")
        else:
            self.logger.debug(f"LLM: {provider}/{model}")

    # ========================================================================
    # EXPORT
    # ========================================================================

    def get_summary(self) -> Dict[str, Any]:
        """Get run summary"""
        elapsed = (datetime.now() - self.start_time).total_seconds()
        return {
            "run_id": self.run_id,
            "goal": self.goal,
            "start_time": self.start_time.isoformat(),
            "duration": elapsed,
            "total_steps": self.current_step,
            "total_events": len(self.events),
            "log_file": self.log_file,
            "json_file": self.json_file,
        }

    def export_events(self) -> List[Dict[str, Any]]:
        """Export all events as list of dicts"""
        return [event.to_dict() for event in self.events]

    # ========================================================================
    # INTERACTION LOG SAVE
    # ========================================================================

    def _save_interaction_log(
        self,
        success: bool,
        message: str,
        total_steps: int,
        duration: float
    ):
        """
        Auto-save interaction log to JSON file.

        Called automatically at run_end if json_output is enabled.
        """
        try:
            interaction_log = {
                "run_id": self.run_id,
                "goal": self.goal,
                "success": success,
                "message": message,
                "start_time": self.start_time.isoformat(),
                "end_time": datetime.now().isoformat(),
                "duration_seconds": duration,
                "total_steps": total_steps,
                "total_events": len(self.events),
                "events": self.export_events(),
            }

            json_file = os.path.join(self.log_dir, f"run_{self.run_id}.json")
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(interaction_log, f, indent=2, ensure_ascii=False)

            self.json_file = json_file
            self.logger.info(f"Interaction log saved: {json_file}")

        except Exception as e:
            self.logger.warning(f"Failed to save interaction log: {e}")
            self.json_file = None

    def save_interaction_log(self, filepath: Optional[str] = None) -> Optional[str]:
        """
        Manually save interaction log to JSON file.

        Args:
            filepath: Optional custom file path. If not provided,
                     uses default path in log_dir.

        Returns:
            Path to saved JSON file, or None if failed.
        """
        try:
            interaction_log = {
                "run_id": self.run_id,
                "goal": self.goal,
                "start_time": self.start_time.isoformat(),
                "current_time": datetime.now().isoformat(),
                "duration_seconds": (datetime.now() - self.start_time).total_seconds(),
                "current_step": self.current_step,
                "current_subgoal": self.current_subgoal,
                "total_events": len(self.events),
                "events": self.export_events(),
            }

            if filepath is None:
                filepath = os.path.join(
                    self.log_dir,
                    f"run_{self.run_id}_snapshot_{datetime.now().strftime('%H%M%S')}.json"
                )

            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(interaction_log, f, indent=2, ensure_ascii=False)

            self.logger.info(f"Interaction log saved: {filepath}")
            return filepath

        except Exception as e:
            self.logger.warning(f"Failed to save interaction log: {e}")
            return None


# ============================================================================
# GLOBAL LOGGING SETUP
# ============================================================================

def setup_logging(
    level: int = logging.INFO,
    format_string: Optional[str] = None,
    handlers: Optional[list] = None,
    colored: bool = True
) -> logging.Logger:
    """
    Setup logging for the agents package

    Args:
        level: Logging level (default: INFO)
        format_string: Custom format string
        handlers: Custom handlers list
        colored: Use colored output for console

    Returns:
        Root logger for agents package
    """
    if format_string is None:
        format_string = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # Get agents root logger
    logger = logging.getLogger("agents")
    logger.setLevel(level)

    # Clear existing handlers
    logger.handlers = []

    if handlers:
        formatter = logging.Formatter(format_string)
        for handler in handlers:
            handler.setFormatter(formatter)
            logger.addHandler(handler)
    else:
        # Default: console handler
        console_handler = logging.StreamHandler(sys.stdout)
        if colored:
            console_formatter = ColoredFormatter(format_string)
        else:
            console_formatter = logging.Formatter(format_string)
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)

    return logger


def setup_file_logging(
    log_dir: str = "./logs",
    level: int = logging.INFO,
    max_size: int = 10 * 1024 * 1024,
    backup_count: int = 5
) -> logging.Logger:
    """
    Setup file logging for agents package

    Args:
        log_dir: Directory to store log files
        level: Logging level
        max_size: Max file size before rotation
        backup_count: Number of backup files

    Returns:
        Logger with file handler
    """
    os.makedirs(log_dir, exist_ok=True)

    logger = logging.getLogger("agents")

    # Add rotating file handler
    log_file = os.path.join(log_dir, "agents.log")
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=max_size,
        backupCount=backup_count,
        encoding='utf-8'
    )
    file_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    file_handler.setFormatter(file_formatter)
    file_handler.setLevel(level)
    logger.addHandler(file_handler)

    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger for a specific module

    Args:
        name: Module name (will be prefixed with 'agents.')

    Returns:
        Logger instance
    """
    if not name.startswith("agents."):
        name = f"agents.{name}"
    return logging.getLogger(name)


def set_debug(enabled: bool = True):
    """Enable or disable debug logging"""
    level = logging.DEBUG if enabled else logging.INFO
    logging.getLogger("agents").setLevel(level)


def create_run_logger(
    run_id: Optional[str] = None,
    log_dir: str = "./logs/agent_runs",
    **kwargs
) -> AgentRunLogger:
    """
    Create a new run logger for an agent execution

    Args:
        run_id: Unique run identifier
        log_dir: Directory for log files
        **kwargs: Additional AgentRunLogger arguments

    Returns:
        AgentRunLogger instance
    """
    return AgentRunLogger(run_id=run_id, log_dir=log_dir, **kwargs)
