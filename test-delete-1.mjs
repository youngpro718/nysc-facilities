import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://fmymhtuiqzhupjyopfvi.supabase.co', 'sb_publishable_BpZQ2LlObzVYqbzrQAF0Cw_4RkiTPAj');

async function testDelete() {
   const { data: courtRoom } = await supabase
    .from("court_rooms")
    .select("id")
    .eq("room_id", "251ae4b9-6120-4466-a4c3-16e5b285a4ee")
    .maybeSingle();
    console.log('court_room:', courtRoom);
    if (courtRoom) {
      const res = await supabase.from("room_lighting_status").delete().eq("court_room_id", courtRoom.id);
      console.log('lighting status err:', res.error);
    }
}
testDelete();
