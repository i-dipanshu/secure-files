import React, { useContext, useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Security as SecurityIcon,
  AccountCircle,
  VpnKey,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { zkpService } from '../services/zkpService';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState({
    hasStoredKey: false,
    loginTime: '',
    tokenExpiry: '',
  });

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = () => {
    const hasStoredKey = !!zkpService.getStoredPrivateKey();
    const loginTime = new Date().toLocaleString();
    
    // Calculate token expiry (30 minutes from login)
    const expiryTime = new Date(Date.now() + 30 * 60 * 1000).toLocaleString();
    
    setUserStats({
      hasStoredKey,
      loginTime,
      tokenExpiry: expiryTime,
    });
  };

  const handleRefreshAuth = async () => {
    setLoading(true);
    try {
      await auth?.checkAuth();
    } finally {
      setLoading(false);
    }
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
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <DashboardIcon sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* User Profile and Security Status Cards */}
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* User Profile Card */}
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      width: 56, 
                      height: 56, 
                      bgcolor: 'primary.main',
                      mr: 2,
                      fontSize: '1.5rem'
                    }}
                  >
                    {auth.user.username.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {auth.user.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {auth.user.email}
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Chip 
                    icon={<CheckCircle />} 
                    label={auth.user.is_active ? "Active" : "Inactive"}
                    color={auth.user.is_active ? "success" : "error"}
                    size="small"
                  />
                  <Chip 
                    icon={auth.user.is_verified ? <CheckCircle /> : <Warning />} 
                    label={auth.user.is_verified ? "Verified" : "Unverified"}
                    color={auth.user.is_verified ? "success" : "warning"}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary">
                  <strong>User ID:</strong> {auth.user.user_id}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Security Status Card */}
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">
                    Security Status
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Authentication Method
                  </Typography>
                  <Chip 
                    icon={<SecurityIcon />} 
                    label="Zero-Knowledge Proof" 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Private Key Storage
                  </Typography>
                  <Chip 
                    icon={userStats.hasStoredKey ? <CheckCircle /> : <Warning />}
                    label={userStats.hasStoredKey ? "Stored Locally" : "Not Stored"}
                    color={userStats.hasStoredKey ? "success" : "warning"}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary">
                  <strong>Session Expires:</strong> {userStats.tokenExpiry}
                </Typography>
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleRefreshAuth}
                  disabled={loading}
                  sx={{ mt: 2 }}
                  startIcon={loading ? <CircularProgress size={16} /> : <Info />}
                >
                  Refresh Session
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Quick Actions */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<VpnKey />}
              onClick={() => navigate('/keys')}
            >
              Manage Keys
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<AccountCircle />}
              disabled
            >
              Edit Profile (Coming Soon)
            </Button>
            
            <Button
              variant="outlined"
              disabled
            >
              Files (Coming Soon)
            </Button>
            
            <Button
              variant="outlined"
              disabled
            >
              Sharing (Coming Soon)
            </Button>
          </Box>
        </Paper>

        {/* Security Alerts */}
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Welcome to ZKP File Sharing!</strong> Your account is secured with 
              cryptographic Zero-Knowledge Proofs. Your private key is never sent to our servers.
            </Typography>
          </Alert>
          
          {!userStats.hasStoredKey && (
            <Alert severity="warning">
              <Typography variant="body2">
                <strong>Security Notice:</strong> No private key is stored locally. 
                You'll need to enter your private key each time you login. 
                Consider visiting the Key Manager to securely store your credentials.
              </Typography>
            </Alert>
          )}
        </Box>

        {/* System Information */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            System Information
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Encryption:</strong> SECP256k1 Elliptic Curve
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Proof System:</strong> Schnorr Signatures
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Security Level:</strong> 256-bit
              </Typography>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Session Type:</strong> JWT Bearer Token
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Token Validity:</strong> 30 minutes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Last Login:</strong> {userStats.loginTime}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Dashboard; 