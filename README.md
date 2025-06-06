# ZKP File Sharing API

A secure file-sharing application backend using Zero-Knowledge Proof (ZKP)-based authentication, built with FastAPI and Poetry.

## 🎯 Project Overview

### Aim
Develop a secure file-sharing application using Zero-Knowledge Proof (ZKP)-based authentication to enable users to upload, share, and download files without revealing their credentials, ensuring enhanced security and privacy.

### Problem Statement
Traditional file-sharing mechanisms rely on password-based authentication, which poses risks such as:
- Credential leaks
- Unauthorized access
- Data breaches

This project eliminates these vulnerabilities by using ZKP, allowing users to prove their identity without transmitting sensitive information.

## 🔧 Core Functionalities

### 1. User Authentication via ZKP
- Users register with a private key
- Generate Zero-Knowledge Proof for authentication
- No password transmission required

### 2. Secure File Upload
- Users request proof verification from backend
- Files securely uploaded to MinIO storage
- Access control enforced at upload time

### 3. File Sharing & Permissions
- File owners specify access permissions
- Permissions stored in PostgreSQL database
- Granular access control for authorized users

### 4. Secure File Download
- Users submit ZKP to verify access rights
- Backend generates presigned URLs for authorized downloads
- Time-limited secure access to files

## 🛠 Tech Stack

### Backend Framework
- **FastAPI** - Modern, fast web framework for building APIs
- **Poetry** - Dependency management and packaging tool

### Storage & Database
- **MinIO** - High-performance object storage for files
- **PostgreSQL** - Relational database for user data and permissions

### Security
- **Zero-Knowledge Proofs** - Cryptographic authentication
- **JWT Tokens** - Session management
- **Presigned URLs** - Secure file access

## 📁 Project Structure

```
zkp-file-sharing/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── files/
│   │   └── users/
│   ├── core/
│   ├── models/
│   ├── services/
│   └── utils/
├── tests/
├── docs/
├── pyproject.toml
├── README.md
├── TODO.md
└── API_CONTRACT.md
```

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Poetry
- PostgreSQL
- MinIO Server
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd zkp-file-sharing
   ```

2. **Install dependencies with Poetry**
   ```bash
   poetry install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start services (PostgreSQL & MinIO)**
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   poetry run alembic upgrade head
   ```

6. **Start the development server**
   ```bash
   poetry run uvicorn app.main:app --reload
   ```

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🔐 Security Features

- **Zero-Knowledge Authentication**: No passwords stored or transmitted
- **End-to-End Encryption**: Files encrypted before storage
- **Access Control**: Granular permission system
- **Audit Logging**: All file operations logged
- **Rate Limiting**: API protection against abuse

## 🧪 Testing

```bash
# Run all tests
poetry run pytest

# Run with coverage
poetry run pytest --cov=app

# Run specific test file
poetry run pytest tests/test_auth.py
```

## 📈 Development Status

This project is currently in the planning and development phase. Check `TODO.md` for detailed progress tracking.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For questions or support, please contact the development team or create an issue in the repository.

---

**Note**: This is a college project focused on demonstrating Zero-Knowledge Proof concepts in a practical file-sharing application. 