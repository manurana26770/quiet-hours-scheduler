'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'

function CreateContent() {
  const { user } = useAuth()
  const router = useRouter()
  
  // Form state - only essential fields
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Helper function to format IST time for storage
  const formatISTForStorage = (istDateTime: string) => {
    if (!istDateTime) return ''
    return istDateTime + ':00.000+05:30'
  }

  // Helper function to get current IST time in datetime-local format
  const getCurrentISTTime = () => {
    const now = new Date()
    const istTime = new Date(now.getTime() + (5 * 60 + 30) * 60 * 1000)
    
    const year = istTime.getFullYear()
    const month = String(istTime.getMonth() + 1).padStart(2, '0')
    const day = String(istTime.getDate()).padStart(2, '0')
    const hours = String(istTime.getHours()).padStart(2, '0')
    const minutes = String(istTime.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('You must be logged in to create a quiet block')
      return
    }

    setLoading(true)
    setError('')
    
    console.log('Creating quiet block for user:', user.id)
    
    // Ensure we have a valid session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      console.error('Session error:', sessionError)
      setError('Authentication error. Please log in again.')
      setLoading(false)
      return
    }
    
    console.log('User session confirmed:', session.user.id)

    try {
      // Validate form
      if (!title.trim()) {
        throw new Error('Title is required')
      }
      if (!startTime) {
        throw new Error('Start time is required')
      }
      if (!endTime) {
        throw new Error('End time is required')
      }

      // Check if start time is before end time
      const start = new Date(startTime)
      const end = new Date(endTime)
      if (start >= end) {
        throw new Error('End time must be after start time')
      }

      // Check for overlapping blocks for the same user
      const { data: existingBlocks, error: checkError } = await supabase
        .from('quiet_blocks')
        .select('start_time, end_time')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (checkError) {
        console.error('Error checking existing blocks:', checkError)
        throw new Error(`Failed to check existing blocks: ${checkError.message || JSON.stringify(checkError)}`)
      }

      // Check for overlaps
      const newStart = new Date(startTime)
      const newEnd = new Date(endTime)
      
      for (const block of existingBlocks || []) {
        const existingStart = new Date(block.start_time)
        const existingEnd = new Date(block.end_time)
        
        // Check if the new block overlaps with any existing block
        if ((newStart < existingEnd && newEnd > existingStart)) {
          throw new Error('This time slot overlaps with an existing quiet block. Please choose a different time.')
        }
      }

      // Create the quiet block
      const insertData = {
        user_id: user.id,
        title: title.trim(),
        start_time: formatISTForStorage(startTime),
        end_time: formatISTForStorage(endTime),
        is_active: true,
        reminder_sent: false
      }
      
      console.log('Inserting quiet block with data:', insertData)
      
      const { data: insertResult, error: insertError } = await supabase
        .from('quiet_blocks')
        .insert(insertData)
        .select()

      if (insertError) {
        console.error('Error inserting quiet block:', insertError)
        throw new Error(`Failed to create quiet block: ${insertError.message || JSON.stringify(insertError)}`)
      }
      
      console.log('Successfully created quiet block:', insertResult)

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('Error creating quiet block:', err)
      
      // Handle different error types
      let errorMessage = 'Failed to create quiet block'
      
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (err && typeof err === 'object') {
        // Handle Supabase error objects
        if ('message' in err) {
          errorMessage = String(err.message)
        } else if ('error' in err) {
          errorMessage = String(err.error)
        } else if ('details' in err) {
          errorMessage = String(err.details)
        } else {
          errorMessage = JSON.stringify(err)
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">
                Create Quiet Study Block
              </h1>
              <p className="mt-2 text-gray-600">
                Schedule a focused study session with email reminders.
              </p>
            </div>

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

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Study Block Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Math Study Session, Programming Practice"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 placeholder-gray-700 form-input"
                  required
                />
              </div>

              {/* Time Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                      Start Time (IST) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setStartTime(getCurrentISTTime())}
                      className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                      Set Current Time
                    </button>
                  </div>
                  <input
                    type="datetime-local"
                    id="startTime"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 placeholder-gray-700 form-input"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                    End Time (IST) *
                  </label>
                  <input
                    type="datetime-local"
                    id="endTime"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 placeholder-gray-700 form-input"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Study Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CreatePage() {
  return <CreateContent />
}