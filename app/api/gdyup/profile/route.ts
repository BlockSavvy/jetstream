import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import * as pinecone from '@/lib/services/pinecone'
import * as embeddings from '@/lib/services/embeddings'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { syncUserMetadataWithProfile, updateUserMetadataFromProfile } from './sync-metadata'
import { fixProfileInconsistencies } from './setup'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, profileData } = body
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Update the user profile in the database
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // After updating the profile, generate embeddings for the user
    try {
      // Fetch the full profile with related data
      const { data: fullProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (profileError) {
        console.error('Error fetching full profile:', profileError)
        // Continue with the response, even if embedding generation fails
      } else {
        // Enrich the profile for better embedding
        const enrichedProfile = {
          id: fullProfile.id,
          firstName: fullProfile.first_name || '',
          lastName: fullProfile.last_name || '',
          email: fullProfile.email || '',
          bio: fullProfile.bio || '',
          role: fullProfile.role || '',
          affiliation: fullProfile.affiliation || '',
          preferences: {},
          professionalDetails: {},
          interestsAndHobbies: [],
        }
        
        // Generate embedding for the user
        const userVector = await embeddings.generateUserEmbedding(enrichedProfile)
        
        // Store the embedding in Pinecone
        await pinecone.upsertUserProfile(enrichedProfile)
        
        console.log('User profile embedding generated and stored for user:', userId)
      }
    } catch (embeddingError) {
      console.error('Error generating embeddings:', embeddingError)
      // Continue with the response, even if embedding generation fails
    }
    
    // Sync updated profile data to user metadata
    await updateUserMetadataFromProfile(supabase, userId)
    
    return NextResponse.json({
      success: true,
      data,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Error in profile update API:', error)
    return NextResponse.json({ 
      error: 'An unexpected error occurred',
      details: error
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies })
    
    // Fix inconsistencies to ensure profile and metadata are in sync
    await fixProfileInconsistencies(supabase, userId)
    
    // First sync user metadata with profile to ensure we have the latest data
    await syncUserMetadataWithProfile(supabase, userId)
    
    // Get the user profile
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        jets:jets(id, make, model, serial_number, created_at)
      `)
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching profile:', error)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }
    
    // Check if user has jets
    const hasJets = data.jets && data.jets.length > 0
    
    // Also get the user's auth data to access user_metadata
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('Error fetching user auth data:', userError)
      // Continue without user metadata
    }
    
    // Return the profile with hasJets flag and metadata if available
    return NextResponse.json({
      profile: {
        ...data,
        hasJets,
        // Override with user metadata when available to ensure it matches
        nip05: userData?.user?.user_metadata?.nip05 || data.nip05,
        bitcoin_address: userData?.user?.user_metadata?.bitcoin_address || data.bitcoin_address,
        lightning_address: userData?.user?.user_metadata?.lightning_address || data.lightning_address,
      }
    })
  } catch (error) {
    console.error('Error in profile API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 