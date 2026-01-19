import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import backendClient from '../services/backendClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Module-level flag to prevent double-fetch in React 18 StrictMode
let globalHasFetched = false;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('authToken');

    if (!token) {
      setIsLoading(false);
      setIsAuthenticated(false);
      setUser(null);
      return;
    }

    try {
      const response = await backendClient.get('/api/auth/me');
      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
      } else {
        // Token is invalid
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (err) {
      console.error('[AuthContext] Auth check failed:', err);
      // Token is invalid or expired
      localStorage.removeItem('authToken');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    if (!globalHasFetched) {
      globalHasFetched = true;
      checkAuth();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Login with email and password
  const login = useCallback(async (email, password) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await backendClient.post('/api/auth/login', { email, password });

      if (response.success && response.token) {
        localStorage.setItem('authToken', response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true, user: response.user };
      } else {
        setError(response.message || 'Login failed');
        return { success: false, message: response.message, code: response.code };
      }
    } catch (err) {
      const message = err.message || 'Login failed';
      const code = err.data?.code || (err.name === 'TimeoutError' ? 'TIMEOUT' :
                   err.name === 'NetworkError' ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR');
      setError(message);
      return { success: false, message, code };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register president
  const registerPresident = useCallback(async (data) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await backendClient.post('/api/auth/register', data);

      if (response.success && response.token) {
        localStorage.setItem('authToken', response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true, user: response.user, community: response.community };
      } else {
        setError(response.message || 'Registration failed');
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = err.message || 'Registration failed';
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register member (pending approval)
  const registerMember = useCallback(async (data) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await backendClient.post('/api/auth/register-member', data);

      if (response.success) {
        // Member registration is pending, don't set auth state
        return { success: true, message: response.message, user: response.user };
      } else {
        setError(response.message || 'Registration failed');
        return { success: false, message: response.message, code: response.code };
      }
    } catch (err) {
      const message = err.message || 'Registration failed';
      setError(message);
      return { success: false, message, code: err.code };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    globalHasFetched = false; // Allow re-fetch after re-login

    // Cancel any pending requests
    backendClient.cancelAllRequests();
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (data) => {
    setError(null);

    try {
      const response = await backendClient.put('/api/auth/me', data);

      if (response.success && response.user) {
        setUser(response.user);
        return { success: true, user: response.user };
      } else {
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = err.message || 'Update failed';
      return { success: false, message };
    }
  }, []);

  // Request password reset
  const forgotPassword = useCallback(async (email) => {
    setError(null);

    try {
      const response = await backendClient.post('/api/auth/forgot-password', { email });
      return { success: true, message: response.message };
    } catch (err) {
      const message = err.message || 'Request failed';
      return { success: false, message };
    }
  }, []);

  // Reset password with token
  const resetPassword = useCallback(async (token, password) => {
    setError(null);

    try {
      const response = await backendClient.post(`/api/auth/reset-password/${token}`, { password });
      return { success: response.success, message: response.message };
    } catch (err) {
      const message = err.message || 'Reset failed';
      return { success: false, message };
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    registerPresident,
    registerMember,
    updateProfile,
    forgotPassword,
    resetPassword,
    checkAuth,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
