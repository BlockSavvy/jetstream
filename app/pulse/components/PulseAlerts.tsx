"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  BellRing, 
  Check,
  Radio
} from "lucide-react";

// Reference to an existing jet interior image from the database
const interiorImagePath = "/images/jets/gulfstream/g650-1.jpg";

export default function PulseAlerts() {
  const [email, setEmail] = useState("");
  const [subscribeType, setSubscribeType] = useState<"email" | "phone">("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [phone, setPhone] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    // Simulate API call for subscription
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setEmail("");
        setPhone("");
      }, 3000);
    }, 1500);
  };

  return (
    <section className="py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto"
      >
        <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-850 to-gray-800">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-2">
              {/* Left side - Image/Graphic Side */}
              <div className="relative bg-amber-900 p-8 hidden md:flex items-center justify-center">
                <div className="absolute inset-0 bg-cover bg-center opacity-30"
                  style={{ backgroundImage: `url(${interiorImagePath})` }} />
                
                <div className="absolute inset-0 bg-gradient-to-br from-amber-950/90 to-amber-800/70" />
                
                <div className="relative z-10 flex flex-col items-center justify-center text-center">
                  <BellRing className="w-16 h-16 text-amber-300 mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">Never Miss a Flight</h3>
                  <p className="text-amber-200/90">
                    Get real-time notifications for exclusive flight opportunities perfectly matched to your preferences.
                  </p>
                </div>
              </div>
              
              {/* Right side - Form */}
              <div className="p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Never Miss a Pulse Opportunity
                  </h3>
                  <p className="text-gray-400">
                    Get personalized Pulse Alerts for trending flights delivered directly to your inbox or phone.
                  </p>
                </div>
                
                {isSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-green-900/30 border border-green-700 rounded-md p-4 flex items-center text-green-400"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    <span>
                      {subscribeType === "email" 
                        ? "You've been subscribed! Check your email for confirmation."
                        : "You've been subscribed! You'll receive SMS notifications."}
                    </span>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="flex space-x-2 mb-4">
                      <Button
                        type="button"
                        variant={subscribeType === "email" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSubscribeType("email")}
                        className={`rounded-full flex items-center ${
                          subscribeType === "email" 
                            ? "bg-amber-500 hover:bg-amber-600 text-white" 
                            : "border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
                        }`}
                      >
                        <Radio className="w-3.5 h-3.5 mr-1.5" />
                        Email
                      </Button>
                      
                      <Button
                        type="button"
                        variant={subscribeType === "phone" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSubscribeType("phone")}
                        className={`rounded-full flex items-center ${
                          subscribeType === "phone" 
                            ? "bg-amber-500 hover:bg-amber-600 text-white" 
                            : "border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
                        }`}
                      >
                        <Radio className="w-3.5 h-3.5 mr-1.5" />
                        SMS
                      </Button>
                    </div>
                    
                    {subscribeType === "email" ? (
                      <div className="space-y-4">
                        <Input
                          type="email"
                          placeholder="Your email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="bg-gray-800 border-gray-700 rounded-md placeholder:text-gray-500 h-12"
                        />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Input
                          type="tel"
                          placeholder="Your phone number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          className="bg-gray-800 border-gray-700 rounded-md placeholder:text-gray-500 h-12"
                        />
                      </div>
                    )}
                    
                    <Button
                      type="submit"
                      className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white h-12"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                          <span>Processing...</span>
                        </div>
                      ) : (
                        "Subscribe to Pulse Alerts"
                      )}
                    </Button>
                    
                    <p className="text-gray-500 text-xs mt-3">
                      By subscribing, you agree to receive Pulse Alerts from JetStream. 
                      You can unsubscribe at any time.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
} 