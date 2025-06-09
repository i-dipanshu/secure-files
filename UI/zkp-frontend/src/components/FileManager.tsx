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
  LinearProgress,
  Alert,
  CircularProgress,
  Snackbar,
  IconButton,
  Menu,
  MenuItem,
  Switch,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload,
  Download,
  Delete,
  Edit,
  MoreVert,
  FolderOpen,
  FilePresent,
  Storage,
  Refresh,
  Share,
  Link as LinkIcon,
  Visibility,
} from '@mui/icons-material';
import { zkpService } from '../services/zkpService';

interface FileInfo {
  file_id: string;
  filename: string;
  display_name: string;
  file_size: number;
  mime_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  description?: string;
  tags: string[];
  download_count: number;
  view_count: number;
}

interface StorageInfo {
  storage_used: number;
  storage_limit: number;
  file_count: number;
  storage_percentage: number;
}

const FileManager: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuFileId, setMenuFileId] = useState<string | null>(null);
  const [creatingShare, setCreatingShare] = useState(false);
  const [showDeletedFiles, setShowDeletedFiles] = useState(false);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    display_name: '',
    description: '',
    tags: '',
  });

  // Edit form state
  const [editFileData, setEditFileData] = useState({
    display_name: '',
    description: '',
    tags: '',
  });

  // Share form state
  const [shareEmail, setShareEmail] = useState('');
  const [shareExpiry, setShareExpiry] = useState(7);

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const loadFiles = useCallback(async () => {
    try {
      const token = zkpService.getToken();
      if (!token) {
        console.error('No authentication token');
        return;
      }

      // Build URL with proper status filtering
      let url = 'http://localhost:8000/api/files/';
      if (!showDeletedFiles) {
        // When toggle is OFF, only show ACTIVE files
        url += '?status_filter=active';
      }
      // When toggle is ON, show all files (no status filter)

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
        console.log('Files loaded:', data.files?.length || 0, showDeletedFiles ? '(including deleted)' : '(active only)');
      } else {
        console.error('Failed to load files:', response.status);
        setFiles([]);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      setFiles([]);
    }
  }, [showDeletedFiles]);

  const loadStorageInfo = useCallback(async () => {
    try {
      const token = zkpService.getToken();
      if (!token) return;

      const response = await fetch('http://localhost:8000/api/files/storage/info', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStorageInfo(data);
      }
    } catch (error) {
      console.error('Error loading storage info:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadFiles(), loadStorageInfo()]);
    setLoading(false);
  }, [loadFiles, loadStorageInfo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedUploadFile(file);
      setUploadForm({
        ...uploadForm,
        display_name: file.name,
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedUploadFile) return;

    setUploading(true);
    try {
      const token = zkpService.getToken();
      if (!token) {
        showSnackbar('Authentication required', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedUploadFile);
      formData.append('display_name', uploadForm.display_name);
      formData.append('description', uploadForm.description);
      formData.append('tags', uploadForm.tags);

      console.log('Uploading file:', selectedUploadFile.name, selectedUploadFile.type, selectedUploadFile.size);

      const response = await fetch('http://localhost:8000/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Upload successful:', result);
        showSnackbar('File uploaded successfully!', 'success');
        setUploadDialogOpen(false);
        setSelectedUploadFile(null);
        setUploadForm({ display_name: '', description: '', tags: '' });
        await loadData();
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
        const errorMessage = typeof errorData === 'string' ? errorData : 
                            errorData.detail || 
                            (errorData.message ? errorData.message : 'Upload failed');
        console.error('Upload failed:', errorData);
        showSnackbar(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showSnackbar('Upload failed', 'error');
    } finally {
      setUploading(false);
    }
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
          await loadData(); // Refresh to update view count
        } else {
          showSnackbar('Failed to generate view URL', 'error');
        }
      } else {
        showSnackbar('View failed', 'error');
      }
    } catch (error) {
      console.error('View error:', error);
      showSnackbar('View failed', 'error');
    }
  };

  const handleDownloadFile = async (fileId: string, fileName: string) => {
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
            link.download = fileName || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up blob URL
            window.URL.revokeObjectURL(blobUrl);
            
            showSnackbar('Download started', 'success');
            await loadData(); // Refresh to update download count
          } else {
            showSnackbar('Failed to download file content', 'error');
          }
        } else {
          showSnackbar('Failed to generate download URL', 'error');
        }
      } else {
        showSnackbar('Download failed', 'error');
      }
    } catch (error) {
      console.error('Download error:', error);
      showSnackbar('Download failed', 'error');
    }
  };

  const handleDelete = async (fileId: string) => {
    const file = files.find(f => f.file_id === fileId);
    if (!file) return;

    // Enhanced delete confirmation with sharing consequences warning
    const confirmMessage = `⚠️ DELETE FILE CONFIRMATION ⚠️

File: "${file.display_name}"

IMPORTANT: Deleting this file will:
• Remove it from your file manager
• Revoke access for ALL users you've shared it with
• Make it inaccessible to anyone who had permission to view/download it
• This action cannot be undone

Are you absolutely sure you want to delete this file?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setLoading(true);
      const token = zkpService.getToken();
      if (!token) {
        showSnackbar('Authentication required', 'error');
        return;
      }

      const response = await fetch(`http://localhost:8000/api/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        showSnackbar(`File "${file.display_name}" deleted successfully!`, 'success');
        // Force reload both files and storage info to reflect changes
        await loadData();
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Delete failed' }));
        const errorMessage = typeof errorData === 'string' ? errorData : 
                            errorData.detail || 
                            (errorData.message ? errorData.message : 'Delete failed');
        showSnackbar(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showSnackbar('Delete failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShare = async () => {
    if (!selectedFile) return;

    setCreatingShare(true);
    try {
      const token = zkpService.getToken();
      if (!token) {
        showSnackbar('Authentication required', 'error');
        return;
      }

      // For private sharing, use the backend API for each user
      const sharedUsers = shareEmail.split(',').map(u => u.trim()).filter(u => u);
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
              permission_type: 'read', // Use lowercase to match backend enum
              expires_hours: shareExpiry, // Use shareExpiry instead of shareForm
            }),
          });

          if (response.ok) {
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
        setShareDialogOpen(false);
        setSelectedFile(null);
        setShareEmail('');
      }
      if (failedShares.length > 0) {
        showSnackbar(`Failed to share with: ${failedShares.join(', ')}`, 'error');
      }
      
      await loadData(); // Refresh to update any sharing indicators
    } catch (error) {
      console.error('Share creation error:', error);
      showSnackbar('Failed to create share link', 'error');
    } finally {
      setCreatingShare(false);
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

  const openEditDialog = (file: FileInfo) => {
    setSelectedFile(file);
    setEditFileData({
      display_name: file.display_name,
      description: file.description || '',
      tags: file.tags.join(', '),
    });
    setEditDialogOpen(true);
  };

  const openShareDialog = (fileInfo: FileInfo) => {
    setSelectedFile(fileInfo);
    setShareEmail('');
    setShareExpiry(7);
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

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setSelectedUploadFile(null);
  };

  const handleOpenUploadDialog = () => {
    setUploadDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedFile(null);
  };

  const handleCloseShareDialog = () => {
    setShareDialogOpen(false);
    setSelectedFile(null);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleEditSave = async () => {
    if (!selectedFile) return;

    try {
      const token = zkpService.getToken();
      if (!token) {
        showSnackbar('Authentication required', 'error');
        return;
      }

      const response = await fetch(`http://localhost:8000/api/files/${selectedFile.file_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          display_name: editFileData.display_name,
          description: editFileData.description,
          tags: editFileData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        }),
      });

      if (response.ok) {
        showSnackbar('File updated successfully!', 'success');
        setEditDialogOpen(false);
        setSelectedFile(null);
        await loadData();
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Update failed' }));
        const errorMessage = typeof errorData === 'string' ? errorData : 
                            errorData.detail || 
                            (errorData.message ? errorData.message : 'Update failed');
        showSnackbar(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Edit error:', error);
      showSnackbar('Update failed', 'error');
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
          <FolderOpen sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            File Manager
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Show Deleted Files Toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Show deleted files
            </Typography>
            <Switch
              checked={showDeletedFiles}
              onChange={(e) => setShowDeletedFiles(e.target.checked)}
              size="small"
              color="primary"
            />
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={handleOpenUploadDialog}
          >
            Upload File
          </Button>
        </Box>
      </Box>

      {/* File Status Information */}
      <Box sx={{ mb: 3 }}>
        <Alert 
          severity={showDeletedFiles ? "warning" : "info"} 
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Typography variant="body2">
            {showDeletedFiles 
              ? `Showing ${files.filter(f => f.status === 'active').length} active and ${files.filter(f => f.status === 'deleted').length} deleted files`
              : `Showing ${files.length} active files only`
            }
            {showDeletedFiles && (
              <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                • Deleted files are shown with reduced opacity and cannot be shared or downloaded
              </span>
            )}
          </Typography>
        </Alert>
      </Box>

      {/* Storage Info */}
      {storageInfo && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Storage sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Storage Usage</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={storageInfo.storage_percentage}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            <Typography variant="body2">
              {formatFileSize(storageInfo.storage_used)} / {formatFileSize(storageInfo.storage_limit)}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {storageInfo.file_count} files • {storageInfo.storage_percentage.toFixed(1)}% used
          </Typography>
        </Paper>
      )}

      {/* Files Grid */}
      {!Array.isArray(files) || files.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <FilePresent sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No files uploaded yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload your first file to get started
          </Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {files.map((file) => (
            <Card 
              key={file.file_id} 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                opacity: file.status === 'deleted' ? 0.5 : 1,
                border: file.status === 'deleted' ? '2px dashed #ccc' : 'none',
                position: 'relative',
                backgroundColor: file.status === 'deleted' ? '#fafafa' : 'white'
              }}
            >
              {/* Deleted File Badge */}
              {file.status === 'deleted' && (
                <Tooltip title="This file has been deleted and cannot be shared or downloaded" arrow>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 1,
                      backgroundColor: '#f44336',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      cursor: 'help'
                    }}
                  >
                    DELETED
                  </Box>
                </Tooltip>
              )}
              
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <FilePresent sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography 
                      variant="h6" 
                      component="h3" 
                      sx={{ 
                        fontWeight: 'bold',
                        wordBreak: 'break-word',
                        textDecoration: file.status === 'deleted' ? 'line-through' : 'none'
                      }}
                    >
                      {file.display_name}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, file.file_id)}
                    disabled={file.status === 'deleted'}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {formatFileSize(file.file_size)} • {file.mime_type}
                </Typography>

                {file.description && (
                  <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                    {file.description}
                  </Typography>
                )}

                {file.tags && file.tags.length > 0 && (
                  <Box sx={{ mb: 1 }}>
                    {file.tags.slice(0, 3).map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                    {file.tags.length > 3 && (
                      <Chip
                        label={`+${file.tags.length - 3} more`}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                        color="default"
                        variant="outlined"
                      />
                    )}
                  </Box>
                )}

                <Typography variant="caption" color="text.secondary">
                  Uploaded: {formatDate(file.created_at)}
                </Typography>
                <br />
                <Typography variant="caption" color="text.secondary">
                  Downloads: {file.download_count} • Views: {file.view_count}
                </Typography>
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<Visibility />}
                  onClick={() => handleViewFile(file.file_id)}
                  disabled={file.status === 'deleted'}
                >
                  View
                </Button>
                <Button
                  size="small"
                  startIcon={<Download />}
                  onClick={() => handleDownloadFile(file.file_id, file.display_name)}
                  disabled={file.status === 'deleted'}
                >
                  Download
                </Button>
                <Button
                  size="small"
                  startIcon={<Share />}
                  onClick={() => openShareDialog(file)}
                  disabled={file.status === 'deleted'}
                >
                  Share
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem 
          onClick={() => {
            const file = files.find(f => f.file_id === menuFileId);
            if (file && file.status !== 'deleted') openEditDialog(file);
            handleMenuClose();
          }}
          disabled={files.find(f => f.file_id === menuFileId)?.status === 'deleted'}
        >
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem 
          onClick={() => {
            const file = files.find(f => f.file_id === menuFileId);
            if (file && file.status !== 'deleted') openShareDialog(file);
            handleMenuClose();
          }}
          disabled={files.find(f => f.file_id === menuFileId)?.status === 'deleted'}
        >
          <Share sx={{ mr: 1 }} />
          Share
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (menuFileId) handleDelete(menuFileId);
            handleMenuClose();
          }}
          disabled={files.find(f => f.file_id === menuFileId)?.status === 'deleted'}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1 }} />
          {files.find(f => f.file_id === menuFileId)?.status === 'deleted' ? 'Already Deleted' : 'Delete'}
        </MenuItem>
      </Menu>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Upload File</DialogTitle>
        <DialogContent>
          {selectedUploadFile && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Selected: {selectedUploadFile.name} ({formatFileSize(selectedUploadFile.size)})
            </Alert>
          )}
          
          <input
            type="file"
            onChange={handleFileSelect}
            style={{ marginBottom: '16px', width: '100%' }}
          />

          <TextField
            fullWidth
            label="Display Name"
            value={uploadForm.display_name}
            onChange={(e) => setUploadForm({ ...uploadForm, display_name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={uploadForm.description}
            onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="Tags (comma-separated)"
            value={uploadForm.tags}
            onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
            margin="normal"
            helperText="Enter tags separated by commas"
          />

          {uploading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Upload Progress: {uploading ? 'Uploading...' : 'Upload completed'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={uploading || !selectedUploadFile}
            startIcon={uploading ? <CircularProgress size={16} /> : <CloudUpload />}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit File</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Display Name"
            value={editFileData.display_name}
            onChange={(e) => setEditFileData({ ...editFileData, display_name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={editFileData.description}
            onChange={(e) => setEditFileData({ ...editFileData, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="Tags (comma-separated)"
            value={editFileData.tags}
            onChange={(e) => setEditFileData({ ...editFileData, tags: e.target.value })}
            margin="normal"
            helperText="Enter tags separated by commas"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>
            Cancel
          </Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            startIcon={<Edit />}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={handleCloseShareDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Share File</DialogTitle>
        <DialogContent>
          {selectedFile && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Sharing: {selectedFile.display_name}
            </Alert>
          )}
          
          <TextField
            fullWidth
            label="Share with users (usernames or emails)"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
            margin="normal"
            helperText="Enter usernames or emails separated by commas (e.g., john_doe, jane@example.com)"
            placeholder="username1, username2, user@email.com"
            required
          />

          <TextField
            fullWidth
            type="number"
            label="Expires in days"
            value={shareExpiry}
            onChange={(e) => setShareExpiry(parseInt(e.target.value) || 0)}
            margin="normal"
            helperText="Set to 0 for no expiration"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseShareDialog}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateShare}
            variant="contained"
            disabled={creatingShare || !shareEmail.trim()}
            startIcon={creatingShare ? <CircularProgress size={16} /> : <LinkIcon />}
            sx={{
              background: (creatingShare || !shareEmail.trim()) 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.2) 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              '&.Mui-disabled': {
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.2) 100%)',
                color: 'rgba(255, 255, 255, 0.6)',
                '& .MuiButton-startIcon': {
                  color: 'rgba(255, 255, 255, 0.6)',
                },
              },
              '&:hover:not(.Mui-disabled)': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 8px 16px -4px rgba(16, 185, 129, 0.4)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Share with Users
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert severity={snackbar.severity} onClose={handleSnackbarClose}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FileManager; 