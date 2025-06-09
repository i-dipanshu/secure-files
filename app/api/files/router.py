"""
File management router for ZKP File Sharing API.

This module contains endpoints for file upload, download, sharing,
and permission management with proper authentication and authorization.
"""

from typing import Optional, List
from fastapi import APIRouter, File, Form, UploadFile, HTTPException, status, Query, Depends
from fastapi.responses import JSONResponse
from datetime import datetime, timezone

from app.api.files.schemas import (
    FileUploadRequest,
    FileUploadResponse,
    FileInfo,
    FileSummary,
    FileListResponse,
    FileDownloadResponse,
    FileMetadataUpdate,
    FileShareRequest,
    FileShareResponse,
    FilePermissionInfo,
    FilePermissionsResponse,
    FileOperationResponse,
    UserStorageInfo,
    FileErrorResponse
)
from app.core.dependencies import DatabaseDep, CurrentUser, OptionalCurrentUser
from app.services.file import file_service
from app.models.file import FileStatus, FilePermissionType
from app.core.exceptions import ValidationFailedException, FileNotFoundException
import structlog

logger = structlog.get_logger(__name__)
router = APIRouter()


@router.post("/upload", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    db: DatabaseDep,
    current_user: CurrentUser,
    file: UploadFile = File(...),
    display_name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),  # Comma-separated tags
    is_public: bool = Form(False)
) -> JSONResponse:
    """
    Upload a new file.
    
    This endpoint accepts file uploads with metadata and stores them
    securely with proper access control.
    """
    try:
        # Read file content
        file_content = await file.read()
        
        # Parse tags if provided
        tag_list = []
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
        
        # Upload file through service
        uploaded_file = await file_service.upload_file(
            db=db,
            user=current_user,
            file_data=file_content,
            filename=file.filename,
            display_name=display_name,
            description=description,
            tags=tag_list,
            is_public=is_public
        )
        
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "success": True,
                "message": "File uploaded successfully",
                "data": uploaded_file.to_dict()
            }
        )
        
    except ValidationFailedException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("File upload failed", user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file"
        )


@router.get("/", response_model=FileListResponse)
async def list_user_files(
    db: DatabaseDep,
    current_user: CurrentUser,
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of files to return"),
    offset: int = Query(0, ge=0, description="Number of files to skip"),
    status_filter: Optional[FileStatus] = Query(None, description="Filter by file status")
) -> JSONResponse:
    """
    List files owned by the current user.
    
    Returns paginated list of user's files with optional status filtering.
    """
    try:
        files, total_count = await file_service.get_user_files(
            db=db,
            user=current_user,
            limit=limit,
            offset=offset,
            status_filter=status_filter
        )
        
        file_summaries = [file_obj.to_summary_dict() for file_obj in files]
        
        return JSONResponse(
            content={
                "files": file_summaries,
                "total": total_count,
                "limit": limit,
                "offset": offset,
                "has_more": offset + len(files) < total_count
            }
        )
        
    except Exception as e:
        logger.error("Failed to list user files", user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve files"
        )


@router.get("/shared", response_model=FileListResponse)
async def list_shared_files(
    db: DatabaseDep,
    current_user: CurrentUser,
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of files to return"),
    offset: int = Query(0, ge=0, description="Number of files to skip")
) -> JSONResponse:
    """
    List files shared with the current user.
    
    Returns paginated list of files that other users have shared with the current user.
    """
    try:
        files, total_count = await file_service.get_shared_files(
            db=db,
            user=current_user,
            limit=limit,
            offset=offset
        )
        
        file_summaries = [file_obj.to_summary_dict() for file_obj in files]
        
        return JSONResponse(
            content={
                "files": file_summaries,
                "total": total_count,
                "limit": limit,
                "offset": offset,
                "has_more": offset + len(files) < total_count
            }
        )
        
    except Exception as e:
        logger.error("Failed to list shared files", user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve shared files"
        )


@router.get("/{file_id}", response_model=FileInfo)
async def get_file_info(
    db: DatabaseDep,
    current_user: CurrentUser,
    file_id: str
) -> JSONResponse:
    """
    Get detailed information about a specific file.
    
    Returns complete file metadata if user has read access.
    """
    file_obj = await file_service.get_file_by_id(db, file_id, current_user)
    
    if not file_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found or access denied"
        )
    
    return JSONResponse(content=file_obj.to_dict())


@router.put("/{file_id}", response_model=FileInfo)
async def update_file_metadata(
    db: DatabaseDep,
    current_user: CurrentUser,
    file_id: str,
    update_data: FileMetadataUpdate
) -> JSONResponse:
    """
    Update file metadata.
    
    Updates display name, description, tags, and public status.
    User must have write access to the file.
    """
    try:
        updated_file = await file_service.update_file_metadata(
            db=db,
            file_id=file_id,
            user=current_user,
            display_name=update_data.display_name,
            description=update_data.description,
            tags=update_data.tags,
            is_public=update_data.is_public
        )
        
        if not updated_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found or access denied"
            )
        
        return JSONResponse(content=updated_file.to_dict())
        
    except ValidationFailedException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Failed to update file metadata", file_id=file_id, user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update file"
        )


@router.delete("/{file_id}", response_model=FileOperationResponse)
async def delete_file(
    db: DatabaseDep,
    current_user: CurrentUser,
    file_id: str,
    permanent: bool = Query(False, description="Whether to permanently delete the file")
) -> JSONResponse:
    """
    Delete a file.
    
    By default performs soft delete (marks as deleted).
    Use permanent=true to permanently delete from storage (owner only).
    """
    try:
        if permanent:
            success = await file_service.permanently_delete_file(db, file_id, current_user)
            message = "File permanently deleted" if success else "Failed to delete file"
        else:
            success = await file_service.delete_file(db, file_id, current_user)
            message = "File deleted" if success else "Failed to delete file"
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found or access denied"
            )
        
        return JSONResponse(
            content={
                "success": True,
                "message": message
            }
        )
        
    except Exception as e:
        logger.error("Failed to delete file", file_id=file_id, user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete file"
        )


@router.get("/{file_id}/download", response_model=FileDownloadResponse)
async def get_download_url(
    db: DatabaseDep,
    current_user: CurrentUser,
    file_id: str,
    expires_hours: int = Query(1, ge=1, le=24, description="URL expiration time in hours")
) -> JSONResponse:
    """
    Generate a download URL for a file.
    
    Returns a presigned URL that can be used to download the file.
    User must have read access to the file.
    """
    try:
        # Get file info first (with permission check)
        file_obj = await file_service.get_file_by_id(db, file_id, current_user)
        if not file_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found or access denied"
            )
        
        # Store file path and info before any async operations
        file_path = file_obj.file_path
        file_dict = file_obj.to_dict()
        
        # Update access statistics in a separate transaction
        try:
            file_obj.view_count += 1
            file_obj.accessed_at = datetime.now(timezone.utc)
            await db.commit()
        except Exception as db_error:
            logger.warning("Failed to update access stats", error=str(db_error))
            await db.rollback()
            # Continue anyway - this is not critical
        
        # Generate download URL completely outside of any DB context
        from app.services.storage import storage_service
        download_url = await storage_service.generate_presigned_url(
            file_path=file_path,
            expires_hours=expires_hours
        )
        
        return JSONResponse(
            content={
                "success": True,
                "download_url": download_url,
                "expires_in": expires_hours * 3600,  # Convert to seconds
                "file_info": file_dict
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to generate download URL", file_id=file_id, user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate download URL"
        )


@router.post("/{file_id}/share", response_model=FileShareResponse)
async def share_file(
    db: DatabaseDep,
    current_user: CurrentUser,
    file_id: str,
    share_request: FileShareRequest
) -> JSONResponse:
    """
    Share a file with another user.
    
    Grants specified permission to the target user.
    Only file owner can share files.
    """
    try:
        permission = await file_service.share_file(
            db=db,
            file_id=file_id,
            owner=current_user,
            target_user_identifier=share_request.target_user,
            permission_type=share_request.permission_type,
            expires_hours=share_request.expires_hours
        )
        
        if not permission:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to share file. Check that file exists and target user is valid."
            )
        
        # Get user info for response
        permission_info = {
            "permission_id": str(permission.id),
            "file_id": str(permission.file_id),
            "user_id": str(permission.user_id),
            "username": permission.user.username,
            "email": permission.user.email,
            "permission_type": permission.permission_type.value,
            "granted_by": str(permission.granted_by),
            "granted_at": permission.granted_at.isoformat(),
            "expires_at": permission.expires_at.isoformat() if permission.expires_at else None,
            "is_active": permission.is_active,
            "is_expired": permission.is_expired()
        }
        
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "success": True,
                "message": f"File shared with {permission.user.username}",
                "permission": permission_info
            }
        )
        
    except ValidationFailedException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Failed to share file", file_id=file_id, user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to share file"
        )


@router.delete("/{file_id}/share/{user_id}", response_model=FileOperationResponse)
async def revoke_file_access(
    db: DatabaseDep,
    current_user: CurrentUser,
    file_id: str,
    user_id: str
) -> JSONResponse:
    """
    Revoke file access for a specific user.
    
    Removes all permissions for the specified user on the file.
    Only file owner can revoke access.
    """
    try:
        success = await file_service.revoke_file_access(
            db=db,
            file_id=file_id,
            owner=current_user,
            target_user_id=user_id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found or access denied"
            )
        
        return JSONResponse(
            content={
                "success": True,
                "message": "File access revoked successfully"
            }
        )
        
    except Exception as e:
        logger.error("Failed to revoke file access", file_id=file_id, user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to revoke access"
        )


@router.get("/{file_id}/permissions", response_model=FilePermissionsResponse)
async def get_file_permissions(
    db: DatabaseDep,
    current_user: CurrentUser,
    file_id: str
) -> JSONResponse:
    """
    Get all permissions for a file.
    
    Returns list of users who have access to the file.
    Only file owner can view permissions.
    """
    try:
        permissions = await file_service.get_file_permissions(
            db=db,
            file_id=file_id,
            user=current_user
        )
        
        if permissions is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found or access denied"
            )
        
        permission_list = []
        for perm in permissions:
            permission_list.append({
                "permission_id": str(perm.id),
                "file_id": str(perm.file_id),
                "user_id": str(perm.user_id),
                "username": perm.user.username,
                "email": perm.user.email,
                "permission_type": perm.permission_type.value,
                "granted_by": str(perm.granted_by),
                "granted_at": perm.granted_at.isoformat(),
                "expires_at": perm.expires_at.isoformat() if perm.expires_at else None,
                "is_active": perm.is_active,
                "is_expired": perm.is_expired()
            })
        
        return JSONResponse(
            content={
                "success": True,
                "file_id": file_id,
                "permissions": permission_list
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get file permissions", file_id=file_id, user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve permissions"
        )


@router.get("/storage/info", response_model=UserStorageInfo)
async def get_storage_info(
    db: DatabaseDep,
    current_user: CurrentUser
) -> JSONResponse:
    """
    Get user's storage usage information.
    
    Returns current storage usage, limits, and file count.
    """
    try:
        # Get user files for counting
        files, total_count = await file_service.get_user_files(
            db=db,
            user=current_user,
            limit=1,
            offset=0,
            status_filter=FileStatus.ACTIVE
        )
        
        storage_limit = 1024 * 1024 * 1024  # 1GB per user
        storage_percentage = (current_user.storage_used / storage_limit) * 100
        
        return JSONResponse(
            content={
                "storage_used": current_user.storage_used,
                "storage_limit": storage_limit,
                "file_count": total_count,
                "storage_percentage": round(storage_percentage, 2)
            }
        )
        
    except Exception as e:
        logger.error("Failed to get storage info", user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve storage information"
        )


@router.get("/public/{file_id}", response_model=FileInfo)
async def get_public_file_info(
    db: DatabaseDep,
    file_id: str,
    current_user: OptionalCurrentUser = None
) -> JSONResponse:
    """
    Get detailed information about a public file.
    
    This endpoint allows both authenticated and anonymous access to public files.
    If the user is authenticated, they may also access private files they have permissions for.
    """
    try:
        file_obj = await file_service.get_file_by_id(db, file_id, current_user)
        
        if not file_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found or access denied"
            )
        
        # For public access, only allow if file is actually public or user has access
        if not file_obj.is_public and not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="This file requires authentication to access"
            )
        
        # Add owner information for the response
        file_dict = file_obj.to_dict()
        if hasattr(file_obj, 'owner') and file_obj.owner:
            file_dict['owner'] = {
                'username': file_obj.owner.username
            }
        
        return JSONResponse(content=file_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get public file info", file_id=file_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve file information"
        )


@router.get("/public/{file_id}/download", response_model=FileDownloadResponse)
async def get_public_file_download(
    db: DatabaseDep,
    file_id: str,
    current_user: OptionalCurrentUser = None,
    expires_hours: int = Query(1, ge=1, le=24, description="URL expiration time in hours")
) -> JSONResponse:
    """
    Generate a download URL for a public file.
    
    This endpoint allows both authenticated and anonymous download of public files.
    For private files, authentication is required.
    """
    try:
        file_obj = await file_service.get_file_by_id(db, file_id, current_user)
        
        if not file_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found or access denied"
            )
        
        # For public access, only allow if file is actually public or user has access
        if not file_obj.is_public and not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="This file requires authentication to download"
            )
        
        # Store file path and info before any async operations
        file_path = file_obj.file_path
        file_dict = file_obj.to_dict()
        
        # Update access statistics in a separate transaction
        try:
            file_obj.view_count += 1
            file_obj.download_count += 1
            file_obj.accessed_at = datetime.now(timezone.utc)
            await db.commit()
        except Exception as db_error:
            logger.warning("Failed to update access stats", error=str(db_error))
            await db.rollback()
            # Continue anyway - this is not critical
        
        # Generate download URL completely outside of any DB context
        from app.services.storage import storage_service
        download_url = await storage_service.generate_presigned_url(
            file_path=file_path,
            expires_hours=expires_hours
        )
        
        return JSONResponse(
            content={
                "success": True,
                "download_url": download_url,
                "expires_in": expires_hours * 3600,  # Convert to seconds
                "file_info": file_dict
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to generate public download URL", file_id=file_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate download URL"
        ) 