"""
Configuration settings for the ZKP File Sharing API.

This module handles all application settings using Pydantic Settings
for environment variable management and validation.
"""

from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="forbid"
    )
    
    # App Configuration
    APP_NAME: str = Field(default="ZKP File Sharing API", description="Application name")
    APP_VERSION: str = Field(default="0.1.0", description="Application version")
    DEBUG: bool = Field(default=False, description="Debug mode")
    HOST: str = Field(default="0.0.0.0", description="Host to bind to")
    PORT: int = Field(default=8000, description="Port to bind to")
    
    # Database Configuration
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://zkp_user:zkp_password@localhost:5433/zkp_file_sharing",
        description="Database connection URL"
    )
    
    # MinIO Configuration
    MINIO_ENDPOINT: str = Field(default="localhost:9000", description="MinIO endpoint")
    MINIO_ACCESS_KEY: str = Field(default="minio_admin", description="MinIO access key")
    MINIO_SECRET_KEY: str = Field(default="minio_password123", description="MinIO secret key")
    MINIO_BUCKET_NAME: str = Field(default="zkp-files", description="MinIO bucket name")
    MINIO_SECURE: bool = Field(default=False, description="Use HTTPS for MinIO")
    
    # Redis Configuration
    REDIS_URL: str = Field(default="redis://localhost:6379/0", description="Redis connection URL")
    
    # JWT Configuration
    JWT_SECRET_KEY: str = Field(
        default="super-secret-jwt-key-change-this-in-production",
        description="JWT secret key"
    )
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=30, 
        description="JWT access token expiration time in minutes"
    )
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:8080"],
        description="Allowed CORS origins"
    )
    
    # Security Settings
    BCRYPT_ROUNDS: int = Field(default=12, description="BCrypt hashing rounds")
    MAX_FILE_SIZE: int = Field(default=104857600, description="Maximum file size in bytes (100MB)")
    ALLOWED_FILE_TYPES: List[str] = Field(
        default=[
            "image/jpeg", "image/png", "image/gif", 
            "application/pdf", "text/plain", "application/zip"
        ],
        description="Allowed file MIME types"
    )
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = Field(
        default=100, 
        description="Rate limit: requests per minute"
    )
    RATE_LIMIT_REQUESTS_PER_HOUR: int = Field(
        default=1000, 
        description="Rate limit: requests per hour"
    )
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @field_validator("ALLOWED_FILE_TYPES", mode="before")
    @classmethod
    def parse_allowed_file_types(cls, v):
        """Parse allowed file types from string or list."""
        if isinstance(v, str):
            return [file_type.strip() for file_type in v.split(",")]
        return v


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    
    This function is cached to ensure settings are loaded only once
    during the application lifecycle.
    """
    return Settings() 