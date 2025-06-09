"""
File service for ZKP File Sharing API.

This module handles file operations, permissions, and business logic
for secure file management and sharing.
"""

import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, update, delete
from sqlalchemy.orm import selectinload

import structlog

from app.models.file import File, FilePermission, FileStatus, FilePermissionType
from app.models.user import User
from app.services.storage import storage_service
from app.core.exceptions import (
    FileNotFoundException,
    AuthenticationFailedException,
    ValidationFailedException
)

logger = structlog.get_logger(__name__)


class FileService:
    """Service for file operations and management."""
    
    async def upload_file(
        self,
        db: AsyncSession,
        user: User,
        file_data: bytes,
        filename: str,
        display_name: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        is_public: bool = False
    ) -> File:
        """
        Upload a new file for the user.
        
        Args:
            db: Database session
            user: User uploading the file
            file_data: File content as bytes
            filename: Original filename
            display_name: Display name for the file (optional)
            description: File description (optional)
            tags: List of tags (optional)
            is_public: Whether file is publicly accessible
            
        Returns:
            Created File object
            
        Raises:
            ValidationException: If file validation fails
            Exception: If upload fails
        """
        # Validate file size (100MB limit for production)
        max_size = 100 * 1024 * 1024  # 100MB
        if len(file_data) > max_size:
            raise ValidationFailedException(f"File size exceeds maximum limit of {max_size // 1024 // 1024}MB")
        
        # Validate filename
        if not filename or len(filename.strip()) == 0:
            raise ValidationFailedException("Filename cannot be empty")
        
        # Check user storage quota (1GB per user for production)
        max_storage = 1024 * 1024 * 1024  # 1GB
        if user.storage_used + len(file_data) > max_storage:
            raise ValidationFailedException("Storage quota exceeded")
        
        try:
            # Upload file to storage
            file_path, file_hash, mime_type, file_size = await storage_service.upload_file(
                file_data=file_data,
                filename=filename,
                user_id=str(user.id)
            )
            
            # Create file record in database
            file_obj = File(
                filename=filename,
                display_name=display_name or filename,
                file_path=file_path,
                file_size=file_size,
                mime_type=mime_type,
                file_hash=file_hash,
                status=FileStatus.ACTIVE,
                is_public=is_public,
                owner_id=user.id,
                description=description,
                tags=",".join(tags) if tags else None
            )
            
            db.add(file_obj)
            
            # Update user storage usage
            user.storage_used += file_size
            
            await db.commit()
            await db.refresh(file_obj)
            
            logger.info(
                "File uploaded successfully",
                file_id=str(file_obj.id),
                filename=filename,
                file_size=file_size,
                user_id=str(user.id)
            )
            
            return file_obj
            
        except Exception as e:
            await db.rollback()
            logger.error("File upload failed", filename=filename, user_id=str(user.id), error=str(e))
            raise
    
    async def get_file_by_id(
        self,
        db: AsyncSession,
        file_id: str,
        user: Optional[User] = None
    ) -> Optional[File]:
        """
        Get a file by ID with permission checks.
        
        Args:
            db: Database session
            file_id: File ID
            user: Current user (for permission checks)
            
        Returns:
            File object if found and accessible, None otherwise
        """
        try:
            file_uuid = uuid.UUID(file_id)
        except ValueError:
            return None
        
        stmt = select(File).where(File.id == file_uuid)
        result = await db.execute(stmt)
        file_obj = result.scalar_one_or_none()
        
        if not file_obj:
            return None
        
        # Check permissions
        if not await self.can_access_file(db, file_obj, user, FilePermissionType.READ):
            return None
        
        return file_obj
    
    async def get_user_files(
        self,
        db: AsyncSession,
        user: User,
        limit: int = 100,
        offset: int = 0,
        status_filter: Optional[FileStatus] = None
    ) -> Tuple[List[File], int]:
        """
        Get files owned by the user.
        
        Args:
            db: Database session
            user: File owner
            limit: Maximum number of files to return
            offset: Number of files to skip
            status_filter: Filter by file status
            
        Returns:
            Tuple of (files list, total count)
        """
        # Build query
        stmt = select(File).where(File.owner_id == user.id)
        
        if status_filter:
            stmt = stmt.where(File.status == status_filter)
        
        # Get total count
        count_stmt = select(func.count(File.id)).where(File.owner_id == user.id)
        if status_filter:
            count_stmt = count_stmt.where(File.status == status_filter)
        
        total_result = await db.execute(count_stmt)
        total_count = total_result.scalar()
        
        # Get files with pagination
        stmt = stmt.order_by(File.created_at.desc()).limit(limit).offset(offset)
        result = await db.execute(stmt)
        files = result.scalars().all()
        
        return list(files), total_count
    
    async def get_shared_files(
        self,
        db: AsyncSession,
        user: User,
        limit: int = 100,
        offset: int = 0
    ) -> Tuple[List[File], int]:
        """
        Get files shared with the user.
        
        Args:
            db: Database session
            user: User to get shared files for
            limit: Maximum number of files to return
            offset: Number of files to skip
            
        Returns:
            Tuple of (files list, total count)
        """
        # Query for files shared with user through permissions
        stmt = (
            select(File)
            .join(FilePermission, File.id == FilePermission.file_id)
            .where(
                and_(
                    FilePermission.user_id == user.id,
                    FilePermission.is_active == True,
                    File.status == FileStatus.ACTIVE,
                    File.owner_id != user.id  # Exclude own files
                )
            )
            .options(selectinload(File.owner))
        )
        
        # Get total count
        count_stmt = (
            select(func.count(File.id))
            .join(FilePermission, File.id == FilePermission.file_id)
            .where(
                and_(
                    FilePermission.user_id == user.id,
                    FilePermission.is_active == True,
                    File.status == FileStatus.ACTIVE,
                    File.owner_id != user.id
                )
            )
        )
        
        total_result = await db.execute(count_stmt)
        total_count = total_result.scalar()
        
        # Get files with pagination
        stmt = stmt.order_by(File.created_at.desc()).limit(limit).offset(offset)
        result = await db.execute(stmt)
        files = result.scalars().all()
        
        return list(files), total_count
    
    async def update_file_metadata(
        self,
        db: AsyncSession,
        file_id: str,
        user: User,
        display_name: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        is_public: Optional[bool] = None
    ) -> Optional[File]:
        """
        Update file metadata.
        
        Args:
            db: Database session
            file_id: File ID to update
            user: Current user
            display_name: New display name
            description: New description
            tags: New tags list
            is_public: New public status
            
        Returns:
            Updated File object if successful, None otherwise
        """
        file_obj = await self.get_file_by_id(db, file_id, user)
        if not file_obj:
            return None
        
        # Check if user can modify this file (need write permission or ownership)
        if not await self.can_access_file(db, file_obj, user, FilePermissionType.WRITE):
            return None
        
        # Update fields
        if display_name is not None:
            file_obj.display_name = display_name
        if description is not None:
            file_obj.description = description
        if tags is not None:
            file_obj.tags = ",".join(tags) if tags else None
        if is_public is not None:
            file_obj.is_public = is_public
        
        file_obj.updated_at = datetime.now(timezone.utc)
        
        await db.commit()
        await db.refresh(file_obj)
        
        logger.info("File metadata updated", file_id=file_id, user_id=str(user.id))
        return file_obj
    
    async def delete_file(
        self,
        db: AsyncSession,
        file_id: str,
        user: User
    ) -> bool:
        """
        Delete a file (soft delete).
        
        Args:
            db: Database session
            file_id: File ID to delete
            user: Current user
            
        Returns:
            True if deletion was successful, False otherwise
        """
        file_obj = await self.get_file_by_id(db, file_id, user)
        if not file_obj:
            return False
        
        # Check if user can delete this file (need delete permission or ownership)
        if not await self.can_access_file(db, file_obj, user, FilePermissionType.DELETE):
            return False
        
        try:
            # Soft delete - mark as deleted
            file_obj.status = FileStatus.DELETED
            file_obj.updated_at = datetime.now(timezone.utc)
            
            # Update user storage usage
            if file_obj.owner_id == user.id:
                user.storage_used -= file_obj.file_size
                if user.storage_used < 0:
                    user.storage_used = 0
            
            await db.commit()
            
            logger.info("File soft deleted", file_id=file_id, user_id=str(user.id))
            return True
            
        except Exception as e:
            await db.rollback()
            logger.error("File deletion failed", file_id=file_id, user_id=str(user.id), error=str(e))
            return False
    
    async def permanently_delete_file(
        self,
        db: AsyncSession,
        file_id: str,
        user: User
    ) -> bool:
        """
        Permanently delete a file from storage and database.
        
        Args:
            db: Database session
            file_id: File ID to delete
            user: Current user (must be owner)
            
        Returns:
            True if deletion was successful, False otherwise
        """
        file_obj = await self.get_file_by_id(db, file_id, user)
        if not file_obj:
            return False
        
        # Only owner can permanently delete
        if file_obj.owner_id != user.id:
            return False
        
        try:
            # Delete from storage
            await storage_service.delete_file(file_obj.file_path)
            
            # Delete all permissions
            await db.execute(delete(FilePermission).where(FilePermission.file_id == file_obj.id))
            
            # Delete file record
            await db.delete(file_obj)
            
            # Update user storage usage
            user.storage_used -= file_obj.file_size
            if user.storage_used < 0:
                user.storage_used = 0
            
            await db.commit()
            
            logger.info("File permanently deleted", file_id=file_id, user_id=str(user.id))
            return True
            
        except Exception as e:
            await db.rollback()
            logger.error("Permanent file deletion failed", file_id=file_id, user_id=str(user.id), error=str(e))
            return False
    
    async def get_download_url(
        self,
        db: AsyncSession,
        file_id: str,
        user: Optional[User] = None,
        expires_hours: int = 1
    ) -> Optional[str]:
        """
        Generate a download URL for a file.
        
        Args:
            db: Database session
            file_id: File ID
            user: Current user (for permission checks)
            expires_hours: URL expiration time in hours
            
        Returns:
            Presigned download URL if accessible, None otherwise
        """
        file_obj = await self.get_file_by_id(db, file_id, user)
        if not file_obj:
            return None
        
        # Store file path before generating URL (avoid keeping DB session open)
        file_path = file_obj.file_path
        
        try:
            # First, update database stats (separate transaction)
            file_obj.view_count += 1
            file_obj.accessed_at = datetime.now(timezone.utc)
            await db.commit()
            
            # Then generate presigned URL (outside of DB transaction context)
            download_url = await storage_service.generate_presigned_url(
                file_path=file_path,
                expires_hours=expires_hours
            )
            
            logger.info(
                "Download URL generated",
                file_id=file_id,
                user_id=str(user.id) if user else "anonymous"
            )
            
            return download_url
            
        except Exception as e:
            await db.rollback()
            logger.error("Failed to generate download URL", file_id=file_id, error=str(e))
            return None
    
    async def can_access_file(
        self,
        db: AsyncSession,
        file_obj: File,
        user: Optional[User],
        permission_type: FilePermissionType
    ) -> bool:
        """
        Check if user can access a file with given permission type.
        
        Args:
            db: Database session
            file_obj: File object
            user: Current user
            permission_type: Required permission type
            
        Returns:
            True if access is allowed, False otherwise
        """
        # File must be active
        if file_obj.status != FileStatus.ACTIVE:
            return False
        
        # Public files are readable by anyone
        if file_obj.is_public and permission_type == FilePermissionType.READ:
            return True
        
        # No user provided
        if not user:
            return False
        
        # Owner has all permissions
        if file_obj.owner_id == user.id:
            return True
        
        # Check explicit permissions
        stmt = select(FilePermission).where(
            and_(
                FilePermission.file_id == file_obj.id,
                FilePermission.user_id == user.id,
                FilePermission.permission_type == permission_type,
                FilePermission.is_active == True
            )
        )
        result = await db.execute(stmt)
        permission = result.scalar_one_or_none()
        
        if permission and permission.is_valid():
            return True
        
        # Check if user has WRITE permission (which implies READ)
        if permission_type == FilePermissionType.READ:
            stmt = select(FilePermission).where(
                and_(
                    FilePermission.file_id == file_obj.id,
                    FilePermission.user_id == user.id,
                    FilePermission.permission_type == FilePermissionType.WRITE,
                    FilePermission.is_active == True
                )
            )
            result = await db.execute(stmt)
            write_permission = result.scalar_one_or_none()
            
            if write_permission and write_permission.is_valid():
                return True
        
        return False
    
    async def share_file(
        self,
        db: AsyncSession,
        file_id: str,
        owner: User,
        target_user_identifier: str,
        permission_type: FilePermissionType,
        expires_hours: Optional[int] = None
    ) -> Optional[FilePermission]:
        """
        Share a file with another user.
        
        Args:
            db: Database session
            file_id: File ID to share
            owner: File owner
            target_user_identifier: Username or email of target user
            permission_type: Type of permission to grant
            expires_hours: Permission expiration time in hours (optional)
            
        Returns:
            Created FilePermission object if successful, None otherwise
        """
        # Get the file
        file_obj = await self.get_file_by_id(db, file_id, owner)
        if not file_obj or file_obj.owner_id != owner.id:
            return None
        
        # Find target user
        stmt = select(User).where(
            or_(User.username == target_user_identifier, User.email == target_user_identifier)
        )
        result = await db.execute(stmt)
        target_user = result.scalar_one_or_none()
        
        if not target_user:
            return None
        
        # Don't share with self
        if target_user.id == owner.id:
            return None
        
        # Check if permission already exists
        stmt = select(FilePermission).where(
            and_(
                FilePermission.file_id == file_obj.id,
                FilePermission.user_id == target_user.id,
                FilePermission.permission_type == permission_type
            )
        )
        result = await db.execute(stmt)
        existing_permission = result.scalar_one_or_none()
        
        if existing_permission:
            # Update existing permission
            existing_permission.is_active = True
            existing_permission.granted_at = datetime.now(timezone.utc)
            existing_permission.expires_at = (
                datetime.now(timezone.utc) + timedelta(hours=expires_hours)
                if expires_hours else None
            )
            await db.commit()
            await db.refresh(existing_permission)
            return existing_permission
        
        # Create new permission
        permission = FilePermission(
            file_id=file_obj.id,
            user_id=target_user.id,
            permission_type=permission_type,
            granted_by=owner.id,
            expires_at=(
                datetime.now(timezone.utc) + timedelta(hours=expires_hours)
                if expires_hours else None
            )
        )
        
        db.add(permission)
        await db.commit()
        await db.refresh(permission)
        
        logger.info(
            "File shared successfully",
            file_id=file_id,
            owner_id=str(owner.id),
            target_user_id=str(target_user.id),
            permission_type=permission_type.value
        )
        
        return permission
    
    async def revoke_file_access(
        self,
        db: AsyncSession,
        file_id: str,
        owner: User,
        target_user_id: str
    ) -> bool:
        """
        Revoke all access permissions for a user on a file.
        
        Args:
            db: Database session
            file_id: File ID
            owner: File owner
            target_user_id: User ID to revoke access from
            
        Returns:
            True if successful, False otherwise
        """
        # Get the file
        file_obj = await self.get_file_by_id(db, file_id, owner)
        if not file_obj or file_obj.owner_id != owner.id:
            return False
        
        try:
            target_uuid = uuid.UUID(target_user_id)
        except ValueError:
            return False
        
        # Deactivate all permissions for the user on this file
        stmt = (
            update(FilePermission)
            .where(
                and_(
                    FilePermission.file_id == file_obj.id,
                    FilePermission.user_id == target_uuid
                )
            )
            .values(is_active=False)
        )
        
        await db.execute(stmt)
        await db.commit()
        
        logger.info(
            "File access revoked",
            file_id=file_id,
            owner_id=str(owner.id),
            target_user_id=target_user_id
        )
        
        return True
    
    async def get_file_permissions(
        self,
        db: AsyncSession,
        file_id: str,
        user: User
    ) -> Optional[List[FilePermission]]:
        """
        Get all permissions for a file (owner only).
        
        Args:
            db: Database session
            file_id: File ID
            user: Current user (must be owner)
            
        Returns:
            List of file permissions if user is owner, None otherwise
        """
        file_obj = await self.get_file_by_id(db, file_id, user)
        if not file_obj or file_obj.owner_id != user.id:
            return None
        
        stmt = (
            select(FilePermission)
            .where(FilePermission.file_id == file_obj.id)
            .options(selectinload(FilePermission.user))
            .order_by(FilePermission.granted_at.desc())
        )
        
        result = await db.execute(stmt)
        permissions = result.scalars().all()
        
        return list(permissions)


# Global file service instance
file_service = FileService() 