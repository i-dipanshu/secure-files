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
  const [infoDialog, setInfoDialog] = useState({ open: false, title: '', content: '' });

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

  const showInfoDialog = (title: string, content: string) => {
    setInfoDialog({ open: true, title, content });
  };

  const handleCloseDialog = () => {
    setInfoDialog({ open: false, title: '', content: '' });
  };

  const getRandomMemoji = (username: string): string => {
    const memojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦄', '🐝', '🦋', '🐌', '🐛', '🦀', '🐙', '🦑', '🦐', '🐠', '🐟', '🐡', '🐢', '🦎', '🐍', '🦖', '🦕', '🐲', '🐉', '🦢', '🦜', '🦅', '🦆', '🦉', '🐺', '🐗', '🐴', '🦓', '🦒', '🐘', '🦏', '🦛', '🐪', '🐫', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🐐', '🦌', '🐕', '🐩', '🐈', '🐓', '🦃', '🕊️', '🐇', '🐁', '🐀', '🐿️', '🦔'];
    
    // Generate a consistent index based on username
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      const char = username.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return memojis[Math.abs(hash) % memojis.length];
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
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 1,
            cursor: 'pointer',
            borderRadius: 2,
            p: 1,
            mx: -1,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: 'rgba(99, 102, 241, 0.05)',
              transform: 'translateX(2px)',
            },
          }}
          onClick={() => handleNavigation('/dashboard')}
        >
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
            SecureFiles
          </Typography>
        </Box>
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
        {/* User Profile Card */}
        {auth?.user && (
          <Paper
            sx={{
              p: 3,
              mb: 3,
              background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.8) 100%)',
              border: '2px solid rgba(148, 163, 184, 0.2)',
              borderRadius: 2,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(241, 245, 249, 0.95) 0%, rgba(226, 232, 240, 0.9) 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 28px -8px rgba(148, 163, 184, 0.3)',
                borderColor: 'rgba(99, 102, 241, 0.3)',
              },
            }}
            onClick={() => handleNavigation('/edit-profile')}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar 
                  sx={{ 
                    width: 52, 
                    height: 52, 
                    mr: 2.5,
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    fontSize: '1.8rem',
                    fontWeight: 600,
                    border: '3px solid rgba(148, 163, 184, 0.2)',
                    boxShadow: '0 6px 12px -2px rgba(148, 163, 184, 0.25)',
                  }}
                >
                  {getRandomMemoji(auth.user.username || 'user')}
                </Avatar>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -2,
                    right: 8,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    border: '2px solid white',
                    boxShadow: '0 2px 6px rgba(59, 130, 246, 0.4)',
                  }}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 700,
                    color: 'text.primary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '1rem',
                    mb: 0.25,
                  }}
                >
                  Hello, {auth.user.username}! 👋
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    mb: 0.5,
                  }}
                >
                  {auth.user.email}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'primary.main',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      opacity: 0.9,
                      mr: 1,
                    }}
                  >
                    Tap to edit profile
                  </Typography>
                  <PersonIcon 
                    sx={{ 
                      fontSize: 14, 
                      color: 'primary.main',
                      opacity: 0.7,
                    }} 
                  />
                </Box>
              </Box>
            </Box>
          </Paper>
        )}

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outlined"
          color="error"
          fullWidth
          startIcon={<LogoutIcon />}
          sx={{
            borderRadius: 3,
            borderWidth: '2px',
            py: 1.5,
            fontSize: '0.875rem',
            fontWeight: 600,
            mb: 3,
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.02) 100%)',
            '&:hover': {
              borderWidth: '2px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 16px -4px rgba(239, 68, 68, 0.3)',
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          Sign Out
        </Button>

        {/* Security Information */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            justifyContent: 'center',
            alignItems: 'center',
            pb: 1,
          }}
        >
          <Chip
            size="small"
            icon={<SecurityIcon sx={{ fontSize: '10px !important' }} />}
            label="ZKP Secured"
            color="success"
            variant="outlined"
            clickable
            onClick={() => showInfoDialog(
              'Zero-Knowledge Proof Authentication',
              'Zero-Knowledge Proofs (ZKP) allow you to prove you know a secret (your private key) without revealing the secret itself. This cryptographic method ensures maximum privacy - your private key never leaves your device, yet the server can verify your identity. Our implementation uses SECP256k1 elliptic curve cryptography with Schnorr signatures, providing bank-level security for your files.'
            )}
            sx={{ 
              fontSize: '0.6rem', 
              height: 22,
              cursor: 'pointer',
              borderWidth: '1px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              borderColor: 'rgba(16, 185, 129, 0.3)',
              color: 'success.main',
              '&:hover': {
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                borderColor: 'rgba(16, 185, 129, 0.5)',
                transform: 'translateY(-1px)',
                boxShadow: '0 3px 8px rgba(16, 185, 129, 0.25)',
              },
              transition: 'all 0.2s ease-in-out',
              '& .MuiChip-icon': {
                fontSize: '10px',
                color: 'success.main',
              },
              '& .MuiChip-label': {
                px: 1.5,
                fontSize: '0.6rem',
                fontWeight: 600,
              },
            }}
          />
          
          <Chip
            size="small"
            icon={<SecurityIcon sx={{ fontSize: '10px !important' }} />}
            label="256-bit Encrypted"
            color="primary"
            variant="outlined"
            clickable
            onClick={() => showInfoDialog(
              '256-bit Encryption',
              'Our application uses 256-bit encryption standards, providing military-grade security for your files. This encryption strength is virtually unbreakable and is the same standard used by banks and government institutions worldwide.'
            )}
            sx={{ 
              fontSize: '0.6rem', 
              height: 22,
              cursor: 'pointer',
              borderWidth: '1px',
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
              borderColor: 'rgba(99, 102, 241, 0.3)',
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                borderColor: 'rgba(99, 102, 241, 0.5)',
                transform: 'translateY(-1px)',
                boxShadow: '0 3px 8px rgba(99, 102, 241, 0.25)',
              },
              transition: 'all 0.2s ease-in-out',
              '& .MuiChip-icon': {
                fontSize: '10px',
                color: 'primary.main',
              },
              '& .MuiChip-label': {
                px: 1.5,
                fontSize: '0.6rem',
                fontWeight: 600,
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      {sidebarContent}
      
      {/* Information Dialog */}
      <Dialog 
        open={infoDialog.open} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          fontWeight: 600,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {infoDialog.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.6 }}>
            {infoDialog.content}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="contained">
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Sidebar; 