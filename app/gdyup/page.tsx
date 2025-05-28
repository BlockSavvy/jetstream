'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Share, Search, Plane, Bitcoin, Sparkles, CreditCard, ArrowRight, MessageSquare, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClientContentWrapper } from './components/ClientContentWrapper';
import { useGdyupTheme } from './hooks/useGdyupTheme';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';

export default function GdyupPage() {
  return (
    <ClientContentWrapper showHeader={false}>
      <PageContent />
    </ClientContentWrapper>
  );
}

// Animation variants for consistent motion effects
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

function SectionHeader({ title, subtitle }: { title: string, subtitle: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px 0px" });
  
  const { getThemedTextClasses } = useGdyupTheme();
  
  return (
    <motion.div 
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeInUp}
      className="text-center mb-12"
    >
      <h2 className="text-3xl md:text-4xl font-bold mb-3 text-gdyup-primary drop-shadow-[0_0_10px_rgba(var(--gdyup-primary-rgb),0.3)]">
        {title}
      </h2>
      <p className={cn("text-xl max-w-2xl mx-auto", getThemedTextClasses())}>
        {subtitle}
      </p>
    </motion.div>
  );
}

function PageContent() {
  const { getThemedTextClasses, getThemedButtonClasses, getThemedBackgroundClasses, theme } = useGdyupTheme();
  
  // Refs for scroll into view animations
  const heroRef = useRef(null);
  const howItWorksRef = useRef(null);
  const bookingsRef = useRef(null);
  const featuresRef = useRef(null);
  const downloadRef = useRef(null);

  // InView hooks for animation triggers  
  const heroInView = useInView(heroRef, { once: true });
  const howItWorksInView = useInView(howItWorksRef, { once: true, margin: "-100px 0px" });
  const bookingsInView = useInView(bookingsRef, { once: true, margin: "-100px 0px" });
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px 0px" });
  const downloadInView = useInView(downloadRef, { once: true, margin: "-100px 0px" });
  
  // Removes browser bounce effect when deployed in Capacitor
  useEffect(() => {
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.overscrollBehavior = 'none';
    
    return () => {
      document.documentElement.style.overscrollBehavior = '';
      document.body.style.overscrollBehavior = '';
    };
  }, []);
  
  return (
    <div className="flex flex-col overflow-x-hidden">
      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        initial="hidden"
        animate={heroInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="min-h-[90vh] flex flex-col justify-center py-8 md:py-16 bg-gdyup-bg-dark"
      >
        <div className="container mx-auto px-5 md:px-6 text-center">
          <motion.div 
            variants={fadeInUp} 
            className="max-w-3xl mx-auto"
          >
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-2"
            >
              <div className="text-gdyup-primary drop-shadow-[0_0_10px_rgba(var(--gdyup-primary-rgb),0.3)]">
                SPLIT A PRIVATE JET
              </div>
              <div className="text-gdyup-text">EARN BACK 70%</div>
            </motion.h1>
            <motion.p 
              variants={fadeInUp}
              className="text-xl sm:text-xl md:text-2xl text-gdyup-text mb-6 max-w-2xl mx-auto"
            >
              List empty seats, connect with verified travelers, and recover up to 70% of your flight expenses.
            </motion.p>
            
            {/* Device mockup with app preview */}
            <motion.div 
              variants={fadeInUp}
              className="relative max-w-xs mx-auto mt-10 mb-12"
            >
              <div className="relative mx-auto border-[12px] border-black dark:border-gray-800 rounded-[2.5rem] h-[600px] w-[300px] shadow-xl overflow-hidden">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-5 bg-black dark:bg-gray-800 rounded-b-lg"></div>
                <Image 
                  src="/gdyup1MOCK.png" 
                  alt="GDY·UP Mobile App"
                  width={300}
                  height={600}
                  className="absolute inset-0 w-full h-full object-cover rounded-lg"
                  priority
                />
                
                {/* Animated concierge chat bubble */}
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="absolute bottom-24 right-4 bg-gdyup-primary text-black p-3 rounded-xl rounded-br-none max-w-[65%] shadow-lg"
                >
                  <p className="text-xs font-medium">Need help finding the perfect jet for your group?</p>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Two-sided marketplace CTAs */}
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-4 mb-8 max-w-md mx-auto"
            >
              <motion.div 
                variants={fadeInUp}
                className={cn(
                  getThemedBackgroundClasses('card'),
                  "shadow-lg rounded-xl p-5 border-l-4 border-gdyup-primary"
                )}
              >
                <h2 className="text-xl font-bold text-gdyup-text mb-2">Have a booked private flight?</h2>
                <p className="text-base text-gdyup-text-medium mb-3">List your empty seats and recover up to 70% of your expenses</p>
                <Button asChild size="lg" className={cn(
                  getThemedButtonClasses('primary'),
                  "w-full text-base border-0 px-5 py-5 h-auto font-bold shadow-lg"
                )}>
                  <Link href="/gdyup/list" className="flex items-center justify-center">
                    <Share className="w-5 h-5 mr-2" />
                    List Your Seats
                  </Link>
                </Button>
              </motion.div>
              
              <motion.div 
                variants={fadeInUp}
                className={cn(
                  getThemedBackgroundClasses('card'),
                  "shadow-lg rounded-xl p-5 border-l-4 border-gdyup-primary"
                )}
              >
                <h2 className="text-xl font-bold text-gdyup-text mb-2">Looking for private jet seats?</h2>
                <p className="text-base text-gdyup-text-medium mb-3">Browse available flights at a fraction of the charter cost</p>
                <Button asChild size="lg" className={cn(
                  getThemedButtonClasses('primary'),
                  "w-full text-base border-0 px-5 py-5 h-auto font-bold shadow-lg"
                )}>
                  <Link href="/gdyup/browse" className="flex items-center justify-center">
                    <Search className="w-5 h-5 mr-2" />
                    Browse Flights
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
            
            {/* Payment options badge */}
            <motion.div 
              variants={fadeInUp}
              className="flex items-center justify-center gap-3 text-base text-gdyup-text mt-4"
            >
              <span className="text-gdyup-text">Accepts:</span>
              <div className="flex items-center gap-1">
                <CreditCard className="w-5 h-5 text-gdyup-text" />
                <span className="font-medium">Cards</span>
              </div>
              <div className="flex items-center gap-1">
                <Bitcoin className="w-5 h-5 text-gdyup-primary" />
                <span className="font-medium">Bitcoin</span>
              </div>
              <span>&</span>
              <span className="font-medium">Crypto</span>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
      
      {/* How It Works Section */}
      <section ref={howItWorksRef} className="py-16 md:py-24 text-gdyup-text">
        <div className="container mx-auto px-5 md:px-6">
          <SectionHeader 
            title="Ultra-Simple P2P Jet Sharing" 
            subtitle="Already booked a private jet? Share empty seats and recoup your costs instantly."
          />
          
          <motion.div 
            initial="hidden"
            animate={howItWorksInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6 md:gap-8"
          >
            {/* Steps */}
            <motion.div 
              variants={fadeInUp}
              className={cn(
                getThemedBackgroundClasses('card'),
                "p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gdyup-border transform hover:-translate-y-1 hover:border-gdyup-primary duration-300"
              )}
            >
              <div className="bg-black rounded-full w-14 h-14 flex items-center justify-center mb-4 mx-auto border-2 border-gdyup-primary shadow-[0_0_20px_rgba(var(--gdyup-primary-rgb),0.3)]">
                <Plane className="w-7 h-7 text-gdyup-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-center text-gdyup-text">List Your Flight</h3>
              <p className="text-base text-gdyup-text-medium text-center">
                Select available seats in 30 seconds. Set your price and watch your flight expenses drop.
              </p>
            </motion.div>
            
            <motion.div 
              variants={fadeInUp}
              className={cn(
                getThemedBackgroundClasses('card'),
                "p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gdyup-border transform hover:-translate-y-1 hover:border-gdyup-primary duration-300"
              )}
            >
              <div className="bg-black rounded-full w-14 h-14 flex items-center justify-center mb-4 mx-auto border-2 border-gdyup-primary shadow-[0_0_20px_rgba(var(--gdyup-primary-rgb),0.3)]">
                <Sparkles className="w-7 h-7 text-gdyup-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-center text-gdyup-text">AI Concierge</h3>
              <p className="text-base text-gdyup-text-medium text-center">
                Our AI concierge finds perfect matches for your flight and handles all arrangements seamlessly.
              </p>
            </motion.div>
            
            <motion.div 
              variants={fadeInUp}
              className={cn(
                getThemedBackgroundClasses('card'),
                "p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gdyup-border transform hover:-translate-y-1 hover:border-gdyup-primary duration-300"
              )}
            >
              <div className="bg-black rounded-full w-14 h-14 flex items-center justify-center mb-4 mx-auto border-2 border-gdyup-primary shadow-[0_0_20px_rgba(var(--gdyup-primary-rgb),0.3)]">
                <Bitcoin className="w-7 h-7 text-gdyup-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-center text-gdyup-text">Get Paid Directly</h3>
              <p className="text-base text-gdyup-text-medium text-center">
                Receive payments directly via credit card, Bitcoin or other crypto. We only take a 7.5% fee.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Live Preview / Listings Section */}
      <section ref={bookingsRef} className="py-16 md:py-24 bg-black/30">
        <div className="container mx-auto px-5 md:px-6">
          <SectionHeader 
            title="Active Flight Listings" 
            subtitle="Browse current private jet shares available on the platform"
          />
          
          <motion.div 
            initial="hidden"
            animate={bookingsInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="flex overflow-x-auto pb-8 gap-4 snap-x snap-mandatory hide-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {[
              { 
                from: 'NYC', 
                to: 'MIA', 
                date: 'Aug 12', 
                price: '$2,850', 
                jet: 'Citation X',
                availability: '3 seats'
              },
              { 
                from: 'LAX', 
                to: 'LAS', 
                date: 'Aug 14', 
                price: '$1,250', 
                jet: 'Phenom 300',
                availability: '2 seats' 
              },
              { 
                from: 'SFO', 
                to: 'SEA', 
                date: 'Aug 20', 
                price: '$1,950', 
                jet: 'G450',
                availability: '4 seats' 
              },
              { 
                from: 'CHI', 
                to: 'NYC', 
                date: 'Aug 25', 
                price: '$2,150', 
                jet: 'Citation XLS',
                availability: '1 seat' 
              }
            ].map((listing, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className={cn(
                  getThemedBackgroundClasses('card'),
                  "min-w-[280px] max-w-[280px] p-5 rounded-xl shadow-lg border border-gdyup-border snap-center"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-gdyup-text">{listing.from} → {listing.to}</h3>
                    </div>
                    <p className="text-sm text-gdyup-text-medium">{listing.date} · {listing.jet}</p>
                  </div>
                  <div className="bg-gdyup-primary/20 rounded-full px-2 py-1 text-xs font-medium text-gdyup-primary border border-gdyup-primary/30">
                    {listing.availability}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gdyup-text-medium">Starting at</p>
                    <p className="text-xl font-bold text-gdyup-primary">{listing.price}</p>
                  </div>
                  <Button size="sm" className={cn(
                    getThemedButtonClasses('primary'),
                    "text-sm rounded-full"
                  )}>
                    View Details
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={bookingsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center mt-6"
          >
            <Button asChild variant="outline" className="group">
              <Link href="/gdyup/browse" className="flex items-center space-x-2">
                <span>See all available flights</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
      
      {/* BTC + Concierge Features */}
      <section ref={featuresRef} className="py-16 md:py-24">
        <div className="container mx-auto px-5 md:px-6">
          <SectionHeader 
            title="Premium Features" 
            subtitle="Bitcoin-native payments and AI-powered flight management"
          />
          
          <motion.div 
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          >
            <motion.div 
              variants={fadeInUp}
              className={cn(
                getThemedBackgroundClasses('card'),
                "p-6 rounded-xl border border-gdyup-border"
              )}
            >
              <div className="bg-black rounded-full w-12 h-12 flex items-center justify-center mb-4 border-2 border-gdyup-primary shadow-[0_0_15px_rgba(var(--gdyup-primary-rgb),0.3)]">
                <Bitcoin className="w-6 h-6 text-gdyup-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gdyup-text">Bitcoin-Native Payments</h3>
              <ul className="space-y-2">
                {[
                  'Zero-confirmation Lightning payments',
                  'Tap-to-Zap Bitcoin payments',
                  'Instant settlement, no chargebacks',
                  'Reduced fees compared to credit cards'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-gdyup-text-medium">
                    <Zap className="w-5 h-5 text-gdyup-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div 
              variants={fadeInUp}
              className={cn(
                getThemedBackgroundClasses('card'),
                "p-6 rounded-xl border border-gdyup-border"
              )}
            >
              <div className="bg-black rounded-full w-12 h-12 flex items-center justify-center mb-4 border-2 border-gdyup-primary shadow-[0_0_15px_rgba(var(--gdyup-primary-rgb),0.3)]">
                <MessageSquare className="w-6 h-6 text-gdyup-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gdyup-text">AI Flight Concierge</h3>
              <ul className="space-y-2">
                {[
                  'Intelligent flight pricing recommendations',
                  'Nostr encrypted messaging between parties',
                  'Automated flight notifications',
                  'Personalized travel suggestions'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-gdyup-text-medium">
                    <Sparkles className="w-5 h-5 text-gdyup-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* App Install CTA */}
      <section ref={downloadRef} className="py-16 md:py-24 bg-black/30">
        <div className="container mx-auto px-5 md:px-6 text-center">
          <motion.div 
            initial="hidden"
            animate={downloadInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="max-w-2xl mx-auto"
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold mb-3 text-gdyup-primary drop-shadow-[0_0_10px_rgba(var(--gdyup-primary-rgb),0.3)]"
            >
              Get the GDY·UP App
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-gdyup-text mb-8"
            >
              Experience private jet sharing at its finest with our native app
            </motion.p>
            
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row justify-center gap-4 mb-8"
            >
              <Button 
                size="lg" 
                className={cn(
                  getThemedButtonClasses('outline'),
                  "text-base font-medium border-2 px-8"
                )}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"></path><path d="M10 2c1 .5 2 2 2 5"></path></svg>
                iOS App Store
              </Button>
              <Button 
                size="lg" 
                className={cn(
                  getThemedButtonClasses('outline'),
                  "text-base font-medium border-2 px-8"
                )}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5z"></path><polyline points="8 9 12 5 16 9"></polyline><line x1="12" y1="5" x2="12" y2="14"></line><line x1="7" y1="19" x2="17" y2="19"></line></svg>
                Google Play
              </Button>
            </motion.div>
            
            <motion.div 
              variants={fadeInUp}
              className="mt-8 opacity-70 text-sm"
            >
              <p className="text-gdyup-text-medium">Coming soon to app stores. Currently in private TestFlight.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 

// Helper to hide scrollbars but maintain functionality
const styles = `
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
`;

// Add styles to document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
} 