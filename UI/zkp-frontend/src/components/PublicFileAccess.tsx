import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  FilePresent,
  Download,
  Visibility,
  Public,
  Storage,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { zkpService } from '../services/zkpService';

interface PublicFileInfo {
  file_id: string;
  filename: string;
  display_name: string;
  file_size: number;
  mime_type: string;
  description?: string;
  created_at: string;
  download_count: number;
  view_count: number;
  owner: {
    username: string;
  };
}

const PublicFileAccess: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const [file, setFile] = useState<PublicFileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const loadPublicFile = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to access the file publicly first
      const response = await fetch(`http://localhost:8000/api/files/${fileId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.is_public) {
          setFile(data);
        } else {
          // File is not public, check if user is authenticated
          const token = zkpService.getToken();
          if (token) {
            // User is authenticated, try with auth
            const authResponse = await fetch(`http://localhost:8000/api/files/${fileId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (authResponse.ok) {
              const authData = await authResponse.json();
              setFile(authData);
            } else {
              setError('This file is private and you do not have access to it.');
            }
          } else {
            // User is not authenticated, redirect to login
            setError('This file requires authentication. Please log in to access it.');
          }
        }
      } else if (response.status === 404) {
        setError('File not found. The file may have been deleted or the link is invalid.');
      } else if (response.status === 403) {
        setError('Access denied. This file is private and requires proper permissions.');
      } else {
        setError('Failed to load file information.');
      }
    } catch (error) {
      console.error('Error loading public file:', error);
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    if (fileId) {
      loadPublicFile();
    }
  }, [fileId, loadPublicFile]);

  const handleDownload = async () => {
    if (!file) return;

    try {
      setDownloading(true);
      
      const token = zkpService.getToken();
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:8000/api/files/${file.file_id}/download`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.download_url) {
          // Open download URL
          window.open(data.download_url, '_blank');
          
          // Update view count
          setFile(prev => prev ? { ...prev, download_count: prev.download_count + 1 } : null);
        } else {
          setError('Failed to generate download URL');
        }
      } else if (response.status === 401 || response.status === 403) {
        setError('Authentication required for download. Please log in.');
      } else {
        setError('Download failed. Please try again.');
      }
    } catch (error) {
      console.error('Download error:', error);
      setError('Download failed due to network error.');
    } finally {
      setDownloading(false);
    }
  };

  const handleLogin = () => {
    // Redirect to login with return URL
    navigate(`/login?returnTo=/public/${fileId}`);
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

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading file...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        {error.includes('authentication') && (
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button variant="contained" onClick={handleLogin}>
              Log In to Access File
            </Button>
          </Box>
        )}
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/')}>
            Go to Home
          </Button>
        </Box>
      </Container>
    );
  }

  if (!file) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="info">
          File not found.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <FilePresent sx={{ fontSize: 48, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {file.display_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Shared by {file.owner.username}
              </Typography>
            </Box>
          </Box>

          {/* File Info */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip
                icon={<Public />}
                label="Public File"
                color="success"
                variant="outlined"
              />
              <Chip
                icon={<Storage />}
                label={formatFileSize(file.file_size)}
                variant="outlined"
              />
              <Chip
                icon={<Visibility />}
                label={`${file.view_count} views`}
                variant="outlined"
              />
              <Chip
                icon={<Download />}
                label={`${file.download_count} downloads`}
                variant="outlined"
              />
            </Box>

            <Typography variant="body1" color="text.secondary">
              <strong>File Type:</strong> {file.mime_type}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              <strong>Original Name:</strong> {file.filename}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              <strong>Uploaded:</strong> {formatDate(file.created_at)}
            </Typography>
          </Box>

          {file.description && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1">
                  {file.description}
                </Typography>
              </Box>
            </>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={downloading ? <CircularProgress size={20} /> : <Download />}
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? 'Downloading...' : 'Download File'}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/')}
            >
              Browse More Files
            </Button>
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              This file is shared via ZKP File Sharing System
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default PublicFileAccess; 