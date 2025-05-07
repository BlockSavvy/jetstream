import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import * as pinecone from '@/lib/services/pinecone'
import * as embeddings from '@/lib/services/embeddings'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { checkJetOwnership } from './check-ownership'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jet, userId } = body
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Ensure jet has owner_id set
    const jetData = {
      ...jet,
      owner_id: userId,
      created_at: new Date().toISOString(),
    }
    
    // Insert the jet into the database
    const { data, error } = await supabase
      .from('jets')
      .insert([jetData])
      .select()
      .single()
    
    if (error) {
      console.error('Error inserting jet:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // After inserting the jet, update the user profile to mark they have a jet
    try {
      await supabase
        .from('profiles')
        .update({
          has_jet: true,
          onboarding_completed: true,
          onboarding_step: 'completed'
        })
        .eq('id', userId)
    } catch (profileError) {
      console.error('Error updating profile with jet status:', profileError)
      // Continue even if this update fails
    }
    
    // Generate embeddings for the jet, similar to flight embeddings
    try {
      // Prepare the jet data for embedding
      const jetForEmbedding = {
        ...data,
        id: data.id,
        origin_airport: data.base_airport, // Map to fields expected by embedding functions
        jets: {
          model: data.model,
          capacity: data.capacity,
          manufacturer: data.manufacturer || '', 
        }
      }
      
      // Generate embedding text and vector
      const jetText = embeddings.generateFlightText(jetForEmbedding)
      const vector = await embeddings.encode(jetText)
      
      // Prepare Pinecone record
      const record = embeddings.preparePineconeRecord(
        data.id,
        vector,
        'jet',
        jetForEmbedding,
        jetText
      )
      
      // Store in Pinecone
      await pinecone.upsertRecords([record])
      
      console.log('Jet embedding generated and stored for jet ID:', data.id)
    } catch (embeddingError) {
      console.error('Error generating jet embeddings:', embeddingError)
      // Continue with the response, even if embedding generation fails
    }
    
    return NextResponse.json({
      success: true,
      data,
      message: 'Jet added successfully'
    })
  } catch (error) {
    console.error('Error in jet add API:', error)
    return NextResponse.json({ 
      error: 'An unexpected error occurred',
      details: error
    }, { status: 500 })
  }
}

/**
 * API route to get jets owned by a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const includeDetails = searchParams.get('includeDetails') === 'true'
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check user jet ownership first
    const hasJets = await checkJetOwnership(supabase, userId)
    
    // Select query with optional details
    let query = supabase
      .from('jets')
      .select(
        includeDetails 
          ? `*, interior_images, exterior_images, layouts, assignments` 
          : `id, registration, make, model, seat_capacity, created_at, updated_at`
      )
      .eq('owner_id', userId)
      
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching jets:', error)
      return NextResponse.json({ error: 'Failed to fetch jets' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      hasJets,
      jets: data
    })
  } catch (error) {
    console.error('Error in jets API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 