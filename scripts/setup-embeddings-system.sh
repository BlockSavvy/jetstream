#!/bin/bash
# Complete Setup Script for JetShare Embeddings System
# This script sets up the database, installs dependencies, and configures the embedding system

set -e  # Exit on any error

# Print header
echo "======================================================"
echo "JetShare Embeddings System Setup"
echo "======================================================"
echo "This script will set up the complete embeddings system."
echo ""

# Check for required environment variables
REQUIRED_ENVS=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY" "COHERE_API_KEY" "DATABASE_URL")
MISSING_ENVS=()

for ENV in "${REQUIRED_ENVS[@]}"; do
  if [ -z "${!ENV}" ]; then
    MISSING_ENVS+=("$ENV")
  fi
done

if [ ${#MISSING_ENVS[@]} -gt 0 ]; then
  echo "⚠️ Error: The following required environment variables are missing:"
  for ENV in "${MISSING_ENVS[@]}"; do
    echo "  - $ENV"
  done
  echo ""
  echo "Please set these environment variables before running this script."
  echo "You can add them to your .env.local file or export them in your shell."
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --save @supabase/supabase-js
npm install --save cohere-ai
npm install --save-dev tsx
npm install --save-dev minimist
npm install --save dotenv

# Run database migrations
echo "🗄️ Setting up database schema..."
echo "Running vector search setup..."
npm run db:setup-vector

echo "Running JetShare-specific embeddings setup..."
npm run db:setup-jetshare-embeddings

# Generate initial embeddings
echo "🔍 Generating initial embeddings..."
echo "This may take a while depending on the size of your database."

echo "Processing airports..."
npm run embeddings:airports

echo "Processing flights..."
npm run embeddings:flights

echo "Processing jets..."
npm run embeddings:jets

echo "Processing JetShare offers..."
npm run embeddings:jetshare

# Install production worker based on preferred method
echo "👷 Setting up background worker..."
echo "How would you like to run the embedding worker? (Enter the number)"
echo "1) As a systemd service (Linux servers)"
echo "2) As a Docker container"
echo "3) As a cron job"
echo "4) Manual/other method (skip worker setup)"
read -p "Enter choice (1-4): " WORKER_CHOICE

case $WORKER_CHOICE in
  1)
    # systemd service setup
    echo "Setting up systemd service..."
    
    # Create service file
    SERVICE_FILE="jetshare-embeddings.service"
    cat > $SERVICE_FILE << EOF
[Unit]
Description=JetShare Embeddings Background Worker
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$(pwd)
ExecStart=$(which node) $(pwd)/scripts/embedding-worker.js --continuous --interval=600
Restart=on-failure
Environment=NODE_ENV=production
Environment=COHERE_API_KEY=${COHERE_API_KEY}
Environment=NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
Environment=SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

[Install]
WantedBy=multi-user.target
EOF
    
    echo "Building worker script..."
    npx tsc --esModuleInterop scripts/embedding-worker.ts --outDir scripts
    
    echo "Created service file: $SERVICE_FILE"
    echo "To install and start the service:"
    echo "  sudo mv $SERVICE_FILE /etc/systemd/system/"
    echo "  sudo systemctl daemon-reload"
    echo "  sudo systemctl enable jetshare-embeddings"
    echo "  sudo systemctl start jetshare-embeddings"
    ;;
  
  2)
    # Docker setup
    echo "Setting up Docker container..."
    
    # Create Dockerfile
    cat > Dockerfile.embeddings << EOF
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production

ENV NODE_ENV=production
ENV COHERE_API_KEY=${COHERE_API_KEY}
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

COPY scripts/embedding-worker.js ./scripts/

CMD ["node", "scripts/embedding-worker.js", "--continuous", "--interval=600"]
EOF
    
    echo "Building worker script..."
    npx tsc --esModuleInterop scripts/embedding-worker.ts --outDir scripts
    
    echo "Created Dockerfile: Dockerfile.embeddings"
    echo "To build and run the container:"
    echo "  docker build -t jetshare-embedding-worker -f Dockerfile.embeddings ."
    echo "  docker run -d --name embedding-worker --restart unless-stopped jetshare-embedding-worker"
    ;;
  
  3)
    # Cron job setup
    echo "Setting up cron job..."
    
    # Create cron file
    CRON_FILE="embeddings-cron"
    cat > $CRON_FILE << EOF
# JetShare embeddings update - runs every 10 minutes
*/10 * * * * cd $(pwd) && $(which node) scripts/embedding-worker.js >> /tmp/jetshare-embeddings.log 2>&1
EOF
    
    echo "Building worker script..."
    npx tsc --esModuleInterop scripts/embedding-worker.ts --outDir scripts
    
    echo "Created cron file: $CRON_FILE"
    echo "To install the cron job:"
    echo "  crontab -l > current_cron"
    echo "  cat $CRON_FILE >> current_cron"
    echo "  crontab current_cron"
    echo "  rm current_cron"
    ;;
  
  4)
    echo "Skipping worker setup..."
    echo "You can run the worker manually with:"
    echo "  npm run embeddings:worker"
    echo "  npm run embeddings:worker:continuous"
    ;;
  
  *)
    echo "Invalid choice. Skipping worker setup."
    ;;
esac

# Set up Vercel cron job if using Vercel
echo "🌐 Do you want to set up a Vercel cron job for Vercel deployment? (y/n)"
read -p "Enter choice: " VERCEL_CHOICE

if [[ $VERCEL_CHOICE == "y" || $VERCEL_CHOICE == "Y" ]]; then
  echo "Creating Vercel cron job API endpoint..."
  
  # Create directory if it doesn't exist
  mkdir -p app/api/cron/update-embeddings
  
  # Create API endpoint file
  cat > app/api/cron/update-embeddings/route.ts << EOF
import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

// Set a secret key for authorization
const CRON_SECRET = process.env.CRON_SECRET || 'change-this-to-a-secret-key';

export async function GET(request: Request) {
  // Check for authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== \`Bearer \${CRON_SECRET}\`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Execute the embedding worker
    console.log('Executing embedding worker via cron endpoint...');
    
    // Use spawn to execute the worker in a separate process
    const worker = spawn('node', ['scripts/embedding-worker.js'], {
      detached: true,
      stdio: 'ignore'
    });
    
    // Detach the worker so it can run independently
    worker.unref();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Embedding update started',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to start embedding worker:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to start embedding worker' 
    }, { status: 500 });
  }
}
EOF
  
  # Create or update vercel.json if it doesn't exist
  if [ ! -f "vercel.json" ]; then
    cat > vercel.json << EOF
{
  "crons": [
    {
      "path": "/api/cron/update-embeddings",
      "schedule": "*/15 * * * *"
    }
  ]
}
EOF
  else
    # Backup existing vercel.json
    cp vercel.json vercel.json.bak
    
    # Check if vercel.json already has crons section
    if grep -q '"crons"' vercel.json; then
      echo "vercel.json already has a crons section. Please update it manually."
    else
      # Add crons section before the last closing brace
      sed -i '$ i \ \ "crons": [\n    {\n      "path": "/api/cron/update-embeddings",\n      "schedule": "*/15 * * * *"\n    }\n  ],' vercel.json
    fi
  fi
  
  echo "Vercel cron job setup complete!"
  echo "⚠️ Important: Set CRON_SECRET environment variable in your Vercel project!"
fi

# Final notes
echo ""
echo "======================================================"
echo "✅ JetShare Embeddings System Setup Complete!"
echo "======================================================"
echo ""
echo "Next steps:"
echo "1. Complete the background worker installation if needed"
echo "2. Add 'tsx' as a dependency in your package.json if it's not already there"
echo "3. Test the system by asking the AI Concierge about JetShare offers"
echo ""
echo "For more information, see:"
echo "- docs/embeddings-production-setup.md"
echo "- docs/ai-concierge-setup.md"
echo ""
echo "Maintenance commands:"
echo "- npm run embeddings:worker           # Run worker once"
echo "- npm run embeddings:worker:continuous # Run worker continuously"
echo "- npm run embeddings:all              # Regenerate all embeddings"
echo "" 