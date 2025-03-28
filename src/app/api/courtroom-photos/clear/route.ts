import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { roomId } = await request.json();
    
    // Create a Supabase client with the server context
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user to ensure they're authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to perform this action' },
        { status: 401 }
      );
    }
    
    // Log the operation for debugging
    console.log(`API: Clearing courtroom photos for room ${roomId || 'all'}`);
    
    let query = supabase.from('rooms').update({
      courtroom_photos: { judge_view: null, audience_view: null }
    });
    
    // If roomId is provided, only clear that specific room
    if (roomId) {
      query = query.eq('id', roomId);
    } else {
      // Otherwise clear all courtrooms
      query = query.eq('room_type', 'courtroom');
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('API Error clearing courtroom photos:', error);
      return NextResponse.json(
        { error: 'Database Error', message: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: roomId 
        ? `Successfully cleared photos for room ${roomId}` 
        : 'Successfully cleared photos for all courtrooms'
    });
  } catch (error: any) {
    console.error('API Exception clearing courtroom photos:', error);
    return NextResponse.json(
      { error: 'Server Error', message: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
