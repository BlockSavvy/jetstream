/**
 * Utility functions for handling airport images from database
 */

// Default placeholder path for airport maps
const PLACEHOLDER_AIRPORT_MAP = '/images/airports/placeholder_airport_map.png';

// Map of airports to their respective image paths
export const airportImageMap: Record<string, string[]> = {
  // Major US airports with custom images
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

/**
 * Get array of image paths for the given airport code
 */
export function getAirportImagePaths(airportCode: string): string[] {
  if (airportImageMap[airportCode]) {
    return airportImageMap[airportCode];
  }
  
  // Fallback
  return airportImageMap['default'];
}

/**
 * Get an appropriate airport image path based on the airport details
 * 
 * @param airport The airport object with image_url property
 * @param fallbackUrl A URL to use if no airport image is found
 * @returns The airport image path or fallback URL
 */
export function getAirportImage(
  airport: { code: string; image_url?: string | null },
  fallbackUrl: string = PLACEHOLDER_AIRPORT_MAP
): string {
  // Return fallback if no airport
  if (!airport || !airport.code) {
    return fallbackUrl;
  }
  
  try {
    // Try to see if this file exists by checking in the airportImageMap
    if (airportImageMap[airport.code.toUpperCase()]) {
      return airportImageMap[airport.code.toUpperCase()][0];
    }
    
    // Next, if the airport object has an image_url property, use it
    if (airport.image_url) {
      return airport.image_url;
    }
    
    // Use the fallback if provided
    return fallbackUrl;
  } catch (e) {
    console.warn(`Error checking for code-specific airport image: ${e}`);
    return fallbackUrl;
  }
}

/**
 * Extract airport code from a formatted string like "City (CODE)"
 * @param formattedString The formatted string with city and code
 * @returns The airport code or null if not found
 */
export function extractAirportCode(formattedString: string): string | null {
  if (!formattedString) return null;
  const match = formattedString.match(/\(([A-Z]{3,4})\)$/);
  return match ? match[1] : null;
}

/**
 * Extract airport details from a formatted string like "City (CODE)"
 * @param formattedString The formatted string with city and code
 * @returns An object with city and code or null if not found
 */
export function extractAirportDetails(formattedString: string): { city: string; code: string } | null {
  if (!formattedString) return null;
  const match = formattedString.match(/^(.+)\s+\(([A-Z]{3,4})\)$/);
  return match ? { city: match[1], code: match[2] } : null;
}

/**
 * Get an airport map image for a route between two airports
 * 
 * First tries to find a specific route map template for this pair of airports,
 * then fallback to the departure airport's map
 */
export function getRouteMapImage(
  departureAirport: { code: string; image_url?: string | null; route_map_template?: string | null } | null,
  arrivalAirport: { code: string; image_url?: string | null } | null
): string {
  // If no airports, return the placeholder
  if (!departureAirport || !arrivalAirport) {
    return PLACEHOLDER_AIRPORT_MAP;
  }
  
  // If the departure airport has a route map template, use it
  if (departureAirport.route_map_template) {
    return departureAirport.route_map_template;
  }
  
  // Otherwise, fallback to the departure airport's image
  return getAirportImage(departureAirport);
}

/**
 * Get a route map image path for the given departure and arrival codes
 */
export function getRouteMapForCodes(departureCode: string, arrivalCode: string): string {
  // This is just a placeholder function that returns the placeholder map
  return PLACEHOLDER_AIRPORT_MAP;
} 