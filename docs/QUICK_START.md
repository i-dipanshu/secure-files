# SecureFiles - Quick Start Guide

Get up and running with SecureFiles in under 5 minutes! This guide covers the essential steps to deploy and use the Zero-Knowledge Proof file sharing platform.

## 🚀 For Users

### **1. Access the Application**
Open your web browser and navigate to the SecureFiles application URL.

### **2. Create Your Account** 
1. Click **"Register"** on the landing page
2. Enter your **username** and **email**
3. Click **"Generate Keys"** to create your cryptographic key pair
4. **⚠️ IMPORTANT**: Save your private key immediately!
   - Click **"Download Key Backup"** to save a JSON file
   - Copy and store your private key in a secure location
5. Click **"Create Account"** to complete registration

### **3. Login with Zero-Knowledge Proof**
1. Click **"Login"** on the landing page
2. Enter your private key or import your key file
3. Click **"Login with ZKP"** - no password required!

### **4. Start Using SecureFiles**
- **📊 Dashboard**: View your file statistics and recent activity
- **📁 File Manager**: Upload and manage your files with modern drag-and-drop interface
- **🔗 File Sharing**: Share files securely with other users
- **🔑 Key Manager**: Manage your cryptographic keys
- **👤 Profile**: Edit your account information

---

## 🛠️ For Developers

### **Prerequisites**
- Node.js 18+ and npm
- Python 3.11+ and Poetry  
- PostgreSQL 15+
- Git

### **Quick Setup**

```bash
# 1. Clone the repository
git clone <repository-url>
cd college-project

# 2. Backend Setup
poetry install
cp .env.example .env
# Edit .env with your database credentials

# 3. Database Setup
poetry run alembic upgrade head

# 4. Start Backend
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 5. Frontend Setup (new terminal)
cd UI/zkp-frontend
npm install
npm start
```

### **Verify Installation**
- **Backend API**: http://localhost:8000/docs
- **Frontend App**: http://localhost:3000
- **Database**: Check PostgreSQL connection
- **Test Registration**: Create a test user account

---

## 🔐 Security Essentials

### **For Users**
- **Save Your Keys**: Your private key is your only way to access your account
- **No Passwords**: SecureFiles uses Zero-Knowledge Proofs instead of passwords
- **Local Storage**: Your private key never leaves your device
- **Backup Important**: Download and securely store your key backup file

### **For Developers**
- **Environment Variables**: Configure `.env` with secure database credentials
- **HTTPS Required**: Use SSL certificates in production
- **Key Generation**: All cryptographic operations happen client-side
- **Session Management**: JWT tokens expire automatically for security

---

## 📁 File Operations

### **Upload Files**
1. Go to **File Manager** in the sidebar
2. Click **"Upload File"** 
3. Use the modern drag-and-drop interface:
   - Drag files into the upload zone OR click to browse
   - Add display name, description, and tags
   - Click **"Upload File"** to complete

### **Share Files**
1. Click **"Share"** on any file
2. Enter recipient usernames or emails (comma-separated)
3. Set expiration time (days)
4. Click **"Share with Users"**

### **Manage Files**
- **View**: Preview files in browser
- **Download**: Save files to your device  
- **Edit**: Update file metadata
- **Delete**: Remove files (revokes all shares)

---

## 🎨 Modern UI Features

### **Sidebar Navigation**
- **SecureFiles Logo**: Click to return to dashboard
- **Security Chips**: Green "ZKP Secured" and blue "256-bit Encrypted" indicators
- **Navigation Menu**: Dashboard, File Manager, File Sharing, Key Manager
- **User Profile**: Click to edit profile, shows unique emoji avatar
- **Sign Out**: Secure logout button

### **Dashboard Analytics**
- **Welcome Message**: Personalized "Hello, {username}!" greeting
- **Statistics Cards**: 
  - 📁 Total Files (clickable)
  - 💾 Storage Used with progress bar
  - 📤 Shared by Me (orange theme)
  - 📥 Shared with Me (blue theme)  
  - 📅 This Week activity (pink theme)
- **Recent Activity**: Real-time feed of uploads, shares, downloads
- **Quick Actions**: Upload Files, Share Files, Manage Keys, Edit Profile

### **Enhanced File Upload**
- **Visual Drag-and-Drop**: Large interactive zone with color feedback
- **File Preview**: Shows selected file name and size
- **Modern Forms**: Enhanced text fields with subtle backgrounds
- **Progress Feedback**: Visual upload progress and completion status

---

## 🔧 Troubleshooting

### **Common Issues**

#### **Can't Login**
- Verify you're using the correct private key
- Check that your key starts with `0x` and has 64 hex characters
- Try importing from your backup JSON file

#### **File Upload Fails**  
- Check file size (100MB maximum)
- Ensure stable internet connection
- Verify available storage space

#### **Keys Not Working**
- Ensure keys were generated and saved properly
- Check browser compatibility (modern browsers required)
- Try refreshing the page and re-entering your key

#### **Sharing Issues**
- Confirm recipient usernames/emails are correct
- Verify recipients have SecureFiles accounts
- Check sharing expiration settings

### **Getting Help**
- **Interactive Tooltips**: Click security chips for detailed explanations
- **User Guide**: See [docs/USER_GUIDE.md](USER_GUIDE.md) for comprehensive documentation
- **API Docs**: Check [docs/API_DOCUMENTATION.md](API_DOCUMENTATION.md) for technical details

---

## 🎯 Next Steps

### **For Users**
1. **Explore Features**: Try uploading and sharing files
2. **Secure Your Keys**: Set up proper key backup procedures
3. **Customize Profile**: Add your personal information
4. **Share Securely**: Invite colleagues to try SecureFiles

### **For Developers**
1. **Read Documentation**: Check [docs/](.) directory for detailed guides
2. **API Integration**: Explore [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
3. **UI Customization**: See [UI_DOCUMENTATION.md](UI_DOCUMENTATION.md)
4. **Security Review**: Study [ZKP_IMPLEMENTATION.md](ZKP_IMPLEMENTATION.md)

---

## 📚 Additional Resources

- **[Complete User Guide](USER_GUIDE.md)** - Comprehensive user documentation
- **[API Documentation](API_DOCUMENTATION.md)** - Full API reference
- **[UI Documentation](UI_DOCUMENTATION.md)** - Frontend development guide
- **[Authentication Flow](AUTHENTICATION_FLOW.md)** - ZKP authentication details
- **[Project Status](PROJECT_STATUS.md)** - Current development status

**SecureFiles** - Secure file sharing, powered by Zero-Knowledge Proofs. 🔐✨

**Ready to get started?** Follow the setup steps above and you'll be sharing files securely in minutes! 