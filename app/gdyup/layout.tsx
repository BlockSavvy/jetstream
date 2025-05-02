import { ReactNode } from 'react';
import { ClientLayoutWrapper } from './client-layout-wrapper';
import './gdyup.css';
import './index.css';
import './components/gdyup-forms.css';
import './pwa-fixes.css';
import type { Metadata, Viewport } from 'next';

// Define PWA metadata for the GDYUP section
export const metadata: Metadata = {
  title: 'GDY UP | Private Jet Sharing Platform',
  description: 'Share private jets and reduce your flying costs',
  manifest: "/manifest.json",
  icons: [
    { rel: "apple-touch-icon", url: "/icons/gdyup-icon-192.png" },
    { rel: "apple-touch-icon", sizes: "152x152", url: "/icons/gdyup-icon-192.png" },
    { rel: "apple-touch-icon", sizes: "180x180", url: "/icons/gdyup-icon-192.png" },
    { rel: "apple-touch-icon", sizes: "167x167", url: "/icons/gdyup-icon-192.png" },
    { rel: "icon", url: "/icons/gdyup-icon-512.png" },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GDY UP",
  }
};

// Simplified viewport settings to ensure proper navigation
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function GdyupLayout({ children }: { children: ReactNode }) {
  return (
    <ClientLayoutWrapper>
      <div className="gdyup-app">
        {children}
      </div>
    </ClientLayoutWrapper>
  );
} 