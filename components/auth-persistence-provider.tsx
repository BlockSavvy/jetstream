'use client';

import React from 'react';
import { useAuthPersistence } from '@/lib/hooks/useAuthPersistence';

interface AuthPersistenceProviderProps {
  children: React.ReactNode;
}

export function AuthPersistenceProvider({ children }: AuthPersistenceProviderProps) {
  // Use the auth persistence hook to maintain authentication state
  useAuthPersistence();
  
  // Just render children, hook handles the auth persistence logic
  return <>{children}</>;
} 