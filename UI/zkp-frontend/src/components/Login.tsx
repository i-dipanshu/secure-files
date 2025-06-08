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
} from '@mui/material';
import {
  Login as LoginIcon,
  Visibility,
  VisibilityOff,
  Security as SecurityIcon,
  Upload as UploadIcon,
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

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <LoginIcon sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            ZKP Login
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Sign in using your cryptographic private key. We'll generate a Zero-Knowledge Proof
          to authenticate you without revealing your private key.
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
          />

          <Box sx={{ mt: 3, mb: 2 }}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !identifier || !privateKey}
              startIcon={loading ? <CircularProgress size={20} /> : <SecurityIcon />}
            >
              {loading ? 'Authenticating...' : 'Login with ZKP'}
            </Button>
          </Box>
        </form>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Or
          </Typography>
        </Divider>

        {/* Key Import Section */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Import Key Pair
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload a key pair backup file to automatically fill your private key
            </Typography>
            <input
              accept=".json"
              style={{ display: 'none' }}
              id="key-file-upload"
              type="file"
              onChange={handleFileUpload}
            />
            <label htmlFor="key-file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                size="small"
              >
                Upload Key File
              </Button>
            </label>
          </CardContent>
        </Card>

        {/* Stored Key Management */}
        {zkpService.getStoredPrivateKey() && (
          <Card variant="outlined" sx={{ mb: 3, bgcolor: 'warning.light' }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Stored Private Key Detected
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                We found a private key from your previous session. For security,
                you may want to clear it after use.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={clearStoredKey}
                color="warning"
              >
                Clear Stored Key
              </Button>
            </CardContent>
          </Card>
        )}

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Security Tips:</strong>
            <br />• Never share your private key with anyone
            <br />• Use a secure device and connection
            <br />• Consider using a hardware wallet for key storage
          </Typography>
        </Alert>

        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Button 
              color="primary" 
              onClick={() => navigate('/register')}
              sx={{ textTransform: 'none' }}
            >
              Register here
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login; 