'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Plane,
  Share2,
  PlaneTakeoff,
  UserCog,
  BrainCircuit
} from 'lucide-react';

// Define navigation items
const navigationItems = [
  {
    name: 'Overview',
    href: '/admin/overview',
    icon: LayoutDashboard
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users
  },
  {
    name: 'Jets',
    href: '/admin/jets',
    icon: Plane
  },
  {
    name: 'JetShare',
    href: '/admin/jetshare',
    icon: Share2
  },
  {
    name: 'Offers',
    href: '/admin/offers',
    icon: PlaneTakeoff
  },
  {
    name: 'Crews',
    href: '/admin/crews',
    icon: UserCog
  },
  {
    name: 'Simulation',
    href: '/admin/simulation',
    icon: BrainCircuit
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  
  return (
    <div className="h-full flex flex-col py-4 overflow-y-auto">
      <div className="px-4 mb-6">
        <Link href="/admin/overview" className="flex items-center">
          <span className="font-bold text-xl">JetStream Admin</span>
        </Link>
      </div>
      
      <nav className="space-y-1 px-2 flex-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive 
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' 
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
                'group'
              )}
            >
              <item.icon className={cn(
                'mr-3 h-5 w-5 flex-shrink-0',
                isActive 
                  ? 'text-amber-500 dark:text-amber-400' 
                  : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400'
              )} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto px-4 pt-6 pb-3">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <div>JetStream Admin Panel</div>
          <div className="mt-1">Version 1.0.0</div>
        </div>
      </div>
    </div>
  );
} 