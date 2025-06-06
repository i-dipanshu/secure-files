"""
Pydantic schemas for authentication endpoints.

This module defines request and response models for authentication
operations including registration, login, and token verification.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class ZKPProof(BaseModel):
    """Zero-Knowledge Proof structure."""
    proof: str = Field(..., description="Base64 encoded proof")
    public_signals: List[str] = Field(..., description="Array of public signals")
    verification_key_hash: Optional[str] = Field(None, description="Verification key hash")


class UserRegistrationRequest(BaseModel):
    """Request model for user registration."""
    username: str = Field(..., min_length=3, max_length=50, description="Username")
    email: EmailStr = Field(..., description="Email address")
    public_key: str = Field(..., description="User's public key for ZKP")
    zkp_proof: ZKPProof = Field(..., description="Zero-knowledge proof for registration")


class UserLoginRequest(BaseModel):
    """Request model for user login."""
    identifier: str = Field(..., description="Username or email")
    zkp_proof: ZKPProof = Field(..., description="Zero-knowledge proof for authentication")


class UserInfo(BaseModel):
    """User information model."""
    user_id: str = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    email: str = Field(..., description="Email address")


class AuthResponse(BaseModel):
    """Response model for successful authentication."""
    success: bool = Field(True, description="Success status")
    message: str = Field(..., description="Response message")
    data: dict = Field(..., description="Response data")


class TokenVerificationResponse(BaseModel):
    """Response model for token verification."""
    success: bool = Field(True, description="Success status")
    data: dict = Field(..., description="Token verification data")


class UserRegistrationResponse(BaseModel):
    """Response model for user registration."""
    success: bool = Field(True, description="Success status")
    message: str = Field(..., description="Response message")
    data: dict = Field(..., description="User registration data") 