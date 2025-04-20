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
  'KLAX': ['/images/airports/placeholder_airport_map.png', '/images/airports/placeholder_airport_map.png'],
  'KPBI': ['/images/airports/placeholder_airport_map.png', '/images/airports/placeholder_airport_map.png'],
  'KMIA': ['/images/airports/placeholder_airport_map.png', '/images/airports/placeholder_airport_map.png'],
  'KLAS': ['/images/airports/placeholder_airport_map.png', '/images/airports/placeholder_airport_map.png'],
  'KSFO': ['/images/airports/placeholder_airport_map.png', '/images/airports/placeholder_airport_map.png'],
  'KTEB': ['/images/airports/placeholder_airport_map.png', '/images/airports/placeholder_airport_map.png'],
  'KVAN': ['/images/airports/placeholder_airport_map.png', '/images/airports/placeholder_airport_map.png'],
  'KHPN': ['/images/airports/placeholder_airport_map.png', '/images/airports/placeholder_airport_map.png'],
  'KSDL': ['/images/airports/placeholder_airport_map.png', '/images/airports/placeholder_airport_map.png'],
  
  // International airports
  'EGLL': ['/images/airports/placeholder_airport_map.png', '/images/airports/placeholder_airport_map.png'], // London Heathrow
  'LFPB': ['/images/airports/placeholder_airport_map.png', '/images/airports/placeholder_airport_map.png'], // Paris Le Bourget
  'EGGW': ['/images/airports/placeholder_airport_map.png', '/images/airports/placeholder_airport_map.png'], // London Luton
  'EDDM': ['/images/airports/placeholder_airport_map.png', '/images/airports/placeholder_airport_map.png'], // Munich
  'EDDB': ['/images/airports/placeholder_airport_map.png', '/images/airports/placeholder_airport_map.png'], // Berlin Brandenburg
  'RJTT': ['/images/airports/placeholder_airport_map.png', '/images/airports/placeholder_airport_map.png'], // Tokyo Haneda
  'VHHH': ['/images/airports/placeholder_airport_map.png', '/images/airports/placeholder_airport_map.png'], // Hong Kong
  'YSSY': ['/images/airports/placeholder_airport_map.png', '/images/airports/placeholder_airport_map.png'], // Sydney
  'OMDB': ['/images/airports/placeholder_airport_map.png', '/images/airports/placeholder_airport_map.png'], // Dubai
  'VIDP': ['/images/airports/placeholder_airport_map.png', '/images/airports/placeholder_airport_map.png'], // New Delhi
  
  // Default fallback
  'default': ['/images/airports/placeholder_airport_map.png']
};

/**
 * Get image paths for a specific airport based on ICAO code
 * @param airportCode The airport ICAO code (e.g., 'KJFK')
 * @returns Array of image paths
 */
export function getAirportImagePaths(airportCode: string): string[] {
  // If the exact code match exists, return it
  if (airportImageMap[airportCode]) {
    return airportImageMap[airportCode];
  }
  
  // Otherwise return the default fallback
  return airportImageMap['default'];
}

/**
 * Get the primary image for an airport from its data
 * @param airport The airport object with image_url property
 * @param fallbackUrl A fallback URL to use if no matching image is found
 * @returns The airport image path or fallback URL
 */
export function getAirportImage(
  airport: { code: string; image_url?: string | null },
  fallbackUrl: string = PLACEHOLDER_AIRPORT_MAP
): string {
  if (!airport || !airport.code) {
    return fallbackUrl;
  }
  
  // First, check for a code-specific image file
  const code = airport.code.toLowerCase();
  const codeSpecificPath = `/images/airports/${code}.png`;
  
  // Try to see if this file exists by checking in the airportImageMap
  if (airportImageMap[airport.code.toUpperCase()]) {
    return airportImageMap[airport.code.toUpperCase()][0];
  }
  
  // Next, if the airport object has an image_url property, use it
  if (airport.image_url) {
    return airport.image_url;
  }
  
  // For supported airport codes, try the code-specific path directly
  // This allows direct use of airport code-named files without updating the map
  try {
    // Check if we have a custom image for this airport
    // Since we can't check file existence on client, we'll return the path
    // and let the Image component handle fallback if needed
    if (['kjfk', 'kfll', 'klax', 'kord', 'ksfo'].includes(code)) {
      return codeSpecificPath;
    }
  } catch (e) {
    console.warn(`Error checking for code-specific airport image: ${e}`);
  }
  
  // Finally, return the default fallback
  return fallbackUrl;
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
 * This will first try to get a specific route map if available,
 * then fallback to the departure airport's map
 * @param departureAirport The departure airport object
 * @param arrivalAirport The arrival airport object 
 * @returns The route map image path or fallback URL
 */
export function getRouteMapImage(
  departureAirport: { code: string; image_url?: string | null; route_map_template?: string | null } | null,
  arrivalAirport: { code: string; image_url?: string | null } | null
): string {
  // If we don't have both airports, return the placeholder
  if (!departureAirport || !arrivalAirport) {
    return PLACEHOLDER_AIRPORT_MAP;
  }
  
  // If the departure airport has a route map template, use it
  // This would be used if we have a special template for routes from this airport
  if (departureAirport.route_map_template) {
    return departureAirport.route_map_template;
  }
  
  // Otherwise, fallback to the departure airport's image
  return getAirportImage(departureAirport);
}

/**
 * Get a route map for two airport codes
 * This is a convenience function that takes codes instead of airport objects
 * @param departureCode ICAO code of departure airport
 * @param arrivalCode ICAO code of arrival airport
 * @returns Placeholder image path until actual airport data is fetched
 */
export function getRouteMapForCodes(
  departureCode: string | null,
  arrivalCode: string | null
): string {
  // When just using codes, we can only return the placeholder
  // The component using this should fetch the actual airport data
  return PLACEHOLDER_AIRPORT_MAP;
} 