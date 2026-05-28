import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore, useCartStore } from '../../store'

export default function Navbar() {
  const { user, token, logout } = useAuthStore()
  const totalItems = useCartStore((s) => s.totalItems())
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-blue-600 tracking-tight">
            ShopEase
          </Link>

          {/* Center Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              Home
            </Link>
            <Link to="/products" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              Products
            </Link>
            {user?.is_admin && (
              <>
                <Link to="/admin" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                  Admin
                </Link>
                <Link to="/admin/reports" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                  Reports
                </Link>
              </>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6m-4-6v6" />
              </svg>
              {totalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {totalItems()}
                </span>
              )}
            </Link>

            {token ? (
              <div className="flex items-center gap-2">
                <Link to="/orders" className="text-sm text-gray-600 hover:text-blue-600 font-medium">
                  My Orders
                </Link>
                <span className="text-gray-300">|</span>
                <span className="text-sm text-gray-700 font-medium">{user?.full_name?.split(' ')[0]}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm text-gray-600 hover:text-blue-600 font-medium">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm py-1.5 px-3">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
