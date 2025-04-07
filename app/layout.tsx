import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "sonner"
import Navbar from "@/components/navbar"
import { AuthPersistenceProvider } from "@/components/auth-persistence-provider"
import dynamic from "next/dynamic"

// Import AI Concierge component with dynamic loading to avoid hydration issues
const AIConcierge = dynamic(() => import("@/app/components/voice/AIConcierge"), { ssr: false })

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "JetStream - Private Jets On-Demand",
  description:
    "Redefine luxury travel with JetStream - the Uber of private jets. Seamless fractional jet experiences, personalized flights, effortlessly matched.",
  generator: 'v0dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <AuthPersistenceProvider>
              <Toaster position="top-center" />
              <Navbar />
              <main className="min-h-screen">
                {children}
              </main>
              {/* Global AI Concierge */}
              <AIConcierge />
            </AuthPersistenceProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}