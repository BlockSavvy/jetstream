import { cn } from "@/lib/utils";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { ReactNode } from "react";

interface EnhancedBadgeProps extends BadgeProps {
  status?: "open" | "accepted" | "completed" | "scheduled" | "boarding" | "in_air" | "cancelled" | "available" | "maintenance" | "unavailable";
  children: ReactNode;
}

/**
 * Enhanced Badge Component
 * 
 * A badge with improved contrast specifically for the admin dashboard.
 * Provides different styling based on status values.
 */
export function EnhancedBadge({ status, children, className, ...props }: EnhancedBadgeProps) {
  // Status color mapping with enhanced contrast
  const statusColors: Record<string, string> = {
    // JetShare offer status
    open: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800",
    accepted: "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-200 dark:border-green-800",
    completed: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700",
    
    // Flight status
    scheduled: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-800",
    boarding: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800",
    in_air: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800", 
    cancelled: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-200 dark:border-red-800",
    
    // Jet status
    available: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800",
    maintenance: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800",
    unavailable: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800",
  };

  return (
    <Badge 
      className={cn(
        "font-medium border",
        status ? statusColors[status] || "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700" : "",
        className
      )} 
      {...props}
    >
      {children}
    </Badge>
  );
} 