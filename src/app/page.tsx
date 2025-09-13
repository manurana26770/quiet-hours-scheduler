'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [user, loading, router])

  // Fallback timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Page loading timeout - forcing redirect to login')
        setHasError(true)
        router.push('/login')
      }
    }, 15000) // 15 second timeout

    return () => clearTimeout(timeout)
  }, [loading, router])

  if (loading && !hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-serif font-semibold text-gray-900 tracking-tight">Loading...</h2>
          <p className="text-sm text-gray-600 mt-2">This may take a moment...</p>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-serif font-semibold text-gray-900 tracking-tight mb-2">Loading Timeout</h2>
          <p className="text-sm text-gray-600 mb-4">The application is taking longer than expected to load.</p>
          <button 
            onClick={() => {
              setHasError(false)
              window.location.reload()
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return null
}
