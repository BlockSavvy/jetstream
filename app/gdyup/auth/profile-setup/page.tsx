'use client'

import React, { useEffect, useState } from 'react'
import { Container } from '@/app/gdyup/components/container'
import { ProfileSetupForm } from '@/app/gdyup/components/onboarding/profile-setup-form'
import { useAuth } from '@/lib/auth-provider'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useGdyupTheme } from '../../hooks/useGdyupTheme'
import { cn } from '@/lib/utils'

export default function ProfileSetupPage() {
  const { session, user, loading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState<string>('')
  const [isReady, setIsReady] = useState(false)
  
  const { 
    getThemedTextClasses, 
    getThemedBackgroundClasses
  } = useGdyupTheme();

  useEffect(() => {
    // If no user is logged in, check if we have email in session storage
    if (!loading) {
      if (!user && !session) {
        // Try to get email from session storage
        const storedEmail = sessionStorage.getItem('gdyup_onboarding_email')
        if (storedEmail) {
          setEmail(storedEmail)
          setIsReady(true)
        } else {
          // No email in storage and no user logged in - redirect to signup
          toast.error('Please complete the sign up process first')
          router.push('/gdyup/auth/signup')
        }
      } else if (user) {
        // User is already logged in, we can proceed
        setEmail(user.email || '')
        setIsReady(true)
      }
    }
  }, [loading, user, session, router])

  if (loading || !isReady) {
    return (
      <Container className={cn(
        "flex flex-col min-h-screen",
        getThemedBackgroundClasses('secondary')
      )}>
        <div className="flex-grow flex flex-col justify-center items-center py-10">
          <Loader2 className={cn("h-10 w-10 animate-spin mb-4", getThemedTextClasses('primary'))} />
          <p className={getThemedTextClasses('muted')}>Loading your profile...</p>
        </div>
      </Container>
    )
  }

  return (
    <Container className={cn(
      "flex flex-col min-h-screen",
      getThemedBackgroundClasses('secondary')
    )}>
      <div className="flex-grow flex flex-col justify-center items-center w-full py-6 px-4">
        <div className="w-full max-w-md mx-auto text-center mb-6">
          <h1 className={cn("text-2xl md:text-3xl font-bold mb-2", getThemedTextClasses())}>
            Complete Your Profile
          </h1>
          <p className={cn("text-sm md:text-base", getThemedTextClasses('muted'))}>
            Tell us more about yourself to get started with GDY·UP
          </p>
        </div>
        
        <div className={cn(
          "w-full max-w-md rounded-xl p-6 shadow-xl", 
          getThemedBackgroundClasses('card'),
          "border border-gdyup-border"
        )}>
          <ProfileSetupForm email={email} />
        </div>
      </div>
    </Container>
  )
} 