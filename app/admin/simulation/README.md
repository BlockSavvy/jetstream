# JetStream Simulation Engine

The JetStream Simulation Engine allows administrators to run synthetic simulations of user activity, flight offers, and demand patterns in the JetStream ecosystem. The simulation results are stored in a database and can be queried by the AI concierge for analysis and recommendations.

## Database Schema

The simulation data is stored in the `simulation_logs` table with the following structure:

```sql
CREATE TABLE simulation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sim_type sim_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  virtual_users INTEGER NOT NULL,
  ai_matching_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  input_parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  results_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  agent_instruction_summary TEXT,
  triggered_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Alternative Schema (Text Field with Check Constraint)

An alternative schema using a text field with check constraint instead of an enum:

```sql
CREATE TABLE simulation_logs (
  id uuid primary key default gen_random_uuid(),
  sim_type text check (sim_type in ('jetshare', 'pulse', 'marketplace')) not null,
  start_date date not null,
  end_date date not null,
  virtual_users integer not null,
  ai_matching_enabled boolean default false,
  input_parameters jsonb,
  results_summary jsonb,
  agent_instruction_summary text,
  triggered_by_user_id uuid references auth.users(id),
  created_at timestamptz default now()
);
```

## Core Components

### 1. Database Integration

- **SQL Migration**: `app/admin/simulation/migrations/create_simulation_logs_table.sql` contains the SQL migration for creating the `simulation_logs` table.
- **Types**: TypeScript interfaces for simulation data are defined in `lib/simulation.ts`.

### 2. Simulation Engine

- **Core Logic**: `lib/simulation.ts` contains the core simulation logic, including functions for running simulations and storing results.
- **UI**: `app/admin/simulation/page.tsx` provides a web interface for administrators to run simulations and view results.

### 3. AI Concierge Integration

- **API Endpoint**: `app/api/concierge/simulation/route.ts` provides a REST API for the AI concierge to query simulation data and trigger new simulations.
- **Utility Functions**: `lib/ai/simulation-agent-utils.ts` contains helper functions for the AI concierge to interact with simulations.

## Embeddings Compatibility

The simulation results are stored in a format that is compatible with embeddings systems like Cohere and Pinecone. The `results_summary` field includes a `summaryText` property that provides a natural language summary of the simulation results, which can be embedded and retrieved by the AI concierge.

### Embedding Format

For embedding a simulation log, we use this standardized format:

```
JETSHARE simulation
Date Range: 2023-05-01 to 2023-05-07
Users: 100
Fill Rate: 75%
Cost Recovery: 85%
Origin: NYC
Destination: MIA
AI Matching: Enabled
Summary: JetShare simulation for 100 users from NYC to Miami over 7 days achieved a 75% fill rate and recovered 85% of costs with AI matching enabled.
```

This format ensures consistency across all vector embeddings and enables high-quality semantic search results.

## Agent Control Hooks

The AI concierge can interact with the simulation engine through the following functions:

- `agentRunSimulation(simulationType, virtualUsers, useAIMatching, daysToSimulate, origin, destination, agentInstructionSummary)`: Run a simulation with the specified parameters.
- `agentGetRecentSimulations(limit)`: Get recent simulation results.
- `agentGetSimulationStatsByType(simType)`: Get aggregated statistics for a specific simulation type.
- `agentGetAllSimulationStats()`: Get statistics for all simulation types.
- `agentSimulateJetShareFill(virtualUsers, daysToSimulate, useAIMatching, origin, destination, summary)`: Shorthand for running a JetShare-specific simulation.
- `agentGetJetShareProjections(daysToProject)`: Get revenue and fill rate projections for JetShare based on historical simulation data.

### Direct Simulation Function

For direct programmatic access, you can use the `runSimulationFromAgent` function:

```javascript
const { result, summary } = await runSimulationFromAgent({
  simulationType: 'jetshare',
  virtualUsers: 100,
  useAIMatching: true,
  startDate: new Date(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  origin: 'NYC',
  destination: 'MIA'
}, userId);
```

## Usage Examples

### Running a Simulation from the UI

1. Navigate to `/admin/simulation`
2. Configure the simulation parameters:
   - Start Date: The beginning of the simulation period
   - End Date: The end of the simulation period
   - Simulation Type: Select "JetShare", "Pulse", or "Marketplace"
   - Virtual Users: Number of synthetic users to simulate (10-1000)
   - AI Matching: Enable or disable AI-powered matching algorithms
3. Click "Run Simulation" to start the simulation
4. View the results in the charts and tables

### Running a Simulation from the AI Concierge

The AI concierge can run a simulation by calling the `agentRunSimulation` function:

```javascript
// Example of the AI concierge running a simulation
const result = await agentRunSimulation(
  'jetshare',
  100,
  true,
  7,
  'NYC',
  'MIA',
  'Simulating JetShare fill rates for next week from NYC to Miami'
);

// The AI can then analyze the results
console.log(`Simulation completed with fill rate: ${result.result.metrics.offerFillRate * 100}%`);
console.log(`Summary: ${result.summary}`);

// The embedding input is also available for vector storage
console.log(`Embedding input: ${result.embeddingInput}`);
```

### Getting Projections from the AI Concierge

The AI concierge can get projections for JetShare performance:

```javascript
// Example of the AI concierge getting JetShare projections
const projections = await agentGetJetShareProjections(30);

// The AI can then provide recommendations based on projections
console.log(`JetShare Projections: ${projections.projections.summary}`);
```

## Integration with Vector Embeddings

To integrate with vector embeddings:

1. Generate the embedding input using `generateEmbeddingInput(log)`
2. Pass the result to your embedding provider (Cohere, OpenAI, etc.)
3. Store the embedding vector along with metadata in Pinecone or pgvector

Example:

```javascript
// Generate embedding input
const embeddingInput = generateEmbeddingInput(simulationLog);

// Get embedding from Cohere
const embeddingResponse = await cohere.embed({
  texts: [embeddingInput],
  model: 'embed-english-v3.0'
});

// Store in Pinecone
await pinecone.upsert({
  index: 'jetstream-simulations',
  vectors: [{
    id: simulationLog.id,
    values: embeddingResponse.embeddings[0],
    metadata: {
      sim_type: simulationLog.sim_type,
      user_id: simulationLog.triggered_by_user_id,
      created_at: simulationLog.created_at,
      summary: simulationLog.agent_instruction_summary
    }
  }]
});
```

## Security

- All simulation operations require admin role authentication.
- Row Level Security (RLS) policies restrict access to simulation data to authorized users only.
- The AI concierge's actions are logged and attributed to the user who triggered them.

## Future Enhancements

- **Real-time Simulation**: Enable WebSocket streaming of simulation progress for longer simulations.
- **Scenario Testing**: Allow administrators to define specific scenarios to test, such as high demand periods or emergency situations.
- **AI-Generated Simulations**: Enable the AI concierge to automatically generate simulation scenarios based on current business needs.
- **Comparative Analysis**: Implement tools for comparing multiple simulation results side by side.
- **Batch Simulation Processing**: Add support for running multiple simulations in batch for trend analysis.
- **Advanced Vector Search**: Implement semantic search over simulation results using the embedding data.
