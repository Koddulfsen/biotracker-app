import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let accessToken = localStorage.getItem('accessToken');
let refreshToken = localStorage.getItem('refreshToken');

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { token, refreshToken: newRefreshToken } = response.data;
        
        accessToken = token;
        refreshToken = newRefreshToken;
        
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    const { token, refreshToken: newRefreshToken } = response.data;
    
    accessToken = token;
    refreshToken = newRefreshToken;
    
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', newRefreshToken);
    
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const { token, refreshToken: newRefreshToken } = response.data;
    
    accessToken = token;
    refreshToken = newRefreshToken;
    
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', newRefreshToken);
    
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      accessToken = null;
      refreshToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  forgotPassword: async (email) => {
    return api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token, password) => {
    return api.post('/auth/reset-password', { token, password });
  },

  verifyEmail: async (token) => {
    return api.post('/auth/verify-email', { token });
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/users/me/profile', profileData);
    return response.data;
  },
};

// Meals API
export const mealsAPI = {
  create: async (mealData) => {
    const response = await api.post('/meals', mealData);
    return response.data;
  },

  list: async (params = {}) => {
    const response = await api.get('/meals', { params });
    return response.data;
  },

  get: async (id) => {
    const response = await api.get(`/meals/${id}`);
    return response.data;
  },

  update: async (id, mealData) => {
    const response = await api.put(`/meals/${id}`, mealData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/meals/${id}`);
    return response.data;
  },
};

// Foods API
export const foodsAPI = {
  search: async (query, filters = {}) => {
    const response = await api.post('/foods/search', { query, filters });
    return response.data;
  },

  scanBarcode: async (barcode) => {
    const response = await api.post('/foods/barcode/scan', { barcode });
    return response.data;
  },

  get: async (id) => {
    const response = await api.get(`/foods/${id}`);
    return response.data;
  },
};

// Subscription API
export const subscriptionAPI = {
  getCurrent: async () => {
    const response = await api.get('/subscriptions');
    return response.data;
  },

  upgrade: async (tier, paymentMethodId) => {
    const response = await api.post('/subscriptions/upgrade', {
      tier,
      paymentMethodId,
    });
    return response.data;
  },

  cancel: async () => {
    const response = await api.post('/subscriptions/cancel');
    return response.data;
  },
};

// Practitioner API
export const practitionerAPI = {
  getPatients: async () => {
    const response = await api.get('/practitioner/patients');
    return response.data;
  },

  addPatient: async (patientData) => {
    const response = await api.post('/practitioner/patients', patientData);
    return response.data;
  },

  createMealPlan: async (patientId, mealPlanData) => {
    const response = await api.post('/practitioner/meal-plans', {
      patientId,
      ...mealPlanData,
    });
    return response.data;
  },

  generateReport: async (patientId, reportOptions) => {
    const response = await api.post('/practitioner/reports/generate', {
      patientId,
      ...reportOptions,
    });
    return response.data;
  },
};

export default api;