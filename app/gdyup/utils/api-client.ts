/**
 * API Client for GDY·UP
 * Handles API calls in both development and production environments
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isCapacitorApp = typeof window !== 'undefined' && !!(window as any).Capacitor;

// API base URL configuration
const getApiBaseUrl = (): string => {
  // Always use the remote server for real data
  // This ensures we never use fallback data and always get live database data
  if (isCapacitorApp) {
    // In Capacitor app, always use remote server
    return 'https://gdyup.xyz';
  }
  
  if (isDevelopment) {
    // In web development, still use remote server to get real data
    return 'https://gdyup.xyz';
  }
  
  // In production web, use remote server
  return 'https://gdyup.xyz';
};

// Enhanced fetch with proper error handling and headers
export const apiClient = {
  baseUrl: getApiBaseUrl(),
  
  async get(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`[API Client] GET ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          ...options.headers,
        },
        ...options,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`[API Client] GET ${url} - Success (${data?.length || 'object'} items)`);
      return data;
    } catch (error) {
      console.error(`[API Client] GET ${url} - Error:`, error);
      throw error;
    }
  },
  
  async post(endpoint: string, body: any = {}, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`[API Client] POST ${url}`, body);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify(body),
        ...options,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`[API Client] POST ${url} - Success`);
      return data;
    } catch (error) {
      console.error(`[API Client] POST ${url} - Error:`, error);
      throw error;
    }
  },
  
  // Specific API methods
  async getAirports() {
    return this.get('/api/airports');
  },
  
  async getFlights() {
    return this.get('/api/flights');
  },
  
  async getJets(userId?: string) {
    const params = userId ? `?userId=${userId}` : '';
    return this.get(`/api/jets${params}`);
  },
  
  async createOffer(offerData: any) {
    return this.post('/api/jetshare/createOffer', offerData);
  },
  
  async getOffers() {
    return this.get('/api/jetshare/getOffers');
  },
  
  // Fallback data for when API calls fail
  getFallbackAirports() {
    return [
      { code: 'KTEB', name: 'Teterboro Airport', city: 'Teterboro', country: 'USA' },
      { code: 'KLAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'USA' },
      { code: 'KJFK', name: 'John F. Kennedy International', city: 'New York', country: 'USA' },
      { code: 'KMIA', name: 'Miami International', city: 'Miami', country: 'USA' },
      { code: 'KSFO', name: 'San Francisco International', city: 'San Francisco', country: 'USA' },
      { code: 'KLAS', name: 'Harry Reid International', city: 'Las Vegas', country: 'USA' },
      { code: 'KORD', name: 'O\'Hare International', city: 'Chicago', country: 'USA' },
      { code: 'KATL', name: 'Hartsfield-Jackson Atlanta International', city: 'Atlanta', country: 'USA' },
      { code: 'KDEN', name: 'Denver International', city: 'Denver', country: 'USA' },
      { code: 'KSEA', name: 'Seattle-Tacoma International', city: 'Seattle', country: 'USA' },
      { code: 'EGLL', name: 'London Heathrow', city: 'London', country: 'UK' },
      { code: 'LFPB', name: 'Paris Le Bourget', city: 'Paris', country: 'France' },
      { code: 'OMDB', name: 'Dubai International', city: 'Dubai', country: 'UAE' },
      { code: 'RJTT', name: 'Tokyo Haneda', city: 'Tokyo', country: 'Japan' },
      { code: 'YSSY', name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'Australia' }
    ];
  },
  
  getFallbackFlights() {
    return [];
  },
  
  // Helper method to get data with automatic fallback - ONLY use fallback as last resort
  async getAirportsWithFallback() {
    try {
      const airports = await this.getAirports();
      if (Array.isArray(airports) && airports.length > 0) {
        console.log(`[API Client] Successfully loaded ${airports.length} airports from API`);
        return airports;
      }
      throw new Error('No airports returned from API');
    } catch (error) {
      console.error('[API Client] Failed to load airports from API:', error);
      console.warn('[API Client] Using fallback airports as last resort');
      return this.getFallbackAirports();
    }
  },
  
  async getFlightsWithFallback() {
    try {
      const flights = await this.getFlights();
      if (Array.isArray(flights)) {
        console.log(`[API Client] Successfully loaded ${flights.length} flights from API`);
        return flights;
      }
      throw new Error('No flights returned from API');
    } catch (error) {
      console.error('[API Client] Failed to load flights from API:', error);
      console.warn('[API Client] Using fallback flights as last resort');
      return this.getFallbackFlights();
    }
  }
};

export default apiClient; 