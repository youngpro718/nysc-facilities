const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://fmymhtuiqzhupjyopfvi.supabase.co', 'sb_publishable_BpZQ2LlObzVYqbzrQAF0Cw_4RkiTPAj');

async function testDelete() {
  const { data: room, error: fetchError } = await supabase
    .from('rooms')
    .select('*')
    .eq('room_number', '687')
    .single();

  if (fetchError) {
    console.error('Error fetching room:', fetchError);
    return;
  }
  if (!room) {
    console.error('Room not found');
    return;
  }
  console.log('Found room:', room.id);

  // Try to delete child records manually to see what fails
  const id = room.id;
  
  console.log('1. court_rooms...');
  const { data: courtRoom } = await supabase.from("court_rooms").select("id").eq("room_id", id).maybeSingle();
  if (courtRoom) {
      console.log('  Found courtRoom:', courtRoom.id);
      const res1 = await supabase.from("room_shutdowns").delete().eq("court_room_id", courtRoom.id);
      console.log('  room_shutdowns res:', res1.error);
      const res2 = await supabase.from("court_attendance").delete().eq("room_id", id);
      console.log('  court_attendance res:', res2.error);
  } else {
      console.log('  No court room found');
  }

  const r1 = await supabase.from("court_assignments").delete().eq("room_id", id);
  console.log('court_assignments:', r1.error);
  
  const r2 = await supabase.from("court_rooms").delete().eq("room_id", id);
  console.log('court_rooms:', r2.error);
  
  const r3 = await supabase.from("room_connections").delete().or(`from_space_id.eq.${id},to_space_id.eq.${id}`);
  console.log('room_connections:', r3.error);
  
  const r4 = await supabase.from("maintenance_tickets").delete().eq("room_id", id);
  console.log('maintenance_tickets:', r4.error);
  
  const r5 = await supabase.from("lighting_fixtures").delete().eq("room_id", id);
  console.log('lighting_fixtures:', r5.error);
  
  const r6 = await supabase.from("room_inventory").delete().eq("room_id", id);
  console.log('room_inventory:', r6.error);
  
  const r7 = await supabase.from("floorplan_objects").delete().eq("room_id", id);
  console.log('floorplan_objects:', r7.error);

  console.log('Deleting room...');
  const { error: roomError } = await supabase
    .from("rooms")
    .delete()
    .eq("id", id);

  console.log('Room delete error:', roomError);
}
testDelete();
