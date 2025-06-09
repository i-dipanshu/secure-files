import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  VpnKey as KeyIcon,
  Security as SecurityIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility,
  VisibilityOff,
  ContentCopy,
  Warning,
} from '@mui/icons-material';
import { zkpService, ZKPKeyPair } from '../services/zkpService';

const KeyManager: React.FC = () => {
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [newKeyPair, setNewKeyPair] = useState<ZKPKeyPair | null>(null);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadCurrentKey();
  }, []);

  const loadCurrentKey = () => {
    const storedKey = zkpService.getStoredPrivateKey();
    setCurrentKey(storedKey);
  };

  const generateNewKeyPair = () => {
    try {
      const keyPair = zkpService.generateKeyPair();
      setNewKeyPair(keyPair);
      setShowNewKeyDialog(true);
      setSuccess('New key pair generated successfully!');
    } catch (err: any) {
      setError('Failed to generate key pair: ' + err.message);
    }
  };

  const saveNewKey = () => {
    if (newKeyPair) {
      zkpService.storePrivateKey(newKeyPair.privateKey);
      setCurrentKey(newKeyPair.privateKey);
      setShowNewKeyDialog(false);
      setNewKeyPair(null);
      setSuccess('Key pair saved successfully!');
    }
  };

  const deleteCurrentKey = () => {
    if (window.confirm('Are you sure you want to delete the stored private key? You will need to enter it manually for future logins.')) {
      localStorage.removeItem('zkp_private_key');
      setCurrentKey(null);
      setSuccess('Private key deleted from local storage');
    }
  };

  const exportCurrentKey = () => {
    if (!currentKey) return;
    
    try {
      // Create a temporary key pair object for export
      const keyPair: ZKPKeyPair = {
        privateKey: currentKey,
        publicKey: '',
        publicKeyHex: '',
      };
      
      // Generate public key from private key for export
      const ec = require('elliptic').ec;
      const secp256k1 = new ec('secp256k1');
      const privateKeyHex = currentKey.startsWith('0x') ? currentKey.slice(2) : currentKey;
      const keyPairEC = secp256k1.keyFromPrivate(privateKeyHex, 'hex');
      const publicKeyPoint = keyPairEC.getPublic();
      const publicKeyHex = '04' + 
        publicKeyPoint.getX().toString('hex').padStart(64, '0') +
        publicKeyPoint.getY().toString('hex').padStart(64, '0');
      
      keyPair.publicKey = publicKeyHex;
      keyPair.publicKeyHex = publicKeyHex;
      
      const exportData = zkpService.exportKeyPair(keyPair);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zkp-keys-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess('Key pair exported successfully!');
    } catch (err: any) {
      setError('Failed to export key pair: ' + err.message);
    }
  };

  const handleImport = () => {
    try {
      const keyPair = zkpService.importKeyPair(importData);
      if (keyPair) {
        zkpService.storePrivateKey(keyPair.privateKey);
        setCurrentKey(keyPair.privateKey);
        setShowImportDialog(false);
        setImportData('');
        setSuccess('Key pair imported and saved successfully!');
      } else {
        setError('Invalid key pair format');
      }
    } catch (err: any) {
      setError('Failed to import key pair: ' + err.message);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <KeyIcon sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Key Manager
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your cryptographic keys for Zero-Knowledge Proof authentication.
        Your private keys are stored locally in your browser and never sent to our servers.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Current Key Status */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Private Key
            </Typography>
            
            {currentKey ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chip 
                    icon={<SecurityIcon />} 
                    label="Private Key Stored" 
                    color="success" 
                    sx={{ mr: 2 }}
                  />
                  <Chip 
                    icon={<KeyIcon />} 
                    label="SECP256k1" 
                    variant="outlined" 
                  />
                </Box>
                
                <TextField
                  fullWidth
                  label="Private Key"
                  type={showKey ? 'text' : 'password'}
                  value={currentKey}
                  InputProps={{
                    readOnly: true,
                    style: { fontFamily: 'monospace', fontSize: '0.9rem' },
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => copyToClipboard(currentKey)}
                          edge="end"
                          sx={{ mr: 1 }}
                        >
                          <ContentCopy />
                        </IconButton>
                        <IconButton
                          onClick={() => setShowKey(!showKey)}
                          edge="end"
                        >
                          {showKey ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={exportCurrentKey}
                  >
                    Export Backup
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={deleteCurrentKey}
                  >
                    Delete Key
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    No private key is currently stored. You'll need to enter your private key
                    manually each time you login.
                  </Typography>
                </Alert>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={generateNewKeyPair}
                  >
                    Generate New Key
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={() => setShowImportDialog(true)}
                  >
                    Import Key
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Key Actions and Security Information */}
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Key Actions */}
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Key Operations
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={generateNewKeyPair}
                  >
                    Generate New Key Pair
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={() => setShowImportDialog(true)}
                  >
                    Import Key Pair
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={exportCurrentKey}
                    disabled={!currentKey}
                  >
                    Export Current Key
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Security Information */}
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Security Information
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Key Storage:</strong> Browser localStorage
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Encryption:</strong> SECP256k1 Elliptic Curve
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Key Size:</strong> 256 bits
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Proof System:</strong> Schnorr Signatures
                  </Typography>
                </Box>
                
                <Alert severity="info" icon={<Warning />}>
                  <Typography variant="body2">
                    Always backup your private keys securely. We cannot recover them if lost.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Best Practices */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Security Best Practices
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" gutterBottom color="primary">
                ✅ Do:
              </Typography>
              <Typography variant="body2" component="div">
                • Backup your private keys securely<br />
                • Use a hardware wallet for long-term storage<br />
                • Keep your keys in a secure, offline location<br />
                • Generate keys on a secure device<br />
                • Verify your backups work before deleting originals
              </Typography>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" gutterBottom color="error">
                ❌ Don't:
              </Typography>
              <Typography variant="body2" component="div">
                • Share your private keys with anyone<br />
                • Store keys in plain text files<br />
                • Send keys via email or messaging<br />
                • Use the same key for multiple services<br />
                • Generate keys on compromised devices
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* New Key Dialog */}
      <Dialog open={showNewKeyDialog} onClose={() => setShowNewKeyDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>New Key Pair Generated</DialogTitle>
        <DialogContent>
          {newKeyPair && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Important:</strong> Save these keys securely before proceeding. 
                  This is the only time they will be displayed.
                </Typography>
              </Alert>
              
              <TextField
                fullWidth
                label="Private Key (Keep Secret!)"
                value={newKeyPair.privateKey}
                InputProps={{
                  readOnly: true,
                  style: { fontFamily: 'monospace', fontSize: '0.8rem' },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => copyToClipboard(newKeyPair.privateKey)}>
                        <ContentCopy />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                margin="normal"
                multiline
                rows={2}
              />
              
              <TextField
                fullWidth
                label="Public Key (Safe to Share)"
                value={newKeyPair.publicKeyHex}
                InputProps={{
                  readOnly: true,
                  style: { fontFamily: 'monospace', fontSize: '0.8rem' },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => copyToClipboard(newKeyPair.publicKeyHex)}>
                        <ContentCopy />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                margin="normal"
                multiline
                rows={3}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewKeyDialog(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={saveNewKey}>
            Save Key Pair
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onClose={() => setShowImportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Key Pair</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <input
              accept=".json"
              style={{ display: 'none' }}
              id="key-file-import"
              type="file"
              onChange={handleFileImport}
            />
            <label htmlFor="key-file-import">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                fullWidth
                sx={{ mb: 2 }}
              >
                Choose Key Backup File
              </Button>
            </label>
          </Box>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Or paste the key pair JSON data:
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={6}
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder="Paste your key pair backup JSON here..."
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowImportDialog(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleImport}
            disabled={!importData}
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default KeyManager; 