/**
 * Database Context Provider for AI Queries
 * 
 * This utility module enriches AI queries with relevant database information
 * by using vector search to find contextually relevant data.
 */

/**
 * Enhances a user query with relevant database context
 * 
 * @param query The user's query text
 * @param includeHistorical Whether to include historical (completed) JetShare offers
 * @returns A string containing context information to add to the prompt
 */
export async function enhanceWithDatabaseContext(
  query: string,
  includeHistorical: boolean = false
): Promise<string> {
  try {
    // Extract relevant entity types from the query to determine which tables to search
    const tables = determineRelevantTables(query);
    
    // Check if we should include historical data
    const isHistoricalQuery = determineIfHistoricalQuery(query);
    
    // Use vector search to find relevant database entries
    const response = await fetch('/api/concierge/vector-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query,
        tables,
        includeHistorical: includeHistorical || isHistoricalQuery
      }),
    });
    
    if (!response.ok) {
      console.error('Error fetching vector search results:', await response.text());
      return '';
    }
    
    const { results } = await response.json();
    
    // Format the results into a context string
    return formatDatabaseContextString(results, isHistoricalQuery);
  } catch (error) {
    console.error('Error enhancing with database context:', error);
    return '';
  }
}

/**
 * Determines if a query is asking about historical data
 */
function determineIfHistoricalQuery(query: string): boolean {
  const query_lower = query.toLowerCase();
  
  // Keywords that suggest interest in historical data
  const historicalKeywords = [
    'past',
    'previous',
    'history',
    'historical',
    'completed',
    'old',
    'archive',
    'archives',
    'earlier',
    'before',
    'last month',
    'last year',
    'cancelled'
  ];
  
  // Check if any historical keywords are present
  return historicalKeywords.some(keyword => query_lower.includes(keyword));
}

/**
 * Determines which database tables are relevant to the query
 */
function determineRelevantTables(query: string): string[] {
  const query_lower = query.toLowerCase();
  
  // Extract relevant tables based on keywords in the query
  const tables: string[] = [];
  
  // Airport related keywords
  if (query_lower.includes('airport') || 
      query_lower.includes('fly to') || 
      query_lower.includes('fly from') ||
      query_lower.includes('departure') ||
      query_lower.includes('arrival') ||
      query_lower.includes('terminal')) {
    tables.push('airports');
  }
  
  // Flight related keywords
  if (query_lower.includes('flight') || 
      query_lower.includes('booking') || 
      query_lower.includes('offer') ||
      query_lower.includes('travel') ||
      query_lower.includes('ticket') ||
      query_lower.includes('schedule')) {
    tables.push('flights');
  }
  
  // JetShare offer related keywords
  if (query_lower.includes('jetshare') ||
      query_lower.includes('share') ||
      query_lower.includes('offer') ||
      query_lower.includes('seat') ||
      query_lower.includes('seats') ||
      query_lower.includes('available')) {
    tables.push('jetshare_offers');
  }
  
  // Jet related keywords
  if (query_lower.includes('jet') || 
      query_lower.includes('aircraft') || 
      query_lower.includes('plane') ||
      query_lower.includes('model')) {
    tables.push('jets');
  }
  
  // If no specific tables detected, search all relevant tables
  if (tables.length === 0) {
    return ['airports', 'flights', 'jets', 'jetshare_offers'];
  }
  
  return tables;
}

/**
 * Formats database results into a context string for the AI
 */
function formatDatabaseContextString(results: Record<string, any[]>, isHistorical: boolean = false): string {
  if (!results || Object.keys(results).length === 0) {
    return '';
  }
  
  const sections: string[] = [];
  
  // Format airports
  if (results.airports && results.airports.length > 0) {
    const airportInfo = results.airports.map(airport => 
      `- ${airport.name} (${airport.code}): ${airport.city}, ${airport.country}`
    ).join('\n');
    
    sections.push(`RELEVANT AIRPORTS:\n${airportInfo}`);
  }
  
  // Format flights
  if (results.flights && results.flights.length > 0) {
    const flightInfo = results.flights.map(flight => 
      `- Flight from ${flight.departure_location} to ${flight.arrival_location} on ${flight.flight_date}, ` +
      `Aircraft: ${flight.aircraft_model}, Cost: $${flight.total_flight_cost}`
    ).join('\n');
    
    sections.push(`RELEVANT FLIGHTS:\n${flightInfo}`);
  }
  
  // Format jetshare offers with clear status indication
  if (results.jetshare_offers && results.jetshare_offers.length > 0) {
    // Separate active from historical offers
    const activeOffers = results.jetshare_offers.filter(offer => offer.status === 'open');
    const historicalOffers = results.jetshare_offers.filter(offer => offer.status !== 'open');
    
    // Format active offers
    if (activeOffers.length > 0) {
      const activeOffersInfo = activeOffers.map(offer => 
        `- ACTIVE OFFER: From ${offer.departure_location} to ${offer.arrival_location} on ${offer.flight_date}, ` +
        `Aircraft: ${offer.aircraft_model}, Cost: $${offer.total_flight_cost}, ` +
        `Available Seats: ${offer.available_seats}`
      ).join('\n');
      
      sections.push(`CURRENT JETSHARE OFFERS:\n${activeOffersInfo}`);
    }
    
    // Format historical offers if relevant
    if (historicalOffers.length > 0 && isHistorical) {
      const historicalOffersInfo = historicalOffers.map(offer => 
        `- ${offer.status.toUpperCase()} OFFER: From ${offer.departure_location} to ${offer.arrival_location} on ${offer.flight_date}, ` +
        `Aircraft: ${offer.aircraft_model}, Cost: $${offer.total_flight_cost}, ` +
        `Status: ${offer.status}`
      ).join('\n');
      
      sections.push(`HISTORICAL JETSHARE OFFERS:\n${historicalOffersInfo}`);
    }
  }
  
  // Format jets
  if (results.jets && results.jets.length > 0) {
    const jetInfo = results.jets.map(jet => 
      `- ${jet.model}: ${jet.manufacturer}, Range: ${jet.range} miles, ` +
      `Capacity: ${jet.passenger_capacity} passengers, Speed: ${jet.cruise_speed} mph`
    ).join('\n');
    
    sections.push(`RELEVANT JETS:\n${jetInfo}`);
  }
  
  return sections.join('\n\n');
}

/**
 * Formats database context for direct inclusion in a prompt
 */
export function formatDatabaseContext(context: string): string {
  if (!context) return '';
  
  return `
# RELEVANT DATABASE CONTEXT
The following information from our database is relevant to the user's query:

${context}

Please use this data to provide accurate responses. Do not fabricate any additional details.
If responding about JetShare offers, ONLY reference ACTIVE/OPEN offers in your responses unless the user specifically asks about historical or past offers.
`;
} 