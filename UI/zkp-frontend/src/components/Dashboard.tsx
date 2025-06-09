import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Button,
  LinearProgress,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  useTheme,
} from '@mui/material';
import {
  CloudUpload,
  Storage,
  Share,
  Security,
  TrendingUp,
  FilePresent,
  Person,
  Refresh,
  ChevronRight,
  Upload,
  Download,
  Visibility,
  Timer,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { zkpService } from '../services/zkpService';

interface FileStats {
  total_files: number;
  total_size: number;
  shared_by_me_files: number;
  shared_with_me_files: number;
  recent_uploads: number;
}

interface StorageInfo {
  storage_used: number;
  storage_limit: number;
  file_count: number;
  storage_percentage: number;
}

interface RecentActivity {
  id: string;
  type: 'upload' | 'download' | 'share' | 'view';
  filename: string;
  timestamp: string;
  details?: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [fileStats, setFileStats] = useState<FileStats>({
    total_files: 0,
    total_size: 0,
    shared_by_me_files: 0,
    shared_with_me_files: 0,
    recent_uploads: 0,
  });
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const loadFileStats = useCallback(async () => {
    try {
      const token = zkpService.getToken();
      if (!token) return;

      // Load user files
      const filesResponse = await fetch('http://localhost:8000/api/files/', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      // Load shared with me files
      const sharedWithMeResponse = await fetch('http://localhost:8000/api/files/shared', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (filesResponse.ok && sharedWithMeResponse.ok) {
        const filesData = await filesResponse.json();
        const sharedWithMeData = await sharedWithMeResponse.json();
        
        const files = filesData.files || [];
        const sharedWithMeFiles = sharedWithMeData.files || [];
        
        const totalSize = files.reduce((sum: number, file: any) => sum + (file.file_size || 0), 0);
        const recentUploads = files.filter((file: any) => {
          const uploadDate = new Date(file.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return uploadDate > weekAgo;
        }).length;

        // Count files shared by me (need to check permissions on my files)
        let sharedByMeCount = 0;
        for (const file of files) {
          try {
            const permResponse = await fetch(`http://localhost:8000/api/files/${file.file_id}/permissions`, {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            if (permResponse.ok) {
              const permData = await permResponse.json();
              const permissions = permData.permissions || [];
              if (permissions.length > 0) {
                sharedByMeCount++;
              }
            }
          } catch (error) {
            console.error(`Error checking permissions for file ${file.file_id}:`, error);
          }
        }

        setFileStats({
          total_files: files.length,
          total_size: totalSize,
          shared_by_me_files: sharedByMeCount,
          shared_with_me_files: sharedWithMeFiles.length,
          recent_uploads: recentUploads,
        });
      }
    } catch (error) {
      console.error('Failed to load file stats:', error);
    }
  }, []);

  const loadStorageInfo = useCallback(async () => {
    try {
      const token = zkpService.getToken();
      if (!token) return;

      const response = await fetch('http://localhost:8000/api/files/storage/info', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStorageInfo(data);
      }
    } catch (error) {
      console.error('Failed to load storage info:', error);
    }
  }, []);

  const loadRecentActivity = useCallback(async () => {
    try {
      const token = zkpService.getToken();
      if (!token) return;

      // Load user files to create activity feed
      const filesResponse = await fetch('http://localhost:8000/api/files/', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        const files = filesData.files || [];
        
        // Create activity based on file operations
        const activities: RecentActivity[] = [];
        
        // Add recent uploads (files uploaded in last 7 days)
        const recentFiles = files
          .filter((file: any) => {
            const uploadDate = new Date(file.created_at);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return uploadDate > weekAgo;
          })
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 4); // Get last 4 uploads

        recentFiles.forEach((file: any, index: number) => {
          activities.push({
            id: `upload-${file.file_id}`,
            type: 'upload',
            filename: file.display_name || file.filename,
            timestamp: file.created_at,
            details: `${formatFileSize(file.file_size)} • ${file.mime_type || 'File'} uploaded`,
          });
        });

        // If no recent uploads, show some placeholder activities
        if (activities.length === 0) {
          activities.push({
            id: 'welcome',
            type: 'view',
            filename: 'Welcome to ZKP Secure',
            timestamp: new Date().toISOString(),
            details: 'Start uploading files to see your activity here',
          });
        }

        setRecentActivity(activities);
      }
    } catch (error) {
      console.error('Failed to load recent activity:', error);
      // Fallback to a simple welcome message
      setRecentActivity([{
        id: 'welcome',
        type: 'view',
        filename: 'Welcome to ZKP Secure',
        timestamp: new Date().toISOString(),
        details: 'Your file activity will appear here',
      }]);
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadFileStats(),
        loadStorageInfo(),
        loadRecentActivity(),
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadFileStats, loadStorageInfo, loadRecentActivity]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload': return <Upload sx={{ fontSize: 16 }} />;
      case 'download': return <Download sx={{ fontSize: 16 }} />;
      case 'share': return <Share sx={{ fontSize: 16 }} />;
      case 'view': return <Visibility sx={{ fontSize: 16 }} />;
      default: return <FilePresent sx={{ fontSize: 16 }} />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'upload': return theme.palette.success.main;
      case 'download': return theme.palette.info.main;
      case 'share': return theme.palette.secondary.main;
      case 'view': return theme.palette.warning.main;
      default: return theme.palette.grey[500];
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, minHeight: '100vh' }}>
      {/* Welcome Header */}
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
          Hello, {auth?.user?.username}! 👋
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
          Welcome back to your secure file dashboard
        </Typography>
      </Box>

      {/* Stats Cards - First Row */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 3, 
          mb: 3 
        }}
      >
        {/* Total Files */}
        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
          <Card 
            sx={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
              },
            }}
            onClick={() => navigate('/files')}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <FilePresent />
                </Box>
                <ChevronRight sx={{ color: 'primary.main' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5 }}>
                {fileStats.total_files}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Files
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Storage Used */}
        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
          <Card 
            sx={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
              },
            }}
            onClick={() => navigate('/files')}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <Storage />
                </Box>
                <ChevronRight sx={{ color: 'success.main' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main', mb: 0.5 }}>
                {formatFileSize(fileStats.total_size)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Storage Used
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Stats Cards - Second Row */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 3, 
          mb: 4 
        }}
      >
        {/* Shared by Me */}
        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
          <Card 
            sx={{
              background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(251, 146, 60, 0.05) 100%)',
              border: '1px solid rgba(251, 146, 60, 0.2)',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
              },
            }}
            onClick={() => navigate('/file-sharing')}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <Share />
                </Box>
                <ChevronRight sx={{ color: 'warning.main' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main', mb: 0.5 }}>
                {fileStats.shared_by_me_files}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Shared by Me
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Shared with Me */}
        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
          <Card 
            sx={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
              },
            }}
            onClick={() => navigate('/file-sharing')}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <Share />
                </Box>
                <ChevronRight sx={{ color: 'info.main' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main', mb: 0.5 }}>
                {fileStats.shared_with_me_files}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Shared with Me
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Recent Uploads */}
        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
          <Card 
            sx={{
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%)',
              border: '1px solid rgba(236, 72, 153, 0.2)',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
              },
            }}
            onClick={() => navigate('/files')}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <TrendingUp />
                </Box>
                <ChevronRight sx={{ color: 'secondary.main' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main', mb: 0.5 }}>
                {fileStats.recent_uploads}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This Week
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 3 
        }}
      >
        {/* Storage Details */}
        <Box sx={{ flex: '2 1 600px' }}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Storage sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Storage Overview
                  </Typography>
                </Box>
                <IconButton onClick={loadDashboardData} size="small">
                  <Refresh />
                </IconButton>
              </Box>

              {storageInfo ? (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Used Storage
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatFileSize(storageInfo.storage_used)} / {formatFileSize(storageInfo.storage_limit)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={storageInfo.storage_percentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                          borderRadius: 4,
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {storageInfo.storage_percentage.toFixed(1)}% of your storage quota used
                    </Typography>
                  </Box>

                  <Box 
                    sx={{ 
                      display: 'flex', 
                      gap: 2 
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          {storageInfo.file_count}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Files
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                          {Math.round((storageInfo.storage_limit - storageInfo.storage_used) / (1024 * 1024))} MB
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Available
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Quick Actions
              </Typography>
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 2 
                }}
              >
                <Box sx={{ flex: '1 1 250px' }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<CloudUpload />}
                    onClick={() => navigate('/files')}
                    sx={{ py: 1.5, justifyContent: 'flex-start' }}
                  >
                    Upload Files
                  </Button>
                </Box>
                <Box sx={{ flex: '1 1 250px' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Share />}
                    onClick={() => navigate('/file-sharing')}
                    sx={{ py: 1.5, justifyContent: 'flex-start' }}
                  >
                    Share Files
                  </Button>
                </Box>
                <Box sx={{ flex: '1 1 250px' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Security />}
                    onClick={() => navigate('/keys')}
                    sx={{ py: 1.5, justifyContent: 'flex-start' }}
                  >
                    Manage Keys
                  </Button>
                </Box>
                <Box sx={{ flex: '1 1 250px' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Person />}
                    onClick={() => navigate('/edit-profile')}
                    sx={{ py: 1.5, justifyContent: 'flex-start' }}
                  >
                    Edit Profile
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Recent Activity */}
        <Box sx={{ flex: '1 1 400px' }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recent Activity
                </Typography>
                <Timer sx={{ color: 'text.secondary', fontSize: 20 }} />
              </Box>

              <List sx={{ p: 0 }}>
                {recentActivity.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: `${getActivityColor(activity.type)}20`,
                            color: getActivityColor(activity.type),
                          }}
                        >
                          {getActivityIcon(activity.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                            {activity.filename}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              {activity.details}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {formatTimeAgo(activity.timestamp)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentActivity.length - 1 && <Divider variant="inset" />}
                  </React.Fragment>
                ))}
              </List>

              {recentActivity.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No recent activity to show
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard; 