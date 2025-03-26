require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

// Get DALL-E configuration from environment
const PRIMARY_DALLE_MODEL = 'dall-e-2'; // Default to DALL-E 2
const FALLBACK_DALLE_MODEL = 'dall-e-2';
const DALLE_QUALITY = 'standard'; // DALL-E 2 uses standard quality
const DALLE_SIZE = '512x512'; // DALL-E 2 uses 512x512 or similar sizes
const DALLE_STYLE = 'natural';

// Flag to determine if we should use DALL-E 3 or fallback to DALL-E 2
let useDallE3 = false; // Set to false by default to use DALL-E 2

// Crew specializations to generate images for
const crewSpecializations = [
  {
    name: 'Alexandra Davis',
    gender: 'female',
    type: 'Comedy Host',
    description: 'Professional female comedy host specializing in high-end private jet entertainment, with an elegant appearance, sophisticated outfit, and charismatic demeanor, mid-30s. She looks stylish and approachable, ready to entertain exclusive clients on luxury flights.'
  },
  {
    name: 'Michael Chen',
    gender: 'male',
    type: 'Business Speaker',
    description: 'Professional Asian male business speaker and thought leader specializing in private jet executive sessions, wearing a premium tailored suit, with a confident, authoritative presence, mid-40s. He looks polished and professional, perfect for facilitating business discussions at altitude.'
  },
  {
    name: 'Sophia Johnson',
    gender: 'female',
    type: 'Wellness Coach',
    description: 'Female wellness and meditation specialist for exclusive in-flight relaxation sessions, with a serene and composed expression, wearing elegant professional attire suitable for luxury aviation, early 30s. She embodies calm sophistication and wellness expertise for high-end travelers.'
  },
  {
    name: 'James Wilson',
    gender: 'male',
    type: 'Wine Sommelier',
    description: 'Distinguished male wine sommelier specializing in private aviation fine dining experiences, with refined taste and expert knowledge, wearing formal attire with subtle luxury details, late 30s. His presence elevates the inflight dining experience with sophisticated wine pairings.'
  },
  {
    name: 'Emma Rodriguez',
    gender: 'female',
    type: 'Mystery Host',
    description: 'Hispanic female mystery entertainment specialist who creates immersive experiences for private jet clients, with an engaging and intriguing presence, wearing elegant professional attire with distinctive style, mid-30s. She brings intellectual entertainment to exclusive flights.'
  },
  {
    name: 'David Kim',
    gender: 'male',
    type: 'Tech Speaker',
    description: 'Asian male technology thought leader who delivers cutting-edge insights during private flights, with a modern and innovative appearance, smart business casual attire with premium touches, early 40s. He connects high-profile travelers with the latest technological trends and insights.'
  },
  {
    name: 'Olivia Bennett',
    gender: 'female',
    type: 'Musical Performer',
    description: 'Elegant female musical artist who creates sophisticated acoustic performances aboard private jets, with graceful presence and artistic flair, wearing refined performance attire suitable for luxury aviation, late 20s. She provides an elevated musical experience for discerning travelers.'
  },
  {
    name: 'Marcus Johnson',
    gender: 'male',
    type: 'Sports Commentator',
    description: 'Distinguished Black male sports analyst who provides exclusive commentary and insights during private flights to major sporting events, with athletic sophistication, wearing premium business casual attire, confident and articulate, mid-30s. He elevates the journey to sports destinations.'
  },
  {
    name: 'Zoe Mitchell',
    gender: 'female',
    type: 'Culinary Expert',
    description: 'Female executive chef specializing in creating exceptional dining experiences aboard private jets, with polished professionalism, wearing a sophisticated chef jacket or culinary attire appropriate for high-end client interaction, early 40s. She brings gastronomic excellence to the skies.'
  },
  {
    name: 'Thomas Anderson',
    gender: 'male',
    type: 'Executive Coach',
    description: 'Distinguished male executive coach with decades of C-suite experience, providing exclusive mentorship during private flights, with a commanding yet approachable presence, premium business attire, silver hair, early 50s. He transforms flight time into valuable executive development.'
  }
];

// Directory to save generated images
const imageDir = path.join(__dirname, '../../public/images/crew');

// Ensure the image directory exists
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

// Function to sleep for specified milliseconds
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to generate an image using DALL-E
async function generateImage(prompt, maxRetries = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      console.log(`Attempting to generate image (attempt ${retries + 1}/${maxRetries})...`);
      
      const response = await openai.images.generate({
        model: 'dall-e-2',
        prompt: `Professional portrait photograph of a ${prompt}. High-quality professional headshot with soft lighting and neutral background. The subject should look confident, approachable, and professionally dressed. Modern, clean portrait suitable for a luxury private jet service website. JetStream branded image.`,
        n: 1,
        size: '512x512',
        quality: 'standard',
        style: 'natural'
      });

      console.log(`Image generation successful!`);
      return response.data[0].url;
    } catch (error) {
      retries++;
      
      console.error(`Error generating image (attempt ${retries}/${maxRetries}):`, error.message);
      
      if (error.response) {
        console.error("Error status:", error.response.status);
        console.error("Error data:", error.response.data);
      }
      
      if (error.message.includes('rate limit')) {
        // Wait for rate limit to reset
        const resetTime = error.headers?.['x-ratelimit-reset-images'] || 60;
        const waitTime = parseInt(resetTime) * 1000 + 15000; // Add 15 seconds buffer
        console.log(`Rate limit hit. Waiting ${waitTime/1000} seconds before retrying...`);
        await sleep(waitTime);
      } else if (error.message.includes('quota') || error.message.includes('billing')) {
        console.error('API quota or billing issue. Please check your OpenAI account.');
        return null;
      } else if (retries < maxRetries) {
        // For other errors, wait 30 seconds before retrying
        console.log('Waiting 30 seconds before retrying...');
        await sleep(30000);
      } else {
        console.error('Max retries reached. Could not generate image.');
        return null;
      }
    }
  }
  
  return null;
}

// Function to download an image from a URL
async function downloadImage(url, imagePath) {
  try {
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
async function updateCrewProfile(crewId, imagePath, name, specialization) {
  try {
    // Get the relative path for use in the database
    // We want to store the path as it would be accessed from the web, like /images/crew/filename.png
    const webPath = `/images/crew/${path.basename(imagePath)}`;
    
    // Update the crew profile with the local image path
    const { data, error } = await supabase
      .from('pilots_crews')
      .update({ 
        name: name,
        profile_image_url: webPath,
        specializations: [specialization, ...['Professional Crew', 'Hospitality']]
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

// Create a function to test both DALL-E models
async function testImageGeneration() {
  console.log('Testing image generation with both DALL-E models...');
  
  const testDescription = 'Test subject for premium private jet crew, professional appearance, well-dressed';
  
  // First try with DALL-E 3
  console.log('Testing with DALL-E 3...');
  useDallE3 = true;
  
  try {
    const imageUrl = await generateImage(testDescription);
    
    if (imageUrl) {
      console.log('Test image generation successful!');
      console.log('Image URL:', imageUrl);
      
      // Save test image to disk
      const testImagePath = path.join(imageDir, `test_image_${useDallE3 ? 'dalle3' : 'dalle2'}.png`);
      const downloaded = await downloadImage(imageUrl, testImagePath);
      
      if (downloaded) {
        console.log(`Test image downloaded successfully to ${testImagePath}`);
        return true;
      } else {
        console.log('Failed to download test image.');
      }
    } else {
      console.log('Test image generation failed with DALL-E 3.');
      
      // If DALL-E 3 failed but we didn't switch to DALL-E 2 automatically, try DALL-E 2 explicitly
      if (useDallE3) {
        console.log('Testing with DALL-E 2...');
        useDallE3 = false;
        
        const dalle2ImageUrl = await generateImage(testDescription);
        
        if (dalle2ImageUrl) {
          console.log('Test image generation with DALL-E 2 successful!');
          console.log('Image URL:', dalle2ImageUrl);
          
          // Save test image to disk
          const testImagePath = path.join(imageDir, 'test_image_dalle2.png');
          const downloaded = await downloadImage(dalle2ImageUrl, testImagePath);
          
          if (downloaded) {
            console.log(`Test image downloaded successfully to ${testImagePath}`);
            return true;
          } else {
            console.log('Failed to download DALL-E 2 test image.');
          }
        } else {
          console.log('Test image generation failed with both DALL-E models.');
        }
      }
    }
  } catch (error) {
    console.error('Error in test image generation:', error);
  }
  
  return false;
}

// Main function to generate images for all crew specializations
async function generateCrewImages() {
  console.log('Starting crew image generation with DALL-E 2...');
  
  // Fetch existing crew profiles from the database
  const { data: crewProfiles, error } = await supabase
    .from('pilots_crews')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(crewSpecializations.length);
    
  if (error) {
    console.error('Error fetching crew profiles:', error);
    return;
  }
  
  if (!crewProfiles || crewProfiles.length === 0) {
    console.log('No crew profiles found in the database.');
    return;
  }
  
  // Process each crew specialization with delay between requests
  for (let i = 0; i < Math.min(crewSpecializations.length, crewProfiles.length); i++) {
    const specialization = crewSpecializations[i];
    const crewProfile = crewProfiles[i];
    
    console.log(`\n=== Processing ${i+1}/${Math.min(crewSpecializations.length, crewProfiles.length)}: ${specialization.name} (${specialization.type}) ===`);
    
    // Create a unique filename
    const safeFileName = specialization.name.toLowerCase().replace(/\s+/g, '_');
    const imagePath = path.join(imageDir, `${safeFileName}.png`);
    
    // Check if image already exists (to avoid regeneration)
    if (fs.existsSync(imagePath)) {
      console.log(`Image for ${specialization.name} already exists at ${imagePath}. Skipping generation.`);
      
      // Update the crew profile in the database with existing image
      const updated = await updateCrewProfile(crewProfile.id, imagePath, specialization.name, specialization.type);
      
      if (updated) {
        console.log(`Successfully updated profile for ${specialization.name} with existing image.`);
      } else {
        console.log(`Failed to update profile for ${specialization.name}.`);
      }
      
      continue;
    }
    
    // Generate image
    console.log(`Generating image for ${specialization.name} (${specialization.type})...`);
    const imageUrl = await generateImage(specialization.description);
    
    if (!imageUrl) {
      console.log(`Failed to generate image for ${specialization.name} after multiple attempts. Skipping...`);
      continue;
    }
    
    // Download the image
    console.log(`Downloading image for ${specialization.name}...`);
    const downloaded = await downloadImage(imageUrl, imagePath);
    
    if (!downloaded) {
      console.log(`Failed to download image for ${specialization.name}. Skipping...`);
      continue;
    }
    
    console.log(`Successfully downloaded image to ${imagePath}`);
    
    // Update the crew profile in the database with local image path
    const updated = await updateCrewProfile(crewProfile.id, imagePath, specialization.name, specialization.type);
    
    if (updated) {
      console.log(`Successfully updated profile for ${specialization.name}`);
    } else {
      console.log(`Failed to update profile for ${specialization.name}`);
    }
    
    // Wait between requests to avoid rate limits
    if (i < Math.min(crewSpecializations.length, crewProfiles.length) - 1) {
      const waitTime = 15 * 1000; // 15 seconds to be safe
      console.log(`\nWaiting ${waitTime/1000} seconds before processing next crew member...`);
      await sleep(waitTime);
    }
  }
  
  console.log('\nCrew image generation completed!');
}

// Run the script
generateCrewImages().catch(error => {
  console.error('Error in generateCrewImages:', error);
}); 