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
    'G700': ['/images/jets/gulfstream/g650.jpg'], // Using G650 as temp fallback
    'G600': ['/images/jets/gulfstream/g650.jpg'], // Using G650 as temp fallback
    // Default for other Gulfstream models
    'default': ['/images/jets/gulfstream/g650.jpg']
  },
  'Bombardier': {
    'Global 7500': ['/images/jets/bombardier/Global7500.jpg', '/images/jets/bombardier/Global7500-1.jpg'],
    'Global 6000': ['/images/jets/bombardier/Global6000.jpg', '/images/jets/bombardier/Global6000-1.jpg'],
    'Challenger 350': ['/images/jets/bombardier/Challenger350.jpg', '/images/jets/bombardier/Challenger350-1.jpg'],
    'Learjet 75': ['/images/jets/bombardier/Learjet75.jpg', '/images/jets/bombardier/Learjet75-1.jpg'],
    'Global 8000': ['/images/jets/bombardier/Global7500.jpg'], // Using Global 7500 as temp fallback
    'Challenger 650': ['/images/jets/bombardier/Challenger350.jpg'], // Using Challenger 350 as temp fallback
    // Default for other Bombardier models
    'default': ['/images/jets/bombardier/Global7500.jpg']
  },
  'Cessna': {
    'Citation X+': ['/images/jets/cessna/CitationX.jpg', '/images/jets/cessna/CitationX-1.jpg'],
    'Citation Longitude': ['/images/jets/cessna/CitationLongitude.jpg', '/images/jets/cessna/CitationLongitude-1.jpg'],
    'Citation Latitude': ['/images/jets/cessna/CitationLatitude.jpg', '/images/jets/cessna/CitationLatitude-1.jpg'],
    'Citation Sovereign+': ['/images/jets/cessna/CitationLongitude.jpg'], // Using Longitude as temp fallback
    'Citation CJ4': ['/images/jets/cessna/CitationX.jpg'], // Using X as temp fallback
    // Default for other Cessna models
    'default': ['/images/jets/cessna/CitationX.jpg']
  },
  'Dassault': {
    'Falcon 7X': ['/images/jets/dassault/Falcon7x.jpg', '/images/jets/dassault/Falcon7x-1.jpg'],
    'Falcon 8X': ['/images/jets/dassault/Falcon8X.jpg', '/images/jets/dassault/Falcon8x-1.jpg'],
    'Falcon 2000LXS': ['/images/jets/dassault/Falcon2000.jpg', '/images/jets/dassault/Falcon2000-1.jpg'],
    'Falcon 900LX': ['/images/jets/dassault/Falcon8X.jpg'], // Using 8X as temp fallback
    'Falcon 6X': ['/images/jets/dassault/Falcon8X.jpg'], // Using 8X as temp fallback
    // Default for other Dassault models
    'default': ['/images/jets/dassault/Falcon8X.jpg']
  },
  'Embraer': {
    'Phenom 300E': ['/images/jets/embraer/Phenom300.jpg', '/images/jets/embraer/Phenom300-1.jpg'], 
    'Praetor 600': ['/images/jets/embraer/Praetor600.jpg', '/images/jets/embraer/Praetor600-1.jpg'],
    'Legacy 500': ['/images/jets/embraer/Legacy500.jpg', '/images/jets/embraer/Legacy500-1.jpg'],
    'Legacy 650E': ['/images/jets/embraer/Legacy500.jpg'], // Using Legacy 500 as temp fallback
    'Praetor 500': ['/images/jets/embraer/Phenom300.jpg'], // Using Phenom 300 as temp fallback
    'Lineage 1000E': ['/images/jets/embraer/Legacy500.jpg'], // Using Legacy 500 as temp fallback
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
  // Add Airbus with actual images
  'Airbus': {
    'ACJ319neo': ['/images/jets/airbus/ACJ319neo.jpg', '/images/jets/airbus/ACJ319neo-1.jpg'],
    'ACJ320neo': ['/images/jets/airbus/ACJ320neo.jpg', '/images/jets/airbus/ACJ320neo-1.jpg'],
    'ACJ350 XWB': ['/images/jets/airbus/ACJ350 XWB.jpg', '/images/jets/airbus/ACJ350 XWB-1.jpg'],
    'ACH130': ['/images/jets/airbus/ACH130.jpg', '/images/jets/airbus/ACH130-1.jpg'],
    'ACH145': ['/images/jets/airbus/ACH145.jpg', '/images/jets/airbus/ACH145-1.jpg'],
    'default': ['/images/jets/airbus/ACJ319neo.jpg']
  },
  // Add Boeing with actual images
  'Boeing': {
    'BBJ 737': ['/images/jets/boeing/BBJ737.jpg', '/images/jets/boeing/BBJ737-1.jpg'],
    'BBJ 787': ['/images/jets/boeing/BBJ787.jpg', '/images/jets/boeing/BBJ787-1.jpg'],
    'BBJ 777X': ['/images/jets/boeing/BBJ777X.jpg', '/images/jets/boeing/BBJ777X-1.jpg'],
    'BBJ MAX': ['/images/jets/boeing/BBJMAX.jpg', '/images/jets/boeing/BBJMAX-1.jpg'],
    'BBJ 747-8': ['/images/jets/boeing/BBJ747-8.jpg', '/images/jets/boeing/BBJ747-8-1.jpg'],
    'default': ['/images/jets/boeing/BBJ737.jpg']
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
  // First try to get the manufacturer map
  const manufacturerMap = jetImageMap[manufacturer];
  
  // If manufacturer doesn't exist, use the default fallback
  if (!manufacturerMap) {
    return jetImageMap['default'];
  }
  
  // Try to get the specific model or use manufacturer default
  const modelPaths = manufacturerMap[model] || manufacturerMap['default'];
  
  // Ensure we always return a valid array of strings
  if (!modelPaths || !Array.isArray(modelPaths) || modelPaths.length === 0) {
    return jetImageMap['default'];
  }
  
  return modelPaths;
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