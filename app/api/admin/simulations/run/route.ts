import { NextResponse } from 'next/server';
import { runSimulation, SimConfig } from '@/lib/simulation';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * API endpoint to run a simulation
 */
export async function POST(request: Request) {
  try {
    // Parse request body to get simulation config
    const body = await request.json();
    
    // Basic validation (more robust validation can be added)
    if (!body.simulationType || !body.startDate || !body.endDate || !body.virtualUsers) {
      return NextResponse.json(
        { error: 'Missing required simulation parameters' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Prepare config, ensuring dates are parsed correctly
    const config: SimConfig = {
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      simulationType: body.simulationType,
      virtualUsers: parseInt(body.virtualUsers, 10),
      useAIMatching: body.useAIMatching === true, // Ensure boolean
      agentInstructionSummary: body.agentInstructionSummary,
      triggeredByUserId: body.triggeredByUserId, // Potentially add user ID from session later
      origin: body.origin,
      destination: body.destination,
    };
    
    // Run the simulation using the library function
    // This will handle storing results using the server client internally
    const result = await runSimulation(config);
    
    // Return the simulation result
    return NextResponse.json({ result }, { headers: corsHeaders });
    
  } catch (error: any) {
    console.error('Error running simulation via API:', error);
    return NextResponse.json(
      { error: 'Failed to run simulation', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
} 