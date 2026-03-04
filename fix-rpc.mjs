import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('='))
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_string: `
      CREATE OR REPLACE FUNCTION get_table_columns(p_table text) RETURNS jsonb AS $$
      BEGIN
        RETURN (SELECT jsonb_agg(column_name) FROM information_schema.columns WHERE table_name = p_table);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
  });
  console.log('Setup result:', data, error);
}

main();
