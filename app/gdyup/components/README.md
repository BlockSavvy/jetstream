# GDY·UP UI Theming Components

This directory contains custom components and styling solutions to ensure consistent UI presentation across all themes in the GDY·UP application.

## Core Components

### ThemedIcon Component

The `ThemedIcon` component ensures consistent icon presentation across the app, particularly in areas where contrast issues might occur (white icons on light backgrounds, etc).

```tsx
// Import the ThemedIcon component
import { ThemedIcon } from './core';

// Use in your component
<ThemedIcon 
  icon={Plane} 
  size={16} 
  variant="primary" 
/>
```

#### Icon Variants
- `default` - Standard icon color for current theme
- `primary` - Primary brand color
- `secondary` - Secondary color
- `inverse` - High contrast against current background
- `destructive` - For destructive actions (red)
- `success` - For success indicators (green)
- `menu` - Special variant for dropdown menu items

### Dashboard Components

For dashboard content, we've created dedicated wrappers to ensure text and icon visibility:

```tsx
import { 
  DashboardWrapper, 
  DashboardCard, 
  DashboardHeader, 
  DashboardText 
} from './dashboard';

// Use in your component
<DashboardWrapper>
  <DashboardHeader>
    <h2>My Dashboard</h2>
  </DashboardHeader>
  <DashboardCard>
    <DashboardText>Content is properly visible</DashboardText>
  </DashboardCard>
</DashboardWrapper>
```

## CSS Fixes

The `themed-icons.css` file contains global fixes for common UI issues:

1. **Menu Icon Fixes**: Ensures icons in dropdowns and popups remain visible
2. **Dashboard Text**: Forces proper text coloring in dashboard sections
3. **Active Tab State**: Ensures active tabs have proper contrast
4. **Card Content**: Guarantees card content remains readable

## Theming System

The theming system uses CSS variables defined in `gdyup.css` and made available through the `useGdyupTheme()` hook. To ensure proper theming:

1. **Always use theme helpers**: `getThemedTextClasses()`, `getThemedButtonClasses()`, etc.
2. **Wrap complex UIs**: Use the appropriate wrappers like `DashboardWrapper`
3. **Use ThemedIcon**: Replace direct Lucide icons with the `ThemedIcon` component

## Debugging

When trying to identify theming issues:

1. Check the CSS variables in DevTools for the current theme
2. Check if parent containers are applying overrides
3. Look for `!important` rules that might conflict
4. Verify that the component uses `useGdyupTheme()` and its helper functions

### Theme Switching Testing

Test your components across all themes to ensure proper visibility:

- Default (Lime)
- Blue (Luxury Black)
- Pink (Bitcoin Orange)

For complex layouts, consider using the Theme Debugger in development mode. 