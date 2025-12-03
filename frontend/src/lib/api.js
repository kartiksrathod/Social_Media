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
  getFollowers: (userId) => api.get(`/users/${userId}/followers`),
  getFollowing: (userId) => api.get(`/users/${userId}/following`),
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
  update: (postId, data) => api.put(`/posts/${postId}`, data),
  delete: (postId) => api.delete(`/posts/${postId}`),
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/posts/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadVideo: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/posts/upload-video', formData, {
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
  deleteComment: (postId, commentId) => api.delete(`/posts/${postId}/comments/${commentId}`),
  save: (postId) => api.post(`/posts/${postId}/save`),
  unsave: (postId) => api.post(`/posts/${postId}/unsave`),
  getSaved: () => api.get('/posts/saved'),
  getByHashtag: (tag) => api.get(`/posts/hashtag/${tag}`),
  repost: (postId) => api.post(`/posts/${postId}/repost`),
  quote: (postId, text) => api.post(`/posts/${postId}/quote`, { text }),
  unrepost: (postId) => api.delete(`/posts/${postId}/unrepost`),
  checkReposted: (postId) => api.get(`/posts/${postId}/reposted-by`),
};

// ==================== HASHTAGS ====================
export const hashtagsAPI = {
  getTrending: (limit = 10) => api.get('/hashtags/trending', { params: { limit } }),
};

// ==================== NOTIFICATIONS ====================
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (notificationId) => api.post(`/notifications/${notificationId}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

// ==================== STORIES ====================
export const storiesAPI = {
  create: (data) => api.post('/stories', data),
  getAll: () => api.get('/stories'),
  getUserStories: (userId) => api.get(`/stories/user/${userId}`),
  viewStory: (storyId) => api.post(`/stories/${storyId}/view`),
  deleteStory: (storyId) => api.delete(`/stories/${storyId}`),
  uploadMedia: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/stories/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ==================== MESSAGES ====================
export const messagesAPI = {
  // Conversations
  createConversation: (participantId) => api.post('/messages/conversations', { participant_id: participantId }),
  getConversations: () => api.get('/messages/conversations'),
  
  // Messages
  sendMessage: (data) => api.post('/messages', data),
  getMessages: (conversationId, limit = 50) => api.get(`/messages/${conversationId}`, { params: { limit } }),
  markAsRead: (conversationId) => api.put(`/messages/${conversationId}/read`),
};

export default api;
