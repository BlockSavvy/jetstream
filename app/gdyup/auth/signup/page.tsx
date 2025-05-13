'use client'

import React from 'react'
import Link from 'next/link'
import { Container } from '@/app/gdyup/components/container'
import { ChevronLeft } from 'lucide-react'
import { OnboardingForm } from '@/app/gdyup/components/onboarding/onboarding-form'
import { useGdyupTheme } from '../../hooks/useGdyupTheme'
import { cn } from '@/lib/utils'

export default function SignupPage() {
  const { 
    getThemedTextClasses, 
    getThemedBackgroundClasses
  } = useGdyupTheme();

  return (
    <Container className={cn(
      "flex flex-col min-h-screen",
      getThemedBackgroundClasses('secondary')
    )}>
      <div className="relative flex-grow flex flex-col justify-center items-center w-full py-6 px-4">
        <div className="absolute top-4 left-4">
          <Link
            href="/gdyup"
            className={cn("inline-flex items-center gap-2 text-sm font-medium", getThemedTextClasses('primary'))}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
        
        <div className="w-full max-w-md mx-auto text-center mb-6">
          <h1 className={cn("text-2xl md:text-3xl font-bold mb-2", getThemedTextClasses())}>
            Create your GDY·UP account
          </h1>
          <p className={cn("text-sm md:text-base", getThemedTextClasses('muted'))}>
            Join the private aviation community
          </p>
        </div>
        
        <div className={cn(
          "w-full max-w-md rounded-xl p-6 shadow-xl", 
          getThemedBackgroundClasses('card'),
          "border border-gdyup-border"
        )}>
          <OnboardingForm />
        </div>
      </div>
    </Container>
  )
} 