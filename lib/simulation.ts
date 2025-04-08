import { createClient as createSupabaseServerClient } from '@/lib/supabase-server';
import { v4 as uuidv4 } from 'uuid';
import * as pineconeService from './services/pinecone-browser';

// Define simulation types that match the database schema
export type SimType = 'jetshare' | 'pulse' | 'marketplace';

// Define simulation configuration type
export interface SimConfig {
  startDate: Date;
  endDate: Date;
  simulationType: SimType;
  virtualUsers: number;
  useAIMatching: boolean;
  // Optional fields for agent use
  agentInstructionSummary?: string;
  triggeredByUserId?: string;
  // Optional location fields for route-specific simulations
  origin?: string;
  destination?: string;
}

// Define simulation metrics
export interface SimMetrics {
  offerFillRate: number;
  acceptedFlights: number;
  unfilledFlights: number;
  revenue: number;
  maxRevenue: number;
  successPercentage: number;
  feeRevenue: number;
  creatorCostRecoupmentPercentage: number;
}

// Define simulation log entry
export interface SimLogEntry {
  timestamp: Date;
  event: string;
  details: string;
}

// Define simulation result
export interface SimResult {
  id: string;
  timestamp: Date;
  simulationType: SimType;
  parameters: {
    startDate: Date;
    endDate: Date;
    virtualUsers: number;
    useAIMatching: boolean;
  };
  metrics: SimMetrics;
  logEntries: SimLogEntry[];
  // Summary text for AI/embeddings compatibility
  summaryText: string;
}

/**
 * Run a simulation with the provided configuration
 * This function can be called from the UI or the AI concierge
 */
export const runSimulation = async (config: SimConfig): Promise<SimResult> => {
  const simulationId = uuidv4();
  const timestamp = new Date();
  
  // Calculate the number of days in the simulation
  const days = Math.floor((config.endDate.getTime() - config.startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Generate simulation metrics based on the configuration
  const metrics: SimMetrics = generateMetrics(config);
  
  // Generate log entries
  const logEntries: SimLogEntry[] = generateLogEntries(config, metrics, days * 24 * 60 * 60 * 1000);
  
  // Create the simulation result
  const result: SimResult = {
    id: simulationId,
    timestamp,
    simulationType: config.simulationType,
    parameters: {
      startDate: config.startDate,
      endDate: config.endDate,
      virtualUsers: config.virtualUsers,
      useAIMatching: config.useAIMatching,
    },
    metrics,
    logEntries,
    // Generate a summary text for embeddings/AI
    summaryText: generateSummaryText(config, metrics),
  };
  
  // Store the result in the database
  await storeSimulationResult(result, config);
  
  // Index the simulation in the vector database for semantic search
  // Do this asynchronously so it doesn't block the response
  indexSimulationInVectorDB(result).catch(error => {
    console.error('Failed to index simulation in vector database:', error);
  });
  
  return result;
};

/**
 * Generate mock simulation metrics based on input parameters
 */
function generateMetrics(config: SimConfig): SimMetrics {
  const { virtualUsers, useAIMatching, startDate, endDate } = config;
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;

  // Base success rate
  const baseSuccess = Math.min(0.6, 0.3 + virtualUsers / 2000);
  const aiBoost = useAIMatching ? 1.2 : 1.0;
  const successPercentage = Math.min(95, Math.round(baseSuccess * aiBoost * 100 + (Math.random() * 10)));

  // Offer fill rate
  const baseFillRate = (successPercentage / 100) * (0.8 + Math.random() * 0.15);
  const offerFillRate = Math.min(0.98, baseFillRate);

  // Simulate flights
  const totalPotentialFlights = Math.ceil(virtualUsers * days * (0.1 + Math.random() * 0.05));
  const acceptedFlights = Math.round(totalPotentialFlights * offerFillRate);
  const unfilledFlights = totalPotentialFlights - acceptedFlights;

  // Simulate revenue & costs
  const estimatedFlightCost = 15000 + Math.random() * 10000; // $15k - $25k per flight
  const totalEstimatedCost = totalPotentialFlights * estimatedFlightCost; // Total cost if all potential flights ran
  // Actual revenue from accepted shares (what sharers paid)
  const revenue = acceptedFlights * (estimatedFlightCost * (0.95 + Math.random() * 0.1)); // Simulate sharer price variation
  
  // Calculate Fee Revenue (e.g., 5% of actual revenue)
  const feeRate = 0.05;
  const feeRevenue = revenue * feeRate;

  // Calculate Creator Cost Recoupment Percentage
  // This is the % of the *accepted* flights' estimated cost that was covered by sharer payments
  const costOfAcceptedFlights = acceptedFlights * estimatedFlightCost;
  const creatorCostRecoupmentPercentage = costOfAcceptedFlights > 0 
    ? Math.min(100, Math.round((revenue / costOfAcceptedFlights) * 100))
    : 0;

  return {
    successPercentage,
    offerFillRate,
    acceptedFlights,
    unfilledFlights,
    revenue: Math.round(revenue), 
    maxRevenue: Math.round(totalEstimatedCost), // Renamed from maxRevenue for clarity
    feeRevenue: Math.round(feeRevenue),
    creatorCostRecoupmentPercentage, // Added recoupment percentage
  };
}

/**
 * Generate mock simulation log entries
 */
function generateLogEntries(config: SimConfig, metrics: SimMetrics, totalDurationMs: number): SimLogEntry[] {
  const { startDate, endDate, virtualUsers } = config;
  const { acceptedFlights, unfilledFlights } = metrics;
  const logCount = Math.min(200, Math.max(50, virtualUsers)); // Generate a reasonable number of logs
  const logs: SimLogEntry[] = [];
  const simStartTime = startDate.getTime();
  const simEndTime = endDate.getTime();
  const actualDurationMs = simEndTime - simStartTime;

  const events = [
    { event: 'User Login', details: 'User authenticated successfully' },
    { event: 'Offer Created', details: 'New JetShare offer posted' },
    { event: 'Search Performed', details: 'User searched for flights' },
    { event: 'Offer Viewed', details: 'User viewed JetShare offer details' },
    { event: 'Offer Accepted', details: 'User accepted JetShare offer' },
    { event: 'Payment Initiated', details: 'User started payment process' },
    { event: 'Payment Completed', details: 'Payment successful, booking confirmed' },
    { event: 'Offer Expired', details: 'JetShare offer expired unfilled' },
    { event: 'Flight Completed', details: 'Simulated flight reached destination' },
    { event: 'User Logout', details: 'User session ended' },
  ];

  // Determine probabilities based on metrics
  const totalFlights = acceptedFlights + unfilledFlights;
  const acceptProbability = totalFlights > 0 ? acceptedFlights / totalFlights : 0.5;
  const paymentProbability = 0.9; // Assume 90% of acceptances lead to payment attempt
  const paymentSuccessProbability = 0.95; // Assume 95% of payments succeed

  for (let i = 0; i < logCount; i++) {
    // Simulate time progression
    const logTimeMs = simStartTime + (actualDurationMs * (i / logCount)) * (0.8 + Math.random() * 0.4);
    const timestamp = new Date(logTimeMs);
    
    let chosenEvent;
    const rand = Math.random();

    // Bias events based on probabilities
    if (rand < acceptProbability * 0.4) { // Higher chance of acceptance-related logs if fill rate is high
      chosenEvent = events.find(e => e.event === 'Offer Accepted')!;
    } else if (rand < acceptProbability * 0.4 + (1 - acceptProbability) * 0.3) { // Higher chance of expiration if fill rate is low
      chosenEvent = events.find(e => e.event === 'Offer Expired')!;
    } else if (rand < 0.8) { // General user activity
      chosenEvent = events[Math.floor(Math.random() * 4)]; // Login, Create, Search, View
    } else { // Payment/Completion/Logout
      chosenEvent = events[5 + Math.floor(Math.random() * 5)]; 
    }

    // Refine details based on event
    let details = chosenEvent.details;
    if (chosenEvent.event === 'Offer Accepted') {
      if (Math.random() < paymentProbability) {
        // Simulate payment flow
        logs.push({ timestamp, event: chosenEvent.event, details });
        const paymentTime = new Date(timestamp.getTime() + Math.random() * 1000 * 60 * 5); // 0-5 mins later
        logs.push({ timestamp: paymentTime, event: 'Payment Initiated', details: 'User started payment process' });
        if (Math.random() < paymentSuccessProbability) {
           const paymentSuccessTime = new Date(paymentTime.getTime() + Math.random() * 1000 * 30); // 0-30 secs later
           logs.push({ timestamp: paymentSuccessTime, event: 'Payment Completed', details: 'Payment successful, booking confirmed' });
        }
        continue; // Skip adding the original 'Offer Accepted' log again
      }
    } else if (chosenEvent.event === 'Offer Expired') {
       details = `JetShare offer expired unfilled (ID: ${uuidv4().substring(0, 8)})`;
    }

    logs.push({ timestamp, event: chosenEvent.event, details });
  }

  // Sort logs chronologically
  return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/**
 * Generate a summary text for the simulation (AI/embeddings compatible)
 */
function generateSummaryText(config: SimConfig, metrics: SimMetrics): string {
  const { simulationType, virtualUsers, startDate, endDate, useAIMatching } = config;
  const { offerFillRate, revenue, maxRevenue } = metrics;
  
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const fillRatePercent = Math.round(offerFillRate * 100);
  const revenueRecovery = Math.round((revenue / maxRevenue) * 100);
  
  let locationContext = '';
  if (simulationType === 'jetshare') {
    const locations = ['NYC to Miami', 'LA to Vegas', 'Chicago to Dallas', 'Boston to DC'];
    locationContext = `from ${locations[Math.floor(Math.random() * locations.length)]}`;
  }
  
  return `${simulationType.charAt(0).toUpperCase() + simulationType.slice(1)} simulation for ${virtualUsers} users ${locationContext} over ${days} days achieved a ${fillRatePercent}% fill rate and recovered ${revenueRecovery}% of costs${useAIMatching ? ' with AI matching enabled' : ' without AI matching'}.`;
}

/**
 * Store a simulation result in the database
 */
async function storeSimulationResult(result: SimResult, config: SimConfig): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Format the data for storing in the database
    const dbRecord = {
      id: result.id,
      sim_type: result.simulationType,
      start_date: config.startDate.toISOString().split('T')[0],
      end_date: config.endDate.toISOString().split('T')[0],
      virtual_users: config.virtualUsers,
      ai_matching_enabled: config.useAIMatching,
      input_parameters: {
        ...config,
        // Convert dates to ISO strings for JSON compatibility
        startDate: config.startDate.toISOString(),
        endDate: config.endDate.toISOString(),
      },
      results_summary: {
        metrics: result.metrics,
        summaryText: result.summaryText,
        logEntries: result.logEntries.map(entry => ({
          ...entry,
          timestamp: entry.timestamp.toISOString(),
        })),
      },
      agent_instruction_summary: config.agentInstructionSummary || result.summaryText,
      triggered_by_user_id: config.triggeredByUserId,
      created_at: result.timestamp.toISOString(),
    };
    
    // Insert the record into the database
    const { error } = await supabase
      .from('simulation_logs')
      .insert(dbRecord);
    
    if (error) {
      console.error('Error storing simulation result:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error storing simulation result:', error);
    throw error;
  }
}

/**
 * Get recent simulations from the database
 * This is useful for agents to access previous simulation data
 */
export async function getRecentSimulations(limit: number = 10): Promise<SimResult[]> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('simulation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching recent simulations:', error);
      throw error;
    }
    
    // Convert the database records back to SimResult objects
    return data.map((record: any) => {
      const parameters = record.input_parameters;
      const metrics = record.results_summary.metrics;
      const logEntries = record.results_summary.logEntries || [];
      
      return {
        id: record.id,
        timestamp: new Date(record.created_at),
        simulationType: record.sim_type as SimType,
        parameters: {
          startDate: new Date(parameters.startDate),
          endDate: new Date(parameters.endDate),
          virtualUsers: parameters.virtualUsers,
          useAIMatching: parameters.useAIMatching,
        },
        metrics,
        logEntries: logEntries.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        })),
        summaryText: record.results_summary.summaryText || record.agent_instruction_summary,
      };
    });
  } catch (error) {
    console.error('Error getting recent simulations:', error);
    return [];
  }
}

/**
 * Get a simulation by its ID
 */
export async function getSimulationById(simulationId: string): Promise<SimResult | null> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('simulation_logs')
      .select('*')
      .eq('id', simulationId)
      .single();
    
    if (error) {
      console.error('Error fetching simulation by ID:', error);
      return null;
    }
    
    if (!data) {
      return null;
    }
    
    // Convert the database record to a SimResult object
    const parameters = data.input_parameters;
    const metrics = data.results_summary.metrics;
    const logEntries = data.results_summary.logEntries || [];
    
    return {
      id: data.id,
      timestamp: new Date(data.created_at),
      simulationType: data.sim_type as SimType,
      parameters: {
        startDate: new Date(parameters.startDate),
        endDate: new Date(parameters.endDate),
        virtualUsers: parameters.virtualUsers,
        useAIMatching: parameters.useAIMatching,
      },
      metrics,
      logEntries: logEntries.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      })),
      summaryText: data.results_summary.summaryText || data.agent_instruction_summary,
    };
  } catch (error) {
    console.error('Error getting simulation by ID:', error);
    return null;
  }
}

/**
 * Get simulation stats by type
 * This is useful for agents to get aggregated statistics
 */
export async function getSimulationStatsByType(simType: SimType): Promise<any> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('simulation_logs')
      .select('*')
      .eq('sim_type', simType)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(`Error fetching ${simType} simulation stats:`, error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return {
        count: 0,
        averageFillRate: 0,
        averageSuccessRate: 0,
        aiImprovementFactor: 0,
      };
    }
    
    // Calculate average metrics
    const withAI = data.filter((record: any) => record.ai_matching_enabled);
    const withoutAI = data.filter((record: any) => !record.ai_matching_enabled);
    
    const avgFillRateWithAI = withAI.length > 0
      ? withAI.reduce((sum: number, record: any) => sum + record.results_summary.metrics.offerFillRate, 0) / withAI.length
      : 0;
    
    const avgFillRateWithoutAI = withoutAI.length > 0
      ? withoutAI.reduce((sum: number, record: any) => sum + record.results_summary.metrics.offerFillRate, 0) / withoutAI.length
      : 0;
    
    const aiImprovementFactor = avgFillRateWithoutAI > 0
      ? avgFillRateWithAI / avgFillRateWithoutAI
      : 1;
    
    const avgSuccessRate = data.reduce((sum: number, record: any) => 
      sum + record.results_summary.metrics.successPercentage, 0) / data.length;
    
    return {
      count: data.length,
      averageFillRate: (data.reduce((sum: number, record: any) => 
        sum + record.results_summary.metrics.offerFillRate, 0) / data.length) * 100,
      averageSuccessRate: avgSuccessRate,
      aiImprovementFactor: aiImprovementFactor,
      recentSimulations: data.slice(0, 5).map((record: any) => ({
        id: record.id,
        timestamp: record.created_at,
        summaryText: record.results_summary.summaryText || record.agent_instruction_summary,
      })),
    };
  } catch (error) {
    console.error(`Error getting ${simType} simulation stats:`, error);
    return {
      count: 0,
      averageFillRate: 0,
      averageSuccessRate: 0,
      aiImprovementFactor: 0,
    };
  }
}

/**
 * Function for the concierge to run a simulation directly
 * This matches the suggested runSimulationFromAgent function
 */
export async function runSimulationFromAgent(config: SimConfig, userId?: string): Promise<{
  result: SimResult;
  summary: string;
}> {
  // Run the actual simulation
  const result = await runSimulation({
    ...config,
    triggeredByUserId: userId
  });
  
  // Generate a summary for the agent
  const summary = result.summaryText;
  
  return {
    result,
    summary
  };
}

/**
 * Generate embedding input for vector databases
 * This follows the suggested format for Pinecone or pgvector
 * Accepts either a DB log object or a SimResult object
 */
export function generateEmbeddingInput(logOrResult: any): string {
  // Determine if it's a SimResult or a DB log based on properties
  const isSimResult = logOrResult.simulationType !== undefined && logOrResult.parameters !== undefined;
  
  const simType = (isSimResult ? logOrResult.simulationType : logOrResult.sim_type || '').toUpperCase();
  let startDate = 'Unknown';
  let endDate = 'Unknown';
  let virtualUsers = 'Unknown';
  let fillRate = 0;
  let costRecovery = 0;
  let origin = 'N/A';
  let destination = 'N/A';
  let aiMatching = 'Disabled';
  let summary = 'No summary available';

  if (isSimResult) {
    startDate = logOrResult.parameters.startDate ? new Date(logOrResult.parameters.startDate).toLocaleDateString() : 'Unknown';
    endDate = logOrResult.parameters.endDate ? new Date(logOrResult.parameters.endDate).toLocaleDateString() : 'Unknown';
    virtualUsers = logOrResult.parameters.virtualUsers?.toString() || 'Unknown';
    fillRate = logOrResult.metrics?.offerFillRate ? Math.round(logOrResult.metrics.offerFillRate * 100) : 0;
    costRecovery = logOrResult.metrics?.revenue && logOrResult.metrics?.maxRevenue
      ? Math.round((logOrResult.metrics.revenue / logOrResult.metrics.maxRevenue) * 100)
      : 0;
    origin = logOrResult.parameters?.origin || 'N/A'; // Assuming origin/dest are in parameters now
    destination = logOrResult.parameters?.destination || 'N/A';
    aiMatching = logOrResult.parameters.useAIMatching ? 'Enabled' : 'Disabled';
    summary = logOrResult.summaryText || 'No summary available';
  } else {
    // Assume DB log structure
    startDate = logOrResult.start_date ? new Date(logOrResult.start_date).toLocaleDateString() : 'Unknown';
    endDate = logOrResult.end_date ? new Date(logOrResult.end_date).toLocaleDateString() : 'Unknown';
    virtualUsers = logOrResult.virtual_users?.toString() || 'Unknown';
    fillRate = logOrResult.results_summary?.metrics?.offerFillRate ? Math.round(logOrResult.results_summary.metrics.offerFillRate * 100) : 0;
    costRecovery = logOrResult.results_summary?.metrics?.revenue && logOrResult.results_summary?.metrics?.maxRevenue
      ? Math.round((logOrResult.results_summary.metrics.revenue / logOrResult.results_summary.metrics.maxRevenue) * 100)
      : 0;
    origin = logOrResult.input_parameters?.origin || 'N/A';
    destination = logOrResult.input_parameters?.destination || 'N/A';
    aiMatching = logOrResult.ai_matching_enabled ? 'Enabled' : 'Disabled';
    summary = logOrResult.agent_instruction_summary || logOrResult.results_summary?.summaryText || 'No summary available';
  }

  return `
${simType} simulation
Date Range: ${startDate} to ${endDate}
Users: ${virtualUsers}
Fill Rate: ${fillRate}%
Cost Recovery: ${costRecovery}%
Origin: ${origin}
Destination: ${destination}
AI Matching: ${aiMatching}
Summary: ${summary}
`;
}

// Add function to prepare simulation for embedding
/**
 * Prepare a simulation record for embedding in Pinecone
 * @param result - The simulation result to prepare for embedding
 * @returns The properly structured record for embedding
 */
export async function prepareSimulationForEmbedding(result: SimResult): Promise<{
  id: string;
  embedInput: string;
  metadata: Record<string, any>;
}> {
  try {
    // Convert the simulation result to an embedding-friendly format
    // Pass the SimResult object directly
    const embedInput = generateEmbeddingInput(result);

    // Structure metadata for retrieval
    const metadata = {
      id: result.id,
      type: 'simulation', 
      sim_type: result.simulationType,
      created_at: result.timestamp.toISOString(),
      fill_rate: result.metrics.offerFillRate.toFixed(2),
      success_rate: result.metrics.successPercentage.toString(),
      virtual_users: result.parameters.virtualUsers.toString(),
      ai_matching: result.parameters.useAIMatching ? 'enabled' : 'disabled',
      summary: result.summaryText
    };

    return {
      id: `simulation-${result.id}`,
      embedInput,
      metadata
    };
  } catch (error) {
    console.error('Error preparing simulation for embedding:', error);
    throw error;
  }
}

/**
 * Store a simulation in the vector database for semantic search
 * This can be called after runSimulation to make results searchable
 */
export async function indexSimulationInVectorDB(result: SimResult): Promise<void> {
  try {
    // Import services dynamically to avoid circular dependencies
    const embeddingService = await import('./services/embeddings');
    
    // Prepare the simulation for embedding
    const { id, embedInput, metadata } = await prepareSimulationForEmbedding(result);
    
    // Generate the embedding vector
    const vector = await embeddingService.encode(embedInput);
    
    // Create the record for Pinecone
    const record = {
      id,
      embedding: vector,
      metadata
    };
    
    // Upsert the record to Pinecone
    await pineconeService.upsertRecord(record);
    
    console.log(`Indexed simulation ${result.id} in vector database`);
  } catch (error) {
    console.error('Error indexing simulation in vector database:', error);
    // Don't throw - we want the simulation to succeed even if embedding fails
  }
} 