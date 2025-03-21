'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/components/auth-provider'
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
import Link from 'next/link'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export function ForgotPasswordForm() {
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
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="mx-auto w-full max-w-md space-y-6 text-center">
        <h2 className="text-2xl font-bold">Check your email</h2>
        <p className="text-muted-foreground">
          We've sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.
        </p>
        <Button variant="outline" asChild>
          <Link href="/auth/login">Return to login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Reset your password</h1>
        <p className="text-muted-foreground">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="youremail@example.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending email...' : 'Send reset link'}
          </Button>
        </form>
      </Form>
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Remember your password?</span>{' '}
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  )
} 