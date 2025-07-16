import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '../services/api';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const userData = await userAPI.getProfile();
          setUser(userData);
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const register = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.register(userData);
      setUser(response.user);
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 'Registration failed';
      setError(errorMessage);
      throw err;
    }
  };

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await authAPI.login(credentials);
      setUser(response.user);
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 'Login failed';
      setError(errorMessage);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } finally {
      setUser(null);
      setError(null);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await userAPI.updateProfile(profileData);
      setUser((prevUser) => ({
        ...prevUser,
        profile: response.profile,
      }));
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 'Profile update failed';
      setError(errorMessage);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isPremium: user?.tier === 'premium' || user?.tier === 'professional' || user?.tier === 'enterprise',
    isPractitioner: user?.type === 'practitioner',
    isAdmin: user?.type === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};