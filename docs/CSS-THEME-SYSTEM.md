# GDY·UP Theme System Documentation

## Overview
The GDY·UP app implements a comprehensive, centralized theming system that enables consistent styling across the application with dynamic theme switching capabilities. The system uses CSS variables, data attributes, and React hooks to provide a flexible and maintainable approach to theming.

## Core Files

### Primary CSS Files
| File | Purpose |
|------|---------|
| `app/globals.css` | Contains global CSS variables, theme definitions, and core utility classes. Base styles for all themes are defined here. |
| `app/gdyup/gdyup.css` | GDY·UP-specific global styles and theme overrides. |
| `app/gdyup/index.css` | Additional index styles for the GDY·UP section. |
| `app/gdyup/components/gdyup-forms.css` | Form-specific styling with theme support. |
| `app/gdyup/pwa-fixes.css` | CSS fixes for PWA (Progressive Web App) compatibility. |
| `app/gdyup/components/themed-icons.css` | Theme-specific styling for icons. |
| `tailwind.config.js` | Tailwind configuration that includes theme-related color extensions. |

### React Components for Theme Management
| File | Purpose |
|------|---------|
| `app/gdyup/hooks/useGdyupTheme.tsx` | React hook that provides theme context, helper functions, and utilities for component-level theming. |
| `app/gdyup/components/ThemeManager.tsx` | Manages theme state, persistence, and application to the document. |
| `app/gdyup/components/core/ThemedIcon.tsx` | Standardized icon component that respects the current theme. |
| `app/gdyup/components/GdyupThemeSwitcher.tsx` | UI component for switching between themes. |

### Documentation and Tracking
| File | Purpose |
|------|---------|
| `app/gdyup/components/CSSUPDATES.md` | Tracks progress of theme standardization and component updates. |
| `app/gdyup/utils/theme-debug.tsx` | Utilities for debugging theme-related issues. |
| `app/gdyup/utils/hydration-utils.tsx` | Utilities for safely handling theme hydration. |

## Theme Structure

### Theme Variables
Themes are defined using CSS variables in `globals.css`:

```css
/* Base theme */
:root, [data-gdyup-theme="default"] {
  --gdyup-primary: #DAFF0D;
  --gdyup-primary-rgb: 218, 255, 13;
  --gdyup-secondary: #ef4444;
  --gdyup-text: #f9fafb;
  --gdyup-text-medium: #d1d5db;
  --gdyup-text-subtle: #9ca3af;
  --gdyup-bg-dark: #0f172a;
  --gdyup-bg-card: #1a1f2e;
  --gdyup-border: #374151;
  --gdyup-button-text: #000000;
  /* ... other variables */
}

/* Luxury theme */
[data-gdyup-theme="luxury"] {
  --gdyup-primary: #39FF14;
  /* ... other variables with luxury-specific values */
}

/* Bitcoin theme */
[data-gdyup-theme="bitcoin"] {
  --gdyup-primary: #F7931A;
  /* ... other variables with bitcoin-specific values */
}
```

### CSS Loading Order
CSS files are imported in the following order in the `client-layout-wrapper.tsx`:

```tsx
// Import all CSS files to ensure proper styling is available
import './gdyup.css';
import './index.css';
import './components/gdyup-forms.css';
import './pwa-fixes.css';
import './components/themed-icons.css';
```

This ensures that more specific styles override the general ones.

### Theme Application
Themes are applied using data attributes:

- Default: `<html data-gdyup-theme="default">`
- Luxury: `<html data-gdyup-theme="luxury">`
- Bitcoin: `<html data-gdyup-theme="bitcoin">`

## Theme Hook API

The `useGdyupTheme` hook is the primary interface for components to interact with the theme system:

```typescript
const { 
  theme,                      // Current theme name: 'default', 'luxury', 'bitcoin'
  changeTheme,                // Function to change themes
  getThemedTextClasses,       // Function to get text classes for current theme
  getThemedBackgroundClasses, // Function to get background classes for current theme
  getThemedButtonClasses,     // Function to get button classes for current theme
  isMobile,                   // Boolean indicating mobile viewport
} = useGdyupTheme();
```

### Helper Functions

| Function | Purpose | Parameters | Example Usage |
|----------|---------|------------|--------------|
| `getThemedTextClasses` | Returns text styling classes | `type?: 'default' \| 'muted' \| 'inverse'` | `className={getThemedTextClasses('muted')}` |
| `getThemedBackgroundClasses` | Returns background styling classes | `type?: 'primary' \| 'card' \| 'dark'` | `className={getThemedBackgroundClasses('card')}` |
| `getThemedButtonClasses` | Returns button styling classes | `type?: 'primary' \| 'secondary' \| 'outline'` | `className={getThemedButtonClasses('primary')}` |

## Component Integration

### Basic Component Example

```tsx
import { useGdyupTheme } from '@/app/gdyup/hooks/useGdyupTheme';
import { cn } from '@/lib/utils';

export function MyComponent() {
  const { getThemedTextClasses, getThemedBackgroundClasses } = useGdyupTheme();
  
  return (
    <div className={cn(
      "p-4 rounded-lg border",
      getThemedBackgroundClasses('card'),
      "border-gdyup-border"
    )}>
      <h2 className={getThemedTextClasses()}>Title</h2>
      <p className={getThemedTextClasses('muted')}>Description content</p>
    </div>
  );
}
```

### Themed Icon Example

```tsx
import { ThemedIcon } from '@/app/gdyup/components/core/ThemedIcon';
import { MessageSquare } from 'lucide-react';

export function IconExample() {
  return (
    <ThemedIcon 
      icon={MessageSquare} 
      size={24} 
      className="mr-2" 
    />
  );
}
```

## Specialized Components

### Component Variants

| Component | Description | Location |
|-----------|-------------|----------|
| `ThemedDateTimePicker` | Date/time picker with theme awareness | `app/gdyup/components/ThemedDateTimePicker.tsx` |
| `FormThemedDateTimePicker` | Form-specific date/time picker | `app/gdyup/components/FormThemedDateTimePicker.tsx` |
| `ThemedSlider` | Theme-aware slider component | Custom component for interactive sliders |

## Usage with Tailwind CSS

The theming system is designed to work seamlessly with Tailwind CSS:

```html
<div className="bg-gdyup-bg-dark text-gdyup-text border-gdyup-border p-4">
  Themed content using CSS variables directly in Tailwind classes
</div>
```

### Tailwind Configuration

The `tailwind.config.js` file extends Tailwind's theme with GDY·UP specific colors:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        'gdyup-primary': 'var(--gdyup-primary)',
        'gdyup-bg-dark': 'var(--gdyup-bg-dark)',
        'gdyup-text': 'var(--gdyup-text)',
        // ... other color extensions
      }
    }
  }
}
```

## Best Practices

1. **Always use helper functions** for theme-aware styling:
   ```tsx
   // Good
   <div className={getThemedBackgroundClasses('card')}>
   
   // Avoid direct class application
   <div className="bg-gdyup-bg-card">
   ```

2. **Combine with utility function `cn`** for class merging:
   ```tsx
   <div className={cn(
     "px-4 py-2 rounded", // Base styles
     getThemedBackgroundClasses('primary'), // Theme styles
     isActive && "ring-2" // Conditional styles
   )}>
   ```

3. **Use ThemedIcon component** instead of direct Lucide icons to ensure proper theming.

4. **Access theme name** when different logic is needed per theme:
   ```tsx
   if (theme === 'bitcoin') {
     // Bitcoin-specific logic
   }
   ```

5. **Use centralized theme-aware components** like `ThemedDateTimePicker` rather than creating custom implementations.

## Client Layout Integration

The `app/gdyup/client-layout-wrapper.tsx` file is crucial for theme system integration:

```tsx
export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  // ...
  
  return (
    <GdyupThemeProvider>
      <ThemeManager>
        <main>
          {children}
        </main>
      </ThemeManager>
    </GdyupThemeProvider>
  );
}
```

This ensures that all children components have access to the theme context and styling.

## Theme Debugging

For theme debugging, use the `ThemeTest` component during development:

```tsx
import { ThemeTest } from '@/app/gdyup/components/ThemeTest';

// Add this anywhere in your component tree during development
<ThemeTest />
```

## Migration from Class-Based to Data Attribute Themes

The system has been migrated from class-based themes (e.g., `.gdyup-theme-default`) to data attributes (`[data-gdyup-theme="default"]`). This approach provides better specificity control and more maintainable CSS.

For reference on the migration progress, see `app/gdyup/components/CSSUPDATES.md`. 