import axios from 'axios'

// Base URL - in production this will be your VPS IP or domain
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
})

// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// If 401 (unauthorized), log user out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth ─────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
}

// ── Products ──────────────────────────────────────────────────────
export const productsAPI = {
  getAll: (params) => api.get('/api/products/', { params }),
  getOne: (id) => api.get(`/api/products/${id}`),
  getCategories: () => api.get('/api/products/categories'),
  create: (data) => api.post('/api/products/', data),
  update: (id, data) => api.put(`/api/products/${id}`, data),
  delete: (id) => api.delete(`/api/products/${id}`),
}

// ── Orders ────────────────────────────────────────────────────────
export const ordersAPI = {
  create: (data) => api.post('/api/orders/', data),
  getMyOrders: () => api.get('/api/orders/'),
  getAllOrders: () => api.get('/api/orders/all'),
  getOne: (id) => api.get(`/api/orders/${id}`),
  updateStatus: (id, status) => api.put(`/api/orders/${id}/status`, { status }),
}

// ── Users ─────────────────────────────────────────────────────────
export const usersAPI = {
  getMe: () => api.get('/api/users/me'),
  updateMe: (data) => api.put('/api/users/me', data),
  getAll: () => api.get('/api/users/'),
}

// ── Analytics ─────────────────────────────────────────────────────
export const analyticsAPI = {
  getSummary: () => api.get('/api/analytics/summary'),
  getDailySales: (days = 30) => api.get(`/api/analytics/daily-sales?days=${days}`),
  getTopProducts: () => api.get('/api/analytics/top-products'),
  getCustomerStats: () => api.get('/api/analytics/customer-stats'),
  getCategoryBreakdown: () => api.get('/api/analytics/category-breakdown'),
}

export default api
