import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Share as ShareIcon,
  People as PeopleIcon,
  Delete as DeleteIcon,
  MoreVert,
  Refresh as RefreshIcon,
  Download,
  Visibility,
  ExpandMore,
  Person,
} from '@mui/icons-material';
import { zkpService } from '../services/zkpService';

interface UserPermission {
  permission_id: string;
  user_id: string;
  username: string;
  email: string;
  permission_type: string;
  granted_at: string;
  expires_at?: string;
  is_active: boolean;
  is_expired: boolean;
}

interface UserSharingGroup {
  username: string;
  user_id: string;
  email: string;
  shared_files: Array<{
    file_id: string;
    filename: string;
    display_name: string;
    permission_type: string;
    granted_at: string;
    expires_at?: string;
    is_expired: boolean;
  }>;
  total_files: number;
}

interface SharedWithMeGroup {
  owner_username: string;
  owner_id: string;
  owner_email: string;
  shared_files: Array<{
    file_id: string;
    filename: string;
    display_name: string;
    file_size: number;
    mime_type: string;
    permission_type: string;
    granted_at: string;
    expires_at?: string;
    is_expired: boolean;
    shared_at: string;
  }>;
  total_files: number;
}

const FileSharing: React.FC = () => {
  const [userSharingGroups, setUserSharingGroups] = useState<UserSharingGroup[]>([]);
  const [sharedWithMeGroups, setSharedWithMeGroups] = useState<SharedWithMeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuFileId, setMenuFileId] = useState<string | null>(null);

  const loadSharedWithMeFiles = useCallback(async () => {
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
        console.log('Shared with me API response:', data);
        
        const sharedFiles = data.files || [];
        
        // Group files by owner
        const ownerGroups: { [ownerId: string]: SharedWithMeGroup } = {};

        sharedFiles.forEach((file: any) => {
          const ownerId = file.owner?.id || file.owner?.user_id || file.owner_id || 'unknown';
          const ownerUsername = file.owner?.username || 'Unknown User';
          const ownerEmail = file.owner?.email || '';

          if (!ownerGroups[ownerId]) {
            ownerGroups[ownerId] = {
              owner_username: ownerUsername,
              owner_id: ownerId,
              owner_email: ownerEmail,
              shared_files: [],
              total_files: 0,
            };
          }

          // Only add active, non-expired permissions
          const isExpired = file.expires_at ? new Date(file.expires_at) < new Date() : false;
          if (file.is_active !== false && !isExpired) {
            ownerGroups[ownerId].shared_files.push({
              file_id: file.file_id,
              filename: file.filename,
              display_name: file.display_name || file.filename,
              file_size: file.file_size,
              mime_type: file.mime_type,
              permission_type: file.permission_type || 'read',
              granted_at: file.shared_at || file.granted_at || file.created_at,
              expires_at: file.expires_at,
              is_expired: isExpired,
              shared_at: file.shared_at || file.granted_at || file.created_at,
            });
            ownerGroups[ownerId].total_files++;
          }
        });

        // Filter out owners with no active files
        const activeGroups = Object.values(ownerGroups).filter(group => group.total_files > 0);
        setSharedWithMeGroups(activeGroups);
        console.log('Shared with me groups loaded:', activeGroups);
      } else {
        console.error('Failed to load shared files:', response.status);
        setSharedWithMeGroups([]);
      }
    } catch (error) {
      console.error('Error loading shared with me files:', error);
      setSharedWithMeGroups([]);
    }
  }, []);

  const loadUserSharingGroups = useCallback(async () => {
    try {
      const token = zkpService.getToken();
      if (!token) {
        console.error('No authentication token');
        return;
      }

      // Get user's own files first
      const filesResponse = await fetch('http://localhost:8000/api/files/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!filesResponse.ok) {
        console.error('Failed to load user files');
        return;
      }

      const filesData = await filesResponse.json();
      const userFiles = filesData.files || [];

      // For each file, get its permissions to build user sharing groups
      const allPermissions: Array<{
        file: any;
        permissions: UserPermission[];
      }> = [];

      await Promise.all(
        userFiles.map(async (file: any) => {
          try {
            const permResponse = await fetch(`http://localhost:8000/api/files/${file.file_id}/permissions`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            if (permResponse.ok) {
              const permData = await permResponse.json();
              const permissions = permData.permissions || [];
              
              // Filter only active, non-expired permissions
              const activePermissions = permissions.filter((perm: UserPermission) => {
                const isExpired = perm.expires_at ? new Date(perm.expires_at) < new Date() : false;
                return perm.is_active && !isExpired;
              });
              
              if (activePermissions.length > 0) {
                allPermissions.push({
                  file: file,
                  permissions: activePermissions
                });
              }
            }
          } catch (error) {
            console.error(`Error getting permissions for file ${file.file_id}:`, error);
          }
        })
      );

      // Group permissions by user
      const userGroups: { [userId: string]: UserSharingGroup } = {};

      allPermissions.forEach(({ file, permissions }) => {
        permissions.forEach((perm: UserPermission) => {
          if (!userGroups[perm.user_id]) {
            userGroups[perm.user_id] = {
              username: perm.username,
              user_id: perm.user_id,
              email: perm.email,
              shared_files: [],
              total_files: 0,
            };
          }

          const isExpired = perm.expires_at ? new Date(perm.expires_at) < new Date() : false;
          userGroups[perm.user_id].shared_files.push({
            file_id: file.file_id,
            filename: file.filename,
            display_name: file.display_name || file.filename,
            permission_type: perm.permission_type,
            granted_at: perm.granted_at,
            expires_at: perm.expires_at,
            is_expired: isExpired,
          });
          userGroups[perm.user_id].total_files++;
        });
      });

      setUserSharingGroups(Object.values(userGroups));
      console.log('User sharing groups loaded:', Object.values(userGroups));
    } catch (error) {
      console.error('Error loading user sharing groups:', error);
      setUserSharingGroups([]);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadSharedWithMeFiles(), loadUserSharingGroups()]);
    } finally {
      setLoading(false);
    }
  }, [loadSharedWithMeFiles, loadUserSharingGroups]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleRevokeUserAccess = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to revoke all file access for ${username}?`)) return;

    try {
      const token = zkpService.getToken();
      if (!token) {
        showSnackbar('Authentication required', 'error');
        return;
      }

      // Find all files shared with this user and revoke access to each
      const userGroup = userSharingGroups.find(group => group.user_id === userId);
      if (!userGroup) {
        showSnackbar('User sharing group not found', 'error');
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const sharedFile of userGroup.shared_files) {
        try {
          const response = await fetch(`http://localhost:8000/api/files/${sharedFile.file_id}/share/${userId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            successCount++;
          } else {
            console.error(`Failed to revoke access to file ${sharedFile.display_name}`);
            failCount++;
          }
        } catch (error) {
          console.error(`Error revoking access to file ${sharedFile.display_name}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        showSnackbar(`Revoked access to ${successCount} file(s) for ${username}`, 'success');
        // Force reload data to refresh UI
        await loadData();
      }
      if (failCount > 0) {
        showSnackbar(`Failed to revoke access to ${failCount} file(s)`, 'error');
      }
    } catch (error) {
      console.error('Revoke access error:', error);
      showSnackbar('Failed to revoke access', 'error');
    }
  };

  const handleRevokeFileAccess = async (fileId: string, userId: string, filename: string, username: string) => {
    if (!window.confirm(`Are you sure you want to revoke ${username}'s access to "${filename}"?`)) return;

    try {
      const token = zkpService.getToken();
      if (!token) {
        showSnackbar('Authentication required', 'error');
        return;
      }

      const response = await fetch(`http://localhost:8000/api/files/${fileId}/share/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        showSnackbar(`Revoked ${username}'s access to "${filename}"`, 'success');
        // Force reload data to refresh UI
        await loadData();
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to revoke access' }));
        const errorMessage = typeof errorData === 'string' ? errorData : 
                            errorData.detail || 
                            (errorData.message ? errorData.message : 'Failed to revoke access');
        showSnackbar(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Revoke access error:', error);
      showSnackbar('Failed to revoke access', 'error');
    }
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

  const handleViewFile = async (fileId: string) => {
    try {
      const token = zkpService.getToken();
      if (!token) {
        showSnackbar('Authentication required', 'error');
        return;
      }

      const response = await fetch(`http://localhost:8000/api/files/${fileId}/download`, {
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

  const handleDownloadFile = async (fileId: string, filename: string) => {
    try {
      const token = zkpService.getToken();
      if (!token) {
        showSnackbar('Authentication required', 'error');
        return;
      }

      const response = await fetch(`http://localhost:8000/api/files/${fileId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.download_url) {
          // Fetch the actual file content as blob
          const fileResponse = await fetch(data.download_url);
          if (fileResponse.ok) {
            const blob = await fileResponse.blob();
            
            // Create blob URL and trigger download
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up blob URL
            window.URL.revokeObjectURL(blobUrl);
            
            showSnackbar('Download started', 'success');
          } else {
            showSnackbar('Failed to download file content', 'error');
          }
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
        {/* Active User Sharing - Files I've shared */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Files I've Shared</Typography>
            </Box>

            {userSharingGroups.length === 0 ? (
              <Alert severity="info">
                No files are currently shared with other users. Go to File Manager to share your files.
              </Alert>
            ) : (
              <Box>
                {userSharingGroups.map((userGroup) => (
                  <Accordion key={userGroup.user_id} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 32, height: 32 }}>
                          <Person />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {userGroup.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {userGroup.email} • {userGroup.total_files} file(s) shared
                          </Typography>
                        </Box>
                        <Tooltip title="Revoke all access">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRevokeUserAccess(userGroup.user_id, userGroup.username);
                            }}
                            sx={{ ml: 1 }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {userGroup.shared_files.map((file, index) => (
                          <React.Fragment key={file.file_id}>
                            <ListItem>
                              <ListItemText
                                primary={file.display_name}
                                secondary={
                                  <Box>
                                    <Typography variant="caption" display="block">
                                      Permission: {file.permission_type} • Granted: {formatDate(file.granted_at)}
                                    </Typography>
                                    {file.expires_at && (
                                      <Chip
                                        label={file.is_expired ? 'Expired' : `Expires: ${formatDate(file.expires_at)}`}
                                        size="small"
                                        color={file.is_expired ? 'error' : 'warning'}
                                        sx={{ mt: 0.5 }}
                                      />
                                    )}
                                  </Box>
                                }
                              />
                              <ListItemSecondaryAction>
                                <Tooltip title="Revoke access to this file">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRevokeFileAccess(
                                      file.file_id,
                                      userGroup.user_id,
                                      file.display_name,
                                      userGroup.username
                                    )}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </ListItemSecondaryAction>
                            </ListItem>
                            {index < userGroup.shared_files.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Files Shared With Me - Organized by Owner */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ShareIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Files Shared With Me</Typography>
            </Box>

            {sharedWithMeGroups.length === 0 ? (
              <Alert severity="info">
                No files have been shared with you yet.
              </Alert>
            ) : (
              <Box>
                {sharedWithMeGroups.map((ownerGroup) => (
                  <Accordion key={ownerGroup.owner_id} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'secondary.main', width: 32, height: 32 }}>
                          <Person />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {ownerGroup.owner_username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {ownerGroup.owner_email} • {ownerGroup.total_files} file(s) shared with you
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {ownerGroup.shared_files.map((file, index) => (
                          <React.Fragment key={file.file_id}>
                            <ListItem>
                              <ListItemText
                                primary={file.display_name}
                                secondary={
                                  <Box>
                                    <Typography variant="caption" display="block">
                                      {formatFileSize(file.file_size)} • {file.mime_type}
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                      Permission: {file.permission_type} • Shared: {formatDate(file.shared_at)}
                                    </Typography>
                                    {file.expires_at && (
                                      <Chip
                                        label={file.is_expired ? 'Expired' : `Expires: ${formatDate(file.expires_at)}`}
                                        size="small"
                                        color={file.is_expired ? 'error' : 'warning'}
                                        sx={{ mt: 0.5 }}
                                      />
                                    )}
                                  </Box>
                                }
                              />
                              <ListItemSecondaryAction>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="View file">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleViewFile(file.file_id)}
                                    >
                                      <Visibility />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Download file">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDownloadFile(file.file_id, file.display_name)}
                                    >
                                      <Download />
                                    </IconButton>
                                  </Tooltip>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => handleMenuOpen(e, file.file_id)}
                                  >
                                    <MoreVert />
                                  </IconButton>
                                </Box>
                              </ListItemSecondaryAction>
                            </ListItem>
                            {index < ownerGroup.shared_files.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
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
              <strong>User-Based Sharing:</strong> Share files directly with specific users by username or email.
            </Typography>
          </Alert>
          <Alert severity="warning" sx={{ height: '100%' }}>
            <Typography variant="body2">
              <strong>Access Control:</strong> You can revoke access for individual files or all files shared with a user.
            </Typography>
          </Alert>
          <Alert severity="success" sx={{ height: '100%' }}>
            <Typography variant="body2">
              <strong>Auto-Cleanup:</strong> Expired or revoked permissions are automatically filtered out from the interface.
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
          if (menuFileId) handleViewFile(menuFileId);
          handleMenuClose();
        }}>
          <Visibility sx={{ mr: 1 }} />
          View
        </MenuItem>
        <MenuItem onClick={() => {
          if (menuFileId) {
            const file = sharedWithMeGroups
              .flatMap(group => group.shared_files)
              .find(f => f.file_id === menuFileId);
            if (file) handleDownloadFile(menuFileId, file.display_name);
          }
          handleMenuClose();
        }}>
          <Download sx={{ mr: 1 }} />
          Download
        </MenuItem>
      </Menu>

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