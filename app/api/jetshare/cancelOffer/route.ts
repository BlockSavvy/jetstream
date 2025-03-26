import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { cancelJetShareOffer } from '@/lib/services/jetshare';
import { z } from 'zod';

// Create a schema for validating the request body
const cancelOfferSchema = z.object({
  offer_id: z.string().uuid(),
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
    const validationResult = cancelOfferSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    // Cancel the offer
    const result = await cancelJetShareOffer(user.id, validationResult.data.offer_id);
    
    return NextResponse.json({ success: result.success }, { status: 200 });
  } catch (error) {
    console.error('Error cancelling JetShare offer:', error);
    return NextResponse.json(
      { error: 'Failed to cancel offer', message: (error as Error).message },
      { status: 500 }
    );
  }
} 