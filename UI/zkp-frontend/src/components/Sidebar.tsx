import React, { useContext, useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Divider,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Folder as FolderIcon,
  Share as ShareIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Key,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  width?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  mobileOpen = false, 
  onMobileClose, 
  width = 280 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useContext(AuthContext);

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      description: 'Overview & Stats',
    },
    {
      id: 'files',
      label: 'File Manager',
      icon: <FolderIcon />,
      path: '/files',
      description: 'Upload & Manage Files',
    },
    {
      id: 'sharing',
      label: 'File Sharing',
      icon: <ShareIcon />,
      path: '/file-sharing',
      description: 'Share & Collaborate',
    },
    {
      id: 'keys',
      label: 'Key Manager',
      icon: <Key />,
      path: '/keys',
      description: 'Cryptographic Keys',
    },
    {
      id: 'profile',
      label: 'Edit Profile',
      icon: <PersonIcon />,
      path: '/edit-profile',
      description: 'Account Settings',
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const handleLogout = () => {
    auth?.logout();
    navigate('/login');
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const sidebarContent = (
    <Box
      sx={{
        width: width,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(226, 232, 240, 0.8)',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <SecurityIcon 
            sx={{ 
              mr: 2, 
              fontSize: 28, 
              color: 'primary.main',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }} 
          />
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ZKP Secure
          </Typography>
        </Box>

        {/* User Profile */}
        {auth?.user && (
          <Paper
            sx={{
              p: 2,
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Avatar 
                src={auth.user.avatar_url}
                sx={{ 
                  width: 40, 
                  height: 40, 
                  mr: 2,
                  background: auth.user.avatar_url 
                    ? 'transparent' 
                    : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                }}
              >
                {!auth.user.avatar_url && (auth.user.username?.charAt(0)?.toUpperCase() || 'U')}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Hello, {auth.user.username}!
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                  }}
                >
                  {auth.user.email}
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}
      </Box>

      <Divider sx={{ opacity: 0.3 }} />

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 1 }}>
        <List sx={{ p: 0 }}>
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <ListItem key={item.id} sx={{ px: 1, py: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    px: 2,
                    py: 1.5,
                    minHeight: 48,
                    backgroundColor: isActive 
                      ? 'rgba(99, 102, 241, 0.1)' 
                      : 'transparent',
                    border: isActive 
                      ? '1px solid rgba(99, 102, 241, 0.2)' 
                      : '1px solid transparent',
                    '&:hover': {
                      backgroundColor: isActive 
                        ? 'rgba(99, 102, 241, 0.15)' 
                        : 'rgba(99, 102, 241, 0.08)',
                      transform: 'translateX(4px)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? 'primary.main' : 'text.secondary',
                      minWidth: 32,
                      '& .MuiSvgIcon-root': {
                        fontSize: 20,
                      },
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? 'primary.main' : 'text.primary',
                          fontSize: '0.875rem',
                        }}
                      >
                        {item.label}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.7rem',
                          mt: 0.25,
                        }}
                      >
                        {item.description}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Divider sx={{ opacity: 0.3 }} />

      {/* Footer Actions */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
            Secured with ZKP
          </Typography>
          <Chip
            size="small"
            icon={<SecurityIcon sx={{ fontSize: '12px !important' }} />}
            label="256-bit"
            color="primary"
            variant="outlined"
            sx={{ 
              fontSize: '0.65rem', 
              height: 20,
              '& .MuiChip-icon': {
                fontSize: '12px',
              },
            }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Logout">
            <IconButton
              onClick={handleLogout}
              sx={{
                flex: 1,
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: 'error.main',
                '&:hover': {
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <LogoutIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  return sidebarContent;
};

export default Sidebar; 