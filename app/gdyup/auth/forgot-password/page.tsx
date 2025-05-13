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
import { useGdyupTheme } from '../../hooks/useGdyupTheme'
import { cn } from '@/lib/utils'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { resetPassword } = useAuth()
  const { 
    getThemedTextClasses, 
    getThemedButtonClasses, 
    getThemedBackgroundClasses
  } = useGdyupTheme();

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
    <Container className={cn(
      "flex flex-col min-h-screen",
      getThemedBackgroundClasses('secondary')
    )}>
      <div className="relative flex-grow flex flex-col justify-center items-center w-full py-6 px-4">
        <div className="absolute top-4 left-4">
          <Link
            href="/gdyup/auth/login"
            className={cn("inline-flex items-center gap-2 text-sm font-medium", getThemedTextClasses('primary'))}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>
        
        <div className="w-full max-w-md mx-auto text-center mb-6">
          <h1 className={cn("text-2xl md:text-3xl font-bold mb-2", getThemedTextClasses())}>Reset Password</h1>
          <p className={cn("text-sm md:text-base", getThemedTextClasses('muted'))}>
            {isSubmitted 
              ? "Check your email for reset instructions" 
              : "Enter your email to receive a password reset link"}
          </p>
        </div>
        
        <div className={cn(
          "w-full max-w-md rounded-xl p-6 shadow-xl", 
          getThemedBackgroundClasses('card'),
          "border border-gdyup-border"
        )}>
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <p className={getThemedTextClasses()}>
                We've sent a password reset link to your email address. 
                Please check your inbox and follow the instructions.
              </p>
              <Button 
                className={cn("w-full h-12 font-medium", getThemedButtonClasses())}
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
                      <FormLabel className={getThemedTextClasses()}>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="youremail@example.com" 
                          type="email" 
                          className={cn(
                            "h-12",
                            getThemedBackgroundClasses('card'),
                            "border-gdyup-border",
                            getThemedTextClasses(),
                            "placeholder:text-gray-500"
                          )}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className={getThemedTextClasses('destructive')} />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className={cn("w-full h-12 mt-6 font-medium", getThemedButtonClasses())} 
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