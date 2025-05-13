# GDY·UP Theme Customization Guide

This guide allows designers and developers to create custom themes for the GDY·UP mobile app. It provides a standardized format to ensure all themes are consistent and adhere to our design system architecture.

## Designer Checklist

- [ ] Choose a theme concept and define brand narrative
- [ ] Select primary and secondary colors with proper contrast ratios
- [ ] Define background and card surface colors
- [ ] Create text color hierarchy (primary, medium, subtle)
- [ ] Define status colors (success, warning, error, info)
- [ ] Test accessibility - ensure text contrast meets WCAG 2.1 AA standards
- [ ] Verify theme consistency across all component variants
- [ ] Test theme on both light and dark mode backgrounds if applicable
- [ ] Provide Figma color styles or equivalent design tokens
- [ ] Document any special textures, gradients, or visual treatments

## Developer Checklist

- [ ] Implement CSS variables in `app/gdyup/gdyup.css`
- [ ] Update theme classes (`.gdyup-theme-[name]`)
- [ ] Add RGB variants for all colors that need transparency
- [ ] Verify theme is properly applied to all component variants
- [ ] Test transitions between themes
- [ ] Ensure all helper functions in `useGdyupTheme` hook work with new theme
- [ ] Add theme to theme selector component
- [ ] Update theme tokens in design token JSON file

## Theme Identity

**Theme Name:** [REQUIRED] _e.g., "Lime", "Luxury Black", "Bitcoin Orange"_

**Theme ID:** [REQUIRED] _Technical ID for the theme class (e.g., "default", "blue", "pink")_

**Theme Description:** [REQUIRED] _Brief description of the theme's mood/feeling_

**Target Audience:** _Who is this theme designed for? (e.g., "Bitcoin maximalists", "Luxury travelers")_

**Design Inspiration:** _URLs or descriptions of design inspirations_

## Color System

### Primary Colors

**Primary Color:** [REQUIRED]

- Hex: #______
- Hover state: #______
- Active state: #______
- RGB: ___,___, ___

**Secondary Color:** [REQUIRED]

- Hex: #______
- Hover state: #______
- Active state: #______
- RGB: ___,___, ___

**Accent Color (if applicable):**

- Hex: #______
- RGB: ___,___, ___
- Usage notes: _How and where this accent should be used_

### Background Colors

**Background Dark:** [REQUIRED] _Main app background_

- Hex: #______

**Card Background:** [REQUIRED] _Background for card components_

- Hex: #______

**Border Color:** _For dividers and container borders_

- Hex: #______

### Text Colors

**Primary Text:** [REQUIRED]

- Hex: #______

**Medium Text:** _Secondary level text_

- Hex: #______

**Subtle Text:** _Least important text_

- Hex: #______

**Button Text:** _Text color on primary buttons_

- Hex: #______

### Status Colors

**Success:**

- Hex: #______

**Warning:**

- Hex: #______

**Error/Destructive:**

- Hex: #______

**Info:**

- Hex: #______

## Special Features

**Textures/Patterns:** _If this theme uses any textures (like carbon fiber in Luxury Black)_

- URL: ______
- Usage notes: ______

**Gradients:** _If this theme includes any gradients_

- Definition: ______
- Usage: ______

## CSS Implementation Example

```css
/* Theme Name */
.gdyup-theme-[id] {
  --gdyup-primary: #_____;
  --gdyup-primary-hover: #_____;
  --gdyup-primary-rgb: ___, ___, ___;
  --gdyup-secondary: #_____;
  --gdyup-secondary-rgb: ___, ___, ___;
  --gdyup-bg-dark: #_____;
  --gdyup-bg-card: #_____;
  --gdyup-border: #_____;
  --gdyup-text: #_____;
  --gdyup-text-medium: #_____;
  --gdyup-text-subtle: #_____;
  --gdyup-button-text: #_____;
  
  /* Button styles */
  --gdyup-button-bg: var(--gdyup-primary);
  --gdyup-button-hover-bg: var(--gdyup-primary-hover);
  --gdyup-button-active-bg: #_____; /* Darker shade for active */
}
```

## Component Examples

Include screenshots or examples of how key components look with this theme:

- [ ] Primary Button
- [ ] Secondary Button
- [ ] Outline Button
- [ ] Ghost Button
- [ ] Card/Container
- [ ] Badge
- [ ] Typography hierarchy
- [ ] Form controls

## Reference Themes

Our system currently includes three official themes:

### Lime Theme (Default)

- Primary: #DAFF0D (Neon Lime)
- Secondary: #FF4B47 (Red accent)
- Background: #000000 (Black)
- Card Background: #121212 (Dark Gray)
- Text: #FFFFFF (White)

### Luxury Black Theme

- Primary: #39FF14 (Neon Green)
- Secondary: #FF4500 (Flare Orange)
- Background: #000000 (Jet Black)
- Card Background: #1A1A1A (Gunmetal Gray)
- Text: #E0E0E0 (Jet Silver)
- Special: Carbon texture background overlay

### Bitcoin Orange Theme

- Primary: #F2A900 (Satoshi Gold)
- Secondary: #FF6B00 (Burnt Orange)
- Background: #121212 (Midnight Charcoal)
- Card Background: #2D2D2D (Block Gray)
- Text: #FDFDFD (Lightning White)
- Accent: #B87333 (Proof Copper)

## Submission Guidelines

1. Complete this form with all [REQUIRED] fields
2. Include Figma color styles export or equivalent design tokens
3. Provide any special assets (textures, patterns) in the assets directory
4. Submit as a PR to the JetStream repository
5. Tag the GDY·UP design team for review
