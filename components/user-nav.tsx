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
import { LogOut, Settings, UserCircle } from 'lucide-react'
import Link from 'next/link'

export function UserNav() {
  const { user, signOut } = useAuth()
  const { profile } = useUserProfile()

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Button variant="ghost" className="text-white hover:text-amber-400 hover:bg-transparent" asChild>
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold" asChild>
          <Link href="/auth/register">Sign up</Link>
        </Button>
      </div>
    )
  }

  // Get initials for avatar
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase()
    : user.email?.[0]?.toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-amber-500">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={profile?.full_name || user.email || ""} />
            ) : null}
            <AvatarFallback className="bg-amber-100 text-amber-900">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile?.full_name || 'Your Account'}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
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
          onClick={() => signOut()}
          className="flex items-center gap-2 cursor-pointer text-red-500 hover:text-red-600 focus:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 