/**
 * Script to clear courtroom photos from the database
 * 
 * How to use:
 * 1. Open the browser console (F12 or right-click > Inspect > Console)
 * 2. Copy and paste this entire script into the console
 * 3. Press Enter to run it
 * 4. Follow the prompts to clear photos for a specific room or all rooms
 */

(async function() {
  // Check if we're on the right page
  if (!window.supabase) {
    console.error('Supabase client not found. Make sure you run this on a page where Supabase is initialized.');
    return;
  }

  console.log('Courtroom Photos Cleanup Utility');
  console.log('--------------------------------');
  
  try {
    // Get all rooms with courtroom_photos
    const { data: rooms, error } = await window.supabase
      .from('rooms')
      .select('id, name, room_number, courtroom_photos')
      .eq('room_type', 'courtroom')
      .not('courtroom_photos', 'is', null);
    
    if (error) {
      throw error;
    }
    
    if (!rooms || rooms.length === 0) {
      console.log('No courtrooms with photos found.');
      return;
    }
    
    console.log(`Found ${rooms.length} courtrooms with photos:`);
    rooms.forEach((room, index) => {
      console.log(`${index + 1}. ${room.name || room.room_number || room.id}`);
    });
    
    const clearAll = confirm('Do you want to clear photos for ALL courtrooms? Click Cancel to select a specific room.');
    
    if (clearAll) {
      // Clear all rooms
      const { error: updateError } = await window.supabase
        .from('rooms')
        .update({ courtroom_photos: { judge_view: null, audience_view: null } })
        .eq('room_type', 'courtroom');
      
      if (updateError) {
        throw updateError;
      }
      
      console.log('Successfully cleared photos for all courtrooms!');
      alert('Successfully cleared photos for all courtrooms! Refreshing page...');
      window.location.reload();
    } else {
      // Let user select a room
      const roomIndex = prompt(`Enter the number of the room to clear (1-${rooms.length}):`);
      if (!roomIndex || isNaN(parseInt(roomIndex)) || parseInt(roomIndex) < 1 || parseInt(roomIndex) > rooms.length) {
        console.log('Invalid selection. Operation cancelled.');
        return;
      }
      
      const selectedRoom = rooms[parseInt(roomIndex) - 1];
      
      const { error: updateError } = await window.supabase
        .from('rooms')
        .update({ courtroom_photos: { judge_view: null, audience_view: null } })
        .eq('id', selectedRoom.id);
      
      if (updateError) {
        throw updateError;
      }
      
      console.log(`Successfully cleared photos for room: ${selectedRoom.name || selectedRoom.room_number || selectedRoom.id}`);
      alert(`Successfully cleared photos for room: ${selectedRoom.name || selectedRoom.room_number || selectedRoom.id}! Refreshing page...`);
      window.location.reload();
    }
  } catch (error) {
    console.error('Error clearing courtroom photos:', error);
    alert(`Error clearing courtroom photos: ${error.message || 'Unknown error'}`);
  }
})();
