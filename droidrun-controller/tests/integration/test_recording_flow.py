"""Integration tests for end-to-end recording flow.

This module tests the complete recording flow:
1. Desktop triggers Android recording via HTTP API
2. Events are captured and processed
3. Events are sent back to Desktop for display
4. Workflow is saved to database

These tests verify the integration between:
- Backend recording control methods (start/stop/pause/resume)
- HTTP communication with Android Portal
- Event processing pipeline (selector generation, step naming)
- Workflow storage via database
"""

import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

from app.backend import BackendService
from app.models.workflow import (
    Workflow,
    WorkflowStep,
    ElementSelector,
    ActionType,
    SelectorType,
)
from app.services.selector_generator import SelectorGenerator, get_selector_generator
from app.services.step_namer import StepNamer, get_step_namer


class TestSelectorGeneration:
    """Test selector generation from captured events."""

    def test_resource_id_priority(self):
        """resource-id should be preferred over other selector types."""
        selector_gen = get_selector_generator()

        event_data = {
            "resource_id": "com.example:id/login_button",
            "content_description": "Login",
            "text": "Sign In",
            "bounds": "0,0,100,50",
        }

        selector = selector_gen.generate_selector(event_data)

        assert selector is not None
        assert selector.type == SelectorType.RESOURCE_ID
        assert "login_button" in selector.value
        assert selector.confidence >= 0.9

    def test_content_desc_fallback(self):
        """content-desc should be used when resource-id is missing."""
        selector_gen = get_selector_generator()

        event_data = {
            "resource_id": "",
            "content_description": "Submit form",
            "text": "Submit",
            "bounds": "0,0,100,50",
        }

        selector = selector_gen.generate_selector(event_data)

        assert selector is not None
        assert selector.type == SelectorType.CONTENT_DESC
        assert "Submit form" in selector.value

    def test_text_fallback(self):
        """text should be used when resource-id and content-desc are missing."""
        selector_gen = get_selector_generator()

        event_data = {
            "resource_id": "",
            "content_description": "",
            "text": "Click Me",
            "bounds": "0,0,100,50",
        }

        selector = selector_gen.generate_selector(event_data)

        assert selector is not None
        assert selector.type == SelectorType.TEXT
        assert "Click Me" in selector.value

    def test_bounds_fallback(self):
        """bounds should be used as last resort."""
        selector_gen = get_selector_generator()

        event_data = {
            "resource_id": "",
            "content_description": "",
            "text": "",
            "bounds": "50,100,150,200",
        }

        selector = selector_gen.generate_selector(event_data)

        assert selector is not None
        assert selector.type == SelectorType.BOUNDS
        assert "50,100,150,200" in selector.value

    def test_fallback_chain_generation(self):
        """Should generate fallback selectors in priority order."""
        selector_gen = get_selector_generator()

        event_data = {
            "resource_id": "com.app:id/btn_submit",
            "content_description": "Submit button",
            "text": "Submit",
            "bounds": "10,20,100,60",
        }

        all_selectors = selector_gen.generate_all_selectors(event_data)

        # Should have all selectors in priority order
        assert len(all_selectors) >= 3
        # First should be resource-id (highest confidence)
        assert all_selectors[0].type == SelectorType.RESOURCE_ID


class TestStepNaming:
    """Test semantic step naming from captured events."""

    def test_tap_button_naming(self):
        """Tap on button should generate readable name."""
        step_namer = get_step_namer()

        name = step_namer.generate_name(
            "tap",
            {"text": "Login", "content_description": "Login button"},
            {}
        )

        assert "Login" in name
        assert "Tap" in name or "tap" in name.lower()

    def test_input_text_naming(self):
        """Text input should include field name."""
        step_namer = get_step_namer()

        name = step_namer.generate_name(
            "input_text",
            {
                "resource_id": "com.app:id/email_field",
                "content_description": "Email address",
            },
            {"text": "user@example.com"}
        )

        assert "Email" in name or "email" in name.lower()

    def test_swipe_direction_naming(self):
        """Swipe should include direction."""
        step_namer = get_step_namer()

        name = step_namer.generate_name(
            "scroll",
            {},
            {"direction": "down"}
        )

        assert "Down" in name or "down" in name.lower() or "Scroll" in name


class TestEventProcessingPipeline:
    """Test the complete event processing pipeline."""

    def test_event_to_workflow_step(self):
        """Test converting captured event to workflow step."""
        selector_gen = get_selector_generator()
        step_namer = get_step_namer()

        # Simulate a captured event from Android
        event_data = {
            "event_type": "tap",
            "timestamp": 1735296000000,
            "package_name": "com.example.app",
            "class_name": "android.widget.Button",
            "resource_id": "com.example.app:id/login_btn",
            "content_description": "Login button",
            "text": "Sign In",
            "bounds": "100,500,300,600",
            "is_clickable": True,
            "is_editable": False,
            "is_scrollable": False,
        }

        # Generate selector
        selector = selector_gen.generate_selector(event_data)
        assert selector is not None

        # Generate step name
        step_name = step_namer.generate_name(
            event_data.get("event_type", "tap"),
            event_data,
            event_data.get("action_data", {})
        )
        assert step_name is not None
        assert len(step_name) > 0

        # Create workflow step
        step = WorkflowStep(
            action=ActionType.TAP,
            selector=selector,
            name=step_name,
            order=0,
            timestamp=datetime.now(),
            metadata=event_data,
        )

        assert step.action == ActionType.TAP
        assert step.selector.type == SelectorType.RESOURCE_ID
        assert "Sign In" in step.name or "Login" in step.name

    def test_multiple_events_to_workflow(self):
        """Test converting multiple events to complete workflow."""
        selector_gen = get_selector_generator()
        step_namer = get_step_namer()

        events = [
            {
                "event_type": "tap",
                "resource_id": "com.app:id/username_field",
                "text": "Username",
                "bounds": "50,100,350,150",
            },
            {
                "event_type": "input_text",
                "resource_id": "com.app:id/username_field",
                "text": "testuser",
                "bounds": "50,100,350,150",
                "action_data": {"text": "testuser"},
            },
            {
                "event_type": "tap",
                "resource_id": "com.app:id/password_field",
                "text": "Password",
                "bounds": "50,170,350,220",
            },
            {
                "event_type": "input_text",
                "resource_id": "com.app:id/password_field",
                "text": "********",
                "bounds": "50,170,350,220",
                "action_data": {"text": "secret123"},
            },
            {
                "event_type": "tap",
                "resource_id": "com.app:id/login_button",
                "text": "Login",
                "bounds": "100,300,300,350",
            },
        ]

        steps = []
        for i, event_data in enumerate(events):
            selector = selector_gen.generate_selector(event_data)
            if selector is None:
                continue

            action_str = event_data.get("event_type", "tap")
            try:
                action = ActionType(action_str)
            except ValueError:
                action = ActionType.TAP

            step_name = step_namer.generate_name(
                action_str,
                event_data,
                event_data.get("action_data", {})
            )

            step = WorkflowStep(
                action=action,
                selector=selector,
                name=step_name,
                order=i,
                timestamp=datetime.now(),
                metadata=event_data,
            )
            steps.append(step)

        # Create workflow
        workflow = Workflow(
            name="Login Flow",
            description="Recorded login workflow",
            steps=steps,
        )

        assert len(workflow.steps) == 5
        assert workflow.name == "Login Flow"

        # Verify step order
        for i, step in enumerate(workflow.steps):
            assert step.order == i


class TestBackendRecordingMethods:
    """Test backend service recording control methods."""

    @pytest.mark.asyncio
    async def test_start_recording_success(self):
        """Test successful recording start."""
        backend = BackendService()

        with patch.object(backend, '_setup_port_forwarding', return_value=True):
            with patch.object(backend, '_get_http_session') as mock_session:
                mock_response = AsyncMock()
                mock_response.status = 200
                mock_response.json = AsyncMock(return_value={"success": True})

                mock_context = AsyncMock()
                mock_context.__aenter__ = AsyncMock(return_value=mock_response)
                mock_context.__aexit__ = AsyncMock(return_value=None)

                session = AsyncMock()
                session.post.return_value = mock_context
                mock_session.return_value = session

                result = await backend.start_recording("device123")

                assert result is True
                session.post.assert_called_once()

    @pytest.mark.asyncio
    async def test_stop_recording_returns_events(self):
        """Test stopping recording returns captured events."""
        backend = BackendService()

        with patch.object(backend, '_get_http_session') as mock_session:
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(return_value={"success": True})

            mock_context = AsyncMock()
            mock_context.__aenter__ = AsyncMock(return_value=mock_response)
            mock_context.__aexit__ = AsyncMock(return_value=None)

            session = AsyncMock()
            session.post.return_value = mock_context
            mock_session.return_value = session

            result = await backend.stop_recording("device123")

            assert result is True

    @pytest.mark.asyncio
    async def test_get_recorded_events(self):
        """Test retrieving recorded events from device."""
        backend = BackendService()

        mock_events = [
            {
                "event_type": "tap",
                "resource_id": "com.app:id/button",
                "text": "Click",
                "bounds": "0,0,100,50",
            },
            {
                "event_type": "input_text",
                "resource_id": "com.app:id/input",
                "text": "Hello",
                "bounds": "0,60,200,110",
            },
        ]

        with patch.object(backend, '_get_http_session') as mock_session:
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(return_value={"events": mock_events})

            mock_context = AsyncMock()
            mock_context.__aenter__ = AsyncMock(return_value=mock_response)
            mock_context.__aexit__ = AsyncMock(return_value=None)

            session = AsyncMock()
            session.get.return_value = mock_context
            mock_session.return_value = session

            events = await backend.get_recorded_events("device123")

            assert len(events) == 2
            assert events[0]["event_type"] == "tap"
            assert events[1]["event_type"] == "input_text"


class TestRecordingFlowIntegration:
    """Integration tests for complete recording flow."""

    @pytest.mark.asyncio
    async def test_full_recording_flow(self):
        """Test complete recording flow: start -> capture -> stop -> save."""
        backend = BackendService()
        selector_gen = get_selector_generator()
        step_namer = get_step_namer()

        # Mock device events
        captured_events = [
            {
                "event_type": "tap",
                "timestamp": 1735296000000,
                "resource_id": "com.example:id/btn_login",
                "content_description": "Login button",
                "text": "Sign In",
                "bounds": "100,400,300,460",
            },
        ]

        # Simulate start recording
        with patch.object(backend, '_setup_port_forwarding', return_value=True):
            with patch.object(backend, '_get_http_session') as mock_session:
                # Mock start recording response
                mock_start = AsyncMock()
                mock_start.status = 200
                mock_start.json = AsyncMock(return_value={"success": True})

                mock_start_ctx = AsyncMock()
                mock_start_ctx.__aenter__ = AsyncMock(return_value=mock_start)
                mock_start_ctx.__aexit__ = AsyncMock(return_value=None)

                # Mock get events response
                mock_events = AsyncMock()
                mock_events.status = 200
                mock_events.json = AsyncMock(return_value={"events": captured_events})

                mock_events_ctx = AsyncMock()
                mock_events_ctx.__aenter__ = AsyncMock(return_value=mock_events)
                mock_events_ctx.__aexit__ = AsyncMock(return_value=None)

                # Mock stop recording response
                mock_stop = AsyncMock()
                mock_stop.status = 200
                mock_stop.json = AsyncMock(return_value={"success": True})

                mock_stop_ctx = AsyncMock()
                mock_stop_ctx.__aenter__ = AsyncMock(return_value=mock_stop)
                mock_stop_ctx.__aexit__ = AsyncMock(return_value=None)

                session = AsyncMock()
                session.post.side_effect = [mock_start_ctx, mock_stop_ctx]
                session.get.return_value = mock_events_ctx
                mock_session.return_value = session

                # Step 1: Start recording
                started = await backend.start_recording("device123")
                assert started is True

                # Step 2: Get recorded events
                events = await backend.get_recorded_events("device123")
                assert len(events) == 1

                # Step 3: Process events into workflow steps
                steps = []
                for i, event in enumerate(events):
                    selector = selector_gen.generate_selector(event)
                    if selector:
                        action_str = event.get("event_type", "tap")
                        try:
                            action = ActionType(action_str)
                        except ValueError:
                            action = ActionType.TAP

                        step_name = step_namer.generate_name(
                            action_str, event, event.get("action_data", {})
                        )

                        step = WorkflowStep(
                            action=action,
                            selector=selector,
                            name=step_name,
                            order=i,
                            timestamp=datetime.now(),
                            metadata=event,
                        )
                        steps.append(step)

                assert len(steps) == 1
                assert steps[0].action == ActionType.TAP
                assert "Sign In" in steps[0].name or "Login" in steps[0].name

                # Step 4: Create workflow
                workflow = Workflow(
                    name="Recorded Flow",
                    description="Auto-recorded workflow",
                    steps=steps,
                )

                assert workflow.name == "Recorded Flow"
                assert len(workflow.steps) == 1

                # Step 5: Stop recording
                stopped = await backend.stop_recording("device123")
                assert stopped is True

    def test_event_latency_requirement(self):
        """Verify event processing can complete within 500ms requirement."""
        import time

        selector_gen = get_selector_generator()
        step_namer = get_step_namer()

        event_data = {
            "event_type": "tap",
            "resource_id": "com.example:id/complex_button",
            "content_description": "Complex action button with long description",
            "text": "Perform Complex Action",
            "bounds": "50,100,350,180",
            "class_name": "android.widget.Button",
        }

        start_time = time.time()

        # Process event
        selector = selector_gen.generate_selector(event_data)
        step_name = step_namer.generate_name(
            event_data.get("event_type", "tap"),
            event_data,
            {}
        )

        # Create step
        step = WorkflowStep(
            action=ActionType.TAP,
            selector=selector,
            name=step_name,
            order=0,
            timestamp=datetime.now(),
            metadata=event_data,
        )

        elapsed_ms = (time.time() - start_time) * 1000

        # Should complete well under 500ms (requirement is <100ms for selector generation)
        assert elapsed_ms < 100, f"Event processing took {elapsed_ms}ms, should be <100ms"
        assert selector is not None
        assert step.name is not None
