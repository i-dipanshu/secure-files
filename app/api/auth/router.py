"""
Authentication router for ZKP File Sharing API.

This module contains authentication endpoints including user registration,
login, logout, and token verification using Zero-Knowledge Proofs.
"""

from datetime import timedelta

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.api.auth.schemas import (
    UserRegistrationRequest,
    UserLoginRequest,
    AuthResponse,
    TokenVerificationResponse
)
from app.core.dependencies import DatabaseDep, CurrentUser
from app.services.auth import auth_service
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
    Verify the validity of a JWT token.
    
    This endpoint checks if the provided JWT token is valid and not expired.
    Uses the CurrentUser dependency which automatically validates the token.
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
    Logout user and invalidate the JWT token.
    
    Note: In a stateless JWT implementation, we can't actually invalidate tokens
    on the server side without maintaining a blacklist. For now, this endpoint
    serves as a client-side logout confirmation.
    
    In a production system, you might want to:
    1. Maintain a token blacklist in Redis
    2. Use shorter token expiry times
    3. Implement refresh tokens
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