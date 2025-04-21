import { ReactNode } from 'react';
import GdyupHeader from './components/GdyupHeader';
import { OnboardingMiddleware } from './components/onboarding/onboarding-middleware';
import './gdyup.css';
import type { Metadata, Viewport } from 'next';
import { ClientLayoutWrapper } from './client-layout-wrapper';

// Define PWA metadata for the GDYUP section
export const metadata: Metadata = {
  title: "GDY UP",
  description: "Peer-to-peer flight splitting and luxury air travel experiences.",
  manifest: "/manifest.json",
  icons: [
    { rel: "apple-touch-icon", url: "/icons/gdyup-icon-192.png" },
    { rel: "icon", url: "/icons/gdyup-icon-512.png" },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GDY UP",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function GdyupLayout({ children }: { children: ReactNode }) {
  return (
    <ClientLayoutWrapper>
      {children}
    </ClientLayoutWrapper>
  );
} 