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
} from '@mui/material';
import {
  Security as SecurityIcon,
  Key as KeyIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon,
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
        }, 2000);
      } else {
        setError(result?.error || 'Registration failed. Please try again.');
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
          <Box sx={{ mt: 2 }}>
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
              margin="normal"
              required
            />
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
              margin="normal"
              required
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <SecurityIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Generate Cryptographic Keys
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              We'll generate a secure SECP256k1 key pair for Zero-Knowledge Proof authentication.
              Your private key will be used to create cryptographic proofs without revealing it.
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Security Notice:</strong> Your private key will be generated locally in your browser.
                Make sure to backup your keys securely after registration.
              </Typography>
            </Alert>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            {keyPair && (
              <>
                <Typography variant="h6" gutterBottom>
                  Your ZKP Key Pair
                </Typography>
                
                <Card sx={{ mb: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      🔒 Private Key (Keep Secret!)
                    </Typography>
                    <Box sx={{ 
                      p: 1, 
                      bgcolor: 'rgba(0,0,0,0.1)', 
                      borderRadius: 1, 
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      wordBreak: 'break-all',
                      mb: 1
                    }}>
                      {keyPair.privateKey}
                    </Box>
                    <Button 
                      size="small" 
                      onClick={() => copyToClipboard(keyPair.privateKey)}
                      variant="outlined"
                      color="inherit"
                    >
                      Copy Private Key
                    </Button>
                  </CardContent>
                </Card>

                <Card sx={{ mb: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      🔑 Public Key (Safe to Share)
                    </Typography>
                    <Box sx={{ 
                      p: 1, 
                      bgcolor: 'rgba(0,0,0,0.1)', 
                      borderRadius: 1, 
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      wordBreak: 'break-all',
                      mb: 1
                    }}>
                      {keyPair.publicKeyHex}
                    </Box>
                    <Button 
                      size="small" 
                      onClick={() => copyToClipboard(keyPair.publicKeyHex)}
                      variant="outlined"
                      color="inherit"
                    >
                      Copy Public Key
                    </Button>
                  </CardContent>
                </Card>

                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Critical:</strong> Save your private key securely! You'll need it to login.
                    We recommend downloading the key pair backup file.
                  </Typography>
                </Alert>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={downloadKeyPair}
                    startIcon={<KeyIcon />}
                  >
                    Download Key Backup
                  </Button>
                </Box>

                <Divider sx={{ my: 2 }} />
                
                <Typography variant="body2" color="text.secondary">
                  Ready to create your account with username: <Chip label={username} size="small" /> 
                  and email: <Chip label={email} size="small" />
                </Typography>
              </>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PersonAddIcon sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Create ZKP Account
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Register for passwordless authentication using Zero-Knowledge Proofs.
          Your account will be secured with cryptographic keys instead of traditional passwords.
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

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

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading || (activeStep === 0 && (!username || !email))}
            startIcon={loading ? <CircularProgress size={20} /> : activeStep === 2 ? <CheckCircleIcon /> : null}
          >
            {loading ? 'Processing...' : 
             activeStep === 0 ? 'Generate Keys' :
             activeStep === 1 ? 'Create Keys' :
             'Create Account'}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Button 
              color="primary" 
              onClick={() => navigate('/login')}
              sx={{ textTransform: 'none' }}
            >
              Login here
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register; 