# Deployment Guide

This guide covers various deployment scenarios for the ZKP File Sharing application.

## Table of Contents

- [Quick Deployment with Docker Compose](#quick-deployment-with-docker-compose)
- [Manual Deployment](#manual-deployment)
- [Production Deployment](#production-deployment)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

## Quick Deployment with Docker Compose

### Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- At least 4GB RAM available
- Ports 3000, 8000, 5433, 6379, 9000, 9001 available

### Steps

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd college-project
   ```

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Verify deployment:**
   ```bash
   # Check all services are running
   docker-compose ps
   
   # Check service health
   docker-compose logs backend
   docker-compose logs frontend
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - MinIO Console: http://localhost:9001 (admin/minio_password123)

### Service Overview

The deployment includes the following services:

- **PostgreSQL Database** (port 5433): User data and file metadata
- **MinIO Object Storage** (ports 9000/9001): File storage with web console
- **Redis Cache** (port 6379): Session management and caching
- **FastAPI Backend** (port 8000): API server with authentication
- **React Frontend** (port 3000): User interface
- **MinIO Setup**: Automated bucket initialization

## Manual Deployment

### Backend Deployment

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   ```bash
   export DATABASE_URL="postgresql+asyncpg://zkp_user:zkp_password@localhost:5433/zkp_file_sharing"
   export MINIO_ENDPOINT="localhost:9000"
   export MINIO_ACCESS_KEY="minio_admin"
   export MINIO_SECRET_KEY="minio_password123"
   export REDIS_URL="redis://localhost:6379/0"
   ```

3. **Run database migrations:**
   ```bash
   alembic upgrade head
   ```

4. **Start the backend:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend Deployment

1. **Install Node.js dependencies:**
   ```bash
   cd UI/zkp-frontend
   npm install
   ```

2. **Build the frontend:**
   ```bash
   npm run build
   ```

3. **Serve the build:**
   ```bash
   npm install -g serve
   serve -s build -l 3000
   ```

## Production Deployment

### Security Considerations

1. **Change default credentials:**
   - Database passwords
   - MinIO access keys
   - JWT secret keys
   - Redis password (if needed)

2. **Enable HTTPS:**
   - Use reverse proxy (nginx/traefik)
   - Obtain SSL certificates (Let's Encrypt)
   - Update CORS origins

3. **Environment-specific configuration:**
   ```bash
   # Production environment variables
   export DEBUG=false
   export JWT_SECRET_KEY="your-secure-random-secret-key"
   export CORS_ORIGINS='["https://yourdomain.com"]'
   export MINIO_SECURE=true
   ```

### Docker Production Setup

1. **Create production docker-compose.prod.yml:**
   ```yaml
   services:
     backend:
       environment:
         - DEBUG=false
         - JWT_SECRET_KEY=${JWT_SECRET_KEY}
         - DATABASE_URL=${DATABASE_URL}
       restart: always
     
     frontend:
       environment:
         - REACT_APP_API_URL=https://api.yourdomain.com
       restart: always
   ```

2. **Deploy with production config:**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

### Reverse Proxy Configuration (nginx)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Environment Variables

### Backend Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Local development URL | Yes |
| `MINIO_ENDPOINT` | MinIO server endpoint | localhost:9000 | Yes |
| `MINIO_ACCESS_KEY` | MinIO access key | minio_admin | Yes |
| `MINIO_SECRET_KEY` | MinIO secret key | minio_password123 | Yes |
| `MINIO_BUCKET_NAME` | Default bucket name | zkp-files | No |
| `MINIO_SECURE` | Use HTTPS for MinIO | false | No |
| `REDIS_URL` | Redis connection string | redis://localhost:6379/0 | Yes |
| `JWT_SECRET_KEY` | JWT signing key | Development key | Yes |
| `JWT_ALGORITHM` | JWT algorithm | HS256 | No |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration | 30 | No |
| `CORS_ORIGINS` | Allowed CORS origins | ["http://localhost:3000"] | No |
| `DEBUG` | Debug mode | false | No |
| `MAX_FILE_SIZE` | Maximum file size (bytes) | 104857600 (100MB) | No |

### Frontend Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | http://localhost:8000 |
| `REACT_APP_ENVIRONMENT` | Environment name | development |

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check port usage
   lsof -i :3000
   lsof -i :8000
   lsof -i :9000
   ```

2. **Database connection issues:**
   ```bash
   # Check PostgreSQL logs
   docker-compose logs postgres
   
   # Test connection
   docker-compose exec postgres psql -U zkp_user -d zkp_file_sharing
   ```

3. **MinIO connectivity issues:**
   ```bash
   # Check MinIO logs
   docker-compose logs minio
   
   # Test MinIO health
   curl http://localhost:9000/minio/health/live
   ```

4. **Frontend build issues:**
   ```bash
   # Clean build
   cd UI/zkp-frontend
   rm -rf node_modules build
   npm install
   npm run build
   ```

### Health Checks

```bash
# Check all service health
curl http://localhost:8000/health
curl http://localhost:3000/health
curl http://localhost:9000/minio/health/live

# Check container status
docker-compose ps
docker-compose top
```

### Logs and Monitoring

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f minio
docker-compose logs -f redis
```

## Backup and Recovery

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U zkp_user zkp_file_sharing > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U zkp_user zkp_file_sharing < backup.sql
```

### MinIO Data Backup

```bash
# Using MinIO client
docker run --rm \
  --network zkp-network \
  -v $(pwd)/backup:/backup \
  minio/mc:latest \
  cp --recursive minio/zkp-files /backup/
```

## Scaling Considerations

For high-traffic deployments:

1. **Database scaling:**
   - Use connection pooling
   - Consider read replicas
   - Implement proper indexing

2. **File storage scaling:**
   - Use MinIO distributed mode
   - Consider CDN for file delivery
   - Implement proper caching

3. **Application scaling:**
   - Use multiple backend instances
   - Implement load balancing
   - Use Redis for session sharing 