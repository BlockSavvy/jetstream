import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import Link from 'next/link'

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-md rounded-xl p-8">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="text-3xl font-bold text-amber-500">JetStream</Link>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  )
} 