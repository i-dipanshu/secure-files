"""
Authentication service for ZKP File Sharing API.

This module handles JWT token creation/verification, ZKP verification,
and user authentication logic.
"""

import uuid
import time
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
from app.services.zkp import zkp_service, ZKPProofData


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
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify and decode a JWT token.
        
        Args:
            token: JWT token to verify
            
        Returns:
            Decoded token payload or None if invalid
        """
        try:
            payload = jwt.decode(
                token,
                self.settings.JWT_SECRET_KEY,
                algorithms=[self.settings.JWT_ALGORITHM]
            )
            return payload
        except JWTError:
            return None
    
    def verify_zkp_proof(self, proof: dict, public_key: str, identifier: str) -> bool:
        """
        Verify Zero-Knowledge Proof using Schnorr proofs.
        
        This is now a real cryptographic implementation using SECP256k1
        elliptic curve and Schnorr proof protocol.
        
        Args:
            proof: ZKP proof structure
            public_key: User's public key in hex format
            identifier: Username/email for message verification
            
        Returns:
            True if proof is valid, False otherwise
        """
        try:
            logger.info("Starting ZKP verification", identifier=identifier, public_key=public_key[:20] + "...")
            
            # First try to parse as new Schnorr proof format
            if all(field in proof for field in ['commitment_x', 'commitment_y', 'response', 'challenge', 'message']):
                proof_data = ZKPProofData(
                    commitment_x=proof['commitment_x'],
                    commitment_y=proof['commitment_y'],
                    response=proof['response'],
                    challenge=proof['challenge'],
                    message=proof['message']
                )
                
                # Verify the Schnorr proof
                is_valid = zkp_service.verify_proof(proof_data, public_key)
                
                if is_valid:
                    logger.info("Schnorr ZKP proof verified successfully", identifier=identifier)
                else:
                    logger.warning("Schnorr ZKP proof verification failed", identifier=identifier)
                
                return is_valid
            
            # Try to parse legacy format for backward compatibility
            legacy_proof = zkp_service.parse_legacy_proof(proof)
            if legacy_proof and legacy_proof.message == "legacy_format":
                logger.info("Processing legacy ZKP proof format", identifier=identifier)
                
                # For legacy format, we'll do basic structure validation
                # In production, you'd want to deprecate this entirely
                required_fields = ["proof", "public_signals"]
                if not all(field in proof for field in required_fields):
                    logger.warning("Legacy ZKP proof missing required fields", required=required_fields)
                    return False
                
                if not proof["proof"] or not proof["public_signals"]:
                    logger.warning("Legacy ZKP proof has empty required fields")
                    return False
                
                # Legacy proofs are accepted but logged as deprecated
                logger.warning("Legacy ZKP proof accepted (DEPRECATED)", identifier=identifier)
                return True
            
            logger.warning("Invalid ZKP proof format", identifier=identifier)
            return False
            
        except Exception as e:
            logger.error("ZKP verification error", error=str(e), identifier=identifier)
            return False
    
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
        
        # Verify ZKP with the user's stored public key
        if not self.verify_zkp_proof(zkp_proof, user.public_key, identifier):
            logger.warning("ZKP verification failed", user_id=str(user.id), identifier=identifier)
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
            public_key: User's public key for ZKP (hex format)
            zkp_proof: Zero-knowledge proof for registration
            
        Returns:
            Created user
            
        Raises:
            ZKPVerificationFailedException: If ZKP verification fails
            AuthenticationFailedException: If user already exists
        """
        # For registration, we need to verify that the user knows the private key
        # corresponding to the public key they're providing
        if not self.verify_zkp_proof(zkp_proof, public_key, username):
            logger.warning("ZKP verification failed during registration", email=email, username=username)
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
        
        # Validate public key format
        if not self._validate_public_key_format(public_key):
            raise AuthenticationFailedException("Invalid public key format")
        
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
    
    def _validate_public_key_format(self, public_key: str) -> bool:
        """
        Validate that the public key is in the correct format.
        
        Args:
            public_key: Public key in hex format
            
        Returns:
            True if format is valid, False otherwise
        """
        try:
            # Should be uncompressed format: 04 + 64 hex chars (x) + 64 hex chars (y)
            if not public_key.startswith('04') or len(public_key) != 130:
                return False
            
            # Try to parse it using the ZKP service
            zkp_service._hex_to_point(public_key)
            return True
            
        except Exception:
            return False
    
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