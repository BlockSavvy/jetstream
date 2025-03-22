# Update Jet Images in Database

This document explains how to use the `update-jet-images.js` script to update aircraft images in the database to use the locally stored aircraft images.

## Background

The seeded database initially uses placeholder Unsplash images for jets. This script will update each jet record to use the proper aircraft images from the `/public/images/jets` directory, organized by manufacturer and model.

## Available Aircraft Images

The following aircraft models have dedicated images:

### Gulfstream

- G650, G550, G450, G280

### Bombardier

- Global 7500, Global 6000, Challenger 350, Learjet 75

### Cessna

- Citation X+, Citation Longitude, Citation Latitude

### Dassault

- Falcon 7X, Falcon 8X, Falcon 2000LXS

### Embraer

- Phenom 300E, Praetor 600, Legacy 500

### Others

- Hawker 4000
- HondaJet Elite
- Pilatus PC-24
- Beechcraft King Air 350i

For any jet model not listed above, a default image will be used from its manufacturer's folder.

## Running the Script

1. Make sure your environment variables for Supabase are correctly set in your `.env` file:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Install required dependencies if you haven't already:

   ```bash
   npm install dotenv @supabase/supabase-js
   ```

3. Run the script from the project root:

   ```bash
   node db/update-jet-images.js
   ```

4. Check the console for output to verify successful updates.

## Extending for New Aircraft Models

To add new aircraft models or manufacturers:

1. Add the appropriate images to the `/public/images/jets` directory, organized by manufacturer.
2. Update the `jetImageMap` object in `update-jet-images.js` to include the new model/manufacturer with paths to their images.

## Image Naming Convention

For consistency, images should follow this naming pattern:

- Primary image: `ModelName.jpg` (e.g., `g650.jpg`)
- Additional images: `ModelName-1.jpg`, `ModelName-2.jpg`, etc.

## Troubleshooting

If you encounter issues:

1. Verify that your Supabase credentials are correct
2. Check that the images exist in the correct paths
3. Review the console output for specific error messages
4. Verify that the model names in the database match exactly with the model names in the `jetImageMap` object
