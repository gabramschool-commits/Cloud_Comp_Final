import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { productsAPI } from '../services/api'
import { useCartStore } from '../store'
import Spinner from '../components/ui/Spinner'

export default function ProductDetailPage() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore(s => s.addItem)

  useEffect(() => {
    productsAPI.getOne(id)
      .then(res => setProduct(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleAdd = () => {
    addItem(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) return <Spinner />
  if (!product) return (
    <div className="text-center py-20">
      <p className="text-lg text-gray-500">Product not found.</p>
      <Link to="/products" className="text-blue-600 mt-4 inline-block">← Back to products</Link>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link to="/products" className="text-blue-600 hover:text-blue-700 text-sm mb-6 inline-block">
        ← Back to Products
      </Link>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
          <img
            src={product.image_url || 'https://via.placeholder.com/600'}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div>
          {product.category && (
            <span className="text-sm text-blue-600 font-semibold uppercase tracking-wide">
              {product.category}
            </span>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{product.name}</h1>
          <p className="text-gray-600 mt-4 leading-relaxed">{product.description}</p>

          <div className="mt-6">
            <span className="text-4xl font-extrabold text-gray-900">${product.price.toFixed(2)}</span>
          </div>

          <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
            product.stock > 10 ? 'bg-green-100 text-green-700'
            : product.stock > 0 ? 'bg-yellow-100 text-yellow-700'
            : 'bg-red-100 text-red-700'
          }`}>
            {product.stock > 0 ? `✓ In Stock (${product.stock} available)` : '✗ Out of Stock'}
          </div>

          {product.stock > 0 && (
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 font-bold text-lg"
                >−</button>
                <span className="px-4 py-2 font-semibold">{qty}</span>
                <button
                  onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 font-bold text-lg"
                >+</button>
              </div>

              <button
                onClick={handleAdd}
                className={`flex-1 font-bold py-3 rounded-xl transition-all ${
                  added
                    ? 'bg-green-500 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {added ? '✓ Added to Cart!' : 'Add to Cart'}
              </button>
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-xl text-sm text-gray-600 space-y-1">
            <p>🚚 Free shipping on orders over $50</p>
            <p>↩️ 30-day easy returns</p>
            <p>🔒 Secure checkout</p>
          </div>
        </div>
      </div>
    </div>
  )
}
