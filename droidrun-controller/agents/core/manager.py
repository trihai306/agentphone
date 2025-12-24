"""
Manager Agent - Planning agent for complex multi-step tasks (DroidRun standard)

The Manager Agent:
- Breaks down high-level goals into subgoals
- Creates execution plans
- Decides which subgoal to work on next
- Tracks progress toward the goal
"""

import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from enum import Enum

from agents.utils.llm import LLM, LLMMessage, LLMResponse, create_llm, parse_json_response

logger = logging.getLogger("agents.core.manager")


class SubgoalStatus(Enum):
    """Status of a subgoal"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class Subgoal:
    """A subgoal in the execution plan"""
    id: int
    description: str
    status: SubgoalStatus = SubgoalStatus.PENDING
    result: Optional[str] = None
    attempts: int = 0
    max_attempts: int = 3

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "description": self.description,
            "status": self.status.value,
            "result": self.result,
            "attempts": self.attempts,
        }


@dataclass
class ExecutionPlan:
    """Plan for achieving the goal"""
    goal: str
    subgoals: List[Subgoal] = field(default_factory=list)
    current_subgoal_id: int = 0
    reasoning: str = ""

    def add_subgoal(self, description: str) -> Subgoal:
        """Add a new subgoal"""
        subgoal = Subgoal(
            id=len(self.subgoals) + 1,
            description=description
        )
        self.subgoals.append(subgoal)
        return subgoal

    def get_current_subgoal(self) -> Optional[Subgoal]:
        """Get the current subgoal being worked on"""
        for sg in self.subgoals:
            if sg.status in [SubgoalStatus.PENDING, SubgoalStatus.IN_PROGRESS]:
                return sg
        return None

    def get_pending_subgoals(self) -> List[Subgoal]:
        """Get all pending subgoals"""
        return [sg for sg in self.subgoals if sg.status == SubgoalStatus.PENDING]

    def mark_current_completed(self, result: str = "") -> bool:
        """Mark current subgoal as completed"""
        current = self.get_current_subgoal()
        if current:
            current.status = SubgoalStatus.COMPLETED
            current.result = result
            return True
        return False

    def mark_current_failed(self, error: str = "") -> bool:
        """Mark current subgoal as failed"""
        current = self.get_current_subgoal()
        if current:
            current.attempts += 1
            if current.attempts >= current.max_attempts:
                current.status = SubgoalStatus.FAILED
                current.result = error
            return True
        return False

    def is_complete(self) -> bool:
        """Check if all subgoals are complete"""
        return all(
            sg.status in [SubgoalStatus.COMPLETED, SubgoalStatus.SKIPPED]
            for sg in self.subgoals
        )

    def has_failed(self) -> bool:
        """Check if any subgoal has failed"""
        return any(sg.status == SubgoalStatus.FAILED for sg in self.subgoals)

    def to_dict(self) -> Dict:
        return {
            "goal": self.goal,
            "subgoals": [sg.to_dict() for sg in self.subgoals],
            "current_subgoal_id": self.current_subgoal_id,
            "reasoning": self.reasoning,
            "is_complete": self.is_complete(),
            "has_failed": self.has_failed(),
        }


MANAGER_SYSTEM_PROMPT = """You are a planning agent that breaks down complex goals into manageable subgoals.

Your role:
1. Analyze the user's goal
2. Break it down into clear, sequential subgoals
3. Each subgoal should be a single, focused task
4. Consider the current device state when planning

## Response Format
You MUST respond with a valid JSON object:
```json
{
    "reasoning": "Your analysis of the goal and why you chose these subgoals",
    "subgoals": [
        "First subgoal description",
        "Second subgoal description",
        "Third subgoal description"
    ],
    "estimated_steps": 10
}
```

## Guidelines
1. Keep subgoals atomic - each should be achievable in 1-5 actions
2. Order subgoals logically
3. Include verification steps where needed (e.g., "Verify the app opened successfully")
4. Don't over-complicate - 3-7 subgoals is usually sufficient
5. Consider error handling and recovery
"""

MANAGER_REPLAN_PROMPT = """You are reviewing the current execution progress.

Current goal: {goal}

Current plan status:
{plan_status}

Recent actions:
{recent_actions}

Current screen state:
{screen_state}

Based on the current progress, decide the next action:
1. Continue with current subgoal
2. Move to next subgoal (current is complete)
3. Retry current subgoal (with different approach)
4. Replan (if stuck or goal needs adjustment)
5. Complete (goal achieved)
6. Fail (goal cannot be achieved)

## Response Format
```json
{
    "decision": "continue|next|retry|replan|complete|fail",
    "reasoning": "Why you made this decision",
    "current_subgoal": "Description of what to do next",
    "answer": "If complete, the answer/result to return",
    "new_subgoals": ["If replanning, new subgoal list"]
}
```
"""


class ManagerAgent:
    """
    Manager Agent for planning and coordination (DroidRun standard)

    Responsibilities:
    - Create initial execution plan
    - Track progress on subgoals
    - Decide when to proceed, retry, or replan
    - Determine when goal is achieved or failed
    """

    def __init__(
        self,
        llm: Optional[LLM] = None,
        provider: str = "openai",
        model: Optional[str] = None
    ):
        """
        Initialize Manager Agent

        Args:
            llm: LLM instance (created automatically if not provided)
            provider: LLM provider name
            model: Model name
        """
        if llm:
            self.llm = llm
        else:
            self.llm = create_llm(provider=provider, model=model)

        self.current_plan: Optional[ExecutionPlan] = None

    async def create_plan(
        self,
        goal: str,
        screen_state: Optional[str] = None
    ) -> ExecutionPlan:
        """
        Create an execution plan for the goal

        Args:
            goal: High-level goal to achieve
            screen_state: Optional current screen state description

        Returns:
            ExecutionPlan with subgoals
        """
        user_content = f"Goal: {goal}"
        if screen_state:
            user_content += f"\n\nCurrent screen state:\n{screen_state}"

        messages = [
            LLMMessage(role="system", content=MANAGER_SYSTEM_PROMPT),
            LLMMessage(role="user", content=user_content)
        ]

        response = await self.llm.chat(messages)
        result = parse_json_response(response.content)

        plan = ExecutionPlan(
            goal=goal,
            reasoning=result.get("reasoning", "")
        )

        for subgoal_desc in result.get("subgoals", []):
            plan.add_subgoal(subgoal_desc)

        self.current_plan = plan
        logger.info(f"Created plan with {len(plan.subgoals)} subgoals")

        return plan

    async def evaluate_progress(
        self,
        plan: ExecutionPlan,
        recent_actions: List[Dict],
        screen_state: str
    ) -> Dict[str, Any]:
        """
        Evaluate current progress and decide next action

        Args:
            plan: Current execution plan
            recent_actions: Recent action history
            screen_state: Current screen state

        Returns:
            Decision dict with next action
        """
        # Format plan status
        plan_status = []
        for sg in plan.subgoals:
            status_icon = {
                SubgoalStatus.COMPLETED: "✅",
                SubgoalStatus.FAILED: "❌",
                SubgoalStatus.IN_PROGRESS: "🔄",
                SubgoalStatus.PENDING: "⏳",
                SubgoalStatus.SKIPPED: "⏭️",
            }.get(sg.status, "?")
            plan_status.append(f"{status_icon} {sg.id}. {sg.description}")

        # Format recent actions
        actions_text = ""
        for action in recent_actions[-5:]:
            actions_text += f"- {action.get('action_type', '?')}: {action.get('result', 'no result')}\n"

        prompt = MANAGER_REPLAN_PROMPT.format(
            goal=plan.goal,
            plan_status="\n".join(plan_status),
            recent_actions=actions_text or "No recent actions",
            screen_state=screen_state[:1000] if screen_state else "Unknown"
        )

        messages = [
            LLMMessage(role="system", content=MANAGER_SYSTEM_PROMPT),
            LLMMessage(role="user", content=prompt)
        ]

        response = await self.llm.chat(messages)
        result = parse_json_response(response.content)

        decision = result.get("decision", "continue")
        logger.info(f"Manager decision: {decision} - {result.get('reasoning', '')[:100]}")

        return result

    async def get_current_subgoal(self) -> Optional[str]:
        """Get description of current subgoal"""
        if self.current_plan:
            current = self.current_plan.get_current_subgoal()
            if current:
                return current.description
        return None

    def mark_subgoal_completed(self, result: str = ""):
        """Mark current subgoal as completed"""
        if self.current_plan:
            self.current_plan.mark_current_completed(result)

    def mark_subgoal_failed(self, error: str = ""):
        """Mark current subgoal as failed"""
        if self.current_plan:
            self.current_plan.mark_current_failed(error)

    def is_goal_complete(self) -> bool:
        """Check if goal is complete"""
        if self.current_plan:
            return self.current_plan.is_complete()
        return False

    def is_goal_failed(self) -> bool:
        """Check if goal has failed"""
        if self.current_plan:
            return self.current_plan.has_failed()
        return False


class StatelessManagerAgent(ManagerAgent):
    """
    Stateless Manager that doesn't maintain plan state

    Useful for simple tasks that don't need complex planning
    """

    async def get_next_action(
        self,
        goal: str,
        screen_state: str,
        history: List[Dict]
    ) -> Dict[str, Any]:
        """
        Get next action without maintaining state

        Args:
            goal: The goal to achieve
            screen_state: Current screen state
            history: Action history

        Returns:
            Next action recommendation
        """
        prompt = f"""Goal: {goal}

Current screen:
{screen_state[:2000]}

Recent actions:
{self._format_history(history)}

What should be done next? Respond with:
```json
{{
    "should_continue": true,
    "current_subgoal": "What to do now",
    "reasoning": "Why this action",
    "is_complete": false,
    "answer": null
}}
```"""

        messages = [
            LLMMessage(role="system", content=MANAGER_SYSTEM_PROMPT),
            LLMMessage(role="user", content=prompt)
        ]

        response = await self.llm.chat(messages)
        return parse_json_response(response.content)

    def _format_history(self, history: List[Dict]) -> str:
        """Format action history"""
        if not history:
            return "No previous actions"

        lines = []
        for h in history[-5:]:
            lines.append(f"- {h.get('action_type', '?')}: {h.get('result', 'no result')}")
        return "\n".join(lines)
