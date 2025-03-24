# Pilots & Crew Specialization Feature

This feature branch adds support for specialized crew members and unique onboard experiences to the JetStream platform.

## Overview

The Pilots & Crew Specialization feature allows JetStream users to:

- Browse and filter pilots and crew members with specialized skills
- View detailed profiles of crew members with their specializations and ratings
- Book flights with specialized crew members offering unique experiences
- Submit reviews and ratings for crew members after flights
- Request custom flight experiences with specific crew specializations

## Key Components

1. **Crew Directory (`/crew`)**: A dedicated section to browse and search for specialized crew members.

2. **Crew Profiles (`/crew/[id]`)**: Detailed profile pages for individual crew members, showing their specializations, reviews, and upcoming flights.

3. **Custom Flight Requests (`/crew/request`)**: A form for requesting custom flight experiences with specific crew specializations.

4. **Enhanced Flights Marketplace**: Updated to show specialized events and crew information in flight listings.

5. **Extended Pulse Questionnaire**: Now collects preferences for onboard experiences and crew specializations.

## Database Changes

This feature adds the following database tables:

- `pilots_crews`: Stores crew member profiles, specializations, and ratings
- `crew_reviews`: Stores user reviews and ratings for crew members
- `specialized_flights`: Links flights to crew members and specialized event details
- `custom_itinerary_requests`: Stores user requests for custom flight experiences

It also adds the following columns to existing tables:

- `flights.specialized_event`: Boolean flag indicating if a flight has a specialized event
- `flights.crew_id`: Reference to the crew member assigned to a flight

## Setup

### Database Setup

To set up the database tables and sample data, run:

```bash
node scripts/setup-crew-tables.js
```

This script will:

1. Create the required database tables if they don't exist
2. Add necessary columns to existing tables
3. Create indexes for better performance
4. Set up row-level security policies
5. Insert sample crew members for testing

### Environment Variables

No additional environment variables are required for this feature.

## API Routes

This feature adds the following API routes:

- `GET /api/crew`: Lists crew members with filtering and pagination
- `GET /api/crew/[id]`: Gets detailed information about a specific crew member
- `PATCH /api/crew/[id]`: Updates a crew member's profile
- `POST /api/crew-reviews`: Submits a review for a crew member
- `GET /api/specialized-flights`: Lists specialized flights with filtering
- `POST /api/custom-itineraries`: Submits a request for a custom flight experience

## Integration Points

This feature integrates with:

1. **Flights Marketplace**: Updated to display crew specializations and specialized events.
2. **Pulse Recommendations**: Extended to consider crew specializations in matching.
3. **User Profiles**: Integrates with existing user authentication and profile data.

## Design Decisions

- **UI Consistency**: Uses JetStream's existing design system (shadcn/ui components, Tailwind CSS) for a consistent look and feel.
- **Flexible Specializations**: Crew specializations are stored as an array to support multiple skills per crew member.
- **Rating System**: Simple 5-star rating system with text reviews for easy user feedback.
- **Performance Considerations**: Added indexes on frequently queried columns for better performance.

## Future Improvements

- **Advanced Matching**: Enhanced AI matching for crew specializations based on user preferences.
- **Real-time Notifications**: Add real-time notifications for custom itinerary matches.
- **Specialized Event Creation**: Allow crew members to create and manage their own specialized event offerings.
- **Crew Schedules**: Add a calendar view for crew availability and scheduling.
- **Media Gallery**: Add support for photo and video galleries of past specialized events.

## Contributors

- JetStream Development Team
