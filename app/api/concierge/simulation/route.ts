import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  runSimulation,
  getRecentSimulations,
  getSimulationById,
  getSimulationStatsByType,
  SimType,
  SimConfig,
  SimResult,
  generateEmbeddingInput
} from '@/lib/simulation';

/**
 * API endpoint for AI concierge to access simulation data and run simulations
 * This endpoint will be used by the AI concierge to query simulation data and trigger new simulations
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and has admin access
    const supabase = await createClient();
    
    // Get user session to check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user has admin role (this would be implemented in your user_roles table)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();
    
    if (!roleData || roleData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    const { action, payload } = body;
    
    switch (action) {
      // Run a new simulation
      case 'runSimulation': {
        // Validate simulation config
        const config = payload as SimConfig;
        
        if (!config.startDate || !config.endDate || !config.simulationType || !config.virtualUsers) {
          return NextResponse.json(
            { error: 'Invalid simulation configuration' },
            { status: 400 }
          );
        }
        
        // Ensure dates are parsed correctly
        config.startDate = new Date(config.startDate);
        config.endDate = new Date(config.endDate);
        
        // Set the user ID for attribution
        config.triggeredByUserId = session.user.id;
        
        // Add agent instruction summary if provided
        if (payload.agentInstructionSummary) {
          config.agentInstructionSummary = payload.agentInstructionSummary;
        }
        
        // Create a clean config object with only the properties SimConfig expects
        const cleanConfig: SimConfig = {
          simulationType: config.simulationType,
          startDate: config.startDate,
          endDate: config.endDate,
          virtualUsers: config.virtualUsers,
          useAIMatching: config.useAIMatching,
          agentInstructionSummary: config.agentInstructionSummary,
          triggeredByUserId: config.triggeredByUserId
        };
        
        // Store additional parameters like origin and destination in input_parameters
        const extraParams: Record<string, any> = {};
        if (payload.origin) {
          extraParams.origin = payload.origin;
        }
        if (payload.destination) {
          extraParams.destination = payload.destination;
        }
        
        // Run the simulation
        const result = await runSimulation(cleanConfig);
        
        // Generate embedding input for vector search integration
        const log = {
          sim_type: cleanConfig.simulationType,
          start_date: cleanConfig.startDate,
          end_date: cleanConfig.endDate,
          virtual_users: cleanConfig.virtualUsers,
          ai_matching_enabled: cleanConfig.useAIMatching,
          input_parameters: {...cleanConfig, ...extraParams},
          results_summary: {
            metrics: result.metrics,
            summaryText: result.summaryText
          },
          agent_instruction_summary: result.summaryText
        };
        
        const embeddingInput = generateEmbeddingInput(log);
        
        return NextResponse.json({ 
          success: true, 
          result,
          summary: result.summaryText,
          embeddingInput
        });
      }
      
      // Get recent simulations
      case 'getRecentSimulations': {
        const limit = payload?.limit || 10;
        const simulations = await getRecentSimulations(limit);
        
        return NextResponse.json({ success: true, simulations });
      }
      
      // Get simulation by ID
      case 'getSimulationById': {
        const { id } = payload;
        
        if (!id) {
          return NextResponse.json(
            { error: 'Simulation ID is required' },
            { status: 400 }
          );
        }
        
        const simulation = await getSimulationById(id);
        
        if (!simulation) {
          return NextResponse.json(
            { error: 'Simulation not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({ success: true, simulation });
      }
      
      // Get simulation stats by type
      case 'getSimulationStatsByType': {
        const { simType } = payload;
        
        if (!simType) {
          return NextResponse.json(
            { error: 'Simulation type is required' },
            { status: 400 }
          );
        }
        
        const stats = await getSimulationStatsByType(simType as SimType);
        
        return NextResponse.json({ success: true, stats });
      }
      
      // Get simulation stats for all types
      case 'getAllSimulationStats': {
        const jetshareStats = await getSimulationStatsByType('jetshare');
        const pulseStats = await getSimulationStatsByType('pulse');
        const marketplaceStats = await getSimulationStatsByType('marketplace');
        
        return NextResponse.json({
          success: true,
          stats: {
            jetshare: jetshareStats,
            pulse: pulseStats,
            marketplace: marketplaceStats
          }
        });
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in simulation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET handler for retrieving high-level simulation data
 * This is a limited endpoint that provides only summary data for quick access
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and has admin access
    const supabase = await createClient();
    
    // Get user session to check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user has admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();
    
    if (!roleData || roleData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    // Get simulation stats for all types
    const jetshareStats = await getSimulationStatsByType('jetshare');
    const pulseStats = await getSimulationStatsByType('pulse');
    const marketplaceStats = await getSimulationStatsByType('marketplace');
    
    // Get recent simulations (limited to 5)
    const recentSimulations = await getRecentSimulations(5);
    
    return NextResponse.json({
      success: true,
      stats: {
        jetshare: jetshareStats,
        pulse: pulseStats,
        marketplace: marketplaceStats
      },
      recentSimulations
    });
  } catch (error) {
    console.error('Error in simulation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 