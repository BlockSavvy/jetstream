import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, walletData } = body
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    if (!walletData) {
      return NextResponse.json({ error: 'Wallet data is required' }, { status: 400 })
    }
    
    // Validate the wallet data
    const { btcWalletAddress, lnurl, lightningWalletType } = walletData
    
    // Create allowed data object with only the fields we want to update
    const updateData: Record<string, any> = {}
    
    if (btcWalletAddress !== undefined) {
      updateData.btcWalletAddress = btcWalletAddress
    }
    
    if (lnurl !== undefined) {
      updateData.lnurl = lnurl
    }
    
    if (lightningWalletType !== undefined) {
      // Validate wallet type
      if (lightningWalletType !== 'custodial' && lightningWalletType !== 'non-custodial') {
        return NextResponse.json({ 
          error: 'Invalid wallet type. Must be "custodial" or "non-custodial"'
        }, { status: 400 })
      }
      updateData.lightningWalletType = lightningWalletType
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
      console.error('Error updating wallet data:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data,
      message: 'Wallet information updated successfully'
    })
  } catch (error) {
    console.error('Error in wallet update API:', error)
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
    
    // Fetch the user wallet data
    const { data, error } = await supabase
      .from('profiles')
      .select('id, btcWalletAddress, lnurl, lightningWalletType')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching wallet data:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error in wallet fetch API:', error)
    return NextResponse.json({ 
      error: 'An unexpected error occurred',
      details: error
    }, { status: 500 })
  }
} 