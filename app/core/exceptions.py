"""
Custom exceptions and exception handlers for the ZKP File Sharing API.

This module defines custom exception classes and sets up global
exception handlers for the FastAPI application.
"""

import structlog
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError


logger = structlog.get_logger(__name__)


class ZKPException(Exception):
    """Base exception for ZKP-related errors."""
    
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST, error_code: str = "ZKP_ERROR"):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(self.message)


class AuthenticationFailedException(ZKPException):
    """Exception raised when authentication fails."""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED, "AUTH_FAILED")


class AuthorizationFailedException(ZKPException):
    """Exception raised when authorization fails."""
    
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message, status.HTTP_403_FORBIDDEN, "AUTHORIZATION_FAILED")


class ValidationFailedException(ZKPException):
    """Exception raised when request validation fails."""
    
    def __init__(self, message: str = "Validation failed"):
        super().__init__(message, status.HTTP_400_BAD_REQUEST, "VALIDATION_ERROR")


class FileNotFoundException(ZKPException):
    """Exception raised when a file is not found."""
    
    def __init__(self, message: str = "File not found"):
        super().__init__(message, status.HTTP_404_NOT_FOUND, "FILE_NOT_FOUND")


class UserNotFoundException(ZKPException):
    """Exception raised when a user is not found."""
    
    def __init__(self, message: str = "User not found"):
        super().__init__(message, status.HTTP_404_NOT_FOUND, "USER_NOT_FOUND")


class FileTooLargeException(ZKPException):
    """Exception raised when file size exceeds limit."""
    
    def __init__(self, message: str = "File too large"):
        super().__init__(message, status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "FILE_TOO_LARGE")


class InvalidFileTypeException(ZKPException):
    """Exception raised when file type is not allowed."""
    
    def __init__(self, message: str = "Invalid file type"):
        super().__init__(message, status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "INVALID_FILE_TYPE")


class ZKPVerificationFailedException(ZKPException):
    """Exception raised when ZKP verification fails."""
    
    def __init__(self, message: str = "Zero-knowledge proof verification failed"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED, "ZKP_VERIFICATION_FAILED")


class RateLimitExceededException(ZKPException):
    """Exception raised when rate limit is exceeded."""
    
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, status.HTTP_429_TOO_MANY_REQUESTS, "RATE_LIMIT_EXCEEDED")


class InvalidProofFormatException(ZKPException):
    """Exception raised when proof format is invalid."""
    
    def __init__(self, message: str = "Invalid proof format"):
        super().__init__(message, status.HTTP_400_BAD_REQUEST, "INVALID_PROOF_FORMAT")


class UserAlreadyExistsException(ZKPException):
    """Exception raised when trying to create a user that already exists."""
    
    def __init__(self, message: str = "User already exists"):
        super().__init__(message, status.HTTP_409_CONFLICT, "USER_EXISTS")


async def zkp_exception_handler(request: Request, exc: ZKPException) -> JSONResponse:
    """Handle custom ZKP exceptions."""
    logger.error(
        "ZKP exception occurred",
        path=request.url.path,
        method=request.method,
        error=exc.message,
        status_code=exc.status_code
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.error_code,
                "message": exc.message,
            }
        }
    )


async def validation_exception_handler(request: Request, exc: ValidationError) -> JSONResponse:
    """Handle Pydantic validation exceptions."""
    logger.error(
        "Validation error occurred",
        path=request.url.path,
        method=request.method,
        errors=exc.errors()
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": exc.errors()
            }
        }
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle general exceptions."""
    logger.exception(
        "Unexpected error occurred",
        path=request.url.path,
        method=request.method,
        error=str(exc)
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred"
            }
        }
    )


def setup_exception_handlers(app: FastAPI) -> None:
    """Set up exception handlers for the FastAPI application."""
    app.add_exception_handler(ZKPException, zkp_exception_handler)
    app.add_exception_handler(ValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler) 