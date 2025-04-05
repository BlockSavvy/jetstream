import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReactNode } from "react";

interface ActionTooltipProps {
  children: ReactNode;
  label: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

/**
 * Action Tooltip Component
 * 
 * A tooltip component specifically designed for action buttons in the admin dashboard.
 * Provides helpful context for icon-only buttons.
 */
export function ActionTooltip({
  children,
  label,
  side = "top",
  align = "center"
}: ActionTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={50}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align}
          className="bg-black text-white border-black text-xs py-1 px-2"
        >
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 