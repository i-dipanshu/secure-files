# ZKP File Sharing API - Comprehensive Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URLs and Environment Setup](#base-urls-and-environment-setup)
4. [Common Response Formats](#common-response-formats)
5. [Error Handling](#error-handling)
6. [Authentication Endpoints](#authentication-endpoints)
   - [User Registration](#user-registration)
   - [User Login](#user-login)
   - [Token Verification](#token-verification)
   - [User Logout](#user-logout)
7. [Health Check](#health-check)
8. [Postman Collection Setup](#postman-collection-setup)
9. [Code Examples](#code-examples)

---

## Overview

The ZKP File Sharing API is a secure file-sharing application that uses Zero-Knowledge Proof (ZKP) authentication instead of traditional passwords. This API provides a robust authentication system with JWT tokens and comprehensive error handling.

### Key Features
- **Zero-Knowledge Proof Authentication**: Users authenticate using cryptographic proofs instead of passwords
- **JWT Token-based Security**: Stateless authentication with configurable token expiration
- **Comprehensive Validation**: Input validation, email format checking, and ZKP proof verification
- **Detailed Error Responses**: Clear error messages with specific error codes
- **OpenAPI Documentation**: Interactive Swagger UI available at `/docs`

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
Documentation: http://localhost:8000/docs
OpenAPI Spec: http://localhost:8000/openapi.json
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
      "input": "invalid_value",
      "ctx": {"error": {}}
    }
  ]
}
```

---

## Error Handling

### Common Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `AUTH_FAILED` | 401 | Authentication failed - invalid credentials |
| `ZKP_VERIFICATION_FAILED` | 401 | Zero-Knowledge Proof verification failed |
| `USER_NOT_FOUND` | 404 | User does not exist |
| `VALIDATION_ERROR` | 422 | Input validation failed |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

### Error Response Examples

**Authentication Failed:**
```json
{
  "success": false,
  "error": {
    "type": "AuthenticationError",
    "message": "Username already exists",
    "code": "AUTH_FAILED"
  }
}
```

**ZKP Verification Failed:**
```json
{
  "success": false,
  "error": {
    "type": "ZKPVerificationError",
    "message": "Zero-knowledge proof verification failed",
    "code": "ZKP_VERIFICATION_FAILED"
  }
}
```

---

## Authentication Endpoints

### User Registration

Register a new user account using Zero-Knowledge Proof authentication.

**Endpoint:** `POST /api/auth/register`

**Description:** Creates a new user account with ZKP authentication. The system verifies the provided ZKP proof before creating the user.

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

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | ✅ | Unique username (3-50 characters) |
| `email` | string | ✅ | Valid email address |
| `public_key` | string | ✅ | User's cryptographic public key |
| `zkp_proof.proof` | array | ✅ | Array of proof elements |
| `zkp_proof.public_signals` | array | ✅ | Array of public signals |
| `zkp_proof.verification_key_hash` | string | ❌ | Optional verification key hash |

#### Success Response (201 Created)

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user_id": "2f522f94-165f-4227-9e74-53723c69c7bd",
    "username": "testuser",
    "email": "test@example.com",
    "created_at": "2025-06-08T11:51:03.212426+00:00"
  }
}
```

#### Error Responses

**Username Already Exists (401):**
```json
{
  "success": false,
  "error": {
    "type": "AuthenticationError",
    "message": "Username already exists",
    "code": "AUTH_FAILED"
  }
}
```

**Email Already Exists (401):**
```json
{
  "success": false,
  "error": {
    "type": "AuthenticationError",
    "message": "Email already exists",
    "code": "AUTH_FAILED"
  }
}
```

**Invalid Email Format (422):**
```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "email"],
      "msg": "Value error, Invalid email format",
      "input": "invalid-email"
    }
  ]
}
```

**Invalid ZKP Proof (401):**
```json
{
  "success": false,
  "error": {
    "type": "ZKPVerificationError",
    "message": "Invalid ZKP proof for registration",
    "code": "ZKP_VERIFICATION_FAILED"
  }
}
```

#### cURL Example

```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_crypto",
    "email": "alice@example.com",
    "public_key": "04a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "zkp_proof": {
      "proof": ["0x1a2b3c4d", "0x5e6f7890"],
      "public_signals": ["0xabcdef01", "0x23456789"]
    }
  }'
```

#### JavaScript Example

```javascript
const registerUser = async () => {
  const response = await fetch('http://localhost:8000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'alice_crypto',
      email: 'alice@example.com',
      public_key: '04a1b2c3d4e5f67890abcdef...',
      zkp_proof: {
        proof: ['0x1a2b3c4d', '0x5e6f7890'],
        public_signals: ['0xabcdef01', '0x23456789']
      }
    })
  });
  
  const data = await response.json();
  console.log(data);
};
```

---

### User Login

Authenticate a user using Zero-Knowledge Proof and receive a JWT token.

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticates a user by verifying their ZKP proof against their stored public key. Returns a JWT token for subsequent API calls.

#### Request Format

```json
{
  "identifier": "string (username or email)",
  "zkp_proof": {
    "proof": ["string", "string"],
    "public_signals": ["string", "string"],
    "verification_key_hash": "string (optional)"
  }
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `identifier` | string | ✅ | Username or email address |
| `zkp_proof.proof` | array | ✅ | Array of proof elements |
| `zkp_proof.public_signals` | array | ✅ | Array of public signals |

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 1800,
    "user": {
      "user_id": "2f522f94-165f-4227-9e74-53723c69c7bd",
      "username": "testuser",
      "email": "test@example.com"
    }
  }
}
```

#### Response Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `access_token` | string | JWT token for authentication |
| `token_type` | string | Always "Bearer" |
| `expires_in` | number | Token expiration time in seconds |
| `user` | object | Basic user information |

#### Error Responses

**User Not Found (404):**
```json
{
  "success": false,
  "error": {
    "type": "UserNotFound",
    "message": "User with identifier 'nonexistent' not found",
    "code": "USER_NOT_FOUND"
  }
}
```

**Invalid ZKP Proof (401):**
```json
{
  "success": false,
  "error": {
    "type": "ZKPVerificationError",
    "message": "Zero-knowledge proof verification failed",
    "code": "ZKP_VERIFICATION_FAILED"
  }
}
```

**Inactive User (401):**
```json
{
  "success": false,
  "error": {
    "type": "AuthenticationError",
    "message": "User account is inactive",
    "code": "AUTH_FAILED"
  }
}
```

#### cURL Example

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "alice_crypto",
    "zkp_proof": {
      "proof": ["0x1a2b3c4d", "0x5e6f7890"],
      "public_signals": ["0xabcdef01", "0x23456789"]
    }
  }'
```

#### Python Example

```python
import requests

def login_user(identifier, zkp_proof):
    url = "http://localhost:8000/api/auth/login"
    data = {
        "identifier": identifier,
        "zkp_proof": zkp_proof
    }
    
    response = requests.post(url, json=data)
    return response.json()

# Usage
zkp_proof = {
    "proof": ["0x1a2b3c4d", "0x5e6f7890"],
    "public_signals": ["0xabcdef01", "0x23456789"]
}

result = login_user("alice_crypto", zkp_proof)
token = result["data"]["access_token"]
```

---

### Token Verification

Verify the validity of a JWT token and get current user information.

**Endpoint:** `GET /api/auth/verify`

**Description:** Validates the provided JWT token and returns current user information. Use this endpoint to check if a token is still valid and get user details.

**Authentication Required:** ✅ Bearer Token

#### Headers Required

```
Authorization: Bearer <jwt-token>
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "valid": true,
    "user_id": "2f522f94-165f-4227-9e74-53723c69c7bd",
    "username": "testuser",
    "email": "test@example.com",
    "is_active": true,
    "is_verified": false
  }
}
```

#### Response Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `valid` | boolean | Always true for successful verification |
| `user_id` | string | Unique user identifier |
| `username` | string | User's username |
| `email` | string | User's email address |
| `is_active` | boolean | Whether user account is active |
| `is_verified` | boolean | Whether user's email is verified |

#### Error Responses

**Invalid Token (401):**
```json
{
  "detail": "Invalid token"
}
```

**Expired Token (401):**
```json
{
  "detail": "Token has expired"
}
```

**Missing Token (403):**
```json
{
  "detail": "Not authenticated"
}
```

#### cURL Example

```bash
curl -X GET "http://localhost:8000/api/auth/verify" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### JavaScript Example with Error Handling

```javascript
const verifyToken = async (token) => {
  try {
    const response = await fetch('http://localhost:8000/api/auth/verify', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};
```

---

### User Logout

Logout user and invalidate the JWT token (client-side).

**Endpoint:** `POST /api/auth/logout`

**Description:** Provides a logout confirmation. Since JWT tokens are stateless, the actual invalidation must be handled on the client side by removing the token from storage.

**Authentication Required:** ✅ Bearer Token

#### Headers Required

```
Authorization: Bearer <jwt-token>
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": {
    "user_id": "2f522f94-165f-4227-9e74-53723c69c7bd",
    "message": "Please remove the token from client storage"
  }
}
```

#### Error Responses

Same as token verification (401 for invalid/expired tokens).

#### cURL Example

```bash
curl -X POST "http://localhost:8000/api/auth/logout" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Complete Logout Flow Example

```javascript
const logout = async (token) => {
  try {
    // Call logout endpoint
    const response = await fetch('http://localhost:8000/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Remove token from local storage
      localStorage.removeItem('jwt_token');
      sessionStorage.removeItem('jwt_token');
      
      // Clear any other user data
      localStorage.removeItem('user_info');
      
      console.log('Logged out successfully');
      return true;
    }
  } catch (error) {
    console.error('Logout failed:', error);
    return false;
  }
};
```

---

## Health Check

Check API health and status.

**Endpoint:** `GET /health`

**Description:** Simple health check endpoint to verify the API is running correctly.

**Authentication Required:** ❌ Public endpoint

#### Success Response (200 OK)

```json
{
  "status": "healthy",
  "app": "ZKP File Sharing API",
  "version": "0.1.0"
}
```

#### cURL Example

```bash
curl -X GET "http://localhost:8000/health"
```

---

## Postman Collection Setup

### 1. Create New Collection
1. Open Postman
2. Click "New" → "Collection"
3. Name it "ZKP File Sharing API"

### 2. Set Collection Variables
Go to Collection → Variables tab and add:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `baseUrl` | `http://localhost:8000` | `http://localhost:8000` |
| `token` | | |

### 3. Import Requests

#### Authentication Folder

**1. Register User**
- Method: `POST`
- URL: `{{baseUrl}}/api/auth/register`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "username": "{{$randomUserName}}",
  "email": "{{$randomEmail}}",
  "public_key": "04a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "zkp_proof": {
    "proof": ["0x1a2b3c4d", "0x5e6f7890"],
    "public_signals": ["0xabcdef01", "0x23456789"]
  }
}
```

**2. Login User**
- Method: `POST`
- URL: `{{baseUrl}}/api/auth/login`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "identifier": "testuser",
  "zkp_proof": {
    "proof": ["0x1a2b3c4d", "0x5e6f7890"],
    "public_signals": ["0xabcdef01", "0x23456789"]
  }
}
```
- Tests (to save token):
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.collectionVariables.set("token", response.data.access_token);
}
```

**3. Verify Token**
- Method: `GET`
- URL: `{{baseUrl}}/api/auth/verify`
- Headers: `Authorization: Bearer {{token}}`

**4. Logout**
- Method: `POST`
- URL: `{{baseUrl}}/api/auth/logout`
- Headers: `Authorization: Bearer {{token}}`

### 4. Authorization Setup
For protected endpoints:
1. Go to Authorization tab
2. Type: "Bearer Token"
3. Token: `{{token}}`

---

## Code Examples

### Complete Authentication Flow

#### Node.js/Express Integration

```javascript
const express = require('express');
const axios = require('axios');

class ZKPAuthClient {
  constructor(baseUrl = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
    this.token = null;
  }

  async register(username, email, publicKey, zkpProof) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/auth/register`, {
        username,
        email,
        public_key: publicKey,
        zkp_proof: zkpProof
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || error.message 
      };
    }
  }

  async login(identifier, zkpProof) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/auth/login`, {
        identifier,
        zkp_proof: zkpProof
      });
      
      this.token = response.data.data.access_token;
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || error.message 
      };
    }
  }

  async verifyToken() {
    if (!this.token) {
      return { success: false, error: 'No token available' };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || error.message 
      };
    }
  }

  async logout() {
    if (!this.token) {
      return { success: false, error: 'No token available' };
    }

    try {
      const response = await axios.post(`${this.baseUrl}/api/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      this.token = null;
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || error.message 
      };
    }
  }

  getAuthHeaders() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }
}

// Usage Example
const authClient = new ZKPAuthClient();

// Register
const registerResult = await authClient.register(
  'alice_crypto',
  'alice@example.com',
  '04a1b2c3d4e5f67890abcdef...',
  {
    proof: ['0x1a2b3c4d', '0x5e6f7890'],
    public_signals: ['0xabcdef01', '0x23456789']
  }
);

// Login
const loginResult = await authClient.login('alice_crypto', {
  proof: ['0x1a2b3c4d', '0x5e6f7890'],
  public_signals: ['0xabcdef01', '0x23456789']
});

// Verify token
const verifyResult = await authClient.verifyToken();

module.exports = ZKPAuthClient;
```

#### Python Integration

```python
import requests
import json
from typing import Dict, Optional, Any

class ZKPAuthClient:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.token: Optional[str] = None
        
    def register(self, username: str, email: str, public_key: str, zkp_proof: Dict) -> Dict[str, Any]:
        """Register a new user"""
        url = f"{self.base_url}/api/auth/register"
        data = {
            "username": username,
            "email": email,
            "public_key": public_key,
            "zkp_proof": zkp_proof
        }
        
        try:
            response = requests.post(url, json=data)
            return {
                "success": response.status_code == 201,
                "data": response.json(),
                "status_code": response.status_code
            }
        except requests.RequestException as e:
            return {"success": False, "error": str(e)}
    
    def login(self, identifier: str, zkp_proof: Dict) -> Dict[str, Any]:
        """Login user and store token"""
        url = f"{self.base_url}/api/auth/login"
        data = {
            "identifier": identifier,
            "zkp_proof": zkp_proof
        }
        
        try:
            response = requests.post(url, json=data)
            result = response.json()
            
            if response.status_code == 200 and result.get("success"):
                self.token = result["data"]["access_token"]
                
            return {
                "success": response.status_code == 200,
                "data": result,
                "status_code": response.status_code
            }
        except requests.RequestException as e:
            return {"success": False, "error": str(e)}
    
    def verify_token(self) -> Dict[str, Any]:
        """Verify current token"""
        if not self.token:
            return {"success": False, "error": "No token available"}
            
        url = f"{self.base_url}/api/auth/verify"
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            response = requests.get(url, headers=headers)
            return {
                "success": response.status_code == 200,
                "data": response.json(),
                "status_code": response.status_code
            }
        except requests.RequestException as e:
            return {"success": False, "error": str(e)}
    
    def logout(self) -> Dict[str, Any]:
        """Logout user"""
        if not self.token:
            return {"success": False, "error": "No token available"}
            
        url = f"{self.base_url}/api/auth/logout"
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            response = requests.post(url, headers=headers)
            result = response.json()
            
            if response.status_code == 200:
                self.token = None
                
            return {
                "success": response.status_code == 200,
                "data": result,
                "status_code": response.status_code
            }
        except requests.RequestException as e:
            return {"success": False, "error": str(e)}
    
    def get_auth_headers(self) -> Dict[str, str]:
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

# Usage Example
if __name__ == "__main__":
    client = ZKPAuthClient()
    
    # Example ZKP proof (placeholder)
    zkp_proof = {
        "proof": ["0x1a2b3c4d", "0x5e6f7890"],
        "public_signals": ["0xabcdef01", "0x23456789"]
    }
    
    # Register
    register_result = client.register(
        "alice_crypto",
        "alice@example.com", 
        "04a1b2c3d4e5f67890abcdef...",
        zkp_proof
    )
    print("Register:", register_result)
    
    # Login
    login_result = client.login("alice_crypto", zkp_proof)
    print("Login:", login_result)
    
    # Verify
    verify_result = client.verify_token()
    print("Verify:", verify_result)
    
    # Logout
    logout_result = client.logout()
    print("Logout:", logout_result)
```

---

## Testing Scenarios

### 1. Happy Path Testing

```bash
# 1. Register new user
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user_001",
    "email": "test001@example.com",
    "public_key": "04a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "zkp_proof": {
      "proof": ["0x1a2b3c4d", "0x5e6f7890"],
      "public_signals": ["0xabcdef01", "0x23456789"]
    }
  }'

# 2. Login with username
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test_user_001",
    "zkp_proof": {
      "proof": ["0x1a2b3c4d", "0x5e6f7890"],
      "public_signals": ["0xabcdef01", "0x23456789"]
    }
  }'

# 3. Verify token (replace with actual token)
curl -X GET "http://localhost:8000/api/auth/verify" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 4. Logout
curl -X POST "http://localhost:8000/api/auth/logout" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2. Error Case Testing

```bash
# Test duplicate registration
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user_001",
    "email": "different@example.com",
    "public_key": "04abc...",
    "zkp_proof": {
      "proof": ["0x123"],
      "public_signals": ["0x456"]
    }
  }'

# Test invalid email
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "new_user",
    "email": "invalid-email",
    "public_key": "04abc...",
    "zkp_proof": {
      "proof": ["0x123"],
      "public_signals": ["0x456"]
    }
  }'

# Test invalid ZKP proof
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test_user_001",
    "zkp_proof": {
      "proof": [],
      "public_signals": []
    }
  }'

# Test with invalid token
curl -X GET "http://localhost:8000/api/auth/verify" \
  -H "Authorization: Bearer invalid_token"
```

---

## Rate Limiting and Best Practices

### Rate Limiting (Future Implementation)
- **Registration**: 5 requests per hour per IP
- **Login**: 10 requests per minute per IP
- **Token Verification**: 100 requests per minute per token
- **General API**: 1000 requests per hour per token

### Security Best Practices

1. **Token Storage**: Store JWT tokens securely (HttpOnly cookies recommended for web apps)
2. **Token Expiration**: Tokens expire in 30 minutes by default
3. **HTTPS Only**: Always use HTTPS in production
4. **Input Validation**: All inputs are validated server-side
5. **Error Handling**: Detailed errors in development, generic in production

### Performance Optimization

1. **Connection Pooling**: Database connections are pooled
2. **Async Operations**: All database operations are asynchronous
3. **Structured Logging**: Comprehensive logging for monitoring
4. **Caching**: Consider implementing Redis caching for frequently accessed data

---

*This documentation is for API version 0.1.0. For the latest updates, visit the interactive documentation at `/docs` when the server is running.* 