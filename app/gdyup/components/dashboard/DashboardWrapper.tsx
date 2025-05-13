'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useGdyupTheme } from '../../hooks/useGdyupTheme';

interface DashboardWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * DashboardWrapper - A container component that ensures proper styling for dashboard content
 * This addresses the white text / contrast issues in dashboard components
 */
export function DashboardWrapper({ children, className }: DashboardWrapperProps) {
  const { getThemedTextClasses, getThemedBackgroundClasses } = useGdyupTheme();
  
  return (
    <div className={cn(
      'dashboard-content',
      getThemedTextClasses(),
      className
    )}>
      {children}
    </div>
  );
}

/**
 * DashboardCard - A styled card component for dashboard content
 */
export function DashboardCard({ 
  children, 
  className 
}: DashboardWrapperProps) {
  const { getThemedBackgroundClasses, getThemedTextClasses } = useGdyupTheme();
  
  return (
    <div className={cn(
      'rounded-lg border shadow-md p-4',
      getThemedBackgroundClasses('card'),
      getThemedTextClasses(),
      'border-gdyup-border',
      className
    )}>
      {children}
    </div>
  );
}

/**
 * DashboardHeader - A styled header component for dashboard sections
 */
export function DashboardHeader({ 
  children, 
  className 
}: DashboardWrapperProps) {
  const { getThemedTextClasses } = useGdyupTheme();
  
  return (
    <div className={cn(
      'mb-4 pb-2 border-b',
      'border-gdyup-border',
      getThemedTextClasses(),
      className
    )}>
      {children}
    </div>
  );
}

/**
 * DashboardText - A component to ensure text visibility in dashboards
 */
export function DashboardText({ 
  children, 
  className,
  variant = 'default'
}: DashboardWrapperProps & { variant?: 'default' | 'muted' | 'primary' | 'secondary' }) {
  const { getThemedTextClasses } = useGdyupTheme();
  
  return (
    <div className={cn(
      getThemedTextClasses(variant === 'default' ? undefined : variant),
      className
    )}>
      {children}
    </div>
  );
} 