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
    
    // STEP 1: Get current photos to know what to delete from storage
    let query = supabase.from('rooms').select('id, courtroom_photos');
    
    // If roomId is provided, only get that specific room
    if (roomId) {
      query = query.eq('id', roomId);
    } else {
      // Otherwise get all courtrooms
      query = query.eq('room_type', 'courtroom');
    }
    
    const { data: rooms, error: roomsError } = await query;
    
    if (roomsError) {
      console.error('API Error fetching rooms:', roomsError);
      return NextResponse.json(
        { error: 'Database Error', message: roomsError.message },
        { status: 500 }
      );
    }
    
    // STEP 2: Process each room with photos
    const results = { success: true, deleted: 0, errors: [] };
    
    for (const room of rooms || []) {
      if (!room.courtroom_photos) continue;
      
      const photos = room.courtroom_photos;
      const filesToDelete = [];
      
      // Extract file paths from photo URLs
      if (photos.judge_view) {
        try {
          const judgeUrl = new URL(photos.judge_view);
          const pathParts = judgeUrl.pathname.split('/');
          const objectIndex = pathParts.indexOf('object');
          const publicIndex = pathParts.indexOf('public');
          
          if (objectIndex !== -1 && publicIndex !== -1 && publicIndex > objectIndex) {
            const bucketName = pathParts[publicIndex + 1];
            const filePath = pathParts.slice(publicIndex + 2).join('/');
            
            console.log(`Found judge view photo in bucket ${bucketName}, path: ${filePath}`);
            filesToDelete.push({ bucketName, filePath });
          }
        } catch (e) {
          console.error('Error parsing judge view URL:', e);
          results.errors.push(`Failed to parse judge view URL for room ${room.id}`);
        }
      }
      
      if (photos.audience_view) {
        try {
          const audienceUrl = new URL(photos.audience_view);
          const pathParts = audienceUrl.pathname.split('/');
          const objectIndex = pathParts.indexOf('object');
          const publicIndex = pathParts.indexOf('public');
          
          if (objectIndex !== -1 && publicIndex !== -1 && publicIndex > objectIndex) {
            const bucketName = pathParts[publicIndex + 1];
            const filePath = pathParts.slice(publicIndex + 2).join('/');
            
            console.log(`Found audience view photo in bucket ${bucketName}, path: ${filePath}`);
            filesToDelete.push({ bucketName, filePath });
          }
        } catch (e) {
          console.error('Error parsing audience view URL:', e);
          results.errors.push(`Failed to parse audience view URL for room ${room.id}`);
        }
      }
      
      // STEP 3: Delete files from storage
      for (const file of filesToDelete) {
        try {
          const { error: deleteError } = await supabase.storage
            .from(file.bucketName)
            .remove([file.filePath]);
            
          if (deleteError) {
            console.error(`Error deleting file ${file.filePath}:`, deleteError);
            results.errors.push(`Failed to delete file ${file.filePath}: ${deleteError.message}`);
          } else {
            results.deleted++;
          }
        } catch (e) {
          console.error(`Error in storage deletion:`, e);
          results.errors.push(`Unexpected error deleting file: ${e.message}`);
        }
      }
      
      // STEP 4: Update the database to clear the photo references
      const { error: updateError } = await supabase
        .from('rooms')
        .update({ courtroom_photos: { judge_view: null, audience_view: null } })
        .eq('id', room.id);
        
      if (updateError) {
        console.error(`Error updating room ${room.id}:`, updateError);
        results.errors.push(`Failed to update room ${room.id}: ${updateError.message}`);
        results.success = false;
      }
    }
    
    return NextResponse.json({
      success: results.success && results.errors.length === 0,
      message: roomId 
        ? `Cleared photos for room ${roomId}` 
        : 'Cleared photos for all courtrooms',
      stats: {
        filesDeleted: results.deleted,
        errors: results.errors
      }
    });
  } catch (error: any) {
    console.error('API Exception clearing courtroom photos:', error);
    return NextResponse.json(
      { error: 'Server Error', message: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
