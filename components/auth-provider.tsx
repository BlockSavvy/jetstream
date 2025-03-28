'use client'

import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'
import { type User, AuthError, Session } from '@supabase/supabase-js'
import { toast } from 'sonner'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null, session: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  // Initialize user session
  useEffect(() => {
    let mounted = true
    
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth state')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error fetching session:', error.message)
          return
        }
        
        console.log('Session found:', !!session)
        if (session?.user && mounted) {
          console.log('User authenticated:', session.user.email)
          setUser(session.user)
          setSession(session)
        } else if (mounted) {
          setUser(null)
          setSession(null)
          console.log('No authenticated user')
        }
      } catch (error) {
        console.error('Unexpected error during session check:', error)
        if (mounted) {
          setUser(null)
          setSession(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, !!session)
      
      if (mounted) {
        if (session?.user) {
          setUser(session.user)
          setSession(session)
        } else {
          setUser(null)
          setSession(null)
        }
        
        if (event === 'SIGNED_IN') {
          toast.success('Signed in successfully')
          
          // Check for returnUrl in the URL
          const url = new URL(window.location.href)
          const returnUrl = url.searchParams.get('returnUrl')
          
          if (returnUrl) {
            try {
              // Validate the return URL is on the same origin
              const parsedReturnUrl = new URL(decodeURIComponent(returnUrl))
              if (parsedReturnUrl.origin === window.location.origin) {
                router.push(parsedReturnUrl.pathname + parsedReturnUrl.search)
                return
              }
            } catch (e) {
              console.error('Invalid return URL:', e)
            }
          }
          
          router.refresh()
        }
        
        if (event === 'SIGNED_OUT') {
          toast.success('Signed out successfully')
          
          // Redirect to home if signed out from a protected route
          if (pathname?.startsWith('/jetshare')) {
            router.push('/')
          } else {
            router.refresh()
          }
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase.auth, router, pathname])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (!error) {
      toast.success('Verification email sent. Please check your inbox.')
    }

    return { error }
  }

  const signIn = async (email: string, password: string) => {
    console.log('Signing in user:', email)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!error) {
      console.log('Sign in successful, refreshing session')
      setUser(data.session?.user || null)
      setSession(data.session)
    } else {
      console.error('Sign in error:', error.message)
    }

    return { error, session: data.session }
  }

  const signOut = async () => {
    console.log('Signing out user')
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })

    if (!error) {
      toast.success('Password reset email sent. Please check your inbox.')
    }

    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 