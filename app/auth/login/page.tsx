import { LoginForm } from '@/components/auth/login-form'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import '../../gdyup/components/gdyup-forms.css' // Import GDYUP's centralized CSS

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center py-8 px-4 sm:px-6 lg:px-8 bg-gray-900 gdyup-container">
      <div className="absolute top-4 left-4">
        <Link
          href="/gdyup/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#DAFF0D] hover:text-[#B4D500] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
      
      <div className="w-full max-w-md bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-700 gdyup-card">
        <div className="mb-6 flex justify-center">
          <Link href="/gdyup/dashboard" className="text-3xl font-bold text-[#DAFF0D] hover:text-[#B4D500] transition-colors">
            JetStream GDYUP
          </Link>
        </div>
        <Suspense fallback={<div className="p-8 text-center text-gray-300">Loading...</div>}>
          <LoginForm />
        </Suspense>

        <div className="mt-6 text-center text-sm text-gray-400">
          <p>Access your jet sharing offers and manage your aircraft</p>
        </div>
      </div>
      
      {/* Add subtle GDYUP branding */}
      <div className="mt-8 text-center opacity-70">
        <div className="flex justify-center space-x-4 text-sm text-gray-500 mb-2">
          <Link href="/about" className="hover:text-[#DAFF0D]">About</Link>
          <Link href="/privacy" className="hover:text-[#DAFF0D]">Privacy</Link>
          <Link href="/terms" className="hover:text-[#DAFF0D]">Terms</Link>
        </div>
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} JetStream Airlines. All rights reserved.
        </p>
      </div>
    </div>
  )
} 