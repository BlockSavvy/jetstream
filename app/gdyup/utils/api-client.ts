/**
 * API Client for GDY·UP
 * Handles API calls in both development and production environments
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isCapacitorApp = typeof window !== 'undefined' && !!(window as any).Capacitor;

// SMART BASE URL - Use local dev server in development, remote in production
const getBaseUrl = (): string => {
  // In Capacitor app, always use remote server
  if (isCapacitorApp) {
    return 'https://gdyup.xyz';
  }
  
  // In web development, use local server
  if (isDevelopment && typeof window !== 'undefined') {
    return window.location.origin; // This will be http://localhost:3000
  }
  
  // In production, use remote server
  return 'https://gdyup.xyz';
};

const BASE_URL = getBaseUrl();
const FORCE_REAL_DATA = true; // Never use fallbacks

console.log('[API Client] 🚀 BASE_URL configured as:', BASE_URL);

// API base URL configuration
const getApiBaseUrl = (): string => {
  return BASE_URL;
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
  
  // REAL DATABASE ONLY - Get airports from live database
  async getAirports(query?: string) {
    try {
      console.log('[API Client] 🚀 LOADING REAL AIRPORTS FROM DATABASE');
      
      const url = query 
        ? `${BASE_URL}/api/airports?query=${encodeURIComponent(query)}&limit=100&t=${Date.now()}`
        : `${BASE_URL}/api/airports?limit=100&t=${Date.now()}`;
      
      console.log('[API Client] Real database URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        next: { revalidate: 0 }
      });

      if (!response.ok) {
        throw new Error(`Airport API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Database returned no airports - this is unacceptable!');
      }

      console.log(`[API Client] ✅ SUCCESS: Loaded ${data.length} real airports from database`);
      return data;
    } catch (error) {
      console.error('[API Client] 🚨 CRITICAL ERROR: Cannot load real airports:', error);
      
      if (FORCE_REAL_DATA) {
        throw new Error('REAL DATA REQUIRED - No fallbacks allowed in production app');
      }
      
      // This should never be reached with FORCE_REAL_DATA = true
      return [];
    }
  },

  // REAL DATABASE ONLY - Get flights from live database  
  async getFlights() {
    try {
      console.log('[API Client] 🚀 LOADING REAL FLIGHTS FROM DATABASE');
      
      const url = `${BASE_URL}/api/flights?t=${Date.now()}`;
      console.log('[API Client] Real flights URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        next: { revalidate: 0 }
      });

      if (!response.ok) {
        throw new Error(`Flights API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Database returned no flights - this is unacceptable!');
      }

      console.log(`[API Client] ✅ SUCCESS: Loaded ${data.length} real flights from database`);
      return data;
    } catch (error) {
      console.error('[API Client] 🚨 CRITICAL ERROR: Cannot load real flights:', error);
      
      if (FORCE_REAL_DATA) {
        throw new Error('REAL DATA REQUIRED - No fallbacks allowed in production app');
      }
      
      return [];
    }
  },

  // REAL DATABASE ONLY - Get offers from live database
  async getOffers() {
    try {
      console.log('[API Client] 🚀 LOADING REAL OFFERS FROM DATABASE');
      
      const url = `${BASE_URL}/api/jetshare/getOffers?t=${Date.now()}`;
      console.log('[API Client] Real offers URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        next: { revalidate: 0 }
      });

      if (!response.ok) {
        throw new Error(`Offers API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      const offers = data.offers || data.data || data;
      
      if (!Array.isArray(offers)) {
        throw new Error('Database returned invalid offers format');
      }

      console.log(`[API Client] ✅ SUCCESS: Loaded ${offers.length} real offers from database`);
      return offers;
    } catch (error) {
      console.error('[API Client] 🚨 CRITICAL ERROR: Cannot load real offers:', error);
      
      if (FORCE_REAL_DATA) {
        throw new Error('REAL DATA REQUIRED - No fallbacks allowed in production app');
      }
      
      return [];
    }
  },

  // PREMIUM DATABASE SEARCH - Advanced airport search
  async searchAirports(query: string, limit: number = 50) {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      console.log(`[API Client] 🔍 SEARCHING REAL AIRPORTS: "${query}"`);
      
      const url = `${BASE_URL}/api/airports?query=${encodeURIComponent(query)}&limit=${limit}&t=${Date.now()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        next: { revalidate: 0 }
      });

      if (!response.ok) {
        throw new Error(`Airport search error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid search response format');
      }

      console.log(`[API Client] ✅ SEARCH SUCCESS: Found ${data.length} airports for "${query}"`);
      return data;
    } catch (error) {
      console.error(`[API Client] 🚨 SEARCH ERROR for "${query}":`, error);
      
      if (FORCE_REAL_DATA) {
        throw error;
      }
      
      return [];
    }
  },

  // ELITE DASHBOARD STATS - Real-time database analytics
  async getDashboardStats() {
    try {
      console.log('[API Client] 📊 LOADING REAL DASHBOARD STATS');
      
      const url = `${BASE_URL}/api/gdyup/dashboard?t=${Date.now()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        next: { revalidate: 0 }
      });

      if (!response.ok) {
        throw new Error(`Dashboard API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[API Client] ✅ DASHBOARD SUCCESS: Real stats loaded');
      return data;
    } catch (error) {
      console.error('[API Client] 🚨 DASHBOARD ERROR:', error);
      
      if (FORCE_REAL_DATA) {
        throw error;
      }
      
      return {
        totalListings: 0,
        activeBookings: 0,
        totalEarnings: 0,
        flightHours: 0
      };
    }
  },
  
  // Specific API methods
  async getJets(userId?: string) {
    const params = userId ? `?userId=${userId}` : '';
    return this.get(`/api/jets${params}`);
  },
  
  async createOffer(offerData: any) {
    return this.post('/api/jetshare/createOffer', offerData);
  },
};

export default apiClient; 