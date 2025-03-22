/**
 * Script to update jet images in the database to use the local images from the jets directory
 * Run this script after the initial seeding to replace placeholder images with the proper aircraft images
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Map of jet manufacturers/models to their respective image paths
const jetImageMap = {
  'Gulfstream': {
    'G650': ['/images/jets/gulfstream/g650.jpg', '/images/jets/gulfstream/g650-1.jpg'],
    'G550': ['/images/jets/gulfstream/g550.jpg', '/images/jets/gulfstream/g550-1.jpg'],
    'G450': ['/images/jets/gulfstream/g450.jpg', '/images/jets/gulfstream/g450-2.jpg'],
    'G280': ['/images/jets/gulfstream/g280.jpg', '/images/jets/gulfstream/g280-1.jpg'],
    'G700': ['/images/jets/gulfstream/g700.jpg', '/images/jets/gulfstream/g700-1.jpg'],
    'G600': ['/images/jets/gulfstream/g600.jpg', '/images/jets/gulfstream/g600-1.jpg'],
    // Default for other Gulfstream models
    'default': ['/images/jets/gulfstream/g650.jpg']
  },
  'Bombardier': {
    'Global 7500': ['/images/jets/bombardier/Global7500.jpg', '/images/jets/bombardier/Global7500-1.jpg'],
    'Global 6000': ['/images/jets/bombardier/Global6000.jpg', '/images/jets/bombardier/Global6000-1.jpg'],
    'Challenger 350': ['/images/jets/bombardier/Challenger350.jpg', '/images/jets/bombardier/Challenger350-1.jpg'],
    'Learjet 75': ['/images/jets/bombardier/Learjet75.jpg', '/images/jets/bombardier/Learjet75-1.jpg'],
    'Global 8000': ['/images/jets/bombardier/Global8000.jpg', '/images/jets/bombardier/Global8000-1.jpg'],
    'Challenger 650': ['/images/jets/bombardier/Challenger650.jpg', '/images/jets/bombardier/Challenger650-1.jpg'],
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
    'Falcon 900LX': ['/images/jets/dassault/Falcon 900LX.jpg', '/images/jets/dassault/Falcon 900LX-1.jpg'],
    'Falcon 6X': ['/images/jets/dassault/Falcon8X.jpg'], // Still using 8X as temp fallback
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
 */
function getImagePathsForJet(manufacturer, model) {
  const manufacturerMap = jetImageMap[manufacturer] || jetImageMap['default'];
  const modelPaths = manufacturerMap[model] || manufacturerMap['default'];
  
  return modelPaths;
}

/**
 * Update jet images in the database
 */
async function updateJetImages() {
  try {
    console.log('Fetching all jets from database...');
    
    // Get all jets from the database
    const { data: jets, error } = await supabase
      .from('jets')
      .select('*');
      
    if (error) {
      console.error('Error fetching jets:', error);
      return;
    }
    
    console.log(`Found ${jets.length} jets. Updating their images...`);
    
    // Update each jet with the appropriate images
    for (const jet of jets) {
      const imagePaths = getImagePathsForJet(jet.manufacturer, jet.model);
      
      // Update the jet record
      const { error: updateError } = await supabase
        .from('jets')
        .update({ images: imagePaths })
        .eq('id', jet.id);
        
      if (updateError) {
        console.error(`Error updating jet ${jet.manufacturer} ${jet.model}:`, updateError);
      } else {
        console.log(`Updated ${jet.manufacturer} ${jet.model} with images:`, imagePaths);
      }
    }
    
    console.log('Jet image update complete!');
    
  } catch (err) {
    console.error('Error updating jet images:', err);
  }
}

// Run the update function
updateJetImages(); 