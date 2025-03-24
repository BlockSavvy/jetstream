require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { faker } = require('@faker-js/faker');
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Constants for seed data
const CREW_COUNT = 30;
const REVIEWS_COUNT = 60;
const SPECIALIZED_FLIGHTS_COUNT = 20;

// Crew specializations options
const SPECIALIZATIONS = [
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

// Generate a random crew member
const generateCrewMember = (userId) => {
  const name = faker.person.fullName();
  const initials = name.split(' ').map(n => n[0]).join('');
  
  // Generate 2-4 random specializations
  const specializationCount = faker.number.int({ min: 2, max: 4 });
  const specializations = faker.helpers.arrayElements(SPECIALIZATIONS, specializationCount);
  
  // Generate social links
  const socialLinks = {};
  if (faker.datatype.boolean(0.7)) { // 70% chance to have Twitter
    socialLinks.twitter = `@${faker.internet.userName()}`;
  }
  if (faker.datatype.boolean(0.6)) { // 60% chance to have LinkedIn
    socialLinks.linkedin = `https://linkedin.com/in/${faker.internet.userName()}`;
  }
  if (faker.datatype.boolean(0.5)) { // 50% chance to have Instagram
    socialLinks.instagram = `@${faker.internet.userName()}`;
  }
  if (faker.datatype.boolean(0.3)) { // 30% chance to have Website
    socialLinks.website = `https://${faker.internet.domainName()}`;
  }
  
  // Generate bio with real personality
  const bioTemplates = [
    `With over ${faker.number.int({ min: 5, max: 20 })} years of experience in the skies, ${name.split(' ')[0]} specializes in ${specializations.join(' and ')}. Known for creating memorable in-flight experiences that transform travel time into productive or entertaining moments. "${faker.word.words(5)}" is my motto at 40,000 feet.`,
    
    `As a certified expert in ${specializations[0]}, I bring unique perspectives to every flight. My background in ${faker.company.buzzNoun()} allows me to connect with travelers from diverse industries. Join me for an unforgettable journey featuring ${specializations.join(', ')}.`,
    
    `Transforming ordinary flights into extraordinary experiences is my passion. Specializing in ${specializations.join(' and ')}, I've entertained and inspired thousands of travelers worldwide. Let me make your next journey truly memorable.`,
    
    `Award-winning specialist in ${specializations[0]}. Featured in ${faker.company.name()} Magazine and recognized as one of the top ${faker.number.int({ min: 10, max: 50 })} most innovative crew members. I believe that travel time should never be wasted time.`
  ];
  
  const bio = faker.helpers.arrayElement(bioTemplates);
  
  // Random rating (weighted toward higher ratings for better demo experience)
  const rating = faker.helpers.weightedArrayElement([
    { weight: 10, value: 5 },
    { weight: 8, value: 4.5 },
    { weight: 5, value: 4 },
    { weight: 2, value: 3.5 },
    { weight: 1, value: 3 },
  ]);
  
  // Generate profile image URL (either placeholder or Unsplash image)
  const useUnsplash = faker.datatype.boolean(0.7); // 70% chance for Unsplash image
  const profileImageUrl = useUnsplash 
    ? `https://source.unsplash.com/random/300x300/?portrait,professional,${faker.number.int({ min: 1, max: 100 })}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FF9500&color=fff&size=300`;
  
  return {
    id: uuidv4(),
    user_id: userId,
    name,
    bio,
    profile_image_url: profileImageUrl,
    specializations,
    social_links: socialLinks,
    ratings_avg: rating,
    created_at: faker.date.past(),
    updated_at: faker.date.recent(),
  };
};

// Generate a random review
const generateReview = (crewId, userId) => {
  // Random rating (weighted toward higher ratings)
  const rating = faker.helpers.weightedArrayElement([
    { weight: 10, value: 5 },
    { weight: 8, value: 4 },
    { weight: 4, value: 3 },
    { weight: 1, value: 2 },
    { weight: 0.5, value: 1 },
  ]);
  
  // Review templates based on rating
  let reviewText;
  if (rating === 5) {
    reviewText = faker.helpers.arrayElement([
      "Absolutely phenomenal experience! The crew member transformed our flight into an unforgettable event. Can't wait to fly with them again!",
      "This was beyond expectations. Their expertise in their specialization made the journey fly by (pun intended). Highly recommended!",
      "Best in-flight experience I've ever had. Professional, engaging, and truly talented. Will specifically look for flights with this crew member.",
      "The highlight of our trip wasn't the destination, but the journey with this exceptional crew member. Five stars aren't enough!"
    ]);
  } else if (rating === 4) {
    reviewText = faker.helpers.arrayElement([
      "Great experience overall. Very professional and engaging throughout the flight.",
      "Really enjoyed the specialized service. Made the flight time much more valuable.",
      "Would definitely book again. Created a wonderful atmosphere and memorable experience.",
      "Very talented and attentive. The flight went by so quickly thanks to their engagement."
    ]);
  } else if (rating === 3) {
    reviewText = faker.helpers.arrayElement([
      "Decent experience. Could improve some aspects but overall satisfactory.",
      "The specialization was interesting, though execution could be better.",
      "Good effort, but didn't quite meet expectations. Would give another chance.",
      "Adequate service. Neither outstanding nor disappointing."
    ]);
  } else {
    reviewText = faker.helpers.arrayElement([
      "Below expectations. Several areas need improvement.",
      "Unfortunately, not what was advertised. Disappointed with the experience.",
      "Lacked engagement and professionalism. Would not recommend.",
      "Needs significant improvement in delivery and execution."
    ]);
  }
  
  return {
    id: uuidv4(),
    crew_id: crewId,
    user_id: userId,
    rating,
    review_text: reviewText,
    created_at: faker.date.recent(),
  };
};

// Generate a random specialized flight
const generateSpecializedFlight = (crewId, crewSpecializations, flightId) => {
  // Pick a random specialization from crew member's list
  const theme = faker.helpers.arrayElement(crewSpecializations);
  
  // Generate title based on theme
  let title;
  switch (theme) {
    case 'Comedy':
      title = faker.helpers.arrayElement([
        "Sky-High Laughs Comedy Hour", 
        "Altitude Comedy Club", 
        "Cruising Comedians"
      ]);
      break;
    case 'TED-talks':
      title = faker.helpers.arrayElement([
        "TED at 40,000 Feet",
        "Airborne Ideas Worth Spreading",
        "Skyward Thinking TED Session"
      ]);
      break;
    case 'Live Podcasts':
      title = faker.helpers.arrayElement([
        "In-Flight Podcast Live",
        "Air Waves Podcast Recording",
        "Altitude Podcast Experience"
      ]);
      break;
    case 'Wellness Sessions':
      title = faker.helpers.arrayElement([
        "Sky Wellness Journey",
        "In-Flight Mindfulness Retreat",
        "Aerial Yoga & Meditation"
      ]);
      break;
    case 'Business Networking':
      title = faker.helpers.arrayElement([
        "Executive Altitude Networking",
        "Sky-High Connections",
        "Business Cloud Mixer"
      ]);
      break;
    case 'Musical Performances':
      title = faker.helpers.arrayElement([
        "Acoustic Skies Concert",
        "In-Flight Live Music Experience",
        "Altitude Harmonies"
      ]);
      break;
    default:
      title = `Special ${theme} Flight Experience`;
  }
  
  // Generate description based on theme
  const descriptions = {
    'Comedy': "Laugh your way across the skies with our specially curated comedy flight. Our expert comedians will ensure your flight time flies by with premium entertainment and endless laughter.",
    'TED-talks': "Engage with cutting-edge ideas and discussions from industry experts. This specialized TED-style flight features thought-provoking presentations perfect for the curious mind.",
    'Live Podcasts': "Be part of a live podcast recording during your flight. Engage with hosts, participate in discussions, and potentially become part of the episode as we record at 40,000 feet.",
    'Wellness Sessions': "Transform your travel time into wellness time. Experience guided meditation, stretching, and mindfulness techniques specially designed for in-flight rejuvenation.",
    'Business Networking': "Connect with like-minded professionals in your industry. This structured networking flight creates valuable business connections while you travel.",
    'Family-friendly Activities': "Special activities designed to keep young travelers entertained and engaged throughout the flight. Perfect for family travel without the stress.",
    'Musical Performances': "Enjoy exclusive live music performances during your journey. Our talented musicians create an intimate concert experience at cruising altitude.",
    'Interactive Mystery Events': "Participate in a thrilling mystery event that unfolds throughout your flight. Solve clues, interview suspects, and try to crack the case before landing.",
  };
  
  const description = descriptions[theme] || `A specialized flight experience featuring exceptional ${theme} activities and entertainment led by our expert crew.`;
  
  // Generate seats available
  const seatsAvailable = faker.number.int({ min: 2, max: 12 });
  
  // Generate date (most in the future for better demo experience)
  let flightDate;
  if (faker.datatype.boolean(0.8)) {
    // 80% future flights
    flightDate = faker.date.future({ years: 0.5 });
  } else {
    // 20% past flights
    flightDate = faker.date.past({ years: 0.25 });
  }
  
  return {
    id: uuidv4(),
    crew_id: crewId,
    flight_id: flightId,
    title,
    theme,
    description,
    seats_available: seatsAvailable,
    date_time: flightDate,
    status: flightDate < new Date() ? 'completed' : 'scheduled',
    price_premium_percentage: faker.number.int({ min: 10, max: 30 }),
    created_at: faker.date.past(),
    updated_at: faker.date.recent(),
  };
};

// Main seeding function
const seedCrewData = async () => {
  try {
    console.log('Starting crew database seeding...');
    
    // 1. Fetch random users to associate with crew members
    console.log('Fetching users to associate with crew members...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(CREW_COUNT);
      
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    if (!users || users.length < CREW_COUNT) {
      console.error(`Not enough users found. Need ${CREW_COUNT}, found ${users?.length || 0}`);
      return;
    }
    
    // 2. Create crew members
    console.log(`Creating ${CREW_COUNT} crew members...`);
    const crewMembers = [];
    for (let i = 0; i < CREW_COUNT; i++) {
      crewMembers.push(generateCrewMember(users[i].id));
    }
    
    const { error: crewError } = await supabase
      .from('pilots_crews')
      .insert(crewMembers);
      
    if (crewError) {
      console.error('Error creating crew members:', crewError);
      return;
    }
    
    // 3. Fetch created crew members
    const { data: createdCrew, error: fetchCrewError } = await supabase
      .from('pilots_crews')
      .select('*');
      
    if (fetchCrewError) {
      console.error('Error fetching created crew:', fetchCrewError);
      return;
    }
    
    console.log(`Successfully created ${createdCrew.length} crew members`);
    
    // 4. Fetch random flights to associate with specialized flights
    console.log('Fetching flights to associate with specialized flights...');
    const { data: flights, error: flightsError } = await supabase
      .from('flights')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(SPECIALIZED_FLIGHTS_COUNT);
      
    if (flightsError) {
      console.error('Error fetching flights:', flightsError);
      return;
    }
    
    if (!flights || flights.length < SPECIALIZED_FLIGHTS_COUNT) {
      console.error(`Not enough flights found. Need ${SPECIALIZED_FLIGHTS_COUNT}, found ${flights?.length || 0}`);
      return;
    }
    
    // 5. Create specialized flights
    console.log(`Creating ${SPECIALIZED_FLIGHTS_COUNT} specialized flights...`);
    const specializedFlights = [];
    for (let i = 0; i < SPECIALIZED_FLIGHTS_COUNT; i++) {
      const crew = faker.helpers.arrayElement(createdCrew);
      specializedFlights.push(generateSpecializedFlight(crew.id, crew.specializations, flights[i].id));
    }
    
    const { error: flightsCreationError } = await supabase
      .from('specialized_flights')
      .insert(specializedFlights);
      
    if (flightsCreationError) {
      console.error('Error creating specialized flights:', flightsCreationError);
      return;
    }
    
    // 6. Create reviews for crew members
    console.log(`Creating ${REVIEWS_COUNT} crew reviews...`);
    const reviews = [];
    for (let i = 0; i < REVIEWS_COUNT; i++) {
      const crew = faker.helpers.arrayElement(createdCrew);
      const userId = faker.helpers.arrayElement(users).id;
      reviews.push(generateReview(crew.id, userId));
    }
    
    const { error: reviewsError } = await supabase
      .from('crew_reviews')
      .insert(reviews);
      
    if (reviewsError) {
      console.error('Error creating crew reviews:', reviewsError);
      return;
    }
    
    console.log('Crew data seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding crew database:', error);
  }
};

// Run the seeding function
seedCrewData(); 