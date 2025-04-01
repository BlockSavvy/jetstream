import { LoginForm } from '@/components/auth/login-form'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="absolute top-4 left-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline dark:text-blue-400"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
      
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-md rounded-xl p-8 border border-gray-200 dark:border-gray-700 dark:shadow-lg jetstream-card">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="text-3xl font-bold text-amber-500 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors">JetStream</Link>
        </div>
        <Suspense fallback={<div className="p-8 text-center dark:text-gray-300">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
      
      {/* Add subtle jetstream branding */}
      <div className="mt-10 text-center opacity-70">
        <div className="flex justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
          <Link href="/about" className="hover:text-primary dark:hover:text-blue-400">About</Link>
          <Link href="/privacy" className="hover:text-primary dark:hover:text-blue-400">Privacy</Link>
          <Link href="/terms" className="hover:text-primary dark:hover:text-blue-400">Terms</Link>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          © {new Date().getFullYear()} JetStream Airlines. All rights reserved.
        </p>
      </div>
    </div>
  )
} 