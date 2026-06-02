import axios from 'axios';

// Detect if we are running in localhost development
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Base backend URL. In production, this points to your Render backend.
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (isLocal ? 'http://localhost:5000' : 'https://civic-problem-resolvex.onrender.com');

const api = axios.create({
  // Use Vite proxy '/api' locally so cookies and credentials work easily.
  // In production, direct requests to Render backend `/api`.
  baseURL: isLocal ? '/api' : `${BACKEND_URL}/api`,
  withCredentials: true,
});

// Attach token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('civicToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('civicToken');
      localStorage.removeItem('civicUser');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Helper to resolve image/media URLs.
// If the URL is relative (e.g., '/uploads/file.png'), it will prepend the correct backend domain.
// If it is already a full URL (e.g. Cloudinary, data URI, http), it will return it as-is.
export const getUploadUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  return `${BACKEND_URL}${url}`;
};

export default api;
