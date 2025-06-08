'use client';

import React from 'react';
import Link from 'next/link';
import { Share, Search, Plane, Bitcoin, Sparkles, CreditCard, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGdyupTheme } from './hooks/useGdyupTheme';
import GdyupClientLayout from './components/GdyupClientLayout';

export default function GdyupPage() {
  return (
    <GdyupClientLayout>
      <PageContent />
    </GdyupClientLayout>
  );
}

function PageContent() {
  const { getThemedTextClasses, getThemedButtonClasses, getThemedBackgroundClasses } = useGdyupTheme();
  
  // Elite native share function
  const handleNativeShare = async (type: 'list' | 'browse') => {
    const shareData = {
      title: 'GDY·UP - Private Jet Cost Sharing',
      text: type === 'list' 
        ? '✈️ I just listed my private jet seats on GDY·UP! Want to split the cost?'
        : '✈️ Check out GDY·UP - find private jet seats at a fraction of charter cost!',
      url: window.location.origin + '/gdyup'
    };

    try {
      // Try native share first
      if (typeof window !== 'undefined' && (window as any).Capacitor) {
        const { Share } = (window as any).Capacitor.Plugins || {};
        if (Share) {
          await Share.share(shareData);
          return;
        }
      }
      
      // Fallback to Web Share API
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Final fallback - copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        // Could show a toast here
      }
    } catch (error) {
      console.log('Share failed:', error);
    }
  };
  
  return (
    <div className="main-content">
      {/* Intro Video Section */}
      <section className="px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden bg-gdyup-bg-elevated border border-gdyup-border mb-8">
            {/* GIF/Video Container */}
            <div className="relative aspect-video">
              {/* Primary: Use your custom GIF */}
              <img 
                src="/videos/gdyup-intro.gif" 
                alt="GDY·UP Private Jet Sharing Demo"
                className="w-full h-full object-cover"
                style={{ imageRendering: 'crisp-edges' }}
              />
              
              {/* Fallback video sources if GIF doesn't load */}
              <video 
                className="w-full h-full object-cover absolute inset-0 opacity-0"
                autoPlay 
                loop 
                muted 
                playsInline
                poster="/videos/gdyup-intro.gif"
                onError={(e) => {
                  // If video fails, ensure GIF is visible
                  const img = e.currentTarget.parentElement?.querySelector('img');
                  if (img) img.style.display = 'block';
                }}
              >
                <source src="/videos/gdyup-intro.mp4" type="video/mp4" />
                <source src="/videos/gdyup-intro.webm" type="video/webm" />
              </video>
              
              {/* Interactive overlay - only show on hover for desktop */}
              <div className="absolute inset-0 bg-black/10 items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 hidden md:flex">
                <div className="bg-gdyup-primary/90 text-gdyup-button-text rounded-full p-3 shadow-xl backdrop-blur-sm">
                  <Play size={20} />
                </div>
              </div>
            </div>
            
            {/* Enhanced Caption */}
            <div className="p-4 text-center bg-gradient-to-t from-gdyup-bg-elevated to-transparent">
              <p className={cn("text-sm font-medium", getThemedTextClasses('secondary'))}>
                ✈️ <span className="text-gdyup-primary">See GDY·UP in action</span> - Private jet cost sharing made simple
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="px-6 py-12 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-4">
            <div className="gdyup-title mb-2">
              GDY UP & SPLIT
            </div>
            <div className={getThemedTextClasses()}>Private Jet Costs</div>
          </h1>
          <p className={cn("text-xl sm:text-2xl mb-8 max-w-2xl mx-auto", getThemedTextClasses('secondary'))}>
            List empty seats, connect with verified travelers, and recover up to 70% of your flight expenses.
          </p>
          
          {/* Two-sided marketplace CTAs */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="elite-card p-6 border-l-4 border-gdyup-primary">
              <h2 className={cn("text-2xl font-bold mb-3", getThemedTextClasses())}>
                Have a booked private flight?
              </h2>
              <p className={cn("text-lg mb-4", getThemedTextClasses('secondary'))}>
                List your empty seats and recover up to 70% of your expenses
              </p>
              <div className="flex gap-3">
                <Link href="/gdyup/list" className="flex-1">
                  <button className="btn-primary-elite w-full flex items-center justify-center gap-2">
                    <Share size={20} />
                    List Your Seats
                  </button>
                </Link>
                <button 
                  onClick={() => handleNativeShare('list')}
                  className="btn-secondary-elite px-4 flex items-center justify-center"
                  aria-label="Share listing option"
                >
                  <Share size={18} />
                </button>
              </div>
            </div>
            
            <div className="elite-card p-6 border-l-4 border-gdyup-primary">
              <h2 className={cn("text-2xl font-bold mb-3", getThemedTextClasses())}>
                Looking for private jet seats?
              </h2>
              <p className={cn("text-lg mb-4", getThemedTextClasses('secondary'))}>
                Browse available flights at a fraction of the charter cost
              </p>
              <div className="flex gap-3">
                <Link href="/gdyup/browse" className="flex-1">
                  <button className="btn-primary-elite w-full flex items-center justify-center gap-2">
                    <Search size={20} />
                    Browse Flights
                  </button>
                </Link>
                <button 
                  onClick={() => handleNativeShare('browse')}
                  className="btn-secondary-elite px-4 flex items-center justify-center"
                  aria-label="Share browse option"
                >
                  <Share size={18} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Payment options badge */}
          <div className="flex items-center justify-center gap-4 text-base">
            <span className={getThemedTextClasses()}>Accepts:</span>
            <div className="flex items-center gap-2">
              <CreditCard size={20} className="text-gdyup-text-subtle" />
              <span className="font-medium">Cards</span>
            </div>
            <div className="flex items-center gap-2">
              <Bitcoin size={20} className="text-gdyup-primary" />
              <span className="font-medium">Bitcoin</span>
            </div>
            <span>&</span>
            <span className="font-medium">Crypto</span>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="gdyup-title text-3xl md:text-4xl font-bold mb-4">
            Ultra-Simple P2P Jet Sharing
          </h2>
          <p className={cn("text-xl max-w-2xl mx-auto", getThemedTextClasses('secondary'))}>
            Already booked a private jet? Share empty seats and recoup your costs instantly.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {/* Steps */}
          <div className="elite-card p-6 text-center">
            <div className="w-16 h-16 bg-gdyup-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Plane size={28} className="text-gdyup-button-text" />
            </div>
            <h3 className={cn("text-xl font-bold mb-3", getThemedTextClasses())}>
              List Your Flight
            </h3>
            <p className={cn("text-base", getThemedTextClasses('secondary'))}>
              Select available seats in 30 seconds. Set your price and watch your flight expenses drop.
            </p>
          </div>
          
          <div className="elite-card p-6 text-center">
            <div className="w-16 h-16 bg-gdyup-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Sparkles size={28} className="text-gdyup-button-text" />
            </div>
            <h3 className={cn("text-xl font-bold mb-3", getThemedTextClasses())}>
              AI Concierge
            </h3>
            <p className={cn("text-base", getThemedTextClasses('secondary'))}>
              Our AI concierge finds perfect matches for your flight and handles all arrangements seamlessly.
            </p>
          </div>
          
          <div className="elite-card p-6 text-center">
            <div className="w-16 h-16 bg-gdyup-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Bitcoin size={28} className="text-gdyup-button-text" />
            </div>
            <h3 className={cn("text-xl font-bold mb-3", getThemedTextClasses())}>
              Get Paid Directly
            </h3>
            <p className={cn("text-base", getThemedTextClasses('secondary'))}>
              Receive payments directly via credit card, Bitcoin or other crypto. We only take a 7.5% fee.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
} 