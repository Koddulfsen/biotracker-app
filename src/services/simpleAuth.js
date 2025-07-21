// Simple auth service that bypasses Supabase SDK issues
const SUPABASE_URL = 'https://pxmukjgzrchnlsukdegy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bXVramd6cmNobmxzdWtkZWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTkzNzYsImV4cCI6MjA2Nzk5NTM3Nn0.O31I8P53_4TyHvqPbAE87kDwcOgSpH2WfvGIzNnZxa0';

export const simpleAuth = {
  async login(email, password) {
    console.log('SimpleAuth: Attempting login...');
    
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('SimpleAuth: Response:', response.status, data);

      if (!response.ok) {
        throw new Error(data.error_description || data.msg || 'Login failed');
      }

      // Store the session
      if (data.access_token) {
        localStorage.setItem('sb-access-token', data.access_token);
        localStorage.setItem('sb-refresh-token', data.refresh_token);
        localStorage.setItem('sb-user', JSON.stringify(data.user));
      }

      return { user: data.user, session: data };
    } catch (error) {
      console.error('SimpleAuth: Error:', error);
      throw error;
    }
  },

  async register(email, password) {
    console.log('SimpleAuth: Attempting registration...');
    
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('SimpleAuth: Register response:', response.status, data);

      if (!response.ok) {
        throw new Error(data.error_description || data.msg || 'Registration failed');
      }

      return { user: data.user };
    } catch (error) {
      console.error('SimpleAuth: Register error:', error);
      throw error;
    }
  },

  async logout() {
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');
    localStorage.removeItem('sb-user');
  },

  getUser() {
    const userStr = localStorage.getItem('sb-user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken() {
    return localStorage.getItem('sb-access-token');
  }
};

export default simpleAuth;