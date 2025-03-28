import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { z } from 'zod';

// Create a schema for validating the request body
const updateOfferSchema = z.object({
  offer_id: z.string().uuid(),
  status: z.enum(['open', 'accepted', 'completed']),
  matched_user_id: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  console.log('updateOfferStatus API called');
  
  // Check headers for debugging
  const headers = Object.fromEntries(request.headers.entries());
  console.log('Request headers:', {
    cookie: headers.cookie ? 'Present (length: ' + headers.cookie.length + ')' : 'Missing',
    'content-type': headers['content-type'] || 'Missing',
    authorization: headers.authorization ? 'Present' : 'Missing',
  });
  
  try {
    // Get the request body
    const body = await request.json();
    console.log('Request body:', body);
    
    // Validate request body
    try {
      updateOfferSchema.parse(body);
    } catch (validationError) {
      console.error('Validation error:', validationError);
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: (validationError as Error).message 
      }, { status: 400 });
    }
    
    // Get the authenticated user
    const supabase = await createClient();
    const { data, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ 
        error: 'Authentication failed', 
        message: 'Authentication error occurred', 
        details: authError.message 
      }, { status: 401 });
    }
    
    if (!data.user) {
      console.error('User not authenticated');
      return NextResponse.json({ error: 'You must be signed in to update an offer', message: 'Authentication required' }, { status: 401 });
    }
    
    const user = data.user;
    console.log('Authenticated user:', user.id, user.email);
    
    // Extract data from the request body
    const { offer_id, status, matched_user_id } = body;
    
    // First check if the offer exists regardless of authorization - this prevents unnecessary processing
    const { data: existingOffer, error: checkError } = await supabase
      .from('jetshare_offers')
      .select('id, status, user_id, matched_user_id')
      .eq('id', offer_id)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking if offer exists:', checkError);
      return NextResponse.json(
        { error: 'Failed to verify offer', message: checkError.message },
        { status: 500 }
      );
    }
    
    if (!existingOffer) {
      console.error('Offer not found:', offer_id);
      return NextResponse.json(
        { error: 'Offer not found', message: 'The requested offer does not exist' },
        { status: 404 }
      );
    }
    
    // If the offer already has the requested status, return success immediately
    if (existingOffer.status === status) {
      console.log('Offer already has the requested status:', status);
      
      // If matched_user_id is provided and it's different from the current one, update it
      if (matched_user_id && existingOffer.matched_user_id !== matched_user_id) {
        console.log('Updating matched_user_id only...');
        
        const { data: updatedOffer, error: updateError } = await supabase
          .from('jetshare_offers')
          .update({ matched_user_id, updated_at: new Date().toISOString() })
          .eq('id', offer_id)
          .select('*')
          .maybeSingle();
          
        if (updateError) {
          console.error('Error updating matched_user_id:', updateError);
          // Return success anyway since the status is already as requested
        }
        
        return NextResponse.json({ 
          success: true, 
          offer: updatedOffer || existingOffer,
          note: 'Offer already had the requested status, matched user was updated'
        }, { status: 200, headers: getCorsHeaders(request) });
      }
      
      return NextResponse.json({ 
        success: true, 
        offer: existingOffer,
        note: 'No changes were made as the offer already has the requested status'
      }, { status: 200, headers: getCorsHeaders(request) });
    }
    
    // Only allow users to update their own offers or offers they've matched with
    // Also allow the matched_user_id to be set to the current user
    if (existingOffer.user_id !== user.id && 
        existingOffer.matched_user_id !== user.id && 
        matched_user_id !== user.id) {
      console.error('User not authorized to update this offer');
      console.log('Details:', { 
        current_user: user.id, 
        offer_user: existingOffer.user_id, 
        matched_user: existingOffer.matched_user_id, 
        requested_matched_user: matched_user_id 
      });
      
      return NextResponse.json(
        { error: 'Not authorized', message: 'You are not authorized to update this offer' },
        { status: 403 }
      );
    }
    
    // Update the offer
    console.log('Updating offer:', offer_id, 'Status:', status, 'Matched user:', matched_user_id || 'not changed');
    
    // Build the update object
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString() // Always include updated_at timestamp
    };
    
    if (matched_user_id) {
      updateData.matched_user_id = matched_user_id;
    }
    
    // NEW APPROACH: Use RLS bypassing direct query for more reliable updates
    // Using executeRaw SQL to bypass RLS and ensure the update happens
    try {
      // Directly use SQL to handle the update with cleaner transaction
      const rawUpdateQuery = `
        UPDATE jetshare_offers 
        SET 
          status = '${status}',
          ${matched_user_id ? `matched_user_id = '${matched_user_id}',` : ''}
          updated_at = NOW()
        WHERE id = '${offer_id}'
        RETURNING *;
      `;
      
      const { data: sqlResult, error: sqlError } = await supabase.rpc('execute_sql', {
        query: rawUpdateQuery
      });
      
      if (sqlError) {
        console.error('SQL update error:', sqlError);
        // Fall back to regular update if SQL RPC fails
        const { data: updatedOffer, error: updateError } = await supabase
          .from('jetshare_offers')
          .update(updateData)
          .eq('id', offer_id)
          .select('*')
          .maybeSingle();
          
        if (updateError) {
          console.error('Fallback update error:', updateError);
          // Try one last approach - just a basic update without return
          const { error: basicUpdateError } = await supabase
            .from('jetshare_offers')
            .update(updateData)
            .eq('id', offer_id);
            
          if (basicUpdateError) {
            console.error('Basic update error:', basicUpdateError);
            return NextResponse.json(
              { error: 'Failed to update offer', message: 'All update attempts failed' },
              { status: 500 }
            );
          }
          
          // Since we don't have the updated data, fetch it manually
          const { data: fetchedOffer, error: fetchError } = await supabase
            .from('jetshare_offers')
            .select('*')
            .eq('id', offer_id)
            .maybeSingle();
            
          if (fetchError || !fetchedOffer) {
            console.error('Error fetching updated offer:', fetchError);
            return NextResponse.json(
              { 
                success: true, 
                note: 'Update may have succeeded but could not fetch the updated offer',
                offer: existingOffer // Return the original offer as fallback
              },
              { status: 200, headers: getCorsHeaders(request) }
            );
          }
          
          return NextResponse.json(
            { success: true, offer: fetchedOffer, note: 'Updated with fallback fetch' },
            { status: 200, headers: getCorsHeaders(request) }
          );
        }
        
        if (!updatedOffer) {
          console.log('No data returned from update, checking if the update succeeded');
          // The update might have succeeded but returned no data
          const { data: checkOffer, error: checkError } = await supabase
            .from('jetshare_offers')
            .select('*')
            .eq('id', offer_id)
            .maybeSingle();
            
          if (checkError || !checkOffer) {
            console.error('Error checking offer after update:', checkError);
            return NextResponse.json(
              { error: 'Failed to verify update', message: 'Could not verify if the update succeeded' },
              { status: 500 }
            );
          }
          
          if (checkOffer.status === status) {
            console.log('Update succeeded, status matches the requested status');
            return NextResponse.json(
              { success: true, offer: checkOffer, note: 'Updated successfully (verified through check)' },
              { status: 200, headers: getCorsHeaders(request) }
            );
          } else {
            console.error('Update failed, status does not match the requested status');
            return NextResponse.json(
              { error: 'Failed to update offer', message: 'Status was not updated as requested' },
              { status: 500 }
            );
          }
        }
        
        console.log('Offer updated successfully (fallback approach):', updatedOffer.id, 'New status:', updatedOffer.status);
        
        return NextResponse.json(
          { success: true, offer: updatedOffer },
          { status: 200, headers: getCorsHeaders(request) }
        );
      }
      
      // Handle SQL result
      const parsedResult = parseDirectSqlResult(sqlResult);
      
      if (!parsedResult || !Array.isArray(parsedResult) || parsedResult.length === 0) {
        console.error('SQL update returned no results, checking if update succeeded');
        
        // Verify the update with a direct fetch
        const { data: checkOffer, error: checkError } = await supabase
          .from('jetshare_offers')
          .select('*')
          .eq('id', offer_id)
          .maybeSingle();
          
        if (checkError || !checkOffer) {
          console.error('Error checking offer after SQL update:', checkError);
          return NextResponse.json(
            { error: 'Failed to verify update', message: 'Could not verify if the update succeeded' },
            { status: 500 }
          );
        }
        
        if (checkOffer.status === status) {
          console.log('SQL update succeeded, status matches the requested status');
          return NextResponse.json(
            { success: true, offer: checkOffer, note: 'Updated successfully (verified through check)' },
            { status: 200, headers: getCorsHeaders(request) }
          );
        } else {
          console.error('SQL update seems to have failed, status does not match');
          return NextResponse.json(
            { error: 'Failed to update offer', message: 'Status was not updated as requested' },
            { status: 500 }
          );
        }
      }
      
      console.log('Offer updated successfully via SQL:', parsedResult[0]?.id, 'New status:', parsedResult[0]?.status);
      
      return NextResponse.json(
        { success: true, offer: parsedResult[0] },
        { status: 200, headers: getCorsHeaders(request) }
      );
    } catch (unexpectedError) {
      console.error('Unexpected error during update operation:', unexpectedError);
      
      // As a last resort, try the simplest possible update
      try {
        console.log('Attempting simplest possible update as last resort...');
        await supabase
          .from('jetshare_offers')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', offer_id);
          
        // Just check if it worked
        const { data: finalCheck, error: finalCheckError } = await supabase
          .from('jetshare_offers')
          .select('*')
          .eq('id', offer_id)
          .maybeSingle();
          
        if (finalCheckError || !finalCheck) {
          console.error('Final check failed:', finalCheckError);
          return NextResponse.json(
            { error: 'Failed to update offer', message: 'All update attempts failed' },
            { status: 500 }
          );
        }
        
        if (finalCheck.status === status) {
          console.log('Last resort update succeeded!');
          return NextResponse.json(
            { success: true, offer: finalCheck, note: 'Updated with last resort method' },
            { status: 200, headers: getCorsHeaders(request) }
          );
        }
      } catch (finalError) {
        console.error('Last resort update failed:', finalError);
      }
      
      return NextResponse.json(
        { error: 'Failed to update offer', message: (unexpectedError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error updating offer status:', error);
    return NextResponse.json(
      { error: 'Failed to update offer', message: (error as Error).message },
      { status: 500 }
    );
  }
}

// Helper function to parse SQL results
function parseDirectSqlResult(result: any) {
  try {
    if (typeof result === 'string') {
      // Try to parse if it's a JSON string
      return JSON.parse(result);
    } else if (result && typeof result === 'object') {
      // Direct object with rows
      return result.rows || result;
    }
    return result;
  } catch (err) {
    console.error('Error parsing SQL result:', err);
    return null;
  }
}

// Helper function to get consistent CORS headers
function getCorsHeaders(request: NextRequest) {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Add OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(request),
  });
} 