import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="absolute top-4 left-4">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
      
      <div className="w-full max-w-md bg-white shadow-md rounded-xl p-8">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="text-3xl font-bold text-amber-500">JetStream</Link>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  )
} 