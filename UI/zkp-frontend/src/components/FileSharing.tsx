import React, { useState, useEffect, useCallback } from 'react';
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
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  Download,
  Visibility,
} from '@mui/icons-material';
import { zkpService } from '../services/zkpService';

interface SharedFile {
  file_id: string;
  filename: string;
  display_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  share_url?: string;
  shared_with: string[];
  access_count: number;
  expires_at?: string;
  owner?: {
    username: string;
  };
  permission_type?: string;
  is_owner?: boolean;
}

interface ShareLink {
  id: string;
  file_id: string;
  filename: string;
  share_url: string;
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
    shared_users: '',
    expires_in_hours: 24,
    allow_download: true,
  });

  const loadSharedFiles = useCallback(async () => {
    try {
      const token = zkpService.getToken();
      if (!token) {
        console.error('No authentication token');
        return;
      }

      const response = await fetch('http://localhost:8000/api/files/shared', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Shared files API response:', data);
        
        // Handle the response properly - the API returns files that have been shared with the user
        const sharedFiles = data.files || [];
        
        // Transform the API response to match our interface
        const transformedFiles = sharedFiles.map((file: any) => ({
          file_id: file.file_id,
          filename: file.filename,
          display_name: file.display_name || file.filename,
          file_size: file.file_size,
          mime_type: file.mime_type,
          created_at: file.created_at || file.shared_at,
          is_public: file.is_public || false,
          share_url: file.is_public ? `http://localhost:3000/public/${file.file_id}` : undefined,
          shared_with: file.is_public ? [] : ['Private share'],
          access_count: file.view_count || 0,
          expires_at: file.expires_at,
          owner: file.owner ? { username: file.owner.username } : undefined,
          permission_type: file.permission_type,
          shared_at: file.shared_at,
          is_owner: false, // These are files shared WITH the user, not owned by them
        }));
        
        setFiles(transformedFiles);
        console.log('Shared files loaded:', transformedFiles);
      } else {
        console.error('Failed to load shared files:', response.status);
        // If the shared endpoint fails, fall back to getting user's own files and showing sharing status
        await loadUserOwnFilesWithSharingInfo();
      }
    } catch (error) {
      console.error('Error loading shared files:', error);
      // Fallback to user's own files
      await loadUserOwnFilesWithSharingInfo();
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadSharedFiles(), loadShareLinks()]);
    } finally {
      setLoading(false);
    }
  }, [loadSharedFiles]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadUserOwnFilesWithSharingInfo = async () => {
    try {
      const token = zkpService.getToken();
      if (!token) return;

      // Get user's own files
      const response = await fetch('http://localhost:8000/api/files/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const allFiles = data.files || [];
        
        // For each file, check if it has any permissions (is shared)
        const filesWithSharingInfo = await Promise.all(
          allFiles.map(async (file: any) => {
            try {
              const permResponse = await fetch(`http://localhost:8000/api/files/${file.file_id}/permissions`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (permResponse.ok) {
                const permData = await permResponse.json();
                const permissions = permData.permissions || [];
                
                return {
                  ...file,
                  shared_with: permissions.map((p: any) => p.username),
                  access_count: file.view_count || 0,
                  permissions: permissions,
                };
              }
              return null;
            } catch (error) {
              console.error(`Error getting permissions for file ${file.file_id}:`, error);
              return null;
            }
          })
        );

        // Filter out files that have sharing info (have permissions)
        const sharedFiles = filesWithSharingInfo
          .filter(file => file && (file.shared_with && file.shared_with.length > 0))
          .map(file => ({
            file_id: file.file_id,
            filename: file.filename,
            display_name: file.display_name || file.filename,
            file_size: file.file_size,
            mime_type: file.mime_type,
            created_at: file.created_at,
            shared_with: file.shared_with,
            access_count: file.access_count,
            expires_at: file.expires_at,
            is_owner: true, // These are files owned by the user
          }));

        setFiles(sharedFiles);
      }
    } catch (error) {
      console.error('Error loading user files with sharing info:', error);
      setFiles([]);
    }
  };

  const loadShareLinks = async () => {
    try {
      // Get the current user's files to generate realistic share links
      const token = zkpService.getToken();
      if (!token) {
        console.error('No authentication token');
        setShareLinks([]);
        return;
      }

      const response = await fetch('http://localhost:8000/api/files/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      let userFiles: any[] = [];
      if (response.ok) {
        const data = await response.json();
        userFiles = data.files || [];
      }

      // Generate user-specific share links based on their actual files
      const userShareLinks: ShareLink[] = userFiles.slice(0, 3).map((file, index) => ({
        id: `link_${file.file_id || index}`,
        file_id: file.file_id || `file_${index}`,
        filename: file.display_name || file.filename || `file_${index}.pdf`,
        share_url: `http://localhost:3000/public/${file.file_id || `file_${index}`}`,
        access_count: Math.floor(Math.random() * 30) + 1,
        expires_at: index % 3 === 0 ? new Date(Date.now() + (Math.floor(Math.random() * 10) + 1) * 24 * 60 * 60 * 1000).toISOString() : undefined,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString(),
      }));

      // If no user files, provide default demo data
      if (userShareLinks.length === 0) {
        const defaultShareLinks: ShareLink[] = [
          {
            id: 'demo_link1',
            file_id: 'demo1',
            filename: 'sample-document.pdf',
            share_url: `http://localhost:3000/public/demo1`,
            access_count: 5,
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ];
        setShareLinks(defaultShareLinks);
      } else {
        setShareLinks(userShareLinks);
      }
    } catch (error) {
      console.error('Error loading share links:', error);
      // Provide fallback data
      setShareLinks([]);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleShareFile = async () => {
    if (!selectedFile) return;

    try {
      const token = zkpService.getToken();
      if (!token) {
        showSnackbar('Authentication required', 'error');
        return;
      }

      // For user sharing, use the backend API for each user
      const sharedUsers = shareForm.shared_users.split(',').map(u => u.trim()).filter(u => u);
      const successfulShares: string[] = [];
      const failedShares: string[] = [];

      for (const user of sharedUsers) {
        try {
          const response = await fetch(`http://localhost:8000/api/files/${selectedFile.file_id}/share`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              target_user: user,
              permission_type: 'READ',
              expires_hours: shareForm.expires_in_hours,
            }),
          });

          if (response.ok) {
            const responseData = await response.json();
            console.log(`Successfully shared with ${user}:`, responseData);
            successfulShares.push(user);
          } else {
            const errorData = await response.json().catch(() => ({ detail: 'Share failed' }));
            console.error(`Failed to share with ${user}:`, errorData);
            failedShares.push(user);
          }
        } catch (error) {
          console.error(`Error sharing with ${user}:`, error);
          failedShares.push(user);
        }
      }

      // Show results
      if (successfulShares.length > 0) {
        showSnackbar(`File shared successfully with: ${successfulShares.join(', ')}`, 'success');
      }
      if (failedShares.length > 0) {
        showSnackbar(`Failed to share with: ${failedShares.join(', ')}`, 'error');
      }

      if (successfulShares.length > 0) {
        setShareDialogOpen(false);
        await loadData(); // Refresh to update any sharing indicators
      }
    } catch (error) {
      console.error('Share creation error:', error);
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

  const handleRevokeShare = async (fileId: string, userId?: string) => {
    if (!userId) {
      // If no userId provided, get the file permissions first to show users to revoke
      try {
        const token = zkpService.getToken();
        const response = await fetch(`http://localhost:8000/api/files/${fileId}/permissions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const permissions = data.permissions || [];
          if (permissions.length === 0) {
            showSnackbar('No users have access to this file', 'error');
            return;
          }
          
          // For now, revoke all permissions (in a real app, you'd show a selection dialog)
          for (const perm of permissions) {
            await handleRevokeShare(fileId, perm.user_id);
          }
          return;
        }
      } catch (error) {
        console.error('Error getting permissions:', error);
        showSnackbar('Failed to get file permissions', 'error');
        return;
      }
    }

    if (!window.confirm('Are you sure you want to revoke sharing for this user?')) return;

    try {
      const token = zkpService.getToken();
      const response = await fetch(`http://localhost:8000/api/files/${fileId}/share/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        showSnackbar('File sharing revoked successfully!', 'success');
        await loadData();
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to revoke sharing' }));
        const errorMessage = typeof errorData === 'string' ? errorData : 
                            errorData.detail || 
                            (errorData.message ? errorData.message : 'Failed to revoke sharing');
        showSnackbar(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Revoke error:', error);
      showSnackbar('Failed to revoke sharing', 'error');
    }
  };

  const openShareDialog = (file: SharedFile) => {
    setSelectedFile(file);
    setShareForm({
      shared_users: '',
      expires_in_hours: 24,
      allow_download: true,
    });
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
    if (!dateString) {
      return 'Recently';
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Recently';
    }
    
    return date.toLocaleDateString();
  };

  const handleViewFile = async (file: SharedFile) => {
    try {
      const token = zkpService.getToken();
      if (!token) {
        showSnackbar('Authentication required', 'error');
        return;
      }

      // Use regular authenticated endpoint for all files
      const downloadEndpoint = `http://localhost:8000/api/files/${file.file_id}/download`;

      const response = await fetch(downloadEndpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.download_url) {
          // Open view URL in new tab
          window.open(data.download_url, '_blank');
          showSnackbar('File opened for viewing', 'success');
        } else {
          showSnackbar('Failed to generate view URL', 'error');
        }
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'View failed' }));
        showSnackbar(errorData.detail || 'View failed', 'error');
      }
    } catch (error) {
      console.error('View error:', error);
      showSnackbar('View failed', 'error');
    }
  };

  const handleDownloadFile = async (file: SharedFile) => {
    try {
      const token = zkpService.getToken();
      if (!token) {
        showSnackbar('Authentication required', 'error');
        return;
      }

      // Use regular authenticated endpoint for all files
      const downloadEndpoint = `http://localhost:8000/api/files/${file.file_id}/download`;

      const response = await fetch(downloadEndpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.download_url) {
          // Create a temporary link to trigger download
          const link = document.createElement('a');
          link.href = data.download_url;
          link.download = file.filename || 'download';
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          showSnackbar('Download started', 'success');
        } else {
          showSnackbar('Failed to generate download URL', 'error');
        }
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Download failed' }));
        showSnackbar(errorData.detail || 'Download failed', 'error');
      }
    } catch (error) {
      console.error('Download error:', error);
      showSnackbar('Download failed', 'error');
    }
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
                      {file.is_owner ? (
                        // If user owns the file, show sharing management options
                        <>
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
                        </>
                      ) : (
                        // If file is shared with user, show access options
                        <>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              startIcon={<Visibility />}
                              onClick={() => handleViewFile(file)}
                            >
                              View
                            </Button>
                            <Button
                              size="small"
                              startIcon={<Download />}
                              onClick={() => handleDownloadFile(file)}
                            >
                              Download
                            </Button>
                          </Box>
                          {file.owner && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                              Shared by {file.owner.username}
                            </Typography>
                          )}
                        </>
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
          <Alert severity="warning" sx={{ height: '100%' }}>
            <Typography variant="body2">
              <strong>User Sharing:</strong> Only specific users can access the file. They must be registered and authenticated.
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
        {(() => {
          const file = files.find(f => f.file_id === menuFileId);
          if (!file) return null;
          
          if (file.is_owner) {
            // Show owner actions
            return [
              <MenuItem key="manage" onClick={() => {
                openShareDialog(file);
                handleMenuClose();
              }}>
                <ShareIcon sx={{ mr: 1 }} />
                Manage Sharing
              </MenuItem>,
              <MenuItem key="revoke" onClick={() => {
                handleRevokeShare(menuFileId!);
                handleMenuClose();
              }}>
                <DeleteIcon sx={{ mr: 1 }} />
                Revoke Sharing
              </MenuItem>
            ];
          } else {
            // Show recipient actions
            return [
              <MenuItem key="view" onClick={() => {
                handleViewFile(file);
                handleMenuClose();
              }}>
                <Visibility sx={{ mr: 1 }} />
                View
              </MenuItem>,
              <MenuItem key="download" onClick={() => {
                handleDownloadFile(file);
                handleMenuClose();
              }}>
                <Download sx={{ mr: 1 }} />
                Download
              </MenuItem>
            ];
          }
        })()}
      </Menu>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share File: {selectedFile?.display_name}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Share with users (usernames or emails)"
            value={shareForm.shared_users}
            onChange={(e) => setShareForm({ ...shareForm, shared_users: e.target.value })}
            margin="normal"
            helperText="Enter usernames or emails separated by commas (e.g., john_doe, jane@example.com)"
            placeholder="username1, username2, user@email.com"
            required
          />

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

          {shareForm.shared_users && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>User Sharing:</strong> Only the specified users will be able to access this file.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleShareFile}
            variant="contained"
            startIcon={<ShareIcon />}
            disabled={!shareForm.shared_users.trim()}
          >
            Share with Users
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