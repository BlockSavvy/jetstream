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
            <div className="gdyup-primary text-[#DAFF0D] drop-shadow-[0_0_10px_rgba(218,255,13,0.3)]">
              GDY UP & SPLIT
            </div>
            <div className="text-white mt-1">Private Jet Costs</div>
          </h1>
          <p className="text-xl sm:text-xl md:text-2xl text-white mb-6 max-w-2xl mx-auto">
            List empty seats, connect with verified travelers, and recover up to 70% of your flight expenses.
          </p>
          
          {/* Two-sided marketplace CTAs */}
          <div className="flex flex-col gap-6 mb-8">
            {/* List seats CTA (emphasized) */}
            <div className="bg-black shadow-lg rounded-xl p-5 border-l-4 border-[#DAFF0D]">
              <h2 className="text-2xl font-bold text-white mb-3">Have a booked private flight?</h2>
              <p className="text-lg text-white mb-4">List your empty seats and recover up to 70% of your expenses</p>
              <Button asChild size="lg" className="w-full text-lg bg-[#DAFF0D] text-black hover:bg-[#E8FF4D] border-0 px-8 py-6 h-auto font-bold shadow-lg">
                <Link href="/gdyup/offer" className="flex items-center justify-center">
                  <Share className="w-5 h-5 mr-2" />
                  List Your Seats
                </Link>
              </Button>
            </div>
            
            {/* Find seats CTA */}
            <div className="bg-black shadow-lg rounded-xl p-5 border-l-4 border-[#DAFF0D]">
              <h2 className="text-2xl font-bold text-white mb-3">Looking for private jet seats?</h2>
              <p className="text-lg text-white mb-4">Browse available flights at a fraction of the charter cost</p>
              <Button asChild size="lg" className="w-full text-lg bg-[#DAFF0D] text-black hover:bg-[#E8FF4D] border-0 px-8 py-6 h-auto font-bold shadow-lg">
                <Link href="/gdyup/listings" className="flex items-center justify-center">
                  <Search className="w-5 h-5 mr-2" />
                  Browse Flights
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Payment options badge */}
          <div className="flex items-center justify-center gap-3 text-base text-white mt-4">
            <span className="text-white">Accepts:</span>
            <div className="flex items-center gap-1">
              <CreditCard className="w-5 h-5 text-white" />
              <span className="font-medium">Cards</span>
            </div>
            <div className="flex items-center gap-1">
              <Bitcoin className="w-5 h-5 text-[#DAFF0D]" />
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
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-[#DAFF0D] drop-shadow-[0_0_10px_rgba(218,255,13,0.3)]">Ultra-Simple P2P Jet Sharing</h2>
          <p className="text-xl text-white max-w-2xl mx-auto">
            Already booked a private jet? Share empty seats and recoup your costs instantly.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {/* Step 1 */}
          <div className="bg-black p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-800 transform hover:-translate-y-1 hover:border-[#DAFF0D] duration-300">
            <div className="bg-black rounded-full w-14 h-14 flex items-center justify-center mb-4 mx-auto border-2 border-[#DAFF0D] shadow-[0_0_20px_rgba(218,255,13,0.3)]">
              <Plane className="w-7 h-7 text-[#DAFF0D]" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-center text-white">List Your Flight</h3>
            <p className="text-base text-white text-center">
              Select available seats in 30 seconds. Set your price and watch your flight expenses drop.
            </p>
          </div>
          
          {/* Step 2 */}
          <div className="bg-black p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-800 transform hover:-translate-y-1 hover:border-[#DAFF0D] duration-300">
            <div className="bg-black rounded-full w-14 h-14 flex items-center justify-center mb-4 mx-auto border-2 border-[#DAFF0D] shadow-[0_0_20px_rgba(218,255,13,0.3)]">
              <Sparkles className="w-7 h-7 text-[#DAFF0D]" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-center text-white">AI Concierge</h3>
            <p className="text-base text-white text-center">
              Our AI concierge finds perfect matches for your flight and handles all arrangements seamlessly.
            </p>
          </div>
          
          {/* Step 3 */}
          <div className="bg-black p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-800 transform hover:-translate-y-1 hover:border-[#DAFF0D] duration-300">
            <div className="bg-black rounded-full w-14 h-14 flex items-center justify-center mb-4 mx-auto border-2 border-[#DAFF0D] shadow-[0_0_20px_rgba(218,255,13,0.3)]">
              <Bitcoin className="w-7 h-7 text-[#DAFF0D]" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-center text-white">Get Paid Directly</h3>
            <p className="text-base text-white text-center">
              Receive payments directly via credit card, Bitcoin or other crypto. We only take a 7.5% fee.
            </p>
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="py-10 md:py-16 bg-black rounded-2xl my-10 border border-gray-800 shadow-xl">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white">Why Use <span className="text-[#DAFF0D] drop-shadow-[0_0_10px_rgba(218,255,13,0.3)]">GDY UP</span></h2>
            <p className="text-xl text-white max-w-2xl mx-auto">
              The fastest way to monetize empty seats on your private jet
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Benefit 1 */}
            <div className="flex flex-col items-center transition-transform hover:-translate-y-1 duration-300">
              <div className="bg-black rounded-full w-12 h-12 flex items-center justify-center mb-3 border-2 border-[#DAFF0D] shadow-[0_0_15px_rgba(218,255,13,0.4)]">
                <Banknote className="w-6 h-6 text-[#DAFF0D]" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-center text-white">70%+ Cost Recovery</h3>
              <p className="text-base text-white text-center">
                Fill more seats and recover the majority of your flight expenses
              </p>
            </div>
            
            {/* Benefit 2 */}
            <div className="flex flex-col items-center transition-transform hover:-translate-y-1 duration-300">
              <div className="bg-black rounded-full w-12 h-12 flex items-center justify-center mb-3 border-2 border-[#DAFF0D] shadow-[0_0_15px_rgba(218,255,13,0.4)]">
                <Clock className="w-6 h-6 text-[#DAFF0D]" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-center text-white">30-Second Listing</h3>
              <p className="text-base text-white text-center">
                Our touch-optimized process gets your seats listed in seconds flat
              </p>
            </div>
            
            {/* Benefit 3 */}
            <div className="flex flex-col items-center transition-transform hover:-translate-y-1 duration-300">
              <div className="bg-black rounded-full w-12 h-12 flex items-center justify-center mb-3 border-2 border-[#DAFF0D] shadow-[0_0_15px_rgba(218,255,13,0.4)]">
                <Bitcoin className="w-6 h-6 text-[#DAFF0D]" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-center text-white">Bitcoin Payments</h3>
              <p className="text-base text-white text-center">
                Accept Bitcoin and other cryptocurrencies directly with zero delay
              </p>
            </div>
            
            {/* Benefit 4 */}
            <div className="flex flex-col items-center transition-transform hover:-translate-y-1 duration-300">
              <div className="bg-black rounded-full w-12 h-12 flex items-center justify-center mb-3 border-2 border-[#DAFF0D] shadow-[0_0_15px_rgba(218,255,13,0.4)]">
                <Sparkles className="w-6 h-6 text-[#DAFF0D]" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-center text-white">AI Concierge</h3>
              <p className="text-base text-white text-center">
                Intelligent assistance to find matches and coordinate premium services
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Dual CTA Section */}
      <section className="py-10 md:py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Join the <span className="text-[#DAFF0D] drop-shadow-[0_0_10px_rgba(218,255,13,0.3)]">GDY UP</span> Community</h2>
          <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
            Whether you're offering empty seats or looking to fly private at a fraction of the cost, GDY UP connects you.
          </p>
          
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-black shadow-lg p-5 rounded-xl border-l-4 border-[#DAFF0D]">
              <h3 className="text-xl font-bold mb-3 text-white">For Jet Owners</h3>
              <p className="text-base text-white mb-4">Fill your empty seats and recover up to 70% of your costs</p>
              <Button asChild size="lg" className="w-full text-lg bg-[#DAFF0D] text-black hover:bg-[#E8FF4D] border-0 px-6 py-4 h-auto font-bold shadow-lg">
                <Link href="/gdyup/offer" className="flex items-center justify-center">
                  <Share className="w-5 h-5 mr-2" />
                  List Your Seats
                </Link>
              </Button>
            </div>
            
            <div className="bg-black shadow-lg p-5 rounded-xl border-l-4 border-[#DAFF0D]">
              <h3 className="text-xl font-bold mb-3 text-white">For Travelers</h3>
              <p className="text-base text-white mb-4">Access private flights at a fraction of the typical cost</p>
              <Button asChild size="lg" className="w-full text-lg bg-[#DAFF0D] text-black hover:bg-[#E8FF4D] border-0 px-6 py-4 h-auto font-bold shadow-lg">
                <Link href="/gdyup/listings" className="flex items-center justify-center">
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