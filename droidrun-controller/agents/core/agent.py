"""
DroidAgent - Vision + Accessibility based reasoning agent (DroidRun standard)

Features:
- Manager-Executor pattern for complex tasks
- Multi-LLM support (OpenAI, Anthropic, Gemini, etc.)
- Trajectory tracking for replay/analysis
- Vision + Accessibility reasoning
"""

import os
import json
import base64
import logging
import asyncio
from typing import Dict, Any, Optional, List, Literal
from datetime import datetime
from enum import Enum

from agents.core.types import AgentAction, StepResult, ExecutionResult
from agents.core.executor import ExecutorAgent, ActionExecutor, ExecutorResult
from agents.core.manager import ManagerAgent, ExecutionPlan, SubgoalStatus
from agents.core.trajectory import Trajectory, TrajectoryStep, ActionStatus, TrajectoryWriter
from agents.tools import DeviceTools, DeviceState, UIElement, Tools
from agents.context import Memory
from agents.prompts import get_system_prompt, get_user_prompt
from agents.utils.llm import LLM, LLMMessage, create_llm, parse_json_response
from agents.utils.logging import AgentRunLogger, create_run_logger, LogEvent
from agents.common.constants import (
    DEFAULT_MODEL,
    DEFAULT_DEVICE,
    DEFAULT_MAX_STEPS,
    AGENT_SCREENSHOT_DIR,
    MAX_ELEMENTS_FOR_LLM,
    MAX_TEXT_LENGTH,
    LLM_MAX_TOKENS,
    LLM_TEMPERATURE,
    STEP_DELAY,
)

logger = logging.getLogger("agents.core.agent")


class ReasoningMode(Enum):
    """Agent reasoning mode"""
    SIMPLE = "simple"           # Direct action selection
    MANAGER_EXECUTOR = "manager_executor"  # Planning + execution (DroidRun standard)


class DroidAgent:
    """
    DroidAgent - Main agent following DroidRun standard

    Features:
    - Auto-detect elements via accessibility tree
    - See screenshots to understand context
    - Multi-LLM reasoning for action decisions
    - Manager-Executor pattern for complex tasks
    - Trajectory tracking for analysis/replay
    - No hardcoding - adapts to any app
    """

    def __init__(
        self,
        device_serial: str = DEFAULT_DEVICE,
        provider: str = "openai",
        model: Optional[str] = None,
        api_key: Optional[str] = None,
        reasoning_mode: ReasoningMode = ReasoningMode.MANAGER_EXECUTOR,
        save_trajectories: bool = True,
        trajectory_dir: str = "./trajectories",
        log_dir: str = "./logs/agent_runs",
        enable_file_logging: bool = True,
        debug: bool = False
    ):
        """
        Initialize DroidAgent

        Args:
            device_serial: Device serial number
            provider: LLM provider (openai, anthropic, google, ollama, deepseek)
            model: Model name (uses provider default if not specified)
            api_key: API key (or from environment)
            reasoning_mode: SIMPLE or MANAGER_EXECUTOR
            save_trajectories: Whether to save trajectories
            trajectory_dir: Directory to save trajectories
            log_dir: Directory to save run logs
            enable_file_logging: Whether to save logs to files
            debug: Enable debug logging
        """
        # Device tools
        self.tools = DeviceTools(
            serial=device_serial,
            use_tcp=True,
            save_trajectories=save_trajectories
        )

        # LLM
        self.llm = create_llm(provider=provider, model=model, api_key=api_key)
        self.provider = provider
        self.model = model or self.llm.config.model

        # Manager-Executor agents
        self.manager = ManagerAgent(llm=self.llm)
        self.executor = ExecutorAgent(tools=self.tools, llm=self.llm)

        # Legacy executor for simple mode
        self._action_executor = ActionExecutor(self.tools)

        # State
        self.reasoning_mode = reasoning_mode
        self.debug = debug
        self.memory = Memory()
        self.execution_history: List[StepResult] = []

        # Trajectory
        self.save_trajectories = save_trajectories
        self.trajectory_dir = trajectory_dir
        self.current_trajectory: Optional[Trajectory] = None
        self.trajectory_writer = TrajectoryWriter(trajectory_dir) if save_trajectories else None

        # Logging
        self.log_dir = log_dir
        self.enable_file_logging = enable_file_logging
        self.run_logger: Optional[AgentRunLogger] = None

        # Directories
        self.screenshot_dir = AGENT_SCREENSHOT_DIR
        os.makedirs(self.screenshot_dir, exist_ok=True)
        if save_trajectories:
            os.makedirs(trajectory_dir, exist_ok=True)

        if debug:
            logging.basicConfig(level=logging.DEBUG)

        logger.info(f"DroidAgent initialized with {provider}/{self.model} in {reasoning_mode.value} mode")

    # ========================================================================
    # MAIN EXECUTION
    # ========================================================================

    async def run(
        self,
        goal: str,
        max_steps: int = DEFAULT_MAX_STEPS,
        **kwargs
    ) -> ExecutionResult:
        """
        Execute goal using vision + accessibility reasoning

        Args:
            goal: Goal in natural language
            max_steps: Maximum steps
            **kwargs: Additional context

        Returns:
            ExecutionResult with results
        """
        if self.reasoning_mode == ReasoningMode.MANAGER_EXECUTOR:
            return await self._run_manager_executor(goal, max_steps, **kwargs)
        else:
            return await self._run_simple(goal, max_steps, **kwargs)

    async def _run_manager_executor(
        self,
        goal: str,
        max_steps: int = DEFAULT_MAX_STEPS,
        **kwargs
    ) -> ExecutionResult:
        """
        Execute using Manager-Executor pattern (DroidRun standard)
        """
        start_time = datetime.now()
        screenshots = []
        steps = []

        # Initialize run logger
        self.run_logger = create_run_logger(
            log_dir=self.log_dir,
            file_output=self.enable_file_logging,
            level=logging.DEBUG if self.debug else logging.INFO
        )

        # Initialize trajectory
        self.current_trajectory = Trajectory(goal=goal)

        # Log run start
        self.run_logger.run_start(
            goal=goal,
            mode="manager_executor",
            provider=self.provider,
            model=self.model,
            max_steps=max_steps
        )

        try:
            # Get initial screen state
            state = self.tools.get_state_sync()
            screen_state = self._format_elements(state.elements)
            self.run_logger.log_state(len(state.elements), state.phone_state.current_app)

            # Create execution plan
            self.run_logger.info("Creating execution plan...")
            plan = await self.manager.create_plan(goal, screen_state)

            # Log plan
            self.run_logger.plan_created([sg.description for sg in plan.subgoals])

            # Execute subgoals
            step_num = 0
            max_retries_per_subgoal = 10

            while step_num < max_steps:
                current_subgoal = plan.get_current_subgoal()

                if current_subgoal is None:
                    # All subgoals completed
                    break

                if current_subgoal.status == SubgoalStatus.PENDING:
                    current_subgoal.status = SubgoalStatus.IN_PROGRESS

                # Log subgoal start
                self.run_logger.subgoal_start(current_subgoal.id, current_subgoal.description)

                subgoal_steps = 0
                while subgoal_steps < max_retries_per_subgoal and step_num < max_steps:
                    step_num += 1
                    subgoal_steps += 1

                    # Log step start
                    self.run_logger.step_start(step_num, max_steps, subgoal_steps)

                    # 1. Get current state
                    state = self.tools.get_state_sync()
                    screen_state = self._format_elements(state.elements)
                    self.run_logger.log_state(len(state.elements), state.phone_state.current_app)

                    # 2. Take screenshot
                    timestamp = datetime.now().strftime("%H%M%S")
                    screenshot_path = f"{self.screenshot_dir}/step_{step_num}_{timestamp}.png"
                    self.tools.save_screenshot(screenshot_path)
                    screenshots.append(screenshot_path)

                    # 3. Get screenshot base64 for vision
                    screenshot_base64 = None
                    try:
                        with open(screenshot_path, 'rb') as f:
                            screenshot_base64 = base64.b64encode(f.read()).decode('utf-8')
                    except Exception as e:
                        self.run_logger.warning(f"Cannot load screenshot: {e}")

                    # 4. Get action history for this subgoal
                    history = [
                        {
                            "action_type": s.action.action_type,
                            "success": s.success,
                            "message": s.message
                        }
                        for s in steps[-5:]
                    ]

                    # 5. Execute step
                    self.run_logger.log_llm_call(self.provider, self.model)
                    result = await self.executor.execute_step(
                        subgoal=current_subgoal.description,
                        screen_state=screen_state,
                        screenshot_base64=screenshot_base64,
                        history=history
                    )

                    # Log action and result
                    self.run_logger.action(
                        result.action.action_type,
                        result.action.params,
                        result.action.reasoning
                    )
                    self.run_logger.result(result.success, result.message)

                    # 6. Record step
                    step_result = StepResult(
                        step=step_num,
                        action=result.action,
                        success=result.success,
                        message=result.message,
                        screenshot_path=screenshot_path
                    )
                    steps.append(step_result)
                    self.execution_history.append(step_result)

                    # Record trajectory
                    if self.current_trajectory:
                        self.current_trajectory.add_step(
                            action_type=result.action.action_type,
                            action_params=result.action.params,
                            reasoning=result.action.reasoning,
                            status=ActionStatus.SUCCESS if result.success else ActionStatus.FAILED,
                            screenshot_path=screenshot_path
                        )

                    # Log step end
                    self.run_logger.step_end(step_num, result.success, result.message)

                    # 7. Check if subgoal is complete
                    if result.subgoal_complete:
                        self.run_logger.subgoal_end(current_subgoal.id, True, result.message)
                        plan.mark_current_completed(result.message)
                        break

                    if not result.success:
                        current_subgoal.attempts += 1
                        if current_subgoal.attempts >= current_subgoal.max_attempts:
                            self.run_logger.subgoal_end(
                                current_subgoal.id, False,
                                f"Failed after {current_subgoal.attempts} attempts"
                            )
                            plan.mark_current_failed(result.error or result.message)
                            break

                    # Small delay
                    await asyncio.sleep(STEP_DELAY)

                # Check if plan has failed
                if plan.has_failed():
                    break

            # Check completion
            exec_time = (datetime.now() - start_time).total_seconds()

            if plan.is_complete():
                message = "Goal completed successfully!"
                success = True
            elif plan.has_failed():
                message = f"Goal failed: {plan.subgoals[-1].result if plan.subgoals else 'Unknown error'}"
                success = False
            else:
                message = f"Max steps ({max_steps}) reached"
                success = False

            # Save trajectory
            if self.save_trajectories and self.trajectory_writer and self.current_trajectory:
                self.current_trajectory.complete(success=success)
                filepath = self.trajectory_writer.save(self.current_trajectory)
                self.run_logger.info(f"Trajectory saved to: {filepath}")

            # Log run end
            self.run_logger.run_end(
                success=success,
                message=message,
                total_steps=step_num,
                trajectory_file=filepath if self.save_trajectories else None
            )

            return ExecutionResult(
                success=success,
                message=message,
                steps=steps,
                total_steps=step_num,
                execution_time=exec_time,
                screenshots=screenshots
            )

        except Exception as e:
            self.run_logger.error(f"Execution error: {e}", exception=e)
            exec_time = (datetime.now() - start_time).total_seconds()

            if self.current_trajectory:
                self.current_trajectory.complete(success=False)
                if self.trajectory_writer:
                    self.trajectory_writer.save(self.current_trajectory)

            # Log run end with failure
            self.run_logger.run_end(
                success=False,
                message=str(e),
                total_steps=len(steps)
            )

            return ExecutionResult(
                success=False,
                message=str(e),
                steps=steps,
                total_steps=len(steps),
                execution_time=exec_time,
                screenshots=screenshots,
                error=e
            )

    async def _run_simple(
        self,
        goal: str,
        max_steps: int = DEFAULT_MAX_STEPS,
        **kwargs
    ) -> ExecutionResult:
        """
        Execute using simple direct action selection (legacy mode)
        """
        start_time = datetime.now()
        screenshots = []
        steps = []

        # Initialize run logger
        self.run_logger = create_run_logger(
            log_dir=self.log_dir,
            file_output=self.enable_file_logging,
            level=logging.DEBUG if self.debug else logging.INFO
        )

        # Initialize trajectory
        self.current_trajectory = Trajectory(goal=goal)

        # Log run start
        self.run_logger.run_start(
            goal=goal,
            mode="simple",
            provider=self.provider,
            model=self.model,
            max_steps=max_steps
        )

        try:
            for step_num in range(1, max_steps + 1):
                # Log step start
                self.run_logger.step_start(step_num, max_steps)

                # 1. Get current state
                state = self.tools.get_state_sync()
                self.run_logger.log_state(len(state.elements), state.phone_state.current_app)

                # 2. Take screenshot
                timestamp = datetime.now().strftime("%H%M%S")
                screenshot_path = f"{self.screenshot_dir}/step_{step_num}_{timestamp}.png"
                self.tools.save_screenshot(screenshot_path)
                screenshots.append(screenshot_path)

                # 3. LLM reasoning
                self.run_logger.log_llm_call(self.provider, self.model)
                action = await self._reason(
                    goal=goal,
                    state=state,
                    screenshot_path=screenshot_path,
                    step=step_num,
                    max_steps=max_steps,
                    history=steps[-3:] if steps else []
                )

                # Log action
                self.run_logger.action(
                    action.action_type,
                    action.params,
                    action.reasoning
                )

                # 4. Execute action
                success, message = await self._action_executor.execute(action)

                # Log result
                self.run_logger.result(success, message)

                # 5. Record step
                step_result = StepResult(
                    step=step_num,
                    action=action,
                    success=success,
                    message=message,
                    screenshot_path=screenshot_path
                )
                steps.append(step_result)
                self.execution_history.append(step_result)

                # Record trajectory
                if self.current_trajectory:
                    self.current_trajectory.add_step(
                        action_type=action.action_type,
                        action_params=action.params,
                        reasoning=action.reasoning,
                        status=ActionStatus.SUCCESS if success else ActionStatus.FAILED,
                        screenshot_path=screenshot_path
                    )

                # Log step end
                self.run_logger.step_end(step_num, success, message)

                # 6. Check completion
                if action.action_type == "complete":
                    exec_time = (datetime.now() - start_time).total_seconds()

                    if self.current_trajectory:
                        self.current_trajectory.complete(success=True)
                        if self.trajectory_writer:
                            self.trajectory_writer.save(self.current_trajectory)

                    # Log run end
                    self.run_logger.run_end(
                        success=action.params.get("success", True),
                        message=action.reasoning,
                        total_steps=step_num
                    )

                    return ExecutionResult(
                        success=action.params.get("success", True),
                        message=action.reasoning,
                        steps=steps,
                        total_steps=step_num,
                        execution_time=exec_time,
                        screenshots=screenshots
                    )

                # Small delay
                await asyncio.sleep(STEP_DELAY)

            # Max steps reached
            exec_time = (datetime.now() - start_time).total_seconds()

            if self.current_trajectory:
                self.current_trajectory.complete(success=False)
                if self.trajectory_writer:
                    self.trajectory_writer.save(self.current_trajectory)

            # Log run end
            self.run_logger.run_end(
                success=False,
                message=f"Max steps ({max_steps}) reached without completing goal",
                total_steps=max_steps
            )

            return ExecutionResult(
                success=False,
                message=f"Max steps ({max_steps}) reached without completing goal",
                steps=steps,
                total_steps=max_steps,
                execution_time=exec_time,
                screenshots=screenshots
            )

        except Exception as e:
            self.run_logger.error(f"Execution error: {e}", exception=e)
            exec_time = (datetime.now() - start_time).total_seconds()

            if self.current_trajectory:
                self.current_trajectory.complete(success=False)
                if self.trajectory_writer:
                    self.trajectory_writer.save(self.current_trajectory)

            # Log run end with failure
            self.run_logger.run_end(
                success=False,
                message=str(e),
                total_steps=len(steps)
            )

            return ExecutionResult(
                success=False,
                message=str(e),
                steps=steps,
                total_steps=len(steps),
                execution_time=exec_time,
                screenshots=screenshots,
                error=e
            )

    # ========================================================================
    # LLM REASONING (Simple mode)
    # ========================================================================

    async def _reason(
        self,
        goal: str,
        state: DeviceState,
        screenshot_path: str,
        step: int,
        max_steps: int,
        history: List[StepResult]
    ) -> AgentAction:
        """
        Use LLM to reason and decide next action
        """
        # Build prompts
        system_prompt = get_system_prompt()
        elements_text = self._format_elements(state.elements)
        history_text = self._format_history(history)
        memory_text = json.dumps(self.memory.to_dict(), indent=2) if self.memory else ""

        user_prompt = get_user_prompt(
            goal=goal,
            current_app=state.phone_state.current_app,
            screen_width=state.phone_state.screen_width,
            screen_height=state.phone_state.screen_height,
            elements_text=elements_text,
            step=step,
            max_steps=max_steps,
            history_text=history_text,
            memory_text=memory_text
        )

        # Prepare messages
        messages = [
            LLMMessage(role="system", content=system_prompt),
        ]

        # Add screenshot as image
        try:
            with open(screenshot_path, 'rb') as f:
                image_data = base64.b64encode(f.read()).decode('utf-8')

            messages.append(LLMMessage(
                role="user",
                content=[
                    {"type": "text", "text": user_prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{image_data}"
                        }
                    }
                ]
            ))
        except Exception as e:
            logger.warning(f"Cannot load screenshot: {e}")
            messages.append(LLMMessage(role="user", content=user_prompt))

        # Call LLM
        try:
            response = await self.llm.chat(messages)

            if self.debug:
                logger.debug(f"LLM Response:\n{response.content}")

            return self._parse_response(response.content)

        except Exception as e:
            logger.error(f"LLM error: {e}")
            return AgentAction(
                action_type="wait",
                params={"duration": 1},
                reasoning=f"LLM error: {str(e)}"
            )

    def _format_elements(self, elements: List[UIElement], max_elements: int = MAX_ELEMENTS_FOR_LLM) -> str:
        """Format elements for LLM consumption"""
        lines = []
        count = [0]

        def add_element(elem: UIElement, indent: int = 0):
            if count[0] >= max_elements:
                return

            prefix = "  " * indent
            text = elem.text[:MAX_TEXT_LENGTH] + "..." if len(elem.text) > MAX_TEXT_LENGTH else elem.text
            class_short = elem.class_name.split(".")[-1] if elem.class_name else "?"

            line = f"{prefix}[{elem.index}] {class_short}"
            if text:
                line += f': "{text}"'
            line += f" @ ({elem.center_x}, {elem.center_y})"
            if elem.clickable:
                line += " [clickable]"

            lines.append(line)
            count[0] += 1

            for child in elem.children:
                add_element(child, indent + 1)

        for elem in elements:
            add_element(elem)

        if count[0] >= max_elements:
            lines.append(f"... and more elements (showing first {max_elements})")

        return "\n".join(lines) if lines else "No UI elements detected"

    def _format_history(self, history: List[StepResult]) -> str:
        """Format history for LLM"""
        if not history:
            return ""

        lines = []
        for h in history:
            status = "OK" if h.success else "FAIL"
            lines.append(f"- Step {h.step}: {h.action.action_type} {h.action.params} - {status} {h.message}")

        return "\n".join(lines)

    def _parse_response(self, response: str) -> AgentAction:
        """Parse LLM response to AgentAction"""
        try:
            data = parse_json_response(response)

            return AgentAction(
                action_type=data.get("action", "wait"),
                params=data.get("params", {}),
                reasoning=data.get("reasoning", "No reasoning provided")
            )

        except Exception as e:
            logger.error(f"Parse error: {e}")
            logger.error(f"Response: {response}")

            return AgentAction(
                action_type="wait",
                params={"duration": 1},
                reasoning=f"Parse error: {str(e)}"
            )

    # ========================================================================
    # MEMORY
    # ========================================================================

    def remember(self, key: str, value: Any):
        """Store in memory"""
        self.memory.remember(key, value)

    def recall(self, key: str, default: Any = None) -> Any:
        """Retrieve from memory"""
        return self.memory.recall(key, default)

    def clear_memory(self):
        """Clear memory"""
        self.memory.clear()

    # ========================================================================
    # UTILITIES
    # ========================================================================

    def get_state(self) -> DeviceState:
        """Get current device state (synchronous)"""
        return self.tools.get_state_sync()

    def get_elements(self) -> List[UIElement]:
        """Get current UI elements"""
        state = self.tools.get_state_sync()
        return state.elements

    def find_element(self, text: str) -> Optional[UIElement]:
        """Find element by text"""
        elements = self.tools.find_elements_by_text(text)
        return elements[0] if elements else None

    def get_trajectory(self) -> Optional[Trajectory]:
        """Get current trajectory"""
        return self.current_trajectory

    def get_run_logger(self) -> Optional[AgentRunLogger]:
        """Get current run logger"""
        return self.run_logger

    def add_log_callback(self, callback) -> None:
        """
        Add callback for log events.
        Callback will receive LogEvent objects during agent execution.

        Example:
            def my_callback(event: LogEvent):
                print(f"{event.event_type}: {event.message}")

            agent.add_log_callback(my_callback)
        """
        if self.run_logger:
            self.run_logger.add_callback(callback)
        else:
            # Store callback to add when run_logger is created
            if not hasattr(self, '_pending_callbacks'):
                self._pending_callbacks = []
            self._pending_callbacks.append(callback)

    def get_log_summary(self) -> Optional[Dict[str, Any]]:
        """Get summary of current run logs"""
        if self.run_logger:
            return self.run_logger.get_summary()
        return None

    def export_log_events(self) -> List[Dict[str, Any]]:
        """Export all log events from current run"""
        if self.run_logger:
            return self.run_logger.export_events()
        return []


# ============================================================================
# LEGACY ALIAS (backward compatibility)
# ============================================================================

class SmartAgent(DroidAgent):
    """
    SmartAgent - Legacy alias for DroidAgent

    For backward compatibility with existing code.
    """

    def __init__(
        self,
        device_serial: str = DEFAULT_DEVICE,
        model: str = DEFAULT_MODEL,
        api_key: Optional[str] = None,
        debug: bool = False
    ):
        super().__init__(
            device_serial=device_serial,
            provider="openai",
            model=model,
            api_key=api_key,
            reasoning_mode=ReasoningMode.SIMPLE,  # Legacy uses simple mode
            save_trajectories=False,
            debug=debug
        )


# ============================================================================
# SIMPLE WRAPPER
# ============================================================================

class Agent:
    """
    Simple wrapper for DroidAgent

    Usage:
        agent = Agent()
        result = await agent.run("Open Facebook and like 5 videos")
    """

    def __init__(
        self,
        device: str = DEFAULT_DEVICE,
        provider: str = "openai",
        model: Optional[str] = None,
        reasoning_mode: str = "manager_executor",
        debug: bool = False
    ):
        mode = ReasoningMode.MANAGER_EXECUTOR if reasoning_mode == "manager_executor" else ReasoningMode.SIMPLE
        self._agent = DroidAgent(
            device_serial=device,
            provider=provider,
            model=model,
            reasoning_mode=mode,
            debug=debug
        )

    async def run(self, goal: str, max_steps: int = DEFAULT_MAX_STEPS) -> ExecutionResult:
        """Run agent with goal"""
        return await self._agent.run(goal, max_steps)

    def remember(self, key: str, value: Any):
        self._agent.remember(key, value)

    def recall(self, key: str, default: Any = None) -> Any:
        return self._agent.recall(key, default)


# ============================================================================
# SHORTCUT
# ============================================================================

async def run(
    goal: str,
    device: str = DEFAULT_DEVICE,
    provider: str = "openai",
    model: Optional[str] = None,
    max_steps: int = DEFAULT_MAX_STEPS,
    reasoning_mode: str = "manager_executor"
) -> ExecutionResult:
    """
    One-liner to run agent

    Usage:
        from agents import run
        result = await run("Open Facebook and like videos")

        # With different provider
        result = await run("Open Settings", provider="anthropic", model="claude-3-opus-20240229")
    """
    agent = Agent(
        device=device,
        provider=provider,
        model=model,
        reasoning_mode=reasoning_mode
    )
    return await agent.run(goal, max_steps)
