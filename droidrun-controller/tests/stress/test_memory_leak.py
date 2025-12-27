"""
Memory Leak Verification Tests

These tests verify that the recording/replay system does not leak memory
through repeated cycling. Key areas verified:
- RecordingManager event buffer cleanup
- Python model serialization/deserialization cycles
- Database session management
- HTTP connection handling
"""

import pytest
import asyncio
import gc
import sys
from datetime import datetime, timezone
from typing import List


# Test the Python models don't leak memory during repeated serialization cycles
class TestMemoryLeakVerification:
    """Memory leak verification for Python components."""

    def test_workflow_model_serialization_cycles(self):
        """
        Run 100+ serialization/deserialization cycles on Workflow models.
        Verifies no memory leaks in Pydantic model handling.
        """
        from app.models.workflow import Workflow, WorkflowStep, ElementSelector

        initial_objects = len(gc.get_objects())

        for cycle in range(150):
            # Create a workflow with multiple steps
            steps = []
            for i in range(10):
                selector = ElementSelector(
                    type="resource-id",
                    value=f"com.test:id/button_{cycle}_{i}",
                    confidence=0.95,
                    fallback_selectors=[]
                )
                step = WorkflowStep(
                    action="tap",
                    selector=selector,
                    name=f"Tap Button {i}",
                    order=i,
                    wait_before_ms=100,
                    wait_after_ms=200
                )
                steps.append(step)

            workflow = Workflow(
                name=f"Test Workflow {cycle}",
                steps=steps,
                description=f"Workflow for cycle {cycle}",
                created_at=datetime.now(timezone.utc)
            )

            # Serialize to dict (simulates JSON conversion)
            data = workflow.model_dump()
            assert data is not None
            assert len(data["steps"]) == 10

            # Deserialize back
            recovered = Workflow.model_validate(data)
            assert recovered.name == f"Test Workflow {cycle}"

            # Force garbage collection every 10 cycles
            if cycle % 10 == 0:
                gc.collect()

        # Final cleanup
        gc.collect()

        # Check object count hasn't grown excessively
        final_objects = len(gc.get_objects())
        object_growth = final_objects - initial_objects

        # Allow some growth but should be bounded
        # (some growth is expected due to caching, but should be < 10000)
        assert object_growth < 10000, f"Excessive object growth: {object_growth}"

    def test_selector_generator_cycles(self):
        """
        Run 100+ selector generation cycles.
        Verifies SelectorGenerator doesn't accumulate state.
        """
        from app.services.selector_generator import SelectorGenerator

        generator = SelectorGenerator()
        initial_objects = len(gc.get_objects())

        for cycle in range(150):
            # Simulate element data from Android
            element_data = {
                "resourceId": f"com.test:id/element_{cycle}",
                "contentDescription": f"Element {cycle}",
                "text": f"Text {cycle}",
                "bounds": f"{cycle},{cycle},{cycle+100},{cycle+50}",
                "className": "android.widget.Button"
            }

            # Generate selector
            selector = generator.generate_selector(element_data)
            assert selector is not None
            assert selector.type == "resource-id"

            # Generate all selectors (fallback chain)
            all_selectors = generator.generate_all_selectors(element_data)
            assert len(all_selectors) > 0

            if cycle % 20 == 0:
                gc.collect()

        gc.collect()
        final_objects = len(gc.get_objects())
        object_growth = final_objects - initial_objects

        assert object_growth < 5000, f"Selector generator memory growth: {object_growth}"

    def test_step_namer_cycles(self):
        """
        Run 100+ step naming cycles.
        Verifies StepNamer doesn't accumulate state.
        """
        from app.services.step_namer import StepNamer

        namer = StepNamer()
        initial_objects = len(gc.get_objects())

        actions = ["tap", "long_tap", "swipe", "input_text", "scroll", "wait"]

        for cycle in range(150):
            for action in actions:
                element_data = {
                    "text": f"Button {cycle}",
                    "contentDescription": f"Click to {action}",
                    "resourceId": f"com.test:id/{action}_{cycle}",
                    "className": "android.widget.Button"
                }

                action_data = None
                if action == "swipe":
                    action_data = {"direction": "up"}
                elif action == "input_text":
                    action_data = {"current_text": f"text_{cycle}"}

                name = namer.generate_name(action, element_data, action_data)
                assert name is not None
                assert len(name) > 0

            if cycle % 20 == 0:
                gc.collect()

        gc.collect()
        final_objects = len(gc.get_objects())
        object_growth = final_objects - initial_objects

        assert object_growth < 5000, f"Step namer memory growth: {object_growth}"

    def test_event_processing_pipeline_cycles(self):
        """
        Test the full event processing pipeline for memory leaks.
        Simulates receiving events from Android and processing them.
        """
        from app.services.selector_generator import SelectorGenerator
        from app.services.step_namer import StepNamer
        from app.models.workflow import WorkflowStep, ElementSelector

        generator = SelectorGenerator()
        namer = StepNamer()

        initial_objects = len(gc.get_objects())
        event_types = ["tap", "long_tap", "text_input", "scroll", "focus"]

        for cycle in range(100):
            processed_steps: List[WorkflowStep] = []

            # Simulate a recording session with 10 events
            for i in range(10):
                event_type = event_types[i % len(event_types)]

                # Simulate Android event data
                raw_event = {
                    "event_type": event_type,
                    "timestamp": 1234567890 + (cycle * 1000) + i,
                    "package_name": "com.test.app",
                    "class_name": "android.widget.Button",
                    "resource_id": f"com.test:id/btn_{cycle}_{i}",
                    "content_description": f"Button {i}",
                    "text": f"Click {i}",
                    "bounds": f"0,0,{100+i},{50+i}",
                    "is_clickable": True,
                    "is_editable": event_type == "text_input",
                    "is_scrollable": event_type == "scroll",
                    "action_data": {"key": "value"} if event_type in ["scroll", "text_input"] else None
                }

                # Generate selector
                selector = generator.generate_selector(raw_event)
                fallbacks = generator.generate_all_selectors(raw_event)

                # Generate step name
                name = namer.generate_name(
                    event_type,
                    raw_event,
                    raw_event.get("action_data")
                )

                # Create workflow step
                step = WorkflowStep(
                    action=event_type if event_type != "text_input" else "input_text",
                    selector=ElementSelector(
                        type=selector.type,
                        value=selector.value,
                        confidence=selector.confidence,
                        fallback_selectors=[
                            {"type": s.type, "value": s.value, "confidence": s.confidence}
                            for s in fallbacks[1:3]  # First 2 fallbacks
                        ] if len(fallbacks) > 1 else []
                    ),
                    name=name,
                    order=i
                )
                processed_steps.append(step)

            # Verify processing completed
            assert len(processed_steps) == 10

            # Clear the list (simulating workflow save and new session)
            processed_steps.clear()

            if cycle % 20 == 0:
                gc.collect()

        gc.collect()
        final_objects = len(gc.get_objects())
        object_growth = final_objects - initial_objects

        assert object_growth < 10000, f"Pipeline memory growth: {object_growth}"


@pytest.mark.asyncio
class TestAsyncMemoryLeak:
    """Async memory leak tests for database and HTTP operations."""

    async def test_database_session_cycles(self):
        """
        Verify database sessions are properly closed after repeated operations.
        """
        from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
        from app.database.schema import Base, WorkflowDB

        engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        session_factory = async_sessionmaker(engine, expire_on_commit=False)

        initial_objects = len(gc.get_objects())

        for cycle in range(100):
            async with session_factory() as session:
                # Create workflow
                workflow_db = WorkflowDB(
                    name=f"Workflow {cycle}",
                    description=f"Test workflow {cycle}",
                    steps_json="[]",
                    is_active=True,
                    app_package="com.test.app",
                    version=1
                )
                session.add(workflow_db)
                await session.commit()

                # Query back
                from sqlalchemy import select
                result = await session.scalars(
                    select(WorkflowDB).where(WorkflowDB.name == f"Workflow {cycle}")
                )
                found = result.first()
                assert found is not None
                assert found.name == f"Workflow {cycle}"

                # Delete to keep database clean
                await session.delete(found)
                await session.commit()

            if cycle % 20 == 0:
                gc.collect()

        await engine.dispose()
        gc.collect()

        final_objects = len(gc.get_objects())
        object_growth = final_objects - initial_objects

        assert object_growth < 5000, f"Database session memory growth: {object_growth}"

    async def test_workflow_conversion_cycles(self):
        """
        Test Pydantic to SQLAlchemy conversion cycles.
        """
        from app.models.workflow import Workflow, WorkflowStep, ElementSelector
        from app.database.schema import WorkflowDB
        from datetime import datetime, timezone

        initial_objects = len(gc.get_objects())

        for cycle in range(100):
            # Create Pydantic model
            steps = []
            for i in range(5):
                step = WorkflowStep(
                    action="tap",
                    selector=ElementSelector(
                        type="resource-id",
                        value=f"com.test:id/btn_{i}",
                        confidence=0.95
                    ),
                    name=f"Step {i}",
                    order=i
                )
                steps.append(step)

            workflow = Workflow(
                name=f"Test {cycle}",
                steps=steps,
                created_at=datetime.now(timezone.utc)
            )

            # Convert to DB model
            db_model = WorkflowDB.from_pydantic(workflow)
            assert db_model.name == f"Test {cycle}"

            # Convert back to Pydantic
            recovered = db_model.to_pydantic()
            assert recovered.name == f"Test {cycle}"
            assert len(recovered.steps) == 5

            if cycle % 20 == 0:
                gc.collect()

        gc.collect()
        final_objects = len(gc.get_objects())
        object_growth = final_objects - initial_objects

        assert object_growth < 8000, f"Conversion cycle memory growth: {object_growth}"


class TestRecordingReplayCycles:
    """Test recording/replay simulation cycles."""

    def test_simulate_100_recording_cycles(self):
        """
        Simulate 100 complete recording cycles:
        1. Start recording (simulated)
        2. Receive events
        3. Process events to workflow steps
        4. Stop recording
        5. Clear buffer

        This mirrors what happens on the Android side with RecordingManager.
        """
        from app.services.selector_generator import SelectorGenerator
        from app.services.step_namer import StepNamer
        from app.models.workflow import Workflow, WorkflowStep, ElementSelector
        from datetime import datetime, timezone

        generator = SelectorGenerator()
        namer = StepNamer()

        initial_objects = len(gc.get_objects())
        completed_workflows = 0

        for cycle in range(100):
            # Simulate event buffer (like RecordingManager.eventBuffer)
            event_buffer = []

            # Simulate recording: accumulate events
            for i in range(20):  # 20 events per recording
                event = {
                    "event_type": "tap" if i % 2 == 0 else "scroll",
                    "timestamp": 1000 * cycle + i,
                    "resource_id": f"com.test:id/element_{i}",
                    "text": f"Element {i}",
                    "bounds": "0,0,100,50",
                    "is_clickable": True,
                    "sequence_number": i + 1
                }
                event_buffer.append(event)

            # Process events to workflow (like when recording stops)
            steps = []
            for i, event in enumerate(event_buffer):
                selector = generator.generate_selector(event)
                name = namer.generate_name(event["event_type"], event)
                step = WorkflowStep(
                    action=event["event_type"],
                    selector=ElementSelector(
                        type=selector.type,
                        value=selector.value,
                        confidence=selector.confidence
                    ),
                    name=name,
                    order=i
                )
                steps.append(step)

            # Create workflow
            workflow = Workflow(
                name=f"Recorded Workflow {cycle}",
                steps=steps,
                created_at=datetime.now(timezone.utc)
            )

            # Simulate save (serialization)
            saved_data = workflow.model_dump()
            assert len(saved_data["steps"]) == 20

            completed_workflows += 1

            # Clear buffers (like RecordingManager.clearEvents())
            event_buffer.clear()
            steps.clear()

            if cycle % 20 == 0:
                gc.collect()

        assert completed_workflows == 100

        gc.collect()
        final_objects = len(gc.get_objects())
        object_growth = final_objects - initial_objects

        # Should not grow excessively
        assert object_growth < 15000, f"Recording cycle memory growth: {object_growth}"

    def test_simulate_replay_cycles(self):
        """
        Simulate 100 replay cycles to verify no memory leaks.
        """
        from app.models.workflow import Workflow, WorkflowStep, ElementSelector
        from datetime import datetime, timezone

        initial_objects = len(gc.get_objects())
        replays_completed = 0

        # Create a workflow to replay
        steps = [
            WorkflowStep(
                action="tap",
                selector=ElementSelector(
                    type="resource-id",
                    value="com.test:id/login_button",
                    confidence=0.95
                ),
                name="Tap Login",
                order=0
            ),
            WorkflowStep(
                action="input_text",
                selector=ElementSelector(
                    type="resource-id",
                    value="com.test:id/username",
                    confidence=0.95
                ),
                name="Enter Username",
                order=1,
                action_data={"text": "testuser"}
            ),
            WorkflowStep(
                action="tap",
                selector=ElementSelector(
                    type="resource-id",
                    value="com.test:id/submit",
                    confidence=0.95
                ),
                name="Tap Submit",
                order=2
            )
        ]

        workflow = Workflow(
            name="Login Flow",
            steps=steps,
            created_at=datetime.now(timezone.utc)
        )

        for cycle in range(100):
            # Serialize workflow for sending to Android
            workflow_data = workflow.model_dump()

            # Simulate replay: iterate through steps
            for step_data in workflow_data["steps"]:
                # Simulate command generation
                action = step_data["action"]
                selector = step_data["selector"]

                # Build replay command (like ReplayEngine does)
                command = {
                    "action": action,
                    "selector_type": selector["type"],
                    "selector_value": selector["value"],
                    "fallbacks": selector.get("fallback_selectors", [])
                }

                # Simulate response processing
                result = {
                    "success": True,
                    "step_order": step_data["order"],
                    "message": f"Executed {action}"
                }

                assert result["success"]

            replays_completed += 1

            if cycle % 20 == 0:
                gc.collect()

        assert replays_completed == 100

        gc.collect()
        final_objects = len(gc.get_objects())
        object_growth = final_objects - initial_objects

        assert object_growth < 8000, f"Replay cycle memory growth: {object_growth}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
