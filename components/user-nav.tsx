'use client'

import { useAuth } from '@/components/auth-provider'
import { useUserProfile } from '@/hooks/useUserProfile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, Settings, UserCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useMemo, useRef } from 'react'

export function UserNav() {
  const { user, signOut, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading, refreshProfile } = useUserProfile()
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  
  // Reset loading state when pathname changes
  useEffect(() => {
    setIsLoading(false)
  }, [pathname])
  
  // Use a ref to prevent excessive profile refreshing
  const profileRefreshedRef = useRef(false)
  
  // Only fetch profile once when component mounts if user is logged in
  useEffect(() => {
    if (user && !profileRefreshedRef.current) {
      refreshProfile()
      profileRefreshedRef.current = true
    }
  }, [user, refreshProfile])
  
  // Get user initials for avatar
  const initials = useMemo(() => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    
    return 'U';
  }, [profile, user]);

  const handleSignIn = () => {
    router.push('/auth/login')
  }

  const handleSignUp = () => {
    router.push('/auth/register')
  }

  const handleSignOut = async () => {
    try {
      setIsLoading(true)
      await signOut()
      // Note: No need to redirect here as the auth provider handles this
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="flex items-center gap-4">
        <Button variant="ghost" disabled className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </Button>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          className="text-white hover:text-amber-400 hover:bg-transparent"
          onClick={handleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
        <Button 
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          onClick={handleSignUp}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Sign up"
          )}
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-amber-500">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={profile?.full_name || user?.email || ""} />
            ) : null}
            <AvatarFallback className="bg-amber-100 text-amber-900">
              {profileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            {profileLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
                <p className="text-sm">Loading profile...</p>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium leading-none">{profile?.full_name || 'Your Account'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2 cursor-pointer w-full">
            <Settings className="h-4 w-4" />
            <span>Account Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer w-full">
            <UserCircle className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="flex items-center gap-2 cursor-pointer text-red-500 hover:text-red-600 focus:text-red-600"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing out...</span>
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 