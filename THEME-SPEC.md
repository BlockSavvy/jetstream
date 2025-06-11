# GDY·UP Theme Specification

This document outlines the theming system used in the GDY·UP application, including color palettes, component variants, and usage guidelines.

## Theme Overview

GDY·UP supports three distinct themes:

1. **Lime** (default) - A vibrant lime/yellow theme with black backgrounds
2. **Luxury Black** - A premium black theme with neon green accents
3. **Bitcoin Orange** - A Bitcoin-inspired theme with Satoshi gold and dark backgrounds

## Base Color Tokens

### Lime Theme (Default)
```css
--gdyup-primary: #DAFF0D;        /* Lime */
--gdyup-secondary: #FF4B47;      /* Red accent */
--gdyup-bg-dark: #000000;        /* Black background */
--gdyup-bg-card: #121212;        /* Dark card background */
--gdyup-text: #FFFFFF;           /* White text */
```

### Luxury Black Theme
```css
--gdyup-primary: #39FF14;        /* Neon Green */
--gdyup-secondary: #FF4500;      /* Flare Orange */
--gdyup-bg-dark: #000000;        /* Jet Black */
--gdyup-bg-card: #1A1A1A;        /* Gunmetal Gray */
--gdyup-text: #E0E0E0;           /* Jet Silver */
```

### Bitcoin Orange Theme
```css
--gdyup-primary: #F2A900;        /* Satoshi Gold */
--gdyup-secondary: #FF6B00;      /* Burnt Orange */
--gdyup-bg-dark: #121212;        /* Midnight Charcoal */
--gdyup-bg-card: #2D2D2D;        /* Block Gray */
--gdyup-text: #FDFDFD;           /* Lightning White */
--gdyup-accent-color: #B87333;   /* Proof Copper */
```

## Usage Guidelines

### Theme Hook

Use the `useGdyupTheme` hook to access theme functionality:

```tsx
import { useGdyupTheme } from '@/app/gdyup/hooks/useGdyupTheme';

function MyComponent() {
  const { 
    theme,                       // Current theme ('default', 'blue', 'pink')
    changeTheme,                 // Function to change theme
    getThemeClasses,             // Function to get theme-specific classes
    getThemedButtonClasses,      // Function for button styling
    getThemedTextClasses,        // Function for text styling
    getThemedBadgeClasses,       // Function for badge styling
    getThemedBackgroundClasses,  // Function for background styling
    getThemeName,                // Function to get human-readable theme name
    isMobile                     // Boolean for responsive design
  } = useGdyupTheme();
  
  // Component implementation
}
```

### Common Helper Functions

#### Buttons

```tsx
// Primary button
<Button className={getThemedButtonClasses('primary')}>
  Primary Button
</Button>

// Secondary button
<Button className={getThemedButtonClasses('secondary')}>
  Secondary Button
</Button>

// Outline button
<Button className={getThemedButtonClasses('outline')}>
  Outline Button
</Button>

// Ghost button
<Button className={getThemedButtonClasses('ghost')}>
  Ghost Button
</Button>

// With size variant
<Button className={getThemedButtonClasses('primary', 'sm')}>
  Small Button
</Button>
```

#### Text

```tsx
// Primary text
<span className={getThemedTextClasses('primary')}>Primary Text</span>

// Secondary text
<span className={getThemedTextClasses('secondary')}>Secondary Text</span>

// Muted text
<span className={getThemedTextClasses('muted')}>Muted Text</span>

// Inverse text (for dark on light or light on dark)
<span className={getThemedTextClasses('inverse')}>Inverse Text</span>

// Success text
<span className={getThemedTextClasses('success')}>Success Text</span>
```

#### Backgrounds

```tsx
// Primary background
<div className={getThemedBackgroundClasses('primary')}>...</div>

// Secondary background
<div className={getThemedBackgroundClasses('secondary')}>...</div>

// Card background
<div className={getThemedBackgroundClasses('card')}>...</div>
```

#### Badges

```tsx
// Primary badge
<Badge className={getThemedBadgeClasses('primary')}>Primary</Badge>

// Secondary badge
<Badge className={getThemedBadgeClasses('secondary')}>Secondary</Badge>

// Outline badge
<Badge className={getThemedBadgeClasses('outline')}>Outline</Badge>

// Success badge
<Badge className={getThemedBadgeClasses('success')}>Success</Badge>

// Warning badge
<Badge className={getThemedBadgeClasses('warning')}>Warning</Badge>
```

### Direct CSS Classes

For simpler cases, you can use CSS classes directly:

```tsx
// Primary color text
<span className="gdyup-primary">Primary Text</span>

// Secondary color text
<span className="gdyup-secondary">Secondary Text</span>

// Background colors
<div className="gdyup-bg-primary">Primary Background</div>

// Card styling
<div className="gdyup-card">Card Content</div>

// Button styling
<button className="gdyup-button">Button</button>
<button className="gdyup-button-outline">Outline Button</button>
```

## Component Guidelines

### Cards & Containers

```tsx
// Using shadcn/ui Card with theming
<Card className={getThemedBackgroundClasses('card')}>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    Footer content
  </CardFooter>
</Card>

// Alternative using direct classes
<div className="gdyup-card">
  <h3 className="gdyup-title">Card Title</h3>
  <p className="gdyup-text">Content goes here</p>
</div>
```

### Forms & Inputs

Form elements automatically receive theming when wrapped in a parent with the theme class:

```tsx
<div className="gdyup-app">
  <form>
    <div className="form-input-group">
      <label className="form-input-label">Email</label>
      <input type="email" />
    </div>
    <button type="submit" className="gdyup-button">Submit</button>
  </form>
</div>
```

## Best Practices

1. **Always use the helper functions** for complex components as they handle all theme variations
2. **Prefer CSS variables** over hardcoded colors
3. **Test all themes** when making UI changes
4. **Update this spec** when adding new themed components or variants

## Implementation Notes

- Theme classes are applied to `document.documentElement` via the `useGdyupTheme` hook
- Theme definitions are in `app/gdyup/gdyup.css`
- The theme hook is in `app/gdyup/hooks/useGdyupTheme.tsx`
- For technical reasons, the internal theme IDs are:
  - 'default' for Lime theme
  - 'blue' for Luxury Black theme
  - 'pink' for Bitcoin Orange theme 