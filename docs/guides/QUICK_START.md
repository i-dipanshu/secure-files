# Quick Start Guide

Get the ZKP File Sharing application up and running in minutes with Docker Compose.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)
- **4GB+ RAM** available
- **Ports available**: 3000, 8000, 5433, 6379, 9000, 9001

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd college-project
```

### 2. Start All Services

```bash
# Start all services in detached mode
docker-compose up -d

# View the startup logs
docker-compose logs -f
```

### 3. Verify Services

Check that all services are running:

```bash
# Check service status
docker-compose ps

# Expected output:
# NAME              COMMAND                  SERVICE             STATUS              PORTS
# zkp-backend       "uvicorn app.main:ap…"   backend             running             0.0.0.0:8000->8000/tcp
# zkp-frontend      "/docker-entrypoint.…"   frontend            running             0.0.0.0:3000->80/tcp
# zkp-minio         "/usr/bin/docker-ent…"   minio               running             0.0.0.0:9000-9001->9000-9001/tcp
# zkp-postgres      "docker-entrypoint.s…"   postgres            running             0.0.0.0:5433->5432/tcp
# zkp-redis         "docker-entrypoint.s…"   redis               running             0.0.0.0:6379->6379/tcp
```

### 4. Access the Application

Once all services are running, you can access:

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001
  - Username: `minio_admin`
  - Password: `minio_password123`

## First Time Setup

### 1. Register a New User

1. Open http://localhost:3000 in your browser
2. Click "Register" to create a new account
3. Fill in the registration form:
   - Username (3-50 characters)
   - Email address
   - The system will generate ZKP credentials automatically
4. Click "Register" to create your account

### 2. Login

1. Use your username/email and the generated ZKP proof to login
2. The system will authenticate you using Zero-Knowledge Proof
3. You'll receive a JWT token for subsequent requests

### 3. Upload Your First File

1. Once logged in, click "Upload File"
2. Select a file from your computer
3. Add an optional description
4. Click "Upload"
5. Your file will be securely stored in MinIO

### 4. Share a File

1. Find your uploaded file in the file list
2. Click the "Share" button
3. Enter the username/email of the person you want to share with
4. Select permissions (read/write)
5. Click "Share"

## Health Checks

Verify that all components are working correctly:

```bash
# Check backend health
curl http://localhost:8000/health

# Expected response:
# {
#   "status": "healthy",
#   "app": "ZKP File Sharing API",
#   "version": "0.1.0"
# }

# Check MinIO health
curl http://localhost:9000/minio/health/live

# Check frontend (should return HTML)
curl http://localhost:3000
```

## Service Details

### Backend (FastAPI)
- **Port**: 8000
- **Health Check**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs
- **Features**: ZKP authentication, file management, user management

### Frontend (React)
- **Port**: 3000
- **URL**: http://localhost:3000
- **Features**: User interface, file upload/download, sharing

### Database (PostgreSQL)
- **Port**: 5433 (external), 5432 (internal)
- **Database**: `zkp_file_sharing`
- **Username**: `zkp_user`
- **Password**: `zkp_password`

### Object Storage (MinIO)
- **API Port**: 9000
- **Console Port**: 9001
- **Access Key**: `minio_admin`
- **Secret Key**: `minio_password123`
- **Bucket**: `zkp-files`

### Cache (Redis)
- **Port**: 6379
- **Database**: 0
- **Usage**: Session management, caching

## Troubleshooting

### Common Issues

#### Port Conflicts
If you get port conflict errors:

```bash
# Check what's using the ports
lsof -i :3000
lsof -i :8000
lsof -i :9000

# Stop conflicting services or change ports in docker-compose.yml
```

#### Services Not Starting
If services fail to start:

```bash
# Check logs for specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
docker-compose logs minio
docker-compose logs redis

# Restart specific service
docker-compose restart backend
```

#### Database Connection Issues
If the backend can't connect to the database:

```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check if database is ready
docker-compose exec postgres pg_isready -U zkp_user
```

#### MinIO Connection Issues
If file operations fail:

```bash
# Check MinIO logs
docker-compose logs minio

# Verify MinIO is accessible
curl http://localhost:9000/minio/health/live

# Check bucket exists
docker-compose exec minio mc ls minio/zkp-files
```

### Reset Everything

If you need to start fresh:

```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: This deletes all data)
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Start fresh
docker-compose up -d
```

## Next Steps

Now that you have the application running:

1. **Explore the API**: Visit http://localhost:8000/docs to see all available endpoints
2. **Read the User Guide**: Check out [User Guide](USER_GUIDE.md) for detailed usage instructions
3. **Development**: See [Development Guide](../development/DEVELOPMENT_GUIDE.md) if you want to contribute
4. **Deployment**: Check [Deployment Guide](../deployment/DEPLOYMENT.md) for production setup

## Getting Help

If you encounter issues:

1. Check the [Troubleshooting Guide](../troubleshooting/QUICK_REFERENCE.md)
2. Review the logs: `docker-compose logs -f`
3. Create an issue on GitHub with:
   - Your operating system
   - Docker and Docker Compose versions
   - Error messages and logs
   - Steps to reproduce the issue

## Performance Tips

For better performance:

1. **Allocate more memory** to Docker (8GB recommended)
2. **Use SSD storage** for better I/O performance
3. **Close unnecessary applications** to free up resources
4. **Monitor resource usage**: `docker stats`

Congratulations! You now have a fully functional ZKP File Sharing application running locally. 