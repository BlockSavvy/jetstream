import { ReactNode } from 'react';
import { 
  LayoutDashboard, 
  Plane, 
  Wallet, 
  Users, 
  Settings, 
  Bell, 
  CreditCard,
  CalendarDays,
  MessageSquare,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/dashboard/flights', label: 'My Flights', icon: <Plane className="h-5 w-5" /> },
  { href: '/dashboard/tokens', label: 'My Tokens', icon: <Wallet className="h-5 w-5" /> },
  { href: '/dashboard/matching', label: 'AI Matching', icon: <Users className="h-5 w-5" /> },
  { href: '/dashboard/calendar', label: 'Calendar', icon: <CalendarDays className="h-5 w-5" /> },
  { href: '/dashboard/messages', label: 'Messages', icon: <MessageSquare className="h-5 w-5" /> },
];

const secondaryNavItems = [
  { href: '/dashboard/settings', label: 'Account Settings', icon: <Settings className="h-5 w-5" /> },
  { href: '/dashboard/billing', label: 'Billing', icon: <CreditCard className="h-5 w-5" /> },
  { href: '/dashboard/help', label: 'Help & Support', icon: <HelpCircle className="h-5 w-5" /> },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 z-10 hidden w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 md:flex md:flex-col">
        <div className="flex h-14 items-center border-b border-gray-200 dark:border-gray-800 px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Plane className="h-6 w-6 text-amber-500" />
            <span className="text-lg font-bold">JetStream</span>
          </Link>
        </div>
        <ScrollArea className="flex-1 py-4">
          <nav className="grid gap-2 px-2">
            <div className="px-3 py-2">
              <h3 className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Main</h3>
              <div className="grid gap-1">
                {navItems.map((item, i) => (
                  <Link 
                    key={i}
                    href={item.href} 
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800",
                      item.href === '/dashboard' ? "bg-gray-100 dark:bg-gray-800 text-amber-500" : "text-gray-700 dark:text-gray-300"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <Separator className="my-2" />
            <div className="px-3 py-2">
              <h3 className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Account</h3>
              <div className="grid gap-1">
                {secondaryNavItems.map((item, i) => (
                  <Link 
                    key={i}
                    href={item.href} 
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
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
              <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Avatar" />
              <AvatarFallback>JS</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="text-sm font-medium">John Smith</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">john@example.com</div>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Mobile header */}
      <div className="md:hidden flex h-14 items-center border-b border-gray-200 dark:border-gray-800 px-4 sticky top-0 z-30 bg-white dark:bg-gray-950">
        <Button variant="outline" size="icon" className="mr-2">
          <Plane className="h-5 w-5 text-amber-500" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <div className="flex-1 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="text-lg font-bold">JetStream</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Avatar" />
              <AvatarFallback>JS</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-col flex-1 md:pl-64">
        {/* Desktop header */}
        <header className="sticky top-0 z-20 hidden h-14 items-center border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 md:flex">
          <div className="flex flex-1 items-center justify-end gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
            <Button 
              className="bg-amber-500 hover:bg-amber-600 text-black"
              size="sm"
            >
              <Plane className="w-4 h-4 mr-2" />
              Book a Flight
            </Button>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 p-6 pt-16 md:pt-6">{children}</main>
      </div>
    </div>
  );
} 