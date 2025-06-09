# SecureFiles - Zero Knowledge Proof File Sharing Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.0-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100-green.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://postgresql.org/)

**SecureFiles** is a modern, secure file sharing platform that uses **Zero-Knowledge Proof (ZKP) authentication** instead of traditional passwords. Built with React and FastAPI, it provides military-grade security for file sharing while maintaining a beautiful, intuitive user interface.

## 🌟 Key Features

- **🔐 Passwordless Authentication**: Zero-Knowledge Proof using SECP256k1 cryptography
- **📁 Secure File Sharing**: Upload, manage, and share files with granular permissions
- **🎨 Modern UI**: Beautiful, responsive interface with gradient themes and animations
- **🔒 End-to-End Security**: Files secured with cryptographic signatures
- **⚡ Real-time Updates**: Live activity feeds and storage monitoring
- **🌐 Cross-Platform**: Works on all modern web browsers
- **🛡️ Privacy-First**: Private keys never leave your device

## 🚀 Quick Start

### For Users
1. **Get Started**: Visit the application URL
2. **Register**: Create account with ZKP authentication
3. **Upload**: Share files securely with advanced encryption
4. **Collaborate**: Share files with time-limited access controls

### For Developers
```bash
# Clone the repository
git clone <repository-url>
cd college-project

# Start the backend
poetry install
poetry run uvicorn app.main:app --reload

# Start the frontend
cd UI/zkp-frontend
npm install
npm start
```

## 📚 Documentation Index

### 🎯 Getting Started
- **[Quick Start Guide](docs/QUICK_START.md)** - Get up and running in 5 minutes
- **[User Guide](docs/USER_GUIDE.md)** - Comprehensive user documentation
- **[Quick Reference](docs/QUICK_REFERENCE.md)** - Essential commands and features

### 🔧 Technical Documentation
- **[API Documentation](docs/API_DOCUMENTATION.md)** - Complete API reference
- **[API Contract](docs/API_CONTRACT.md)** - API endpoints and schemas
- **[Authentication Flow](docs/AUTHENTICATION_FLOW.md)** - ZKP authentication details
- **[ZKP Implementation](docs/ZKP_IMPLEMENTATION.md)** - Cryptographic implementation

### 🎨 UI & Frontend
- **[UI Documentation](docs/UI_DOCUMENTATION.md)** - Frontend architecture and components
- **[Component Guide](UI/zkp-frontend/README.md)** - React component documentation

### 📊 Project Management
- **[Project Status](docs/PROJECT_STATUS.md)** - Current development status
- **[Bug Fixes Complete](docs/BUG_FIXES_COMPLETE.md)** - Resolved issues log
- **[Sharing Fixes Summary](docs/SHARING_FIXES_SUMMARY.md)** - File sharing improvements
- **[Final Status Report](docs/FINAL_STATUS_REPORT.md)** - Complete project overview
- **[TODO](docs/TODO.md)** - Future enhancements and roadmap

## 🏗️ Architecture Overview

### Frontend (React)
- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI v5 with custom theming
- **State Management**: React Context API
- **Routing**: React Router v6
- **Styling**: Modern gradients, animations, and responsive design

### Backend (FastAPI)
- **Framework**: FastAPI with Python 3.11
- **Database**: PostgreSQL with Alembic migrations
- **Authentication**: Custom ZKP implementation with SECP256k1
- **File Storage**: Secure file handling with metadata management
- **API**: RESTful endpoints with automatic documentation

### Security
- **Zero-Knowledge Proofs**: Schnorr signatures on SECP256k1 curve
- **256-bit Encryption**: Military-grade cryptographic security
- **Private Key Management**: Browser-based local storage
- **Session Management**: JWT tokens with secure expiration
- **File Protection**: Cryptographic file signatures

## 🎨 Modern UI Features

### Design System
- **Gradient Themes**: Professional color schemes throughout
- **Interactive Elements**: Hover effects and smooth transitions
- **Responsive Layout**: Mobile-first design approach
- **Accessibility**: WCAG 2.1 compliance and keyboard navigation

### User Experience
- **Sidebar Navigation**: Persistent navigation with user profile
- **Dashboard Analytics**: Real-time statistics and activity feeds
- **File Management**: Drag-and-drop uploads with visual feedback
- **Security Indicators**: Clear visual security status displays

### Component Highlights
- **Smart Upload Interface**: Modern drag-and-drop with progress tracking
- **Interactive Security Chips**: Clickable help tooltips
- **Animated Dashboards**: Smooth transitions and loading states
- **Profile Management**: Avatar generation and settings panel

## 🔐 Security Features

### Authentication
- **Zero-Knowledge Proofs**: Prove identity without revealing secrets
- **SECP256k1 Curve**: Same cryptography used by Bitcoin
- **Local Key Storage**: Private keys never transmitted
- **Session Security**: Time-limited access tokens

### File Protection
- **Cryptographic Signatures**: Each file signed with user's key
- **Access Control**: Granular sharing permissions
- **Time-Limited Shares**: Expiring access links
- **Delete Protection**: Secure file removal with sharing revocation

### Privacy
- **No Password Storage**: Eliminate password-related vulnerabilities
- **Device-Local Keys**: Keys generated and stored locally
- **Zero Server Knowledge**: Server cannot access private keys
- **Audit Trail**: Complete activity logging for security

## 🛠️ Development Setup

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.11+ and Poetry
- **PostgreSQL** 15+
- **Git** for version control

### Backend Setup
```bash
# Install dependencies
poetry install

# Set up database
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
poetry run alembic upgrade head

# Start development server
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd UI/zkp-frontend

# Install dependencies
npm install

# Start development server
npm start
```

### Testing
```bash
# Run backend tests
poetry run pytest

# Run frontend tests
cd UI/zkp-frontend
npm test
```

## 📦 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Production Environment
- Configure environment variables in `.env`
- Set up PostgreSQL database
- Configure reverse proxy (nginx/Apache)
- Enable HTTPS/SSL certificates
- Set up backup procedures

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](docs/CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update documentation
5. Submit a pull request

### Code Standards
- **Frontend**: ESLint + Prettier for React/TypeScript
- **Backend**: Black + isort for Python formatting
- **Documentation**: Markdown with consistent formatting
- **Testing**: Unit tests required for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Help

### Documentation
- **[User Guide](docs/USER_GUIDE.md)** - Complete user documentation
- **[API Docs](docs/API_DOCUMENTATION.md)** - Developer API reference
- **[Quick Reference](docs/QUICK_REFERENCE.md)** - Command cheat sheet

### Troubleshooting
- **Authentication Issues**: Check [Authentication Flow](docs/AUTHENTICATION_FLOW.md)
- **File Upload Problems**: See [User Guide](docs/USER_GUIDE.md#file-management)
- **API Integration**: Review [API Documentation](docs/API_DOCUMENTATION.md)

### Common Issues
- **Key Management**: [ZKP Implementation Guide](docs/ZKP_IMPLEMENTATION.md)
- **Browser Compatibility**: [UI Documentation](docs/UI_DOCUMENTATION.md)
- **Database Setup**: [Quick Start Guide](docs/QUICK_START.md)

## 🎯 Project Status

✅ **Completed Features**
- Zero-Knowledge Proof authentication system
- Modern React UI with Material-UI theming
- File upload/download/sharing functionality
- Real-time dashboard with statistics
- Profile management and key handling
- Comprehensive security implementation

🚧 **Current Focus**
- Performance optimization
- Additional file format support
- Enhanced sharing controls
- Mobile app development

📅 **Roadmap**
- See [TODO.md](docs/TODO.md) for detailed future plans
- [Project Status](docs/PROJECT_STATUS.md) for current development state

---

## 📞 Contact

For questions, suggestions, or support:
- **Documentation**: Check the [docs/](docs/) directory
- **Issues**: Use GitHub issues for bug reports
- **Discussions**: Start a GitHub discussion for questions

**SecureFiles** - Secure file sharing, powered by Zero-Knowledge Proofs. 🔐✨ 