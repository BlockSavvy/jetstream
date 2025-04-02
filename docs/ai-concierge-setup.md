# AI Concierge: Database Knowledge Integration Setup Guide

This guide covers the setup process for the enhanced AI Concierge with database knowledge integration, vector search capabilities, and function calling support.

## Prerequisites

- Supabase project with database access
- Cohere API key for embeddings
- ElevenLabs API key for voice synthesis
- X.AI (Grok) API key for the AI model

## Setup Steps

### 1. Environment Variables

Ensure the following environment variables are set in your `.env.local` file:

```bash
# Database
DATABASE_URL=postgres://postgres:your-password@db.your-project.supabase.co:5432/postgres

# API Keys
COHERE_API_KEY=your-cohere-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
XAI_GROK_API_KEY=your-xai-api-key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Database Setup

Run the vector search database migration to add embedding columns and search functions:

```bash
npm run db:setup-vector
```

This script will:

- Enable the pgvector extension
- Add embedding columns to airports, flights, and jets tables
- Create search functions for vector similarity
- Create indexes for faster searches

### 3. Generate Embeddings

Generate embeddings for your database entries:

```bash
# Generate embeddings for all tables
npm run embeddings:all

# Or generate for specific tables
npm run embeddings:airports
npm run embeddings:flights
npm run embeddings:jets
```

This process will:

1. Fetch entries from the database that don't have embeddings
2. Generate embeddings using Cohere's API
3. Store the embeddings in the database for vector search

### 4. API Routes Configuration

The following API routes should be properly configured:

- `/api/concierge/vector-search`: For vector similarity search
- `/api/concierge/functions/query-database`: For direct database queries
- `/api/concierge/stream`: For streaming AI responses

### 5. Testing the Integration

1. Log in to the application
2. Open the AI Concierge from the chat bubble
3. Ask questions about airports, flights, or jets to test the knowledge integration
4. Try complex queries that should trigger database lookups

## How It Works

### Vector Search

The AI Concierge uses semantic vector search to find relevant information in the database:

1. When a user asks a question, the system analyzes it to determine relevant tables
2. The question is converted into a vector embedding using Cohere
3. The system searches for similar vectors in the database
4. Relevant results are formatted and added to the AI prompt

### Function Calling

For specific data needs, the concierge can directly query the database:

1. The AI determines it needs specific information
2. It calls the `QueryDatabase` function with parameters
3. The function executes a secure query against the database
4. Results are returned to the AI for incorporation into its response

### System Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ User Query  │────▶│ AI Processing│────▶│   Response  │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
          ┌─────────────────────────────┐
          │     Knowledge Integration    │
          └─────────────────────────────┘
                  │             │
      ┌───────────┘             └───────────┐
      ▼                                     ▼
┌─────────────┐                     ┌─────────────┐
│Vector Search│                     │Function Call │
└─────────────┘                     └─────────────┘
      │                                     │
      ▼                                     ▼
┌─────────────┐                     ┌─────────────┐
│   Database  │◀───────────────────▶│   Database  │
└─────────────┘                     └─────────────┘
```

## Common Issues and Troubleshooting

### Embedding Generation Failures

If embedding generation fails:

1. Check your Cohere API key
2. Ensure the database is accessible
3. Verify the table structure matches expected format
4. Check for rate limiting issues

### Vector Search Not Finding Results

If vector search isn't returning expected results:

1. Verify embeddings exist in the database
2. Check vector similarity threshold (default: 0.65)
3. Ensure the query is relevant to the stored data
4. Try regenerating embeddings with improved text

### Function Calls Not Working

If database function calls aren't working:

1. Check that the function definition is being passed correctly
2. Verify database permissions
3. Ensure table and column names are correct
4. Check API route authentication

## Additional Resources

- [Cohere Embedding Documentation](https://docs.cohere.com/reference/embed)
- [X.AI Function Calling Documentation](https://docs.x.ai/docs/guides/function-calling)
- [Supabase pgvector Documentation](https://supabase.com/docs/guides/database/extensions/pgvector)
- [ElevenLabs API Documentation](https://elevenlabs.io/docs)
