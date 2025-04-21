'use client'

import React, { useEffect, useState } from 'react'
import { Container } from '@/app/gdyup/components/container'
import { ProfileSetupForm } from '@/app/gdyup/components/onboarding/profile-setup-form'
import { useAuth } from '@/lib/auth-provider'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function ProfileSetupPage() {
  const { session, user, loading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState<string>('')
  const [isReady, setIsReady] = useState(false)

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
      <Container className="flex flex-col min-h-screen bg-gray-900">
        <div className="flex-grow flex flex-col justify-center items-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-gray-400">Loading your profile...</p>
        </div>
      </Container>
    )
  }

  return (
    <Container className="flex flex-col min-h-screen bg-gray-900">
      <div className="flex-grow flex flex-col justify-center items-center w-full py-6 px-4">
        <div className="w-full max-w-md mx-auto text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">Complete Your Profile</h1>
          <p className="text-gray-400 text-sm md:text-base">
            Tell us more about yourself to get started with GDY·UP
          </p>
        </div>
        
        <div className="w-full max-w-md bg-black/50 rounded-xl p-6 shadow-xl border border-gray-800">
          <ProfileSetupForm email={email} />
        </div>
      </div>
    </Container>
  )
} 