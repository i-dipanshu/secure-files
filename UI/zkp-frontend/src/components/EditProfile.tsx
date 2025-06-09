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
  IconButton,
  Badge,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Security as SecurityIcon,
  PhotoCamera,
  CheckCircle,
  Warning,
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
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

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (auth?.user) {
      const userProfile = {
        ...auth.user,
        first_name: auth.user.first_name || '',
        last_name: auth.user.last_name || '',
        storage_used: auth.user.storage_used || 0,
        avatar_url: auth.user.avatar_url || '',
      };
      
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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showSnackbar('Please select an image file', 'error');
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      showSnackbar('Image size must be less than 2MB', 'error');
      return;
    }

    setUploadingAvatar(true);
    
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // In a real app, upload to server
      // const formData = new FormData();
      // formData.append('avatar', file);
      // const response = await uploadAvatar(formData);
      
      // For now, just simulate upload
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      showSnackbar('Profile picture updated successfully!', 'success');
    } catch (error) {
      console.error('Avatar upload error:', error);
      showSnackbar('Failed to upload profile picture', 'error');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
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
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <IconButton
                      component="label"
                      size="small"
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                        width: 32,
                        height: 32,
                      }}
                    >
                      {uploadingAvatar ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <PhotoCamera sx={{ fontSize: 16 }} />
                      )}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                      />
                    </IconButton>
                  }
                >
                  <Avatar 
                    src={avatarPreview || profile.avatar_url}
                    sx={{ 
                      width: 100, 
                      height: 100,
                      fontSize: '2.5rem',
                      background: avatarPreview || profile.avatar_url 
                        ? 'transparent' 
                        : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    }}
                  >
                    {!avatarPreview && !profile.avatar_url && profile.username?.charAt(0)?.toUpperCase()}
                  </Avatar>
                </Badge>
                
                <Box sx={{ ml: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {profile.username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Click the camera icon to update your profile picture
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      size="small"
                      icon={<CheckCircle sx={{ fontSize: '16px !important' }} />}
                      label={profile.is_active ? "Active" : "Inactive"}
                      color={profile.is_active ? "success" : "error"}
                    />
                    <Chip
                      size="small"
                      icon={profile.is_verified ? <CheckCircle sx={{ fontSize: '16px !important' }} /> : <Warning sx={{ fontSize: '16px !important' }} />}
                      label={profile.is_verified ? "Verified" : "Unverified"}
                      color={profile.is_verified ? "success" : "warning"}
                    />
                  </Box>
                </Box>
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
          {/* Account Stats */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Account Statistics
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Storage sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Storage Used
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
                  {formatFileSize(profile.storage_used)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  of 1 GB available
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarToday sx={{ mr: 2, color: 'success.main' }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Member Since
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {formatDate(profile.created_at)}
                </Typography>
              </Box>
            </CardContent>
          </Card>

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
    </Box>
  );
};

export default EditProfile; 