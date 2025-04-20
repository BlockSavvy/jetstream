'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Import AI Concierge component with dynamic loading to avoid SSR issues
const AIConcierge = dynamic(() => import('@/app/components/voice/AIConcierge'), { 
  ssr: false 
});

interface ConciergeButtonProps {
  imageUrl?: string;
}

export const ConciergeButton: React.FC<ConciergeButtonProps> = ({ 
  imageUrl = '/icons/conciergebutton.png'
}) => {
  // We inject custom styles when the component mounts through the AIConcierge props
  return (
    <AIConcierge 
      showButton={true}
      buttonImage={imageUrl} 
      buttonColor="#DAFF0D"
      buttonPosition={{ bottom: '5.5rem', right: '1.5rem' }}
      initiallyOpen={false}
    />
  );
}; 