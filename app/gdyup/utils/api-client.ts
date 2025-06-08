/**
 * API Client for GDY·UP
 * Handles API calls in both development and production environments
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isCapacitorApp = typeof window !== 'undefined' && !!(window as any).Capacitor;

// API base URL configuration
const getApiBaseUrl = (): string => {
  if (isDevelopment) {
    return 'http://localhost:3000';
  }
  
  // In production (native app), use the remote server
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
  
  // Helper method to get data with automatic fallback
  async getAirportsWithFallback() {
    try {
      const airports = await this.getAirports();
      return Array.isArray(airports) ? airports : this.getFallbackAirports();
    } catch (error) {
      console.warn('[API Client] Using fallback airports due to API error:', error);
      return this.getFallbackAirports();
    }
  },
  
  async getFlightsWithFallback() {
    try {
      const flights = await this.getFlights();
      return Array.isArray(flights) ? flights : this.getFallbackFlights();
    } catch (error) {
      console.warn('[API Client] Using fallback flights due to API error:', error);
      return this.getFallbackFlights();
    }
  }
};

export default apiClient; 