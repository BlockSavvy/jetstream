# JetStream Aircraft Images Guide

This guide explains how to work with the aircraft images that have been added to the `/public/images/jets` directory.

## Available Images

We have images for a variety of aircraft models in the following manufacturer directories:

- Gulfstream (G650, G550, G450, G280)
- Bombardier (Global 7500, Global 6000, Challenger 350, Learjet 75)
- Cessna (Citation X, Citation Longitude, Citation Latitude)
- Dassault (Falcon 7X, Falcon 8X, Falcon 2000)
- Embraer (Phenom 300, Praetor 600, Legacy 500)
- Hawker (Hawker 4000)
- HondaJet (HondaJet Elite)
- Pilatus (PC-24)
- Beechcraft (King Air 350i)

## Database Implementation

### Updating the Database with Proper Images

To update the existing jet records in the database to use these images:

1. Run the update script:
   ```bash
   node db/update-jet-images.js
   ```

2. This script will:
   - Fetch all jet records from the database
   - For each jet, find the matching manufacturer and model in our mapping
   - Update the `images` field with the correct paths to the aircraft images

### Schema Details

Each jet record in the database includes an `images` array field that stores paths to these images:

```sql
images TEXT[],
```

## Frontend Usage

### Utility Functions

We've created utility functions in `lib/utils/jet-images.ts` to make it easy to work with these images in the frontend:

1. **getJetImagePaths** - Get all image paths for a specific jet model:
   ```tsx
   import { getJetImagePaths } from '@/lib/utils/jet-images';
   
   const imagePaths = getJetImagePaths('Gulfstream', 'G650');
   // Returns: ['/images/jets/gulfstream/g650.jpg', '/images/jets/gulfstream/g650-1.jpg']
   ```

2. **getPrimaryJetImage** - Get just the primary image for a jet model:
   ```tsx
   import { getPrimaryJetImage } from '@/lib/utils/jet-images';
   
   const primaryImage = getPrimaryJetImage('Gulfstream', 'G650');
   // Returns: '/images/jets/gulfstream/g650.jpg'
   ```

3. **getJetImage** - Get an image using a jet object (useful with database records):
   ```tsx
   import { getJetImage } from '@/lib/utils/jet-images';
   
   const jet = {
     manufacturer: 'Gulfstream',
     model: 'G650',
     images: ['/path/to/image.jpg'] // Might come from database
   };
   
   const jetImage = getJetImage(jet);
   // Will use jet.images[0] if available, otherwise find the correct path
   ```

### Using Images in Components

Here's an example of using these utilities in a component:

```tsx
import Image from 'next/image';
import { getJetImage } from '@/lib/utils/jet-images';

export function JetCard({ jet }) {
  const imageUrl = getJetImage(jet);
  
  return (
    <div className="jet-card">
      <div className="relative h-48 w-full">
        <Image 
          src={imageUrl} 
          alt={`${jet.manufacturer} ${jet.model}`} 
          fill 
          className="object-cover" 
        />
      </div>
      <h3>{jet.manufacturer} {jet.model}</h3>
    </div>
  );
}
```

## Image Naming Conventions

The image files follow these naming conventions:

- Primary image: `ModelName.jpg` (e.g., `g650.jpg`)
- Additional angles: `ModelName-1.jpg`, `ModelName-2.jpg`, etc.

## Adding New Aircraft Images

To add images for new aircraft models:

1. Add the images to the appropriate manufacturer directory in `/public/images/jets/`
2. Update the mapping in `lib/utils/jet-images.ts` to include the new model
3. Run the database update script if needed: `node db/update-jet-images.js`

## Fallback Images

If an image for a specific model isn't available, the system will:

1. First try to use a default image for that manufacturer
2. If no manufacturer default exists, use the global default (Gulfstream G650) 