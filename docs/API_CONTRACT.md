# ZKP File Sharing API Contract

**Base URL**: `http://localhost:8000/api`  
**Authentication**: Bearer Token (JWT) + Zero-Knowledge Proof  
**Content-Type**: `application/json`

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "username": "string",
  "email": "string", 
  "public_key": "string",
  "zkp_proof": {
    "proof": "string",
    "public_signals": ["string"]
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user_id": "uuid",
    "username": "string",
    "email": "string",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Errors:**
- `400` - Invalid ZKP proof or missing fields
- `409` - Username or email already exists

---

### Login User
```http
POST /auth/login
```

**Request Body:**
```json
{
  "identifier": "string", // username or email
  "zkp_proof": {
    "proof": "string",
    "public_signals": ["string"]
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "string",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "user_id": "uuid",
      "username": "string",
      "email": "string"
    }
  }
}
```

**Errors:**
- `401` - Invalid credentials or ZKP proof
- `404` - User not found

---

### Verify Token
```http
GET /auth/verify
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user_id": "uuid",
    "expires_at": "2024-01-01T01:00:00Z"
  }
}
```

---

### Logout
```http
POST /auth/logout
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 👤 User Management Endpoints

### Get User Profile
```http
GET /users/profile
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "username": "string",
    "email": "string",
    "created_at": "2024-01-01T00:00:00Z",
    "total_files": 10,
    "storage_used": 1024000, // bytes
    "storage_limit": 10485760 // bytes
  }
}
```

---

### Update User Profile
```http
PUT /users/profile
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "username": "string", // optional
  "email": "string" // optional
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user_id": "uuid",
    "username": "string",
    "email": "string"
  }
}
```

---

## 📁 File Management Endpoints

### Upload File
```http
POST /files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
file: <file>
title: "string" (optional)
description: "string" (optional)
is_public: boolean (optional, default: false)
zkp_proof: {
  "proof": "string",
  "public_signals": ["string"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "file_id": "uuid",
    "filename": "string",
    "title": "string",
    "description": "string",
    "file_size": 1024,
    "mime_type": "string",
    "is_public": false,
    "uploaded_at": "2024-01-01T00:00:00Z",
    "owner_id": "uuid"
  }
}
```

**Errors:**
- `400` - Invalid file or ZKP proof
- `413` - File too large
- `415` - Unsupported file type

---

### List Files
```http
GET /files?page=1&limit=20&search=string&sort=created_at&order=desc
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: integer (default: 1)
- `limit`: integer (default: 20, max: 100)
- `search`: string (search in filename/title)
- `sort`: string (created_at, size, title)
- `order`: string (asc, desc)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "file_id": "uuid",
        "filename": "string",
        "title": "string",
        "description": "string",
        "file_size": 1024,
        "mime_type": "string",
        "is_public": false,
        "uploaded_at": "2024-01-01T00:00:00Z",
        "shared_count": 3
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

---

### Get File Details
```http
GET /files/{file_id}
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "file_id": "uuid",
    "filename": "string",
    "title": "string",
    "description": "string",
    "file_size": 1024,
    "mime_type": "string",
    "is_public": false,
    "uploaded_at": "2024-01-01T00:00:00Z",
    "owner": {
      "user_id": "uuid",
      "username": "string"
    },
    "permissions": [
      {
        "user_id": "uuid",
        "username": "string",
        "permission_type": "read",
        "granted_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

**Errors:**
- `404` - File not found
- `403` - No permission to access file

---

### Update File Metadata
```http
PUT /files/{file_id}
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "string", // optional
  "description": "string", // optional
  "is_public": boolean // optional
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "File updated successfully",
  "data": {
    "file_id": "uuid",
    "filename": "string",
    "title": "string",
    "description": "string",
    "is_public": false,
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Errors:**
- `404` - File not found
- `403` - Not file owner

---

### Delete File
```http
DELETE /files/{file_id}
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

**Errors:**
- `404` - File not found
- `403` - Not file owner

---

### Download File
```http
GET /files/{file_id}/download
Authorization: Bearer <token>
```

**Request Headers:**
```
ZKP-Proof: {"proof": "string", "public_signals": ["string"]}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "download_url": "string", // presigned URL
    "expires_at": "2024-01-01T01:00:00Z"
  }
}
```

**Errors:**
- `404` - File not found
- `403` - No download permission
- `401` - Invalid ZKP proof

---

## 🔄 File Sharing Endpoints

### Share File
```http
POST /files/{file_id}/share
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "user_ids": ["uuid"], // array of user IDs
  "permission_type": "read", // "read" or "download"
  "expires_at": "2024-01-01T01:00:00Z" // optional
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "File shared successfully",
  "data": {
    "shared_with": [
      {
        "user_id": "uuid",
        "username": "string",
        "permission_type": "read",
        "granted_at": "2024-01-01T00:00:00Z",
        "expires_at": "2024-01-01T01:00:00Z"
      }
    ]
  }
}
```

**Errors:**
- `404` - File not found or user not found
- `403` - Not file owner

---

### List Shared Files
```http
GET /files/shared?page=1&limit=20
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "file_id": "uuid",
        "filename": "string",
        "title": "string",
        "file_size": 1024,
        "mime_type": "string",
        "owner": {
          "user_id": "uuid",
          "username": "string"
        },
        "permission_type": "read",
        "shared_at": "2024-01-01T00:00:00Z",
        "expires_at": "2024-01-01T01:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

---

### Update File Permissions
```http
PUT /files/{file_id}/permissions
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "user_id": "uuid",
  "permission_type": "download", // "read" or "download" 
  "expires_at": "2024-01-01T01:00:00Z" // optional
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Permissions updated successfully"
}
```

---

### Revoke File Access
```http
DELETE /files/{file_id}/share/{user_id}
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Access revoked successfully"
}
```

---

### Get File Permissions
```http
GET /files/{file_id}/permissions
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "permissions": [
      {
        "user_id": "uuid",
        "username": "string",
        "email": "string",
        "permission_type": "read",
        "granted_at": "2024-01-01T00:00:00Z",
        "expires_at": "2024-01-01T01:00:00Z"
      }
    ]
  }
}
```

---

## 🔍 Search & Discovery

### Search Users
```http
GET /users/search?q=username&limit=10
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "user_id": "uuid",
        "username": "string",
        "email": "string" // only if public
      }
    ]
  }
}
```

---

### Public Files
```http
GET /files/public?page=1&limit=20
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "file_id": "uuid",
        "filename": "string",
        "title": "string",
        "description": "string",
        "file_size": 1024,
        "mime_type": "string",
        "uploaded_at": "2024-01-01T00:00:00Z",
        "owner": {
          "username": "string"
        },
        "download_count": 150
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 200,
      "pages": 10
    }
  }
}
```

---

## 📊 Analytics & Audit

### User Statistics
```http
GET /users/stats
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_files": 25,
    "storage_used": 10485760,
    "storage_limit": 104857600,
    "files_shared": 10,
    "files_received": 5,
    "download_count": 100,
    "recent_activity": [
      {
        "action": "file_upload",
        "file_name": "document.pdf",
        "timestamp": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

## 🛡️ System Endpoints

### Health Check
```http
GET /health
```

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "healthy",
    "storage": "healthy",
    "zkp_service": "healthy"
  }
}
```

---

## 📚 Common Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {} // varies by endpoint
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input provided",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### Pagination
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## 🔐 Zero-Knowledge Proof Format

### ZKP Proof Structure
```json
{
  "zkp_proof": {
    "proof": "string", // Base64 encoded proof
    "public_signals": ["string"], // Array of public signals
    "verification_key_hash": "string" // Optional: VK hash for verification
  }
}
```

---

## 📝 Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_FAILED` | Invalid credentials or ZKP proof |
| `AUTHORIZATION_FAILED` | Insufficient permissions |
| `FILE_NOT_FOUND` | Requested file doesn't exist |
| `USER_NOT_FOUND` | Requested user doesn't exist |
| `FILE_TOO_LARGE` | File exceeds size limit |
| `STORAGE_LIMIT_EXCEEDED` | User storage quota exceeded |
| `INVALID_FILE_TYPE` | File type not allowed |
| `ZKP_VERIFICATION_FAILED` | Zero-knowledge proof verification failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_SERVER_ERROR` | Server error occurred |

---

## 🔧 Rate Limiting

- **Authentication endpoints**: 5 requests per minute per IP
- **File upload**: 10 requests per hour per user  
- **File download**: 100 requests per hour per user
- **Other endpoints**: 100 requests per minute per user

Rate limit headers included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
``` 