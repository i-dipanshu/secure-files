"""
Authentication router for ZKP File Sharing API.

This module contains authentication endpoints including user registration,
login, logout, and token verification using Zero-Knowledge Proofs.
"""

import time
from datetime import timedelta

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.api.auth.schemas import (
    UserRegistrationRequest,
    UserLoginRequest,
    AuthResponse,
    TokenVerificationResponse,
    ZKPKeyGenerationRequest,
    ZKPKeyGenerationResponse,
    ZKPProofGenerationRequest,
    ZKPProofGenerationResponse,
    ZKPProofSchnorr
)
from app.core.dependencies import DatabaseDep, CurrentUser
from app.services.auth import auth_service
from app.services.zkp import zkp_service
from app.core.config import get_settings

router = APIRouter()
settings = get_settings()


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(request: UserRegistrationRequest, db: DatabaseDep) -> JSONResponse:
    """
    Register a new user with Zero-Knowledge Proof authentication.
    
    This endpoint allows users to register using their public key and
    a zero-knowledge proof instead of traditional passwords.
    """
    # Create user in database
    user = await auth_service.create_user(
        db=db,
        username=request.username,
        email=request.email,
        public_key=request.public_key,
        zkp_proof=request.zkp_proof.model_dump()
    )
    
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "success": True,
            "message": "User registered successfully",
            "data": {
                "user_id": str(user.id),
                "username": user.username,
                "email": user.email,
                "created_at": user.created_at.isoformat()
            }
        }
    )


@router.post("/login")
async def login_user(request: UserLoginRequest, db: DatabaseDep) -> JSONResponse:
    """
    Authenticate user using Zero-Knowledge Proof.
    
    This endpoint verifies the user's ZKP and returns a JWT token
    if authentication is successful.
    """
    # Authenticate user
    user = await auth_service.authenticate_user(
        db=db,
        identifier=request.identifier,
        zkp_proof=request.zkp_proof.model_dump()
    )
    
    # Create JWT token
    access_token_expires = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_service.create_access_token(
        data={"sub": str(user.id), "username": user.username},
        expires_delta=access_token_expires
    )
    
    return JSONResponse(
        content={
            "success": True,
            "message": "Login successful",
            "data": {
                "access_token": access_token,
                "token_type": "Bearer",
                "expires_in": settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert to seconds
                "user": {
                    "user_id": str(user.id),
                    "username": user.username,
                    "email": user.email
                }
            }
        }
    )


@router.get("/verify")
async def verify_token(current_user: CurrentUser) -> JSONResponse:
    """
    Verify the current JWT token and return user information.
    
    This endpoint validates the provided JWT token and returns
    the associated user information if the token is valid.
    """
    return JSONResponse(
        content={
            "success": True,
            "data": {
                "valid": True,
                "user_id": str(current_user.id),
                "username": current_user.username,
                "email": current_user.email,
                "is_active": current_user.is_active,
                "is_verified": current_user.is_verified
            }
        }
    )


@router.post("/logout")
async def logout_user(current_user: CurrentUser) -> JSONResponse:
    """
    Logout user and invalidate the JWT token (client-side).
    
    Since JWT tokens are stateless, the actual invalidation must be
    handled on the client side by removing the token from storage.
    """
    return JSONResponse(
        content={
            "success": True,
            "message": "Logged out successfully",
            "data": {
                "user_id": str(current_user.id),
                "message": "Please remove the token from client storage"
            }
        }
    )


# Utility endpoints for ZKP operations

@router.post("/utils/generate-keypair")
async def generate_zkp_keypair(request: ZKPKeyGenerationRequest) -> JSONResponse:
    """
    Generate a new ZKP key pair for testing purposes.
    
    **WARNING: This is for development/testing only!**
    In production, private keys should be generated securely on the client side.
    """
    # Generate new keypair
    keypair = zkp_service.generate_keypair()
    
    return JSONResponse(
        content={
            "success": True,
            "message": "ZKP keypair generated successfully",
            "data": {
                "private_key": hex(keypair.private_key),
                "public_key": keypair.public_key_hex,
                "username": request.username,
                "warning": "Keep the private key secret! This is for testing only."
            }
        }
    )


@router.post("/utils/generate-proof")
async def generate_zkp_proof(request: ZKPProofGenerationRequest) -> JSONResponse:
    """
    Generate a ZKP proof for testing purposes.
    
    **WARNING: This is for development/testing only!**
    In production, proofs should be generated securely on the client side.
    """
    try:
        # Parse private key
        private_key = int(request.private_key, 16) if request.private_key.startswith('0x') else int(request.private_key, 16)
        
        # Create authentication message
        timestamp = request.timestamp or int(time.time())
        message = zkp_service.create_authentication_message(request.username, timestamp)
        
        # Generate proof
        proof_data = zkp_service.create_proof(private_key, message)
        
        # Get corresponding public key
        public_key = private_key * zkp_service.generator
        public_key_hex = zkp_service._point_to_hex(public_key)
        
        return JSONResponse(
            content={
                "success": True,
                "message": "ZKP proof generated successfully",
                "data": {
                    "zkp_proof": {
                        "commitment_x": proof_data.commitment_x,
                        "commitment_y": proof_data.commitment_y,
                        "response": proof_data.response,
                        "challenge": proof_data.challenge,
                        "message": proof_data.message
                    },
                    "public_key": public_key_hex,
                    "timestamp": timestamp,
                    "warning": "This is for testing only. Use secure client-side proof generation in production."
                }
            }
        )
        
    except ValueError as e:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "error": {
                    "type": "ValidationError",
                    "message": f"Invalid private key format: {str(e)}",
                    "code": "VALIDATION_ERROR"
                }
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "type": "ProofGenerationError",
                    "message": f"Failed to generate proof: {str(e)}",
                    "code": "PROOF_GENERATION_FAILED"
                }
            }
        )


@router.post("/utils/verify-proof")
async def verify_zkp_proof_endpoint(
    zkp_proof: ZKPProofSchnorr,
    public_key: str,
    username: str
) -> JSONResponse:
    """
    Verify a ZKP proof for testing purposes.
    
    This utility endpoint allows testing of ZKP proof verification
    without going through the full authentication flow.
    """
    try:
        # Verify the proof
        is_valid = zkp_service.verify_proof(zkp_proof, public_key)
        
        return JSONResponse(
            content={
                "success": True,
                "message": "ZKP proof verification completed",
                "data": {
                    "valid": is_valid,
                    "public_key": public_key,
                    "username": username,
                    "proof_message": zkp_proof.message
                }
            }
        )
        
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "error": {
                    "type": "VerificationError",
                    "message": f"Proof verification failed: {str(e)}",
                    "code": "VERIFICATION_FAILED"
                }
            }
        ) 