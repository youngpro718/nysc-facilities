import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://fmymhtuiqzhupjyopfvi.supabase.co', 'sb_publishable_BpZQ2LlObzVYqbzrQAF0Cw_4RkiTPAj');

async function testRpc() {
  const { data, error } = await supabase.rpc('get_foreign_keys');
  console.log('RPC error:', error);
}
testRpc();
