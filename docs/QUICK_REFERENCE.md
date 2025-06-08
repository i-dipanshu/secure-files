# ZKP File Sharing API - Quick Reference

## 🚀 Quick Start

### Base URL
```
http://localhost:8000
```

### Documentation
```
http://localhost:8000/docs
```

---

## 📋 Essential Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `GET` | `/health` | ❌ | Health check |
| `POST` | `/api/auth/register` | ❌ | Register new user |
| `POST` | `/api/auth/login` | ❌ | Login user |
| `GET` | `/api/auth/verify` | ✅ | Verify JWT token |
| `POST` | `/api/auth/logout` | ✅ | Logout user |

---

## 🔑 Authentication Flow

### 1. Register User
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

### 2. Login & Get Token
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

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 1800
  }
}
```

### 3. Use Token for Protected Endpoints
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET "http://localhost:8000/api/auth/verify" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🧪 Testing Commands

### Health Check
```bash
curl -X GET "http://localhost:8000/health"
```

### Register Multiple Test Users
```bash
# User 1
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser1",
    "email": "test1@example.com",
    "public_key": "04a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
    "zkp_proof": {"proof": ["0x123abc"], "public_signals": ["0x789def"]}
  }'

# User 2
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser2",
    "email": "test2@example.com",
    "public_key": "04b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    "zkp_proof": {"proof": ["0x456def"], "public_signals": ["0x123abc"]}
  }'
```

### Error Testing
```bash
# Test duplicate username
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser1",
    "email": "different@example.com",
    "public_key": "04xyz...",
    "zkp_proof": {"proof": ["0x999"], "public_signals": ["0x888"]}
  }'

# Test invalid email
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "invalid-email",
    "public_key": "04xyz...",
    "zkp_proof": {"proof": ["0x999"], "public_signals": ["0x888"]}
  }'

# Test invalid ZKP proof
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "testuser1",
    "zkp_proof": {"proof": [], "public_signals": []}
  }'
```

---

## 📝 Sample ZKP Proofs

### Valid ZKP Proof Examples
```json
{
  "proof": ["0x1a2b3c4d", "0x5e6f7890"],
  "public_signals": ["0xabcdef01", "0x23456789"]
}
```

```json
{
  "proof": ["0x987654321", "0x123456789", "0xabcdef000"],
  "public_signals": ["0x111222333", "0x444555666"]
}
```

### Invalid ZKP Proof Examples
```json
{
  "proof": [],
  "public_signals": []
}
```

```json
{
  "proof": ["0x123"],
  "public_signals": []
}
```

---

## 🔧 Environment Variables

Create `.env` file:
```env
DATABASE_URL=postgresql+asyncpg://zkp_user:zkp_password@localhost:5433/zkp_file_sharing
JWT_SECRET_KEY=your-super-secret-jwt-key-here
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=true
```

---

## 🐳 Docker Commands

### Start Services
```bash
docker-compose up -d
```

### Check Service Status
```bash
docker-compose ps
```

### View Logs
```bash
docker-compose logs -f api
```

### Stop Services
```bash
docker-compose down
```

---

## 🔍 Common Response Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| `200` | Success | Operation completed successfully |
| `201` | Created | User registered successfully |
| `401` | Unauthorized | Invalid token, ZKP verification failed |
| `404` | Not Found | User not found |
| `422` | Validation Error | Invalid email format, missing fields |
| `500` | Server Error | Database connection issues |

---

## 📚 Postman Variables

Set these in your Postman collection:

| Variable | Value |
|----------|-------|
| `baseUrl` | `http://localhost:8000` |
| `token` | `{{access_token_from_login}}` |
| `username` | `testuser` |
| `email` | `test@example.com` |

---

## 🚨 Troubleshooting

### Server Won't Start
```bash
# Check if port 8000 is in use
lsof -i :8000

# Kill existing process
pkill -f "python -m app.main"

# Restart services
poetry run python -m app.main
```

### Database Connection Issues
```bash
# Check PostgreSQL status
docker-compose ps postgres

# View database logs
docker-compose logs postgres

# Reset database
docker-compose down && docker-compose up -d postgres
```

### Token Issues
```bash
# Get new token
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier": "your_username", "zkp_proof": {...}}'

# Check token expiry
curl -X GET "http://localhost:8000/api/auth/verify" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

*Quick Reference for ZKP File Sharing API v0.1.0* 