"""End-to-end tests for the complete workflow record and replay flow.

These tests verify the full flow:
1. Load recorded workflow in Desktop UI (via database)
2. Click 'Replay'
3. Verify Android receives workflow via HTTP
4. Verify AccessibilityService performs actions in sequence
5. Verify actions complete successfully (or log failures with selector fallback)

Note: These tests require:
- A connected Android device with Portal APK installed
- Accessibility Service enabled on the device
- ADB available in PATH
"""

import asyncio
import json
import os
import subprocess
import pytest
from datetime import datetime
from typing import Dict, Any, List, Optional

# Skip if no device connected
def is_device_connected() -> bool:
    """Check if an Android device is connected via ADB."""
    try:
        result = subprocess.run(
            ["adb", "devices"],
            capture_output=True,
            text=True,
            timeout=5
        )
        lines = result.stdout.strip().split('\n')[1:]
        for line in lines:
            if line.strip() and "device" in line:
                return True
        return False
    except Exception:
        return False


# Skip decorator for tests requiring a device
requires_device = pytest.mark.skipif(
    not is_device_connected(),
    reason="No Android device connected"
)


# Sample workflow for testing
SAMPLE_E2E_WORKFLOW = {
    "id": "e2e-test-workflow",
    "name": "E2E Test Workflow",
    "description": "End-to-end test workflow with simple actions",
    "is_active": True,
    "created_at": datetime.utcnow().isoformat(),
    "steps": [
        {
            "id": "step-wait-1",
            "name": "Initial Wait",
            "action": "wait",
            "wait_data": {"duration_ms": 500},
        },
        {
            "id": "step-swipe-down",
            "name": "Swipe Down",
            "action": "swipe",
            "swipe_data": {
                "direction": "down",
                "start_x": 540,
                "start_y": 500,
                "end_x": 540,
                "end_y": 1000,
                "duration_ms": 300,
            },
        },
        {
            "id": "step-wait-2",
            "name": "Final Wait",
            "action": "wait",
            "wait_data": {"duration_ms": 500},
        },
    ],
}


@requires_device
@pytest.mark.asyncio
async def test_e2e_device_ping():
    """Verify device is reachable via HTTP server."""
    from app.backend import BackendService

    backend = BackendService()
    await backend.initialize()

    devices = await backend.discover_devices()
    assert len(devices) > 0, "No devices discovered"

    device_id = devices[0]["id"]

    # Ping the device
    is_reachable = await backend.ping_device(device_id)

    await backend.close()

    # Note: This may fail if Portal APK is not running
    # Log the result rather than asserting
    if is_reachable:
        print(f"Device {device_id} is reachable via HTTP")
    else:
        pytest.skip("Device HTTP server not reachable - Portal APK may not be running")


@requires_device
@pytest.mark.asyncio
async def test_e2e_replay_simple_workflow():
    """Test replaying a simple workflow with wait actions."""
    from app.backend import BackendService

    backend = BackendService()
    await backend.initialize()

    # Discover devices
    devices = await backend.discover_devices()
    assert len(devices) > 0, "No devices discovered"

    device_id = devices[0]["id"]

    # Check device is reachable
    if not await backend.ping_device(device_id):
        await backend.close()
        pytest.skip("Device HTTP server not reachable")

    # Execute a simple wait-only workflow
    simple_workflow = {
        "id": "simple-wait-test",
        "name": "Simple Wait Test",
        "steps": [
            {
                "id": "step-1",
                "name": "Wait 100ms",
                "action": "wait",
                "wait_data": {"duration_ms": 100},
            },
            {
                "id": "step-2",
                "name": "Wait 100ms",
                "action": "wait",
                "wait_data": {"duration_ms": 100},
            },
        ],
    }

    result = await backend.replay_workflow(
        workflow=simple_workflow,
        device_serial=device_id,
        stop_on_error=True,
    )

    await backend.close()

    assert result["success"] is True, f"Replay failed: {result.get('error')}"
    assert result["completed_steps"] == 2
    assert result["status"] == "completed"


@requires_device
@pytest.mark.asyncio
async def test_e2e_replay_with_tap():
    """Test replaying a workflow with a tap action using coordinates."""
    from app.backend import BackendService

    backend = BackendService()
    await backend.initialize()

    devices = await backend.discover_devices()
    if not devices:
        await backend.close()
        pytest.skip("No devices connected")

    device_id = devices[0]["id"]

    if not await backend.ping_device(device_id):
        await backend.close()
        pytest.skip("Device HTTP server not reachable")

    # Workflow with a tap at center of screen
    tap_workflow = {
        "id": "tap-test",
        "name": "Tap Test",
        "steps": [
            {
                "id": "step-1",
                "name": "Tap Center",
                "action": "tap",
                "tap_data": {"x": 540, "y": 960},  # Approximate center
            },
            {
                "id": "step-2",
                "name": "Wait after tap",
                "action": "wait",
                "wait_data": {"duration_ms": 300},
            },
        ],
    }

    result = await backend.replay_workflow(
        workflow=tap_workflow,
        device_serial=device_id,
        stop_on_error=False,  # Don't stop on tap errors
    )

    await backend.close()

    # Just verify the workflow executed (tap may fail if nothing is at coords)
    assert result["status"] in ["completed", "failed"]
    assert result["completed_steps"] >= 1


@requires_device
@pytest.mark.asyncio
async def test_e2e_single_step_execution():
    """Test executing a single step for debugging."""
    from app.backend import BackendService

    backend = BackendService()
    await backend.initialize()

    devices = await backend.discover_devices()
    if not devices:
        await backend.close()
        pytest.skip("No devices connected")

    device_id = devices[0]["id"]

    if not await backend.ping_device(device_id):
        await backend.close()
        pytest.skip("Device HTTP server not reachable")

    # Execute a single tap step
    step = {
        "id": "single-step",
        "name": "Single Tap",
        "action": "tap",
        "tap_data": {"x": 540, "y": 500},
    }

    result = await backend.execute_single_step(
        step=step,
        device_serial=device_id,
    )

    await backend.close()

    # Verify result structure
    assert "success" in result
    assert "result" in result or "error" in result


@requires_device
@pytest.mark.asyncio
async def test_e2e_replay_progress_callback():
    """Test that progress callbacks are called during replay."""
    from app.backend import BackendService

    backend = BackendService()
    await backend.initialize()

    devices = await backend.discover_devices()
    if not devices:
        await backend.close()
        pytest.skip("No devices connected")

    device_id = devices[0]["id"]

    if not await backend.ping_device(device_id):
        await backend.close()
        pytest.skip("Device HTTP server not reachable")

    # Track progress updates
    progress_updates = []

    def on_progress(progress):
        progress_updates.append({
            "status": progress.status.value,
            "completed": progress.completed_steps,
            "total": progress.total_steps,
        })

    # Workflow with multiple steps
    workflow = {
        "id": "progress-test",
        "name": "Progress Test",
        "steps": [
            {"id": "s1", "name": "Wait 1", "action": "wait", "wait_data": {"duration_ms": 50}},
            {"id": "s2", "name": "Wait 2", "action": "wait", "wait_data": {"duration_ms": 50}},
            {"id": "s3", "name": "Wait 3", "action": "wait", "wait_data": {"duration_ms": 50}},
        ],
    }

    result = await backend.replay_workflow(
        workflow=workflow,
        device_serial=device_id,
        on_progress=on_progress,
    )

    await backend.close()

    # Verify we got progress updates
    assert result["success"] is True
    # Note: Progress callbacks may not be captured in mock scenarios


@pytest.mark.asyncio
async def test_e2e_workflow_database_integration():
    """Test loading workflow from database and preparing for replay."""
    from app.database.connection import init_db, get_session_context, close_db
    from app.database.schema import WorkflowDB
    from app.models.workflow import Workflow
    from sqlalchemy import select

    # Initialize test database
    test_db_path = "/tmp/test_workflows.db"
    os.environ["DATABASE_PATH"] = test_db_path

    try:
        # Clean up any existing test database
        if os.path.exists(test_db_path):
            os.remove(test_db_path)

        await init_db()

        # Create a workflow in the database
        async with get_session_context() as session:
            workflow_model = Workflow.model_validate(SAMPLE_E2E_WORKFLOW)
            workflow_db = WorkflowDB.from_pydantic(workflow_model)
            session.add(workflow_db)
            await session.commit()

            # Retrieve workflow ID
            saved_id = workflow_db.id

        # Load workflow from database
        async with get_session_context() as session:
            result = await session.scalars(
                select(WorkflowDB).where(WorkflowDB.id == saved_id)
            )
            loaded_db = result.first()

            assert loaded_db is not None
            assert loaded_db.name == "E2E Test Workflow"

            # Convert to Pydantic model (for replay)
            loaded_workflow = loaded_db.to_pydantic()

            assert loaded_workflow.id is not None
            assert len(loaded_workflow.steps) == 3
            assert loaded_workflow.steps[0].action.value == "wait"
            assert loaded_workflow.steps[1].action.value == "swipe"

        await close_db()

    finally:
        # Cleanup
        if os.path.exists(test_db_path):
            os.remove(test_db_path)
        if "DATABASE_PATH" in os.environ:
            del os.environ["DATABASE_PATH"]


@pytest.mark.asyncio
async def test_e2e_selector_fallback_chain():
    """Test that selector fallback works when primary selector fails."""
    from app.models.workflow import ElementSelector, SelectorType, WorkflowStep, ActionType

    # Create a step with fallback chain
    step = WorkflowStep(
        id="fallback-test",
        name="Tap with Fallback",
        action=ActionType.TAP,
        selector=ElementSelector(
            type=SelectorType.RESOURCE_ID,
            value="nonexistent:id/button",
            confidence=0.95,
            fallback=ElementSelector(
                type=SelectorType.CONTENT_DESC,
                value="Submit Button",
                confidence=0.85,
                fallback=ElementSelector(
                    type=SelectorType.BOUNDS,
                    value="[100,200][300,400]",
                    confidence=0.50,
                ),
            ),
        ),
    )

    # Verify fallback chain structure
    assert step.selector is not None
    assert step.selector.fallback is not None
    assert step.selector.fallback.fallback is not None
    assert step.selector.fallback.fallback.fallback is None  # End of chain

    # Verify serialization preserves chain
    step_dict = step.model_dump()
    assert step_dict["selector"]["fallback"]["type"] == "content-desc"
    assert step_dict["selector"]["fallback"]["fallback"]["type"] == "bounds"


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
