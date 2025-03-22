/**
 * Utility functions for handling jet images
 */

// Map of jet manufacturers/models to their respective image paths
export const jetImageMap: Record<string, any> = {
  'Gulfstream': {
    'G650': ['/images/jets/gulfstream/g650.jpg', '/images/jets/gulfstream/g650-1.jpg'],
    'G550': ['/images/jets/gulfstream/g550.jpg', '/images/jets/gulfstream/g550-1.jpg'],
    'G450': ['/images/jets/gulfstream/g450.jpg', '/images/jets/gulfstream/g450-2.jpg'],
    'G280': ['/images/jets/gulfstream/g280.jpg', '/images/jets/gulfstream/g280-1.jpg'],
    // Default for other Gulfstream models
    'default': ['/images/jets/gulfstream/g650.jpg']
  },
  'Bombardier': {
    'Global 7500': ['/images/jets/bombardier/Global7500.jpg', '/images/jets/bombardier/Global7500-1.jpg'],
    'Global 6000': ['/images/jets/bombardier/Global6000.jpg', '/images/jets/bombardier/Global6000-1.jpg'],
    'Challenger 350': ['/images/jets/bombardier/Challenger350.jpg', '/images/jets/bombardier/Challenger350-1.jpg'],
    'Learjet 75': ['/images/jets/bombardier/Learjet75.jpg', '/images/jets/bombardier/Learjet75-1.jpg'],
    // Default for other Bombardier models
    'default': ['/images/jets/bombardier/Global7500.jpg']
  },
  'Cessna': {
    'Citation X+': ['/images/jets/cessna/CitationX.jpg', '/images/jets/cessna/CitationX-1.jpg'],
    'Citation Longitude': ['/images/jets/cessna/CitationLongitude.jpg', '/images/jets/cessna/CitationLongitude-1.jpg'],
    'Citation Latitude': ['/images/jets/cessna/CitationLatitude.jpg', '/images/jets/cessna/CitationLatitude-1.jpg'],
    // Default for other Cessna models
    'default': ['/images/jets/cessna/CitationX.jpg']
  },
  'Dassault': {
    'Falcon 7X': ['/images/jets/dassault/Falcon7x.jpg', '/images/jets/dassault/Falcon7x-1.jpg'],
    'Falcon 8X': ['/images/jets/dassault/Falcon8X.jpg', '/images/jets/dassault/Falcon8x-1.jpg'],
    'Falcon 2000LXS': ['/images/jets/dassault/Falcon2000.jpg', '/images/jets/dassault/Falcon2000-1.jpg'],
    // Default for other Dassault models
    'default': ['/images/jets/dassault/Falcon8X.jpg']
  },
  'Embraer': {
    'Phenom 300E': ['/images/jets/embraer/Phenom300.jpg', '/images/jets/embraer/Phenom300-1.jpg'], 
    'Praetor 600': ['/images/jets/embraer/Praetor600.jpg', '/images/jets/embraer/Praetor600-1.jpg'],
    'Legacy 500': ['/images/jets/embraer/Legacy500.jpg', '/images/jets/embraer/Legacy500-1.jpg'],
    // Default for other Embraer models
    'default': ['/images/jets/embraer/Phenom300.jpg']
  },
  'Hawker': {
    'Hawker 4000': ['/images/jets/hawker/Hawker4000.jpg', '/images/jets/hawker/Hawker4000-1.jpg'],
    // Default for other Hawker models
    'default': ['/images/jets/hawker/Hawker4000.jpg']
  },
  'Honda': {
    'HondaJet Elite': ['/images/jets/hondajet/HondaJetElite.jpg', '/images/jets/hondajet/HondaJetElite-1.jpg'],
    // Default for Honda models
    'default': ['/images/jets/hondajet/HondaJetElite.jpg']
  },
  'Pilatus': {
    'PC-24': ['/images/jets/pilatus/PC24.jpg', '/images/jets/pilatus/PC24-1.jpg'],
    // Default for Pilatus models
    'default': ['/images/jets/pilatus/PC24.jpg']
  },
  'Beechcraft': {
    'King Air 350i': ['/images/jets/beechcraft/KingAir350i.jpg', '/images/jets/beechcraft/KingAir350i-1.webp'],
    // Default for Beechcraft models
    'default': ['/images/jets/beechcraft/KingAir350i.jpg']
  },
  // Default images for any manufacturer not listed above
  'default': ['/images/jets/gulfstream/g650.jpg']
};

/**
 * Get image paths for a specific jet based on manufacturer and model
 * @param manufacturer The jet manufacturer
 * @param model The jet model
 * @returns Array of image paths
 */
export function getJetImagePaths(manufacturer: string, model: string): string[] {
  const manufacturerMap = jetImageMap[manufacturer] || jetImageMap['default'];
  const modelPaths = manufacturerMap[model] || manufacturerMap['default'];
  
  return modelPaths as string[];
}

/**
 * Get the primary image for a jet
 * @param manufacturer The jet manufacturer
 * @param model The jet model
 * @param fallbackUrl A fallback URL to use if no matching image is found
 * @returns The primary image path or fallback URL
 */
export function getPrimaryJetImage(
  manufacturer: string, 
  model: string, 
  fallbackUrl: string = '/images/jets/gulfstream/g650.jpg'
): string {
  const imagePaths = getJetImagePaths(manufacturer, model);
  return imagePaths && imagePaths.length > 0 ? imagePaths[0] : fallbackUrl;
}

/**
 * Get a jet image based on the jet data in the database
 * This is useful when you already have a jet object and just need to get an image
 * @param jet The jet object with manufacturer and model properties
 * @param index The index of the image to retrieve (0 for primary)
 * @param fallbackUrl A fallback URL to use if no matching image is found
 * @returns The jet image path or fallback URL
 */
export function getJetImage(
  jet: { manufacturer: string; model: string; images?: string[] | null },
  index: number = 0,
  fallbackUrl: string = '/images/jets/gulfstream/g650.jpg'
): string {
  // First try to use the images from the jet object if they exist
  if (jet.images && jet.images.length > index) {
    return jet.images[index];
  }
  
  // Otherwise generate the image path based on manufacturer and model
  const imagePaths = getJetImagePaths(jet.manufacturer, jet.model);
  return imagePaths && imagePaths.length > index ? imagePaths[index] : fallbackUrl;
} 