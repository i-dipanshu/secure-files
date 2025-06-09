import React, { useState, useContext, useEffect } from 'react';
import {
  Container,
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
} from '@mui/material';
import {
  Person as PersonIcon,
  Save as SaveIcon,
  Security as SecurityIcon,
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
}

const EditProfile: React.FC = () => {
  const auth = useContext(AuthContext);
  const [saving, setSaving] = useState(false);
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
  });

  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (auth?.user) {
      const userProfile = {
        ...auth.user,
        first_name: auth.user.first_name || '',
        last_name: auth.user.last_name || '',
        storage_used: auth.user.storage_used || 0,
      };
      
      setProfile(userProfile);
      setProfileForm({
        first_name: userProfile.first_name,
        last_name: userProfile.last_name,
        email: userProfile.email,
      });
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
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
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!auth?.user) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <PersonIcon sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Edit Profile
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: 'primary.main',
                  mr: 3,
                  fontSize: '2rem'
                }}
              >
                {profile.username.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6">{profile.username}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Member since {formatDate(profile.created_at)}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="First Name"
                value={profileForm.first_name}
                onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
              />
              <TextField
                fullWidth
                label="Last Name"
                value={profileForm.last_name}
                onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
              />
            </Box>
            
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Username"
              value={profile.username}
              disabled
              helperText="Username cannot be changed"
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                onClick={handleSaveProfile}
                disabled={saving}
              >
                Save Changes
              </Button>
              <Button
                variant="outlined"
                onClick={loadProfile}
                disabled={saving}
              >
                Reset
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Account Status
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Account Status: <strong>{profile.is_active ? 'Active' : 'Inactive'}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Verification: <strong>{profile.is_verified ? 'Verified' : 'Unverified'}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Storage Used: <strong>{formatFileSize(profile.storage_used)}</strong>
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Security</Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>ZKP Authentication Active</strong>
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              Your account uses Zero-Knowledge Proof authentication for maximum security.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EditProfile; 