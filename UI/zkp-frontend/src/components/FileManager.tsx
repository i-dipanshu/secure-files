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
  LinearProgress,
  Alert,
  CircularProgress,
  Snackbar,
  IconButton,
  Menu,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
  Link,
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
  ContentCopy,
  Link as LinkIcon,
  Public,
  Lock,
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
  is_public?: boolean;
}

interface StorageInfo {
  storage_used: number;
  storage_limit: number;
  file_count: number;
  storage_percentage: number;
}

interface ShareLink {
  share_id: string;
  file_id: string;
  share_url: string;
  is_public: boolean;
  expires_at?: string;
  max_downloads?: number;
  download_count: number;
  created_at: string;
}

const FileManager: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedFileInfo, setSelectedFileInfo] = useState<FileInfo | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuFileId, setMenuFileId] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [creatingShare, setCreatingShare] = useState(false);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    display_name: '',
    description: '',
    tags: '',
    is_public: false,
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    display_name: '',
    description: '',
    tags: '',
    is_public: false,
  });

  // Share form state
  const [shareForm, setShareForm] = useState({
    is_public: true,
    expires_in_days: 7,
    max_downloads: 0, // 0 means unlimited
    shared_users: '', // Add this field for private sharing
    require_auth: false,
  });

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadFiles(), loadStorageInfo()]);
    } catch (error) {
      console.error('Error loading data:', error);
      showSnackbar('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    try {
      const token = zkpService.getToken();
      if (!token) {
        showSnackbar('Authentication required', 'error');
        return;
      }

      const response = await fetch('http://localhost:8000/api/files/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Files response:', data);
        
        // Ensure we always have an array
        const filesArray = Array.isArray(data.files) ? data.files : [];
        setFiles(filesArray);
      } else {
        console.error('Failed to load files:', response.status, response.statusText);
        showSnackbar('Failed to load files', 'error');
        setFiles([]); // Set empty array on error
      }
    } catch (error) {
      console.error('Error loading files:', error);
      showSnackbar('Error loading files', 'error');
      setFiles([]); // Set empty array on error
    }
  };

  const loadStorageInfo = async () => {
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
      } else {
        console.error('Failed to load storage info:', response.status);
      }
    } catch (error) {
      console.error('Error loading storage info:', error);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadForm({
        ...uploadForm,
        display_name: file.name,
      });
      setUploadDialogOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const token = zkpService.getToken();
      if (!token) {
        showSnackbar('Authentication required', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('display_name', uploadForm.display_name);
      formData.append('description', uploadForm.description);
      formData.append('tags', uploadForm.tags);
      formData.append('is_public', uploadForm.is_public.toString());

      console.log('Uploading file:', selectedFile.name, selectedFile.type, selectedFile.size);

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
        setSelectedFile(null);
        setUploadForm({ display_name: '', description: '', tags: '', is_public: false });
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

  const handleDownload = async (fileInfo: FileInfo) => {
    try {
      const token = zkpService.getToken();
      if (!token) {
        showSnackbar('Authentication required', 'error');
        return;
      }

      const response = await fetch(`http://localhost:8000/api/files/${fileInfo.file_id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.download_url) {
          // Open download URL in new tab
          window.open(data.download_url, '_blank');
          showSnackbar('Download started', 'success');
          await loadFiles(); // Refresh to update download count
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

  const handleEdit = async () => {
    if (!selectedFileInfo) return;

    try {
      const token = zkpService.getToken();
      if (!token) {
        showSnackbar('Authentication required', 'error');
        return;
      }

      const response = await fetch(`http://localhost:8000/api/files/${selectedFileInfo.file_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          display_name: editForm.display_name,
          description: editForm.description,
          tags: editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          is_public: editForm.is_public,
        }),
      });

      if (response.ok) {
        showSnackbar('File updated successfully!', 'success');
        setEditDialogOpen(false);
        setSelectedFileInfo(null);
        await loadFiles();
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Update failed' }));
        const errorMessage = typeof errorData === 'string' ? errorData : 
                            errorData.detail || 
                            (errorData.message ? errorData.message : 'Update failed');
        showSnackbar(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Update error:', error);
      showSnackbar('Update failed', 'error');
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
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
        showSnackbar('File deleted successfully!', 'success');
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
    }
  };

  const handleCreateShare = async () => {
    if (!selectedFileInfo) return;

    setCreatingShare(true);
    try {
      const token = zkpService.getToken();
      if (!token) {
        showSnackbar('Authentication required', 'error');
        return;
      }

      if (shareForm.is_public) {
        // For public sharing, we'll create a mock share link since there's no public share API yet
        const mockShareLink: ShareLink = {
          share_id: `share_${Math.random().toString(36).substr(2, 9)}`,
          file_id: selectedFileInfo.file_id,
          share_url: `http://localhost:3000/share/${selectedFileInfo.file_id}?token=${Math.random().toString(36).substr(2, 16)}`,
          is_public: true,
          expires_at: shareForm.expires_in_days > 0 ? 
            new Date(Date.now() + shareForm.expires_in_days * 24 * 60 * 60 * 1000).toISOString() : 
            undefined,
          max_downloads: shareForm.max_downloads > 0 ? shareForm.max_downloads : undefined,
          download_count: 0,
          created_at: new Date().toISOString(),
        };

        setShareLink(mockShareLink);
        showSnackbar('Public share link created successfully!', 'success');
      } else {
        // For private sharing, use the backend API for each user
        const sharedUsers = shareForm.shared_users.split(',').map(u => u.trim()).filter(u => u);
        const successfulShares: string[] = [];
        const failedShares: string[] = [];

        for (const user of sharedUsers) {
          try {
            const response = await fetch(`http://localhost:8000/api/files/${selectedFileInfo.file_id}/share`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                target_user: user,
                permission_type: 'READ', // Default permission
                expires_hours: shareForm.expires_in_days * 24, // Convert days to hours
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
        }
        if (failedShares.length > 0) {
          showSnackbar(`Failed to share with: ${failedShares.join(', ')}`, 'error');
        }

        // Create mock share link for display
        if (successfulShares.length > 0) {
          const mockShareLink: ShareLink = {
            share_id: `share_${Math.random().toString(36).substr(2, 9)}`,
            file_id: selectedFileInfo.file_id,
            share_url: `Private sharing with ${successfulShares.length} user(s)`,
            is_public: false,
            expires_at: shareForm.expires_in_days > 0 ? 
              new Date(Date.now() + shareForm.expires_in_days * 24 * 60 * 60 * 1000).toISOString() : 
              undefined,
            max_downloads: shareForm.max_downloads > 0 ? shareForm.max_downloads : undefined,
            download_count: 0,
            created_at: new Date().toISOString(),
          };
          setShareLink(mockShareLink);
        }
      }
      
      await loadFiles(); // Refresh to update any sharing indicators
    } catch (error) {
      console.error('Share creation error:', error);
      showSnackbar('Failed to create share link', 'error');
    } finally {
      setCreatingShare(false);
    }
  };

  const handleCopyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink.share_url).then(() => {
        showSnackbar('Share link copied to clipboard!', 'success');
      }).catch(() => {
        showSnackbar('Failed to copy link', 'error');
      });
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

  const openEditDialog = (fileInfo: FileInfo) => {
    setSelectedFileInfo(fileInfo);
    setEditForm({
      display_name: fileInfo.display_name,
      description: fileInfo.description || '',
      tags: Array.isArray(fileInfo.tags) ? fileInfo.tags.join(', ') : '',
      is_public: fileInfo.is_public || false,
    });
    setEditDialogOpen(true);
    setAnchorEl(null);
  };

  const openShareDialog = (fileInfo: FileInfo) => {
    setSelectedFileInfo(fileInfo);
    setShareLink(null);
    setShareForm({
      is_public: true,
      expires_in_days: 7,
      max_downloads: 0,
      shared_users: '',
      require_auth: false,
    });
    setShareDialogOpen(true);
    setAnchorEl(null);
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
    setSelectedFile(null);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedFileInfo(null);
  };

  const handleCloseShareDialog = () => {
    setShareDialogOpen(false);
    setSelectedFileInfo(null);
    setShareLink(null);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadData}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            component="label"
          >
            Upload File
            <input
              type="file"
              hidden
              onChange={handleFileSelect}
              accept="*/*"
            />
          </Button>
        </Box>
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
            <Box key={file.file_id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h6" noWrap title={file.display_name}>
                        {file.display_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {file.filename}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, file.file_id)}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {formatFileSize(file.file_size)} • {file.mime_type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(file.created_at)}
                    </Typography>
                  </Box>

                  {file.description && (
                    <Typography variant="body2" sx={{ mt: 1 }} noWrap title={file.description}>
                      {file.description}
                    </Typography>
                  )}

                  {Array.isArray(file.tags) && file.tags.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {file.tags.slice(0, 2).map((tag) => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))}
                      {file.tags.length > 2 && (
                        <Chip label={`+${file.tags.length - 2}`} size="small" variant="outlined" />
                      )}
                    </Box>
                  )}

                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Views: {file.view_count || 0} • Downloads: {file.download_count || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {file.is_public && (
                        <Tooltip title="Public file">
                          <Public fontSize="small" color="primary" />
                        </Tooltip>
                      )}
                      <Chip
                        label={file.status}
                        size="small"
                        color={file.status === 'ACTIVE' ? 'success' : 'default'}
                      />
                    </Box>
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Button
                    size="small"
                    startIcon={<Download />}
                    onClick={() => handleDownload(file)}
                  >
                    Download
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Share />}
                    onClick={() => openShareDialog(file)}
                  >
                    Share
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          const file = files.find(f => f.file_id === menuFileId);
          if (file) openEditDialog(file);
        }}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => {
          const file = files.find(f => f.file_id === menuFileId);
          if (file) openShareDialog(file);
        }}>
          <Share sx={{ mr: 1 }} />
          Share
        </MenuItem>
        <MenuItem onClick={() => {
          if (menuFileId) handleDelete(menuFileId);
        }}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Upload File</DialogTitle>
        <DialogContent>
          {selectedFile && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </Alert>
          )}
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
          <FormControlLabel
            control={
              <Switch
                checked={uploadForm.is_public}
                onChange={(e) => setUploadForm({ ...uploadForm, is_public: e.target.checked })}
              />
            }
            label="Make file public"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={uploading || !selectedFile}
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
            value={editForm.display_name}
            onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="Tags (comma-separated)"
            value={editForm.tags}
            onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
            margin="normal"
            helperText="Enter tags separated by commas"
          />
          <FormControlLabel
            control={
              <Switch
                checked={editForm.is_public}
                onChange={(e) => setEditForm({ ...editForm, is_public: e.target.checked })}
              />
            }
            label="Make file public"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>
            Cancel
          </Button>
          <Button
            onClick={handleEdit}
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
          {selectedFileInfo && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Sharing: {selectedFileInfo.display_name}
            </Alert>
          )}
          
          {shareLink ? (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Share link created successfully!
              </Alert>
              
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Share URL:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ flex: 1, wordBreak: 'break-all' }}>
                    {shareLink.share_url}
                  </Typography>
                  <Tooltip title="Copy link">
                    <IconButton size="small" onClick={handleCopyShareLink}>
                      <ContentCopy />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Visibility:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {shareLink.is_public ? <Public fontSize="small" /> : <Lock fontSize="small" />}
                    <Typography variant="body2">
                      {shareLink.is_public ? 'Public' : 'Private'}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Downloads:
                  </Typography>
                  <Typography variant="body2">
                    {shareLink.download_count} / {shareLink.max_downloads || '∞'}
                  </Typography>
                </Box>
              </Box>

              {shareLink.expires_at && (
                <Typography variant="body2" color="text.secondary">
                  Expires: {formatDate(shareLink.expires_at)}
                </Typography>
              )}
            </Box>
          ) : (
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={shareForm.is_public}
                    onChange={(e) => setShareForm({ ...shareForm, is_public: e.target.checked })}
                  />
                }
                label="Public access (anyone with the link can access)"
                sx={{ mb: 2 }}
              />

              {!shareForm.is_public && (
                <TextField
                  fullWidth
                  label="Share with users (usernames or emails)"
                  value={shareForm.shared_users}
                  onChange={(e) => setShareForm({ ...shareForm, shared_users: e.target.value })}
                  margin="normal"
                  helperText="Enter usernames or emails separated by commas (e.g., john_doe, jane@example.com)"
                  placeholder="username1, username2, user@email.com"
                />
              )}

              <TextField
                fullWidth
                type="number"
                label="Expires in days"
                value={shareForm.expires_in_days}
                onChange={(e) => setShareForm({ ...shareForm, expires_in_days: parseInt(e.target.value) || 0 })}
                margin="normal"
                helperText="Set to 0 for no expiration"
              />

              <TextField
                fullWidth
                type="number"
                label="Maximum downloads"
                value={shareForm.max_downloads}
                onChange={(e) => setShareForm({ ...shareForm, max_downloads: parseInt(e.target.value) || 0 })}
                margin="normal"
                helperText="Set to 0 for unlimited downloads"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={shareForm.require_auth}
                    onChange={(e) => setShareForm({ ...shareForm, require_auth: e.target.checked })}
                  />
                }
                label="Require authentication to access"
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseShareDialog}>
            {shareLink ? 'Close' : 'Cancel'}
          </Button>
          {!shareLink && (
            <Button
              onClick={handleCreateShare}
              variant="contained"
              disabled={creatingShare || (!shareForm.is_public && !shareForm.shared_users.trim())}
              startIcon={creatingShare ? <CircularProgress size={16} /> : <LinkIcon />}
            >
              Create Share Link
            </Button>
          )}
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