import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET all users
export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, avatar_url')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }
    
    // Map to the format expected by the frontend
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.full_name || 'Unknown',
      email: user.email,
      role: user.role || 'user',
      avatarUrl: user.avatar_url
    }));
    
    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 