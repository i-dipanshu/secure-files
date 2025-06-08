"""
ZKP File Sharing API - Main Application

A secure file-sharing application using Zero-Knowledge Proof (ZKP) authentication
that allows users to upload, share, and download files without revealing credentials.
"""

import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.exceptions import (
    ZKPException, 
    AuthenticationFailedException, 
    UserNotFoundException,
    ZKPVerificationFailedException
)
from app.models.database import init_db, close_db
from app.api.auth import auth_router

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    
    Handles startup and shutdown events for the FastAPI application,
    including database connection initialization and cleanup.
    """
    # Startup
    logger.info("Starting ZKP File Sharing API")
    try:
        await init_db()
        logger.info("Database connection established")
    except Exception as e:
        logger.error("Failed to initialize database", error=str(e))
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down ZKP File Sharing API")
    try:
        await close_db()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error("Error during shutdown", error=str(e))


# Initialize FastAPI app
settings = get_settings()
app = FastAPI(
    title="ZKP File Sharing API",
    description="A secure file-sharing application using Zero-Knowledge Proof authentication",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Custom exception handlers
@app.exception_handler(ZKPException)
async def zkp_exception_handler(request: Request, exc: ZKPException):
    """Handle ZKP-related exceptions."""
    logger.warning("ZKP exception occurred", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "type": exc.__class__.__name__,
                "message": str(exc),
                "code": exc.error_code
            }
        }
    )


@app.exception_handler(AuthenticationFailedException)
async def auth_exception_handler(request: Request, exc: AuthenticationFailedException):
    """Handle authentication failures."""
    logger.warning("Authentication failed", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=401,
        content={
            "success": False,
            "error": {
                "type": "AuthenticationError",
                "message": str(exc),
                "code": "AUTH_FAILED"
            }
        }
    )


@app.exception_handler(UserNotFoundException)
async def user_not_found_handler(request: Request, exc: UserNotFoundException):
    """Handle user not found exceptions."""
    logger.warning("User not found", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=404,
        content={
            "success": False,
            "error": {
                "type": "UserNotFound",
                "message": str(exc),
                "code": "USER_NOT_FOUND"
            }
        }
    )


@app.exception_handler(ZKPVerificationFailedException)
async def zkp_verification_handler(request: Request, exc: ZKPVerificationFailedException):
    """Handle ZKP verification failures."""
    logger.warning("ZKP verification failed", path=request.url.path)
    return JSONResponse(
        status_code=401,
        content={
            "success": False,
            "error": {
                "type": "ZKPVerificationError",
                "message": str(exc),
                "code": "ZKP_VERIFICATION_FAILED"
            }
        }
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions."""
    logger.warning("HTTP exception", status_code=exc.status_code, detail=exc.detail, path=request.url.path)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "type": "HTTPError",
                "message": exc.detail,
                "code": f"HTTP_{exc.status_code}"
            }
        }
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Handle all other unhandled exceptions."""
    logger.error("Unhandled exception occurred", error=str(exc), path=request.url.path, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "type": "InternalServerError",
                "message": "An internal server error occurred",
                "code": "INTERNAL_SERVER_ERROR",
                "details": str(exc) if settings.DEBUG else None
            }
        }
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": "ZKP File Sharing API",
        "version": "0.1.0"
    }


# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info"
    ) 