// Server Component

import React from 'react';
import { GdyupThemeProvider } from './hooks/useGdyupTheme';
import { NostrProvider } from './contexts/NostrContext';
import { ConciergeProvider } from '@/app/components/concierge-provider';
import GdyupHeader from './components/GdyupHeader';
import ThemeManager from './components/ThemeManager';
import { ConciergeButton } from '@/components/concierge-button';

// Import CSS files that should be applied to the entire layout
import './gdyup-mobile-nav-fix.css';
import './index.css';
import './components/gdyup-forms.css';
import './pwa-fixes.css';
import './components/themed-icons.css';

/**
 * Ultra-minimal layout to fix hydration errors.
 * Using a div instead of html to avoid nested HTML elements.
 */

export const metadata = {
  title: 'GDY UP | Private Jet Sharing Platform',
  description: 'Share private jets and reduce your flying costs',
};

/**
 * Main layout for GDY·UP application
 * Fixed to prevent hydration errors and chunk loading issues
 */
export default function GdyupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="gdyup-layout-wrapper">
      {children}
    </div>
  );
} 