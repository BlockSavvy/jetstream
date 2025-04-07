import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { verifyAdmin } from '../../../../lib/auth-utils';
import { embedEntity } from '../../../../lib/services/embed-entity';

/**
 * Admin endpoint to manually reindex a specific entity
 * This is useful for admin repair workflows and testing
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify the user is an admin
    const supabase = createClient();
    const user = await verifyAdmin(supabase);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    // 2. Parse request body
    const body = await request.json();
    const { type, id, priority = 5, forceRebuild = false } = body;
    
    // 3. Validate request
    if (!type || !id) {
      return NextResponse.json(
        { error: 'Missing required fields: type and id' },
        { status: 400 }
      );
    }
    
    const validTypes = ['jetshare_offer', 'flight', 'user', 'crew'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid entity type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }
    
    // 4. Verify entity exists
    let entityExists = false;
    let entityData = null;
    
    switch (type) {
      case 'jetshare_offer':
        const { data: offer, error: offerError } = await supabase
          .from('jetshare_offers')
          .select('id, status')
          .eq('id', id)
          .single();
        
        entityExists = !offerError && offer !== null;
        entityData = offer;
        break;
        
      case 'flight':
        const { data: flight, error: flightError } = await supabase
          .from('flights')
          .select('id, status')
          .eq('id', id)
          .single();
        
        entityExists = !flightError && flight !== null;
        entityData = flight;
        break;
        
      case 'user':
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', id)
          .single();
        
        entityExists = !profileError && profile !== null;
        entityData = profile;
        break;
        
      case 'crew':
        const { data: crew, error: crewError } = await supabase
          .from('pilots_crews')
          .select('id')
          .eq('id', id)
          .single();
        
        entityExists = !crewError && crew !== null;
        entityData = crew;
        break;
    }
    
    if (!entityExists) {
      return NextResponse.json(
        { error: `Entity not found: ${type} with ID ${id}` },
        { status: 404 }
      );
    }
    
    // 5. Delete existing vector embeddings (optional if forceRebuild is true)
    if (forceRebuild) {
      // Call Pinecone service to delete existing record by ID
      try {
        const recordId = `${type === 'jetshare_offer' ? 'offer' : type}-${id}`;
        
        await fetch('/api/pinecone/delete-record', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: recordId }),
        });
        
        console.log(`Deleted existing Pinecone record: ${recordId}`);
      } catch (deleteError) {
        console.warn('Failed to delete existing Pinecone record:', deleteError);
        // Continue anyway - the upsert will overwrite it
      }
    }
    
    // 6. Use the embedEntity utility to embed the entity
    const embedResult = await embedEntity(
      supabase,
      type as 'jetshare_offer' | 'flight' | 'user' | 'crew',
      id,
      priority,
      request.nextUrl.origin
    );
    
    // 7. Return success response
    return NextResponse.json({
      success: true,
      message: `Entity queued for reindexing: ${type} with ID ${id}`,
      embedResult,
      entity: {
        type,
        id,
        data: entityData
      },
      priority
    });
  } catch (error) {
    console.error('Error in reindex-entity endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 