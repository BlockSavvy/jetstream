import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { fontSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/lib/auth-provider";
import ConditionalNavbar from "@/components/conditional-navbar";
import { ConciergeProvider } from "./components/concierge-provider";
import { AuthPersistenceProvider } from "@/components/auth-persistence-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "JetStream | GDY UP",
  description: "Manage your private aviation needs seamlessly with GDY UP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <AuthProvider>
          <AuthPersistenceProvider>
            <div className="relative flex min-h-screen flex-col">
              <ConditionalNavbar />
              <div className="flex-1">{children}</div>
            </div>
            <Toaster />
            <ConciergeProvider />
          </AuthPersistenceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}