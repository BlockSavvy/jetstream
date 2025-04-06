import { createClient } from '@/lib/supabase-server';
import { 
  SimType, 
  SimConfig, 
  SimResult, 
  runSimulationFromAgent,
  generateEmbeddingInput
} from '@/lib/simulation';

/**
 * Utility functions for the AI concierge to interact with simulations
 * These functions are called by the AI concierge via function calling
 */

/**
 * Function for the AI concierge to run a simulation
 * This is a wrapper around the API endpoint that handles the details of running a simulation
 */
export async function agentRunSimulation(
  simulationType: SimType,
  virtualUsers: number,
  useAIMatching: boolean = true,
  daysToSimulate: number = 7,
  origin?: string,
  destination?: string,
  agentInstructionSummary?: string
): Promise<{
  success: boolean;
  result?: SimResult;
  summary?: string;
  embeddingInput?: string;
  error?: string;
}> {
  try {
    // Create start and end dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysToSimulate);
    
    // Create the simulation config
    const config: SimConfig = {
      simulationType,
      virtualUsers,
      useAIMatching,
      startDate,
      endDate,
      agentInstructionSummary,
      // Add origin and destination if provided
      ...(origin && { origin }),
      ...(destination && { destination })
    };

    // Get user ID if available
    let userId = undefined;
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      userId = session.user.id;
    }
    
    // Use the new direct simulation function
    const { result, summary } = await runSimulationFromAgent(config, userId);
    
    // Generate embedding input for future vector search
    const log = {
      sim_type: simulationType,
      start_date: startDate,
      end_date: endDate,
      virtual_users: virtualUsers,
      ai_matching_enabled: useAIMatching,
      input_parameters: { ...config, origin, destination },
      results_summary: { metrics: result.metrics, summaryText: summary },
      agent_instruction_summary: summary
    };
    
    const embeddingInput = generateEmbeddingInput(log);
    
    return {
      success: true,
      result,
      summary,
      embeddingInput
    };
  } catch (error) {
    console.error('Error running simulation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Function for the AI concierge to get recent simulations
 */
export async function agentGetRecentSimulations(limit: number = 5): Promise<{
  success: boolean;
  simulations?: SimResult[];
  error?: string;
}> {
  try {
    // Make the API call
    const response = await fetch('/api/concierge/simulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getRecentSimulations',
        payload: { limit },
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get recent simulations');
    }
    
    const data = await response.json();
    return {
      success: true,
      simulations: data.simulations,
    };
  } catch (error) {
    console.error('Error getting recent simulations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Function for the AI concierge to get simulation stats by type
 */
export async function agentGetSimulationStatsByType(simType: SimType): Promise<{
  success: boolean;
  stats?: any;
  error?: string;
}> {
  try {
    // Make the API call
    const response = await fetch('/api/concierge/simulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getSimulationStatsByType',
        payload: { simType },
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get simulation stats');
    }
    
    const data = await response.json();
    return {
      success: true,
      stats: data.stats,
    };
  } catch (error) {
    console.error('Error getting simulation stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Function for the AI concierge to get all simulation stats
 */
export async function agentGetAllSimulationStats(): Promise<{
  success: boolean;
  stats?: {
    jetshare: any;
    pulse: any;
    marketplace: any;
  };
  error?: string;
}> {
  try {
    // Make the API call - using the GET endpoint for simplicity
    const response = await fetch('/api/concierge/simulation', {
      method: 'GET',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get simulation stats');
    }
    
    const data = await response.json();
    return {
      success: true,
      stats: data.stats,
    };
  } catch (error) {
    console.error('Error getting all simulation stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Function for the AI concierge to run a JetShare simulation specifically
 * This is a convenience wrapper around agentRunSimulation
 */
export async function agentSimulateJetShareFill(
  virtualUsers: number = 100,
  daysToSimulate: number = 7,
  useAIMatching: boolean = true,
  origin?: string,
  destination?: string,
  summary?: string
): Promise<{
  success: boolean;
  result?: SimResult;
  summary?: string;
  error?: string;
}> {
  return agentRunSimulation(
    'jetshare',
    virtualUsers,
    useAIMatching,
    daysToSimulate,
    origin,
    destination,
    summary || `JetShare fill rate simulation with ${virtualUsers} users over ${daysToSimulate} days${origin && destination ? ` from ${origin} to ${destination}` : ''}.`
  );
}

/**
 * Function for the AI concierge to get JetShare projections
 * This combines simulation data with analysis
 */
export async function agentGetJetShareProjections(
  daysToProject: number = 30
): Promise<{
  success: boolean;
  projections?: {
    estimatedFillRate: number;
    estimatedRevenue: number;
    estimatedAcceptedFlights: number;
    aiImprovementFactor: number;
    summary: string;
  };
  error?: string;
}> {
  try {
    // Get stats for JetShare simulations
    const { success, stats, error } = await agentGetSimulationStatsByType('jetshare');
    
    if (!success || !stats) {
      throw new Error(error || 'Failed to get JetShare stats');
    }
    
    // Calculate projections based on historical data
    const estimatedFillRate = stats.averageFillRate / 100; // Convert from percentage to decimal
    const estimatedDailyFlights = 5; // Assuming 5 flights per day on average
    const estimatedRevenuePerFlight = 25000; // Assuming $25k per flight on average
    
    const estimatedAcceptedFlights = Math.round(estimatedDailyFlights * daysToProject * estimatedFillRate);
    const estimatedRevenue = Math.round(estimatedAcceptedFlights * estimatedRevenuePerFlight);
    
    return {
      success: true,
      projections: {
        estimatedFillRate: Math.round(estimatedFillRate * 100), // Back to percentage for display
        estimatedRevenue,
        estimatedAcceptedFlights,
        aiImprovementFactor: stats.aiImprovementFactor,
        summary: `Based on ${stats.count} historical simulations, JetShare is projected to achieve a ${Math.round(estimatedFillRate * 100)}% fill rate over the next ${daysToProject} days, generating approximately $${(estimatedRevenue / 1000000).toFixed(2)}M in revenue from ${estimatedAcceptedFlights} accepted flights. AI matching improves results by a factor of ${stats.aiImprovementFactor.toFixed(2)}.`
      }
    };
  } catch (error) {
    console.error('Error getting JetShare projections:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
} 