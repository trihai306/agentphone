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


# Alias for backward compatibility and simpler imports
Workflow = WorkflowDB
