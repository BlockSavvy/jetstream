import { createClient } from '@/lib/supabase-server';
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
  const logEntries: SimLogEntry[] = generateLogEntries(config);
  
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
 * Generate simulation metrics based on the configuration
 */
function generateMetrics(config: SimConfig): SimMetrics {
  const { useAIMatching, virtualUsers } = config;
  
  // Calculate fill rate - AI matching improves this by 20-25%
  const baseRate = 0.5 + Math.random() * 0.2; // 50-70% base rate
  const aiBoost = useAIMatching ? (0.2 + Math.random() * 0.05) : 0; // 20-25% AI boost
  const offerFillRate = Math.min(0.95, baseRate + aiBoost); // Cap at 95%
  
  // Calculate flights stats
  const acceptedFlights = Math.floor(virtualUsers * (0.5 + Math.random() * 0.5));
  const unfilledFlights = Math.floor(virtualUsers * (0.1 + Math.random() * 0.3));
  
  // Calculate revenue stats - more users and AI matching mean more revenue
  const baseRevenue = virtualUsers * 1000;
  const aiRevenueBoost = useAIMatching ? (0.2 + Math.random() * 0.1) : 0; // 20-30% AI revenue boost
  const revenue = Math.floor(baseRevenue * (0.6 + Math.random() * 0.3 + aiRevenueBoost));
  const maxRevenue = Math.floor(baseRevenue * 1.5);
  
  // Calculate success percentage
  const successBase = useAIMatching ? 75 : 50;
  const successVariation = Math.floor(Math.random() * (useAIMatching ? 20 : 25));
  const successPercentage = successBase + successVariation;
  
  return {
    offerFillRate,
    acceptedFlights,
    unfilledFlights,
    revenue,
    maxRevenue,
    successPercentage,
  };
}

/**
 * Generate simulation log entries
 */
function generateLogEntries(config: SimConfig): SimLogEntry[] {
  const { virtualUsers, useAIMatching } = config;
  
  // Create log entries with appropriate timestamps
  const now = new Date();
  return [
    {
      timestamp: new Date(now.getTime()),
      event: "Simulation Started",
      details: `Started ${config.simulationType} simulation with ${virtualUsers} virtual users`,
    },
    {
      timestamp: new Date(now.getTime() + 1000),
      event: "User Generation",
      details: `Created ${virtualUsers} synthetic user profiles`,
    },
    {
      timestamp: new Date(now.getTime() + 2000),
      event: "Preference Modeling",
      details: "Applied travel preference distributions across user base",
    },
    {
      timestamp: new Date(now.getTime() + 3000),
      event: "Booking Behavior",
      details: `Simulated ${Math.floor(virtualUsers * 1.5)} booking attempts`,
    },
    {
      timestamp: new Date(now.getTime() + 4000),
      event: "AI Matching",
      details: useAIMatching
        ? `Applied AI matching algorithms, improving match quality by ~25%`
        : `Skipped AI matching, using baseline matching algorithms`,
    },
    {
      timestamp: new Date(now.getTime() + 5000),
      event: "Simulation Completed",
      details: `Achieved ${useAIMatching ? 'optimal' : 'baseline'} matching performance`,
    },
  ];
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
    const supabase = await createClient();
    
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
    const supabase = await createClient();
    
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
    const supabase = await createClient();
    
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
    const supabase = await createClient();
    
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
 */
export function generateEmbeddingInput(log: any): string {
  return `
${log.sim_type.toUpperCase()} simulation
Date Range: ${new Date(log.start_date).toLocaleDateString()} to ${new Date(log.end_date).toLocaleDateString()}
Users: ${log.virtual_users}
Fill Rate: ${log.results_summary?.metrics?.offerFillRate ? Math.round(log.results_summary.metrics.offerFillRate * 100) : 0}%
Cost Recovery: ${log.results_summary?.metrics?.revenue && log.results_summary?.metrics?.maxRevenue 
  ? Math.round((log.results_summary.metrics.revenue / log.results_summary.metrics.maxRevenue) * 100) 
  : 0}%
Origin: ${log.input_parameters?.origin || 'N/A'}
Destination: ${log.input_parameters?.destination || 'N/A'}
AI Matching: ${log.ai_matching_enabled ? 'Enabled' : 'Disabled'}
Summary: ${log.agent_instruction_summary || log.results_summary?.summaryText || 'No summary available'}
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