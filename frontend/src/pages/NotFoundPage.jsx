import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <p className="text-8xl font-black text-gray-200">404</p>
      <h1 className="text-2xl font-bold text-gray-800 mt-4">Page Not Found</h1>
      <p className="text-gray-500 mt-2">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary mt-6">Go Home</Link>
    </div>
  )
}
