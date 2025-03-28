'use client';

import Link from 'next/link';

export default function JetShareFooter() {
  return (
    <footer className="border-t py-6 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} JetStream JetShare. All rights reserved.
            </p>
          </div>
          
          <nav className="flex space-x-4">
            <Link 
              href="/jetshare" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link 
              href="/jetshare/listings" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Flight Shares
            </Link>
            <Link 
              href="/jetshare/offer" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Create Offer
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
} 