import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  withCredentials: true,
  timeout: 30000,
});

// Auth
export const authAPI = {
  getMe: () => api.get('/auth/me').then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data),
  loginUrl: '/auth/google',
};

// Gmail
export const gmailAPI = {
  getInbox: (params = {}) => api.get('/api/gmail/inbox', { params }).then(r => r.data),
  getSent: (params = {}) => api.get('/api/gmail/sent', { params }).then(r => r.data),
  getMessage: (id) => api.get(`/api/gmail/message/${id}`).then(r => r.data),
  getThread: (id) => api.get(`/api/gmail/thread/${id}`).then(r => r.data),
  sendEmail: (data) => api.post('/api/gmail/send', data).then(r => r.data),
  search: (filters) => api.get('/api/gmail/search', { params: filters }).then(r => r.data),
};

// AI
export const aiAPI = {
  chat: (messages, context) =>
    api.post('/api/ai/chat', { messages, context }).then(r => r.data),
};

export default api;