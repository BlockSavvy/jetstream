'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'
import { Container } from '@/app/gdyup/components/container'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { LoginForm } from '@/app/gdyup/components/onboarding/login-form'

export default function LoginPage() {
  return (
    <Container className="flex flex-col min-h-screen bg-gray-900">
      <div className="relative flex-grow flex flex-col justify-center items-center w-full py-6 px-4">
        <div className="absolute top-4 left-4">
          <Link
            href="/gdyup"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
        
        <div className="w-full max-w-md mx-auto text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">Welcome Back</h1>
          <p className="text-gray-400 text-sm md:text-base">
            Sign in to your GDY·UP account
          </p>
        </div>
        
        <div className="w-full max-w-md bg-black/50 rounded-xl p-6 shadow-xl border border-gray-800">
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </Container>
  )
} 