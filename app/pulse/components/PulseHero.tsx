"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Image from "next/image";

export default function PulseHero() {
  const scrollToQuestionnaire = () => {
    const questionnaireElement = document.getElementById("pulse-questionnaire");
    if (questionnaireElement) {
      questionnaireElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Hero background image */}
      <div className="absolute inset-0 w-full h-full">
        <Image 
          src="/pulsehero.jpg" 
          alt="Private jet flying above clouds at sunset" 
          fill 
          priority
          className="object-cover object-center" 
        />
        {/* Overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-gray-900/40" />
      </div>

      {/* Abstract luxury background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center space-y-6 max-w-4xl mx-auto px-4"
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-amber-200 to-amber-400">
          JetStream Pulse – Curated Flights, Unforgettable Experiences
        </h1>
        
        <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto">
          Discover trending private jet flights uniquely tailored to your lifestyle and interests.
        </p>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="pt-6"
        >
          <Button 
            onClick={scrollToQuestionnaire}
            size="lg" 
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0 rounded-full px-8 h-12 text-lg shadow-lg shadow-amber-700/20"
          >
            Find Your Pulse
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
} 