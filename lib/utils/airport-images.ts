/**
 * Utility functions for handling airport images from database
 */

// Default placeholder path for airport maps
export const PLACEHOLDER_AIRPORT_MAP = '/images/airports/placeholder_airport_map.png';

/**
 * Generate a standardized airport image path from an airport code
 */
export function getAirportImage(code: string): string {
  if (!code) return PLACEHOLDER_AIRPORT_MAP;
  
  // Normalize the airport code (lowercase for file paths)
  const normalizedCode = code.toLowerCase();
  
  // Return a dynamically generated path based on standardized naming
  return `/images/airports/${normalizedCode}.png`;
}

/**
 * Extract just the ICAO airport code from strings like "Fort Lauderdale, FL (KFLL)" 
 */
export function extractAirportCode(input: string): string {
  if (!input) return '';
  
  // First try to extract code from parentheses like "Fort Lauderdale, FL (KFLL)"
  const codeInParentheses = input.match(/\(([A-Z0-9]{3,4})\)/i);
  if (codeInParentheses && codeInParentheses[1]) {
    return codeInParentheses[1].toUpperCase();
  }
  
  // As a fallback, extract first word which is typically the ICAO code
  const match = input.match(/^(\S+)/);
  return match ? match[1].toUpperCase() : '';
}

/**
 * Parse a city and code from a formatted string like "New York (JFK)"
 */
export function parseCityAndCode(input: string): { city: string; code: string } | null {
  if (!input) return null;
  const match = input.match(/(.+)\s+\(([A-Z]{3,4})\)$/);
  return match ? { city: match[1], code: match[2] } : null;
}

// Map of airports to their respective image paths
export const airportImageMap: Record<string, string[]> = {
  // Major US airports with custom images - using absolute paths
  'KJFK': ['/images/airports/kjfk.png', '/images/airports/kjfk.png'],
  'KFLL': ['/images/airports/kfll.png', '/images/airports/kfll.png'],
  
  // Other US airports
  'KLAX': [PLACEHOLDER_AIRPORT_MAP, PLACEHOLDER_AIRPORT_MAP],
  'KPBI': [PLACEHOLDER_AIRPORT_MAP, PLACEHOLDER_AIRPORT_MAP],
  'KMIA': [PLACEHOLDER_AIRPORT_MAP, PLACEHOLDER_AIRPORT_MAP],
  'KLAS': [PLACEHOLDER_AIRPORT_MAP, PLACEHOLDER_AIRPORT_MAP],
  'KSFO': [PLACEHOLDER_AIRPORT_MAP, PLACEHOLDER_AIRPORT_MAP],
  'KTEB': [PLACEHOLDER_AIRPORT_MAP, PLACEHOLDER_AIRPORT_MAP],
  'KVAN': [PLACEHOLDER_AIRPORT_MAP, PLACEHOLDER_AIRPORT_MAP],
  'KHPN': [PLACEHOLDER_AIRPORT_MAP, PLACEHOLDER_AIRPORT_MAP],
  'KSDL': [PLACEHOLDER_AIRPORT_MAP, PLACEHOLDER_AIRPORT_MAP],
  
  // International airports
  'EGLL': [PLACEHOLDER_AIRPORT_MAP, PLACEHOLDER_AIRPORT_MAP], // London Heathrow
  'LFPB': [PLACEHOLDER_AIRPORT_MAP, PLACEHOLDER_AIRPORT_MAP], // Paris Le Bourget
  'EGGW': [PLACEHOLDER_AIRPORT_MAP, PLACEHOLDER_AIRPORT_MAP], // London Luton
  'EDDM': [PLACEHOLDER_AIRPORT_MAP, PLACEHOLDER_AIRPORT_MAP], // Munich
  'EDDB': [PLACEHOLDER_AIRPORT_MAP, PLACEHOLDER_AIRPORT_MAP], // Berlin Brandenburg
  'RJTT': [PLACEHOLDER_AIRPORT_MAP, PLACEHOLDER_AIRPORT_MAP], // Tokyo Haneda
  'VHHH': [PLACEHOLDER_AIRPORT_MAP, PLACEHOLDER_AIRPORT_MAP], // Hong Kong
  'YSSY': [PLACEHOLDER_AIRPORT_MAP, PLACEHOLDER_AIRPORT_MAP], // Sydney
  'OMDB': [PLACEHOLDER_AIRPORT_MAP, PLACEHOLDER_AIRPORT_MAP], // Dubai
  'VIDP': [PLACEHOLDER_AIRPORT_MAP, PLACEHOLDER_AIRPORT_MAP], // New Delhi
  
  // Default fallback
  'default': [PLACEHOLDER_AIRPORT_MAP]
}; 