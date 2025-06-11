# GDY·UP Splash Screen Setup for iOS

## Overview
This guide shows how to set up your custom GIF as the app initialization splash screen for the native iOS app.

## Current Setup
✅ **Web/JavaScript Side**: Custom splash screen component shows your GIF for 3 seconds during app initialization
✅ **Capacitor Config**: Configured to not auto-hide splash screen, allowing custom control
✅ **Landing Page**: Video removed from landing page - GIF now only shows during app init

## iOS Native Setup (Required for TestFlight)

### 1. Convert GIF to Static Images for iOS
iOS doesn't support animated GIFs in splash screens natively. You have two options:

#### Option A: Use Key Frame from GIF
Extract a key frame from your GIF to use as the iOS splash screen:

```bash
# Install imagemagick if you don't have it
brew install imagemagick

# Extract first frame from your GIF
convert /path/to/gdyup-intro.gif[0] ios-splash.png

# Resize for different iOS devices
convert ios-splash.png -resize 1242x2208 ios-splash@3x.png
convert ios-splash.png -resize 828x1792 ios-splash@2x.png
convert ios-splash.png -resize 414x896 ios-splash.png
```

#### Option B: Create a Simple Logo Splash
Use your GDY·UP logo on black background for iOS splash screen:

```bash
# Create a black background with logo centered
convert -size 1242x2208 xc:black \
        \( /path/to/gdyup-logo.png -resize 300x300 \) \
        -gravity center -composite ios-splash@3x.png
```

### 2. Add Splash Images to iOS Project

1. **Open iOS project in Xcode:**
   ```bash
   npx cap open ios
   ```

2. **In Xcode, add splash screen images:**
   - Navigate to `App` > `App` > `Assets.xcassets` > `Splash.imageset`
   - Replace the existing images with your new splash images
   - Make sure you have all required sizes:
     - `splash.png` (1x)
     - `splash@2x.png` (2x) 
     - `splash@3x.png` (3x)

3. **Update Launch Screen Storyboard (Optional):**
   - Go to `App` > `App` > `Base.lproj` > `LaunchScreen.storyboard`
   - Ensure it's set to use your splash image
   - Set background color to black (#000000)

### 3. Test the Complete Experience

The full splash experience will be:

1. **iOS Native Splash** (0.5-1 second) - Shows your static image/logo
2. **Web App Loads** (1-2 seconds) - App initializes
3. **Custom GIF Splash** (3 seconds) - Your animated GIF plays
4. **Landing Page** - Normal app experience

### 4. Update App Build

After setting up splash screens:

```bash
# Build the web app
npm run build

# Sync changes to iOS
npx cap sync ios

# Open in Xcode to test
npx cap open ios
```

## Customization Options

### Adjust Splash Duration
In `app/gdyup/components/GdyupClientLayout.tsx`:

```typescript
// Change duration from 3000ms to your preferred time
const timer = setTimeout(() => {
  // ... hide splash
}, 3000); // Adjust this value
```

### Skip Splash on Web
The splash only shows in Capacitor (native) mode. Web users go directly to the landing page.

### Add Loading Text
Uncomment the loading dots in the splash component for additional feedback.

## Troubleshooting

**Splash not showing in iOS:** Check that `launchAutoHide: false` is set in `capacitor.config.ts`

**GIF not loading:** The component includes fallback to app icon if GIF fails to load

**Splash too long/short:** Adjust the timeout in `GdyupClientLayout.tsx`

**Multiple splashes:** Make sure only one splash system is active (either native iOS or custom)

## Production Notes

- The splash screen only shows once per app session (stored in sessionStorage)
- Subsequent page navigations skip the splash
- Perfect for creating that native app initialization feeling
- Gives time for app to fully load before showing content

Your GIF will now provide an immersive app startup experience! 🚀 