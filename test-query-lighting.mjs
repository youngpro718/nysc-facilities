import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://fmymhtuiqzhupjyopfvi.supabase.co', 'sb_publishable_BpZQ2LlObzVYqbzrQAF0Cw_4RkiTPAj');

async function testQuery() {
   const res = await supabase.from("room_lighting_status").select("*").eq("room_id", "251ae4b9-6120-4466-a4c3-16e5b285a4ee");
   console.log('lighting status rows:', res.data);
   console.log('lighting status err:', res.error);
}
testQuery();
