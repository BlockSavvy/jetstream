'use client';

import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import dynamic from 'next/dynamic';
import { useGdyupTheme } from '@/app/gdyup/hooks/useGdyupTheme';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  MessageSquareText, 
  Plus, 
  Mic, 
  InfoIcon, 
  X, 
  Settings, 
  PlaneTakeoff, 
  Bitcoin,
  LucideIcon
} from 'lucide-react';

// Import AI Concierge component with dynamic loading to avoid SSR issues
const AIConcierge = dynamic(() => import('@/app/components/voice/AIConcierge'), { 
  ssr: false 
});

type ConciergeAgentOption = {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color?: string;
  action: () => void;
}

type CustomPrompt = {
  id: string;
  title: string;
  content: string;
  icon: React.ElementType;
  theme: 'primary' | 'secondary' | 'success' | 'warning';
}

interface ConciergeButtonProps {
  imageUrl?: string;
  position?: 'bottom-right' | 'bottom-nav' | 'fab';
  context?: 'offer-creation' | 'flight-search' | 'general';
  currentFlightData?: any;
}

export const ConciergeButton: React.FC<ConciergeButtonProps> = ({ 
  imageUrl = '/icons/conciergebutton.png',
  position = 'bottom-right',
  context = 'general',
  currentFlightData
}) => {
  const { getThemedBackgroundClasses, getThemedTextClasses, getThemedButtonClasses, theme } = useGdyupTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'chat' | 'voice' | null>(null);
  const [directRequestContext, setDirectRequestContext] = useState<any>(null);
  const [showPromptsOverlay, setShowPromptsOverlay] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mainButtonRef = useRef<HTMLButtonElement>(null);
  
  // Manage body class for scroll locking
  useEffect(() => {
    // When dialog is open or prompts overlay is open, prevent body scrolling
    if (dialogOpen || showPromptsOverlay) {
      document.body.classList.add('concierge-open');
    } else {
      document.body.classList.remove('concierge-open');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('concierge-open');
    };
  }, [dialogOpen, showPromptsOverlay]);
  
  // Custom prompts data
  const customPrompts: CustomPrompt[] = [
    {
      id: 'pricing',
      title: 'Flight Pricing',
      content: 'How should I price my empty seats?',
      icon: PlaneTakeoff,
      theme: 'primary'
    },
    {
      id: 'jetRecommendation',
      title: 'Jet Recommendation',
      content: 'What jet model would you recommend for my trip?',
      icon: Settings,
      theme: 'secondary'
    },
    {
      id: 'itinerary',
      title: 'Itinerary Planning',
      content: 'Help me plan my flight itinerary',
      icon: PlaneTakeoff, 
      theme: 'success'
    },
    {
      id: 'bitcoin',
      title: 'Bitcoin Payment',
      content: 'How do I pay with Bitcoin?',
      icon: Bitcoin,
      theme: 'warning'
    }
  ];
  
  // Listen for direct open requests (from Ask Concierge button or other components)
  useEffect(() => {
    const handleOpenRequest = (event: CustomEvent) => {
      console.log('[ConciergeButton] Received open request:', event.detail);
      setDirectRequestContext(event.detail);
      setDialogType('chat');
      setDialogOpen(true);
      setIsExpanded(false);
      setShowPromptsOverlay(false);
    };
    
    // Add event listener
    document.addEventListener('gdyup-open-concierge', handleOpenRequest as EventListener);
    document.addEventListener('gdyup-ai-concierge-request', handleOpenRequest as EventListener);
    
    return () => {
      document.removeEventListener('gdyup-open-concierge', handleOpenRequest as EventListener);
      document.removeEventListener('gdyup-ai-concierge-request', handleOpenRequest as EventListener);
    };
  }, []);
  
  // Get position styling based on prop - simplified
  const getPositionStyle = (): CSSProperties => {
    // Return a fixed position centered at the bottom
    return {
      position: 'fixed',
      bottom: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999
    };
  };
  
  // Initialize agent options for radial menu - just the three original options
  const getRadialMenuOptions = (): ConciergeAgentOption[] => {
    return [
      {
        id: 'text-chat',
        label: 'Text Chat',
        description: 'Chat with AI assistant',
        icon: MessageSquareText,
        action: () => {
          setDirectRequestContext(null);
          setDialogType('chat');
          setDialogOpen(true);
          setIsExpanded(false);
        }
      },
      {
        id: 'voice-chat',
        label: 'Voice Chat',
        description: 'Talk with ElevenLabs voice',
        icon: Mic,
        action: () => {
          setDirectRequestContext(null);
          setDialogType('voice');
          setDialogOpen(true);
          setIsExpanded(false);
        }
      },
      {
        id: 'smart-prompts',
        label: 'Smart Prompts',
        description: 'Quick specialized help',
        icon: InfoIcon,
        action: () => {
          setShowPromptsOverlay(true);
          setIsExpanded(false);
        }
      }
    ];
  };
  
  const menuOptions = getRadialMenuOptions();
  
  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
      
      // Also close prompts overlay if clicking outside
      if (showPromptsOverlay && event.target instanceof HTMLElement && 
          !event.target.closest('.prompts-overlay') &&
          !event.target.closest('.concierge-button')) {
        setShowPromptsOverlay(false);
      }
    };
    
    // Add global click handler
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isExpanded, showPromptsOverlay]);
  
  // Handle button click
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[ConciergeButton] Button clicked, toggling expanded state');
    setIsExpanded(!isExpanded);
    
    // Close the prompts overlay if it's open
    if (showPromptsOverlay) {
      setShowPromptsOverlay(false);
    }
  };
  
  // Handle custom prompt selection
  const handlePromptSelect = (prompt: CustomPrompt) => {
    // Create prompt-specific context
    const contextData = {
      topic: prompt.id,
      context: {
        promptTitle: prompt.title,
        promptContent: prompt.content
      }
    };
    
    // Open chat with the selected prompt
    setDirectRequestContext(contextData);
    setDialogType('chat');
    setDialogOpen(true);
    setShowPromptsOverlay(false);
  };
  
  // Get backdrop color based on theme
  const getBackdropColor = () => {
    switch (theme) {
      case 'bitcoin':
        return 'rgba(18, 18, 18, 0.85)';
      default:
        return 'rgba(0, 0, 0, 0.6)';
    }
  };
  
  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
    setDirectRequestContext(null);
    setDialogType(null);
  };
  
  // Get theme-aware button glow color
  const getGlowColor = () => {
    switch (theme) {
      case 'luxury': 
        return 'rgba(57, 255, 20, 0.4)'; // Neon green glow
      case 'bitcoin':
        return 'rgba(247, 147, 26, 0.7)'; // Stronger Bitcoin orange glow
      default:
        return 'rgba(218, 255, 13, 0.5)'; // Lime glow
    }
  };

  // Get primary color based on theme
  const getPrimaryColor = () => {
    switch (theme) {
      case 'luxury': 
        return 'var(--gdyup-primary, #39FF14)';
      case 'bitcoin':
        return 'var(--gdyup-primary, #F7931A)';
      default:
        return 'var(--gdyup-primary, #DAFF0D)';
    }
  };
  
  // Get card background color based on theme
  const getCardBackgroundColor = () => {
    switch (theme) {
      case 'bitcoin':
        return 'var(--gdyup-bg-card, #1a1a1a)';
      default:
        return '#121212';
    }
  };
  
  return (
    <>
      {/* Remove the container div and apply fixed positioning directly to the button */}
      <button
        ref={mainButtonRef}
        className={cn(
          "concierge-button rounded-full flex items-center justify-center shadow-lg",
          "focus:outline-none focus:ring-2 focus:ring-gdyup-primary focus:ring-opacity-50",
          getThemedButtonClasses('primary'),
          isExpanded ? "scale-105" : ""
        )}
        style={getPositionStyle()}
        onClick={handleButtonClick}
        aria-label="AI Concierge"
      >
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="AI Concierge" 
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center rounded-full">
            {isExpanded ? (
              <X size={24} style={{ color: 'var(--gdyup-button-text, #000)' }} />
            ) : (
              <Sparkles size={24} style={{ color: 'var(--gdyup-button-text, #000)' }} />
            )}
          </div>
        )}
      </button>
      
      {position === 'bottom-nav' && isExpanded && (
        <div 
          className="absolute inset-0 backdrop-blur-md bg-black/40 border-t"
          style={{
            borderColor: 'var(--gdyup-border, #2a2a2a)',
            height: '72px',
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)'
          }}
        />
      )}

      {/* Modal style buttons that appear directly above the main button */}
      <AnimatePresence>
        {isExpanded && (
          <div className="absolute bottom-0 mb-16 left-1/2 transform -translate-x-1/2 flex flex-row gap-4 z-[110]">
            {menuOptions.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex flex-col items-center radial-menu-item"
              >
                <motion.button
                  onClick={option.action}
                  className="w-16 h-16 rounded-full shadow-lg flex items-center justify-center mb-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    backgroundColor: getCardBackgroundColor(),
                    border: `2px solid ${getPrimaryColor()}`,
                    boxShadow: `0 0 15px ${getGlowColor()}`,
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ 
                      backgroundColor: getPrimaryColor(),
                      color: 'var(--gdyup-button-text, #000)'
                    }}
                  >
                    {React.createElement(option.icon, { 
                      size: 22, 
                      strokeWidth: 2
                    })}
                  </div>
                </motion.button>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-medium text-center"
                  style={{ 
                    color: 'white',
                    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                    maxWidth: '80px'
                  }}
                >
                  {option.label}
                </motion.span>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
      
      {/* Custom Prompts Overlay */}
      <AnimatePresence>
        {showPromptsOverlay && (
          <motion.div 
            className="fixed inset-0 z-[200] prompts-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              backgroundColor: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <div className="absolute top-0 right-0 p-4">
              <button 
                onClick={() => setShowPromptsOverlay(false)}
                className={cn(
                  "rounded-full p-2",
                  getThemedBackgroundClasses('card'),
                  getThemedTextClasses()
                )}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex flex-col items-center justify-center h-full px-4">
              <motion.h2 
                className={cn("text-2xl font-bold mb-6", getThemedTextClasses())}
                initial={{ opacity: 0, y: -20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: { delay: 0.1 }
                }}
              >
                <span style={{ color: 'var(--gdyup-primary)' }}>Smart</span> Prompts
              </motion.h2>
              
              <div className="grid grid-cols-2 gap-4 max-w-sm">
                {customPrompts.map((prompt, index) => (
                  <motion.div
                    key={prompt.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      transition: { 
                        delay: 0.1 + index * 0.05,
                        type: "spring",
                        stiffness: 400,
                        damping: 25
                      }
                    }}
                    exit={{ 
                      opacity: 0,
                      scale: 0.9,
                      transition: { 
                        duration: 0.2 
                      }
                    }}
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: `0 0 20px ${getGlowColor()}`
                    }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "p-4 rounded-xl cursor-pointer shadow-lg",
                      getThemedBackgroundClasses('card')
                    )}
                    style={{
                      border: `1px solid var(--gdyup-primary, #DAFF0D)`,
                      minHeight: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      backgroundColor: getCardBackgroundColor(),
                      boxShadow: `0 4px 20px rgba(0, 0, 0, 0.4), 0 0 10px ${getGlowColor()}`
                    }}
                    onClick={() => handlePromptSelect(prompt)}
                  >
                    <div 
                      className="w-10 h-10 rounded-full mb-2 flex items-center justify-center"
                      style={{ 
                        backgroundColor: 'var(--gdyup-primary)',
                        color: 'var(--gdyup-button-text)'
                      }}
                    >
                      {React.createElement(prompt.icon, { size: 18 })}
                    </div>
                    <div>
                      <h3 className={cn("text-sm font-bold mb-1", getThemedTextClasses())}>
                        {prompt.title}
                      </h3>
                      <p className={cn("text-xs", getThemedTextClasses())}>
                        {prompt.content}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <motion.p 
                className={cn("text-xs mt-6", getThemedTextClasses('muted'))}
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: 0.7,
                  transition: { delay: 0.3 }
                }}
              >
                Select a prompt to get specialized assistance
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Add background for menu items */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-16 left-1/2 transform -translate-x-1/2 rounded-2xl"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              backgroundColor: getBackdropColor(),
              padding: '12px 20px',
              width: 'auto',
              display: 'flex',
              justifyContent: 'center',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
              border: `1px solid ${getPrimaryColor()}`,
              zIndex: 105
            }}
          />
        )}
      </AnimatePresence>
      
      {/* AI Concierge Dialog */}
      <AnimatePresence>
        {dialogOpen && dialogType && (
          <motion.div
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AIConcierge 
              showButton={false}
              initiallyOpen={true}
              buttonColor="var(--gdyup-primary)"
              initialContext={directRequestContext || { flightData: currentFlightData }}
              onClose={handleDialogClose}
              mode={dialogType}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}; 