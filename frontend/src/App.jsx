import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store'

import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'

import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OrdersPage from './pages/OrdersPage'
import AdminDashboard from './pages/AdminDashboard'
import ReportingDashboard from './pages/ReportingDashboard'
import NotFoundPage from './pages/NotFoundPage'

// Protected route - redirects to login if not authenticated
function PrivateRoute({ children }) {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" replace />
}

// Admin-only route
function AdminRoute({ children }) {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (!user?.is_admin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes (must be logged in) */}
            <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
            <Route path="/orders" element={<PrivateRoute><OrdersPage /></PrivateRoute>} />

            {/* Admin-only routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/reports" element={<AdminRoute><ReportingDashboard /></AdminRoute>} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
