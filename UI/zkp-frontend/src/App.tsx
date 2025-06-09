import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import KeyManager from './components/KeyManager';
import FileManager from './components/FileManager';
import EditProfile from './components/EditProfile';
import FileSharing from './components/FileSharing';
import LoadingScreen from './components/LoadingScreen';

// Services
import { zkpService } from './services/zkpService';

// Create Material-UI theme with modern pastel colors
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366f1', // Indigo-500
      light: '#a5b4fc', // Indigo-300
      dark: '#4338ca', // Indigo-700
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ec4899', // Pink-500
      light: '#f9a8d4', // Pink-300
      dark: '#be185d', // Pink-700
    },
    background: {
      default: '#f8fafc', // Slate-50
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b', // Slate-800
      secondary: '#64748b', // Slate-500
    },
    success: {
      main: '#10b981', // Emerald-500
      light: '#6ee7b7', // Emerald-300
      dark: '#047857', // Emerald-700
    },
    warning: {
      main: '#f59e0b', // Amber-500
      light: '#fcd34d', // Amber-300
      dark: '#d97706', // Amber-600
    },
    error: {
      main: '#ef4444', // Red-500
      light: '#fca5a5', // Red-300
      dark: '#dc2626', // Red-600
    },
    info: {
      main: '#3b82f6', // Blue-500
      light: '#93c5fd', // Blue-300
      dark: '#1d4ed8', // Blue-700
    },
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", "Segoe UI", "Roboto", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.25,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.3,
      letterSpacing: '-0.015em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 500,
      fontSize: '0.875rem',
      textTransform: 'none',
      letterSpacing: '0.025em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          minHeight: '100vh',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          fontWeight: 500,
          padding: '10px 20px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            transform: 'translateY(-1px)',
          },
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          border: '1px solid rgb(226 232 240)',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          border: '1px solid rgb(226 232 240)',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            '& fieldset': {
              borderColor: 'rgb(226 232 240)',
              borderWidth: '1.5px',
            },
            '&:hover fieldset': {
              borderColor: 'rgb(148 163 184)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#6366f1',
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid',
        },
        standardSuccess: {
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgba(16, 185, 129, 0.2)',
        },
        standardError: {
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.2)',
        },
        standardWarning: {
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderColor: 'rgba(245, 158, 11, 0.2)',
        },
        standardInfo: {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 0.2)',
        },
      },
    },
  },
});

// Authentication context
export interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  loading: boolean;
  login: (identifier: string, privateKey: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, email: string, keyPair: any) => Promise<{success: boolean, error?: string}>;
  checkAuth: () => Promise<void>;
}

export const AuthContext = React.createContext<AuthContextType | null>(null);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Initialize authentication on app start
  useEffect(() => {
    checkAuth();
    zkpService.initializeAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    try {
      if (zkpService.isAuthenticated()) {
        const result = await zkpService.verifyToken();
        if (result.success && result.data) {
          setIsAuthenticated(true);
          setUser(result.data);
        } else {
          // Token is invalid, clear storage
          zkpService.logout();
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier: string, privateKey: string): Promise<boolean> => {
    try {
      const result = await zkpService.login(identifier, privateKey);
      if (result.success && result.data) {
        setIsAuthenticated(true);
        setUser(result.data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    zkpService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const register = async (username: string, email: string, keyPair: any): Promise<{success: boolean, error?: string}> => {
    try {
      const result = await zkpService.register(username, email, keyPair);
      if (result.success) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: result.error?.message || 'Registration failed'
        };
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        error: error.message || 'Registration failed'
      };
    }
  };

  const authValue: AuthContextType = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    register,
    checkAuth,
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoadingScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthContext.Provider value={authValue}>
        <Router>
          {isAuthenticated ? (
            // Authenticated layout with sidebar
            <Box sx={{ display: 'flex', minHeight: '100vh' }}>
              <Box
                component="nav"
                sx={{
                  width: 280,
                  flexShrink: 0,
                  position: 'fixed',
                  height: '100vh',
                  zIndex: 1200,
                }}
              >
                <Sidebar />
              </Box>
              <Box
                component="main"
                sx={{
                  flexGrow: 1,
                  ml: '280px',
                  minHeight: '100vh',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                }}
              >
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/keys" element={<KeyManager />} />
                  <Route path="/files" element={<FileManager />} />
                  <Route path="/edit-profile" element={<EditProfile />} />
                  <Route path="/file-sharing" element={<FileSharing />} />
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
              </Box>
            </Box>
          ) : (
            // Unauthenticated layout with top navbar
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navbar />
              <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/" element={<Navigate to="/login" />} />
                  <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
              </Box>
            </Box>
          )}
        </Router>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;
