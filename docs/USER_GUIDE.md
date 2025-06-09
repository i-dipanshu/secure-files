# SecureFiles - User Guide

## 🚀 Welcome to SecureFiles

SecureFiles is a modern, secure file sharing platform that uses Zero-Knowledge Proof (ZKP) authentication for passwordless login. Instead of traditional passwords, you use cryptographic keys that prove your identity without revealing any secrets.

---

## 🎯 Quick Start

### **What You'll Need**
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- A secure place to store your private key

### **Accessing the Application**
1. Open your web browser
2. Navigate to the application URL
3. You'll see the modern landing page with **Register** or **Login** options

---

## 📝 Creating Your Account

### **Step 1: Registration Process**

1. **Click "Register"** on the landing page
2. **Enter Your Information**:
   - **Username**: Choose a unique username (3+ characters, letters/numbers/underscores only)
   - **Email**: Enter a valid email address for account recovery

3. **Generate Your Keys**:
   - Click **"Generate Keys"** - this creates your cryptographic key pair
   - Your keys are generated locally in your browser for maximum security
   - ⚠️ **Important**: This happens only once!

4. **Save Your Keys Securely**:
   - **Private Key**: This is your "password" - keep it secret!
   - **Public Key**: Safe to share, used for verification
   - **Download Backup**: Click "Download Key Backup" to save a JSON file
   - **Copy Keys**: Use the copy buttons to save keys elsewhere

5. **Create Account**:
   - Click **"Create Account"** to complete registration
   - Your account is now secured with Zero-Knowledge Proof authentication!

### **⚠️ Critical Security Step**
- **Save your private key immediately** - it cannot be recovered if lost
- **Store the backup file** in a secure location (password manager, encrypted drive)
- **Never share your private key** with anyone

---

## 🔐 Logging Into Your Account

### **Method 1: Using Stored Key (Easiest)**
1. Click **"Login"** on the landing page
2. If you previously saved your key, it will auto-fill
3. Click **"Login with ZKP"**
4. You're logged in instantly!

### **Method 2: Manual Key Entry**
1. Click **"Login"** on the landing page
2. **Enter your private key** in the text field
3. Use the eye icon to show/hide your key while typing
4. Click **"Login with ZKP"**

### **Method 3: Import Key File**
1. Click **"Login"** on the landing page
2. Click **"Import Key File"**
3. Select your downloaded backup JSON file
4. Your key will be loaded automatically
5. Click **"Login with ZKP"**

### **🔍 What Happens During Login**
- Your browser creates a cryptographic proof using your private key
- This proof is sent to the server (but never your private key!)
- The server verifies the proof against your stored public key
- If valid, you receive a secure session token

---

## 🏠 Using the Dashboard

Once logged in, you'll see the modern dashboard with a sleek sidebar navigation:

### **Sidebar Navigation**
- **SecureFiles Logo**: Click to return to dashboard
- **Security Indicators**: Green "ZKP Secured" and blue "256-bit Encrypted" chips
- **Navigation Menu**:
  - 📊 **Dashboard**: Overview & Stats
  - 📁 **File Manager**: Upload & Manage Files
  - 🔗 **File Sharing**: Share & Collaborate
  - 🔑 **Key Manager**: Cryptographic Keys
- **User Profile Card**: Click to edit your profile
- **Sign Out Button**: Securely log out

### **Dashboard Overview**
- **Welcome Message**: "Hello, {username}!" with personalized greeting
- **Statistics Cards**: 
  - 📁 **Total Files**: Your uploaded file count
  - 💾 **Storage Used**: Space consumption with progress bar
  - 📤 **Shared by Me**: Files you've shared (orange theme)
  - 📥 **Shared with Me**: Files shared with you (blue theme)
  - 📅 **This Week**: Recent activity (pink theme)

### **Storage Overview**
- **Visual Progress Bar**: Shows storage usage percentage
- **Available Space**: Remaining storage capacity
- **File Count**: Total number of uploaded files

### **Recent Activity Feed**
- **Real-time Updates**: Shows actual file uploads, shares, and downloads
- **File Details**: File names, sizes, types, and timestamps
- **Activity Types**: Upload, share, download events with appropriate icons

### **Quick Actions**
- **Upload Files**: Direct access to file upload
- **Share Files**: Quick file sharing access
- **Manage Keys**: Access cryptographic key tools
- **Edit Profile**: Update your account information

---

## 📁 File Management

### **Uploading Files**

1. **Access File Manager**: Click "File Manager" in the sidebar
2. **Click "Upload File"** button
3. **Modern Upload Interface**:
   - **Drag & Drop Zone**: Large, interactive area with visual feedback
   - **File Selection**: Click the zone to browse for files
   - **Visual Feedback**: Zone changes color when file is selected
   - **File Information**: Shows selected file name and size
   - **Format Support**: All file types supported, 100MB max size

4. **File Details**:
   - **Display Name**: Human-readable name for your file
   - **Description**: Optional file description
   - **Tags**: Comma-separated tags for organization
   - Enhanced text fields with subtle backgrounds and modern styling

5. **Upload**: Click "Upload File" to complete

### **Managing Your Files**
- **File Grid**: Modern card-based layout showing all your files
- **File Actions**: View, Download, Share, Edit, Delete
- **File Information**: Size, type, upload date, view/download counts
- **Tags Display**: Visual chips showing file tags
- **Status Indicators**: Active vs. deleted file status
- **Search & Filter**: Toggle to show/hide deleted files

### **File Operations**
- **View**: Open files in browser for preview
- **Download**: Download files to your device
- **Share**: Create secure sharing links for other users
- **Edit**: Update file metadata (name, description, tags)
- **Delete**: Remove files (with sharing impact warnings)

---

## 🔗 File Sharing

### **Sharing Files with Users**
1. **Select File**: Click "Share" on any file
2. **Enter Recipients**: Add usernames or email addresses (comma-separated)
3. **Set Expiration**: Choose how many days the share should last
4. **Create Share**: Generate secure access for specified users

### **Accessing Shared Files**
- **Dashboard Integration**: "Shared with Me" card shows incoming shares
- **File Manager**: Toggle to view files shared with you
- **Automatic Access**: Shared files appear in your file list when someone shares with you

---

## 🔑 Managing Your Keys

### **Accessing Key Manager**
1. Click **"Key Manager"** in the sidebar navigation

### **Current Key Status**
- **Interactive Chips**: 
  - Green "Private Key Stored" chip (clickable for security info)
  - Blue "SECP256k1" chip (clickable for encryption details)
- **Key Display**: Shows your current private key (hidden by default)
- **Security Information**: Explains local storage and encryption details

### **Key Operations**

#### **Generate New Key Pair**
⚠️ **Warning**: This creates a completely new identity!
1. Click **"Generate New Key Pair"**
2. Save the new keys securely
3. Your old account will no longer be accessible

#### **Import Key Pair**
1. Click **"Import Key Pair"**
2. **Modern File Upload**: 
   - Click "Choose Key Backup File" with enhanced styling
   - Or paste JSON data in the text area
3. Click **"Import"**
4. Your keys are now loaded and stored

#### **Export Current Key**
1. Click **"Export Backup"**
2. A JSON file downloads automatically
3. Store this file securely as your backup

#### **Delete Stored Key**
⚠️ **Warning**: You'll need to enter your key manually for future logins
1. Click **"Delete Key"**
2. Confirm the deletion
3. Your key is removed from browser storage

---

## 👤 Profile Management

### **Accessing Profile Settings**
1. Click your **user profile card** at the bottom of the sidebar
2. Or navigate to "Edit Profile" if available in the menu

### **Profile Information**
- **Avatar**: Unique emoji generated from your username
- **Personal Details**: First name, last name, email
- **Username**: Display only (cannot be changed for security)
- **Member Since**: Shows when you joined SecureFiles

### **Security Status**
- **Authentication Method**: Zero-Knowledge Proof verification
- **Encryption Level**: 256-bit SECP256k1 cryptography
- **Security Alert**: Confirms your private key never leaves your device

---

## 🛡️ Security Features

### **Zero-Knowledge Proof Authentication**
- **Passwordless**: No traditional passwords to remember or compromise
- **Private Key Security**: Your key never leaves your device
- **Cryptographic Proofs**: Mathematical verification without revealing secrets
- **SECP256k1 Encryption**: Military-grade elliptic curve cryptography

### **File Security**
- **End-to-End Protection**: Files are secured with your cryptographic signature
- **Access Control**: Granular sharing permissions
- **Secure Sharing**: Time-limited access with expiration controls
- **Privacy**: No access to file contents without proper authorization

### **Modern UI Security Indicators**
- **Visual Chips**: Green "ZKP Secured" and blue "256-bit Encrypted" status
- **Security Tooltips**: Click chips for detailed security explanations
- **Status Indicators**: Clear visual feedback for security status
- **Interactive Elements**: Hover effects and animations for better UX

---

## 🔧 Troubleshooting

### **Common Issues & Solutions**

#### **"Invalid private key format"**
- Ensure your private key starts with `0x` followed by 64 hexadecimal characters
- Check for extra spaces or characters
- Try importing from your backup file instead

#### **"Authentication failed"**
- Verify you're using the correct private key for this account
- Check if your session expired
- Try refreshing the page and logging in again

#### **File Upload Issues**
- Check file size (100MB maximum)
- Ensure stable internet connection
- Try refreshing the page if upload stalls
- Verify you have available storage space

#### **Sharing Problems**
- Confirm recipient usernames/emails are correct
- Check that the file hasn't been deleted
- Verify sharing permissions and expiration dates
- Ensure recipients have active SecureFiles accounts

#### **"No private key stored"**
- This is normal if you haven't chosen to store your key locally
- Enter your private key manually or import your backup file
- Consider storing your key for convenience (with proper security)

### **Getting Help**
- **Interactive Help**: Click security chips for detailed explanations
- **Visual Feedback**: Modern UI provides clear status indicators
- **Error Messages**: Descriptive error messages guide troubleshooting
- **Security Tips**: Built-in help text throughout the interface

---

## 📱 Mobile Usage

### **Mobile Browser Support**
- **iOS Safari**: Full support on iOS 14+
- **Android Chrome**: Full support on Android 10+
- **Mobile Firefox**: Full support on recent versions

### **Mobile-Specific Tips**
- **Copy/Paste**: Use long-press to copy private keys
- **File Upload**: Use the file picker to select backup files
- **Secure Storage**: Consider using mobile password managers
- **Screen Security**: Be aware of shoulder surfing when entering keys

---

## 🆘 Getting Help

### **If You Need Assistance**
1. **Check this guide** first for common solutions
2. **Review error messages** carefully - they often contain helpful information
3. **Try different browsers** if experiencing issues
4. **Clear browser cache** and try again
5. **Contact support** if provided by your organization

### **Before Contacting Support**
- **What were you trying to do?** (register, login, manage keys, etc.)
- **What error message** did you see?
- **What browser** are you using?
- **Did you try** the troubleshooting steps above?
- ⚠️ **Never share your private key** with support

---

## 🎓 Understanding Zero-Knowledge Proofs

### **What Makes This Different**
- **No passwords**: Your identity is proven mathematically
- **Nothing revealed**: Your private key never leaves your device
- **Cryptographically secure**: Uses the same security as Bitcoin
- **Future-proof**: Quantum-resistant cryptographic methods

### **How It Works (Simple Explanation)**
1. **You have a secret** (private key) that only you know
2. **You create a proof** that you know the secret without revealing it
3. **The server verifies** the proof against your public key
4. **If valid**, you're authenticated and logged in

### **Benefits for You**
- **Enhanced security**: No passwords to steal or guess
- **Privacy protection**: Your secrets stay with you
- **Convenience**: No password resets or complexity requirements
- **Modern technology**: Using cutting-edge cryptographic research

---

## 📋 Quick Reference

### **Key Formats**
- **Private Key**: `0x` + 64 hexadecimal characters (66 characters total)
- **Public Key**: `04` + 128 hexadecimal characters (130 characters total)

### **Session Duration**
- **Default**: 30 minutes from login
- **Extension**: Use "Refresh Session" button
- **Auto-logout**: Occurs when session expires

### **File Types**
- **Key Backup**: `.json` files containing your key pair
- **Import Format**: JSON with `privateKey`, `publicKey`, and metadata

### **Browser Storage**
- **Location**: Browser localStorage (local to your device)
- **Persistence**: Survives browser restart
- **Clearing**: Removed when you clear browser data

---

## 🎉 You're Ready!

Congratulations! You now know how to:
- ✅ Create a secure ZKP account
- ✅ Login with Zero-Knowledge Proofs  
- ✅ Manage your cryptographic keys safely
- ✅ Use the dashboard and key manager
- ✅ Follow security best practices
- ✅ Troubleshoot common issues

**Welcome to the future of secure, passwordless authentication!** 🔐

---

*For technical documentation and developer information, see the `UI_DOCUMENTATION.md` and `ZKP_IMPLEMENTATION.md` files.* 