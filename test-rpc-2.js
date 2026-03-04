require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://fmymhtuiqzhupjyopfvi.supabase.co', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function testRpc() {
  const { data, error } = await supabase.rpc('delete_room_cascade', { p_room_id: '251ae4b9-6120-4466-a4c3-16e5b285a4ee' });
  console.log(data, error);
}
testRpc();
