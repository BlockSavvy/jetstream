"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CrewMember } from '@/lib/types/crew.types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Anchor, ShieldCheck } from 'lucide-react';

interface CrewCardProps {
  crew: CrewMember;
}

export function CrewCard({ crew }: CrewCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [headerImageError, setHeaderImageError] = useState(false);
  
  // Generate placeholder image or use profile image
  const getProfileImageUrl = () => {
    if (!crew.profileImageUrl) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(crew.name)}&background=FF9500&color=fff`;
    }
    
    // Check if the profile image is a relative path or already a full URL
    if (crew.profileImageUrl.startsWith('http')) {
      // Check if it's an Unsplash URL that might be causing issues
      if (crew.profileImageUrl.includes('source.unsplash.com')) {
        // If we're seeing this pattern, use a UI avatar instead
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(crew.name)}&background=FF9500&color=fff`;
      }
      return crew.profileImageUrl;
    } else {
      // For relative paths, just return the path as is
      // The database should now contain the complete path with extension
      return crew.profileImageUrl;
    }
  };
  
  // Generate header image URL - looking for _2 suffix or using the same as profile
  const getHeaderImageUrl = () => {
    const profileUrl = getProfileImageUrl();
    
    // If it's already a generated avatar or remote URL, use the same for header
    if (profileUrl.startsWith('http')) {
      return profileUrl;
    }
    
    // Try to generate a _2 version of the image
    // For example: /images/crew/captain_reid.jpg -> /images/crew/captain_reid_2.jpg
    
    // Parse the URL to separate path and extension
    const lastDotIndex = profileUrl.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      const path = profileUrl.substring(0, lastDotIndex);
      const extension = profileUrl.substring(lastDotIndex);
      return `${path}_2${extension}`;
    }
    
    // If no extension in the URL, just append _2
    return `${profileUrl}_2`;
  };
  
  const profileImage = imageError 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(crew.name)}&background=FF9500&color=fff`
    : getProfileImageUrl();
    
  const headerImage = headerImageError ? profileImage : getHeaderImageUrl();
  
  // Format rating to show one decimal place
  const formattedRating = crew.ratingsAvg ? crew.ratingsAvg.toFixed(1) : 'New';
  
  // Limit visible specializations to 2, with a count for the rest
  const visibleSpecializations = crew.specializations.slice(0, 2);
  const remainingCount = crew.specializations.length - visibleSpecializations.length;
  
  // Check if this is a captain card
  const isCaptain = crew.isCaptain;
  const isDedicatedCaptain = crew.dedicatedJetOwnerId !== null;
  
  return (
    <Card 
      className={`overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer group h-[350px] flex flex-col
        ${isCaptain ? 'border-amber-500 shadow-md' : 'border-gray-200'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/crew/${crew.id}`} className="flex flex-col h-full">
        <div className="relative h-32 overflow-hidden">
          {isCaptain && (
            <div className="absolute top-0 left-0 w-full z-10 bg-gradient-to-r from-amber-600 to-amber-400 text-white px-2 py-0.5 text-xs font-semibold flex items-center">
              <ShieldCheck className="h-3 w-3 mr-1" />
              {isDedicatedCaptain ? 'Elite Dedicated Captain' : 'Elite Captain'}
            </div>
          )}
          <Image 
            src={headerImage} 
            alt={crew.name} 
            fill 
            style={{ objectFit: 'cover', objectPosition: 'center 30%' }} 
            className={`transition-transform duration-500 ${isHovered ? 'scale-105' : ''}`}
            onError={() => setHeaderImageError(true)}
          />
          <div className="absolute top-8 right-2 flex items-center gap-1 bg-black/70 text-white text-xs font-medium px-2 py-0.5 rounded-full">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{formattedRating}</span>
          </div>
        </div>
        
        <CardContent className="p-3 flex-grow">
          <div className="flex items-center gap-3 mb-2">
            <Avatar className={`h-8 w-8 border-2 ${isCaptain ? 'border-amber-500' : 'border-gray-300'}`}>
              <AvatarImage src={profileImage} alt={crew.name} onError={() => setImageError(true)} />
              <AvatarFallback className={`${isCaptain ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'} text-xs font-medium`}>
                {crew.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-base font-bold truncate">{crew.name}</h3>
              <p className="text-xs text-muted-foreground truncate flex items-center">
                {isCaptain && crew.yearsOfExperience && (
                  <span className="mr-1">{crew.yearsOfExperience} years</span>
                )}
                {crew.specializations.slice(0, 1).join(', ')}
              </p>
            </div>
          </div>
          
          <div className="h-12 mb-2">
            <p className="text-xs text-muted-foreground line-clamp-3">
              {crew.bio || 
                (isCaptain 
                  ? `Captain ${crew.name} is an elite pilot offering exceptional flight experiences.` 
                  : `${crew.name} is a specialized crew member offering unique experiences during your flight.`)
              }
            </p>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {isDedicatedCaptain && (
              <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-700 py-0 px-1.5 h-5">
                <Anchor className="h-2.5 w-2.5 mr-0.5" /> Dedicated
              </Badge>
            )}
            {visibleSpecializations.map((specialization) => (
              <Badge 
                key={specialization} 
                variant="secondary" 
                className={`text-xs py-0 px-1.5 h-5 ${isCaptain ? 'bg-amber-100 text-amber-800' : ''}`}
              >
                {specialization}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <Badge variant="outline" className="text-xs py-0 px-1.5 h-5">
                +{remainingCount} more
              </Badge>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="pt-0 px-3 pb-3 mt-auto">
          <Button 
            className={`w-full text-white text-sm h-8 ${isCaptain ? 'bg-amber-600 hover:bg-amber-700' : 'bg-amber-500 hover:bg-amber-600'}`}
            variant="default"
          >
            View Profile
          </Button>
        </CardFooter>
      </Link>
    </Card>
  );
} 