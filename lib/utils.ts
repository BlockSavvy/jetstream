import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDate, formatTime, formatCurrency } from "./utils/format"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export formatting utilities from utils/format.ts
export { formatDate, formatTime, formatCurrency }

/**
 * Formats a jet image URL based on manufacturer and model
 */
export const formatImageUrl = (jetId?: string, path?: string): string => {
  if (path) return path;
  
  try {
    // If jetId contains manufacturer and model info (like "gulfstream-g650")
    const parts = jetId?.toLowerCase().split('-') || [];
    const manufacturer = parts[0] || 'default';
    const model = parts.slice(1).join('-') || 'jet';
    
    // Return a standardized path
    return `/images/jets/${manufacturer}-${model}.jpg`;
  } catch (e) {
    console.error('Error formatting jet image URL:', e);
    return '/images/jets/default-jet.jpg';
  }
};

/**
 * Formats a jet interior image URL based on manufacturer and model
 */
export const formatJetInteriorImageUrl = (manufacturer?: string, model?: string): string => {
  try {
    if (!manufacturer || !model) {
      return '/images/jets/interior/default-interior.jpg';
    }
    
    const manufacturerName = manufacturer.toLowerCase().replace(/\s+/g, '-');
    const modelName = model.toLowerCase().replace(/\s+/g, '-');
    
    return `/images/jets/interior/${manufacturerName}-${modelName}-interior.jpg`;
  } catch (e) {
    console.error('Error formatting jet interior image URL:', e);
    return '/images/jets/interior/default-interior.jpg';
  }
};
