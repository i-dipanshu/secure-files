import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';

// Components
import Navbar from './components/Navbar';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import KeyManager from './components/KeyManager';
import LoadingScreen from './components/LoadingScreen';

// Services
import { zkpService } from './services/zkpService';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      dark: '#115293',
      light: '#42a5f5',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
  register: (username: string, email: string, keyPair: any) => Promise<boolean>;
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

  const register = async (username: string, email: string, keyPair: any): Promise<boolean> => {
    try {
      const result = await zkpService.register(username, email, keyPair);
      return result.success;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
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
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
              <Routes>
                {/* Public routes */}
                <Route 
                  path="/login" 
                  element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
                />
                <Route 
                  path="/register" 
                  element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} 
                />
                
                {/* Protected routes */}
                <Route 
                  path="/dashboard" 
                  element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
                />
                <Route 
                  path="/keys" 
                  element={isAuthenticated ? <KeyManager /> : <Navigate to="/login" />} 
                />
                
                {/* Default route */}
                <Route 
                  path="/" 
                  element={
                    <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />
                  } 
                />
                
                {/* Catch all - redirect to appropriate page */}
                <Route 
                  path="*" 
                  element={
                    <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />
                  } 
                />
              </Routes>
            </Box>
          </Box>
        </Router>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;
