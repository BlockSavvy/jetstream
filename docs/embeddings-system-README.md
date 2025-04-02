# JetStream AI Embedding System

This system enables JetStream's AI Concierge to perform intelligent semantic search across flights, airports, jets, and JetShare offers. The embedding system handles the generation, storage, and maintenance of vector embeddings for various entities in the database.

## Overview

The embedding system consists of:

1. **Background Worker**: Processes records needing embeddings
2. **SQL Schema Setup**: Tables, columns, and indexes for vector storage
3. **Dimension Handling**: Solutions for embedding size compatibility
4. **Production Deployment Options**: Various deployment strategies

## Quick Start

### Local Development

Run the embedding worker in one-time mode:

```bash
npx dotenv-cli -e .env.local -- npx tsx scripts/embedding-worker.ts --batch-size=30
```

Run the embedding worker in continuous mode (recommended for development):

```bash
npx dotenv-cli -e .env.local -- npx tsx scripts/embedding-worker.ts --batch-size=30 --continuous --interval=20
```

### Database Setup

Run the following SQL scripts in your Supabase SQL editor:

1. `migrations/vector_search_setup.sql` - Base vector search setup
2. `migrations/jetshare_embeddings_setup.sql` - JetShare-specific setup
3. `scripts/add-embedding-columns.sql` - Add embedding columns to tables

## Architecture

### Embedding Worker (`scripts/embedding-worker.ts`)

The worker:
- Processes records that need embeddings (NULL embedding field)
- Handles multiple tables (jetshare_offers, flights, airports, jets)
- Processes in priority order with configurable batch sizes
- Implements rate limiting for API calls
- Handles different primary key types (UUID for most tables, code for airports)
- Supports both one-time and continuous running modes

### Database Schema

Each entity table (jetshare_offers, flights, airports, jets) has:

1. An `embedding` column using the `vector(1536)` type
2. An `embedding_updated_at` timestamp column
3. Supporting indexes for performance

### Dimension Handling

The system handles dimension mismatches between:
- Cohere API (1024-dimensional embeddings)
- Database requirement (1536-dimensional vectors)

This is solved by zero-padding the embedding vectors.

## Command-Line Options

The embedding worker supports these command-line options:

- `--batch-size=<number>`: Number of records to process in each batch (default: 10)
- `--continuous`: Run in continuous mode (keeps running)
- `--interval=<seconds>`: Seconds between processing cycles in continuous mode (default: 60)
- `--verbose`: Enable verbose logging

## Testing the System

To test the embedding system:

1. Run the seed script to create test data:
   ```bash
   npx tsx scripts/seed-test-jetshare-offers.ts
   ```

2. Run the embedding worker to generate embeddings:
   ```bash
   npx dotenv-cli -e .env.local -- npx tsx scripts/embedding-worker.ts --batch-size=30
   ```

3. Verify embeddings in the database via Supabase dashboard

## Production Deployment Options

Several options for running the worker in production:

1. **VM/Container**: Deploy on a small VM/container running continuously
2. **Scheduled Tasks**: Use external cron services (CRON-JOB.org)
3. **Vercel Cron**: Use Vercel's cron feature (max 300s per run)
4. **GitHub Actions**: Scheduled GitHub Actions to trigger updates

## Troubleshooting

Common issues and solutions:

1. **Missing Embeddings**: Check for NULL values in the embedding column
2. **Dimension Mismatch**: Verify zero-padding is working correctly
3. **Rate Limiting**: Adjust batch size and interval for better API usage
4. **Performance**: Use appropriate indexes on embedding-related columns

## Environment Variables

Required environment variables:

- `COHERE_API_KEY`: Your Cohere API key
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for admin access)

## File Reference

- `scripts/embedding-worker.ts`: Main embedding worker implementation
- `scripts/seed-test-jetshare-offers.ts`: Creates test data for the system
- `scripts/db-inspect.ts`: Utility for inspecting the database schema
- `migrations/vector_search_setup.sql`: Base vector database setup
- `migrations/jetshare_embeddings_setup.sql`: JetShare-specific embeddings setup
- `scripts/add-embedding-columns.sql`: SQL to add embedding columns
- `scripts/create-store-embedding-function.sql`: Helper functions
- `scripts/setup-embeddings-system.sh`: Shell script to set up the system

## Future Enhancements

Planned improvements:

1. **Caching Layer**: Implement caching to reduce API calls
2. **Webhook Support**: Add webhook notifications for embedding updates
3. **Parallel Processing**: Enhance performance with parallel API calls
4. **Monitoring Dashboard**: Add telemetry and monitoring 