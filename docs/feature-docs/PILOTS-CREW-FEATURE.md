# JetStream Pilots & Crew Specialization Feature

## Overview

The Pilots & Crew Specialization feature transforms JetStream flights from simple transportation into engaging experiences led by specialized pilots and crew members. This feature allows passengers to choose flights based on the unique in-flight experiences offered, such as comedy shows, TED-style talks, podcast recordings, wellness sessions, and more.

## Implementation Status

### ✅ Completed Components

- **Database Schema**:
  - Created tables: `pilots_crews`, `crew_reviews`, `specialized_flights`, `custom_itinerary_requests`
  - Added proper indexes and security policies
  - Created triggers for automatic rating calculations

- **API Routes**:
  - Implemented CRUD endpoints for crew members
  - Added endpoints for reviews, specialized flights, and custom itineraries
  - Set up proper authentication and data validation

- **UI Components**:
  - Built crew directory page (/crew)
  - Created detailed crew profile pages (/crew/[id])
  - Added custom flight request form (/crew/request)
  - Integrated crew filters in flights marketplace

- **Data Integration**:
  - Added seed data for crew members, reviews, and specialized flights
  - Connected crew data to flight listings

### 📊 Feature Impact

The Pilots & Crew Specialization feature significantly enhances JetStream by:

1. Providing unique, memorable in-flight experiences
2. Creating a new dimension of value for passengers
3. Allowing crew members to build personal brands and followings
4. Enabling new monetization opportunities through premium experiences

## Getting Started

### Setting Up the Database

To set up the database tables and seed data, run:

```bash
node scripts/setup-crew-data.js
```

This script will:

1. Create all required tables for the Pilots & Crew feature
2. Set up proper Row Level Security policies
3. Add test data including crew members, reviews, and specialized flights

### Key API Endpoints

- **GET /api/crew** - List crew members with filtering options
- **GET /api/crew/:id** - Get detailed information about a crew member
- **POST /api/crew-reviews** - Submit a review for a crew member
- **GET /api/specialized-flights** - List flights with specialized experiences
- **POST /api/custom-itineraries** - Request a custom flight experience

### Feature Pages

- **/crew** - Browse all specialized pilots and crew members
- **/crew/[id]** - View detailed profile for a specific crew member
- **/crew/request** - Request a custom flight with specific crew specializations
- Enhanced **Flights Marketplace** with crew specialization filters

## Integration Points

The Pilots & Crew Specialization feature integrates with several existing JetStream features:

1. **Flight Marketplace** - Flights now display crew information and specializations
2. **Pulse Questionnaire** - Users can now indicate preferred crew specializations
3. **User Profiles** - Users can save preferred crew specializations in their profiles

## Future Enhancements

Potential enhancements for future iterations:

1. **Crew Dashboard** - Allow crew members to manage their profiles and specialized flights
2. **Social Sharing** - Enable sharing of crew profiles and specialized flights
3. **Advanced Matching** - Enhance AI matching to include crew specialization preferences
4. **Premium Pricing** - Implement tiered pricing based on crew popularity and specializations

## Technical Details

### Database Schema

The feature uses the following tables:

- **pilots_crews** - Core information about crew members
- **crew_reviews** - User reviews and ratings for crew members
- **specialized_flights** - Flights featuring specialized experiences
- **custom_itinerary_requests** - User requests for custom flight experiences

### Technology Stack

- Next.js for frontend components and API routes
- Supabase for database and authentication
- Tailwind CSS and shadcn/ui for styling
- TypeScript for type safety

## Troubleshooting

If you encounter issues:

1. **API Errors** - Check the console for specific error messages
2. **Missing Data** - Ensure the setup script has been run successfully
3. **Display Issues** - Clear browser cache and reload the application
