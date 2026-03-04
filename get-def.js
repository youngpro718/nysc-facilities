import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('='))
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function getDef() {
  const { data, error } = await supabase.rpc('delete_room_cascade', { p_room_id: '251ae4b9-6120-4466-a4c3-16e5b285a4ee' });
  console.log('Result:', data);
  console.log('Error:', error);
}
getDef();
