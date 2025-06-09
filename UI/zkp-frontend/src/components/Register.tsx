import React, { useState, useContext } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Key as KeyIcon,
  PersonAdd as PersonAddIcon,
  ContentCopy,
  Download,
  ArrowBack,
  Shield,
  Verified,
  Lock,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { zkpService, ZKPKeyPair } from '../services/zkpService';

const steps = ['User Information', 'Generate Keys', 'Create Account'];

const Register: React.FC = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  
  // Form state
  const [activeStep, setActiveStep] = useState(0);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [keyPair, setKeyPair] = useState<ZKPKeyPair | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Validation
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateUsername = (value: string) => {
    if (value.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate form inputs
      const isUsernameValid = validateUsername(username);
      const isEmailValid = validateEmail(email);
      
      if (isUsernameValid && isEmailValid) {
        setActiveStep(1);
      }
    } else if (activeStep === 1) {
      generateKeys();
    } else if (activeStep === 2) {
      handleRegister();
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
    setError('');
  };

  const generateKeys = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Generate cryptographically secure key pair
      const newKeyPair = zkpService.generateKeyPair();
      setKeyPair(newKeyPair);
      setActiveStep(2);
      setSuccess('Key pair generated successfully! Keep your private key secure.');
    } catch (err: any) {
      setError('Failed to generate keys: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!keyPair) {
      setError('Key pair not generated');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await auth?.register(username, email, keyPair);
      
      if (result?.success) {
        setSuccess('Registration successful! You can now login with your credentials.');
        
        // Store private key securely (with user warning)
        zkpService.storePrivateKey(keyPair.privateKey);
        
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        // Fix: Properly extract error message from potential object
        const errorMessage = typeof result?.error === 'string' ? result.error :
                            result?.error || 'Registration failed. Please try again.';
        setError(errorMessage);
      }
    } catch (err: any) {
      setError('Registration failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
  };

  const downloadKeyPair = () => {
    if (!keyPair) return;
    
    const exportData = zkpService.exportKeyPair(keyPair);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zkp-keys-${username}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setSuccess('Key pair downloaded! Store this file securely.');
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 3 }}>
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
                  label="Username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (e.target.value) validateUsername(e.target.value);
                  }}
                  error={!!usernameError}
                  helperText={usernameError || 'Choose a unique username (3+ characters)'}
                  required
                />
              </Box>
              <Box sx={{ flex: '1 1 250px' }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (e.target.value) validateEmail(e.target.value);
                  }}
                  error={!!emailError}
                  helperText={emailError || 'Valid email address for account recovery'}
                  required
                />
              </Box>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <SecurityIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Generate Cryptographic Keys
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              We'll generate a secure SECP256k1 key pair for your account. 
              Your private key will be used for Zero-Knowledge Proof authentication.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 3 }}>
              <Chip
                icon={<Shield sx={{ fontSize: '16px !important' }} />}
                label="SECP256k1"
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<Lock sx={{ fontSize: '16px !important' }} />}
                label="256-bit Security"
                color="success"
                variant="outlined"
              />
              <Chip
                icon={<Verified sx={{ fontSize: '16px !important' }} />}
                label="Zero-Knowledge"
                color="secondary"
                variant="outlined"
              />
            </Box>

            {loading && (
              <Box sx={{ mb: 2 }}>
                <CircularProgress size={24} sx={{ mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Generating secure key pair...
                </Typography>
              </Box>
            )}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 3 }}>
            {keyPair && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 3 
                }}
              >
                <Box>
                  <Alert severity="success" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      <strong>Keys Generated Successfully!</strong> Please save your private key securely. 
                      You'll need it to login to your account.
                    </Typography>
                  </Alert>
                </Box>

                <Box>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      background: 'rgba(99, 102, 241, 0.05)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Public Key
                        </Typography>
                        <Tooltip title="Copy to clipboard">
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(keyPair.publicKey)}
                          >
                            <ContentCopy sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: 'monospace', 
                          wordBreak: 'break-all',
                          bgcolor: 'rgba(255, 255, 255, 0.7)',
                          p: 2,
                          borderRadius: 1,
                          fontSize: '0.75rem',
                        }}
                      >
                        {keyPair.publicKey}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                <Box>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      background: 'rgba(236, 72, 153, 0.05)',
                      border: '1px solid rgba(236, 72, 153, 0.2)',
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Private Key ⚠️
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Copy to clipboard">
                            <IconButton
                              size="small"
                              onClick={() => copyToClipboard(keyPair.privateKey)}
                            >
                              <ContentCopy sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download key pair file">
                            <IconButton
                              size="small"
                              onClick={downloadKeyPair}
                            >
                              <Download sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: 'monospace', 
                          wordBreak: 'break-all',
                          bgcolor: 'rgba(255, 255, 255, 0.7)',
                          p: 2,
                          borderRadius: 1,
                          fontSize: '0.75rem',
                        }}
                      >
                        {keyPair.privateKey}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                <Box>
                  <Alert severity="warning">
                    <Typography variant="body2">
                      <strong>Important:</strong> Store your private key securely! We recommend downloading 
                      the key pair file and storing it in a safe location. You'll need this key to login.
                    </Typography>
                  </Alert>
                </Box>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      {/* Header */}
      <Box sx={{ pt: 4, pb: 2 }}>
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <IconButton 
              onClick={() => navigate('/login')} 
              sx={{ mr: 2 }}
            >
              <ArrowBack />
            </IconButton>
            <SecurityIcon 
              sx={{ 
                mr: 2, 
                fontSize: 32,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }} 
            />
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Create Your Account
            </Typography>
          </Box>

          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, mb: 4 }}>
            Join the future of secure file sharing with Zero-Knowledge Proof authentication
          </Typography>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="md" sx={{ pb: 8 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
          }}
        >
          {/* Progress Stepper */}
          <Box sx={{ mb: 4 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel
                    StepIconProps={{
                      sx: {
                        '&.Mui-active': {
                          color: 'primary.main',
                        },
                        '&.Mui-completed': {
                          color: 'success.main',
                        },
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
            
            {/* Progress Bar */}
            <Box sx={{ mt: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={(activeStep / (steps.length - 1)) * 100}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                    borderRadius: 3,
                  },
                }}
              />
            </Box>
          </Box>

          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          {/* Step Content */}
          {renderStepContent(activeStep)}

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
              size="large"
              sx={{ minWidth: 120 }}
            >
              Back
            </Button>
            
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading || (activeStep === 0 && (!username || !email || !!usernameError || !!emailError))}
              size="large"
              sx={{ minWidth: 120 }}
              startIcon={
                loading ? <CircularProgress size={20} /> : 
                activeStep === steps.length - 1 ? <PersonAddIcon /> : 
                activeStep === 1 ? <KeyIcon /> : null
              }
            >
              {loading ? 'Processing...' :
               activeStep === steps.length - 1 ? 'Create Account' :
               activeStep === 1 ? 'Generate Keys' : 'Next'}
            </Button>
          </Box>

          {/* Footer */}
          <Divider sx={{ my: 4 }} />
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Button 
                color="primary" 
                onClick={() => navigate('/login')}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Sign in here
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register; 