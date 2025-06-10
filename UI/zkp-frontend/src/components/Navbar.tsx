import React, { useContext } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
} from '@mui/material';
import {
  Security as SecurityIcon,
  AccountCircle,
  VpnKey,
  Logout,
  FolderOpen,
  Person,
  Share,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useContext(AuthContext);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    auth?.logout();
    handleClose();
    navigate('/login');
  };

  const handleProfile = () => {
    navigate('/dashboard');
    handleClose();
  };

  const handleKeys = () => {
    navigate('/keys');
    handleClose();
  };

  const handleFiles = () => {
    navigate('/files');
    handleClose();
  };

  const handleEditProfile = () => {
    navigate('/edit-profile');
    handleClose();
  };

  const handleFileSharing = () => {
    navigate('/file-sharing');
    handleClose();
  };

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        {/* Logo and Title */}
        <SecurityIcon sx={{ mr: 1 }} />
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, fontWeight: 600, cursor: 'pointer' }}
          onClick={() => navigate(auth?.isAuthenticated ? '/dashboard' : '/login')}
        >
          SecureFiles
        </Typography>

        {/* Navigation Links */}
        {auth?.isAuthenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* User Info */}
            <Typography variant="body2" sx={{ display: { xs: 'none', md: 'block' } }}>
              Welcome, {auth.user?.username}
            </Typography>

            {/* User Menu */}
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {auth.user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleProfile}>
                <AccountCircle sx={{ mr: 1 }} />
                Dashboard
              </MenuItem>
              <MenuItem onClick={handleKeys}>
                <VpnKey sx={{ mr: 1 }} />
                Key Manager
              </MenuItem>
              <MenuItem onClick={handleFiles}>
                <FolderOpen sx={{ mr: 1 }} />
                File Manager
              </MenuItem>
              <MenuItem onClick={handleEditProfile}>
                <Person sx={{ mr: 1 }} />
                Edit Profile
              </MenuItem>
              <MenuItem onClick={handleFileSharing}>
                <Share sx={{ mr: 1 }} />
                File Sharing
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              onClick={() => navigate('/login')}
              variant={location.pathname === '/login' ? 'outlined' : 'text'}
            >
              Login
            </Button>
            <Button
              color="inherit"
              onClick={() => navigate('/register')}
              variant={location.pathname === '/register' ? 'outlined' : 'text'}
            >
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 