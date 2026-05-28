import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store'
import { ordersAPI } from '../services/api'

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCartStore()
  const navigate = useNavigate()
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!address.trim()) {
      setError('Please enter a shipping address.')
      return
    }
    setLoading(true)
    setError('')

    const orderPayload = {
      shipping_address: address,
      items: items.map(i => ({
        product_id: i.product.id,
        quantity: i.quantity
      }))
    }

    try {
      const res = await ordersAPI.create(orderPayload)
      clearCart()
      navigate(`/orders`, { state: { newOrderId: res.data.id } })
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    navigate('/cart')
    return null
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Checkout form */}
        <div className="card">
          <h2 className="text-lg font-bold mb-4">Shipping Information</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Shipping Address
              </label>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                rows={4}
                placeholder="123 Main Street, Anytown, State, ZIP, Country"
                className="input-field resize-none"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
              <p>💡 This is a demo app — no real payment is processed.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="card h-fit">
          <h2 className="text-lg font-bold mb-4">Your Order</h2>
          <div className="space-y-3">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{product.name} <span className="text-gray-400">× {quantity}</span></span>
                <span className="font-medium">${(product.price * quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between font-bold">
            <span>Total</span>
            <span>${totalPrice().toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
