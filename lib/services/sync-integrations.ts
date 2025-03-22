import { syncFlightToVectorDB, syncUserToVectorDB } from './matching';

/**
 * Utility function to sync a user profile to Pinecone after it's updated
 * This can be called from API endpoints that update user profiles
 */
export async function syncProfileAfterUpdate(userId: string): Promise<boolean> {
  try {
    // Introduce a slight delay to allow database to update fully
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`Syncing user profile ${userId} to vector database...`);
    const success = await syncUserToVectorDB(userId);
    
    if (success) {
      console.log(`Successfully synced user profile ${userId} to vector database`);
    } else {
      console.error(`Failed to sync user profile ${userId} to vector database`);
    }
    
    return success;
  } catch (error) {
    console.error(`Error syncing user profile ${userId} to vector database:`, error);
    return false;
  }
}

/**
 * Utility function to sync a flight to Pinecone after it's updated
 * This can be called from API endpoints that update flights
 */
export async function syncFlightAfterUpdate(flightId: string): Promise<boolean> {
  try {
    // Introduce a slight delay to allow database to update fully
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`Syncing flight ${flightId} to vector database...`);
    const success = await syncFlightToVectorDB(flightId);
    
    if (success) {
      console.log(`Successfully synced flight ${flightId} to vector database`);
    } else {
      console.error(`Failed to sync flight ${flightId} to vector database`);
    }
    
    return success;
  } catch (error) {
    console.error(`Error syncing flight ${flightId} to vector database:`, error);
    return false;
  }
}

/**
 * Utility function to sync batch of profiles to Pinecone
 * This can be used for bulk operations or scheduled jobs
 */
export async function syncProfilesBatch(userIds: string[]): Promise<{ 
  success: number; 
  failed: number; 
  total: number;
}> {
  try {
    console.log(`Syncing ${userIds.length} user profiles to vector database...`);
    
    const results = await Promise.allSettled(
      userIds.map(userId => syncUserToVectorDB(userId))
    );
    
    const successCount = results.filter(
      result => result.status === 'fulfilled' && result.value
    ).length;
    
    console.log(`Synced ${successCount}/${userIds.length} user profiles to vector database`);
    
    return {
      success: successCount,
      failed: userIds.length - successCount,
      total: userIds.length
    };
  } catch (error) {
    console.error(`Error syncing user profiles batch to vector database:`, error);
    return {
      success: 0,
      failed: userIds.length,
      total: userIds.length
    };
  }
}

/**
 * Utility function to sync batch of flights to Pinecone
 * This can be used for bulk operations or scheduled jobs
 */
export async function syncFlightsBatch(flightIds: string[]): Promise<{ 
  success: number; 
  failed: number; 
  total: number;
}> {
  try {
    console.log(`Syncing ${flightIds.length} flights to vector database...`);
    
    const results = await Promise.allSettled(
      flightIds.map(flightId => syncFlightToVectorDB(flightId))
    );
    
    const successCount = results.filter(
      result => result.status === 'fulfilled' && result.value
    ).length;
    
    console.log(`Synced ${successCount}/${flightIds.length} flights to vector database`);
    
    return {
      success: successCount,
      failed: flightIds.length - successCount,
      total: flightIds.length
    };
  } catch (error) {
    console.error(`Error syncing flights batch to vector database:`, error);
    return {
      success: 0,
      failed: flightIds.length,
      total: flightIds.length
    };
  }
} 