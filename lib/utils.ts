import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDate, formatTime, formatCurrency } from "./utils/format"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export formatting utilities from utils/format.ts
export { formatDate, formatTime, formatCurrency }
