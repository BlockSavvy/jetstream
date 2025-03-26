require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Static image URLs for professional headshots (royalty-free)
const crewData = [
  {
    name: 'Alexandra Davis',
    type: 'Comedy Host',
    imageUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg', // Woman smiling
    specializations: ['Comedy', 'Live Podcasts']
  },
  {
    name: 'Michael Chen',
    type: 'Business Speaker',
    imageUrl: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg', // Asian man in suit
    specializations: ['TED-talks', 'Business Networking']
  },
  {
    name: 'Sophia Johnson',
    type: 'Wellness Coach',
    imageUrl: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg', // Woman wellness
    specializations: ['Wellness Sessions', 'Mindfulness']
  },
  {
    name: 'James Wilson',
    type: 'Wine Sommelier',
    imageUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg', // Professional man
    specializations: ['Wine Tasting', 'Culinary Experiences']
  },
  {
    name: 'Emma Rodriguez',
    type: 'Mystery Host',
    imageUrl: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg', // Hispanic woman
    specializations: ['Interactive Mystery Events', 'Creative Workshops']
  },
  {
    name: 'David Kim',
    type: 'Tech Speaker',
    imageUrl: 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg', // Asian man tech
    specializations: ['Tech Demos', 'Business Networking']
  },
  {
    name: 'Olivia Bennett',
    type: 'Musical Performer',
    imageUrl: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg', // Woman musician
    specializations: ['Musical Performances', 'Creative Workshops']
  },
  {
    name: 'Marcus Johnson',
    type: 'Sports Commentator',
    imageUrl: 'https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg', // Black man
    specializations: ['Sports Commentary', 'Live Podcasts']
  },
  {
    name: 'Zoe Mitchell',
    type: 'Culinary Expert',
    imageUrl: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg', // Woman culinary
    specializations: ['Culinary Experiences', 'Wine Tasting']
  },
  {
    name: 'Thomas Anderson',
    type: 'Executive Coach',
    imageUrl: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg', // Older executive
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
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    
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
  console.log('Starting crew image update with static images...');
  
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
  
  console.log('Crew image update with static images completed!');
}

// Run the script
updateCrewImages().catch(error => {
  console.error('Error in updateCrewImages:', error);
}); 