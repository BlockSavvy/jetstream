require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Crew data with pre-selected Unsplash image URLs
const crewData = [
  {
    name: 'Alexandra Davis',
    type: 'Comedy Host',
    imageUrl: 'https://source.unsplash.com/featured/?professional,woman,portrait,headshot/600x600',
    specializations: ['Comedy', 'Live Podcasts']
  },
  {
    name: 'Michael Chen',
    type: 'Business Speaker',
    imageUrl: 'https://source.unsplash.com/featured/?professional,asian,man,portrait,business/600x600',
    specializations: ['TED-talks', 'Business Networking']
  },
  {
    name: 'Sophia Johnson',
    type: 'Wellness Coach',
    imageUrl: 'https://source.unsplash.com/featured/?wellness,woman,portrait,professional/600x600',
    specializations: ['Wellness Sessions', 'Mindfulness']
  },
  {
    name: 'James Wilson',
    type: 'Wine Sommelier',
    imageUrl: 'https://source.unsplash.com/featured/?sommelier,man,portrait,formal/600x600',
    specializations: ['Wine Tasting', 'Culinary Experiences']
  },
  {
    name: 'Emma Rodriguez',
    type: 'Mystery Host',
    imageUrl: 'https://source.unsplash.com/featured/?latina,woman,portrait,professional/600x600',
    specializations: ['Interactive Mystery Events', 'Creative Workshops']
  },
  {
    name: 'David Kim',
    type: 'Tech Speaker',
    imageUrl: 'https://source.unsplash.com/featured/?asian,tech,professional,man,portrait/600x600',
    specializations: ['Tech Demos', 'Business Networking']
  },
  {
    name: 'Olivia Bennett',
    type: 'Musical Performer',
    imageUrl: 'https://source.unsplash.com/featured/?musician,woman,portrait,professional/600x600',
    specializations: ['Musical Performances', 'Creative Workshops']
  },
  {
    name: 'Marcus Johnson',
    type: 'Sports Commentator',
    imageUrl: 'https://source.unsplash.com/featured/?black,man,portrait,professional,confident/600x600',
    specializations: ['Sports Commentary', 'Live Podcasts']
  },
  {
    name: 'Zoe Mitchell',
    type: 'Culinary Expert',
    imageUrl: 'https://source.unsplash.com/featured/?chef,woman,portrait,professional/600x600',
    specializations: ['Culinary Experiences', 'Wine Tasting']
  },
  {
    name: 'Thomas Anderson',
    type: 'Executive Coach',
    imageUrl: 'https://source.unsplash.com/featured/?executive,older,man,portrait,professional/600x600',
    specializations: ['Executive Coaching', 'Business Networking']
  }
];

// Directory to save images
const imageDir = path.join(__dirname, '../../public/images/crew');

// Ensure the image directory exists
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

// Function to download an image from a URL
async function downloadImage(url, imagePath) {
  try {
    console.log(`Downloading image from ${url}...`);
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(imagePath, Buffer.from(buffer));
    return true;
  } catch (error) {
    console.error('Error downloading image:', error);
    return false;
  }
}

// Function to update crew profiles in the database
async function updateCrewProfile(crewId, imagePath, name, type, specializations) {
  try {
    // Get the relative path for use in the database
    const webPath = `/images/crew/${path.basename(imagePath)}`;
    
    // Update the crew profile in the database
    const { data, error } = await supabase
      .from('pilots_crews')
      .update({ 
        name: name,
        profile_image_url: webPath,
        specializations: [type, ...specializations, 'Professional Crew']
      })
      .eq('id', crewId);
      
    if (error) {
      console.error('Error updating crew profile:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateCrewProfile:', error);
    return false;
  }
}

// Main function to update crew images
async function updateCrewImages() {
  console.log('Starting crew image update...');
  
  // Fetch existing crew profiles from the database
  const { data: crewProfiles, error } = await supabase
    .from('pilots_crews')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(crewData.length);
    
  if (error) {
    console.error('Error fetching crew profiles:', error);
    return;
  }
  
  if (!crewProfiles || crewProfiles.length === 0) {
    console.log('No crew profiles found in the database.');
    return;
  }
  
  console.log(`Found ${crewProfiles.length} crew profiles in the database.`);
  
  // Process each crew member
  for (let i = 0; i < Math.min(crewData.length, crewProfiles.length); i++) {
    const crew = crewData[i];
    const crewProfile = crewProfiles[i];
    
    console.log(`Processing image for ${crew.name} (${crew.type})...`);
    
    // Create a unique filename
    const safeFileName = crew.name.toLowerCase().replace(/\s+/g, '_');
    const imagePath = path.join(imageDir, `${safeFileName}.jpg`);
    
    // Download the image
    const downloaded = await downloadImage(crew.imageUrl, imagePath);
    
    if (!downloaded) {
      console.log(`Failed to download image for ${crew.name}. Skipping...`);
      continue;
    }
    
    console.log(`Successfully downloaded image to ${imagePath}`);
    
    // Update the crew profile in the database
    const updated = await updateCrewProfile(
      crewProfile.id, 
      imagePath, 
      crew.name, 
      crew.type, 
      crew.specializations
    );
    
    if (updated) {
      console.log(`Successfully updated profile for ${crew.name}`);
    } else {
      console.log(`Failed to update profile for ${crew.name}`);
    }
  }
  
  console.log('Crew image update completed!');
}

// Run the script
updateCrewImages().catch(error => {
  console.error('Error in updateCrewImages:', error);
}); 