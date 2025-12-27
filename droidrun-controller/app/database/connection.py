"""Database connection manager with async SQLite support via aiosqlite.

This module provides async database connection management using SQLAlchemy 2.0
with aiosqlite for non-blocking SQLite operations.

Usage:
    from app.database.connection import get_session, init_db, close_db

    # Initialize database (creates tables)
    await init_db()

    # Use session as async context manager
    async with get_session() as session:
        result = await session.scalars(select(WorkflowDB))
        workflows = result.all()

    # Or use as async generator (for dependency injection)
    async for session in get_session():
        await session.execute(...)
"""

import os
from pathlib import Path
from typing import AsyncGenerator, Optional
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.database.schema import Base


# Default database path - can be overridden via environment variable
DEFAULT_DB_PATH = Path(__file__).parent.parent.parent / "workflows.db"


class DatabaseManager:
    """Manages async database connections and sessions.

    Provides centralized database connection management with:
    - Async engine creation with aiosqlite
    - Session factory for creating async sessions
    - Database initialization (table creation)
    - Proper cleanup/disposal of connections

    Attributes:
        engine: The async SQLAlchemy engine.
        session_factory: Factory for creating AsyncSession instances.
    """

    def __init__(self):
        """Initialize the database manager without connecting."""
        self._engine: Optional[AsyncEngine] = None
        self._session_factory: Optional[async_sessionmaker[AsyncSession]] = None
        self._initialized: bool = False

    @property
    def engine(self) -> Optional[AsyncEngine]:
        """Get the async engine, if initialized."""
        return self._engine

    @property
    def session_factory(self) -> Optional[async_sessionmaker[AsyncSession]]:
        """Get the session factory, if initialized."""
        return self._session_factory

    @property
    def is_initialized(self) -> bool:
        """Check if the database manager is initialized."""
        return self._initialized

    def _get_database_url(self) -> str:
        """Get the database URL from environment or use default.

        Returns:
            SQLite database URL in aiosqlite format.
        """
        db_path = os.environ.get("DATABASE_PATH", str(DEFAULT_DB_PATH))
        # Ensure path is absolute
        db_path = os.path.abspath(db_path)
        return f"sqlite+aiosqlite:///{db_path}"

    async def initialize(self, database_url: Optional[str] = None) -> None:
        """Initialize the database engine and session factory.

        Creates the async engine with aiosqlite driver and sets up
        the session factory. Also creates all tables if they don't exist.

        Args:
            database_url: Optional custom database URL. If not provided,
                         uses DATABASE_PATH env var or default path.
        """
        if self._initialized:
            return

        url = database_url or self._get_database_url()

        # Create async engine with aiosqlite
        self._engine = create_async_engine(
            url,
            echo=os.environ.get("DEBUG_MODE", "").lower() == "true",
            # Disable connection pooling for SQLite (single-threaded)
            pool_pre_ping=True,
        )

        # Create session factory
        # expire_on_commit=False prevents object expiration after commit
        # which is important for async operations where we may access
        # attributes after the session is closed
        self._session_factory = async_sessionmaker(
            bind=self._engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
            autocommit=False,
        )

        # Create tables if they don't exist
        async with self._engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        self._initialized = True

    async def close(self) -> None:
        """Close the database engine and cleanup resources.

        Should be called when the application shuts down to properly
        dispose of all connections.
        """
        if self._engine is not None:
            await self._engine.dispose()
            self._engine = None
            self._session_factory = None
            self._initialized = False

    @asynccontextmanager
    async def session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get an async session as a context manager.

        Yields:
            AsyncSession for database operations.

        Raises:
            RuntimeError: If database is not initialized.

        Example:
            async with db_manager.session() as session:
                result = await session.scalars(select(WorkflowDB))
        """
        if not self._initialized or self._session_factory is None:
            await self.initialize()

        async with self._session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    async def get_session_generator(self) -> AsyncGenerator[AsyncSession, None]:
        """Get an async session as an async generator.

        This is useful for dependency injection patterns where
        the session is provided as a dependency.

        Yields:
            AsyncSession for database operations.

        Example:
            async for session in db_manager.get_session_generator():
                result = await session.scalars(select(WorkflowDB))
        """
        if not self._initialized or self._session_factory is None:
            await self.initialize()

        async with self._session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise


# Global database manager instance
_db_manager = DatabaseManager()


async def init_db(database_url: Optional[str] = None) -> None:
    """Initialize the database.

    Creates the async engine, session factory, and database tables.

    Args:
        database_url: Optional custom database URL. If not provided,
                     uses DATABASE_PATH env var or default path.
    """
    await _db_manager.initialize(database_url)


async def close_db() -> None:
    """Close the database connection.

    Should be called when the application shuts down.
    """
    await _db_manager.close()


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Get an async database session.

    This is an async generator that yields a session and handles
    commit/rollback automatically. Useful for dependency injection.

    Yields:
        AsyncSession for database operations.

    Example:
        async for session in get_session():
            result = await session.scalars(select(WorkflowDB))
            workflows = result.all()

        # Or use __anext__ for single use:
        session = await get_session().__anext__()
    """
    if not _db_manager.is_initialized:
        await _db_manager.initialize()

    async for session in _db_manager.get_session_generator():
        yield session


@asynccontextmanager
async def get_session_context() -> AsyncGenerator[AsyncSession, None]:
    """Get an async database session as a context manager.

    Alternative to get_session() for cleaner context manager usage.

    Yields:
        AsyncSession for database operations.

    Example:
        async with get_session_context() as session:
            result = await session.scalars(select(WorkflowDB))
            workflows = result.all()
    """
    if not _db_manager.is_initialized:
        await _db_manager.initialize()

    async with _db_manager.session() as session:
        yield session


def get_db_manager() -> DatabaseManager:
    """Get the global database manager instance.

    Returns:
        The global DatabaseManager instance.
    """
    return _db_manager
