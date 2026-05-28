import { Link } from 'react-router-dom'
import { useCartStore } from '../../store'

export default function ProductCard({ product }) {
  const addItem = useCartStore((s) => s.addItem)

  const handleAddToCart = (e) => {
    e.preventDefault()
    addItem(product, 1)
    alert(`"${product.name}" added to cart!`)
  }

  return (
    <Link to={`/products/${product.id}`} className="block group">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
        {/* Product Image */}
        <div className="aspect-square overflow-hidden bg-gray-100">
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x400?text=No+Image'
            }}
          />
        </div>

        {/* Product Info */}
        <div className="p-4">
          {product.category && (
            <span className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
              {product.category}
            </span>
          )}
          <h3 className="font-semibold text-gray-900 mt-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              product.stock > 10
                ? 'bg-green-100 text-green-700'
                : product.stock > 0
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="mt-3 w-full btn-primary text-sm py-2"
          >
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </Link>
  )
}
