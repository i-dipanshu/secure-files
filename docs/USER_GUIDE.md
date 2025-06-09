# ZKP File Sharing - User Guide

## 🚀 Welcome to ZKP File Sharing

ZKP File Sharing is a secure, passwordless authentication system that uses Zero-Knowledge Proofs for login. Instead of traditional passwords, you use cryptographic keys that prove your identity without revealing any secrets.

---

## 🎯 Quick Start

### **What You'll Need**
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- A secure place to store your private key

### **Accessing the Application**
1. Open your web browser
2. Navigate to the application URL
3. You'll see the main page with options to **Register** or **Login**

---

## 📝 Creating Your Account

### **Step 1: Registration Process**

1. **Click "Register"** on the main page
2. **Enter Your Information**:
   - **Username**: Choose a unique username (3+ characters, letters/numbers/underscores only)
   - **Email**: Enter a valid email address for account recovery

3. **Generate Your Keys**:
   - Click **"Generate Keys"** - this creates your cryptographic key pair
   - Your keys are generated locally in your browser for maximum security
   - ⚠️ **Important**: This happens only once!

4. **Save Your Keys Securely**:
   - **Private Key** (Red box): This is your "password" - keep it secret!
   - **Public Key** (Green box): Safe to share, used for verification
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
1. Click **"Login"** on the main page
2. If you previously saved your key, it will auto-fill
3. Click **"Login with ZKP"**
4. You're logged in instantly!

### **Method 2: Manual Key Entry**
1. Click **"Login"** on the main page
2. **Enter your private key** in the text field
3. Use the eye icon to show/hide your key while typing
4. Click **"Login with ZKP"**

### **Method 3: Import Key File**
1. Click **"Login"** on the main page
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

Once logged in, you'll see your personalized dashboard:

### **User Profile Section**
- **Avatar**: Shows your username's first letter
- **User Info**: Displays your username and email
- **Status Chips**: 
  - 🟢 **Active**: Your account is active
  - 🟡 **Verified/Unverified**: Account verification status

### **Security Status Panel**
- **Authentication Method**: Confirms you're using Zero-Knowledge Proof
- **Private Key Storage**: Shows if your key is stored locally
- **Session Info**: When your session expires (30 minutes)
- **Refresh Session**: Extend your session without re-login

### **Quick Actions**
- **Manage Keys**: Access key management tools
- **Edit Profile**: (Coming soon) Edit your account information
- **Files**: (Coming soon) File sharing features
- **Sharing**: (Coming soon) Share files securely

### **Security Alerts**
- **Welcome Message**: Explains your security setup
- **Storage Warnings**: Alerts if no private key is stored locally
- **Best Practices**: Security tips and recommendations

---

## 🔑 Managing Your Keys

### **Accessing Key Manager**
1. From the Dashboard, click **"Manage Keys"**
2. Or use the navigation menu and select **"Key Manager"**

### **Current Key Status**
- **Green Chip**: "Private Key Stored" means your key is saved locally
- **Yellow Warning**: "Not Stored" means you'll need to enter your key each login
- **Key Display**: Shows your current private key (hidden by default)
- **Controls**: Copy, show/hide, and export options

### **Key Operations**

#### **Generate New Key Pair**
⚠️ **Warning**: This creates a completely new identity!
1. Click **"Generate New Key Pair"**
2. Save the new keys securely
3. Your old account will no longer be accessible

#### **Import Key Pair**
1. Click **"Import Key Pair"**
2. Either:
   - **Upload File**: Click "Choose Key Backup File" and select your JSON backup
   - **Paste Data**: Copy and paste your key backup JSON
3. Click **"Import"**
4. Your keys are now loaded and stored

#### **Export Current Key**
1. Click **"Export Backup"** or **"Export Current Key"**
2. A JSON file downloads automatically
3. Store this file securely as your backup

#### **Delete Stored Key**
⚠️ **Warning**: You'll need to enter your key manually for future logins
1. Click **"Delete Key"**
2. Confirm the deletion
3. Your key is removed from browser storage (but your account remains active)

---

## 🛡️ Security Best Practices

### **✅ Do These Things**
- **Backup your keys** immediately after registration
- **Store backups securely** (password manager, encrypted storage)
- **Use HTTPS** - never enter keys on unsecured sites
- **Keep keys private** - never share with anyone
- **Log out** when using shared computers
- **Generate keys on trusted devices** only

### **❌ Never Do These Things**
- **Share private keys** via email, messaging, or verbally
- **Store keys in plain text** files on your computer
- **Use the same keys** for multiple services
- **Screenshot or photograph** your private keys
- **Generate keys on public/shared computers**

### **🔐 Storage Recommendations**
1. **Password Managers**: Store backup files in your password manager
2. **Encrypted USB Drive**: Physical backup on encrypted storage
3. **Secure Cloud Storage**: Encrypted cloud storage with strong passwords
4. **Paper Backup**: Write down key and store in a safe place (for emergency)

---

## 🔧 Troubleshooting

### **Common Issues & Solutions**

#### **"Invalid private key format"**
- Ensure your private key starts with `0x` followed by 64 hexadecimal characters
- Check for extra spaces or characters
- Try importing from your backup file instead

#### **"Authentication failed"**
- Verify you're using the correct private key for this account
- Check if your session expired (30-minute limit)
- Try refreshing the page and logging in again

#### **"No private key stored"**
- This is normal if you haven't chosen to store your key locally
- Enter your private key manually or import your backup file
- Consider storing your key for convenience (with proper security)

#### **"Key file import failed"**
- Ensure you're uploading the correct JSON backup file
- Check that the file isn't corrupted or modified
- Try copying and pasting the JSON content instead

#### **Can't access account**
- **Lost private key**: Unfortunately, accounts cannot be recovered without the private key
- **Forgot username**: Check your email for registration confirmation
- **Account locked**: Contact support if available

### **Browser-Specific Issues**

#### **Safari**
- Enable "Allow cross-website tracking" for localhost development
- Clear browser cache if experiencing issues

#### **Firefox**
- Check that JavaScript is enabled
- Disable strict tracking protection for the site

#### **Chrome**
- Clear site data if experiencing storage issues
- Check that third-party cookies are allowed

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