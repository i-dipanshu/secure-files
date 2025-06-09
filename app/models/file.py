"""
File models for ZKP File Sharing API.

This module defines the File and FilePermission models for secure file storage
and sharing with proper access control and audit trails.
"""

import uuid
from datetime import datetime
from typing import Optional, List
from enum import Enum

from sqlalchemy import Boolean, DateTime, String, Text, Integer, ForeignKey, func, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.database import Base


class FileStatus(str, Enum):
    """File status enumeration."""
    UPLOADING = "uploading"
    ACTIVE = "active"
    DELETED = "deleted"
    PROCESSING = "processing"


class FilePermissionType(str, Enum):
    """File permission types."""
    READ = "read"
    WRITE = "write"
    DELETE = "delete"
    SHARE = "share"


class File(Base):
    """File model for storing file metadata and ownership."""
    
    __tablename__ = "files"
    
    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    
    # File metadata
    filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Original filename uploaded by user"
    )
    
    display_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Display name for the file (can be renamed)"
    )
    
    file_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        unique=True,
        comment="Path to file in storage (MinIO)"
    )
    
    file_size: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="File size in bytes"
    )
    
    mime_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="MIME type of the file"
    )
    
    file_hash: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        index=True,
        comment="SHA-256 hash of file content for integrity"
    )
    
    # File status and visibility
    status: Mapped[FileStatus] = mapped_column(
        SQLEnum(FileStatus),
        default=FileStatus.ACTIVE,
        nullable=False,
        index=True
    )
    
    is_public: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Whether file is publicly accessible"
    )
    
    # Ownership
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="User who owns this file"
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    
    accessed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Last time file was accessed"
    )
    
    # Optional metadata
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="User-provided description"
    )
    
    tags: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Comma-separated tags for organization"
    )
    
    # File sharing statistics
    download_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Number of times file has been downloaded"
    )
    
    view_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Number of times file has been viewed"
    )
    
    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="files")
    permissions: Mapped[List["FilePermission"]] = relationship(
        "FilePermission", 
        back_populates="file",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<File(id={self.id}, filename='{self.filename}', owner_id={self.owner_id})>"
    
    def to_dict(self) -> dict:
        """Convert file to dictionary for JSON serialization."""
        return {
            "file_id": str(self.id),
            "filename": self.filename,
            "display_name": self.display_name,
            "file_size": self.file_size,
            "mime_type": self.mime_type,
            "file_hash": self.file_hash,
            "status": self.status.value,
            "is_public": self.is_public,
            "owner_id": str(self.owner_id),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "accessed_at": self.accessed_at.isoformat() if self.accessed_at else None,
            "description": self.description,
            "tags": self.tags.split(",") if self.tags else [],
            "download_count": self.download_count,
            "view_count": self.view_count,
        }
    
    def to_summary_dict(self) -> dict:
        """Convert file to summary dictionary (minimal info)."""
        return {
            "file_id": str(self.id),
            "display_name": self.display_name,
            "file_size": self.file_size,
            "mime_type": self.mime_type,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "download_count": self.download_count,
        }


class FilePermission(Base):
    """File permission model for access control."""
    
    __tablename__ = "file_permissions"
    
    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    
    # File and user references
    file_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("files.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Permission type
    permission_type: Mapped[FilePermissionType] = mapped_column(
        SQLEnum(FilePermissionType),
        nullable=False,
        comment="Type of permission granted"
    )
    
    # Permission metadata
    granted_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        comment="User who granted this permission"
    )
    
    # Timestamps
    granted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="When this permission expires (NULL = never)"
    )
    
    # Status
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="Whether this permission is currently active"
    )
    
    # Relationships
    file: Mapped["File"] = relationship("File", back_populates="permissions")
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    granted_by_user: Mapped["User"] = relationship("User", foreign_keys=[granted_by])
    
    def __repr__(self) -> str:
        return f"<FilePermission(id={self.id}, file_id={self.file_id}, user_id={self.user_id}, type={self.permission_type})>"
    
    def to_dict(self) -> dict:
        """Convert permission to dictionary for JSON serialization."""
        return {
            "permission_id": str(self.id),
            "file_id": str(self.file_id),
            "user_id": str(self.user_id),
            "permission_type": self.permission_type.value,
            "granted_by": str(self.granted_by),
            "granted_at": self.granted_at.isoformat(),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "is_active": self.is_active,
        }
    
    def is_expired(self) -> bool:
        """Check if permission has expired."""
        if not self.expires_at:
            return False
        return datetime.now(timezone.utc) > self.expires_at
    
    def is_valid(self) -> bool:
        """Check if permission is valid (active and not expired)."""
        return self.is_active and not self.is_expired()


# Add the files relationship to User model
# This will be imported in the user model 