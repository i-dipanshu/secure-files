"""
Pydantic schemas for file management API endpoints.

This module defines request/response models for file operations
including upload, download, sharing, and permissions.
"""

from datetime import datetime
from typing import Optional, List, Any, Dict
from enum import Enum

from pydantic import BaseModel, Field, validator

from app.models.file import FileStatus, FilePermissionType


class FileUploadRequest(BaseModel):
    """Request model for file upload."""
    display_name: Optional[str] = Field(None, description="Display name for the file")
    description: Optional[str] = Field(None, description="File description")
    tags: Optional[List[str]] = Field(None, description="File tags for organization")
    is_public: bool = Field(False, description="Whether file is publicly accessible")
    
    @validator("display_name")
    def validate_display_name(cls, v):
        if v and len(v.strip()) == 0:
            raise ValueError("Display name cannot be empty")
        return v
    
    @validator("tags")
    def validate_tags(cls, v):
        if v:
            # Remove empty tags and limit to 10 tags
            clean_tags = [tag.strip() for tag in v if tag.strip()]
            if len(clean_tags) > 10:
                raise ValueError("Maximum 10 tags allowed")
            return clean_tags
        return v


class FileMetadataUpdate(BaseModel):
    """Request model for updating file metadata."""
    display_name: Optional[str] = Field(None, description="New display name")
    description: Optional[str] = Field(None, description="New description")
    tags: Optional[List[str]] = Field(None, description="New tags")
    is_public: Optional[bool] = Field(None, description="New public status")
    
    @validator("display_name")
    def validate_display_name(cls, v):
        if v is not None and len(v.strip()) == 0:
            raise ValueError("Display name cannot be empty")
        return v
    
    @validator("tags")
    def validate_tags(cls, v):
        if v is not None:
            # Remove empty tags and limit to 10 tags
            clean_tags = [tag.strip() for tag in v if tag.strip()]
            if len(clean_tags) > 10:
                raise ValueError("Maximum 10 tags allowed")
            return clean_tags
        return v


class FileInfo(BaseModel):
    """File information model."""
    file_id: str = Field(..., description="File ID")
    filename: str = Field(..., description="Original filename")
    display_name: str = Field(..., description="Display name")
    file_size: int = Field(..., description="File size in bytes")
    mime_type: str = Field(..., description="MIME type")
    file_hash: str = Field(..., description="SHA-256 hash")
    status: str = Field(..., description="File status")
    is_public: bool = Field(..., description="Whether file is public")
    owner_id: str = Field(..., description="Owner user ID")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")
    accessed_at: Optional[str] = Field(None, description="Last access timestamp")
    description: Optional[str] = Field(None, description="File description")
    tags: List[str] = Field(default_factory=list, description="File tags")
    download_count: int = Field(..., description="Number of downloads")
    view_count: int = Field(..., description="Number of views")


class FileSummary(BaseModel):
    """File summary model (minimal information)."""
    file_id: str = Field(..., description="File ID")
    display_name: str = Field(..., description="Display name")
    file_size: int = Field(..., description="File size in bytes")
    mime_type: str = Field(..., description="MIME type")
    status: str = Field(..., description="File status")
    created_at: str = Field(..., description="Creation timestamp")
    download_count: int = Field(..., description="Number of downloads")


class FileListResponse(BaseModel):
    """Response model for file listing."""
    files: List[FileSummary] = Field(..., description="List of files")
    total: int = Field(..., description="Total number of files")
    limit: int = Field(..., description="Requested limit")
    offset: int = Field(..., description="Requested offset")
    has_more: bool = Field(..., description="Whether there are more files")


class FileUploadResponse(BaseModel):
    """Response model for file upload."""
    success: bool = Field(True, description="Success status")
    message: str = Field(..., description="Response message")
    data: FileInfo = Field(..., description="Uploaded file information")


class FileDownloadResponse(BaseModel):
    """Response model for file download URL."""
    success: bool = Field(True, description="Success status")
    download_url: str = Field(..., description="Presigned download URL")
    expires_in: int = Field(..., description="URL expiration time in seconds")
    file_info: FileInfo = Field(..., description="File information")


class FileShareRequest(BaseModel):
    """Request model for sharing a file."""
    target_user: str = Field(..., description="Username or email of target user")
    permission_type: FilePermissionType = Field(..., description="Permission type to grant")
    expires_hours: Optional[int] = Field(None, description="Permission expiration in hours")
    
    @validator("expires_hours")
    def validate_expires_hours(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Expiration hours must be positive")
        if v is not None and v > 8760:  # 1 year
            raise ValueError("Maximum expiration is 1 year (8760 hours)")
        return v


class FilePermissionInfo(BaseModel):
    """File permission information model."""
    permission_id: str = Field(..., description="Permission ID")
    file_id: str = Field(..., description="File ID")
    user_id: str = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    email: str = Field(..., description="User email")
    permission_type: str = Field(..., description="Permission type")
    granted_by: str = Field(..., description="User who granted permission")
    granted_at: str = Field(..., description="When permission was granted")
    expires_at: Optional[str] = Field(None, description="When permission expires")
    is_active: bool = Field(..., description="Whether permission is active")
    is_expired: bool = Field(..., description="Whether permission is expired")


class FilePermissionsResponse(BaseModel):
    """Response model for file permissions."""
    success: bool = Field(True, description="Success status")
    file_id: str = Field(..., description="File ID")
    permissions: List[FilePermissionInfo] = Field(..., description="List of permissions")


class FileShareResponse(BaseModel):
    """Response model for file sharing."""
    success: bool = Field(True, description="Success status")
    message: str = Field(..., description="Response message")
    permission: FilePermissionInfo = Field(..., description="Created permission")


class FileOperationResponse(BaseModel):
    """Generic response model for file operations."""
    success: bool = Field(..., description="Success status")
    message: str = Field(..., description="Response message")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional data")


class FileSearchRequest(BaseModel):
    """Request model for file search."""
    query: Optional[str] = Field(None, description="Search query")
    tags: Optional[List[str]] = Field(None, description="Filter by tags")
    mime_type: Optional[str] = Field(None, description="Filter by MIME type")
    date_from: Optional[datetime] = Field(None, description="Filter from date")
    date_to: Optional[datetime] = Field(None, description="Filter to date")
    min_size: Optional[int] = Field(None, description="Minimum file size")
    max_size: Optional[int] = Field(None, description="Maximum file size")
    is_public: Optional[bool] = Field(None, description="Filter by public status")
    status: Optional[FileStatus] = Field(None, description="Filter by status")
    limit: int = Field(100, description="Maximum results to return")
    offset: int = Field(0, description="Number of results to skip")
    
    @validator("limit")
    def validate_limit(cls, v):
        if v <= 0 or v > 1000:
            raise ValueError("Limit must be between 1 and 1000")
        return v
    
    @validator("offset")
    def validate_offset(cls, v):
        if v < 0:
            raise ValueError("Offset must be non-negative")
        return v


class UserStorageInfo(BaseModel):
    """User storage usage information."""
    storage_used: int = Field(..., description="Storage used in bytes")
    storage_limit: int = Field(..., description="Storage limit in bytes")
    file_count: int = Field(..., description="Number of files")
    storage_percentage: float = Field(..., description="Storage usage percentage")


class FileStatistics(BaseModel):
    """File statistics model."""
    total_files: int = Field(..., description="Total number of files")
    total_size: int = Field(..., description="Total size in bytes")
    file_types: Dict[str, int] = Field(..., description="File type distribution")
    upload_stats: Dict[str, int] = Field(..., description="Upload statistics by date")
    popular_files: List[FileSummary] = Field(..., description="Most downloaded files")


# Error response models
class FileErrorResponse(BaseModel):
    """Error response model for file operations."""
    success: bool = Field(False, description="Success status")
    error: str = Field(..., description="Error message")
    code: str = Field(..., description="Error code")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details") 