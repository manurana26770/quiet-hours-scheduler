'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<{ error: Error | null }>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | { message: string } | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Function to fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  useEffect(() => {
    let mounted = true
    // eslint-disable-next-line prefer-const
    let loadingTimeout: NodeJS.Timeout

    const completeAuthSetup = async (session: Session | null) => {
      if (!mounted) return
      
      setSession(session)
      setUser(session?.user ?? null)
      
      // Always set loading to false first, then fetch profile in background
      if (mounted) {
        clearTimeout(loadingTimeout)
        setLoading(false)
      }
      
      // Fetch profile in background (non-blocking)
      if (session?.user) {
        try {
          const userProfile = await fetchProfile(session.user.id)
          if (mounted) {
            setProfile(userProfile)
          }
        } catch (error) {
          console.error('Error fetching profile in background:', error)
          // Don't fail the auth setup if profile fetch fails
        }
      } else {
        if (mounted) {
          setProfile(null)
        }
      }
    }

    // Set a timeout to prevent infinite loading
    loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('Auth loading timeout - setting loading to false')
        setLoading(false)
      }
    }, 5000) // Reduced to 5 seconds

    // Get initial session with timeout
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session fetch timeout')), 4000)
    )

    Promise.race([sessionPromise, timeoutPromise])
      .then(async (result: unknown) => {
        if (!mounted) return
        
        // Type guard to ensure result has the expected structure
        if (result && typeof result === 'object' && 'data' in result) {
          const { data } = result as { data: { session: Session | null; error: Error | null } }
          const { session, error } = data
        
          if (error) {
            console.error('Error getting session:', error)
            if (mounted) {
              clearTimeout(loadingTimeout)
              setLoading(false)
            }
            return
          }
          
          await completeAuthSetup(session)
        } else {
          // Handle timeout case
          console.error('Session fetch timeout')
          if (mounted) {
            clearTimeout(loadingTimeout)
            setLoading(false)
          }
        }
      })
      .catch((error) => {
        console.error('Error in getSession:', error)
        if (mounted) {
          clearTimeout(loadingTimeout)
          setLoading(false)
        }
      })

    // Listen for auth changes (but don't manage loading state here)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      // Only handle auth state changes after initial load
      if (loading) return
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const userProfile = await fetchProfile(session.user.id)
        if (mounted) {
          setProfile(userProfile)
        }
      } else {
        if (mounted) {
          setProfile(null)
        }
      }
    })

    return () => {
      mounted = false
      clearTimeout(loadingTimeout)
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps


  const signUp = async (email: string, password: string, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0], // Use email prefix if no full name provided
        }
      }
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    setProfile(null)
    return { error }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: { message: 'No user logged in' } }
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (!error) {
      // Refresh profile data
      const updatedProfile = await fetchProfile(user.id)
      setProfile(updatedProfile)
    }

    return { error }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
