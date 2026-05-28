import { Link, useNavigate } from 'react-router-dom'
import { useCartStore, useAuthStore } from '../store'

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCartStore()
  const { token } = useAuthStore()
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-6xl mb-6">🛒</p>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Browse our products and add some items to your cart.</p>
        <Link to="/products" className="btn-primary">Browse Products</Link>
      </div>
    )
  }

  const handleCheckout = () => {
    if (!token) {
      navigate('/login')
    } else {
      navigate('/checkout')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Items list */}
        <div className="md:col-span-2 space-y-4">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="card flex gap-4 items-center">
              <img
                src={product.image_url || 'https://via.placeholder.com/100'}
                alt={product.name}
                className="w-20 h-20 object-cover rounded-lg bg-gray-100 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                <p className="text-blue-600 font-bold mt-1">${product.price.toFixed(2)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 font-bold flex items-center justify-center"
                  >−</button>
                  <span className="font-semibold w-6 text-center">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 font-bold flex items-center justify-center"
                  >+</button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">${(product.price * quantity).toFixed(2)}</p>
                <button
                  onClick={() => removeItem(product.id)}
                  className="text-red-500 hover:text-red-700 text-sm mt-2"
                >Remove</button>
              </div>
            </div>
          ))}

          <button onClick={clearCart} className="text-sm text-gray-500 hover:text-red-500 transition-colors">
            Clear Cart
          </button>
        </div>

        {/* Order Summary */}
        <div className="card h-fit">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span>${totalPrice().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className="text-green-600">{totalPrice() >= 50 ? 'Free' : '$5.99'}</span>
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-base text-gray-900">
              <span>Total</span>
              <span>${(totalPrice() + (totalPrice() >= 50 ? 0 : 5.99)).toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            className="btn-primary w-full mt-6 py-3 text-base"
          >
            {token ? 'Proceed to Checkout' : 'Login to Checkout'}
          </button>
        </div>
      </div>
    </div>
  )
}
