import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== AUTH ====================
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// ==================== USERS ====================
export const usersAPI = {
  getProfile: (username) => api.get(`/users/${username}`),
  updateProfile: (data) => api.put('/users/me', data),
  follow: (userId) => api.post(`/users/${userId}/follow`),
  unfollow: (userId) => api.post(`/users/${userId}/unfollow`),
  search: (query) => api.get('/users/search', { params: { q: query } }),
  getSuggested: () => api.get('/users/suggested'),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ==================== POSTS ====================
export const postsAPI = {
  create: (data) => api.post('/posts', data),
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/posts/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getFeed: () => api.get('/posts/feed'),
  getExplore: () => api.get('/posts/explore'),
  getUserPosts: (username) => api.get(`/posts/user/${username}`),
  like: (postId) => api.post(`/posts/${postId}/like`),
  unlike: (postId) => api.post(`/posts/${postId}/unlike`),
  addComment: (postId, text) => api.post(`/posts/${postId}/comments`, { text }),
  getComments: (postId) => api.get(`/posts/${postId}/comments`),
};

// ==================== NOTIFICATIONS ====================
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (notificationId) => api.post(`/notifications/${notificationId}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

export default api;
