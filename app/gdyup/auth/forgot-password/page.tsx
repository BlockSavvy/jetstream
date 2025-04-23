'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Container } from '@/app/gdyup/components/container'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/lib/auth-provider'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { resetPassword } = useAuth()

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    setIsLoading(true)
    try {
      const { error } = await resetPassword(values.email)
      if (error) {
        toast.error(error.message || 'Failed to send reset password email')
      } else {
        setIsSubmitted(true)
        toast.success('Password reset email sent')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container className="flex flex-col min-h-screen bg-gray-900">
      <div className="relative flex-grow flex flex-col justify-center items-center w-full py-6 px-4">
        <div className="absolute top-4 left-4">
          <Link
            href="/gdyup/auth/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>
        
        <div className="w-full max-w-md mx-auto text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">Reset Password</h1>
          <p className="text-gray-400 text-sm md:text-base">
            {isSubmitted 
              ? "Check your email for reset instructions" 
              : "Enter your email to receive a password reset link"}
          </p>
        </div>
        
        <div className="w-full max-w-md bg-black/50 rounded-xl p-6 shadow-xl border border-gray-800">
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <p className="text-gray-300">
                We've sent a password reset link to your email address. 
                Please check your inbox and follow the instructions.
              </p>
              <Button 
                className="w-full h-12 bg-primary text-black hover:bg-primary/90 font-medium"
                onClick={() => window.location.href = '/gdyup/auth/login'}
              >
                Return to login
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="youremail@example.com" 
                          type="email" 
                          className="h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full h-12 mt-6 bg-primary text-black hover:bg-primary/90 font-medium" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>
    </Container>
  )
} 