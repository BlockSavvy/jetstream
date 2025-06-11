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
      {/* Optimized Hero Section - Reduced spacing */}
      <section className="px-4 py-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-3">
            <div className="gdyup-title mb-1">
              GDY UP & SPLIT
            </div>
            <div className={getThemedTextClasses()}>Private Jet Costs</div>
          </h1>
          <p className={cn("text-lg sm:text-xl mb-6 max-w-2xl mx-auto", getThemedTextClasses('secondary'))}>
            List empty seats, connect with verified travelers, and recover up to 70% of your flight expenses.
          </p>
          
          {/* Optimized Two-sided marketplace CTAs - Reduced gaps */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="elite-card p-4 border-l-4 border-gdyup-primary">
              <h2 className={cn("text-xl font-bold mb-2", getThemedTextClasses())}>
                Have a booked private flight?
              </h2>
              <p className={cn("text-base mb-3", getThemedTextClasses('secondary'))}>
                List your empty seats and recover up to 70% of your expenses
              </p>
              <div className="flex gap-3">
                <Link href="/gdyup/list" className="flex-1">
                  <button className="btn-primary-elite w-full flex items-center justify-center gap-2 h-12">
                    <Share size={18} className="flex-shrink-0" />
                    <span>List Your Seats</span>
                  </button>
                </Link>
                <button 
                  onClick={() => handleNativeShare('list')}
                  className="btn-secondary-elite px-4 flex items-center justify-center h-12 w-12 flex-shrink-0"
                  aria-label="Share listing option"
                >
                  <Share size={16} />
                </button>
              </div>
            </div>
            
            <div className="elite-card p-4 border-l-4 border-gdyup-primary">
              <h2 className={cn("text-xl font-bold mb-2", getThemedTextClasses())}>
                Looking for private jet seats?
              </h2>
              <p className={cn("text-base mb-3", getThemedTextClasses('secondary'))}>
                Browse available flights at a fraction of the charter cost
              </p>
              <div className="flex gap-3">
                <Link href="/gdyup/browse" className="flex-1">
                  <button className="btn-primary-elite w-full flex items-center justify-center gap-2 h-12">
                    <Search size={18} className="flex-shrink-0" />
                    <span>Browse Flights</span>
                  </button>
                </Link>
                <button 
                  onClick={() => handleNativeShare('browse')}
                  className="btn-secondary-elite px-4 flex items-center justify-center h-12 w-12 flex-shrink-0"
                  aria-label="Share browse option"
                >
                  <Share size={16} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Enhanced Payment options - Better icon visibility */}
          <div className="flex items-center justify-center gap-3 text-sm flex-wrap">
            <span className={cn("font-medium", getThemedTextClasses())}>Accepts:</span>
            <div className="flex items-center gap-1.5">
              <CreditCard size={18} className={cn("flex-shrink-0", getThemedTextClasses())} />
              <span className="font-medium">Cards</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bitcoin size={18} className="text-gdyup-primary flex-shrink-0" />
              <span className="font-medium">Bitcoin</span>
            </div>
            <span>&</span>
            <span className="font-medium">Crypto</span>
          </div>
        </div>
      </section>
      
      {/* Optimized How It Works Section - Better spacing and icon visibility */}
      <section className="px-4 py-10">
        <div className="text-center mb-8">
          <h2 className="gdyup-title text-2xl md:text-3xl font-bold mb-3">
            Ultra-Simple P2P Jet Sharing
          </h2>
          <p className={cn("text-lg max-w-2xl mx-auto", getThemedTextClasses('secondary'))}>
            Already booked a private jet? Share empty seats and recoup your costs instantly.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Step 1 - Enhanced icon visibility */}
          <div className="elite-card p-5 text-center">
            <div className="w-14 h-14 bg-gdyup-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Plane 
                size={24} 
                className="text-gdyup-button-text flex-shrink-0" 
                strokeWidth={2.5}
              />
            </div>
            <h3 className={cn("text-lg font-bold mb-2", getThemedTextClasses())}>
              List Your Flight
            </h3>
            <p className={cn("text-sm leading-relaxed", getThemedTextClasses('secondary'))}>
              Select available seats in 30 seconds. Set your price and watch your flight expenses drop.
            </p>
          </div>
          
          {/* Step 2 - Enhanced icon visibility */}
          <div className="elite-card p-5 text-center">
            <div className="w-14 h-14 bg-gdyup-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Sparkles 
                size={24} 
                className="text-gdyup-button-text flex-shrink-0" 
                strokeWidth={2.5}
              />
            </div>
            <h3 className={cn("text-lg font-bold mb-2", getThemedTextClasses())}>
              AI Concierge
            </h3>
            <p className={cn("text-sm leading-relaxed", getThemedTextClasses('secondary'))}>
              Our AI concierge finds perfect matches for your flight and handles all arrangements seamlessly.
            </p>
          </div>
          
          {/* Step 3 - Enhanced icon visibility */}
          <div className="elite-card p-5 text-center">
            <div className="w-14 h-14 bg-gdyup-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Bitcoin 
                size={24} 
                className="text-gdyup-button-text flex-shrink-0" 
                strokeWidth={2.5}
              />
            </div>
            <h3 className={cn("text-lg font-bold mb-2", getThemedTextClasses())}>
              Get Paid Directly
            </h3>
            <p className={cn("text-sm leading-relaxed", getThemedTextClasses('secondary'))}>
              Receive payments directly via credit card, Bitcoin or other crypto. We only take a 7.5% fee.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
} 