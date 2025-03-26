import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { acceptJetShareOffer } from '@/lib/services/jetshare';
import { z } from 'zod';

// Create a schema for validating the request body
const acceptOfferSchema = z.object({
  offer_id: z.string().uuid(),
  payment_method: z.enum(['fiat', 'crypto']),
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
    const validationResult = acceptOfferSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    // Accept the offer
    const offer = await acceptJetShareOffer(user.id, validationResult.data);
    
    return NextResponse.json({ success: true, offer }, { status: 200 });
  } catch (error) {
    console.error('Error accepting JetShare offer:', error);
    return NextResponse.json(
      { error: 'Failed to accept offer', message: (error as Error).message },
      { status: 500 }
    );
  }
} 