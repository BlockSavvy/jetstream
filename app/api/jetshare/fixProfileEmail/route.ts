import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Only allow in development/test mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'This endpoint is not available in production' }, { status: 403 });
  }
  
  try {
    // Create supabase client
    const supabase = await createClient();
    
    // Get parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const all = url.searchParams.get('all') === 'true';
    
    console.log('Fixing profile email issues:', all ? 'all users' : `for user ${userId}`);
    
    // If userId is provided, only fix that user
    if (userId && !all) {
      // Get user email from auth.users
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError || !userData) {
        console.error('Error fetching user:', userError || 'User not found');
        return NextResponse.json(
          { success: false, error: 'User not found or error fetching user' },
          { status: 404 }
        );
      }
      
      // Update or create profile for the user
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (existingProfile) {
        console.log('Updating existing profile with email');
        // Update profile
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({
            email: userData.user.email,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single();
        
        if (updateError) {
          console.error('Error updating profile:', updateError);
          return NextResponse.json(
            { success: false, error: 'Error updating profile', details: updateError },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          success: true,
          message: 'Profile email updated successfully',
          profile: updatedProfile
        });
      } else {
        console.log('Creating new profile for user');
        // Create new profile
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            email: userData.user.email,
            first_name: userData.user.user_metadata?.first_name || 'User',
            last_name: userData.user.user_metadata?.last_name || 'Profile',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating profile:', createError);
          return NextResponse.json(
            { success: false, error: 'Error creating profile', details: createError },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          success: true,
          message: 'Profile created successfully',
          profile: newProfile
        });
      }
    }
    
    // For all users, execute a SQL statement that updates all profiles
    if (all) {
      try {
        // First, get count of affected rows with missing emails
        const { count: missingEmailCount, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .or('email.is.null,email.eq.');
        
        if (countError) {
          console.error('Error counting profiles with missing emails:', countError);
        }
        
        // Get all auth users to update profiles
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
        
        if (usersError) {
          console.error('Error fetching users:', usersError);
          return NextResponse.json(
            { success: false, error: 'Error fetching users', details: usersError },
            { status: 500 }
          );
        }
        
        // Get all existing profiles
        const { data: existingProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email');
        
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return NextResponse.json(
            { success: false, error: 'Error fetching profiles', details: profilesError },
            { status: 500 }
          );
        }
        
        const profilesById = new Map();
        existingProfiles?.forEach(profile => {
          profilesById.set(profile.id, profile);
        });
        
        const updatedCount = { profiles: 0, emails: 0, created: 0 };
        
        // Process all users
        for (const userItem of users.users) {
          const profileExists = profilesById.has(userItem.id);
          
          if (profileExists) {
            // Update existing profile
            const profile = profilesById.get(userItem.id);
            if (!profile.email && userItem.email) {
              // Update email if missing
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ email: userItem.email, updated_at: new Date().toISOString() })
                .eq('id', userItem.id);
              
              if (updateError) {
                console.error(`Error updating email for user ${userItem.id}:`, updateError);
              } else {
                updatedCount.emails++;
              }
            }
            updatedCount.profiles++;
          } else {
            // Create new profile
            const { error: insertError } = await supabase
              .from('profiles')
              .insert([{
                id: userItem.id,
                email: userItem.email || '',
                first_name: userItem.user_metadata?.first_name || 'User',
                last_name: userItem.user_metadata?.last_name || 'Profile',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }]);
            
            if (insertError) {
              console.error(`Error creating profile for user ${userItem.id}:`, insertError);
            } else {
              updatedCount.created++;
            }
          }
        }
        
        return NextResponse.json({
          success: true,
          message: `Fixed profile emails. Updated ${updatedCount.emails} emails and created ${updatedCount.created} new profiles.`,
          details: {
            missingEmailCount: missingEmailCount || 'unknown',
            totalUsers: users.users.length,
            existingProfiles: existingProfiles?.length || 0,
            updatedProfiles: updatedCount.profiles,
            updatedEmails: updatedCount.emails,
            createdProfiles: updatedCount.created
          }
        });
      } catch (sqlError) {
        console.error('Error processing users:', sqlError);
        return NextResponse.json(
          { success: false, error: 'Error processing users', details: sqlError },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Missing parameters. Provide userId or all=true'
    }, { status: 400 });
  } catch (error) {
    console.error('Error in fixProfileEmail API:', error);
    return NextResponse.json(
      { success: false, error: 'API error', message: (error as Error).message },
      { status: 500 }
    );
  }
} 