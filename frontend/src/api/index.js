import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => api.get('/auth/me'),
};

// ─── Properties (User) ─────────────────────────────────────────────────────
export const propertyAPI = {
  search:     (params) => api.get('/properties', { params }),
  getById:    (id)     => api.get(`/properties/${id}`),
  addReview:  (id, data) => api.post(`/reviews/${id}`, data),
};

// ─── Favorites ──────────────────────────────────────────────────────────────
export const favoriteAPI = {
  add:    (data) => api.post('/favorites', data),
  getAll: ()     => api.get('/favorites'),
  remove: (id)   => api.delete(`/favorites/${id}`),
};

// ─── Messages / Chat ────────────────────────────────────────────────────────
export const chatAPI = {
  send:            (data)              => api.post('/messages', data),
  getConversation: (userId, propId)    => api.get(`/messages/conversation/${userId}`, { params: propId ? { property_id: propId } : {} }),
  getThreads:      ()                  => api.get('/messages/threads'),
};

// ─── Notifications ──────────────────────────────────────────────────────────
export const notificationAPI = {
  getAll:  ()   => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
};

// ─── Owner ──────────────────────────────────────────────────────────────────
export const ownerAPI = {
  createProperty: (form) => api.post('/properties', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateProperty: (id, form) => api.put(`/properties/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteProperty: (id)   => api.delete(`/properties/${id}`),
  myProperties:   ()     => api.get('/owner/properties'),
  myInquiries:    ()     => api.get('/owner/inquiries'),
  myStats:        ()     => api.get('/owner/stats'),
};

// ─── Admin ──────────────────────────────────────────────────────────────────
export const adminAPI = {
  dashboard:      ()                    => api.get('/admin/dashboard'),
  users:          (params)              => api.get('/admin/users', { params }),
  approveOwner:   (id, action)          => api.put(`/admin/approve-owner/${id}?action=${action}`),
  deleteUser:     (id)                  => api.delete(`/admin/users/${id}`),
  allProperties:  (params)              => api.get('/admin/properties', { params }),
  deleteProperty: (id)                  => api.delete(`/admin/property/${id}`),
  flagProperty:   (id, flagged)         => api.put(`/admin/property/${id}/flag?flagged=${flagged}`),
  notifications:  ()                    => api.get('/admin/notifications'),
};

// ─── AI ─────────────────────────────────────────────────────────────────────
export const aiAPI = {
  predictRent:     (data) => api.post('/ai/predict-rent', data),
  recommendations: ()     => api.get('/ai/recommendations'),
};

export default api;
