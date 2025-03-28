# Crew & Captain Image Conventions

JetStream uses a consistent naming convention for crew member and captain profile images to ensure proper display across the application. This document explains how images are managed and displayed.

## Image Location

All crew member and captain images should be stored in the `/public/images/crew/` directory.

## Naming Conventions

### Primary Profile Images

Primary profile images are used for avatars and profile pages. They should follow this format:

```
/images/crew/[name_with_underscores].jpg
```

Examples:

- `/images/crew/captain_reid.jpg`
- `/images/crew/captain_powell.jpg`
- `/images/crew/emma_rodriguez.jpg`

### Secondary Header Images

Secondary images are used for card headers and larger displays. They should follow the same naming convention as the primary image, but with a `_2` suffix:

```
/images/crew/[name_with_underscores]_2.jpg
```

Examples:

- `/images/crew/captain_reid_2.jpg`
- `/images/crew/captain_powell_2.jpg`
- `/images/crew/emma_rodriguez_2.jpg`

## Image Display Logic

The application automatically looks for both image variants:

1. **Primary Image**: Used for avatars, profile pictures, and fallbacks
2. **Secondary Image**: Used for card headers, banner images, and larger displays

If a secondary image (`_2` suffix) is not found, the application will fall back to using the primary image.

## Image Formats

The following image formats are supported:

- JPG/JPEG (preferred)
- PNG
- WebP

The application will try to detect the appropriate extension. However, it's recommended to use consistent extensions for all images.

## Error Handling

If an image fails to load, the application will display a fallback avatar generated from the crew member's name.

## Database Integration

In the database, only the primary image path should be stored in the `profile_image_url` field, without the `_2` suffix. The application will automatically look for the secondary image based on the primary image path.

Example database entry:

```
profile_image_url: '/images/crew/captain_reid.jpg'
```

The application will automatically look for `/images/crew/captain_reid_2.jpg` when needed.

## Best Practices

1. **Consistent Sizing**: Ensure all images are of similar dimensions for consistent UI
2. **High Quality**: Use high-resolution images (at least 600x600px)
3. **Face Framing**: For primary images, ensure the person's face is centered and well-framed
4. **Secondary Image Focus**: For secondary images, consider using wider shots that show more context or a different perspective
5. **Professional Appearance**: Images should reflect the professional nature of the crew members

Following these conventions will ensure a consistent and visually appealing display of crew members across the JetStream platform.
