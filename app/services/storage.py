"""
Storage service for MinIO integration.

This module handles file upload, download, and management operations
with MinIO object storage backend.
"""

import asyncio
import hashlib
import mimetypes
import os
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from typing import Optional, BinaryIO, Tuple, List
from urllib.parse import unquote

import structlog
from minio import Minio
from minio.error import S3Error
from minio.commonconfig import CopySource

from app.core.config import get_settings

logger = structlog.get_logger(__name__)


class StorageService:
    """Service for file storage operations with MinIO."""
    
    def __init__(self):
        self.settings = get_settings()
        self.client = None
        self.executor = ThreadPoolExecutor(max_workers=4)
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize MinIO client."""
        try:
            self.client = Minio(
                endpoint=self.settings.MINIO_ENDPOINT,
                access_key=self.settings.MINIO_ACCESS_KEY,
                secret_key=self.settings.MINIO_SECRET_KEY,
                secure=self.settings.MINIO_SECURE
            )
            logger.info("MinIO client initialized successfully")
        except Exception as e:
            logger.error("Failed to initialize MinIO client", error=str(e))
            raise
    
    async def ensure_bucket_exists(self, bucket_name: str) -> bool:
        """
        Ensure that the specified bucket exists, create if it doesn't.
        
        Args:
            bucket_name: Name of the bucket
            
        Returns:
            True if bucket exists or was created successfully
        """
        def _check_and_create_bucket():
            """Helper function to check and create bucket synchronously."""
            try:
                if not self.client.bucket_exists(bucket_name):
                    logger.info("Creating bucket", bucket_name=bucket_name)
                    self.client.make_bucket(bucket_name)
                    
                    # Set default bucket policy for private access
                    # Files will be accessible only through presigned URLs
                    policy = {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Deny",
                                "Principal": "*",
                                "Action": "s3:GetObject",
                                "Resource": f"arn:aws:s3:::{bucket_name}/*"
                            }
                        ]
                    }
                    
                    import json
                    self.client.set_bucket_policy(bucket_name, json.dumps(policy))
                    logger.info("Bucket created with private policy", bucket_name=bucket_name)
                
                return True
            except S3Error as e:
                logger.error("S3 error ensuring bucket exists", bucket_name=bucket_name, error=str(e))
                return False
            except Exception as e:
                logger.error("Unexpected error ensuring bucket exists", bucket_name=bucket_name, error=str(e))
                return False
        
        try:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(self.executor, _check_and_create_bucket)
        except Exception as e:
            logger.error("Failed to check/create bucket", bucket_name=bucket_name, error=str(e))
            return False
    
    def generate_unique_filename(self, original_filename: str, user_id: str) -> str:
        """
        Generate a unique filename for storage.
        
        Args:
            original_filename: Original filename from user
            user_id: User ID for namespacing
            
        Returns:
            Unique filename with path
        """
        file_ext = os.path.splitext(original_filename)[1].lower()
        unique_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().strftime("%Y%m%d")
        
        # Create hierarchical path: users/{user_id}/{date}/{unique_id}{ext}
        return f"users/{user_id}/{timestamp}/{unique_id}{file_ext}"
    
    def calculate_file_hash(self, file_data: bytes) -> str:
        """
        Calculate SHA-256 hash of file content.
        
        Args:
            file_data: File content as bytes
            
        Returns:
            SHA-256 hash as hex string
        """
        return hashlib.sha256(file_data).hexdigest()
    
    def get_mime_type(self, filename: str) -> str:
        """
        Get MIME type for a file.
        
        Args:
            filename: Name of the file
            
        Returns:
            MIME type string
        """
        mime_type, _ = mimetypes.guess_type(filename)
        return mime_type or "application/octet-stream"
    
    async def upload_file(
        self, 
        file_data: bytes, 
        filename: str, 
        user_id: str,
        bucket_name: Optional[str] = None
    ) -> Tuple[str, str, str, int]:
        """
        Upload a file to MinIO storage.
        
        Args:
            file_data: File content as bytes
            filename: Original filename
            user_id: User ID who owns the file
            bucket_name: Custom bucket name (optional)
            
        Returns:
            Tuple of (file_path, file_hash, mime_type, file_size)
            
        Raises:
            Exception: If upload fails
        """
        bucket = bucket_name or self.settings.MINIO_BUCKET_NAME
        
        # Ensure bucket exists
        if not await self.ensure_bucket_exists(bucket):
            raise Exception(f"Failed to ensure bucket '{bucket}' exists")
        
        # Generate unique file path
        file_path = self.generate_unique_filename(filename, user_id)
        
        # Calculate file metadata
        file_hash = self.calculate_file_hash(file_data)
        mime_type = self.get_mime_type(filename)
        file_size = len(file_data)
        
        try:
            # Upload file to MinIO
            from io import BytesIO
            
            def _upload_to_minio():
                """Helper function to upload file synchronously."""
                file_stream = BytesIO(file_data)
                return self.client.put_object(
                    bucket_name=bucket,
                    object_name=file_path,
                    data=file_stream,
                    length=file_size,
                    content_type=mime_type,
                    metadata={
                        'original-filename': filename,
                        'user-id': user_id,
                        'file-hash': file_hash,
                        'upload-timestamp': datetime.utcnow().isoformat()
                    }
                )
            
            # Run upload in thread pool
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(self.executor, _upload_to_minio)
            
            logger.info(
                "File uploaded successfully",
                file_path=file_path,
                file_size=file_size,
                user_id=user_id,
                etag=result.etag
            )
            
            return file_path, file_hash, mime_type, file_size
            
        except S3Error as e:
            logger.error("S3 error uploading file", file_path=file_path, error=str(e))
            raise Exception(f"Failed to upload file: {str(e)}")
        except Exception as e:
            logger.error("Unexpected error uploading file", file_path=file_path, error=str(e))
            raise
    
    async def download_file(
        self, 
        file_path: str, 
        bucket_name: Optional[str] = None
    ) -> bytes:
        """
        Download a file from MinIO storage.
        
        Args:
            file_path: Path to the file in storage
            bucket_name: Custom bucket name (optional)
            
        Returns:
            File content as bytes
            
        Raises:
            Exception: If download fails
        """
        bucket = bucket_name or self.settings.MINIO_BUCKET_NAME
        
        try:
            response = self.client.get_object(bucket, file_path)
            file_data = response.read()
            response.close()
            response.release_conn()
            
            logger.info("File downloaded successfully", file_path=file_path, size=len(file_data))
            return file_data
            
        except S3Error as e:
            logger.error("S3 error downloading file", file_path=file_path, error=str(e))
            raise Exception(f"Failed to download file: {str(e)}")
        except Exception as e:
            logger.error("Unexpected error downloading file", file_path=file_path, error=str(e))
            raise
    
    async def get_file_info(
        self, 
        file_path: str, 
        bucket_name: Optional[str] = None
    ) -> dict:
        """
        Get file information from MinIO.
        
        Args:
            file_path: Path to the file in storage
            bucket_name: Custom bucket name (optional)
            
        Returns:
            Dictionary containing file information
            
        Raises:
            Exception: If file info retrieval fails
        """
        bucket = bucket_name or self.settings.MINIO_BUCKET_NAME
        
        try:
            stat = self.client.stat_object(bucket, file_path)
            
            return {
                'size': stat.size,
                'etag': stat.etag,
                'last_modified': stat.last_modified,
                'content_type': stat.content_type,
                'metadata': stat.metadata or {}
            }
            
        except S3Error as e:
            logger.error("S3 error getting file info", file_path=file_path, error=str(e))
            raise Exception(f"Failed to get file info: {str(e)}")
        except Exception as e:
            logger.error("Unexpected error getting file info", file_path=file_path, error=str(e))
            raise
    
    async def delete_file(
        self, 
        file_path: str, 
        bucket_name: Optional[str] = None
    ) -> bool:
        """
        Delete a file from MinIO storage.
        
        Args:
            file_path: Path to the file in storage
            bucket_name: Custom bucket name (optional)
            
        Returns:
            True if deletion was successful
            
        Raises:
            Exception: If deletion fails
        """
        bucket = bucket_name or self.settings.MINIO_BUCKET_NAME
        
        try:
            self.client.remove_object(bucket, file_path)
            logger.info("File deleted successfully", file_path=file_path)
            return True
            
        except S3Error as e:
            logger.error("S3 error deleting file", file_path=file_path, error=str(e))
            raise Exception(f"Failed to delete file: {str(e)}")
        except Exception as e:
            logger.error("Unexpected error deleting file", file_path=file_path, error=str(e))
            raise
    
    async def generate_presigned_url(
        self, 
        file_path: str, 
        expires_hours: int = 1,
        bucket_name: Optional[str] = None
    ) -> str:
        """
        Generate a presigned URL for file access.
        
        Args:
            file_path: Path to the file in storage
            expires_hours: URL expiration time in hours
            bucket_name: Custom bucket name (optional)
            
        Returns:
            Presigned URL string
            
        Raises:
            Exception: If URL generation fails
        """
        bucket = bucket_name or self.settings.MINIO_BUCKET_NAME
        
        def _generate_url():
            """Generate presigned URL synchronously."""
            expires = timedelta(hours=expires_hours)
            return self.client.presigned_get_object(
                bucket_name=bucket,
                object_name=file_path,
                expires=expires
            )
        
        try:
            # Run in thread pool completely isolated from async context
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(_generate_url)
                url = future.result(timeout=10)  # 10 second timeout
            
            logger.info(
                "Presigned URL generated successfully", 
                file_path=file_path, 
                expires_hours=expires_hours
            )
            return url
            
        except Exception as e:
            logger.error("Failed to generate presigned URL", file_path=file_path, error=str(e))
            raise Exception(f"Failed to generate presigned URL: {str(e)}")
    
    async def list_user_files(
        self, 
        user_id: str, 
        bucket_name: Optional[str] = None,
        limit: Optional[int] = None
    ) -> List[dict]:
        """
        List all files for a specific user.
        
        Args:
            user_id: User ID to filter files
            bucket_name: Custom bucket name (optional)
            limit: Maximum number of files to return
            
        Returns:
            List of file information dictionaries
        """
        bucket = bucket_name or self.settings.MINIO_BUCKET_NAME
        
        try:
            prefix = f"users/{user_id}/"
            objects = self.client.list_objects(bucket, prefix=prefix, recursive=True)
            
            files = []
            count = 0
            
            for obj in objects:
                if limit and count >= limit:
                    break
                
                files.append({
                    'object_name': obj.object_name,
                    'size': obj.size,
                    'etag': obj.etag,
                    'last_modified': obj.last_modified,
                    'is_dir': obj.is_dir
                })
                count += 1
            
            logger.info("Listed user files", user_id=user_id, count=len(files))
            return files
            
        except S3Error as e:
            logger.error("S3 error listing user files", user_id=user_id, error=str(e))
            raise Exception(f"Failed to list user files: {str(e)}")
        except Exception as e:
            logger.error("Unexpected error listing user files", user_id=user_id, error=str(e))
            raise
    
    async def check_file_exists(
        self, 
        file_path: str, 
        bucket_name: Optional[str] = None
    ) -> bool:
        """
        Check if a file exists in storage.
        
        Args:
            file_path: Path to the file in storage
            bucket_name: Custom bucket name (optional)
            
        Returns:
            True if file exists, False otherwise
        """
        bucket = bucket_name or self.settings.MINIO_BUCKET_NAME
        
        try:
            self.client.stat_object(bucket, file_path)
            return True
        except S3Error as e:
            if e.code == 'NoSuchKey':
                return False
            logger.error("S3 error checking file existence", file_path=file_path, error=str(e))
            raise Exception(f"Failed to check file existence: {str(e)}")
        except Exception as e:
            logger.error("Unexpected error checking file existence", file_path=file_path, error=str(e))
            raise


# Global storage service instance
storage_service = StorageService() 