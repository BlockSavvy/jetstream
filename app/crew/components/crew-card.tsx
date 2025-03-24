"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CrewMember } from '@/lib/types/crew.types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

interface CrewCardProps {
  crew: CrewMember;
}

export function CrewCard({ crew }: CrewCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Generate placeholder image or use profile image
  const profileImage = crew.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(crew.name)}&background=FF9500&color=fff`;
  
  // Format rating to show one decimal place
  const formattedRating = crew.ratingsAvg ? crew.ratingsAvg.toFixed(1) : 'New';
  
  // Limit visible specializations to 3, with a count for the rest
  const visibleSpecializations = crew.specializations.slice(0, 3);
  const remainingCount = crew.specializations.length - visibleSpecializations.length;
  
  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/crew/${crew.id}`} className="block h-full">
        <div className="relative h-48 overflow-hidden">
          <Image 
            src={profileImage} 
            alt={crew.name} 
            fill 
            style={{ objectFit: 'cover' }} 
            className={`transition-transform duration-500 ${isHovered ? 'scale-105' : ''}`}
          />
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 text-white text-sm font-medium px-2 py-1 rounded-full">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span>{formattedRating}</span>
          </div>
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-center gap-4 mb-3">
            <Avatar className="h-12 w-12 border-2 border-amber-500">
              <AvatarImage src={profileImage} alt={crew.name} />
              <AvatarFallback className="bg-amber-100 text-amber-800 text-sm font-medium">
                {crew.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-bold truncate">{crew.name}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {crew.specializations.slice(0, 1).join(', ')}
              </p>
            </div>
          </div>
          
          <div className="h-16">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {crew.bio || `${crew.name} is a specialized crew member offering unique experiences during your flight.`}
            </p>
          </div>
          
          <div className="mt-3 flex flex-wrap gap-1.5">
            {visibleSpecializations.map((specialization) => (
              <Badge key={specialization} variant="secondary" className="text-xs">
                {specialization}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <Badge variant="outline" className="text-xs">
                +{remainingCount} more
              </Badge>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="pt-0 px-4 pb-4">
          <Button 
            className="w-full bg-amber-500 hover:bg-amber-600 text-white mt-2"
            variant="default"
          >
            View Profile
          </Button>
        </CardFooter>
      </Link>
    </Card>
  );
} 