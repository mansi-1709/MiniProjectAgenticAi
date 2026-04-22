import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const patientAPI = {
  register: (data) => api.post('/patients', data),
  getAll: () => api.get('/patients'),
  getByPhone: (phone) => api.get(`/patients/phone/${phone}`),
  delete: (patientId) => api.delete(`/patients/${patientId}`),
};

export const medicineAPI = {
  add: (data) => api.post('/medicines', data),
  getAll: () => api.get('/medicines'),
  getLowStock: () => api.get('/medicines/low-stock'),
  updateStock: (id, stockQty) => api.put(`/medicines/${id}`, { stockQty }),
  adjustStock: (id, adjustment) => api.patch(`/medicines/${id}/adjust`, { adjustment }),
};

export const inventoryAgentAPI = {
  processCommand: (message) => api.post('/inventory-agent/update', { message }),
};

export const orderAPI = {
  processChat: (data) => api.post('/orders/chat', data),
  processConversational: (data) => api.post('/orders/conversational', data),
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  getRecommendations: (data) => api.post('/orders/recommendations', data),
};

export const patientHistoryAPI = {
  getMedicationHistory: (patientId) => api.get(`/patients/${patientId}/medication-history`),
};

export const logsAPI = {
  getAll: (limit) => api.get('/logs', { params: { limit } }),
  getOrderLogs: (orderId) => api.get(`/logs/order/${orderId}`),
};

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  getPendingUsers: () => api.get('/auth/pending-users'),
  approveUser: (userId) => api.put(`/auth/approve-user/${userId}`),
  rejectUser: (userId) => api.put(`/auth/reject-user/${userId}`),
  getAllUsers: () => api.get('/auth/users'),
};

export default api;
