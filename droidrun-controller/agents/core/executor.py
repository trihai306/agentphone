"""
Executor Agent - Action execution agent (DroidRun standard)

The Executor Agent:
- Takes a subgoal from Manager
- Analyzes current screen state
- Decides and executes specific actions
- Reports results back to Manager
"""

import logging
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass

from agents.core.types import AgentAction
from agents.tools import Tools, DeviceTools
from agents.utils.llm import LLM, LLMMessage, create_llm, parse_json_response

logger = logging.getLogger("agents.core.executor")


EXECUTOR_SYSTEM_PROMPT = """You are an action executor agent for Android automation.

Your task: Execute a specific subgoal by choosing the right action based on the current screen.

## Available Actions

1. **tap_element** - Tap an element by its index (RECOMMENDED - most accurate)
   ```json
   {"action": "tap_element", "params": {"index": 5}, "reasoning": "Tapping the Search button at index 5"}
   ```

2. **tap** - Tap at specific coordinates (use when element has no index)
   ```json
   {"action": "tap", "params": {"x": 540, "y": 200}, "reasoning": "..."}
   ```

3. **swipe** - Swipe gesture
   ```json
   {"action": "swipe", "params": {"start_x": 540, "start_y": 1500, "end_x": 540, "end_y": 500}, "reasoning": "Scrolling up"}
   ```

4. **scroll_up** / **scroll_down** - Simple scroll
   ```json
   {"action": "scroll_up", "params": {}, "reasoning": "Scrolling to see more content"}
   ```

5. **input** - Input text (element must be focused first)
   ```json
   {"action": "input", "params": {"text": "search query"}, "reasoning": "Typing search query"}
   ```

6. **press_key** - Press hardware key
   ```json
   {"action": "press_key", "params": {"key": "BACK"}, "reasoning": "Going back"}
   ```
   Keys: BACK, HOME, ENTER, DELETE, RECENT_APPS

7. **start_app** - Launch an app
   ```json
   {"action": "start_app", "params": {"package": "com.facebook.katana"}, "reasoning": "Opening Facebook"}
   ```

8. **wait** - Wait for UI to update
   ```json
   {"action": "wait", "params": {"duration": 2}, "reasoning": "Waiting for page to load"}
   ```

9. **complete** - Mark subgoal as completed
   ```json
   {"action": "complete", "params": {"success": true}, "reasoning": "Subgoal achieved"}
   ```

## Response Format
You MUST respond with a valid JSON object:
```json
{
    "action": "tap_element",
    "params": {"index": 5},
    "reasoning": "I see the Watch button at index 5 in the UI elements. Tapping it to enter Watch section."
}
```

## Important Rules
1. **Use accessibility tree** - The UI elements list shows exact indices. Use `tap_element` with index when possible.
2. **One action at a time** - Take small steps.
3. **Explain your reasoning** - Why this action helps achieve the subgoal.
4. **Mark complete** - When subgoal is achieved, use `complete` action.
5. **Handle errors** - If stuck, try alternative approaches.
"""


@dataclass
class ExecutorResult:
    """Result of executor action"""
    action: AgentAction
    success: bool
    message: str
    subgoal_complete: bool = False
    error: Optional[str] = None


class ExecutorAgent:
    """
    Executor Agent for action execution (DroidRun standard)

    Responsibilities:
    - Analyze current screen state
    - Choose appropriate action for subgoal
    - Execute actions via Tools
    - Report success/failure
    """

    def __init__(
        self,
        tools: Tools,
        llm: Optional[LLM] = None,
        provider: str = "openai",
        model: Optional[str] = None
    ):
        """
        Initialize Executor Agent

        Args:
            tools: Tools instance for device interaction
            llm: LLM instance (created automatically if not provided)
            provider: LLM provider name
            model: Model name
        """
        self.tools = tools

        if llm:
            self.llm = llm
        else:
            self.llm = create_llm(provider=provider, model=model)

    async def execute_step(
        self,
        subgoal: str,
        screen_state: str,
        screenshot_base64: Optional[str] = None,
        history: Optional[List[Dict]] = None
    ) -> ExecutorResult:
        """
        Execute one step toward the subgoal

        Args:
            subgoal: Current subgoal to achieve
            screen_state: Formatted screen state (UI elements)
            screenshot_base64: Optional screenshot for vision
            history: Recent action history

        Returns:
            ExecutorResult with action and outcome
        """
        # Build prompt
        user_content = self._build_prompt(subgoal, screen_state, history)

        # Prepare messages
        messages = [
            LLMMessage(role="system", content=EXECUTOR_SYSTEM_PROMPT),
        ]

        # Add multimodal content if screenshot available
        if screenshot_base64:
            messages.append(LLMMessage(
                role="user",
                content=[
                    {"type": "text", "text": user_content},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{screenshot_base64}"
                        }
                    }
                ]
            ))
        else:
            messages.append(LLMMessage(role="user", content=user_content))

        # Get LLM decision
        try:
            response = await self.llm.chat(messages)
            result = parse_json_response(response.content)

            action = AgentAction(
                action_type=result.get("action", "wait"),
                params=result.get("params", {}),
                reasoning=result.get("reasoning", "No reasoning provided")
            )

            logger.info(f"Executor action: {action.action_type} - {action.reasoning[:50]}...")

            # Execute the action
            success, message = await self._execute_action(action)

            return ExecutorResult(
                action=action,
                success=success,
                message=message,
                subgoal_complete=(action.action_type == "complete" and success)
            )

        except Exception as e:
            logger.error(f"Executor error: {e}")
            return ExecutorResult(
                action=AgentAction(
                    action_type="wait",
                    params={"duration": 1},
                    reasoning=f"Error: {str(e)}"
                ),
                success=False,
                message=str(e),
                error=str(e)
            )

    async def _execute_action(self, action: AgentAction) -> Tuple[bool, str]:
        """
        Execute an action using tools

        Args:
            action: Action to execute

        Returns:
            Tuple of (success, message)
        """
        try:
            action_type = action.action_type
            params = action.params

            if action_type == "tap_element":
                result = await self.tools.tap_by_index(params["index"])
                return not result.startswith("Error"), result

            elif action_type == "tap":
                result = await self.tools.tap_by_coordinates(params["x"], params["y"])
                return not result.startswith("Error"), result

            elif action_type == "swipe":
                result = await self.tools.swipe(
                    params["start_x"],
                    params["start_y"],
                    params["end_x"],
                    params["end_y"],
                    params.get("duration_ms", 300)
                )
                return not result.startswith("Error"), result

            elif action_type == "scroll_up":
                # Use sync method for now
                if hasattr(self.tools, 'scroll_up'):
                    success = self.tools.scroll_up()
                    return success, "Scrolled up" if success else "Scroll up failed"
                return False, "Scroll up not supported"

            elif action_type == "scroll_down":
                if hasattr(self.tools, 'scroll_down'):
                    success = self.tools.scroll_down()
                    return success, "Scrolled down" if success else "Scroll down failed"
                return False, "Scroll down not supported"

            elif action_type == "input":
                result = await self.tools.input_text(
                    params["text"],
                    index=params.get("index", -1),
                    clear=params.get("clear", False)
                )
                return not result.startswith("Error"), result

            elif action_type == "press_key":
                key = params.get("key", "BACK")
                from agents.common.constants import KEY_CODES
                keycode = KEY_CODES.get(key.upper(), 4)
                result = await self.tools.press_key(keycode)
                return not result.startswith("Error"), result

            elif action_type == "start_app":
                result = await self.tools.start_app(
                    params["package"],
                    params.get("activity")
                )
                return not result.startswith("Error"), result

            elif action_type == "wait":
                import asyncio
                duration = params.get("duration", 1)
                await asyncio.sleep(duration)
                return True, f"Waited {duration}s"

            elif action_type == "complete":
                return True, "Subgoal completed"

            elif action_type == "back":
                result = await self.tools.back()
                return not result.startswith("Error"), result

            else:
                logger.warning(f"Unknown action: {action_type}")
                return False, f"Unknown action: {action_type}"

        except Exception as e:
            logger.error(f"Execute error: {e}")
            return False, str(e)

    def _build_prompt(
        self,
        subgoal: str,
        screen_state: str,
        history: Optional[List[Dict]] = None
    ) -> str:
        """Build user prompt for LLM"""
        prompt = f"""## Current Subgoal
{subgoal}

## Current Screen (UI Elements)
{screen_state[:3000]}

"""
        if history:
            prompt += "## Recent Actions\n"
            for h in history[-3:]:
                status = "OK" if h.get("success", False) else "FAIL"
                prompt += f"- {h.get('action_type', '?')}: {status} - {h.get('message', 'no message')}\n"
            prompt += "\n"

        prompt += """## Your Task
Analyze the screen and choose the NEXT ACTION to achieve the subgoal.
Respond with JSON: {"action": "...", "params": {...}, "reasoning": "..."}"""

        return prompt


class ActionExecutor:
    """
    Simple action executor (legacy compatibility)

    Translates AgentAction to DeviceTools calls
    """

    def __init__(self, tools: DeviceTools):
        """
        Initialize executor

        Args:
            tools: DeviceTools instance
        """
        self.tools = tools

    async def execute(self, action: AgentAction) -> Tuple[bool, str]:
        """
        Execute action and return result

        Args:
            action: Action to execute

        Returns:
            Tuple of (success, message)
        """
        try:
            action_type = action.action_type
            params = action.params

            if action_type == "tap_element":
                index = params["index"]
                success = self.tools.tap_element(index)
                return success, f"Tapped element {index}"

            elif action_type == "tap":
                x, y = params["x"], params["y"]
                success = self.tools.tap(x, y)
                return success, f"Tapped ({x}, {y})"

            elif action_type == "swipe":
                success = self.tools.swipe_sync(
                    params["start_x"],
                    params["start_y"],
                    params["end_x"],
                    params["end_y"],
                    params.get("duration_ms", 300)
                )
                return success, "Swiped"

            elif action_type == "scroll_up":
                success = self.tools.scroll_up()
                return success, "Scrolled up"

            elif action_type == "scroll_down":
                success = self.tools.scroll_down()
                return success, "Scrolled down"

            elif action_type == "input":
                text = params["text"]
                success = self.tools.input_text_sync(text)
                return success, f"Input: {text[:30]}..."

            elif action_type == "press_key":
                key = params["key"]
                success = self.tools.press_key_sync(key)
                return success, f"Pressed {key}"

            elif action_type == "start_app":
                package = params["package"]
                activity = params.get("activity")
                success = self.tools.start_app_sync(package, activity)
                return success, f"Started {package}"

            elif action_type == "wait":
                import asyncio
                duration = params.get("duration", 1)
                await asyncio.sleep(duration)
                return True, f"Waited {duration}s"

            elif action_type == "complete":
                return True, "Completed"

            else:
                logger.warning(f"Unknown action: {action_type}")
                return False, f"Unknown action: {action_type}"

        except Exception as e:
            logger.error(f"Execute error: {e}")
            return False, str(e)
