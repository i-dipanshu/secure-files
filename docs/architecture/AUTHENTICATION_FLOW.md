# ZKP Authentication Flow Documentation

## 🔐 Overview

The ZKP File Sharing API implements **Zero-Knowledge Proof authentication** using **Schnorr proofs** on the SECP256k1 elliptic curve. This provides passwordless authentication where users prove knowledge of their private key without revealing it.

---

## 🏗️ Authentication Architecture

### Core Components
1. **Client-Side**: Key generation and proof creation
2. **Server-Side**: Proof verification and JWT token issuance
3. **Database**: User storage with public key associations
4. **JWT Tokens**: Session management for authenticated requests

### Security Principles
- **Zero-Knowledge**: Private keys never leave the client
- **Cryptographic Proofs**: Mathematical verification of identity
- **Non-Interactive**: Fiat-Shamir heuristic eliminates round trips
- **Replay Protection**: Timestamp-based message binding

---

## 👤 New User Registration Flow

### Step 1: Key Pair Generation
**Client generates a cryptographically secure key pair**

```bash
POST /api/auth/utils/generate-keypair
Content-Type: application/json

{
  "username": "alice"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "private_key": "0x1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f809",
    "public_key": "046af0d5b44267896e4e2774b66a0ee8789d815c6a3344595eecee28db38ba0cd...",
    "warning": "Keep the private key secret! This is for testing only."
  }
}
```

⚠️ **Production Note**: Key generation should happen on the client side for security.

### Step 2: Create Registration Proof
**Client creates a ZKP proof for registration**

```bash
POST /api/auth/utils/generate-proof
Content-Type: application/json

{
  "private_key": "0x1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f809",
  "username": "alice",
  "timestamp": 1640995200
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "zkp_proof": {
      "commitment_x": "0xda248315dda9059f00a39668ef4d6c4250f42762d128e83dd3d008a2c56f262a",
      "commitment_y": "0x21e6171131e48717456a7a6be397a700dd023d8c265833b98b7173f80ec377",
      "response": "0x75e71d5793a45684c326caf0a1b2f9c4270fa17bf4d77e18c36f73ace1d13e21",
      "challenge": "0x9064053066da4977fbea6a7e18f630ee2c18f562eb7454b07ac19bc72c0a50fe",
      "message": "ZKP_AUTH:alice:1640995200"
    },
    "public_key": "046af0d5b44267896e4e2774b66a0ee8789d815c6a3344595eecee28db38ba0cd..."
  }
}
```

### Step 3: User Registration
**Register user with public key and ZKP proof**

```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "alice",
  "email": "alice@example.com",
  "public_key": "046af0d5b44267896e4e2774b66a0ee8789d815c6a3344595eecee28db38ba0cd...",
  "zkp_proof": {
    "commitment_x": "0xda248315dda9059f00a39668ef4d6c4250f42762d128e83dd3d008a2c56f262a",
    "commitment_y": "0x21e6171131e48717456a7a6be397a700dd023d8c265833b98b7173f80ec377",
    "response": "0x75e71d5793a45684c326caf0a1b2f9c4270fa17bf4d77e18c36f73ace1d13e21",
    "challenge": "0x9064053066da4977fbea6a7e18f630ee2c18f630ee2c18f562eb7454b07ac19bc72c0a50fe",
    "message": "ZKP_AUTH:alice:1640995200"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user_id": "1b78201d-e960-46da-bdcd-7d0405d5e30e",
    "username": "alice",
    "email": "alice@example.com",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

### Registration Flow Diagram
```
[Client]                    [Server]                    [Database]
    |                          |                            |
    |-- Generate Key Pair ------|                            |
    |<-- Private/Public Key ----|                            |
    |                          |                            |
    |-- Create ZKP Proof ------|                            |
    |<-- Proof Data ------------|                            |
    |                          |                            |
    |-- Register Request ------>|                            |
    |                          |-- Verify ZKP Proof --------|
    |                          |<-- Verification Result ----|
    |                          |-- Store User/Public Key -->|
    |                          |<-- User Created ------------|
    |<-- Registration Success--|                            |
```

---

## 🔑 Existing User Login Flow

### Step 1: Generate Login Proof
**Client creates a fresh ZKP proof for authentication**

```bash
POST /api/auth/utils/generate-proof
Content-Type: application/json

{
  "private_key": "0x1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f809",
  "username": "alice",
  "timestamp": 1640995300
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "zkp_proof": {
      "commitment_x": "0x954bc8fc3c5ea8dc9731b2b9d0823f8c5b4a0e1c9f8d7e6b3a5c2e9f1d4a7b8",
      "commitment_y": "0x5f097cd2a38b4c7e9f6d5a2b8e1c4f7a9e3d6c5b8a7f2e9c1d4a7b0f5e8c1d6",
      "response": "0x67e80c0a4f9b2e8d1c6a3f5b7e9c2d8a1f4b6e8c0d9a2f5e7c8b1d4a6f9e2c",
      "challenge": "0xb15a038f6c2e9d8a4f7b1e5c9a2d6f8b3e0c7a9f2d5e8c1b4a7f0e3d6c9b2a",
      "message": "ZKP_AUTH:alice:1640995300"
    }
  }
}
```

### Step 2: Authentication Request
**Login with username/email and ZKP proof**

```bash
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "alice",
  "zkp_proof": {
    "commitment_x": "0x954bc8fc3c5ea8dc9731b2b9d0823f8c5b4a0e1c9f8d7e6b3a5c2e9f1d4a7b8",
    "commitment_y": "0x5f097cd2a38b4c7e9f6d5a2b8e1c4f7a9e3d6c5b8a7f2e9c1d4a7b0f5e8c1d6",
    "response": "0x67e80c0a4f9b2e8d1c6a3f5b7e9c2d8a1f4b6e8c0d9a2f5e7c8b1d4a6f9e2c",
    "challenge": "0xb15a038f6c2e9d8a4f7b1e5c9a2d6f8b3e0c7a9f2d5e8c1b4a7f0e3d6c9b2a",
    "message": "ZKP_AUTH:alice:1640995300"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxYjc4MjAxZC1lOTYw...",
    "token_type": "Bearer",
    "expires_in": 1800,
    "user": {
      "user_id": "1b78201d-e960-46da-bdcd-7d0405d5e30e",
      "username": "alice",
      "email": "alice@example.com"
    }
  }
}
```

### Step 3: Using Authenticated Endpoints
**Access protected resources with JWT token**

```bash
GET /api/auth/verify
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxYjc4MjAxZC1lOTYw...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user_id": "1b78201d-e960-46da-bdcd-7d0405d5e30e",
    "username": "alice",
    "email": "alice@example.com",
    "is_active": true,
    "is_verified": false
  }
}
```

### Login Flow Diagram
```
[Client]                    [Server]                    [Database]
    |                          |                            |
    |-- Create Fresh Proof --->|                            |
    |<-- Proof Data ------------|                            |
    |                          |                            |
    |-- Login Request --------->|                            |
    |                          |-- Find User by ID -------->|
    |                          |<-- User & Public Key ------|
    |                          |-- Verify ZKP Proof --------|
    |                          |<-- Verification Success ----|
    |                          |-- Generate JWT Token ------|
    |<-- JWT + User Info ------|                            |
    |                          |                            |
    |-- Protected Request ----->|                            |
    |   (with JWT Bearer)      |-- Verify JWT Token --------|
    |                          |<-- Token Valid -------------|
    |<-- Protected Resource ---|                            |
```

---

## 🔧 Technical Implementation Details

### ZKP Proof Structure (Schnorr Format)
```json
{
  "commitment_x": "0x...",  // R.x() - X coordinate of commitment point
  "commitment_y": "0x...",  // R.y() - Y coordinate of commitment point  
  "response": "0x...",      // s - Response value (r + c*x mod n)
  "challenge": "0x...",     // c - Challenge value (Fiat-Shamir)
  "message": "ZKP_AUTH:username:timestamp"
}
```

### Authentication Message Format
```
ZKP_AUTH:{username}:{unix_timestamp}
```

Examples:
- `ZKP_AUTH:alice:1640995200`
- `ZKP_AUTH:bob:1640995300`

### Public Key Format
- **Format**: Uncompressed SECP256k1 point
- **Structure**: `04` + 64 hex chars (x) + 64 hex chars (y)
- **Length**: 130 characters total
- **Example**: `046af0d5b44267896e4e2774b66a0ee8789d815c6a3344595eecee28db38ba0cd1ebaeef0490512d9a5bf6d8269126fcaca2eedfcd4dad467c219f32524f57851b`

### JWT Token Structure
```json
{
  "sub": "1b78201d-e960-46da-bdcd-7d0405d5e30e", // User ID
  "username": "alice",                           // Username
  "exp": 1640997000,                            // Expiration timestamp
  "iat": 1640995200                             // Issued at timestamp
}
```

---

## 🔄 Complete Authentication Workflow

### Registration Workflow
1. **Key Generation**: Client generates SECP256k1 key pair
2. **Proof Creation**: Client creates Schnorr proof with timestamp
3. **Validation**: Server validates proof against provided public key
4. **Storage**: Server stores user data with public key
5. **Confirmation**: Registration success response

### Login Workflow
1. **Proof Generation**: Client creates fresh Schnorr proof
2. **User Lookup**: Server finds user by username/email
3. **Proof Verification**: Server validates proof against stored public key
4. **Token Issuance**: Server generates JWT token
5. **Session Start**: Client receives token for authenticated requests

### Authenticated Request Workflow
1. **Token Inclusion**: Client includes JWT in Authorization header
2. **Token Validation**: Server verifies JWT signature and expiration
3. **User Resolution**: Server resolves user from token payload
4. **Request Processing**: Server processes protected resource request
5. **Response**: Server returns requested data

---

## 🛡️ Security Considerations

### Cryptographic Security
- **Elliptic Curve**: SECP256k1 (256-bit security)
- **Random Generation**: Cryptographically secure randomness
- **Discrete Logarithm**: Security based on ECDLP hardness
- **Non-Malleability**: Proofs cannot be modified without detection

### Replay Attack Prevention
- **Timestamp Binding**: Each proof includes current timestamp
- **Message Uniqueness**: Authentication messages are unique per request
- **Nonce Usage**: Random nonce prevents proof reuse
- **Challenge Binding**: Fiat-Shamir challenge ties proof to specific context

### Token Security
- **JWT Signing**: HMAC-SHA256 with secret key
- **Expiration**: 30-minute token lifetime
- **Secure Headers**: Proper JWT headers and claims
- **Stateless Design**: No server-side session storage required

---

## 🚨 Error Handling

### Common Error Scenarios

#### Invalid Proof Format
```json
{
  "success": false,
  "error": {
    "type": "ValidationError",
    "message": "Invalid ZKP proof format",
    "code": "VALIDATION_ERROR"
  }
}
```

#### ZKP Verification Failed
```json
{
  "success": false,
  "error": {
    "type": "ZKPVerificationFailed",
    "message": "Zero-knowledge proof verification failed",
    "code": "ZKP_VERIFICATION_FAILED"
  }
}
```

#### User Not Found
```json
{
  "success": false,
  "error": {
    "type": "UserNotFound",
    "message": "User with identifier 'alice' not found",
    "code": "USER_NOT_FOUND"
  }
}
```

#### Expired Token
```json
{
  "success": false,
  "error": {
    "type": "TokenExpired",
    "message": "JWT token has expired",
    "code": "TOKEN_EXPIRED"
  }
}
```

---

## 📊 API Endpoints Summary

### Authentication Endpoints
| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/auth/register` | User registration with ZKP | No |
| POST | `/api/auth/login` | User login with ZKP | No |
| GET | `/api/auth/verify` | Verify JWT token | Yes |
| POST | `/api/auth/logout` | Logout (client-side) | Yes |

### Utility Endpoints (Development)
| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/auth/utils/generate-keypair` | Generate key pair | No |
| POST | `/api/auth/utils/generate-proof` | Generate ZKP proof | No |
| POST | `/api/auth/utils/verify-proof` | Verify ZKP proof | No |

---

## 💻 Client Implementation Examples

### JavaScript Client
```javascript
class ZKPAuthClient {
  constructor(baseUrl = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('zkp_token');
  }
  
  async register(username, email) {
    // Generate keypair
    const keypair = await this.generateKeypair(username);
    
    // Generate proof
    const proof = await this.generateProof(keypair.private_key, username);
    
    // Register user
    const response = await fetch(`${this.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        email,
        public_key: keypair.public_key,
        zkp_proof: proof.zkp_proof
      })
    });
    
    return response.json();
  }
  
  async login(identifier, privateKey) {
    // Generate fresh proof
    const proof = await this.generateProof(privateKey, identifier);
    
    // Login
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier,
        zkp_proof: proof.zkp_proof
      })
    });
    
    const result = await response.json();
    if (result.success) {
      this.token = result.data.access_token;
      localStorage.setItem('zkp_token', this.token);
    }
    
    return result;
  }
  
  async makeAuthenticatedRequest(endpoint, options = {}) {
    return fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
  }
}
```

### Python Client
```python
import requests
import time
from typing import Dict, Any

class ZKPAuthClient:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.token = None
    
    def register(self, username: str, email: str) -> Dict[str, Any]:
        # Generate keypair
        keypair = self.generate_keypair(username)
        
        # Generate proof
        proof = self.generate_proof(keypair['private_key'], username)
        
        # Register user
        response = requests.post(
            f"{self.base_url}/api/auth/register",
            json={
                "username": username,
                "email": email,
                "public_key": keypair['public_key'],
                "zkp_proof": proof['zkp_proof']
            }
        )
        
        return response.json()
    
    def login(self, identifier: str, private_key: str) -> Dict[str, Any]:
        # Generate fresh proof
        proof = self.generate_proof(private_key, identifier)
        
        # Login
        response = requests.post(
            f"{self.base_url}/api/auth/login",
            json={
                "identifier": identifier,
                "zkp_proof": proof['zkp_proof']
            }
        )
        
        result = response.json()
        if result.get('success'):
            self.token = result['data']['access_token']
        
        return result
    
    def make_authenticated_request(self, endpoint: str, method: str = "GET", **kwargs) -> requests.Response:
        headers = kwargs.get('headers', {})
        headers['Authorization'] = f"Bearer {self.token}"
        kwargs['headers'] = headers
        
        return requests.request(method, f"{self.base_url}{endpoint}", **kwargs)
```

---

## 🎯 Best Practices

### For Developers
1. **Secure Key Storage**: Never log or expose private keys
2. **Fresh Proofs**: Generate new proof for each authentication
3. **Token Management**: Store JWT securely, implement refresh logic
4. **Error Handling**: Handle all authentication error cases gracefully
5. **HTTPS Only**: Never use ZKP authentication over HTTP

### For Production
1. **Client-Side Keys**: Generate keys entirely on client side
2. **Hardware Security**: Use hardware wallets for key storage
3. **Rate Limiting**: Implement proof generation rate limits
4. **Monitoring**: Log all authentication attempts
5. **Backup Keys**: Implement secure key recovery mechanisms

---

## 📋 Testing Checklist

### Registration Testing
- [ ] Valid key pair generation
- [ ] Valid proof creation
- [ ] Successful registration with correct data
- [ ] Duplicate username/email rejection
- [ ] Invalid public key format rejection
- [ ] Invalid proof format rejection

### Login Testing  
- [ ] Valid user login with correct proof
- [ ] Invalid proof rejection
- [ ] Non-existent user rejection
- [ ] JWT token generation and validation
- [ ] Token expiration handling
- [ ] Fresh proof requirement (no replay)

### Security Testing
- [ ] Proof replay attack prevention
- [ ] Invalid proof rejection
- [ ] Token tampering detection
- [ ] Expired token rejection
- [ ] Malformed request handling

---

This authentication system provides **cryptographically secure, passwordless authentication** using real Zero-Knowledge Proofs, suitable for production use with proper key management practices. 