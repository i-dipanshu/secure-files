import React, { useState, useContext, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Login as LoginIcon,
  Visibility,
  VisibilityOff,
  Security as SecurityIcon,
  Upload as UploadIcon,
  Shield,
  Lock,
  Verified,
  CloudUpload,
  Share,
  Key,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { zkpService } from '../services/zkpService';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  
  // Form state
  const [identifier, setIdentifier] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check for stored private key on component mount
  useEffect(() => {
    const storedKey = zkpService.getStoredPrivateKey();
    if (storedKey) {
      setPrivateKey(storedKey);
      setSuccess('Found stored private key from previous session');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier || !privateKey) {
      setError('Please enter both username/email and private key');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await auth?.login(identifier, privateKey);
      
      if (result) {
        setSuccess('Login successful! Redirecting to dashboard...');
        
        // Store private key for convenience (with security warning)
        zkpService.storePrivateKey(privateKey);
        
        // Redirect after a brief delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } catch (err: any) {
      setError('Login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const keyPair = zkpService.importKeyPair(content);
        
        if (keyPair) {
          setPrivateKey(keyPair.privateKey);
          setSuccess('Key pair imported successfully!');
        } else {
          setError('Invalid key pair file format');
        }
      } catch (err) {
        setError('Failed to read key pair file');
      }
    };
    reader.readAsText(file);
  };

  const clearStoredKey = () => {
    localStorage.removeItem('zkp_private_key');
    setPrivateKey('');
    setSuccess('Stored private key cleared');
  };

  const features = [
    {
      icon: <Shield sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Zero-Knowledge Security',
      description: 'Your private key never leaves your device. We use cryptographic proofs to verify your identity without exposing sensitive information.',
    },
    {
      icon: <CloudUpload sx={{ fontSize: 40, color: 'success.main' }} />,
      title: 'Secure File Storage',
      description: 'Upload and store your files with military-grade encryption. Each file is protected with your unique cryptographic signature.',
    },
    {
      icon: <Share sx={{ fontSize: 40, color: 'secondary.main' }} />,
      title: 'Private Sharing',
      description: 'Share files securely with granular permissions. Control who can view, download, or manage your shared content.',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      {/* Hero Section */}
      <Box sx={{ pt: 8, pb: 4 }}>
        <Container maxWidth="lg">
          <Box 
            sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 6, 
              alignItems: 'center' 
            }}
          >
            {/* Left side - Hero content */}
            <Box sx={{ flex: '1 1 500px' }}>
              <Box sx={{ maxWidth: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <SecurityIcon 
                    sx={{ 
                      mr: 2, 
                      fontSize: 48,
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }} 
                  />
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    ZKP Secure
                  </Typography>
                </Box>
                
                <Typography 
                  variant="h4" 
                  sx={{ 
                    mb: 3, 
                    fontWeight: 600,
                    color: 'text.primary',
                    lineHeight: 1.3,
                  }}
                >
                  The Future of{' '}
                  <span style={{ 
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    Secure
                  </span>{' '}
                  File Sharing
                </Typography>
                
                <Typography variant="h6" color="text.secondary" sx={{ mb: 4, fontWeight: 400 }}>
                  Experience next-generation file sharing powered by Zero-Knowledge Proofs. 
                  Your privacy is guaranteed by mathematics, not just promises.
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 4, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<Lock sx={{ fontSize: '16px !important' }} />}
                    label="256-bit Encryption"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                  <Chip
                    icon={<Verified sx={{ fontSize: '16px !important' }} />}
                    label="Zero-Knowledge Proofs"
                    color="success"
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                  <Chip
                    icon={<Key sx={{ fontSize: '16px !important' }} />}
                    label="Self-Sovereign Keys"
                    color="secondary"
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                </Box>

                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{ 
                    mr: 2,
                    borderWidth: '2px',
                    '&:hover': {
                      borderWidth: '2px',
                    },
                  }}
                >
                  Create Account
                </Button>
              </Box>
            </Box>
            
            {/* Right side - Login form */}
            <Box sx={{ flex: '1 1 500px' }}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 4,
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <LoginIcon sx={{ mr: 1, fontSize: 28, color: 'primary.main' }} />
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Welcome Back
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Sign in to your secure account using your cryptographic private key. 
                  We'll generate a Zero-Knowledge Proof to authenticate you.
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                  </Alert>
                )}

                <form onSubmit={handleLogin}>
                  <TextField
                    fullWidth
                    label="Username or Email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    margin="normal"
                    required
                    autoComplete="username"
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Private Key"
                    type={showPrivateKey ? 'text' : 'password'}
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    margin="normal"
                    required
                    multiline={showPrivateKey}
                    rows={showPrivateKey ? 3 : 1}
                    InputProps={{
                      style: { fontFamily: 'monospace', fontSize: '0.9rem' },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle private key visibility"
                            onClick={() => setShowPrivateKey(!showPrivateKey)}
                            edge="end"
                          >
                            {showPrivateKey ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    helperText="Enter your SECP256k1 private key (starts with 0x)"
                    sx={{ mb: 3 }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading || !identifier || !privateKey}
                    startIcon={loading ? <CircularProgress size={20} /> : <SecurityIcon />}
                    sx={{ py: 1.5, mb: 3 }}
                  >
                    {loading ? 'Authenticating...' : 'Login with ZKP'}
                  </Button>
                </form>

                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Or import key file
                  </Typography>
                </Divider>

                {/* Key Import Section */}
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <UploadIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Import Key Pair File
                      </Typography>
                    </Box>
                    
                    <Button
                      component="label"
                      variant="outlined"
                      size="small"
                      fullWidth
                      sx={{ mb: 1 }}
                    >
                      Choose File
                      <input
                        type="file"
                        hidden
                        accept=".json"
                        onChange={handleFileUpload}
                      />
                    </Button>
                    
                    <Typography variant="caption" color="text.secondary">
                      Upload your exported key pair JSON file
                    </Typography>
                  </CardContent>
                </Card>

                {privateKey && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={clearStoredKey}
                    color="warning"
                    fullWidth
                  >
                    Clear Stored Key
                  </Button>
                )}
              </Paper>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8, bgcolor: 'rgba(255, 255, 255, 0.7)' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                mb: 2, 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Why Choose ZKP Secure?
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
              Advanced cryptography meets intuitive design
            </Typography>
          </Box>

          <Box 
            sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 4 
            }}
          >
            {features.map((feature, index) => (
              <Box sx={{ flex: '1 1 300px' }} key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.8)',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                    },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Box sx={{ mb: 3 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Security Notice */}
      <Box sx={{ py: 4, bgcolor: 'rgba(99, 102, 241, 0.05)' }}>
        <Container maxWidth="md">
          <Alert 
            severity="info" 
            sx={{ 
              bgcolor: 'transparent',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            }}
          >
            <Typography variant="body2">
              <strong>Security Notice:</strong> Your private key is never transmitted to our servers. 
              All cryptographic operations happen locally in your browser, ensuring maximum security 
              and privacy for your data.
            </Typography>
          </Alert>
        </Container>
      </Box>
    </Box>
  );
};

export default Login; 