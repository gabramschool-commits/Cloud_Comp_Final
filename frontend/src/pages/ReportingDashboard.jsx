import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { analyticsAPI } from '../services/api'
import Spinner from '../components/ui/Spinner'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

function StatCard({ label, value, icon, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    purple: 'bg-purple-50 text-purple-700',
  }
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

export default function ReportingDashboard() {
  const [summary, setSummary] = useState(null)
  const [dailySales, setDailySales] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [customerStats, setCustomerStats] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [s, d, p, c, cat] = await Promise.all([
        analyticsAPI.getSummary(),
        analyticsAPI.getDailySales(30),
        analyticsAPI.getTopProducts(),
        analyticsAPI.getCustomerStats(),
        analyticsAPI.getCategoryBreakdown(),
      ])
      setSummary(s.data)
      setDailySales(d.data)
      setTopProducts(p.data)
      setCustomerStats(c.data)
      setCategoryData(cat.data)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (err) {
      console.error('Analytics fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  if (loading) return <Spinner />

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reporting Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Analytics from reporting database
            {lastUpdated && <span className="text-xs ml-2 text-gray-400">(Last refreshed: {lastUpdated})</span>}
          </p>
        </div>
        <button onClick={fetchAll} className="btn-secondary text-sm">
          🔄 Refresh
        </button>
      </div>

      {/* ETL Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
        <strong>📊 Data Source:</strong> This dashboard reads from the separate <strong>reporting database</strong>.
        Data is updated every 15 minutes via the ETL cron job.
        Run <code className="bg-blue-100 px-1 rounded">python etl/etl_pipeline.py</code> manually to refresh now.
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Revenue" value={`$${summary.total_revenue?.toFixed(2) || '0.00'}`} icon="💰" color="green" />
          <StatCard label="Total Orders" value={summary.total_orders || 0} icon="🛒" color="blue" />
          <StatCard label="Total Customers" value={summary.total_customers || 0} icon="👥" color="purple" />
          <StatCard label="Avg Order Value" value={`$${summary.avg_order_value?.toFixed(2) || '0.00'}`} icon="📈" color="yellow" />
        </div>
      )}

      {/* Charts Row 1: Revenue + Category */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {/* Revenue over time */}
        <div className="card md:col-span-2">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Revenue Over Last 30 Days</h2>
          {dailySales.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No sales data yet. Place some orders and run the ETL pipeline.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Pie */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Sales by Category</h2>
          {categoryData.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No category data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={11}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2: Orders + Top Products */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Orders over time */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Orders Over Last 30 Days</h2>
          {dailySales.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No order data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Products bar chart */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Top Products by Revenue</h2>
          {topProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No product data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProducts.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="product_name" type="category" tick={{ fontSize: 10 }} width={100} />
                <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Products Table */}
      {topProducts.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Top Products Detail</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Rank', 'Product', 'Qty Sold', 'Revenue'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topProducts.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 font-bold">#{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.product_name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.quantity_sold}</td>
                  <td className="px-4 py-3 font-semibold text-green-700">${p.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Top Customers Table */}
      {customerStats.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Top Customers</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Customer', 'Email', 'Orders', 'Total Spent'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customerStats.map((c, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email}</td>
                  <td className="px-4 py-3 text-gray-600">{c.total_orders}</td>
                  <td className="px-4 py-3 font-semibold text-green-700">${c.total_spent.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
