import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET all jets
export async function GET(req: NextRequest) {
  console.log("All Jets API: Request received");
  
  try {
    const { data: jets, error } = await supabase
      .from('jets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching jets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch jets', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(jets, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST to create a new jet
export async function POST(req: NextRequest) {
  console.log("Create Jet API: Request received");
  
  try {
    const data = await req.json();
    console.log('Received jet data:', data);
    
    // Required fields validation
    const requiredFields = ['manufacturer', 'model', 'year', 'capacity'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Format seating data if provided
    let formatted_seating = null;
    if (data.seating) {
      try {
        if (typeof data.seating === 'string') {
          formatted_seating = JSON.parse(data.seating);
        } else {
          formatted_seating = data.seating;
        }
      } catch (error) {
        console.error('Error parsing seating data:', error);
        return NextResponse.json(
          { error: 'Invalid seating data format' },
          { status: 400 }
        );
      }
    }

    // Handle image URLs
    let image_url = data.image_url || null;
    let images = data.images || null;

    // If images array is provided, format it properly
    if (Array.isArray(data.images)) {
      images = data.images;
    } else if (typeof data.images === 'string') {
      try {
        images = JSON.parse(data.images);
      } catch (error) {
        console.error('Error parsing images array:', error);
        return NextResponse.json(
          { error: 'Invalid images data format' },
          { status: 400 }
        );
      }
    }

    // Create new jet
    const { data: newJet, error } = await supabase
      .from('jets')
      .insert({
        manufacturer: data.manufacturer,
        model: data.model,
        year: data.year,
        tail_number: data.tail_number || null,
        msn: data.msn || null,
        capacity: data.capacity,
        crew_capacity: data.crew_capacity || null,
        status: data.status || 'Available',
        image_url: image_url,
        images: images,
        home_base_airport: data.home_base_airport || null,
        category: data.category || null,
        seating: formatted_seating,
        range_nm: data.range_nm || null,
        cruise_speed_kts: data.cruise_speed_kts || null,
        ceiling_ft: data.ceiling_ft || null,
        hourly_rate: data.hourly_rate || null,
        description: data.description || null,
        owner_id: data.owner_id || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating jet:', error);
      return NextResponse.json(
        { error: 'Failed to create jet', details: error.message },
        { status: 500 }
      );
    }

    // Revalidate the jets page
    revalidatePath('/jets');
    revalidatePath('/admin/jets');
    
    return NextResponse.json(newJet, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// PUT to update an existing jet
export async function PUT(req: NextRequest) {
  console.log("Update Jet API: Request received");
  
  try {
    const { id, ...updateData } = await req.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing jet ID' },
        { status: 400 }
      );
    }
    
    console.log(`Updating jet ${id} with data:`, updateData);
    
    // Format seating data if provided
    let formatted_seating = null;
    if (updateData.seating) {
      try {
        if (typeof updateData.seating === 'string') {
          formatted_seating = JSON.parse(updateData.seating);
        } else {
          formatted_seating = updateData.seating;
        }
      } catch (error) {
        console.error('Error parsing seating data:', error);
        return NextResponse.json(
          { error: 'Invalid seating data format' },
          { status: 400 }
        );
      }
    }
    
    // Handle image URLs
    let image_url = updateData.image_url !== undefined ? updateData.image_url : undefined;
    let images = updateData.images !== undefined ? updateData.images : undefined;
    
    // Process images array if provided
    if (updateData.images !== undefined) {
      if (Array.isArray(updateData.images)) {
        images = updateData.images;
      } else if (typeof updateData.images === 'string') {
        try {
          images = JSON.parse(updateData.images);
        } catch (error) {
          console.error('Error parsing images array:', error);
          return NextResponse.json(
            { error: 'Invalid images data format' },
            { status: 400 }
          );
        }
      }
    }
    
    // Prepare update data
    const jetUpdateData: any = {};
    
    // Only include fields that are explicitly provided
    const allowedFields = [
      'manufacturer', 'model', 'year', 'tail_number', 'msn', 
      'capacity', 'crew_capacity', 'status', 'home_base_airport', 
      'category', 'range_nm', 'cruise_speed_kts', 'ceiling_ft', 
      'hourly_rate', 'description', 'owner_id'
    ];
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        jetUpdateData[field] = updateData[field];
      }
    });
    
    // Add special fields if they were processed
    if (image_url !== undefined) jetUpdateData.image_url = image_url;
    if (images !== undefined) jetUpdateData.images = images;
    if (formatted_seating !== undefined) jetUpdateData.seating = formatted_seating;
    
    // Add updated timestamp
    jetUpdateData.updated_at = new Date().toISOString();
    
    // Update the jet in the database
    const { data: updatedJet, error } = await supabase
      .from('jets')
      .update(jetUpdateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating jet:', error);
      return NextResponse.json(
        { error: 'Failed to update jet', details: error.message },
        { status: 500 }
      );
    }
    
    if (!updatedJet) {
      return NextResponse.json(
        { error: 'Jet not found' },
        { status: 404 }
      );
    }
    
    // Revalidate the jets pages
    revalidatePath('/jets');
    revalidatePath('/admin/jets');
    
    return NextResponse.json(updatedJet);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// DELETE to remove a jet
export async function DELETE(req: NextRequest) {
  console.log("Delete Jet API: Request received");
  
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing jet ID' },
        { status: 400 }
      );
    }
    
    console.log(`Deleting jet ${id}`);
    
    // Delete the jet
    const { error } = await supabase
      .from('jets')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting jet:', error);
      return NextResponse.json(
        { error: 'Failed to delete jet', details: error.message },
        { status: 500 }
      );
    }
    
    // Revalidate the jets pages
    revalidatePath('/jets');
    revalidatePath('/admin/jets');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 