# JetStream Crew Image Generator

This repository contains scripts to generate and manage profile images for pilots and crew members in the JetStream application.

## Available Scripts

### 1. Unsplash Image Integration (Recommended)

The `update-crew-images.js` script downloads professional portrait images from Unsplash and updates crew profiles in the database:

```bash
npm run update-crew-images
```

This approach is:
- Free and fast
- Reliable (no API rate limits to worry about)
- Uses high-quality, diverse professional headshots

### 2. DALL-E Image Generation (Advanced)

Alternatively, you can use the `generate-crew-images.js` script to generate custom AI images using OpenAI's DALL-E:

```bash
npm run generate
```

Note: This requires an active OpenAI API key with billing enabled and sufficient quota for image generation.

## Prerequisites

- Node.js installed
- Supabase project with pilots_crews table already set up
- For DALL-E option: OpenAI API key with billing enabled

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file based on `.env.sample`:
   ```bash
   cp .env.sample .env
   ```

3. Add your API keys to the `.env` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   OPENAI_API_KEY=sk-...  # Only needed for DALL-E option
   ```

## How It Works

1. The scripts fetch existing crew profiles from your Supabase database
2. For each profile:
   - The Unsplash script downloads a high-quality professional portrait
   - The DALL-E script generates a custom AI image (if API is available)
3. Images are saved locally in `/public/images/crew/`
4. Crew profiles are updated with the local image paths and specializations

## Customization

- For Unsplash: Edit the `crewData` array in `update-crew-images.js` to modify search terms, specializations, etc.
- For DALL-E: Edit the `crewSpecializations` array in `generate-crew-images.js` to customize the AI prompts

## Notes

- This script will update existing crew profiles with new images and data
- Each image generation costs approximately $0.04 USD (DALL-E 3 pricing)
- The script generates 1024x1024px "HD" quality images
- The script handles up to 10 crew profiles by default

## Troubleshooting

- If you get authentication errors, check your Supabase credentials
- For Unsplash image issues, verify your network connection
- For DALL-E failures, check your OpenAI API key and billing status 