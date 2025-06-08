"""
Database connection and session management for ZKP File Sharing API.

This module handles SQLAlchemy database connections, session management,
and provides database utilities for the application.
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import structlog

from app.core.config import get_settings

logger = structlog.get_logger(__name__)


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


class DatabaseManager:
    """Database connection and session manager."""
    
    def __init__(self):
        self.settings = get_settings()
        self.engine = None
        self.session_factory = None
        
    async def initialize(self):
        """Initialize database engine and session factory."""
        logger.info("Initializing database connection", url=self.settings.DATABASE_URL)
        
        self.engine = create_async_engine(
            self.settings.DATABASE_URL,
            echo=self.settings.DEBUG,
            pool_pre_ping=True,
            pool_recycle=3600,
        )
        
        self.session_factory = async_sessionmaker(
            bind=self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
        
        logger.info("Database connection initialized successfully")
    
    async def close(self):
        """Close database connections."""
        if self.engine:
            logger.info("Closing database connections")
            await self.engine.dispose()
    
    async def get_session(self) -> AsyncSession:
        """Get an async database session."""
        if not self.session_factory:
            raise RuntimeError("Database not initialized. Call initialize() first.")
        
        async with self.session_factory() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()


# Global database manager instance
db_manager = DatabaseManager()


async def get_db_session() -> AsyncSession:
    """Dependency to get database session."""
    async for session in db_manager.get_session():
        yield session


async def init_db():
    """Initialize database connection."""
    await db_manager.initialize()


async def close_db():
    """Close database connections."""
    await db_manager.close() 