'use client'

/**
 * DEPRECATED: This file is kept for backward compatibility.
 * New components should import from '@/lib/auth-provider' instead.
 * 
 * This file simply re-exports everything from the new location
 * to avoid breaking changes while migrating components.
 */

import { 
  AuthProvider as NewAuthProvider, 
  useAuth as useNewAuth
} from '@/lib/auth-provider';

// Re-export everything from the new auth provider
export { NewAuthProvider as AuthProvider, useNewAuth as useAuth }; 