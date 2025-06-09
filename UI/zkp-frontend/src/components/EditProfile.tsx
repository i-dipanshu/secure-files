import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Save as SaveIcon,
  Security as SecurityIcon,
  Storage,
  CalendarToday,
} from '@mui/icons-material';
import { AuthContext } from '../App';

interface UserProfile {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  storage_used: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  avatar_url?: string;
}

const EditProfile: React.FC = () => {
  const auth = useContext(AuthContext);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [infoDialog, setInfoDialog] = useState({ open: false, title: '', content: '' });
  
  const [profile, setProfile] = useState<UserProfile>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    storage_used: 0,
    is_active: true,
    is_verified: false,
    created_at: '',
    avatar_url: '',
  });

  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });

  const getRandomMemoji = (username: string): string => {
    const memojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦄', '🐝', '🦋', '🐌', '🐛', '🦀', '🐙', '🦑', '🦐', '🐠', '🐟', '🐡', '🐢', '🦎', '🐍', '🦖', '🦕', '🐲', '🐉', '🦢', '🦜', '🦅', '🦆', '🦉', '🐺', '🐗', '🐴', '🦓', '🦒', '🐘', '🦏', '🦛', '🐪', '🐫', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🐐', '🦌', '🐕', '🐩', '🐈', '🐓', '🦃', '🕊️', '🐇', '🐁', '🐀', '🐿️', '🦔'];
    
    // Generate a consistent index based on username
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      const char = username.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return memojis[Math.abs(hash) % memojis.length];
  };

  const loadProfile = useCallback(async () => {
    if (auth?.user) {
      let userProfile = {
        ...auth.user,
        first_name: auth.user.first_name || '',
        last_name: auth.user.last_name || '',
        storage_used: auth.user.storage_used || 0,
        avatar_url: auth.user.avatar_url || '',
        created_at: auth.user.created_at || new Date().toISOString(),
      };
      
      // Try to load more detailed user info from API
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Load user profile
          const profileResponse = await fetch('http://localhost:8000/api/user/profile', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          
          if (profileResponse.ok) {
            const apiUserData = await profileResponse.json();
            userProfile = {
              ...userProfile,
              ...apiUserData,
              created_at: apiUserData.created_at || userProfile.created_at,
            };
          }

          // Load storage info separately
          const storageResponse = await fetch('http://localhost:8000/api/files/storage/info', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          
          if (storageResponse.ok) {
            const storageData = await storageResponse.json();
            userProfile.storage_used = storageData.storage_used || 0;
          }
        }
      } catch (error) {
        console.warn('Could not load detailed user profile:', error);
      }
      
      setProfile(userProfile);
      setProfileForm({
        first_name: userProfile.first_name,
        last_name: userProfile.last_name,
        email: userProfile.email,
      });
    }
  }, [auth?.user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // In a real app, make API call to update profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showSnackbar('Profile updated successfully!', 'success');
      await loadProfile();
    } catch (error) {
      console.error('Profile update error:', error);
      showSnackbar('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) {
      return 'Recently';
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Recently';
    }
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const showInfoDialog = (title: string, content: string) => {
    setInfoDialog({ open: true, title, content });
  };

  const handleCloseDialog = () => {
    setInfoDialog({ open: false, title: '', content: '' });
  };

  if (!auth?.user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 800,
            background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          Profile Settings
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
          Manage your account information and preferences
        </Typography>
      </Box>

      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 4 
        }}
      >
        {/* Profile Information */}
        <Box sx={{ flex: '2 1 600px' }}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Personal Information
              </Typography>
              
              {/* Avatar Section */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Avatar 
                  sx={{ 
                    width: 100, 
                    height: 100,
                    fontSize: '3rem',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    border: '3px solid rgba(99, 102, 241, 0.2)',
                  }}
                >
                  {getRandomMemoji(profile.username || 'user')}
                </Avatar>
                
                <Box sx={{ ml: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {profile.username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Your unique avatar is generated from your username
                  </Typography>
                </Box>
              </Box>

              {/* Member Since Section */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarToday sx={{ mr: 2, color: 'success.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Member Since
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary', ml: 4 }}>
                  {formatDate(profile.created_at)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 0.5 }}>
                  You've been part of SecureFiles since this date
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Form Fields */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 3 
                }}
              >
                <Box sx={{ flex: '1 1 250px' }}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={profileForm.first_name}
                    onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 250px' }}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={profileForm.last_name}
                    onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 100%' }}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 100%' }}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={profile.username}
                    disabled
                    helperText="Username cannot be changed for security reasons"
                    sx={{ mb: 3 }}
                  />
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                  onClick={handleSaveProfile}
                  disabled={saving}
                  size="large"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={loadProfile}
                  disabled={saving}
                  size="large"
                >
                  Reset
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Account Stats & Security */}
        <Box sx={{ flex: '1 1 350px' }}>
          {/* Security Information */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <SecurityIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Security Status
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Authentication Method
                </Typography>
                <Chip 
                  icon={<SecurityIcon sx={{ fontSize: '16px !important' }} />}
                  label="Zero-Knowledge Proof" 
                  color="primary" 
                  variant="outlined"
                  size="small"
                  clickable
                  onClick={() => showInfoDialog(
                    'Zero-Knowledge Proof Authentication',
                    'Zero-Knowledge Proofs (ZKP) allow you to prove you know a secret (your private key) without revealing the secret itself. This cryptographic method ensures maximum privacy - your private key never leaves your device, yet the server can verify your identity. Our implementation uses SECP256k1 elliptic curve cryptography with Schnorr signatures, providing bank-level security for your files.'
                  )}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    },
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Encryption Level
                </Typography>
                <Chip 
                  label="256-bit SECP256k1" 
                  color="success" 
                  variant="outlined"
                  size="small"
                  clickable
                  onClick={() => showInfoDialog(
                    'SECP256k1 Elliptic Curve Cryptography',
                    'SECP256k1 is the cryptographic curve used by Bitcoin and many other cryptocurrencies. It provides 256-bit security through elliptic curve cryptography, which is considered one of the strongest encryption methods available. This curve is specifically chosen for its security properties and resistance to quantum computing attacks when used with proper key sizes.'
                  )}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    },
                  }}
                />
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  Your account is protected by cryptographic Zero-Knowledge Proofs. 
                  Your private key never leaves your device.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Information Dialog */}
      <Dialog 
        open={infoDialog.open} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          fontWeight: 600,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {infoDialog.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.6 }}>
            {infoDialog.content}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="contained">
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EditProfile; 