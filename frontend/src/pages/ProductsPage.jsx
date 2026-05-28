import { useEffect, useState } from 'react'
import { productsAPI } from '../services/api'
import ProductCard from '../components/ui/ProductCard'
import Spinner from '../components/ui/Spinner'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const fetchProducts = () => {
    setLoading(true)
    const params = {}
    if (search) params.search = search
    if (selectedCategory) params.category = selectedCategory

    productsAPI.getAll(params)
      .then(res => setProducts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    productsAPI.getCategories()
      .then(res => setCategories(res.data))
      .catch(console.error)
  }, [])

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300)
    return () => clearTimeout(timer)
  }, [search, selectedCategory])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">All Products</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field sm:max-w-xs"
        />
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="input-field sm:max-w-xs"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {(search || selectedCategory) && (
          <button
            onClick={() => { setSearch(''); setSelectedCategory('') }}
            className="btn-secondary text-sm"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <Spinner />
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-4">😕</p>
          <p className="text-lg font-medium">No products found</p>
          <p className="text-sm mt-1">Try a different search or category</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{products.length} products found</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </>
      )}
    </div>
  )
}
