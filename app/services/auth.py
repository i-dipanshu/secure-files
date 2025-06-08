"""
Authentication service for ZKP File Sharing API.

This module handles JWT token creation/verification, ZKP verification,
and user authentication logic.
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

import structlog
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import get_settings
from app.core.exceptions import (
    AuthenticationFailedException,
    UserNotFoundException,
    ZKPVerificationFailedException
)
from app.models.user import User


logger = structlog.get_logger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Authentication service for user management and JWT operations."""
    
    def __init__(self):
        self.settings = get_settings()
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """
        Create a JWT access token.
        
        Args:
            data: Data to encode in the token
            expires_delta: Token expiration time
            
        Returns:
            Encoded JWT token
        """
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(
                minutes=self.settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
            )
        
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(
            to_encode,
            self.settings.JWT_SECRET_KEY,
            algorithm=self.settings.JWT_ALGORITHM
        )
        
        logger.info("JWT token created", user_id=data.get("sub"), expires_at=expire.isoformat())
        return encoded_jwt
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verify and decode a JWT token.
        
        Args:
            token: JWT token to verify
            
        Returns:
            Decoded token payload
            
        Raises:
            AuthenticationFailedException: If token is invalid
        """
        try:
            payload = jwt.decode(
                token,
                self.settings.JWT_SECRET_KEY,
                algorithms=[self.settings.JWT_ALGORITHM]
            )
            
            # Check if token has expired
            exp = payload.get("exp")
            if exp is None:
                raise AuthenticationFailedException("Token missing expiration")
            
            if datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(timezone.utc):
                raise AuthenticationFailedException("Token has expired")
            
            return payload
            
        except JWTError as e:
            logger.error("JWT verification failed", error=str(e))
            raise AuthenticationFailedException("Invalid token")
    
    def verify_zkp_proof(self, proof: dict, public_key: str, challenge: Optional[str] = None) -> bool:
        """
        Verify Zero-Knowledge Proof.
        
        For now, this is a placeholder implementation.
        In a real system, this would verify the ZKP using cryptographic libraries.
        
        Args:
            proof: ZKP proof structure
            public_key: User's public key
            challenge: Optional challenge for verification
            
        Returns:
            True if proof is valid, False otherwise
        """
        # TODO: Implement actual ZKP verification
        # This is a placeholder that accepts any non-empty proof
        
        if not proof or not isinstance(proof, dict):
            logger.warning("Invalid ZKP proof format")
            return False
        
        required_fields = ["proof", "public_signals"]
        if not all(field in proof for field in required_fields):
            logger.warning("ZKP proof missing required fields", required=required_fields)
            return False
        
        if not proof["proof"] or not proof["public_signals"]:
            logger.warning("ZKP proof has empty required fields")
            return False
        
        # Placeholder verification - accept any valid structure
        logger.info("ZKP proof verified (placeholder)", public_key=public_key[:20] + "...")
        return True
    
    async def authenticate_user(self, db: AsyncSession, identifier: str, zkp_proof: dict) -> User:
        """
        Authenticate a user using ZKP.
        
        Args:
            db: Database session
            identifier: Username or email
            zkp_proof: Zero-knowledge proof
            
        Returns:
            Authenticated user
            
        Raises:
            UserNotFoundException: If user doesn't exist
            ZKPVerificationFailedException: If ZKP verification fails
        """
        # Find user by username or email
        stmt = select(User).where(
            (User.username == identifier) | (User.email == identifier)
        )
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            logger.warning("User not found", identifier=identifier)
            raise UserNotFoundException(f"User with identifier '{identifier}' not found")
        
        if not user.is_active:
            logger.warning("Inactive user attempted login", user_id=str(user.id))
            raise AuthenticationFailedException("User account is inactive")
        
        # Verify ZKP
        if not self.verify_zkp_proof(zkp_proof, user.public_key):
            logger.warning("ZKP verification failed", user_id=str(user.id))
            raise ZKPVerificationFailedException()
        
        logger.info("User authenticated successfully", user_id=str(user.id), username=user.username)
        return user
    
    async def create_user(self, db: AsyncSession, username: str, email: str, public_key: str, zkp_proof: dict) -> User:
        """
        Create a new user account.
        
        Args:
            db: Database session
            username: Username
            email: Email address
            public_key: User's public key for ZKP
            zkp_proof: Zero-knowledge proof for registration
            
        Returns:
            Created user
            
        Raises:
            ZKPVerificationFailedException: If ZKP verification fails
            AuthenticationFailedException: If user already exists
        """
        # Verify ZKP proof
        if not self.verify_zkp_proof(zkp_proof, public_key):
            logger.warning("ZKP verification failed during registration", email=email)
            raise ZKPVerificationFailedException("Invalid ZKP proof for registration")
        
        # Check if user already exists
        stmt = select(User).where((User.username == username) | (User.email == email))
        result = await db.execute(stmt)
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            if existing_user.username == username:
                raise AuthenticationFailedException("Username already exists")
            else:
                raise AuthenticationFailedException("Email already exists")
        
        # Create new user
        user = User(
            username=username,
            email=email,
            public_key=public_key,
            is_active=True,
            is_verified=False  # Email verification can be implemented later
        )
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        logger.info("User created successfully", user_id=str(user.id), username=username, email=email)
        return user
    
    async def get_user_by_id(self, db: AsyncSession, user_id: str) -> Optional[User]:
        """
        Get user by ID.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            User if found, None otherwise
        """
        try:
            user_uuid = uuid.UUID(user_id)
            stmt = select(User).where(User.id == user_uuid)
            result = await db.execute(stmt)
            return result.scalar_one_or_none()
        except ValueError:
            logger.warning("Invalid user ID format", user_id=user_id)
            return None


# Global auth service instance
auth_service = AuthService() 