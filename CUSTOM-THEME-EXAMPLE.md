# Creating a Custom Theme for GDY·UP

This document provides a step-by-step guide for adding a new custom theme to the GDY·UP application, using our established theme system.

## Example: "Cyberpunk" Theme

In this example, we'll create a new "Cyberpunk" theme with neon purple accents on a dark background.

### Step 1: Define Your Theme Colors

First, determine your color palette:

- **Primary**: #B935FF (Neon Purple)
- **Secondary**: #00F6FF (Cyan)
- **Background**: #0C0C14 (Deep Dark Blue)
- **Card Background**: #181829 (Dark Blue-Grey)
- **Text**: #FFFFFF (White)

### Step 2: Add CSS Variables to gdyup.css

Add a new theme class in `app/gdyup/gdyup.css`:

```css
/* Cyberpunk Theme (purple) - Add this after the existing themes */
.gdyup-theme-purple {
  --gdyup-primary: #B935FF; /* Neon Purple */
  --gdyup-primary-hover: #C651FF;
  --gdyup-primary-rgb: 185, 53, 255;
  --gdyup-secondary: #00F6FF; /* Cyan */
  --gdyup-secondary-rgb: 0, 246, 255;
  --gdyup-bg-dark: #0C0C14; /* Deep Dark Blue */
  --gdyup-bg-card: #181829; /* Dark Blue-Grey */
  --gdyup-border: #2A2A40;
  --gdyup-text: #FFFFFF; /* White */
  --gdyup-text-medium: #E0E0E0;
  --gdyup-text-subtle: #A0A0A0;
  --gdyup-button-text: #000000; /* Text on primary button */

  /* Button styles */
  --gdyup-button-bg: var(--gdyup-primary);
  --gdyup-button-hover-bg: var(--gdyup-primary-hover);
  --gdyup-button-active-bg: #9B29DF; /* Darker purple for active */
  
  /* Additional theme-specific variables */
  --gdyup-icon-shadow: rgba(var(--gdyup-primary-rgb), 0.4);
  --gdyup-concierge-bg: var(--gdyup-primary);
  --gdyup-concierge-text: var(--gdyup-button-text);
  --gdyup-nav-active-bg: var(--gdyup-primary);
  --gdyup-nav-active-text: var(--gdyup-button-text);
  --gdyup-nav-hover-border: rgba(var(--gdyup-primary-rgb), 0.6);
  
  /* Cyberpunk-specific variables - optional unique features */
  --gdyup-grid-overlay: url('/cyberpunk-grid.png');
  --gdyup-text-glow: 0 0 5px rgba(var(--gdyup-primary-rgb), 0.7);
}

/* Optional: Add special effects for your theme */
.gdyup-theme-purple .gdyup-card,
.gdyup-theme-purple [class*="Card"],
.gdyup-theme-purple .bg-card {
  background-image: var(--gdyup-grid-overlay);
  background-size: cover;
  background-blend-mode: overlay;
  border: 1px solid rgba(var(--gdyup-primary-rgb), 0.3);
}

.gdyup-theme-purple .gdyup-title {
  text-shadow: var(--gdyup-text-glow);
}
```

### Step 3: Update the useGdyupTheme Hook

Modify `app/gdyup/hooks/useGdyupTheme.tsx` to add your new theme:

1. Update the `GdyupTheme` type:

```tsx
export type GdyupTheme = 'default' | 'blue' | 'pink' | 'purple';
```

2. Update the initial loading logic:

```tsx
useEffect(() => {
  try {
    const savedTheme = localStorage.getItem('gdyup-theme') as GdyupTheme;
    if (savedTheme && ['default', 'blue', 'pink', 'purple'].includes(savedTheme)) {
      setTheme(savedTheme);
      document.documentElement.classList.remove(
        'gdyup-theme-default', 
        'gdyup-theme-blue', 
        'gdyup-theme-pink',
        'gdyup-theme-purple'
      );
      document.documentElement.classList.add(`gdyup-theme-${savedTheme}`);
    }
  } catch (e) {
    console.error('Error loading theme from localStorage:', e);
  }
}, []);
```

3. Update the `changeTheme` function similarly:

```tsx
const changeTheme = useCallback((newTheme: GdyupTheme) => {
  setTheme(newTheme);
  try {
    localStorage.setItem('gdyup-theme', newTheme);
    document.documentElement.classList.remove(
      'gdyup-theme-default', 
      'gdyup-theme-blue', 
      'gdyup-theme-pink',
      'gdyup-theme-purple'
    );
    document.documentElement.classList.add(`gdyup-theme-${newTheme}`);
    // Add a temporary class to force CSS refresh in some browsers
    document.documentElement.classList.add('gdyup-theme-transition');
    document.documentElement.classList.add('gdyup-theme-refresh');
    setTimeout(() => {
      document.documentElement.classList.remove('gdyup-theme-refresh');
    }, 10);
  } catch (e) {
    console.error('Error saving theme to localStorage:', e);
  }
}, []);
```

4. Update the `getThemeName` function:

```tsx
const getThemeName = useCallback(() => {
  switch (theme) {
    case 'blue': return 'Luxury Black';
    case 'pink': return 'Bitcoin Orange';
    case 'purple': return 'Cyberpunk';
    default: return 'Lime';
  }
}, [theme]);
```

### Step 4: Create a Theme Switcher Button

If you have a theme switcher component, update it to include the new theme:

```tsx
function ThemeSwitcher() {
  const { theme, changeTheme } = useGdyupTheme();
  
  return (
    <div className="flex gap-2">
      <button 
        onClick={() => changeTheme('default')}
        className={`w-6 h-6 rounded-full ${theme === 'default' ? 'ring-2 ring-white' : ''}`}
        style={{ background: '#DAFF0D' }}
        aria-label="Lime theme"
      />
      <button 
        onClick={() => changeTheme('blue')}
        className={`w-6 h-6 rounded-full ${theme === 'blue' ? 'ring-2 ring-white' : ''}`}
        style={{ background: '#39FF14' }}
        aria-label="Luxury Black theme"
      />
      <button 
        onClick={() => changeTheme('pink')}
        className={`w-6 h-6 rounded-full ${theme === 'pink' ? 'ring-2 ring-white' : ''}`}
        style={{ background: '#F2A900' }}
        aria-label="Bitcoin Orange theme"
      />
      <button 
        onClick={() => changeTheme('purple')}
        className={`w-6 h-6 rounded-full ${theme === 'purple' ? 'ring-2 ring-white' : ''}`}
        style={{ background: '#B935FF' }}
        aria-label="Cyberpunk theme"
      />
    </div>
  );
}
```

### Step 5: Update Theme Button in gdyup-forms.css

Add your theme button to the theme switcher in `app/gdyup/components/gdyup-forms.css`:

```css
.gdyup-theme-purple-button {
  background: #B935FF; /* Cyberpunk Purple */
}
```

### Step 6: Add to Design Tokens

Update `theme-tokens.json` to include your new theme:

```json
{
  "themes": [
    // ... existing themes
    {
      "id": "purple",
      "name": "Cyberpunk",
      "colors": {
        "primary": {
          "base": "#B935FF",
          "hover": "#C651FF",
          "active": "#9B29DF",
          "rgb": "185, 53, 255"
        },
        "secondary": {
          "base": "#00F6FF",
          "hover": "#33F8FF",
          "active": "#00D6DD",
          "rgb": "0, 246, 255"
        },
        "background": {
          "dark": "#0C0C14",
          "card": "#181829",
          "border": "#2A2A40"
        },
        "text": {
          "primary": "#FFFFFF",
          "medium": "#E0E0E0",
          "subtle": "#A0A0A0",
          "onPrimary": "#000000"
        },
        "status": {
          "success": "#00F0A0",
          "warning": "#FFD700",
          "error": "#FF3D6C",
          "info": "#00A3FF"
        }
      },
      "special": {
        "gridOverlay": "url('/cyberpunk-grid.png')",
        "textGlow": "0 0 5px rgba(185, 53, 255, 0.7)"
      }
    }
  ]
}
```

### Step 7: Update Theme Documentation

Add your theme to `THEME-SPEC.md`:

```markdown
### Cyberpunk Theme
- Primary: #B935FF (Neon Purple)
- Secondary: #00F6FF (Cyan)
- Background: #0C0C14 (Deep Dark Blue)
- Card Background: #181829 (Dark Blue-Grey)
- Text: #FFFFFF (White)
- Special: Grid overlay background, text glow effects
```

### Step 8: Testing Your Theme

1. Verify your theme appears correctly in the theme switcher
2. Check all components with the new theme:
   - Buttons (primary, secondary, outline)
   - Cards and containers
   - Text elements
   - Forms and inputs
   - Navigation elements
3. Test on different screen sizes
4. Verify contrast ratios for accessibility

## Technical Implementation Details

### Using Theme Variables in Custom Components

When creating new components that need to be theme-aware:

```tsx
import { useGdyupTheme } from '@/app/gdyup/hooks/useGdyupTheme';

function MyCustomComponent() {
  const { getThemedButtonClasses, getThemedTextClasses } = useGdyupTheme();
  
  return (
    <div className="gdyup-card">
      <h3 className="gdyup-title">My Component</h3>
      <p className={getThemedTextClasses('muted')}>
        This component is theme-aware!
      </p>
      <button className={getThemedButtonClasses('primary')}>
        Themed Button
      </button>
    </div>
  );
}
```

### CSS-only Theme Support

For CSS-only components that don't use the React hook:

```css
/* Base styles for all themes */
.my-component {
  background-color: var(--gdyup-bg-card);
  color: var(--gdyup-text);
  border: 1px solid var(--gdyup-border);
}

/* Theme-specific overrides if needed */
.gdyup-theme-purple .my-component {
  box-shadow: 0 0 20px rgba(var(--gdyup-primary-rgb), 0.3);
}
```

## Best Practices for Theme Creation

1. **Color Contrast**: Ensure text has sufficient contrast against backgrounds
2. **Consistency**: Keep the same visual hierarchy and spacing
3. **Testing**: Test all UI components with your new theme
4. **Documentation**: Update all documentation to include your theme
5. **Accessibility**: Verify your theme meets WCAG guidelines for color contrast 