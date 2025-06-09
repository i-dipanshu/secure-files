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

      // Get user's own files first (only ACTIVE files)
      const filesResponse = await fetch('http://localhost:8000/api/files/?status_filter=active', {
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
      console.log('User sharing groups loaded:', Object.values(userGroups).length);
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
    const confirmMessage = `⚠️ REVOKE ALL ACCESS CONFIRMATION ⚠️

User: ${username}

IMPORTANT: This will revoke access to ALL files you've shared with this user.
They will immediately lose access to:
• View any shared files
• Download any shared files  
• Any other permissions you've granted

This action cannot be undone. You would need to re-share files individually.

Are you sure you want to revoke ALL file access for ${username}?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setLoading(true);
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
        showSnackbar(`Successfully revoked access to ${successCount} file(s) for ${username}`, 'success');
        // Force reload all data to refresh UI
        await loadData();
      }
      if (failCount > 0) {
        showSnackbar(`Failed to revoke access to ${failCount} file(s)`, 'error');
      }
    } catch (error) {
      console.error('Revoke access error:', error);
      showSnackbar('Failed to revoke access', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeFileAccess = async (fileId: string, userId: string, filename: string, username: string) => {
    const confirmMessage = `⚠️ REVOKE FILE ACCESS CONFIRMATION ⚠️

File: "${filename}"
User: ${username}

This will immediately revoke ${username}'s access to this file.
They will no longer be able to:
• View the file
• Download the file
• Access it in any way

Are you sure you want to revoke ${username}'s access to "${filename}"?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setLoading(true);
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
        // Force reload all data to refresh UI
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
    } finally {
      setLoading(false);
    }
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
    <Box sx={{ p: 4, minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 800,
            background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          File Sharing
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
            Manage your shared files and permissions securely
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadData}
            sx={{
              borderRadius: 2,
              borderWidth: '1.5px',
              '&:hover': {
                borderWidth: '1.5px',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 3 
        }}
      >
        {/* Active User Sharing - Files I've shared */}
        <Box sx={{ flex: '1 1 600px' }}>
          <Card 
            sx={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.1)',
              borderRadius: 3,
              overflow: 'hidden',
              '&:hover': {
                boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
              },
              transition: 'all 0.3s ease-in-out',
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <Box 
                sx={{ 
                  p: 3, 
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
                  borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box 
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: 2, 
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  >
                    <PeopleIcon sx={{ color: 'white', fontSize: 20 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    Files I've Shared
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ p: 3 }}>
                {userSharingGroups.length === 0 ? (
                  <Alert 
                    severity="info" 
                    sx={{ 
                      background: 'linear-gradient(135deg, rgba(54, 184, 255, 0.1) 0%, rgba(54, 184, 255, 0.05) 100%)',
                      border: '1px solid rgba(54, 184, 255, 0.2)',
                    }}
                  >
                    No files are currently shared with other users. Go to File Manager to share your files.
                  </Alert>
                ) : (
                  <Box>
                    {userSharingGroups.map((userGroup) => (
                      <Accordion 
                        key={userGroup.user_id} 
                        sx={{ 
                          mb: 2,
                          borderRadius: 2,
                          border: '1px solid rgba(226, 232, 240, 0.8)',
                          '&:before': { display: 'none' },
                          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                        }}
                      >
                        <AccordionSummary 
                          expandIcon={<ExpandMore />}
                          sx={{
                            borderRadius: 2,
                            '&:hover': {
                              backgroundColor: 'rgba(99, 102, 241, 0.05)',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <Avatar 
                              sx={{ 
                                mr: 2, 
                                bgcolor: 'primary.main', 
                                width: 36, 
                                height: 36,
                                boxShadow: '0 2px 4px -1px rgb(0 0 0 / 0.1)',
                              }}
                            >
                              <Person />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {userGroup.username}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
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
                                sx={{ 
                                  ml: 1,
                                  color: 'error.main',
                                  '&:hover': {
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                  },
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                          <List dense sx={{ pt: 0 }}>
                            {userGroup.shared_files.map((file, index) => (
                              <React.Fragment key={file.file_id}>
                                <ListItem 
                                  sx={{ 
                                    px: 0,
                                    borderRadius: 1,
                                    '&:hover': {
                                      backgroundColor: 'rgba(99, 102, 241, 0.03)',
                                    },
                                  }}
                                >
                                  <ListItemText
                                    primary={
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                        {file.display_name}
                                      </Typography>
                                    }
                                    secondary={
                                      <Box sx={{ mt: 0.5 }}>
                                        <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                          Permission: {file.permission_type} • Granted: {formatDate(file.granted_at)}
                                        </Typography>
                                        {file.expires_at && (
                                          <Chip
                                            label={file.is_expired ? 'Expired' : `Expires: ${formatDate(file.expires_at)}`}
                                            size="small"
                                            color={file.is_expired ? 'error' : 'warning'}
                                            sx={{ mt: 0.5, fontSize: '0.7rem', height: 20 }}
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
                                        sx={{
                                          color: 'error.main',
                                          '&:hover': {
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                          },
                                        }}
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </ListItemSecondaryAction>
                                </ListItem>
                                {index < userGroup.shared_files.length - 1 && <Divider sx={{ my: 0.5 }} />}
                              </React.Fragment>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Files Shared With Me - Organized by Owner */}
        <Box sx={{ flex: '1 1 600px' }}>
          <Card 
            sx={{
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(190, 24, 93, 0.02) 100%)',
              border: '1px solid rgba(236, 72, 153, 0.1)',
              borderRadius: 3,
              overflow: 'hidden',
              '&:hover': {
                boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
              },
              transition: 'all 0.3s ease-in-out',
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <Box 
                sx={{ 
                  p: 3, 
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(190, 24, 93, 0.05) 100%)',
                  borderBottom: '1px solid rgba(236, 72, 153, 0.1)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box 
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: 2, 
                      background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  >
                    <ShareIcon sx={{ color: 'white', fontSize: 20 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                    Files Shared With Me
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ p: 3 }}>
                {sharedWithMeGroups.length === 0 ? (
                  <Alert 
                    severity="info"
                    sx={{ 
                      background: 'linear-gradient(135deg, rgba(54, 184, 255, 0.1) 0%, rgba(54, 184, 255, 0.05) 100%)',
                      border: '1px solid rgba(54, 184, 255, 0.2)',
                    }}
                  >
                    No files have been shared with you yet.
                  </Alert>
                ) : (
                  <Box>
                    {sharedWithMeGroups.map((ownerGroup) => (
                      <Accordion 
                        key={ownerGroup.owner_id} 
                        sx={{ 
                          mb: 2,
                          borderRadius: 2,
                          border: '1px solid rgba(226, 232, 240, 0.8)',
                          '&:before': { display: 'none' },
                          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                        }}
                      >
                        <AccordionSummary 
                          expandIcon={<ExpandMore />}
                          sx={{
                            borderRadius: 2,
                            '&:hover': {
                              backgroundColor: 'rgba(236, 72, 153, 0.05)',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <Avatar 
                              sx={{ 
                                mr: 2, 
                                bgcolor: 'secondary.main', 
                                width: 36, 
                                height: 36,
                                boxShadow: '0 2px 4px -1px rgb(0 0 0 / 0.1)',
                              }}
                            >
                              <Person />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {ownerGroup.owner_username}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                {ownerGroup.owner_email} • {ownerGroup.total_files} file(s) shared with you
                              </Typography>
                            </Box>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                          <List dense sx={{ pt: 0 }}>
                            {ownerGroup.shared_files.map((file, index) => (
                              <React.Fragment key={file.file_id}>
                                <ListItem 
                                  sx={{ 
                                    px: 0,
                                    borderRadius: 1,
                                    '&:hover': {
                                      backgroundColor: 'rgba(236, 72, 153, 0.03)',
                                    },
                                  }}
                                >
                                  <ListItemText
                                    primary={
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                        {file.display_name}
                                      </Typography>
                                    }
                                    secondary={
                                      <Box sx={{ mt: 0.5 }}>
                                        <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                          {formatFileSize(file.file_size)} • {file.mime_type}
                                        </Typography>
                                        <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                          Permission: {file.permission_type} • Shared: {formatDate(file.shared_at)}
                                        </Typography>
                                        {file.expires_at && (
                                          <Chip
                                            label={file.is_expired ? 'Expired' : `Expires: ${formatDate(file.expires_at)}`}
                                            size="small"
                                            color={file.is_expired ? 'error' : 'warning'}
                                            sx={{ mt: 0.5, fontSize: '0.7rem', height: 20 }}
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
                                          sx={{
                                            color: 'info.main',
                                            '&:hover': {
                                              backgroundColor: 'rgba(54, 184, 255, 0.1)',
                                            },
                                          }}
                                        >
                                          <Visibility />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Download file">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleDownloadFile(file.file_id, file.display_name)}
                                          sx={{
                                            color: 'success.main',
                                            '&:hover': {
                                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                            },
                                          }}
                                        >
                                          <Download />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  </ListItemSecondaryAction>
                                </ListItem>
                                {index < ownerGroup.shared_files.length - 1 && <Divider sx={{ my: 0.5 }} />}
                              </React.Fragment>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
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
    </Box>
  );
};

export default FileSharing; 