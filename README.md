# ZKP File Sharing Application

A secure file-sharing application using Zero-Knowledge Proof (ZKP) authentication for enhanced privacy and security.

## 🚀 Features

- **Zero-Knowledge Proof Authentication**: No password storage, cryptographically secure login
- **Secure File Storage**: Encrypted file storage with MinIO object storage
- **File Sharing**: Share files with other users with granular permissions
- **Modern UI**: Responsive React frontend with TypeScript
- **RESTful API**: FastAPI backend with comprehensive documentation
- **Docker Deployment**: Complete containerized setup for easy deployment

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Documentation](#documentation)
- [Development](#development)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [Support](#support)

## ⚡ Quick Start

### Prerequisites

- Docker (version 20.10+)
- Docker Compose (version 2.0+)
- 4GB+ RAM
- Ports 3000, 8000, 5433, 6379, 9000, 9001 available

### Launch Application

```bash
# Clone the repository
git clone git@github.com:i-dipanshu/secure-files.git
cd secure-files

# Start database and other infrastructure services first
docker-compose up -d postgres minio redis

# Wait for database to be ready (about 10-15 seconds)
sleep 15

# Run database migrations
alembic upgrade head

# Start all remaining services
docker-compose up -d

# Check service status
docker-compose ps

# Update /etc/hosts to proxy minio hostname to localhost
echo "127.0.0.1 minio" | sudo tee -a /etc/hosts

```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001 (admin/minio_password123)

### First Steps

1. Open the frontend at http://localhost:3000
2. Register a new account using the ZKP authentication
3. Upload and share files securely
4. Explore the API documentation at http://localhost:8000/docs

## 🗄️ Database Setup & Migrations

### Initial Setup (Required)

The application uses Alembic for database migrations. **You must run migrations before starting the application for the first time.**

#### Option 1: Automatic Setup (Recommended)
Follow the [Launch Application](#launch-application) steps above, which include migration commands.

#### Option 2: Manual Setup
```bash
# 1. Start only the database service
docker-compose up -d postgres

# 2. Wait for PostgreSQL to be ready
sleep 15

# 3. Install Python dependencies (if not using Docker)
pip install -r requirements.txt

# 4. Run database migrations
alembic upgrade head

# 5. Start remaining services
docker-compose up -d
```

### Migration Commands

```bash
# Check current migration status
alembic current

# View migration history
alembic history

# Apply all pending migrations
alembic upgrade head

# Create new migration (after model changes)
alembic revision --autogenerate -m "Description of changes"

# Rollback one migration
alembic downgrade -1
```

### Migration Files Location
- **Migration files**: `alembic/versions/`
- **Current migrations**:
  - `fd685cef1454` - Initial users table
  - `8f38843332af` - File and permission models

### Troubleshooting Migrations

**Database connection error:**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres
```

**Migration conflicts:**
```bash
# Reset to base and reapply
alembic downgrade base
alembic upgrade head
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  FastAPI Backend│    │  PostgreSQL DB  │
│     (Port 3000) ├────┤    (Port 8000)  ├────┤   (Port 5433)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        
                              │                ┌─────────────────┐
                              ├────────────────┤   MinIO Storage │
                              │                │   (Port 9000)   │
                              │                └─────────────────┘
                              │                        
                              │                ┌─────────────────┐
                              └────────────────┤   Redis Cache   │
                                               │   (Port 6379)   │
                                               └─────────────────┘
```

### Technology Stack

**Backend:**
- FastAPI (Python 3.11+)
- PostgreSQL with AsyncPG
- MinIO object storage
- Redis for caching (will be used in future development)
- JWT authentication
- Zero-Knowledge Proof verification

**Frontend:**
- React 18 with TypeScript
- Modern UI components
- Responsive design
- File upload/download
- Real-time updates

**Infrastructure:**
- Docker & Docker Compose
- nginx (production)
- Automated database migrations
- Health checks and monitoring

## 📚 Documentation

Our documentation is organized into several categories:

### 🚀 Quick Start & Guides
- **[Quick Start Guide](docs/guides/QUICK_START.md)** - Get up and running in minutes
- **[User Guide](docs/guides/USER_GUIDE.md)** - Complete user manual
- **[UI Documentation](docs/guides/UI_DOCUMENTATION.md)** - Frontend usage guide

### 🔧 Development
- **[Development Guide](docs/development/DEVELOPMENT_GUIDE.md)** - Setup and development workflow
- **[Project Status](docs/development/PROJECT_STATUS.md)** - Current project status
- **[Project Achievements](docs/PROJECT_ACHIEVEMENTS.md)** - Complete project results and accomplishments
- **[TODO](docs/development/TODO.md)** - Upcoming features and improvements

### 🏗️ Architecture & Implementation
- **[Authentication Flow](docs/architecture/AUTHENTICATION_FLOW.md)** - ZKP authentication system
- **[ZKP Implementation](docs/architecture/ZKP_IMPLEMENTATION.md)** - Zero-Knowledge Proof details
- **[ZKP Comparison Analysis](docs/architecture/ZKP_COMPARISON_ANALYSIS.md)** - Comparison with other ZKP methods and research
- **[Application Flow](docs/architecture/APPLICATION_FLOW.md)** - Complete user journey and system flow diagrams

### 🚀 Deployment
- **[Deployment Guide](docs/deployment/DEPLOYMENT.md)** - Production deployment instructions
- Docker configuration and scaling
- Environment setup and security

### 🔧 Troubleshooting
- **[Bug Fixes](docs/troubleshooting/BUG_FIXES_COMPLETE.md)** - Known issues and solutions
- **[Quick Reference](docs/troubleshooting/QUICK_REFERENCE.md)** - Common commands and fixes
- **[Sharing Fixes](docs/troubleshooting/SHARING_FIXES_SUMMARY.md)** - File sharing troubleshooting


## 🚀 Deployment


### Environment Variables

Key configuration options:

```env
DATABASE_URL=postgresql+asyncpg://user:pass@host:port/db
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=password
JWT_SECRET_KEY=your-secret-key
CORS_ORIGINS=["http://localhost:3000"]
```

**📖 See [Deployment Guide](docs/deployment/DEPLOYMENT.md) for complete instructions**

### Development Setup

When developing locally or contributing to the project:

```bash
# 1. Clone and setup
git clone git@github.com:i-dipanshu/secure-files.git
cd secure-files

# 2. Install dependencies
pip install -r requirements.txt

# 3. Setup environment variables
cp .env.example .env  # Edit as needed

# 4. Start database
docker-compose up -d postgres

# 5. Run migrations (IMPORTANT)
alembic upgrade head

# 6. Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**⚠️ Important**: Always run `alembic upgrade head` after:
- Cloning the repository
- Pulling changes that include new migrations
- Before starting the application

## 📖 API Reference

### Authentication Endpoints

```bash
POST /api/auth/register     # Register new user
POST /api/auth/login        # User login
GET  /api/auth/verify       # Verify token
POST /api/auth/logout       # User logout
```

### File Management Endpoints

```bash
POST   /api/files/upload              # Upload file
GET    /api/files/                    # List user files
GET    /api/files/shared              # List shared files
GET    /api/files/{id}                # Get file details
PUT    /api/files/{id}                # Update file metadata
DELETE /api/files/{id}                # Delete file
GET    /api/files/{id}/download       # Download file
POST   /api/files/{id}/share          # Share file
DELETE /api/files/{id}/share/{user}   # Remove file share
```

### Interactive Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

**📖 See [API Documentation](docs/api/API_DOCUMENTATION.md) for complete reference**

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Follow the established code style
- Write tests for new features
- Update documentation
- Ensure all tests pass
- Keep commits focused and atomic

**📖 See [Development Guide](docs/development/DEVELOPMENT_GUIDE.md) for detailed contribution guidelines**

## 🔒 Security

This application implements several security measures:

- **Zero-Knowledge Proof Authentication**: No password storage
- **JWT Token Security**: Secure token-based authentication
- **File Access Control**: Granular permissions for file sharing
- **Input Validation**: Comprehensive validation of all inputs
- **CORS Protection**: Configurable cross-origin resource sharing
- **Container Security**: Isolated container deployment

For security concerns, please create an issue or contact the maintainers.

## 📊 Project Status

### Current Version: 0.1.0

**✅ Completed Features:**
- ZKP authentication system
- File upload/download functionality
- File sharing between users
- Docker containerization
- API documentation
- Frontend UI

**🚧 In Progress:**
- Enhanced security features
- Performance optimizations
- Additional file formats support

**📋 Planned:**
- Mobile application
- Advanced sharing permissions
- File versioning
- Integration APIs

**📖 See [Project Status](docs/development/PROJECT_STATUS.md) for detailed information**

## 🆘 Support

### Getting Help

1. **📚 Documentation**: Check the relevant documentation section above
2. **🐛 Bug Reports**: Create an issue with detailed reproduction steps
3. **💡 Feature Requests**: Open an issue with your suggestion
4. **❓ Questions**: Use GitHub discussions for general questions

### Troubleshooting

Common issues and solutions:

- **Port conflicts**: Check if required ports are available
- **Docker issues**: Restart Docker services: `docker-compose restart`
- **Database connection**: Verify PostgreSQL container is running
- **File upload fails**: Check MinIO service status and credentials

**📖 See [Troubleshooting Guides](docs/troubleshooting/) for specific solutions**

### System Requirements

**Minimum:**
- 4GB RAM
- 2 CPU cores
- 10GB disk space
- Docker 20.10+

**Recommended:**
- 8GB RAM
- 4 CPU cores
- 20GB disk space
- SSD storage

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- FastAPI team for the excellent web framework
- React team for the robust frontend library
- MinIO team for secure object storage
- All contributors who helped build this project

---

**🚀 Ready to get started? Follow the [Quick Start](#quick-start) guide above!**

For detailed information on any aspect of the project, explore the comprehensive documentation in the `docs/` directory. 