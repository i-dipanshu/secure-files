"""
FastAPI dependencies for authentication and database access.

This module provides dependency injection functions for database sessions,
user authentication, and current user extraction from JWT tokens.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db_session
from app.services.auth import auth_service
from app.models.user import User
from app.core.exceptions import AuthenticationFailedException, UserNotFoundException


# Security scheme for JWT bearer tokens
security = HTTPBearer()


async def get_db() -> AsyncSession:
    """Get database session dependency."""
    async for session in get_db_session():
        yield session


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> User:
    """
    Get current authenticated user from JWT token.
    
    Args:
        credentials: JWT credentials from Authorization header
        db: Database session
        
    Returns:
        Current authenticated user
        
    Raises:
        HTTPException: If authentication fails
    """
    try:
        # Verify JWT token
        payload = auth_service.verify_token(credentials.credentials)
        user_id = payload.get("sub")
        
        if user_id is None:
            raise AuthenticationFailedException("Token missing user ID")
        
        # Get user from database
        user = await auth_service.get_user_by_id(db, user_id)
        if user is None:
            raise UserNotFoundException(f"User {user_id} not found")
        
        if not user.is_active:
            raise AuthenticationFailedException("User account is inactive")
        
        return user
        
    except (AuthenticationFailedException, UserNotFoundException) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """
    Get current active user (additional check for user status).
    
    Args:
        current_user: Current user from get_current_user dependency
        
    Returns:
        Current active user
        
    Raises:
        HTTPException: If user is not active
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


# Type aliases for dependency injection
DatabaseDep = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
ActiveUser = Annotated[User, Depends(get_current_active_user)] 