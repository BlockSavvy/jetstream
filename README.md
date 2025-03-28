## AI Matching Service

JetStream includes an intelligent AI-driven matching service that helps users find compatible flights and travel companions based on their preferences, travel history, and professional background.

### Setup Instructions

1. **Set up Cohere API**
   - Create an account at [Cohere](https://cohere.com/)
   - Generate an API key
   - Add your API key to `.env.local`:

     ```
     COHERE_API_KEY=your_api_key_here
     ```

2. **Set up Pinecone Vector Database**
   - Create an account at [Pinecone](https://www.pinecone.io/)
   - Create a new project and note your API key
   - Add your Pinecone configuration to `.env.local`:

     ```
     PINECONE_API_KEY=your_api_key_here
     PINECONE_CLOUD=aws
     PINECONE_REGION=us-east-1
     PINECONE_INDEX=jetstream
     ```

   > Note: Free tier Pinecone is only available in `aws/us-east-1` region.

3. **Configure Vercel Environment Variables for Production**
   - In your Vercel project settings, navigate to the "Environment Variables" section
   - Add the following environment variables:

     ```
     PINECONE_API_KEY=your_pinecone_api_key
     PINECONE_CLOUD=aws
     PINECONE_REGION=us-east-1
     PINECONE_INDEX=jetstream
     COHERE_API_KEY=your_cohere_api_key
     ```

   - Save your changes and redeploy your project

4. **Initialize Pinecone Index**
   - Run the initialization script:

     ```bash
     node scripts/initialize-pinecone.js
     ```

   - Follow the prompts to create or reset your index

5. **Add Data to the Vector Database**
   - User profiles and flights need to be added to the vector database to enable matching
   - Use the sync API endpoints:
     - `PUT /api/matching` - Sync a user profile
     - `PUT /api/matching/flights` - Sync a flight
     - `POST /api/matching/flights` - Sync multiple flights

### Usage

1. **Fetch Matching Results**
   - Make a POST request to `/api/matching` with the following parameters:

     ```json
     {
       "userId": "user_id_here",
       "includeFlights": true,
       "includeCompanions": true,
       "destinationPreference": "optional_destination",
       "dateRange": {
         "start": "2023-01-01",
         "end": "2023-12-31"
       },
       "tripPurpose": "business",
       "maxResults": 10
     }
     ```

2. **Integrate the AIMatchingSection Component**
   - Import and use the `AIMatchingSection` component in your pages:

     ```jsx
     import AIMatchingSection from '@/app/flights/components/AIMatchingSection';

     // In your component:
     <AIMatchingSection 
       userId={currentUser.id} 
       destinationPreference="NYC" 
       dateRange={{ start: "2023-01-01", end: "2023-12-31" }}
       tripPurpose="business"
       onFlightSelect={(flight) => handleFlightSelection(flight)}
     />
     ```

### How It Works

The matching service uses Cohere's embeddings to create vector representations of user profiles and flights. These vectors are stored in a Pinecone vector database, which enables fast similarity searches to find the best matches based on a variety of factors:

- **For flights**: Destination preferences, travel dates, amenity preferences, and more
- **For companions**: Professional background, interests, travel history, and preferences

Each match includes a compatibility score and specific reasons why the match was recommended, providing transparency to users.

## Database Setup

We've added comprehensive scripts to set up and restore the JetStream database, fully integrated with JetShare functionality. To initialize the database:

1. Make sure your `.env.local` file contains the Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. Run the master setup script:
   ```bash
   node db/setup-all.js
   ```

   This script will:
   - Test the connection to Supabase
   - Check existing tables
   - Populate JetShare settings
   - Populate ratings and JetShare transactions
   - Verify the final state of the database

For more details about the database structure and available scripts, see the [Database README](db/README.md).

## Database Migrations

If you're facing issues with missing tables or columns, you need to run the migration scripts against your Supabase database:

1. Go to your Supabase dashboard and open the SQL Editor
2. Copy the contents of the migration files:
   - `migrations/profiles.sql` - Enhances the profiles table with missing columns
   - `migrations/travel_preferences.sql` - Creates the travel preferences table
3. Run each script in the SQL Editor
4. Refresh your browser to see the changes take effect

After running these migrations, the following features will work correctly:

- Profile updates (company, position, etc.)
- Travel preferences (interests, social preferences, etc.)
- User settings and privacy controls
