'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, LogOut, Settings, CreditCard, User2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function ProfileButton() {
  const { user, signOut } = useAuth();
  const { getThemeClasses } = useGdyupTheme();
  const [open, setOpen] = useState(false);
  
  // Get user initials for the avatar
  const getUserInitials = () => {
    if (!user) return 'GU';
    
    const firstName = user.user_metadata?.first_name || '';
    const lastName = user.user_metadata?.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    
    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }
    
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    
    return 'GU';
  };
  
  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return 'Guest User';
    
    const firstName = user.user_metadata?.first_name;
    const lastName = user.user_metadata?.last_name;
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    if (firstName) {
      return firstName;
    }
    
    return user.email || 'User';
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    setOpen(false);
    await signOut?.();
  };
  
  // If no user, show sign in button
  if (!user) {
    return (
      <Button
        size="sm"
        className={getThemeClasses({
          base: "h-7",
          default: "bg-gdyup-primary text-black hover:bg-gdyup-primary/90",
          luxury: "bg-blue-500 text-white hover:bg-blue-600", 
          bitcoin: "bg-pink-500 text-white hover:bg-pink-600"
        })}
        asChild
      >
        <Link href="/auth/login">Sign In</Link>
      </Button>
    );
  }
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={getThemeClasses({
            base: "h-7 gap-2",
            default: "text-gray-800 hover:text-black hover:bg-gray-100",
            luxury: "text-blue-100 hover:text-white hover:bg-blue-800",
            bitcoin: "text-pink-100 hover:text-white hover:bg-pink-800"
          })}
        >
          <Avatar className="h-5 w-5">
            <AvatarFallback className={getThemeClasses({
              base: "text-xs",
              default: "bg-amber-500 text-black",
              luxury: "bg-amber-400 text-black",
              bitcoin: "bg-pink-400 text-black"
            })}>
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs max-w-[80px] truncate hidden sm:inline-block">
            {getUserDisplayName()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        align="end"
        className={getThemeClasses({
          base: "w-56",
          default: "bg-white border-gray-200",
          luxury: "bg-blue-950 border-blue-900 text-blue-50",
          bitcoin: "bg-pink-950 border-pink-900 text-pink-50"
        })}
      >
        <DropdownMenuLabel className={getThemeClasses({
          base: "",
          default: "text-gray-900",
          luxury: "text-blue-50",
          bitcoin: "text-pink-50"
        })}>
          My Account
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className={getThemeClasses({
          base: "",
          default: "bg-gray-100",
          luxury: "bg-blue-900/60",
          bitcoin: "bg-pink-900/60"
        })} />
        
        <DropdownMenuGroup>
          <DropdownMenuItem
            asChild
            className={getThemeClasses({
              base: "",
              default: "focus:bg-gray-50",
              luxury: "focus:bg-blue-900",
              bitcoin: "focus:bg-pink-900"
            })}
          >
            <Link href="/gdyup/profile">
              <User2 className="h-4 w-4 mr-2" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            asChild
            className={getThemeClasses({
              base: "",
              default: "focus:bg-gray-50",
              luxury: "focus:bg-blue-900",
              bitcoin: "focus:bg-pink-900"
            })}
          >
            <Link href="/gdyup/dashboard">
              <CreditCard className="h-4 w-4 mr-2" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            asChild
            className={getThemeClasses({
              base: "",
              default: "focus:bg-gray-50",
              luxury: "focus:bg-blue-900",
              bitcoin: "focus:bg-pink-900"
            })}
          >
            <Link href="/gdyup/settings">
              <Settings className="h-4 w-4 mr-2" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator className={getThemeClasses({
          base: "",
          default: "bg-gray-100",
          luxury: "bg-blue-900/60",
          bitcoin: "bg-pink-900/60"
        })} />
        
        <DropdownMenuItem
          onClick={handleSignOut}
          className={getThemeClasses({
            base: "",
            default: "text-red-600 focus:bg-red-50 focus:text-red-700",
            luxury: "text-red-400 focus:bg-red-900/30 focus:text-red-300",
            bitcoin: "text-red-400 focus:bg-red-900/30 focus:text-red-300"
          })}
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 