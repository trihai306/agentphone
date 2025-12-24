"""Tests for workflow service."""

import pytest
import pytest_asyncio

from droidrun_controller.services import WorkflowService


@pytest.mark.asyncio
async def test_create_workflow(test_db):
    """Test creating a workflow."""
    service = WorkflowService(test_db)

    workflow = await service.create_workflow(
        name="Test Workflow",
        description="A test workflow",
        app_package="com.example.app",
    )

    assert workflow.id is not None
    assert workflow.name == "Test Workflow"
    assert workflow.description == "A test workflow"
    assert workflow.app_package == "com.example.app"
    assert workflow.is_active is True


@pytest.mark.asyncio
async def test_get_workflow(test_db):
    """Test getting a workflow by ID."""
    service = WorkflowService(test_db)

    # Create workflow
    created = await service.create_workflow(name="Get Test")

    # Get workflow
    workflow = await service.get_workflow(created.id)

    assert workflow is not None
    assert workflow.id == created.id
    assert workflow.name == "Get Test"


@pytest.mark.asyncio
async def test_list_workflows(test_db):
    """Test listing workflows."""
    service = WorkflowService(test_db)

    # Create multiple workflows
    await service.create_workflow(name="Workflow 1")
    await service.create_workflow(name="Workflow 2")
    await service.create_workflow(name="Workflow 3")

    # List workflows
    workflows = await service.list_workflows()

    assert len(workflows) >= 3


@pytest.mark.asyncio
async def test_update_workflow(test_db):
    """Test updating a workflow."""
    service = WorkflowService(test_db)

    # Create workflow
    created = await service.create_workflow(name="Original Name")

    # Update workflow
    updated = await service.update_workflow(
        workflow_id=created.id,
        name="Updated Name",
        description="New description",
    )

    assert updated is not None
    assert updated.name == "Updated Name"
    assert updated.description == "New description"


@pytest.mark.asyncio
async def test_delete_workflow(test_db):
    """Test deleting a workflow."""
    service = WorkflowService(test_db)

    # Create workflow
    created = await service.create_workflow(name="To Delete")

    # Delete workflow
    deleted = await service.delete_workflow(created.id)
    assert deleted is True

    # Verify deleted
    workflow = await service.get_workflow(created.id)
    assert workflow is None


@pytest.mark.asyncio
async def test_add_action(test_db):
    """Test adding actions to a workflow."""
    service = WorkflowService(test_db)

    # Create workflow
    workflow = await service.create_workflow(name="With Actions")

    # Add action
    action = await service.add_action(
        workflow_id=workflow.id,
        action_type="tap",
        parameters={"x": 100, "y": 200},
        description="Tap at center",
    )

    assert action.id is not None
    assert action.workflow_id == workflow.id
    assert action.action_type == "tap"
    assert action.parameters == {"x": 100, "y": 200}
    assert action.sequence_order == 1


@pytest.mark.asyncio
async def test_export_import_workflow(test_db):
    """Test exporting and importing a workflow."""
    service = WorkflowService(test_db)

    # Create workflow with actions
    workflow = await service.create_workflow(
        name="Export Test",
        description="Test export/import",
    )
    await service.add_action(
        workflow_id=workflow.id,
        action_type="tap",
        parameters={"x": 50, "y": 50},
    )
    await service.add_action(
        workflow_id=workflow.id,
        action_type="input",
        parameters={"text": "Hello"},
    )

    # Export
    exported = await service.export_workflow(workflow.id)

    assert exported is not None
    assert exported["name"] == "Export Test"
    assert len(exported["actions"]) == 2

    # Import
    imported = await service.import_workflow(exported)

    assert imported.id != workflow.id  # New ID
    assert imported.name == "Export Test"

    # Verify actions were imported
    actions = await service.get_actions(imported.id)
    assert len(actions) == 2


@pytest.mark.asyncio
async def test_duplicate_workflow(test_db):
    """Test duplicating a workflow."""
    service = WorkflowService(test_db)

    # Create original
    original = await service.create_workflow(name="Original")
    await service.add_action(
        workflow_id=original.id,
        action_type="back",
        parameters={},
    )

    # Duplicate
    duplicate = await service.duplicate_workflow(original.id, "Duplicated")

    assert duplicate is not None
    assert duplicate.id != original.id
    assert duplicate.name == "Duplicated"

    # Verify actions were duplicated
    actions = await service.get_actions(duplicate.id)
    assert len(actions) == 1
