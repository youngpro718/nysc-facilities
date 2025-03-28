/**
 * Script to delete a specific courtroom photo from Supabase storage
 * 
 * Usage:
 * 1. Set your Supabase URL and anon key below
 * 2. Run this script with Node.js:
 *    node delete-courtroom-photo.js
 */

// Import required packages
// If you don't have these installed, run:
// npm install @supabase/supabase-js dotenv

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase URL and anon key
// These should be in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// The room ID and file path from the URL
const roomId = 'ea77794e-fd0f-4253-ab22-49a9d9a1689c';
const filePath = 'rooms/ea77794e-fd0f-4253-ab22-49a9d9a1689c/judge_view/a43r4ys593e_1743121429227.png';

async function deletePhoto() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL and key are required. Check your .env.local file.');
    process.exit(1);
  }

  console.log('Initializing Supabase client...');
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    console.log(`Deleting file: ${filePath}`);
    
    // Delete the file from storage
    const { data: deleteData, error: deleteError } = await supabase
      .storage
      .from('courtroom-photos')
      .remove([filePath]);
      
    if (deleteError) {
      console.error('Error deleting file:', deleteError);
    } else {
      console.log('File deleted successfully:', deleteData);
      
      // Now update the database to remove the reference
      console.log(`Updating room ${roomId} to remove photo reference...`);
      
      // First get the current courtroom_photos object
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('courtroom_photos')
        .eq('id', roomId)
        .single();
        
      if (roomError) {
        console.error('Error fetching room:', roomError);
        return;
      }
      
      console.log('Current courtroom_photos:', room.courtroom_photos);
      
      // Create an updated courtroom_photos object with judge_view set to null
      const updatedPhotos = {
        ...room.courtroom_photos,
        judge_view: null
      };
      
      console.log('Updated courtroom_photos:', updatedPhotos);
      
      // Update the database
      const { data: updateData, error: updateError } = await supabase
        .from('rooms')
        .update({ courtroom_photos: updatedPhotos })
        .eq('id', roomId);
        
      if (updateError) {
        console.error('Error updating room:', updateError);
      } else {
        console.log('Room updated successfully');
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
deletePhoto()
  .then(() => console.log('Done'))
  .catch(err => console.error('Fatal error:', err));
