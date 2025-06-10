# ZKP File Sharing API - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URLs and Environment Setup](#base-urls-and-environment-setup)
4. [Common Response Formats](#common-response-formats)
5. [Error Handling](#error-handling)
6. [Authentication Endpoints](#authentication-endpoints)
7. [File Management Endpoints](#file-management-endpoints)
8. [User Endpoints](#user-endpoints)
9. [Health Check](#health-check)
10. [Code Examples](#code-examples)

---

## Overview

The ZKP File Sharing API is a secure file-sharing application that uses Zero-Knowledge Proof (ZKP) authentication instead of traditional passwords. This API provides comprehensive file management capabilities with robust security.

### Key Features
- **Zero-Knowledge Proof Authentication**: Users authenticate using cryptographic proofs
- **JWT Token-based Security**: Stateless authentication with configurable token expiration
- **File Upload/Download**: Secure file storage with MinIO backend
- **File Sharing**: Share files with other users with access control
- **Comprehensive Validation**: Input validation, email format checking, and ZKP proof verification
- **OpenAPI Documentation**: Interactive Swagger UI available at `/docs`

### Architecture
- **Backend**: FastAPI with Python 3.11+
- **Database**: PostgreSQL with async SQLAlchemy
- **File Storage**: MinIO object storage
- **Cache**: Redis for session management
- **Authentication**: JWT with ZKP verification

---

## Authentication

The API uses **Bearer Token Authentication** with JWT tokens. After successful login, include the token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication Flow
1. **Register** a new user with ZKP proof
2. **Login** with username/email and ZKP proof to get JWT token
3. **Use JWT token** in Authorization header for protected endpoints
4. **Verify token** anytime to check validity
5. **Logout** to invalidate client-side token

---

## Base URLs and Environment Setup

### Development Environment
```
Base URL: http://localhost:8000
Frontend: http://localhost:3000
Documentation: http://localhost:8000/docs
OpenAPI Spec: http://localhost:8000/openapi.json
MinIO Console: http://localhost:9001
```

### Headers for All Requests
```
Content-Type: application/json
Accept: application/json
```

### For Protected Endpoints
```
Authorization: Bearer <jwt-token>
```

---

## Common Response Formats

### Success Response Format
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data object
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "type": "ErrorTypeName",
    "message": "Human-readable error message",
    "code": "ERROR_CODE"
  }
}
```

### Validation Error Format
```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "field_name"],
      "msg": "Error message",
      "input": "invalid_value"
    }
  ]
}
```

---

## Error Handling

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request format |
| 401 | Unauthorized - Authentication required or failed |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource not found |
| 422 | Unprocessable Entity - Validation failed |
| 500 | Internal Server Error - Server error |

### Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `AUTH_FAILED` | 401 | Authentication failed |
| `ZKP_VERIFICATION_FAILED` | 401 | Zero-Knowledge Proof verification failed |
| `USER_NOT_FOUND` | 404 | User does not exist |
| `FILE_NOT_FOUND` | 404 | File does not exist |
| `VALIDATION_ERROR` | 422 | Input validation failed |
| `PERMISSION_DENIED` | 403 | Access denied |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

---

## Authentication Endpoints

### User Registration

Register a new user account using Zero-Knowledge Proof authentication.

**Endpoint:** `POST /api/auth/register`

#### Request Format
```json
{
  "username": "string (3-50 chars)",
  "email": "string (valid email format)",
  "public_key": "string (user's public key for ZKP)",
  "zkp_proof": {
    "proof": ["string", "string"],
    "public_signals": ["string", "string"],
    "verification_key_hash": "string (optional)"
  }
}
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user_id": "uuid",
    "username": "testuser",
    "email": "test@example.com",
    "created_at": "2025-06-08T11:51:03.212426+00:00"
  }
}
```

### User Login

Authenticate a user and receive JWT token.

**Endpoint:** `POST /api/auth/login`

#### Request Format
```json
{
  "username_or_email": "string",
  "zkp_proof": {
    "proof": ["string", "string"],
    "public_signals": ["string", "string"]
  }
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "jwt-token-string",
    "token_type": "bearer",
    "expires_in": 1800,
    "user": {
      "user_id": "uuid",
      "username": "testuser",
      "email": "test@example.com"
    }
  }
}
```

### Token Verification

Verify if the current JWT token is valid.

**Endpoint:** `GET /api/auth/verify`
**Authentication:** Required

#### Success Response (200)
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user_id": "uuid",
    "username": "testuser",
    "email": "test@example.com",
    "token_expires_at": "2025-06-08T12:21:03.212426+00:00"
  }
}
```

### User Logout

Logout user (client-side token invalidation).

**Endpoint:** `POST /api/auth/logout`
**Authentication:** Required

#### Success Response (200)
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Utility Endpoints

#### Generate Keypair
**Endpoint:** `POST /api/auth/utils/generate-keypair`

Generates a new cryptographic keypair for ZKP authentication.

#### Generate Proof
**Endpoint:** `POST /api/auth/utils/generate-proof`

Generates a ZKP proof for authentication.

#### Verify Proof
**Endpoint:** `POST /api/auth/utils/verify-proof`

Verifies a ZKP proof.

---

## File Management Endpoints

### Upload File

Upload a file to the storage system.

**Endpoint:** `POST /api/files/upload`
**Authentication:** Required
**Content-Type:** `multipart/form-data`

#### Request Format
```
file: <binary file data>
filename: string (optional, original filename)
description: string (optional)
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "file_id": "uuid",
    "filename": "document.pdf",
    "original_filename": "my-document.pdf",
    "size": 1048576,
    "content_type": "application/pdf",
    "file_hash": "sha256-hash",
    "storage_path": "users/user-id/20250608/uuid.pdf",
    "uploaded_at": "2025-06-08T11:51:03.212426+00:00"
  }
}
```

### List User Files

Get list of files owned by the current user.

**Endpoint:** `GET /api/files/`
**Authentication:** Required

#### Query Parameters
- `limit` (optional): Maximum number of files to return
- `offset` (optional): Number of files to skip

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "file_id": "uuid",
        "filename": "document.pdf",
        "size": 1048576,
        "content_type": "application/pdf",
        "uploaded_at": "2025-06-08T11:51:03.212426+00:00",
        "shared_with_count": 2
      }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0
  }
}
```

### List Shared Files

Get list of files shared with the current user.

**Endpoint:** `GET /api/files/shared`
**Authentication:** Required

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "file_id": "uuid",
        "filename": "shared-document.pdf",
        "size": 2097152,
        "content_type": "application/pdf",
        "owner": {
          "user_id": "uuid",
          "username": "owner_user"
        },
        "shared_at": "2025-06-08T11:51:03.212426+00:00",
        "permission": "read"
      }
    ],
    "total": 1
  }
}
```

### Get File Details

Get detailed information about a specific file.

**Endpoint:** `GET /api/files/{file_id}`
**Authentication:** Required

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "file_id": "uuid",
    "filename": "document.pdf",
    "original_filename": "my-document.pdf",
    "size": 1048576,
    "content_type": "application/pdf",
    "file_hash": "sha256-hash",
    "uploaded_at": "2025-06-08T11:51:03.212426+00:00",
    "owner": {
      "user_id": "uuid",
      "username": "testuser"
    },
    "shared_with_count": 2
  }
}
```

### Update File

Update file metadata (filename, description).

**Endpoint:** `PUT /api/files/{file_id}`
**Authentication:** Required

#### Request Format
```json
{
  "filename": "new-filename.pdf",
  "description": "Updated description"
}
```

### Delete File

Delete a file from storage.

**Endpoint:** `DELETE /api/files/{file_id}`
**Authentication:** Required

#### Success Response (200)
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

### Download File

Generate a presigned URL for file download.

**Endpoint:** `GET /api/files/{file_id}/download`
**Authentication:** Required

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "download_url": "https://localhost:9000/zkp-files/...",
    "expires_at": "2025-06-08T12:51:03.212426+00:00",
    "filename": "document.pdf"
  }
}
```

### Share File

Share a file with another user.

**Endpoint:** `POST /api/files/{file_id}/share`
**Authentication:** Required

#### Request Format
```json
{
  "username_or_email": "target_user",
  "permission": "read" // or "write"
}
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "File shared successfully",
  "data": {
    "share_id": "uuid",
    "file_id": "uuid",
    "shared_with": {
      "user_id": "uuid",
      "username": "target_user"
    },
    "permission": "read",
    "shared_at": "2025-06-08T11:51:03.212426+00:00"
  }
}
```

### Remove File Share

Remove sharing access for a specific user.

**Endpoint:** `DELETE /api/files/{file_id}/share/{user_id}`
**Authentication:** Required

#### Success Response (200)
```json
{
  "success": true,
  "message": "File sharing removed successfully"
}
```

### Get File Permissions

Get list of users who have access to a file.

**Endpoint:** `GET /api/files/{file_id}/permissions`
**Authentication:** Required

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "file_id": "uuid",
    "owner": {
      "user_id": "uuid",
      "username": "owner_user"
    },
    "shared_with": [
      {
        "user_id": "uuid",
        "username": "shared_user",
        "permission": "read",
        "shared_at": "2025-06-08T11:51:03.212426+00:00"
      }
    ]
  }
}
```

### Get Storage Info

Get user's storage usage information.

**Endpoint:** `GET /api/files/storage/info`
**Authentication:** Required

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "total_files": 15,
    "total_size": 52428800,
    "total_size_formatted": "50.0 MB",
    "files_shared_by_user": 5,
    "files_shared_with_user": 3
  }
}
```

---

## User Endpoints

### Get User Profile

Get current user's profile information.

**Endpoint:** `GET /api/users/profile`
**Authentication:** Required

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "username": "testuser",
    "email": "test@example.com",
    "created_at": "2025-06-08T11:51:03.212426+00:00",
    "last_login": "2025-06-08T12:00:00.000000+00:00"
  }
}
```

---

## Health Check

### Application Health

Check if the application is running and healthy.

**Endpoint:** `GET /health`

#### Success Response (200)
```json
{
  "status": "healthy",
  "app": "ZKP File Sharing API",
  "version": "0.1.0"
}
```

---

## Code Examples

### Python (requests)

```python
import requests
import json

# Base URL
BASE_URL = "http://localhost:8000"

# Register user
register_data = {
    "username": "testuser",
    "email": "test@example.com",
    "public_key": "your-public-key",
    "zkp_proof": {
        "proof": ["proof1", "proof2"],
        "public_signals": ["signal1", "signal2"]
    }
}

response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
print(response.json())

# Login
login_data = {
    "username_or_email": "testuser",
    "zkp_proof": {
        "proof": ["proof1", "proof2"],
        "public_signals": ["signal1", "signal2"]
    }
}

response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
token_data = response.json()
access_token = token_data["data"]["access_token"]

# Use token for authenticated requests
headers = {"Authorization": f"Bearer {access_token}"}

# Upload file
with open("document.pdf", "rb") as file:
    files = {"file": file}
    response = requests.post(f"{BASE_URL}/api/files/upload", 
                           files=files, headers=headers)
    print(response.json())

# List files
response = requests.get(f"{BASE_URL}/api/files/", headers=headers)
print(response.json())
```

### JavaScript (fetch)

```javascript
const BASE_URL = "http://localhost:8000";

// Register user
const registerUser = async () => {
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: "testuser",
      email: "test@example.com",
      public_key: "your-public-key",
      zkp_proof: {
        proof: ["proof1", "proof2"],
        public_signals: ["signal1", "signal2"]
      }
    })
  });
  
  return await response.json();
};

// Login user
const loginUser = async () => {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username_or_email: "testuser",
      zkp_proof: {
        proof: ["proof1", "proof2"],
        public_signals: ["signal1", "signal2"]
      }
    })
  });
  
  const data = await response.json();
  return data.data.access_token;
};

// Upload file
const uploadFile = async (token, file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${BASE_URL}/api/files/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData
  });
  
  return await response.json();
};

// List files
const listFiles = async (token) => {
  const response = await fetch(`${BASE_URL}/api/files/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });
  
  return await response.json();
};
```

### cURL Examples

```bash
# Register user
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "public_key": "your-public-key",
    "zkp_proof": {
      "proof": ["proof1", "proof2"],
      "public_signals": ["signal1", "signal2"]
    }
  }'

# Login user
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username_or_email": "testuser",
    "zkp_proof": {
      "proof": ["proof1", "proof2"],
      "public_signals": ["signal1", "signal2"]
    }
  }'

# Upload file (replace YOUR_TOKEN with actual token)
curl -X POST "http://localhost:8000/api/files/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@document.pdf"

# List files
curl -X GET "http://localhost:8000/api/files/" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Download file
curl -X GET "http://localhost:8000/api/files/FILE_ID/download" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

*This documentation is for API version 0.1.0. For the latest updates, visit the interactive documentation at `/docs` when the server is running.* 