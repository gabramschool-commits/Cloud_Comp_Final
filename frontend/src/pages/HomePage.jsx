import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { productsAPI } from '../services/api'
import ProductCard from '../components/ui/ProductCard'
import Spinner from '../components/ui/Spinner'

export default function HomePage() {
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    productsAPI.getAll({ limit: 8 })
      .then(res => setFeatured(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-extrabold mb-6 leading-tight">
            Shop Smarter with <span className="text-blue-200">ShopEase</span>
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Discover thousands of quality products — electronics, fashion, sports, and more.
            Fast shipping, easy returns.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/products" className="bg-white text-blue-700 font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors text-lg">
              Shop Now
            </Link>
            <Link to="/register" className="border-2 border-white text-white font-bold px-8 py-3 rounded-xl hover:bg-white hover:text-blue-700 transition-colors text-lg">
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Features Strip */}
      <section className="bg-white border-b border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: '🚚', title: 'Free Shipping', desc: 'On orders over $50' },
            { icon: '🔒', title: 'Secure Payment', desc: 'SSL encrypted checkout' },
            { icon: '↩️', title: 'Easy Returns', desc: '30-day return policy' },
            { icon: '⭐', title: 'Top Quality', desc: 'Curated product selection' },
          ].map((f) => (
            <div key={f.title} className="flex flex-col items-center gap-2">
              <span className="text-3xl">{f.icon}</span>
              <p className="font-semibold text-gray-800 text-sm">{f.title}</p>
              <p className="text-xs text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
          <Link to="/products" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            View all →
          </Link>
        </div>

        {loading ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* CTA Banner */}
      <section className="bg-gray-900 text-white py-16 text-center px-4">
        <h2 className="text-3xl font-bold mb-4">Ready to start shopping?</h2>
        <p className="text-gray-300 mb-6">Create your account and get access to exclusive deals.</p>
        <Link to="/register" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl transition-colors text-lg">
          Get Started Free
        </Link>
      </section>
    </div>
  )
}
