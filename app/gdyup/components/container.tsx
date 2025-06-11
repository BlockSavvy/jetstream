import React from 'react'
import { cn } from '@/lib/utils'
import { useGdyupTheme } from '../hooks/useGdyupTheme'

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Container({ children, className, ...props }: ContainerProps) {
  const { getThemedBackgroundClasses } = useGdyupTheme();

  return (
    <div className={cn('w-full max-w-screen-xl mx-auto px-4 md:px-6', className)} {...props}>
      {children}
    </div>
  )
} 