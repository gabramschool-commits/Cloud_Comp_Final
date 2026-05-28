import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { productsAPI, ordersAPI, usersAPI } from '../services/api'
import Spinner from '../components/ui/Spinner'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function AdminDashboard() {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [tab, setTab] = useState('products')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', stock: '', category: '', image_url: ''
  })
  const [formError, setFormError] = useState('')

  useEffect(() => {
    Promise.all([
      productsAPI.getAll({ limit: 100 }),
      ordersAPI.getAllOrders(),
      usersAPI.getAll()
    ]).then(([p, o, u]) => {
      setProducts(p.data)
      setOrders(o.data)
      setUsers(u.data)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleCreateProduct = async (e) => {
    e.preventDefault()
    setFormError('')
    try {
      const res = await productsAPI.create({
        ...productForm,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock)
      })
      setProducts([res.data, ...products])
      setShowForm(false)
      setProductForm({ name: '', description: '', price: '', stock: '', category: '', image_url: '' })
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Error creating product')
    }
  }

  const handleDeleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return
    await productsAPI.delete(id)
    setProducts(products.filter(p => p.id !== id))
  }

  const handleUpdateOrderStatus = async (orderId, status) => {
    await ordersAPI.updateStatus(orderId, status)
    setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o))
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Manage your store</p>
        </div>
        <Link to="/admin/reports" className="btn-primary">
          📊 View Reports
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Products', value: products.length, icon: '📦' },
          { label: 'Orders', value: orders.length, icon: '🛒' },
          { label: 'Customers', value: users.filter(u => !u.is_admin).length, icon: '👥' },
          { label: 'Revenue', value: `$${orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total_amount, 0).toFixed(2)}`, icon: '💰' },
        ].map(stat => (
          <div key={stat.label} className="card text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {['products', 'orders', 'users'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Products Tab */}
      {tab === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Products ({products.length})</h2>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
              {showForm ? 'Cancel' : '+ Add Product'}
            </button>
          </div>

          {showForm && (
            <div className="card mb-6">
              <h3 className="font-bold mb-4">New Product</h3>
              <form onSubmit={handleCreateProduct} className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input className="input-field" required value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input className="input-field" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                  <input className="input-field" type="number" step="0.01" required value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                  <input className="input-field" type="number" required value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea className="input-field" rows={2} value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input className="input-field" value={productForm.image_url} onChange={e => setProductForm({...productForm, image_url: e.target.value})} />
                </div>
                {formError && <p className="col-span-2 text-red-600 text-sm">{formError}</p>}
                <button type="submit" className="btn-primary col-span-2">Create Product</button>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['ID', 'Name', 'Category', 'Price', 'Stock', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">#{p.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.category || '—'}</td>
                    <td className="px-4 py-3">${p.price.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${p.stock > 10 ? 'bg-green-100 text-green-700' : p.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDeleteProduct(p.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div>
          <h2 className="text-lg font-bold mb-4">Orders ({orders.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Order ID', 'User ID', 'Total', 'Status', 'Date', 'Update Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">#{o.id}</td>
                    <td className="px-4 py-3 text-gray-500">User #{o.user_id}</td>
                    <td className="px-4 py-3 font-semibold">${o.total_amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[o.status]}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <select
                        value={o.status}
                        onChange={e => handleUpdateOrderStatus(o.id, e.target.value)}
                        className="border border-gray-200 rounded px-2 py-1 text-xs"
                      >
                        {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div>
          <h2 className="text-lg font-bold mb-4">Users ({users.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['ID', 'Name', 'Email', 'Role', 'Joined'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">#{u.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{u.full_name}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.is_admin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.is_admin ? 'Admin' : 'Customer'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
