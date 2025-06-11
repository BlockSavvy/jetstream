# GDY·UP Theme Standardization Checklist

> **STATUS UPDATE**: Converting components to use the new theming system with helper functions (`getThemedTextClasses()`, `getThemedButtonClasses()`, `getThemedBackgroundClasses()`, etc.) instead of custom implementations.
>
> **PROGRESS**: 91 of 91 components (100%) completed ✅
>
> **NEW COMPONENTS**: Added standardized FeatureCard system for consistent feature display across the app ✅

## Core Files

- [x] app/gdyup/gdyup.css - Theme variables and definitions
- [x] app/gdyup/hooks/useGdyupTheme.tsx - Theme hook with helper functions

## Theme System Components

- [x] app/gdyup/components/GdyupThemeSwitcher.tsx - Theme switcher component
- [x] app/gdyup/components/ThemeTest.tsx - Test page for theme visualization
- [x] app/gdyup/components/ThemeManager.tsx - Theme management
- [x] app/gdyup/utils/theme-debug.tsx - Theme debugging utilities
- [x] app/gdyup/utils/hydration-utils.tsx - Hydration utilities for theme-safe rendering

## New Standardized Core Components

- [x] app/gdyup/components/core/FeatureCard.tsx - Reusable feature card component
- [x] app/gdyup/components/core/index.ts - Core component exports
- [x] app/gdyup/components/docs/FeatureCardDocs.tsx - Documentation for feature cards
- [x] app/gdyup/component-docs/page.tsx - Component documentation page

## Layout Components

- [x] app/gdyup/client-layout-wrapper.tsx - Updated with new helpers
- [x] app/gdyup/layout.tsx - Updated with new helpers
- [x] app/gdyup/components/GdyupHeader.tsx - Header component
- [x] app/gdyup/components/container.tsx - Container component
- [x] app/gdyup/components/JetShareHeader.tsx - JetShare header

## Dashboard Components

- [x] app/gdyup/components/dashboard/ActivityFeedTab.tsx - Updated with new helpers
- [x] app/gdyup/components/dashboard/BoardingPassesTab.tsx - Updated with new helpers
- [x] app/gdyup/components/dashboard/FlightChatsTab.tsx - Updated with new helpers
- [x] app/gdyup/components/dashboard/MyListingsTab.tsx - Updated with new helpers
- [x] app/gdyup/components/dashboard/MyBookingsTab.tsx - Updated with new helpers
- [x] app/gdyup/components/dashboard/WalletIdentityTab.tsx - Updated with new helpers
- [x] app/gdyup/components/GDYupDashboard.tsx - Dashboard component
- [x] app/gdyup/components/EnhancedGDYupDashboard.tsx - Enhanced dashboard
- [x] app/gdyup/components/JetShareDashboard.tsx - JetShare dashboard

## Authentication Components

- [x] app/gdyup/components/onboarding/login-form.tsx - Updated with new helpers
- [x] app/gdyup/components/onboarding/onboarding-form.tsx - Updated with new helpers
- [x] app/gdyup/components/onboarding/onboarding-middleware.tsx - Updated with new helpers
- [x] app/gdyup/components/onboarding/profile-setup-form.tsx - Updated with new helpers
- [x] app/gdyup/components/JetShareAuthFallback.tsx - Auth fallback
- [x] app/gdyup/components/JetShareAuthWrapper.tsx - Auth wrapper
- [x] app/gdyup/components/ProfileButton.tsx - Profile button

## Core UI Components

- [x] app/gdyup/components/AircraftModelSelector.tsx - Updated with new helpers
- [x] app/gdyup/components/AirportMap.tsx - Updated with new helpers
- [x] app/gdyup/components/BoardingPassButton.tsx - Updated with new helpers
- [x] app/gdyup/components/JetSeatVisualizer.tsx - Updated with new helpers
- [x] app/gdyup/components/EnhancedAirportMap.tsx - Enhanced airport map
- [x] app/gdyup/components/EnhancedBoardingPassButton.tsx - Updated with new helpers
- [x] app/gdyup/components/EnhancedLocationAutocomplete.tsx - Enhanced location autocomplete
- [x] app/gdyup/components/LocationAutocomplete.tsx - Location autocomplete
- [x] app/gdyup/components/LocationAutocompleteClient.tsx - Location autocomplete client
- [x] app/gdyup/components/TicketCheckIn.tsx - Ticket check-in
- [x] app/gdyup/components/ThemedDateTimePicker.tsx - Themed date time picker
- [x] app/gdyup/components/FormThemedDateTimePicker.tsx - Form themed date time picker
- [x] app/gdyup/components/ToastMessageCenter.tsx - Toast message center

## Nostr Components

- [x] app/gdyup/components/NostrIdentityVerifier.tsx - Updated with new helpers
- [x] app/gdyup/components/NostrQrCode.tsx - Updated with new helpers
- [x] app/gdyup/components/NostrZapButton.tsx - Updated with new helpers
- [x] app/gdyup/components/NostrConnectionStatus.tsx - Updated with new helpers
- [x] app/gdyup/components/NostrRelayStatus.tsx - Updated with new helpers
- [x] app/gdyup/components/NostrVerificationBadge.tsx - Updated with new helpers
- [x] app/gdyup/components/NostrCommunityChat.tsx - Updated with new helpers
- [x] app/gdyup/components/NostrOfferActivity.tsx - Nostr offer activity
- [x] app/gdyup/components/FlightNostrGroup.tsx - Flight Nostr group

## Jet/Aircraft Components

- [x] app/gdyup/components/JetSelector.tsx - Jet selector
- [x] app/gdyup/components/MobileJetSelector.tsx - Mobile jet selector
- [x] app/gdyup/components/JetDetailsTabs.tsx - Jet details tabs
- [x] app/gdyup/components/VisualizerWrapper.tsx - Visualizer wrapper

## Payment Components

- [x] app/gdyup/payment/[id]/PaymentContent.tsx - Updated with new helpers
- [x] app/gdyup/components/JetSharePaymentForm.tsx - Updated with new helpers
- [x] app/gdyup/components/PaymentConfirmation.tsx - Payment confirmation
- [x] app/gdyup/components/StripeTestHelper.tsx - Stripe test helper
- [x] app/gdyup/components/TransactionClient.tsx - Transaction client

## Booking Components

- [x] app/gdyup/components/JetShareOfferForm.tsx - Updated with new helpers
- [x] app/gdyup/components/JetShareOfferEditForm.tsx - Updated with new helpers
- [x] app/gdyup/components/JetShareOfferDetail.tsx - Updated with new helpers
- [x] app/gdyup/components/JetShareTicket.tsx - Updated with new helpers
- [x] app/gdyup/components/JetShareListingsContent.tsx - Updated with new helpers
- [x] app/gdyup/components/SeedOffersButton.tsx - Updated with new helpers

## Page Components

- [x] app/gdyup/boardingpass/[id]/page.tsx - Updated with new helpers
- [x] app/gdyup/payment/[id]/page.tsx - Updated with new helpers
- [x] app/gdyup/payment/[id]/loading.tsx - Updated with new helpers
- [x] app/gdyup/page.tsx - Updated with new helpers
- [x] app/gdyup/auth/login/page.tsx - Updated with new helpers
- [x] app/gdyup/auth/signup/page.tsx - Updated with new helpers
- [x] app/gdyup/auth/forgot-password/page.tsx - Updated with new helpers
- [x] app/gdyup/auth/profile-setup/page.tsx - Updated with new helpers
- [x] app/gdyup/auth-test/page.tsx - Updated with new helpers
- [x] app/gdyup/create/page.tsx - Redirect only (no theming needed)
- [x] app/gdyup/dashboard/page.tsx - Updated with new helpers
- [x] app/gdyup/dashboard/offers/[id]/page.tsx - Updated with new helpers
- [x] app/gdyup/profile/page.tsx - Updated with new helpers
- [x] app/gdyup/debug/page.tsx - Debug page
- [x] app/gdyup/examples/page.tsx - Server component using themed client components
- [x] app/gdyup/jets/page.tsx - Server component using themed client components
- [x] app/gdyup/jets/[id]/page.tsx - Server component using themed client components
- [x] app/gdyup/jets/[id]/edit/page.tsx - Server component using themed client components
- [x] app/gdyup/jets/[id]/settings/page.tsx - Server component using themed client components
- [x] app/gdyup/jets/add/page.tsx - Server component using themed client components
- [x] app/gdyup/jets/models/page.tsx - Server component using themed client components
- [x] app/gdyup/jets/new/page.tsx - Server component using themed client components
- [x] app/gdyup/listings/page.tsx - Server component using themed client components
- [x] app/gdyup/messages/page.tsx - Server component using themed client components
- [x] app/gdyup/offer/page.tsx - Server component using themed client components
- [x] app/gdyup/offer/[id]/page.tsx - Server component using themed client components
- [x] app/gdyup/offer/edit/[id]/page.tsx - Server component using themed client components
- [x] app/gdyup/offer/redirect/[id]/page.tsx - Server component using themed client components
- [x] app/gdyup/onboarding/page.tsx - Server component using themed client components
- [x] app/gdyup/payment/dev-btcpay-simulator/page.tsx - Server component using themed client components
- [x] app/gdyup/payment/stripe/page.tsx - Server component using themed client components
- [x] app/gdyup/payment/success/page.tsx - Server component using themed client components
- [x] app/gdyup/themetest/page.tsx - Server component using themed client components
- [x] app/gdyup/tickets/page.tsx - Server component using themed client components
- [x] app/gdyup/transaction/[id]/page.tsx - Server component using themed client components

**Note:** Many of these pages are server components that render already-themed client components. This is the recommended pattern for Next.js App Router, where server components fetch data and client components handle rendering with proper theming.

## Other Components

- [x] app/gdyup/components/ClientRedirect.tsx - Client redirect
- [x] app/gdyup/components/DevModeHelpers.tsx - Dev mode helpers
- [x] app/gdyup/components/JetShareUITest.tsx - UI test component
- [x] app/gdyup/error.tsx - Error component
- [x] app/gdyup/not-found.tsx - Not found component
- [x] app/gdyup/head.tsx - Head component

## Context Providers

- [x] app/gdyup/contexts/NostrContext.tsx - Nostr context
- [x] app/gdyup/hooks/useFlightNostrGroup.tsx - Flight Nostr group hook

## Progress Tracking

- Started: June 2025
- Completed: July 2025
- Finished: 91 of 91 client components (100%)
- All components and hooks now use the standardized theme helper functions

## Component Usage Analysis

The component usage analysis from our script identified several insights that will help prioritize future optimization work:

### Unused Components (15)

These components have no imports or usage detected across the codebase and many are likely leftover from the pre-rebrand when the app was called JetShare:

- app/gdyup/components/AircraftModelSelector.tsx
- app/gdyup/components/DevModeHelpers.tsx
- app/gdyup/components/GDYupDashboard.tsx
- app/gdyup/components/JetShareAuthFallback.tsx
- app/gdyup/components/JetShareAuthWrapper.tsx
- app/gdyup/components/JetShareTicket.tsx
- app/gdyup/components/NostrOfferActivity.tsx
- app/gdyup/components/ProfileButton.tsx
- app/gdyup/components/SeedOffersButton.tsx
- app/gdyup/components/ToastMessageCenter.tsx
- app/gdyup/components/container.tsx
- app/gdyup/components/onboarding/login-form.tsx
- app/gdyup/components/onboarding/onboarding-form.tsx
- app/gdyup/components/onboarding/onboarding-middleware.tsx
- app/gdyup/components/onboarding/profile-setup-form.tsx

**Note:** All of these components have been updated with theming to ensure future compatibility, but should be considered for removal in a cleanup phase.

### Potentially Redundant Components

These component families have multiple variants with overlapping functionality, all now updated with the theming system:

- **AirportMap**: AirportMap.tsx (9 usages), EnhancedAirportMap.tsx (1 usage) ✓
- **BoardingPassButton**: BoardingPassButton.tsx (8 usages), EnhancedBoardingPassButton.tsx (2 usages) ✓
- **GDYupDashboard**: EnhancedGDYupDashboard.tsx (2 usages), GDYupDashboard.tsx (0 usages) ✓
- **LocationAutocomplete**: LocationAutocomplete.tsx (4 usages), EnhancedLocationAutocomplete.tsx (3 usages), LocationAutocompleteClient.tsx (2 usages) ✓
- **JetSelector**: JetSelector.tsx (8 usages), MobileJetSelector.tsx (usages unknown) ✓

**✓ = All variants updated with theming system**

### Most Used Components

All of the most heavily used components have now been updated with the theming system:

1. JetSeatVisualizer.tsx (23 usages) ✓
2. NostrVerificationBadge.tsx (18 usages) ✓
3. NostrZapButton.tsx (12 usages) ✓
4. TransactionClient.tsx (12 usages) ✓
5. AirportMap.tsx (9 usages) ✓
6. ClientRedirect.tsx (9 usages) ✓
7. BoardingPassButton.tsx (8 usages) ✓
8. JetSelector.tsx (8 usages) ✓
9. NostrIdentityVerifier.tsx (8 usages) ✓
10. NostrRelayStatus.tsx (7 usages) ✓

**✓ = Already updated with theming system**

## Next Steps

1. Component consolidation - Merge redundant components like the LocationAutocomplete family
2. Component cleanup - Remove unused components identified in the analysis
3. Documentation - Update theme system documentation for new developers

# GDY·UP CSS Theme Refactoring

This document tracks the progress of refactoring CSS in the GDY·UP app to use the theme system consistently.

## Components Refactored

**✓ = Already updated with theming system**

### Core Components

- ✓ ThemedIcon.tsx
- ✓ useGdyupTheme.tsx (hook)
- ✓ ThemedSlider.tsx (NEW - Theme-aware slider component)
- ✓ OfferPage
- ✓ JetDetailsTabs
- ✓ AircraftModelSelector
- ✓ JetSeatVisualizer - Updated seat selection colors and legend to use theming system

### Forms

- ✓ JetShareOfferForm has been split into smaller subcomponents:
  - ✓ FormNavigation - Reusable navigation buttons for forms
  - ✓ FlightInfoForm - Flight details form section
  - ✓ JetSelectorForm - Aircraft selection form section
  - ✓ SeatSplitForm - Seat configuration with ThemedSlider integration
  - ✓ OfferSummaryForm - Cost details and summary section

### Navigation & Layout

- Header.tsx (Still needs updating)
- MobileMenu.tsx (Still needs updating)
- SideNav.tsx (Still needs updating)

### User Dashboard

- Dashboard.tsx (Still needs updating)
- PaymentConfirmation.tsx (Still needs updating)
- BoardingPass.tsx (Still needs updating)

## CSS Files Refactored

- ✓ gdyup.css - Updated theme names for better consistency:
  - ✓ `gdyup-theme-blue` renamed to `gdyup-theme-luxury`
  - ✓ `gdyup-theme-pink` renamed to `gdyup-theme-bitcoin`
  - ✓ Updated colors in Bitcoin theme from pink to orange
  - ✓ Updated colors in Luxury theme from blue to neon green

## Theme System Improvements

- ✓ Created ThemedSlider component for better UI consistency
- ✓ Fixed theme hook to support the new theme names
- ✓ Unified ThemedIcon usage across components
- ✓ Fixed all hardcoded text-black, text-white with getThemedTextClasses()
- ✓ Replaced hardcoded background colors with getThemedBackgroundClasses()
- ✓ Improved modularity by breaking down monolithic form component

## Further Improvements Needed

- Audit and fix remaining theme issues in:
  - Navigation components
  - Dashboard components
  - PaymentConfirmation and BoardingPass
- Improve theme switching UI in header
- Continue refactoring large components into smaller, more maintainable pieces
- Enhance slider and form control styles for better cross-theme compatibility

## Code Quality Benefits

- Reduced duplication through component extraction
- Improved maintainability with smaller, focused components
- Better theme consistency across the application
- Enhanced modularity for future extensions
