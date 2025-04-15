import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Share, Search, Plane, Banknote, Clock, CheckCircle, Bitcoin, Sparkles, CreditCard, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function GdyupPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 pb-16">
      {/* Hero Section */}
      <section className="py-8 md:py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-2">
            <div className="gdyup-primary">
              GDY UP & SPLIT
            </div>
            <div className="text-gray-200 mt-1">Private Jet Costs</div>
          </h1>
          <p className="text-xl sm:text-xl md:text-2xl text-gray-300 mb-6 max-w-2xl mx-auto">
            List empty seats, connect with verified travelers, and recover up to 70% of your flight expenses.
          </p>
          
          {/* Two-sided marketplace CTAs */}
          <div className="flex flex-col gap-6 mb-8">
            {/* List seats CTA (emphasized) */}
            <div className="bg-gray-900 shadow-md rounded-xl p-5 border-l-4 gdyup-border">
              <h2 className="text-2xl font-bold text-white mb-3">Have a booked private flight?</h2>
              <p className="text-lg text-gray-300 mb-4">List your empty seats and recover up to 70% of your expenses</p>
              <Button asChild size="lg" className="w-full text-lg bg-black text-[#CEFF00] hover:bg-gray-800 border-2 border-[#CEFF00] px-8 py-6 h-auto">
                <Link href="/gdyup/offer">
                  <Share className="w-5 h-5 mr-2" />
                  List Your Seats
                </Link>
              </Button>
            </div>
            
            {/* Find seats CTA */}
            <div className="bg-gray-900 rounded-xl p-5 border-l-4 border-[#FF4B47]">
              <h2 className="text-2xl font-bold text-white mb-3">Looking for private jet seats?</h2>
              <p className="text-lg text-gray-300 mb-4">Browse available flights at a fraction of the charter cost</p>
              <Button asChild size="lg" variant="outline" className="w-full text-lg px-8 py-6 h-auto border-[#FF4B47] text-[#FF4B47] hover:bg-gray-800">
                <Link href="/gdyup/listings">
                  <Search className="w-5 h-5 mr-2" />
                  Browse Flights
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Payment options badge */}
          <div className="flex items-center justify-center gap-3 text-base text-gray-300">
            <span>Accepts:</span>
            <div className="flex items-center gap-1">
              <CreditCard className="w-5 h-5 text-gray-300" />
              <span className="font-medium">Cards</span>
            </div>
            <div className="flex items-center gap-1">
              <Bitcoin className="w-5 h-5 text-[#CEFF00]" />
              <span className="font-medium">Bitcoin</span>
            </div>
            <span>&</span>
            <span className="font-medium">Crypto</span>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-10 md:py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white gdyup-title">Ultra-Simple P2P Jet Sharing</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Already booked a private jet? Share empty seats and recoup your costs instantly.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {/* Step 1 */}
          <div className="bg-gray-900 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow gdyup-card">
            <div className="bg-black rounded-full w-14 h-14 flex items-center justify-center mb-4 mx-auto border-2 border-[#CEFF00]">
              <Plane className="w-7 h-7 text-[#CEFF00]" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-center text-white">List Your Flight</h3>
            <p className="text-base text-gray-300 text-center">
              Select available seats in 30 seconds. Set your price and watch your flight expenses drop.
            </p>
          </div>
          
          {/* Step 2 */}
          <div className="bg-gray-900 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow gdyup-card">
            <div className="bg-black rounded-full w-14 h-14 flex items-center justify-center mb-4 mx-auto border-2 border-[#CEFF00]">
              <Sparkles className="w-7 h-7 text-[#CEFF00]" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-center text-white">AI Concierge</h3>
            <p className="text-base text-gray-300 text-center">
              Our AI concierge finds perfect matches for your flight and handles all arrangements seamlessly.
            </p>
          </div>
          
          {/* Step 3 */}
          <div className="bg-gray-900 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow gdyup-card">
            <div className="bg-black rounded-full w-14 h-14 flex items-center justify-center mb-4 mx-auto border-2 border-[#CEFF00]">
              <Bitcoin className="w-7 h-7 text-[#CEFF00]" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-center text-white">Get Paid Directly</h3>
            <p className="text-base text-gray-300 text-center">
              Receive payments directly via credit card, Bitcoin or other crypto. We only take a 7.5% fee.
            </p>
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="py-10 md:py-16 bg-black rounded-2xl my-10 border border-gray-800">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white">Why Use <span className="gdyup-primary">GDY UP</span></h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              The fastest way to monetize empty seats on your private jet
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Benefit 1 */}
            <div className="flex flex-col items-center">
              <div className="bg-gray-900 rounded-full w-12 h-12 flex items-center justify-center mb-3 border-2 border-[#CEFF00]">
                <Banknote className="w-6 h-6 text-[#CEFF00]" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-center text-white">70%+ Cost Recovery</h3>
              <p className="text-base text-gray-300 text-center">
                Fill more seats and recover the majority of your flight expenses
              </p>
            </div>
            
            {/* Benefit 2 */}
            <div className="flex flex-col items-center">
              <div className="bg-gray-900 rounded-full w-12 h-12 flex items-center justify-center mb-3 border-2 border-[#CEFF00]">
                <Clock className="w-6 h-6 text-[#CEFF00]" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-center text-white">30-Second Listing</h3>
              <p className="text-base text-gray-300 text-center">
                Our touch-optimized process gets your seats listed in seconds flat
              </p>
            </div>
            
            {/* Benefit 3 */}
            <div className="flex flex-col items-center">
              <div className="bg-gray-900 rounded-full w-12 h-12 flex items-center justify-center mb-3 border-2 border-[#CEFF00]">
                <Bitcoin className="w-6 h-6 text-[#CEFF00]" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-center text-white">Bitcoin Payments</h3>
              <p className="text-base text-gray-300 text-center">
                Accept Bitcoin and other cryptocurrencies directly with zero delay
              </p>
            </div>
            
            {/* Benefit 4 */}
            <div className="flex flex-col items-center">
              <div className="bg-gray-900 rounded-full w-12 h-12 flex items-center justify-center mb-3 border-2 border-[#CEFF00]">
                <Sparkles className="w-6 h-6 text-[#CEFF00]" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-center text-white">AI Concierge</h3>
              <p className="text-base text-gray-300 text-center">
                Intelligent assistance to find matches and coordinate premium services
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Dual CTA Section */}
      <section className="py-10 md:py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Join the <span className="gdyup-primary">GDY UP</span> Community</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Whether you're offering empty seats or looking to fly private at a fraction of the cost, GDY UP connects you.
          </p>
          
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-gray-900 shadow-md p-5 rounded-xl border-l-4 gdyup-border">
              <h3 className="text-xl font-bold mb-3 text-white">For Jet Owners</h3>
              <p className="text-base text-gray-300 mb-4">Fill your empty seats and recover up to 70% of your costs</p>
              <Button asChild size="lg" className="w-full text-lg gdyup-button px-6 py-4 h-auto">
                <Link href="/gdyup/offer">
                  <Share className="w-5 h-5 mr-2" />
                  List Your Seats
                </Link>
              </Button>
            </div>
            
            <div className="bg-gray-900 p-5 rounded-xl border-l-4 border-[#FF4B47]">
              <h3 className="text-xl font-bold mb-3 text-white">For Travelers</h3>
              <p className="text-base text-gray-300 mb-4">Access private flights at a fraction of the typical cost</p>
              <Button asChild size="lg" variant="outline" className="w-full text-lg px-6 py-4 h-auto border-[#FF4B47] text-[#FF4B47] hover:bg-gray-800">
                <Link href="/gdyup/listings">
                  <Search className="w-5 h-5 mr-2" />
                  Browse Flights
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 