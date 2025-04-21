import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import * as pinecone from '@/lib/services/pinecone'
import * as embeddings from '@/lib/services/embeddings'

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
    const userId = request.nextUrl.searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Fetch the user profile
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        jets (*)
      `)
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching profile:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error in profile fetch API:', error)
    return NextResponse.json({ 
      error: 'An unexpected error occurred',
      details: error
    }, { status: 500 })
  }
} 