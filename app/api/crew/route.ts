import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Use the existing createClient function
    const supabase = await createClient();
    
    // Get query parameters
    const url = new URL(request.url);
    
    const specializations = url.searchParams.get('specializations');
    const minRating = url.searchParams.get('minRating');
    const available = url.searchParams.get('available');
    const query = url.searchParams.get('query');
    const isCaptain = url.searchParams.get('isCaptain');
    const dedicatedOnly = url.searchParams.get('dedicatedOnly');
    const minYearsExperience = url.searchParams.get('minYearsExperience');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const shouldCount = url.searchParams.get('count') === 'true';
    
    // Start query builder for crew members
    let crewQuery = supabase
      .from('pilots_crews')
      .select('*');
    
    // Start query builder for count, if needed
    let countQuery = shouldCount ? 
      supabase
        .from('pilots_crews')
        .select('id', { count: 'exact', head: true })
      : null;
    
    // Apply filters to both queries
    if (specializations) {
      const specArray = specializations.split(',');
      const filter = specArray.map(spec => `specializations.cs.{${spec.trim()}}`).join(',');
      crewQuery = crewQuery.or(filter);
      if (countQuery) countQuery = countQuery.or(filter);
    }
    
    if (minRating) {
      const ratingValue = parseFloat(minRating);
      crewQuery = crewQuery.gte('ratings_avg', ratingValue);
      if (countQuery) countQuery = countQuery.gte('ratings_avg', ratingValue);
    }
    
    if (available === 'true') {
      crewQuery = crewQuery.not('availability', 'is', null);
      if (countQuery) countQuery = countQuery.not('availability', 'is', null);
    }
    
    if (query) {
      crewQuery = crewQuery.or(`name.ilike.%${query}%,bio.ilike.%${query}%`);
      if (countQuery) countQuery = countQuery.or(`name.ilike.%${query}%,bio.ilike.%${query}%`);
    }
    
    if (isCaptain) {
      const isCapt = isCaptain === 'true';
      crewQuery = crewQuery.eq('is_captain', isCapt);
      if (countQuery) countQuery = countQuery.eq('is_captain', isCapt);
    }
    
    if (dedicatedOnly === 'true') {
      crewQuery = crewQuery.not('dedicated_jet_owner_id', 'is', null);
      if (countQuery) countQuery = countQuery.not('dedicated_jet_owner_id', 'is', null);
    }
    
    if (minYearsExperience) {
      const years = parseInt(minYearsExperience);
      crewQuery = crewQuery.gte('years_of_experience', years);
      if (countQuery) countQuery = countQuery.gte('years_of_experience', years);
    }
    
    // Apply pagination to the crew query
    crewQuery = crewQuery
      .order('ratings_avg', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Fetch crew data
    const { data: crewData, error: crewError } = await crewQuery;
    
    if (crewError) {
      console.error('Error fetching crew members:', crewError);
      return NextResponse.json({ error: crewError.message }, { status: 500 });
    }
    
    // Fetch total count if requested
    let totalCount = null;
    if (shouldCount && countQuery) {
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        console.error('Error counting crew members:', countError);
      } else {
        totalCount = count;
      }
    }
    
    // Map response to match client-side types
    const crew = crewData.map(member => ({
      id: member.id,
      userId: member.user_id,
      name: member.name,
      bio: member.bio,
      profileImageUrl: member.profile_image_url,
      ratingsAvg: member.ratings_avg,
      specializations: member.specializations || [],
      socialLinks: member.social_links || {},
      isCaptain: member.is_captain || false,
      dedicatedJetOwnerId: member.dedicated_jet_owner_id,
      yearsOfExperience: member.years_of_experience,
      availability: member.availability
    }));
    
    // Check if there are more items beyond the current range
    const hasMore = crew.length === limit;
    
    return NextResponse.json({ 
      crew, 
      hasMore,
      totalCount
    });
  } catch (error: any) {
    console.error('Unexpected error fetching crew:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use the existing createClient function
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.specializations || !Array.isArray(body.specializations)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Create the crew member
    const { data, error } = await supabase
      .from('pilots_crews')
      .insert({
        user_id: user.id,
        name: body.name,
        bio: body.bio,
        profile_image_url: body.profileImageUrl,
        specializations: body.specializations,
        social_links: body.socialLinks || {},
        is_captain: body.isCaptain || false,
        dedicated_jet_owner_id: body.dedicatedJetOwnerId || null,
        years_of_experience: body.yearsOfExperience || null
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating crew member:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Transform data to match our types
    const transformedData = {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      bio: data.bio,
      profileImageUrl: data.profile_image_url,
      ratingsAvg: data.ratings_avg,
      specializations: data.specializations,
      socialLinks: data.social_links,
      isCaptain: data.is_captain || false,
      dedicatedJetOwnerId: data.dedicated_jet_owner_id,
      yearsOfExperience: data.years_of_experience
    };
    
    return NextResponse.json({ crew: transformedData });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 