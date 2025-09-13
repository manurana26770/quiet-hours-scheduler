'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

interface QuietBlock {
  id: string
  title: string
  start_time: string
  end_time: string
  is_active: boolean
  reminder_sent: boolean
  created_at: string
}

function DashboardContent() {
  const { user, signOut, loading: authLoading } = useAuth()
  const router = useRouter()
  const [quietBlocks, setQuietBlocks] = useState<QuietBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasFetched, setHasFetched] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  // Fetch quiet blocks
  const fetchQuietBlocks = useCallback(async (showLoading = true) => {
    if (!user) {
      return
    }

    try {
      if (showLoading) {
        setLoading(true)
      }
      setError('')

      const { data, error: fetchError } = await supabase
        .from('quiet_blocks')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      // Deactivate expired blocks
      const now = new Date()
      const expiredBlocks = (data || []).filter(block => {
        const endTime = new Date(block.end_time)
        return endTime < now
      })

      if (expiredBlocks.length > 0) {
        const expiredIds = expiredBlocks.map(block => block.id)
        const { error: updateError } = await supabase
          .from('quiet_blocks')
          .update({ is_active: false })
          .in('id', expiredIds)

        if (updateError) {
          console.error('Error deactivating expired blocks:', updateError)
        }
      }

      // Filter to show only active blocks
      const activeBlocks = (data || []).filter(block => {
        const endTime = new Date(block.end_time)
        return block.is_active && endTime >= now
      })

      setQuietBlocks(activeBlocks)
      setHasFetched(true)
    } catch (err) {
      console.error('Fetch error details:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch quiet blocks')
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }, [user])

  useEffect(() => {
    if (user && !authLoading && !hasFetched) {
      fetchQuietBlocks()
    }
  }, [user, authLoading, hasFetched, fetchQuietBlocks])

  // Reset hasFetched when component mounts
  useEffect(() => {
    setHasFetched(false)
  }, [])

  // Format date and time for display
  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  // Get status of a block
  const getBlockStatus = (block: QuietBlock) => {
    const now = new Date()
    const startTime = new Date(block.start_time)
    const endTime = new Date(block.end_time)

    if (now < startTime) {
      return 'upcoming'
    } else if (now >= startTime && now <= endTime) {
      return 'active'
    } else {
      return 'completed'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-serif font-semibold text-gray-900 tracking-tight">Loading...</h2>
          <p className="text-sm text-gray-600 mt-2">Fetching your study blocks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">
                Study Blocks
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your focused study sessions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => fetchQuietBlocks(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium"
              >
                Refresh
              </button>
              <button
                onClick={() => router.push('/create')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Create New Block
              </button>
              <button
                onClick={handleSignOut}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-1 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {quietBlocks.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No study blocks</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your study block.</p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/create')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Study Block
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {quietBlocks.map((block) => {
              const status = getBlockStatus(block)
              return (
                <div key={block.id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {block.title}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : status === 'upcoming'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {status === 'active' ? 'Active' : status === 'upcoming' ? 'Upcoming' : 'Completed'}
                      </span>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Start:</span>
                        <span className="ml-1">{formatDateTime(block.start_time)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">End:</span>
                        <span className="ml-1">{formatDateTime(block.end_time)}</span>
                      </div>

                      {block.reminder_sent && (
                        <div className="flex items-center text-sm text-green-600">
                          <svg className="flex-shrink-0 mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Reminder sent
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return <DashboardContent />
}