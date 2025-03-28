require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Directory to save images
const imageDir = path.join(__dirname, '../../public/images/crew');

// Ensure the image directory exists
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

// Function to sleep for specified milliseconds
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Define captain specializations
const captainSpecializations = [
  'Luxury',
  'Business',
  'Family-oriented',
  'Entertainment-focused',
  'Adventure',
  'VIP Service',
  'International Flights',
  'Long-haul Expert',
  'Private Events',
  'Sports Team Transport'
];

// Define crew specializations
const crewSpecializations = [
  'Comedy',
  'TED-talks',
  'Live Podcasts',
  'Wellness Sessions',
  'Business Networking',
  'Family-friendly Activities',
  'Musical Performances',
  'Interactive Mystery Events',
  'Culinary Experiences',
  'Wine Tasting',
  'Sports Commentary',
  'Tech Demos',
  'Creative Workshops',
  'Executive Coaching'
];

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

// Function to update crew profiles in the database with local image paths
async function updateCrewProfile(crewId, imagePath) {
  try {
    // Get the relative path for use in the database
    const webPath = `/images/crew/${path.basename(imagePath)}`;
    
    // Update the crew profile with the local image path
    const { data, error } = await supabase
      .from('pilots_crews')
      .update({ profile_image_url: webPath })
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

// Get random elements from an array
function getRandomElements(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Generate a random rating between 3.5 and 5.0
function getRandomRating() {
  return (3.5 + Math.random() * 1.5).toFixed(1);
}

// Generate a random number of years of experience (5-30 for captains)
function getRandomYearsExperience() {
  return Math.floor(5 + Math.random() * 25);
}

// Main function to download and update crew images
async function downloadProCrewImages() {
  console.log('Starting crew image download and profile update...');
  
  // Get all crew members
  const { data: allCrewMembers, error } = await supabase
    .from('pilots_crews')
    .select('id, name, profile_image_url');
    
  if (error) {
    console.error('Error fetching crew data:', error);
    return;
  }
  
  // Filter out crew members who already have proper images
  const crewNeedingImages = allCrewMembers.filter(crew => 
    !crew.profile_image_url || 
    !crew.profile_image_url.startsWith('/images/crew/')
  );
  
  console.log(`Found ${crewNeedingImages.length} crew members needing professional images.`);
  
  // Array of direct URLs to professional headshots
  const professionalHeadshots = [
    // Professional looking images
    "https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/3778603/pexels-photo-3778603.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/1587009/pexels-photo-1587009.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/1367269/pexels-photo-1367269.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/3782218/pexels-photo-3782218.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/3777943/pexels-photo-3777943.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/5669603/pexels-photo-5669603.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/2380795/pexels-photo-2380795.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/775358/pexels-photo-775358.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/834863/pexels-photo-834863.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/884422/pexels-photo-884422.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/1121796/pexels-photo-1121796.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/937481/pexels-photo-937481.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/977401/pexels-photo-977401.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/1043473/pexels-photo-1043473.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/936043/pexels-photo-936043.jpeg?auto=compress&cs=tinysrgb&w=300"
  ];
  
  // Process each crew member
  for (let i = 0; i < crewNeedingImages.length; i++) {
    const crew = crewNeedingImages[i];
    
    console.log(`\nProcessing ${i+1}/${crewNeedingImages.length}: ${crew.name}`);
    
    // Create a unique filename
    const safeFileName = crew.name.toLowerCase().replace(/\s+/g, '_');
    const imagePath = path.join(imageDir, `${safeFileName}.jpg`);
    
    // Pick a random URL from the professional headshots list
    const randomIndex = Math.floor(Math.random() * professionalHeadshots.length);
    const imageUrl = professionalHeadshots[randomIndex];
    
    // Download the image
    const downloaded = await downloadImage(imageUrl, imagePath);
    
    if (!downloaded) {
      console.log(`Failed to download image for ${crew.name}. Skipping...`);
      continue;
    }
    
    console.log(`Successfully downloaded image to ${imagePath}`);
    
    // Update the crew profile in the database
    const updated = await updateCrewProfile(crew.id, imagePath);
    
    if (updated) {
      console.log(`Successfully updated profile for ${crew.name}`);
    } else {
      console.log(`Failed to update profile for ${crew.name}`);
    }
    
    // Wait between requests to avoid rate limiting
    if (i < crewNeedingImages.length - 1) {
      const waitTime = 500; // 500ms should be enough
      await sleep(waitTime);
    }
  }
  
  console.log('\nCrew image download and update completed!');
}

// Function to create a new member (either captain or crew)
async function createMember(name, isCaptain, specializations, bio = null, dedicatedJetOwnerId = null, yearsOfExperience = null) {
  const { data, error } = await supabase
    .from('pilots_crews')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000', // placeholder user ID
      name,
      bio,
      specializations,
      ratings_avg: getRandomRating(),
      is_captain: isCaptain,
      dedicated_jet_owner_id: dedicatedJetOwnerId,
      years_of_experience: yearsOfExperience
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating member:', error);
    return null;
  }
  
  return data;
}

// Function to seed the database with captains and crew members
async function seedCaptainsAndCrew() {
  console.log('Starting to seed captains and crew...');

  try {
    // First, check if we already have captains and crew in the database
    const { count, error } = await supabase
      .from('pilots_crews')
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      throw error;
    }
    
    if (count > 0) {
      console.log(`Database already contains ${count} crew members. Skipping seeding.`);
      return;
    }
    
    // Create 20 captains
    console.log('Creating elite captains...');
    for (let i = 0; i < 20; i++) {
      const isCaptain = true;
      const isDedicated = Math.random() > 0.7; // 30% chance to be dedicated
      const name = `Captain ${['James', 'John', 'Robert', 'Michael', 'David', 'Richard', 'Thomas', 'Charles', 'Daniel', 'Matthew', 'William', 'Joseph', 'Christopher', 'Anthony', 'Steven', 'Paul', 'Mark', 'George', 'Kenneth', 'Edward'][i]} ${['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson'][i]}`;
      
      const specializations = getRandomElements(captainSpecializations, 2 + Math.floor(Math.random() * 3)); // 2-4 specializations
      const yearsOfExperience = getRandomYearsExperience();
      
      const bio = `Captain with ${yearsOfExperience} years of professional flight experience, specializing in ${specializations.join(' and ')} flights. Known for exceptional service and perfect safety record.`;
      
      const dedicatedJetOwnerId = isDedicated ? `jet-owner-${Math.floor(Math.random() * 10)}` : null;
      
      const captain = await createMember(name, isCaptain, specializations, bio, dedicatedJetOwnerId, yearsOfExperience);
      
      if (captain) {
        console.log(`Created captain: ${name}`);
      }
      
      await sleep(100);
    }
    
    // Create 30 crew members
    console.log('\nCreating specialized crew members...');
    for (let i = 0; i < 30; i++) {
      const isCaptain = false;
      const firstNames = ['Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Charlotte', 'Mia', 'Amelia', 'Harper', 'Evelyn', 'Abigail', 'Emily', 'Elizabeth', 'Avery', 'Sofia', 'Ella', 'Madison', 'Scarlett', 'Victoria', 'Aria', 'Grace', 'Chloe', 'Camila', 'Penelope', 'Riley', 'Layla', 'Lillian', 'Nora', 'Zoey', 'Mila'];
      const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];
      
      const name = `${firstNames[i]} ${lastNames[i]}`;
      
      const specializations = getRandomElements(crewSpecializations, 2 + Math.floor(Math.random() * 3)); // 2-4 specializations
      
      const bioTemplates = [
        `Professional ${specializations[0]} expert with a background in hospitality, delivering unique and engaging experiences for travelers.`,
        `Certified ${specializations[0]} specialist and ${specializations[1]} host, making every flight a memorable journey.`,
        `Experienced in-flight ${specializations.join(' and ')} facilitator, passionate about creating exceptional airborne experiences.`,
        `Award-winning ${specializations[0]} professional, bringing creativity and expertise to luxury air travel.`,
        `Skilled ${specializations.join(' and ')} presenter with over 5 years of experience in private aviation settings.`
      ];
      
      const bio = bioTemplates[Math.floor(Math.random() * bioTemplates.length)];
      
      const crew = await createMember(name, isCaptain, specializations, bio);
      
      if (crew) {
        console.log(`Created crew member: ${name}`);
      }
      
      await sleep(100);
    }
    
    console.log('\nSuccessfully seeded captains and crew!');
  } catch (error) {
    console.error('Error in seedCaptainsAndCrew:', error);
  }
}

// Run the main script or seeding based on arguments
if (process.argv.includes('--seed')) {
  seedCaptainsAndCrew().catch(error => {
    console.error('Error in seedCaptainsAndCrew:', error);
  });
} else {
  downloadProCrewImages().catch(error => {
    console.error('Error in downloadProCrewImages:', error);
  });
} 