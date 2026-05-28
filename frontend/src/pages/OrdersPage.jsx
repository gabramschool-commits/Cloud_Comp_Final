import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ordersAPI } from '../services/api'
import Spinner from '../components/ui/Spinner'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  const newOrderId = location.state?.newOrderId

  useEffect(() => {
    ordersAPI.getMyOrders()
      .then(res => setOrders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
      <p className="text-gray-500 mb-8">{orders.length} total orders</p>

      {newOrderId && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-green-800 font-medium">
          ✅ Order #{newOrderId} placed successfully! Thank you for your purchase.
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-4">📦</p>
          <p className="text-lg">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="card">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div>
                  <p className="font-bold text-gray-900">Order #{order.id}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[order.status]}`}>
                    {order.status}
                  </span>
                  <p className="font-bold text-gray-900 mt-1">${order.total_amount.toFixed(2)}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Items</p>
                <div className="space-y-1">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">Product #{item.product_id} × {item.quantity}</span>
                      <span className="text-gray-600">${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {order.shipping_address && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">Shipping to: {order.shipping_address}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
