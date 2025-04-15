import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "sonner"
import Navbar from "@/components/navbar"
import { AuthPersistenceProvider } from "@/components/auth-persistence-provider"
import { ConciergeProvider } from "@/app/components/concierge-provider"
import { PWAProvider } from "@/components/pwa-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "JetStream - Private Jets On-Demand",
  description:
    "Redefine luxury travel with JetStream - the Uber of private jets. Seamless fractional jet experiences, personalized flights, effortlessly matched.",
  generator: 'v0dev',
  manifest: '/manifest.json',
  themeColor: '#CEFF00',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GDY UP',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'mobile-web-app-capable': 'yes',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/gdyup-icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <AuthPersistenceProvider>
              <PWAProvider>
                <Toaster position="top-center" />
                <Navbar />
                <main className="min-h-screen">
                  {children}
                </main>
                {/* Global AI Concierge */}
                <ConciergeProvider />
              </PWAProvider>
            </AuthPersistenceProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}