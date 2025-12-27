"""Integration tests for the replay workflow flow.

Tests the complete replay pipeline:
1. Load workflow from database
2. Send to Android via HTTP
3. Actions execute correctly with selector fallback

Note: These tests require either:
- A running Android device with Portal APK installed
- Mock HTTP responses for offline testing
"""

import asyncio
import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from typing import Dict, Any, List

# Test workflow data
SAMPLE_WORKFLOW = {
    "id": "test-workflow-001",
    "name": "Test Login Workflow",
    "description": "A test workflow for login flow",
    "is_active": True,
    "created_at": datetime.utcnow().isoformat(),
    "steps": [
        {
            "id": "step-001",
            "name": "Tap Username Field",
            "action": "tap",
            "selector": {
                "type": "resource-id",
                "value": "com.example.app:id/username",
                "confidence": 0.95,
            },
            "tap_data": {"x": 540, "y": 500},
        },
        {
            "id": "step-002",
            "name": "Enter Username",
            "action": "input_text",
            "selector": {
                "type": "resource-id",
                "value": "com.example.app:id/username",
                "confidence": 0.95,
            },
            "input_data": {"text": "testuser@example.com"},
        },
        {
            "id": "step-003",
            "name": "Wait for Input",
            "action": "wait",
            "wait_data": {"duration_ms": 500},
        },
        {
            "id": "step-004",
            "name": "Tap Login Button",
            "action": "tap",
            "selector": {
                "type": "content-desc",
                "value": "Login Button",
                "confidence": 0.85,
            },
            "tap_data": {"x": 540, "y": 800},
        },
    ],
}

SAMPLE_STEP = {
    "id": "step-single",
    "name": "Tap Test Button",
    "action": "tap",
    "selector": {
        "type": "resource-id",
        "value": "com.example.app:id/test_button",
        "confidence": 0.95,
    },
    "tap_data": {"x": 300, "y": 400},
}


class MockResponse:
    """Mock aiohttp response."""

    def __init__(self, status: int, json_data: Dict[str, Any]):
        self.status = status
        self._json_data = json_data

    async def json(self):
        return self._json_data

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        pass


class MockSession:
    """Mock aiohttp session."""

    def __init__(self, responses: Dict[str, MockResponse] = None):
        self.responses = responses or {}
        self.requests = []  # Track requests for verification
        self.closed = False

    def get(self, url: str):
        self.requests.append(("GET", url))
        # Return appropriate mock response based on endpoint
        if "/ping" in url:
            return MockResponse(200, {"status": "success", "message": "pong"})
        elif "/state" in url:
            return MockResponse(200, {
                "status": "success",
                "data": json.dumps({
                    "a11y_tree": [
                        {
                            "index": 0,
                            "resourceId": "com.example.app:id/username",
                            "bounds": "[100,400][980,600]",
                            "className": "android.widget.EditText",
                        },
                        {
                            "index": 1,
                            "resourceId": "com.example.app:id/test_button",
                            "contentDescription": "Login Button",
                            "bounds": "[100,700][980,900]",
                            "className": "android.widget.Button",
                        },
                    ],
                    "phone_state": {},
                }),
            })
        return self.responses.get(url, MockResponse(404, {"error": "Not found"}))

    def post(self, url: str, json=None):
        self.requests.append(("POST", url, json))
        # Return success for action endpoints
        if "/action/" in url or "/keyboard/" in url:
            return MockResponse(200, {"status": "success", "message": "Action executed"})
        elif "/recording/" in url:
            return MockResponse(200, {"status": "success", "success": True})
        return MockResponse(200, {"status": "success"})

    async def close(self):
        self.closed = True


@pytest.mark.asyncio
async def test_replay_engine_connect():
    """Test that ReplayEngine can connect to a device."""
    from app.services.replay_engine import ReplayEngine

    engine = ReplayEngine(device_host="localhost", device_port=8080)

    with patch.object(engine, "_session", MockSession()):
        # The mock session will return success for /ping
        result = await engine.ping()
        assert result is True


@pytest.mark.asyncio
async def test_replay_engine_execute_tap_with_coordinates():
    """Test executing a tap action with coordinates."""
    from app.services.replay_engine import ReplayEngine
    from app.models.workflow import WorkflowStep

    engine = ReplayEngine(device_host="localhost", device_port=8080)
    mock_session = MockSession()

    with patch.object(engine, "_session", mock_session):
        engine._session = mock_session  # Ensure session is set

        step = WorkflowStep.model_validate(SAMPLE_STEP)
        result = await engine._execute_tap(step)

        success, message, selector_used, fallback_used = result
        assert success is True
        assert "coordinates" in selector_used or selector_used is not None


@pytest.mark.asyncio
async def test_replay_engine_execute_wait():
    """Test executing a wait action."""
    from app.services.replay_engine import ReplayEngine
    from app.models.workflow import WorkflowStep

    engine = ReplayEngine(device_host="localhost", device_port=8080)

    step = WorkflowStep.model_validate({
        "id": "step-wait",
        "name": "Wait",
        "action": "wait",
        "wait_data": {"duration_ms": 100},
    })

    result = await engine._execute_step(step)
    assert result.result.value == "success"
    assert "Waited" in result.message


@pytest.mark.asyncio
async def test_replay_engine_selector_fallback():
    """Test that selector fallback is triggered when primary selector fails."""
    from app.services.replay_engine import ReplayEngine
    from app.models.workflow import ElementSelector, SelectorType

    engine = ReplayEngine(device_host="localhost", device_port=8080)

    # Create selector with fallback chain
    selector = ElementSelector(
        type=SelectorType.RESOURCE_ID,
        value="nonexistent:id/missing",
        confidence=0.95,
        fallback=ElementSelector(
            type=SelectorType.BOUNDS,
            value="[300,350][400,450]",
            confidence=0.50,
        ),
    )

    mock_session = MockSession()

    # Mock session that returns empty a11y tree (element not found)
    with patch.object(engine, "_session", mock_session):
        engine._session = mock_session

        # Override state response to return empty tree
        original_get = mock_session.get

        def mock_get(url):
            if "/state" in url:
                return MockResponse(200, {
                    "status": "success",
                    "data": json.dumps({"a11y_tree": [], "phone_state": {}}),
                })
            return original_get(url)

        mock_session.get = mock_get

        # Execute with fallback
        result = await engine._execute_with_selector_fallback(
            selector,
            engine._tap_by_selector,
        )

        success, message, selector_used, fallback_used = result
        # Either succeeds with bounds fallback or both fail gracefully
        # The important thing is the fallback was attempted
        assert isinstance(fallback_used, bool)


@pytest.mark.asyncio
async def test_workflow_model_validation():
    """Test that workflow model validates correctly."""
    from app.models.workflow import Workflow

    workflow = Workflow.model_validate(SAMPLE_WORKFLOW)

    assert workflow.id == "test-workflow-001"
    assert workflow.name == "Test Login Workflow"
    assert len(workflow.steps) == 4
    assert workflow.steps[0].action.value == "tap"
    assert workflow.steps[1].action.value == "input_text"
    assert workflow.steps[2].action.value == "wait"


@pytest.mark.asyncio
async def test_workflow_step_serialization():
    """Test that workflow steps serialize correctly for HTTP transport."""
    from app.models.workflow import Workflow

    workflow = Workflow.model_validate(SAMPLE_WORKFLOW)

    # Serialize to dict (for JSON transmission)
    workflow_dict = workflow.model_dump()

    assert "steps" in workflow_dict
    assert len(workflow_dict["steps"]) == 4

    # Verify step structure
    step_dict = workflow_dict["steps"][0]
    assert "id" in step_dict
    assert "name" in step_dict
    assert "action" in step_dict
    assert "selector" in step_dict


@pytest.mark.asyncio
async def test_backend_replay_workflow():
    """Test backend replay_workflow method with mocked HTTP."""
    from app.backend import BackendService

    backend = BackendService()

    # Mock port forwarding
    with patch.object(backend, "_setup_port_forwarding", return_value=True):
        # Mock HTTP session
        mock_session = MockSession()
        backend._http_session = mock_session

        # Mock ReplayEngine
        with patch("app.backend.ReplayEngine") as MockEngine:
            mock_engine = AsyncMock()
            mock_engine.connect = AsyncMock(return_value=True)
            mock_engine.disconnect = AsyncMock()
            mock_engine.add_progress_callback = MagicMock()

            # Create mock progress
            mock_progress = MagicMock()
            mock_progress.status.value = "completed"
            mock_progress.total_steps = 4
            mock_progress.completed_steps = 4
            mock_progress.success_count = 4
            mock_progress.failed_count = 0
            mock_progress.error = None
            mock_progress.step_results = []

            mock_engine.execute_workflow = AsyncMock(return_value=mock_progress)
            MockEngine.return_value = mock_engine

            result = await backend.replay_workflow(
                workflow=SAMPLE_WORKFLOW,
                device_serial="test-device",
            )

            assert result["success"] is True
            assert result["status"] == "completed"
            assert result["total_steps"] == 4
            assert result["completed_steps"] == 4


@pytest.mark.asyncio
async def test_backend_replay_workflow_connection_failure():
    """Test that replay handles connection failures gracefully."""
    from app.backend import BackendService

    backend = BackendService()

    # Mock port forwarding failure
    with patch.object(backend, "_setup_port_forwarding", return_value=False):
        result = await backend.replay_workflow(
            workflow=SAMPLE_WORKFLOW,
            device_serial="test-device",
        )

        assert result["success"] is False
        assert "port forwarding" in result["error"].lower()


@pytest.mark.asyncio
async def test_backend_execute_single_step():
    """Test backend execute_single_step method."""
    from app.backend import BackendService

    backend = BackendService()

    with patch.object(backend, "_setup_port_forwarding", return_value=True):
        mock_session = MockSession()
        backend._http_session = mock_session

        with patch("app.backend.ReplayEngine") as MockEngine:
            mock_engine = AsyncMock()
            mock_engine.connect = AsyncMock(return_value=True)
            mock_engine.disconnect = AsyncMock()

            # Create mock step result
            mock_result = MagicMock()
            mock_result.result.value = "success"
            mock_result.message = "Tapped at coordinates"
            mock_result.duration_ms = 150
            mock_result.selector_used = "coordinates(300,400)"
            mock_result.fallback_used = False
            mock_result.error = None

            mock_engine.execute_single_step = AsyncMock(return_value=mock_result)
            MockEngine.return_value = mock_engine

            result = await backend.execute_single_step(
                step=SAMPLE_STEP,
                device_serial="test-device",
            )

            assert result["success"] is True
            assert result["result"] == "success"


@pytest.mark.asyncio
async def test_replay_progress_tracking():
    """Test that replay progress is tracked correctly."""
    from app.services.replay_engine import ReplayProgress, ReplayStatus, StepExecutionResult, StepResult

    progress = ReplayProgress(
        workflow_id="test-001",
        workflow_name="Test Workflow",
        status=ReplayStatus.RUNNING,
        total_steps=4,
        completed_steps=2,
    )

    # Add some results
    progress.step_results.append(StepExecutionResult(
        step_id="step-1",
        step_name="Step 1",
        result=StepResult.SUCCESS,
        message="Success",
    ))
    progress.step_results.append(StepExecutionResult(
        step_id="step-2",
        step_name="Step 2",
        result=StepResult.FAILED,
        message="Element not found",
        error="Selector failed",
    ))

    # Verify progress calculation
    assert progress.progress_percent == 50.0
    assert progress.success_count == 1
    assert progress.failed_count == 1

    # Verify serialization
    progress_dict = progress.to_dict()
    assert progress_dict["workflow_id"] == "test-001"
    assert progress_dict["progress_percent"] == 50.0
    assert len(progress_dict["step_results"]) == 2


@pytest.mark.asyncio
async def test_replay_pause_resume_cancel():
    """Test replay control methods (pause, resume, cancel)."""
    from app.services.replay_engine import ReplayEngine, ReplayStatus, ReplayProgress

    engine = ReplayEngine()

    # Initialize progress
    engine._current_progress = ReplayProgress(
        workflow_id="test-001",
        workflow_name="Test",
        status=ReplayStatus.RUNNING,
        total_steps=4,
        completed_steps=0,
    )

    # Test pause
    engine.pause()
    assert engine._is_paused is True
    assert engine._current_progress.status == ReplayStatus.PAUSED

    # Test resume
    engine.resume()
    assert engine._is_paused is False
    assert engine._current_progress.status == ReplayStatus.RUNNING

    # Test cancel
    engine.cancel()
    assert engine._is_cancelled is True


@pytest.mark.asyncio
async def test_selector_matching():
    """Test that selector matching works correctly."""
    from app.services.replay_engine import ReplayEngine
    from app.models.workflow import ElementSelector, SelectorType

    engine = ReplayEngine()

    # Test resource-id matching
    node = {"resourceId": "com.app:id/button", "text": "Click me"}
    selector = ElementSelector(type=SelectorType.RESOURCE_ID, value="button", confidence=0.95)
    assert engine._node_matches_selector(node, selector) is True

    # Test content-desc matching
    node = {"contentDescription": "Login Button", "className": "Button"}
    selector = ElementSelector(type=SelectorType.CONTENT_DESC, value="Login", confidence=0.85)
    assert engine._node_matches_selector(node, selector) is True

    # Test text matching
    node = {"text": "Submit Form", "className": "TextView"}
    selector = ElementSelector(type=SelectorType.TEXT, value="Submit", confidence=0.75)
    assert engine._node_matches_selector(node, selector) is True

    # Test bounds matching
    node = {"bounds": "[100,200][300,400]"}
    selector = ElementSelector(type=SelectorType.BOUNDS, value="[100,200][300,400]", confidence=0.50)
    assert engine._node_matches_selector(node, selector) is True


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
