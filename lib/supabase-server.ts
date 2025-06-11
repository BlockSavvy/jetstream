import { createClient as createSupabaseClient } from '@supabase/supabase-js';
// Remove direct import from next/headers
// import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
// Remove or adjust the Database type import that's causing issues
// import type { Database } from '@/types/supabase';

/**
 * Creates a Supabase client for server-side usage with admin privileges
 * Uses service role key for server-side operations that require full database access
 */
export const createClient = async () => {
  // Log app URL from environment for debugging
  if (process.env.NEXT_PUBLIC_APP_URL) {
    console.log('🔐 Initializing Supabase client with app URL:', process.env.NEXT_PUBLIC_APP_URL);
  }
  
  // DEV MODE: Return mock client with admin capabilities
  if (process.env.NEXT_PUBLIC_AUTH_DEV_MODE === 'true') {
    console.log('DEV MODE: Returning mock admin client');
    // Use consistent test user ID
    const mockUserId = '26209e07-7600-4df6-ab1e-4b338f760aff';
    return {
      auth: {
        getSession: async () => ({ 
          data: { 
            session: {
              user: { 
                id: mockUserId, 
                email: 'dev@example.com',
                role: 'authenticated',
                app_metadata: { provider: 'email' },
                user_metadata: { full_name: 'Dev User' }
              }
            }
          }, 
          error: null 
        }),
        getUser: async () => ({
          data: {
            user: {
              id: mockUserId,
              email: 'dev@example.com',
              role: 'authenticated'
            }
          },
          error: null
        })
      },
      from: (table: string) => {
        console.log(`DEV MODE: Mocking server database query on table: ${table}`);
        // Create a mock query builder with all needed methods
        const mockQueryBuilder = {
          select: (columns: string) => {
            console.log(`DEV MODE: Mocking server select(${columns}) on ${table}`);
            return {
              ...mockQueryBuilder,
              eq: (column: string, value: any) => {
                console.log(`DEV MODE: Mocking server eq(${column}, ${value}) on ${table}`);
                
                // Mock responses for specific tables
                if (table === 'profiles' && column === 'id' && value === mockUserId) {
                  return Promise.resolve({
                    data: [{
                      id: mockUserId,
                      first_name: 'Dev',
                      last_name: 'User',
                      email: 'dev@example.com',
                      created_at: new Date().toISOString(),
                      user_type: 'passenger'
                    }],
                    error: null
                  });
                }
                
                if (table === 'concierge_conversations' && column === 'user_id' && value === mockUserId) {
                  return Promise.resolve({
                    data: [{
                      id: 'mock-conversation-1',
                      user_id: mockUserId,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      is_active: true,
                      messages: [
                        {
                          role: 'assistant',
                          content: 'Hello! I\'m your JetStream assistant. How can I help you with private aviation today?'
                        }
                      ]
                    }],
                    error: null
                  });
                }
                
                // Default empty response
                return Promise.resolve({
                  data: [],
                  error: null
                });
              },
              order: (column: string, options: any) => {
                console.log(`DEV MODE: Mocking server order(${column}) on ${table}`);
                return {
                  ...mockQueryBuilder,
                  limit: (limit: number) => {
                    console.log(`DEV MODE: Mocking server limit(${limit}) on ${table}`);
                    return Promise.resolve({
                      data: [],
                      error: null
                    });
                  }
                };
              },
              limit: (limit: number) => {
                console.log(`DEV MODE: Mocking server limit(${limit}) on ${table}`);
                return Promise.resolve({
                  data: [],
                  error: null
                });
              }
            };
          },
          insert: (data: any) => {
            console.log(`DEV MODE: Mocking server insert on ${table}`, data);
            return Promise.resolve({
              data: { id: 'mock-id-' + Date.now() },
              error: null
            });
          },
          update: (data: any) => {
            console.log(`DEV MODE: Mocking server update on ${table}`, data);
            return Promise.resolve({
              data: {},
              error: null
            });
          },
          delete: () => {
            console.log(`DEV MODE: Mocking server delete on ${table}`);
            return Promise.resolve({
              data: {},
              error: null
            });
          }
        };
        
        return mockQueryBuilder;
      }
    } as any;
  }

  try {
    // Get the environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Log detailed debugging info for missing credentials
    if (!supabaseUrl) {
      console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    }
    
    if (!supabaseServiceKey) {
      console.error('ERROR: Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
      console.error('Attempting to use anonymous key as fallback...');
    }
    
    // Validate that we have at least the URL and one type of key
    if (!supabaseUrl) {
      throw new Error('Missing Supabase URL');
    }
    
    if (!supabaseServiceKey && !supabaseAnonKey) {
      throw new Error('Missing both Supabase service role key and anon key');
    }
    
    // Choose the appropriate key, with fallback to anon key if service key is missing
    const keyToUse = supabaseServiceKey || supabaseAnonKey;
    const keyType = supabaseServiceKey ? 'service role' : 'anonymous';
    
    console.log(`Creating Supabase client with ${keyType} key`);
    
    // Create the client with appropriate options
    const supabase = createSupabaseClient(
      supabaseUrl, 
      keyToUse as string,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          fetch: async (url, options) => {
            try {
              return await fetch(url, options);
            } catch (error) {
              console.error(`Supabase fetch error for URL ${url}:`, error);
              // Re-throw for proper error handling upstream
              throw error;
            }
          }
        }
      }
    );
    
    return supabase;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    throw error;
  }
};

/**
 * Creates a Supabase client for server components with user session from cookies
 * This should be used for authenticated server-rendered content in the app/ directory
 * 
 * NOTE: This function is not compatible with pages/ directory.
 * For pages/ directory use, import this function only in app/ directory components
 * or use createAuthClient() instead which works in both contexts.
 */
export function getSupabaseServerClient() {
  if (process.env.NEXT_PUBLIC_AUTH_DEV_MODE === 'true') {
    console.log('DEV MODE: Returning mock server component client');
    // Use consistent test user ID
    const mockUserId = '26209e07-7600-4df6-ab1e-4b338f760aff';
    return {
      auth: {
        getSession: async () => ({ 
          data: { 
            session: {
              user: { 
                id: mockUserId, 
                email: 'dev@example.com',
                app_metadata: { provider: 'email' },
                user_metadata: { full_name: 'Dev User' },
                role: 'authenticated'
              }
            }
          }, 
          error: null 
        }),
      },
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null })
        }),
      }),
    } as any;
  }
  
  try {
    // For compatibility with pages/ directory, we'll create a more basic client
    // This is NOT the ideal solution and should be replaced with a proper app/-compatible
    // approach when migrating completely to app/ directory
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase URL or anon key');
    }
    
    // Using the basic client with anon key and no session persistence
    return createSupabaseClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  } catch (e) {
    console.error('Error creating server component client:', e);
    throw new Error('Failed to create server component client');
  }
}

/**
 * Creates a Supabase client that works in both client and server components
 * using the anon key. This is a replacement for the server-component specific
 * version that used cookies from next/headers.
 * 
 * Note: This doesn't maintain user sessions. For authenticated requests in server
 * components, use the createAuthClient from app/lib/supabase-server-components.ts
 */
export const createAuthClient = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or anon key');
  }
  
  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Export a type so other files can use our return type
export type SupabaseClient = Awaited<ReturnType<typeof createClient>>;