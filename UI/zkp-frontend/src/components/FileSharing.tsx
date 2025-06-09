import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Alert,
  CircularProgress,
  Snackbar,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  FormControlLabel,
  Switch,
  Tooltip,
} from '@mui/material';
import {
  Share as ShareIcon,
  Link as LinkIcon,
  People as PeopleIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  MoreVert,
  Add as AddIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { zkpService } from '../services/zkpService';

interface SharedFile {
  file_id: string;
  filename: string;
  display_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  is_public: boolean;
  share_url?: string;
  shared_with: string[];
  access_count: number;
  expires_at?: string;
}

interface ShareLink {
  id: string;
  file_id: string;
  filename: string;
  share_url: string;
  is_public: boolean;
  expires_at?: string;
  access_count: number;
  created_at: string;
}

const FileSharing: React.FC = () => {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SharedFile | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuFileId, setMenuFileId] = useState<string | null>(null);

  // Share form state
  const [shareForm, setShareForm] = useState({
    is_public: false,
    expires_in_hours: 24,
    shared_users: '',
    allow_download: true,
    require_auth: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadSharedFiles(), loadShareLinks()]);
    } finally {
      setLoading(false);
    }
  };

  const loadSharedFiles = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/files/', {
        headers: {
          'Authorization': `Bearer ${zkpService.getToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter only files that have been shared
        const sharedFiles = data.files?.filter((file: any) => 
          file.is_public || file.shared_with?.length > 0
        ) || [];
        setFiles(sharedFiles);
      }
    } catch (error) {
      console.error('Error loading shared files:', error);
    }
  };

  const loadShareLinks = async () => {
    try {
      // Mock data for share links - in real implementation, this would come from an API
      const mockShareLinks: ShareLink[] = [
        {
          id: '1',
          file_id: 'file1',
          filename: 'document.pdf',
          share_url: 'https://yourapp.com/share/abc123',
          is_public: true,
          access_count: 15,
          created_at: new Date().toISOString(),
        },
      ];
      setShareLinks(mockShareLinks);
    } catch (error) {
      console.error('Error loading share links:', error);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleShareFile = async () => {
    if (!selectedFile) return;

    try {
      const response = await fetch(`http://localhost:8000/api/files/${selectedFile.file_id}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${zkpService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_public: shareForm.is_public,
          expires_in_hours: shareForm.expires_in_hours,
          shared_users: shareForm.shared_users.split(',').map(u => u.trim()).filter(u => u),
          allow_download: shareForm.allow_download,
          require_auth: shareForm.require_auth,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showSnackbar(`File shared successfully! Share URL: ${data.share_url}`, 'success');
        setShareDialogOpen(false);
        setSelectedFile(null);
        setShareForm({
          is_public: false,
          expires_in_hours: 24,
          shared_users: '',
          allow_download: true,
          require_auth: false,
        });
        await loadData();
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.detail || 'Failed to share file', 'error');
      }
    } catch (error) {
      console.error('Share error:', error);
      showSnackbar('Failed to share file', 'error');
    }
  };

  const handleCopyShareLink = (shareUrl: string) => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      showSnackbar('Share link copied to clipboard!', 'success');
    }).catch(() => {
      showSnackbar('Failed to copy link', 'error');
    });
  };

  const handleRevokeShare = async (fileId: string) => {
    if (!window.confirm('Are you sure you want to revoke sharing for this file?')) return;

    try {
      const response = await fetch(`http://localhost:8000/api/files/${fileId}/share`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${zkpService.getToken()}`,
        },
      });

      if (response.ok) {
        showSnackbar('File sharing revoked successfully!', 'success');
        await loadData();
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.detail || 'Failed to revoke sharing', 'error');
      }
    } catch (error) {
      console.error('Revoke error:', error);
      showSnackbar('Failed to revoke sharing', 'error');
    }
  };

  const openShareDialog = (file: SharedFile) => {
    setSelectedFile(file);
    setShareDialogOpen(true);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, fileId: string) => {
    setAnchorEl(event.currentTarget);
    setMenuFileId(fileId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuFileId(null);
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ShareIcon sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            File Sharing
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadData}
        >
          Refresh
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* Active Share Links */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LinkIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Active Share Links</Typography>
            </Box>

            {shareLinks.length === 0 ? (
              <Alert severity="info">
                No active share links. Share a file to create a shareable link.
              </Alert>
            ) : (
              <List>
                {shareLinks.map((link) => (
                  <ListItem key={link.id} divider>
                    <ListItemText
                      primary={link.filename}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            {link.access_count} accesses • Created {formatDate(link.created_at)}
                          </Typography>
                          <Typography variant="caption" display="block" color="primary">
                            {link.share_url}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Copy Link">
                        <IconButton onClick={() => handleCopyShareLink(link.share_url)}>
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Revoke">
                        <IconButton onClick={() => handleRevokeShare(link.file_id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        {/* Shared Files */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Shared Files</Typography>
            </Box>

            {files.length === 0 ? (
              <Alert severity="info">
                No files shared yet. Go to File Manager to share your files.
              </Alert>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                }}
              >
                {files.map((file) => (
                  <Card key={file.file_id} variant="outlined">
                    <CardContent sx={{ pb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle1" noWrap title={file.display_name}>
                            {file.display_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatFileSize(file.file_size)} • {file.mime_type}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {file.is_public && (
                              <Chip
                                icon={<PublicIcon />}
                                label="Public"
                                size="small"
                                color="success"
                              />
                            )}
                            {file.shared_with.length > 0 && (
                              <Chip
                                icon={<PeopleIcon />}
                                label={`${file.shared_with.length} users`}
                                size="small"
                                color="primary"
                              />
                            )}
                            {file.expires_at && (
                              <Chip
                                icon={<ScheduleIcon />}
                                label="Expires"
                                size="small"
                                color="warning"
                              />
                            )}
                          </Box>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, file.file_id)}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<ShareIcon />}
                        onClick={() => openShareDialog(file)}
                      >
                        Manage Sharing
                      </Button>
                      {file.share_url && (
                        <Button
                          size="small"
                          startIcon={<CopyIcon />}
                          onClick={() => handleCopyShareLink(file.share_url!)}
                        >
                          Copy Link
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Quick Sharing Tips */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sharing Guidelines
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          <Alert severity="info" sx={{ height: '100%' }}>
            <Typography variant="body2">
              <strong>Public Sharing:</strong> Anyone with the link can access the file without authentication.
            </Typography>
          </Alert>
          <Alert severity="warning" sx={{ height: '100%' }}>
            <Typography variant="body2">
              <strong>Private Sharing:</strong> Only specific users can access the file. They must be registered.
            </Typography>
          </Alert>
          <Alert severity="success" sx={{ height: '100%' }}>
            <Typography variant="body2">
              <strong>Secure:</strong> All shares use encrypted links and can be revoked at any time.
            </Typography>
          </Alert>
        </Box>
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          const file = files.find(f => f.file_id === menuFileId);
          if (file) openShareDialog(file);
          handleMenuClose();
        }}>
          <ShareIcon sx={{ mr: 1 }} />
          Manage Sharing
        </MenuItem>
        <MenuItem onClick={() => {
          if (menuFileId) handleRevokeShare(menuFileId);
          handleMenuClose();
        }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Revoke Sharing
        </MenuItem>
      </Menu>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share File: {selectedFile?.display_name}</DialogTitle>
        <DialogContent>
          <FormControlLabel
            control={
              <Switch 
                checked={shareForm.is_public}
                onChange={(e) => setShareForm({ ...shareForm, is_public: e.target.checked })}
              />
            }
            label="Make publicly accessible"
            sx={{ mb: 2 }}
          />

          {!shareForm.is_public && (
            <TextField
              fullWidth
              label="Share with users (comma-separated emails)"
              value={shareForm.shared_users}
              onChange={(e) => setShareForm({ ...shareForm, shared_users: e.target.value })}
              margin="normal"
              helperText="Enter email addresses of users to share with"
            />
          )}

          <TextField
            fullWidth
            label="Expires in (hours)"
            type="number"
            value={shareForm.expires_in_hours}
            onChange={(e) => setShareForm({ ...shareForm, expires_in_hours: parseInt(e.target.value) || 24 })}
            margin="normal"
            helperText="Link will expire after this many hours (0 for no expiration)"
          />

          <FormControlLabel
            control={
              <Switch 
                checked={shareForm.allow_download}
                onChange={(e) => setShareForm({ ...shareForm, allow_download: e.target.checked })}
              />
            }
            label="Allow downloading"
            sx={{ mt: 2 }}
          />

          <FormControlLabel
            control={
              <Switch 
                checked={shareForm.require_auth}
                onChange={(e) => setShareForm({ ...shareForm, require_auth: e.target.checked })}
              />
            }
            label="Require authentication"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleShareFile}
            variant="contained"
            startIcon={<ShareIcon />}
          >
            Create Share Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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

export default FileSharing; 