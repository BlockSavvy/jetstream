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
  BrainCircuit,
  Database,
  Braces,
  Grid
} from 'lucide-react';

// Define the type for navigation items
type NavItem = {
  name: string;
  href: string | undefined;
  icon: any;
  isCategory?: boolean;
  submenu?: {
    name: string;
    href: string;
    icon?: any;
  }[];
};

// Define navigation items
const navigationItems: NavItem[] = [
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
    href: undefined,
    icon: Plane,
    isCategory: true,
    submenu: [
      {
        name: 'Jets List',
        href: '/admin/jets'
      },
      {
        name: 'Seat Layouts',
        href: '/admin/jets/layouts',
        icon: Grid
      }
    ]
  },
  {
    name: 'JetStream Flights',
    href: '/admin/flights',
    icon: PlaneTakeoff
  },
  {
    name: 'JetShare Offers',
    href: '/admin/jetshare',
    icon: Share2
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
  },
  {
    name: 'Database',
    href: '/admin/database',
    icon: Database
  },
  {
    name: 'Embeddings',
    href: '/admin/embeddings',
    icon: Braces
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
          const isActive = item.href ? (pathname === item.href || pathname?.startsWith(`${item.href}/`)) : false;
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          
          return (
            <div key={item.name} className="flex flex-col space-y-1">
              {/* Main menu item */}
              {item.isCategory ? (
                <div
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md',
                    'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50',
                    'group'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                  {item.name}
                </div>
              ) : (
                <Link
                  href={item.href || '#'}
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
              )}
              
              {/* Submenu items if any */}
              {hasSubmenu && (
                <div className="ml-8 pl-1 border-l border-gray-200 dark:border-gray-700 space-y-1">
                  {item.submenu!.map((subitem) => {
                    const isSubActive = pathname === subitem.href;
                    
                    return (
                      <Link
                        key={subitem.name}
                        href={subitem.href}
                        className={cn(
                          'flex items-center pl-2 py-2 text-sm font-medium rounded-md transition-colors',
                          isSubActive 
                            ? 'text-amber-600 dark:text-amber-400' 
                            : 'text-gray-600 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400',
                        )}
                      >
                        {subitem.icon && (
                          <subitem.icon className="mr-2 h-4 w-4 flex-shrink-0" />
                        )}
                        <span className="truncate">{subitem.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
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