import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, nostrData } = body
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    if (!nostrData) {
      return NextResponse.json({ error: 'Nostr data is required' }, { status: 400 })
    }
    
    // Validate the Nostr data
    const { 
      nostr_pubkey, 
      nip05, 
      nostr_settings,
      nostr_relays
    } = nostrData
    
    // Create allowed data object with only the fields we want to update
    const updateData: Record<string, any> = {}
    
    if (nostr_pubkey !== undefined) {
      updateData.nostr_pubkey = nostr_pubkey
    }
    
    if (nip05 !== undefined) {
      updateData.nip05 = nip05
    }
    
    if (nostr_settings !== undefined) {
      updateData.nostr_settings = nostr_settings
    }
    
    if (nostr_relays !== undefined) {
      updateData.nostr_relays = nostr_relays
    }
    
    const supabase = await createClient()
    
    // Update the user profile in the database
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating Nostr data:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data,
      message: 'Nostr information updated successfully'
    })
  } catch (error) {
    console.error('Error in Nostr update API:', error)
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
    
    // Fetch the user Nostr data
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nostr_pubkey, nip05, nostr_settings, nostr_relays')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching Nostr data:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error in Nostr fetch API:', error)
    return NextResponse.json({ 
      error: 'An unexpected error occurred',
      details: error
    }, { status: 500 })
  }
}

// Verify NIP-05 identifier
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, nip05, pubkey } = body
    
    if (!userId || !nip05 || !pubkey) {
      return NextResponse.json({ 
        error: 'User ID, NIP-05 identifier, and pubkey are required' 
      }, { status: 400 })
    }
    
    // Parse the NIP-05 identifier
    const [name, domain] = nip05.split('@')
    
    if (!name || !domain) {
      return NextResponse.json({ 
        error: 'Invalid NIP-05 identifier format. Should be name@domain.com' 
      }, { status: 400 })
    }
    
    try {
      // Fetch the well-known URL
      const response = await fetch(`https://${domain}/.well-known/nostr.json?name=${name}`)
      
      if (!response.ok) {
        return NextResponse.json({ 
          error: `Failed to verify NIP-05: ${response.statusText}`,
          verified: false 
        }, { status: 400 })
      }
      
      const data = await response.json()
      
      // Check if the pubkey matches
      if (data.names && data.names[name] === pubkey) {
        // Update the user profile with verified NIP-05
        const supabase = await createClient()
        
        const { data: profileData, error } = await supabase
          .from('profiles')
          .update({ 
            nip05, 
            nip05_verified: true,
            nip05_verified_at: new Date().toISOString() 
          })
          .eq('id', userId)
          .select()
          .single()
        
        if (error) {
          console.error('Error updating NIP-05 verification:', error)
          return NextResponse.json({ error: error.message, verified: false }, { status: 500 })
        }
        
        return NextResponse.json({
          success: true,
          verified: true,
          data: profileData,
          message: 'NIP-05 verified successfully'
        })
      } else {
        return NextResponse.json({ 
          error: 'NIP-05 verification failed. Pubkey does not match.',
          verified: false 
        }, { status: 400 })
      }
    } catch (error) {
      console.error('Error verifying NIP-05:', error)
      return NextResponse.json({ 
        error: 'Failed to verify NIP-05 identifier',
        verified: false,
        details: error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in NIP-05 verification API:', error)
    return NextResponse.json({ 
      error: 'An unexpected error occurred',
      verified: false,
      details: error
    }, { status: 500 })
  }
} 