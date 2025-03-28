const { faker } = require('@faker-js/faker');
const { v4: uuidv4 } = require('uuid');

// Constants for seed data
const CREW_COUNT = 15; // Reduced count for easier SQL pasting
const REVIEWS_COUNT = 30;
const SPECIALIZED_FLIGHTS_COUNT = 10;

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

// Define a function to escape single quotes in strings for SQL
const escapeSql = (str) => {
  if (!str) return '';
  return str.replace(/'/g, "''");
};

// Function to generate SQL for array values
const sqlArray = (arr) => {
  if (!arr || !Array.isArray(arr)) return 'NULL';
  return `ARRAY[${arr.map(item => `'${escapeSql(item)}'`).join(', ')}]`;
};

// Function to generate SQL for JSON/JSONB values
const sqlJson = (obj) => {
  if (!obj) return 'NULL';
  return `'${escapeSql(JSON.stringify(obj))}'`;
};

// Function to generate SQL for timestamp values
const sqlTimestamp = (date) => {
  if (!date) return 'NULL';
  return `'${date.toISOString()}'`;
};

// Generate a random crew member SQL
const generateCrewMemberSql = (userId) => {
  const name = faker.person.fullName();
  
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
  
  const id = uuidv4();
  const createdAt = faker.date.past();
  const updatedAt = faker.date.recent();
  
  return {
    sql: `INSERT INTO pilots_crews (id, user_id, name, bio, profile_image_url, specializations, social_links, ratings_avg, created_at, updated_at)
    VALUES ('${id}', '${userId}', '${escapeSql(name)}', '${escapeSql(bio)}', '${escapeSql(profileImageUrl)}', ${sqlArray(specializations)}, ${sqlJson(socialLinks)}, ${rating}, ${sqlTimestamp(createdAt)}, ${sqlTimestamp(updatedAt)});`,
    id
  };
};

// Main function to generate all SQL
const generateSeedDataSql = async () => {
  let sqlStatements = [];
  
  // Start transaction
  sqlStatements.push('BEGIN;');
  
  // Generate fake user IDs (in a real scenario, these would be actual user IDs from auth.users)
  const userIds = Array(CREW_COUNT).fill(0).map(() => uuidv4());
  
  // 1. Create crew members
  console.log(`Generating SQL for ${CREW_COUNT} crew members...`);
  const crewMembers = userIds.map((userId, index) => generateCrewMemberSql(userId));
  sqlStatements = sqlStatements.concat(crewMembers.map(crew => crew.sql));
  
  // We'll use these IDs for the other tables
  const crewIds = crewMembers.map(crew => crew.id);
  
  // 2. Generate some flight IDs (these would be existing flight IDs in your system)
  const flightIds = Array(SPECIALIZED_FLIGHTS_COUNT).fill(0).map(() => uuidv4());
  
  // Let's generate some test SELECT statement to check if valid flights exist
  sqlStatements.push(`
-- Check if flights table has data (informational only)
SELECT COUNT(*) FROM flights;
-- If the count is 0, you may need to seed flights first, or the specialized_flights inserts may fail
`);

  // 3. Generate fake reviews
  for (let i = 0; i < REVIEWS_COUNT; i++) {
    const crewId = faker.helpers.arrayElement(crewIds);
    const userId = faker.helpers.arrayElement(userIds);
    const rating = faker.helpers.weightedArrayElement([
      { weight: 10, value: 5 },
      { weight: 8, value: 4 },
      { weight: 4, value: 3 },
      { weight: 1, value: 2 },
      { weight: 0.5, value: 1 },
    ]);
    
    let reviewText;
    if (rating === 5) {
      reviewText = faker.helpers.arrayElement([
        "Absolutely phenomenal experience! The crew member transformed our flight into an unforgettable event. Can't wait to fly with them again!",
        "This was beyond expectations. Their expertise in their specialization made the journey fly by (pun intended). Highly recommended!",
        "Best in-flight experience I've ever had. Professional, engaging, and truly talented. Will specifically look for flights with this crew member.",
      ]);
    } else if (rating === 4) {
      reviewText = faker.helpers.arrayElement([
        "Great experience overall. Very professional and engaging throughout the flight.",
        "Really enjoyed the specialized service. Made the flight time much more valuable.",
        "Would definitely book again. Created a wonderful atmosphere and memorable experience.",
      ]);
    } else if (rating === 3) {
      reviewText = faker.helpers.arrayElement([
        "Decent experience. Could improve some aspects but overall satisfactory.",
        "The specialization was interesting, though execution could be better.",
        "Good effort, but didn't quite meet expectations. Would give another chance.",
      ]);
    } else {
      reviewText = faker.helpers.arrayElement([
        "Below expectations. Several areas need improvement.",
        "Unfortunately, not what was advertised. Disappointed with the experience.",
        "Lacked engagement and professionalism. Would not recommend.",
      ]);
    }
    
    const sql = `INSERT INTO crew_reviews (id, crew_id, user_id, rating, review_text, created_at)
    VALUES ('${uuidv4()}', '${crewId}', '${userId}', ${rating}, '${escapeSql(reviewText)}', ${sqlTimestamp(faker.date.recent())});`;
    
    sqlStatements.push(sql);
  }
  
  // 4. Generate specialized flights
  console.log(`Generating SQL for ${SPECIALIZED_FLIGHTS_COUNT} specialized flights...`);
  
  for (let i = 0; i < SPECIALIZED_FLIGHTS_COUNT; i++) {
    const crewId = faker.helpers.arrayElement(crewIds);
    const flightId = flightIds[i]; // Use one of our fake flight IDs
    
    // Get the crew index to access specializations
    const crewIndex = crewIds.indexOf(crewId);
    const crewMember = crewMembers[crewIndex];
    
    // Generate flight details
    const title = `${faker.word.adjective()} ${faker.word.noun()} Experience`;
    const theme = faker.helpers.arrayElement(SPECIALIZATIONS); // We don't have actual crew specializations in this script
    const description = `A specialized flight experience featuring exceptional ${theme} activities and entertainment.`;
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
    
    const status = flightDate < new Date() ? 'completed' : 'scheduled';
    const pricePremium = faker.number.int({ min: 10, max: 30 });
    
    const sql = `INSERT INTO specialized_flights (id, crew_id, flight_id, title, description, theme, seats_available, date_time, status, price_premium_percentage, created_at, updated_at)
    VALUES ('${uuidv4()}', '${crewId}', '${flightId}', '${escapeSql(title)}', '${escapeSql(description)}', '${escapeSql(theme)}', ${seatsAvailable}, ${sqlTimestamp(flightDate)}, '${status}', ${pricePremium}, ${sqlTimestamp(faker.date.past())}, ${sqlTimestamp(faker.date.recent())});`;
    
    sqlStatements.push(sql);
  }
  
  // Add warning about flight_id foreign key constraint
  sqlStatements.push(`
-- NOTE: The specialized_flights inserts above use randomly generated flight_ids which won't exist in your database.
-- If you want to use this in production, you should:
-- 1. Replace the flight_ids with actual flight_ids from your flights table
-- OR
-- 2. Comment out the foreign key constraint temporarily before running this script
--    (ALTER TABLE specialized_flights DROP CONSTRAINT specialized_flights_flight_id_fkey;)
--    and then re-add it after (with appropriate flight_ids)
  `);
  
  // Commit transaction
  sqlStatements.push('COMMIT;');
  
  // Output SQL
  console.log('=================== SQL SEED DATA SCRIPT ===================');
  console.log('-- Copy this entire SQL script and paste it into the Supabase SQL Editor');
  console.log('-- This will create sample data for the Pilots & Crew feature');
  console.log();
  console.log(sqlStatements.join('\n'));
  console.log();
  console.log('=================== END OF SEED DATA SCRIPT ===================');
};

// Run the generator
generateSeedDataSql(); 