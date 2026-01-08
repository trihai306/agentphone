"""SQLAlchemy 2.0 database schema for workflow storage.

This module defines ORM models using SQLAlchemy 2.0 syntax:
- DeclarativeBase (NOT legacy declarative_base())
- Mapped[] type annotations
- mapped_column() for column definitions

The schema stores workflows with their steps serialized as JSON,
allowing flexibility for the complex nested Pydantic model structure.

Usage:
    from app.database.schema import Base, WorkflowDB

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Query workflows
    async with session() as s:
        result = await s.scalars(select(WorkflowDB).where(WorkflowDB.id == "abc"))
        workflow = result.first()
"""

from datetime import datetime
from typing import Optional, List
import json

from sqlalchemy import String, Boolean, Integer, Text, DateTime, func, JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.models.workflow import Workflow, WorkflowStep


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models.

    Uses SQLAlchemy 2.0 DeclarativeBase for type-aware ORM models.
    """
    pass


class WorkflowDB(Base):
    """SQLAlchemy ORM model for workflow storage.

    Stores workflow metadata and steps in SQLite database.
    Steps are serialized as JSON for flexibility.

    Attributes:
        id: Unique identifier (UUID string from Pydantic model).
        name: Human-readable workflow name.
        description: Optional detailed description.
        steps_json: JSON-serialized list of workflow steps.
        is_active: Whether the workflow is enabled for execution.
        created_at: When the workflow was created.
        updated_at: When the workflow was last modified.
        device_info_json: JSON-serialized device information.
        app_package: Package name of the target app.
        tags_json: JSON-serialized list of tags.
        version: Workflow version number.
    """
    __tablename__ = "workflows"

    # Primary key - use string UUID from Pydantic model
    id: Mapped[str] = mapped_column(String(36), primary_key=True)

    # Core workflow fields
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Steps stored as JSON for flexibility
    steps_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=func.now(),
        nullable=False
    )

    # Recording context
    device_info_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    app_package: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)

    # Organization
    tags_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    def __repr__(self) -> str:
        return f"WorkflowDB(id={self.id!r}, name={self.name!r}, steps={len(self.get_steps())})"

    @classmethod
    def from_pydantic(cls, workflow: Workflow) -> "WorkflowDB":
        """Create a WorkflowDB instance from a Pydantic Workflow model.

        Args:
            workflow: Pydantic Workflow model instance.

        Returns:
            WorkflowDB instance ready for database insertion.
        """
        return cls(
            id=workflow.id,
            name=workflow.name,
            description=workflow.description,
            steps_json=json.dumps([step.model_dump(mode="json") for step in workflow.steps]),
            is_active=workflow.is_active,
            created_at=workflow.created_at,
            updated_at=workflow.updated_at,
            device_info_json=json.dumps(workflow.device_info) if workflow.device_info else None,
            app_package=workflow.app_package,
            tags_json=json.dumps(workflow.tags),
            version=workflow.version
        )

    def to_pydantic(self) -> Workflow:
        """Convert this WorkflowDB instance to a Pydantic Workflow model.

        Returns:
            Pydantic Workflow model with all data from this DB record.
        """
        steps_data = json.loads(self.steps_json) if self.steps_json else []
        steps = [WorkflowStep.model_validate(step_data) for step_data in steps_data]

        device_info = None
        if self.device_info_json:
            device_info = json.loads(self.device_info_json)

        tags = json.loads(self.tags_json) if self.tags_json else []

        return Workflow(
            id=self.id,
            name=self.name,
            description=self.description,
            steps=steps,
            is_active=self.is_active,
            created_at=self.created_at,
            updated_at=self.updated_at,
            device_info=device_info,
            app_package=self.app_package,
            tags=tags,
            version=self.version
        )

    def get_steps(self) -> List[WorkflowStep]:
        """Get workflow steps as Pydantic models.

        Returns:
            List of WorkflowStep instances.
        """
        steps_data = json.loads(self.steps_json) if self.steps_json else []
        return [WorkflowStep.model_validate(step_data) for step_data in steps_data]

    def set_steps(self, steps: List[WorkflowStep]) -> None:
        """Set workflow steps from Pydantic models.

        Args:
            steps: List of WorkflowStep instances to store.
        """
        self.steps_json = json.dumps([step.model_dump(mode="json") for step in steps])
        self.updated_at = datetime.utcnow()

    def get_tags(self) -> List[str]:
        """Get workflow tags as a list.

        Returns:
            List of tag strings.
        """
        return json.loads(self.tags_json) if self.tags_json else []

    def set_tags(self, tags: List[str]) -> None:
        """Set workflow tags.

        Args:
            tags: List of tag strings to store.
        """
        self.tags_json = json.dumps(tags)
        self.updated_at = datetime.utcnow()

    def get_device_info(self) -> Optional[dict]:
        """Get device info as a dictionary.

        Returns:
            Device info dictionary or None.
        """
        if self.device_info_json:
            return json.loads(self.device_info_json)
        return None

    def set_device_info(self, device_info: Optional[dict]) -> None:
        """Set device info.

        Args:
            device_info: Device info dictionary or None.
        """
        self.device_info_json = json.dumps(device_info) if device_info else None
        self.updated_at = datetime.utcnow()

    @property
    def step_count(self) -> int:
        """Get the number of steps in this workflow.

        Returns:
            Number of steps.
        """
        steps_data = json.loads(self.steps_json) if self.steps_json else []
        return len(steps_data)


class UserDB(Base):
    """SQLAlchemy ORM model for user authentication storage.

    Stores user credentials for authentication. Passwords are stored as
    bcrypt hashes, never in plain text.

    Attributes:
        id: Auto-incrementing integer primary key.
        email: User email address (unique, indexed for fast lookups).
        password_hash: Bcrypt hash of the user's password.
        created_at: When the user account was created.
    """
    __tablename__ = "users"

    # Primary key - auto-incrementing integer
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # User credentials
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        server_default=func.now(),
        nullable=False
    )

    def __repr__(self) -> str:
        return f"UserDB(id={self.id!r}, email={self.email!r})"


class InteractionHistoryDB(Base):
    """SQLAlchemy ORM model for interaction history storage.

    Stores user interaction data from the portal-apk when users tap on UI elements.
    This captures the complete node information from the Android accessibility tree.

    Attributes:
        id: Auto-incrementing integer primary key.
        user_id: ID of the user who performed the interaction.
        device_serial: Serial number of the device.
        package_name: Package name of the app where interaction occurred.
        activity_name: Current activity name.
        node_class: Class name of the UI node (e.g., android.widget.Button).
        node_text: Text content of the node.
        node_content_desc: Content description (accessibility label).
        node_resource_id: Resource ID of the node.
        node_bounds: Bounds of the node as JSON string [left, top, right, bottom].
        node_index: Index of the node in parent.
        node_checkable: Whether the node is checkable.
        node_checked: Whether the node is checked.
        node_clickable: Whether the node is clickable.
        node_enabled: Whether the node is enabled.
        node_focusable: Whether the node is focusable.
        node_focused: Whether the node is focused.
        node_scrollable: Whether the node is scrollable.
        node_selected: Whether the node is selected.
        node_xpath: XPath to the node in the hierarchy.
        node_hierarchy_json: Full node hierarchy as JSON.
        action_type: Type of action performed (tap, long_tap, swipe, etc.).
        tap_x: X coordinate of tap.
        tap_y: Y coordinate of tap.
        screenshot_path: Path to screenshot taken at interaction time.
        metadata_json: Additional metadata as JSON.
        created_at: When the interaction was recorded.
        synced_at: When the interaction was synced to backend.
    """
    __tablename__ = "interaction_history"

    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # User and device context
    user_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)
    device_serial: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    session_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)

    # App context
    package_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    activity_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Node information
    node_class: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    node_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    node_content_desc: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    node_resource_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    node_bounds: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    node_index: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Node state flags
    node_checkable: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    node_checked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    node_clickable: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    node_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    node_focusable: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    node_focused: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    node_scrollable: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    node_selected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Node hierarchy
    node_xpath: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    node_hierarchy_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Action information
    action_type: Mapped[str] = mapped_column(String(50), nullable=False, default="tap")
    tap_x: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    tap_y: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Additional data
    screenshot_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    metadata_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        server_default=func.now(),
        nullable=False,
        index=True
    )
    synced_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"InteractionHistoryDB(id={self.id!r}, device={self.device_serial!r}, action={self.action_type!r})"

    def to_dict(self) -> dict:
        """Convert to dictionary for API responses."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "device_serial": self.device_serial,
            "session_id": self.session_id,
            "package_name": self.package_name,
            "activity_name": self.activity_name,
            "node": {
                "class": self.node_class,
                "text": self.node_text,
                "content_desc": self.node_content_desc,
                "resource_id": self.node_resource_id,
                "bounds": json.loads(self.node_bounds) if self.node_bounds else None,
                "index": self.node_index,
                "checkable": self.node_checkable,
                "checked": self.node_checked,
                "clickable": self.node_clickable,
                "enabled": self.node_enabled,
                "focusable": self.node_focusable,
                "focused": self.node_focused,
                "scrollable": self.node_scrollable,
                "selected": self.node_selected,
                "xpath": self.node_xpath,
            },
            "action_type": self.action_type,
            "tap_x": self.tap_x,
            "tap_y": self.tap_y,
            "screenshot_path": self.screenshot_path,
            "metadata": json.loads(self.metadata_json) if self.metadata_json else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "synced_at": self.synced_at.isoformat() if self.synced_at else None,
        }

    @classmethod
    def from_api_data(cls, data: dict) -> "InteractionHistoryDB":
        """Create an InteractionHistoryDB instance from API request data.

        Args:
            data: Dictionary containing interaction data from portal-apk.

        Returns:
            InteractionHistoryDB instance ready for database insertion.
        """
        node = data.get("node", {})
        bounds = node.get("bounds")

        return cls(
            user_id=data.get("user_id"),
            device_serial=data.get("device_serial", "unknown"),
            session_id=data.get("session_id"),
            package_name=data.get("package_name"),
            activity_name=data.get("activity_name"),
            node_class=node.get("class"),
            node_text=node.get("text"),
            node_content_desc=node.get("content_desc"),
            node_resource_id=node.get("resource_id"),
            node_bounds=json.dumps(bounds) if bounds else None,
            node_index=node.get("index"),
            node_checkable=node.get("checkable", False),
            node_checked=node.get("checked", False),
            node_clickable=node.get("clickable", False),
            node_enabled=node.get("enabled", True),
            node_focusable=node.get("focusable", False),
            node_focused=node.get("focused", False),
            node_scrollable=node.get("scrollable", False),
            node_selected=node.get("selected", False),
            node_xpath=node.get("xpath"),
            node_hierarchy_json=json.dumps(node.get("hierarchy")) if node.get("hierarchy") else None,
            action_type=data.get("action_type", "tap"),
            tap_x=data.get("tap_x"),
            tap_y=data.get("tap_y"),
            screenshot_path=data.get("screenshot_path"),
            metadata_json=json.dumps(data.get("metadata")) if data.get("metadata") else None,
        )


# Alias for backward compatibility and simpler imports
Workflow = WorkflowDB
