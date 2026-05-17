import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

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

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me')
};

export const userAPI = {
  getUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`)
};

export const messageAPI = {
  getMessages: (userId) => api.get(`/messages/${userId}`),
  sendMessage: (data) => api.post('/messages', data),
  markAsRead: (messageId) => api.patch(`/messages/${messageId}/read`)
};

export const fileAPI = {
  uploadFile: (formData) => api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  downloadFile: (fileId) => api.get(`/files/${fileId}`, {
    responseType: 'blob'
  })
};

export const groupAPI = {
  createGroup: (data) => api.post('/groups', data),
  getGroups: () => api.get('/groups'),
  getGroupById: (id) => api.get(`/groups/${id}`),
  getGroupMessages: (id) => api.get(`/groups/${id}/messages`),
  addMember: (groupId, userId) => api.post(`/groups/${groupId}/members`, { userId }),
  removeMember: (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`)
};

export default api;
