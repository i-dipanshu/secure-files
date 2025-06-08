"""
Pydantic schemas for authentication endpoints.

This module defines request and response models for authentication
operations including registration, login, and token verification.
"""

from datetime import datetime
from typing import List, Optional, Union

from pydantic import BaseModel, Field, field_validator
import re


class ZKPProofLegacy(BaseModel):
    """Legacy Zero-Knowledge Proof structure (for backward compatibility)."""
    proof: List[str] = Field(..., description="Array of proof elements")
    public_signals: List[str] = Field(..., description="Array of public signals")
    verification_key_hash: Optional[str] = Field(None, description="Verification key hash")


class ZKPProofSchnorr(BaseModel):
    """Schnorr Zero-Knowledge Proof structure (new format)."""
    commitment_x: str = Field(..., description="X coordinate of commitment point R")
    commitment_y: str = Field(..., description="Y coordinate of commitment point R")
    response: str = Field(..., description="Response value s")
    challenge: str = Field(..., description="Challenge value c")
    message: str = Field(..., description="Message that was signed")


class ZKPProof(BaseModel):
    """
    Zero-Knowledge Proof structure supporting both legacy and Schnorr formats.
    
    This allows for backward compatibility while supporting the new 
    cryptographically secure Schnorr proof implementation.
    """
    
    # Legacy format fields (optional for backward compatibility)
    proof: Optional[List[str]] = Field(None, description="Array of proof elements (legacy)")
    public_signals: Optional[List[str]] = Field(None, description="Array of public signals (legacy)")
    verification_key_hash: Optional[str] = Field(None, description="Verification key hash (legacy)")
    
    # New Schnorr format fields (optional for forward compatibility)
    commitment_x: Optional[str] = Field(None, description="X coordinate of commitment point R")
    commitment_y: Optional[str] = Field(None, description="Y coordinate of commitment point R")
    response: Optional[str] = Field(None, description="Response value s")
    challenge: Optional[str] = Field(None, description="Challenge value c")
    message: Optional[str] = Field(None, description="Message that was signed")
    
    @field_validator('commitment_x', 'commitment_y', 'response', 'challenge')
    @classmethod
    def validate_hex_fields(cls, v):
        """Validate that hex fields are properly formatted."""
        if v is not None:
            if not isinstance(v, str):
                raise ValueError("Must be a string")
            if not v.startswith('0x'):
                raise ValueError("Must start with '0x'")
            try:
                int(v, 16)  # Validate it's valid hex
            except ValueError:
                raise ValueError("Must be valid hexadecimal")
        return v
    
    def model_post_init(self, __context) -> None:
        """Validate that either legacy or Schnorr format is provided."""
        has_legacy = self.proof is not None and self.public_signals is not None
        has_schnorr = all([
            self.commitment_x is not None,
            self.commitment_y is not None,
            self.response is not None,
            self.challenge is not None,
            self.message is not None
        ])
        
        if not has_legacy and not has_schnorr:
            raise ValueError("Either legacy format (proof, public_signals) or Schnorr format (commitment_x, commitment_y, response, challenge, message) must be provided")


class UserRegistrationRequest(BaseModel):
    """Request model for user registration."""
    username: str = Field(..., min_length=3, max_length=50, description="Username")
    email: str = Field(..., description="Email address")
    public_key: str = Field(..., description="User's public key for ZKP (hex format)")
    zkp_proof: ZKPProof = Field(..., description="Zero-knowledge proof for registration")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        """Basic email validation."""
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, v):
            raise ValueError("Invalid email format")
        return v
    
    @field_validator("public_key")
    @classmethod
    def validate_public_key(cls, v):
        """Validate public key format."""
        if not isinstance(v, str):
            raise ValueError("Public key must be a string")
        
        # Should be hex format starting with 04 (uncompressed)
        if not v.startswith('04'):
            raise ValueError("Public key must start with '04' (uncompressed format)")
            
        if len(v) != 130:  # 04 + 64 chars (x) + 64 chars (y)
            raise ValueError("Public key must be 130 characters long (uncompressed format)")
            
        try:
            int(v, 16)  # Validate it's valid hex
        except ValueError:
            raise ValueError("Public key must be valid hexadecimal")
            
        return v


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
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="Bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")
    user: dict = Field(..., description="User information")


class TokenVerificationResponse(BaseModel):
    """Response model for token verification."""
    valid: bool = Field(..., description="Whether the token is valid")
    user_id: str = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    email: str = Field(..., description="Email address")
    is_active: bool = Field(..., description="Whether user is active")
    is_verified: bool = Field(..., description="Whether user is verified")


class UserRegistrationResponse(BaseModel):
    """Response model for user registration."""
    success: bool = Field(True, description="Success status")
    message: str = Field(..., description="Response message")
    data: dict = Field(..., description="User registration data")


class ZKPKeyGenerationRequest(BaseModel):
    """Request model for ZKP key generation (utility endpoint)."""
    username: str = Field(..., description="Username for the key pair")


class ZKPKeyGenerationResponse(BaseModel):
    """Response model for ZKP key generation."""
    private_key: str = Field(..., description="Private key (keep secret!)")
    public_key: str = Field(..., description="Public key for registration")
    username: str = Field(..., description="Username")
    

class ZKPProofGenerationRequest(BaseModel):
    """Request model for ZKP proof generation (utility endpoint)."""
    private_key: str = Field(..., description="Private key for proof generation")
    username: str = Field(..., description="Username for the message")
    timestamp: Optional[int] = Field(None, description="Timestamp for the message")


class ZKPProofGenerationResponse(BaseModel):
    """Response model for ZKP proof generation."""
    zkp_proof: ZKPProofSchnorr = Field(..., description="Generated Schnorr proof")
    public_key: str = Field(..., description="Corresponding public key") 