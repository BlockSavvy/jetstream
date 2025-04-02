# Production-Ready Embedding System for JetShare

This document outlines the architecture, setup, and maintenance of the production-ready embedding system for the JetShare platform.

## Architecture Overview

The embedding system consists of several components:

1. **Database Schema**: Tables with vector columns, trigger functions, and search capabilities
2. **Background Worker**: A continuously running process that updates embeddings for new and modified records
3. **Vector Search API**: Endpoints that use vector similarity to find relevant information
4. **Archiving System**: Automatic management of historical data to optimize storage and performance

The system prioritizes:

- Active JetShare offers first (highest priority)
- Recent offers over older ones
- Minimal latency for user-facing operations
- Efficient storage and processing of historical data

## Setup Instructions

### 1. Database Setup

Run the following commands to set up the database schema:

```bash
# Set up pgvector extension and core vector functions
npm run db:setup-vector

# Set up JetShare-specific embedding functions, triggers, and indexes
npm run db:setup-jetshare-embeddings
```

This will create:

- Vector columns in the necessary tables
- Database triggers to automatically flag records for embedding
- Functions to generate embeddings text
- Indexes for efficient vector search
- Views for active and historical offers

### 2. Initial Embedding Generation

Generate initial embeddings for existing data:

```bash
# Generate embeddings for all tables
npm run embeddings:all

# Or run individually if needed
npm run embeddings:airports
npm run embeddings:flights
npm run embeddings:jets
npm run embeddings:jetshare
```

### 3. Background Worker Setup

#### Development Environment

For development, you can run the worker in continuous mode:

```bash
npm run embeddings:worker:continuous
```

#### Production Deployment Options

For production, you have several options:

##### Option 1: Systemd Service (Recommended for Linux servers)

Create a systemd service file at `/etc/systemd/system/jetshare-embeddings.service`:

```ini
[Unit]
Description=JetShare Embeddings Background Worker
After=network.target

[Service]
Type=simple
User=appuser
WorkingDirectory=/path/to/app
ExecStart=/usr/bin/node /path/to/app/scripts/embedding-worker.js --continuous --interval=600
Restart=on-failure
Environment=NODE_ENV=production
Environment=COHERE_API_KEY=your_key_here
Environment=NEXT_PUBLIC_SUPABASE_URL=your_url_here
Environment=SUPABASE_SERVICE_ROLE_KEY=your_key_here

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable jetshare-embeddings
sudo systemctl start jetshare-embeddings
```

##### Option 2: Docker Container

Create a Dockerfile for the worker:

```Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY .env.production ./.env.local
COPY scripts/embedding-worker.js ./scripts/

CMD ["node", "scripts/embedding-worker.js", "--continuous", "--interval=600"]
```

Build and run the container:

```bash
docker build -t jetshare-embedding-worker .
docker run -d --name embedding-worker --restart unless-stopped jetshare-embedding-worker
```

##### Option 3: Scheduled Task (cron)

For periodic processing without a continuous worker:

```bash
# Add to crontab (run every 10 minutes)
*/10 * * * * cd /path/to/app && /usr/bin/node scripts/embedding-worker.js >> /var/log/jetshare-embeddings.log 2>&1
```

### 4. Vercel Deployment Configuration

If using Vercel for your Next.js application, add the following to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/update-embeddings",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Then create the API endpoint at `app/api/cron/update-embeddings/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function GET(request: Request) {
  // Check for authorization header (important for security)
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Spawn the embedding worker as a child process
  const worker = spawn('node', ['scripts/embedding-worker.js'], {
    detached: true,
    stdio: 'ignore'
  });

  // Detach the process so it can run after the response
  worker.unref();

  return NextResponse.json({ success: true });
}
```

## Monitoring and Maintenance

### Logs and Monitoring

The embedding worker outputs detailed logs that can be used for monitoring:

- Records processed per run
- Processing time and efficiency
- Errors or issues during embedding generation
- Archive operations for historical data

You should set up log collection and alerts for any persistent errors.

### Performance Optimization

For large installations, consider these optimizations:

1. **Scaling the background worker**: Run multiple instances with different table focuses
2. **Database sharding**: For very large JetShare deployments, consider sharding by time or region
3. **Specialized vector database**: For extreme scale, consider migrating to a dedicated vector database like Pinecone

### Data Retention Policy

The system automatically archives embeddings for offers that are:

- Completed or cancelled
- Older than 90 days

Archived records:

- Have their embedding vectors removed to save space
- Are still searchable by text but not by vector similarity
- Can be restored by re-running the embedding generation if needed

You can adjust the archiving threshold in the `archive_old_jetshare_offers` function:

```sql
-- Example: Change to 180 days
SELECT archive_old_jetshare_offers(180);
```

## Security Considerations

The embedding system requires:

1. **Database access**: The worker needs write access to update embeddings
2. **Cohere API key**: Required for generating embeddings
3. **Service role key**: Required for database operations

Always use secure environment variable management for these credentials.

## Troubleshooting

### Common Issues

1. **Missing embeddings**: Run the worker with `--continuous` flag to catch up on backlog
2. **Slow embedding generation**: Check Cohere API rate limits and connection speeds
3. **High database load**: Adjust the worker's batch size and interval settings

### Reset and Rebuild

If you need to completely reset and rebuild the embedding system:

```sql
-- Reset embeddings in database
UPDATE jetshare_offers SET embedding = NULL, needs_embedding = TRUE;
UPDATE airports SET embedding = NULL;
UPDATE flights SET embedding = NULL;
UPDATE jets SET embedding = NULL;
```

Then re-run the embedding generation:

```bash
npm run embeddings:all
```

## Conclusion

This production-ready embedding system provides:

1. Automatic embedding generation for new user content
2. Optimized storage of historical data
3. Prioritization of active offers
4. Scalable architecture for growth

When properly set up and maintained, it ensures that the AI Concierge has accurate, up-to-date knowledge about JetShare offers while maintaining system performance and efficiency.
