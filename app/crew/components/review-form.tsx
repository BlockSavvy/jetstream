"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Star } from 'lucide-react';

// Define client component props separately from the page component props
type ReviewFormClientProps = {
  onSubmit: (rating: number, comment: string) => void;
  isSubmitting: boolean;
};

// This is the client component implementation
function ReviewFormClient({ onSubmit, isSubmitting }: ReviewFormClientProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    
    onSubmit(rating, comment);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
        <CardDescription>
          Share your experience with this crew member
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-3">Your Rating</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className="focus:outline-none"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoveredRating(value)}
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  <Star
                    className={`w-8 h-8 ${
                      (hoveredRating ? value <= hoveredRating : value <= rating)
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-gray-300'
                    } transition-colors`}
                  />
                </button>
              ))}
              
              <span className="ml-2 text-sm text-muted-foreground">
                {rating > 0 ? (
                  ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]
                ) : (
                  'Select a rating'
                )}
              </span>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium mb-2">Your Review (Optional)</p>
            <Textarea
              placeholder="Tell others about your experience with this crew member..."
              className="min-h-[120px]"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end">
          <Button
            type="submit"
            disabled={rating === 0 || isSubmitting}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

// Serializable props for the page component
export interface ReviewFormProps {
  onSubmitReview: string; // Serialized string to be parsed as a function
  isSubmitting: boolean;
}

// Export the public component which accepts serializable props
export function ReviewForm({ onSubmitReview, isSubmitting }: ReviewFormProps) {
  // Parse the serialized function
  const handleSubmit = (rating: number, comment: string) => {
    // Use indirect evaluation to convert the string to a function
    // This is a workaround for the serialization issue
    const onSubmitFn = new Function('rating', 'comment', onSubmitReview);
    onSubmitFn(rating, comment);
  };
  
  return (
    <ReviewFormClient
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
} 