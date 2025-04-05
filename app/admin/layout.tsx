'use client';

import { ReactNode, useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Plane, 
  Wrench, 
  Settings, 
  Bell, 
  Archive,
  BarChart,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/components/auth-provider';
import { createClient } from '@/lib/supabase';
import { Toaster } from 'sonner';
import { UiProvider } from './components/ui-context';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/admin/overview', label: 'Overview', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/admin/offers', label: 'Flight Offers', icon: <Plane className="h-5 w-5" /> },
  { href: '/admin/jetshare', label: 'JetShare Offers', icon: <Users className="h-5 w-5 mr-1" /> },
  { href: '/admin/users', label: 'Users', icon: <Users className="h-5 w-5" /> },
  { href: '/admin/jets', label: 'Jets', icon: <Plane className="h-5 w-5 rotate-45" /> },
  { href: '/admin/crews', label: 'Crews', icon: <Users className="h-5 w-5" /> },
  { href: '/admin/simulation', label: 'Simulation', icon: <BarChart className="h-5 w-5" /> },
];

/**
 * Admin Dashboard Layout
 * 
 * This layout provides a consistent structure for all admin pages, including:
 * - A responsive sidebar navigation with links to all admin sections
 * - Role-based access control (admin only)
 * - Responsive design that collapses to mobile view
 * - UI context for managing dialogs and state across admin pages
 * 
 * The layout checks for admin role and redirects non-admin users.
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user && !loading) {
        router.push('/auth/login?returnUrl=/admin');
        return;
      }

      if (user) {
        try {
          // Check if the user has admin role in the profiles table
          const supabase = createClient();
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
            router.push('/');
            return;
          }

          const hasAdminRole = data?.role === 'admin';
          setIsAdmin(hasAdminRole);

          if (!hasAdminRole) {
            router.push('/');
          }
        } catch (error) {
          console.error('Error verifying admin role:', error);
          setIsAdmin(false);
          router.push('/');
        }
      }
    };

    checkAdminStatus();
  }, [user, loading, router]);

  // Show loading state while checking admin status
  if (loading || isAdmin === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Verifying access...</p>
        </div>
      </div>
    );
  }

  // If not admin, don't render anything (redirect should happen in useEffect)
  if (!isAdmin) {
    return null;
  }

  return (
    <UiProvider>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Desktop Sidebar */}
        <aside className="fixed inset-y-0 z-50 hidden w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 md:flex md:flex-col">
          <div className="flex h-14 items-center border-b border-gray-200 dark:border-gray-800 px-4">
            <Link href="/admin" className="flex items-center gap-2 font-semibold">
              <Settings className="h-6 w-6 text-amber-500" />
              <span className="text-lg font-bold">Admin Dashboard</span>
            </Link>
          </div>
          <ScrollArea className="flex-1 py-4">
            <nav className="grid gap-2 px-2">
              <div className="px-3 py-2">
                <h3 className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Admin Controls</h3>
                <div className="grid gap-1">
                  {navItems.map((item, i) => (
                    <Link 
                      key={i}
                      href={item.href} 
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800",
                        pathname === item.href ? "bg-gray-100 dark:bg-gray-800 text-amber-500" : "text-gray-700 dark:text-gray-300"
                      )}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          </ScrollArea>
          <div className="border-t border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Admin" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <div className="text-sm font-medium">Admin</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</div>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Mobile header */}
        <div className="md:hidden flex h-14 items-center border-b border-gray-200 dark:border-gray-800 px-4 sticky top-0 z-50 bg-white dark:bg-gray-950">
          <Button variant="outline" size="icon" className="mr-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
          <div className="flex-1 flex justify-between items-center">
            <Link href="/admin" className="flex items-center gap-2 font-semibold">
              <Settings className="h-5 w-5 text-amber-500" />
              <span className="text-lg font-bold">Admin</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Admin" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
            <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-950 p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <Link href="/admin" className="flex items-center gap-2 font-semibold">
                  <Settings className="h-5 w-5 text-amber-500" />
                  <span className="text-lg font-bold">Admin</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="grid gap-2">
                {navItems.map((item, i) => (
                  <Link 
                    key={i}
                    href={item.href} 
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800",
                      pathname === item.href ? "bg-gray-100 dark:bg-gray-800 text-amber-500" : "text-gray-700 dark:text-gray-300"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}
        
        {/* Main content */}
        <div className="flex flex-col flex-1 md:pl-64">
          {/* Desktop header */}
          <header className="sticky top-0 z-40 hidden h-14 items-center border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 md:flex">
            <div className="flex flex-1 items-center justify-end gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
              <Button 
                className="bg-amber-500 hover:bg-amber-600 text-black"
                size="sm"
              >
                <BarChart className="w-4 h-4 mr-2" />
                Run Simulation
              </Button>
            </div>
          </header>
          
          {/* Page content */}
          <main className="flex-1 p-6 pt-20 md:pt-6">{children}</main>
        </div>
        
        {/* Toast notifications */}
        <Toaster position="top-right" richColors />
      </div>
    </UiProvider>
  );
} 