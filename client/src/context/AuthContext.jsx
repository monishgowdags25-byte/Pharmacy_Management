import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Load user profile if token exists on startup
  const loadUser = useCallback(async (activeToken) => {
    try {
      // Direct API fetch (will trigger API request interceptor)
      const response = await api.get('/auth/me');
      if (response?.success && response?.data?.user) {
        setUser(response.data.user);
        setToken(activeToken);
      } else {
        // Fallback clear
        handleClearAuth();
      }
    } catch (err) {
      console.error('Error loading active user session:', err.message);
      handleClearAuth();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      loadUser(savedToken);
    } else {
      setLoading(false);
    }
  }, [loadUser]);

  const handleClearAuth = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  /**
   * Securely authenticate credentials
   */
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response?.success && response?.data?.token) {
        const userToken = response.data.token;
        const userObj = response.data.user;
        
        localStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(userObj);
        
        return { success: true };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (error) {
      handleClearAuth();
      throw error; // Let components catch error messages
    } finally {
      setLoading(false);
    }
  };

  /**
   * Log out active session
   */
  const logout = useCallback(() => {
    handleClearAuth();
    window.location.href = '/login';
  }, []);

  /**
   * Update active user password
   */
  const changePassword = async (currentPassword, newPassword) => {
    return await api.post('/auth/change-password', { currentPassword, newPassword });
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    changePassword,
    setUser // Allows administrative changes to update own profile if needed
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
