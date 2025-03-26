import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createJetShareOffer } from '@/lib/services/jetshare';
import { z } from 'zod';

// Create a schema for validating the request body
const createOfferSchema = z.object({
  flight_date: z.string().datetime(),
  departure_location: z.string().min(2),
  arrival_location: z.string().min(2),
  total_flight_cost: z.number().positive(),
  requested_share_amount: z.number().positive(),
});

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse and validate the request body
    const body = await request.json();
    const validationResult = createOfferSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    // Create the offer
    const offer = await createJetShareOffer(user.id, validationResult.data);
    
    return NextResponse.json({ success: true, offer }, { status: 201 });
  } catch (error) {
    console.error('Error creating JetShare offer:', error);
    return NextResponse.json(
      { error: 'Failed to create offer', message: (error as Error).message },
      { status: 500 }
    );
  }
} 