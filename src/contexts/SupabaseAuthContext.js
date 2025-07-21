import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
      try {
        if (!supabase) {
          console.error('Supabase client not initialized - check environment variables');
          setLoading(false);
          return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Transform Supabase user to match your app's user structure
          setUser({
            id: user.id,
            email: user.email,
            type: 'personal', // default type
            tier: 'freemium', // default tier
            profile: {
              userId: user.id,
              displayName: user.email.split('@')[0],
              avatar_url: null,
              bio: '',
              total_xp: 0,
              level: 1
            }
          });
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
      setLoading(false);
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase?.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          type: 'personal',
          tier: 'freemium',
          profile: {
            userId: session.user.id,
            displayName: session.user.email.split('@')[0],
            avatar_url: null,
            bio: '',
            total_xp: 0,
            level: 1
          }
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const register = async (userData) => {
    try {
      setError(null);
      if (!supabase) {
        throw new Error('Authentication service not available. Please check your connection.');
      }
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });
      
      if (error) throw error;
      
      return { user: data.user };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const login = async (credentials) => {
    try {
      setError(null);
      console.log('Attempting Supabase login...');
      console.log('Supabase client exists?', !!supabase);
      console.log('Supabase auth exists?', !!supabase?.auth);
      console.log('Credentials:', { email: credentials.email, passwordLength: credentials.password?.length });
      
      if (!supabase) {
        throw new Error('Authentication service not available. Please check your connection.');
      }
      
      // Test direct fetch to Supabase
      try {
        const testUrl = 'https://pxmukjgzrchnlsukdegy.supabase.co/auth/v1/health';
        console.log('Testing direct fetch to:', testUrl);
        const testResponse = await fetch(testUrl);
        console.log('Direct fetch test result:', testResponse.status);
      } catch (fetchError) {
        console.error('Direct fetch test failed:', fetchError);
      }
      
      // Try direct API call as workaround
      console.log('Trying direct API call...');
      try {
        const authResponse = await fetch(`${supabase.supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabase.supabaseKey,
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });
        
        const authData = await authResponse.json();
        console.log('Direct API response:', authResponse.status, authData);
        
        if (!authResponse.ok) {
          throw new Error(authData.error_description || authData.msg || 'Authentication failed');
        }
        
        // Use the direct response
        return { user: authData.user };
      } catch (directError) {
        console.error('Direct API call failed:', directError);
        
        // Fall back to SDK method
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });
        
        if (error) throw error;
        return { user: data.user };
      }
      
      if (error) {
        console.error('Supabase auth error:', error);
        throw error;
      }
      
      console.log('Login successful:', data.user?.email);
      return { user: data.user };
    } catch (err) {
      console.error('Login error caught:', err);
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);
      // For now, just update local state
      // You can implement Supabase profile updates later
      setUser((prevUser) => ({
        ...prevUser,
        profile: {
          ...prevUser.profile,
          ...profileData
        }
      }));
      return { profile: profileData };
    } catch (err) {
      setError('Profile update failed');
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
    isPremium: false, // You can implement subscription tiers later
    isPractitioner: false,
    isAdmin: false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};