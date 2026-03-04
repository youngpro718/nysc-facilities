import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
const supabaseKey = Deno.env.get("VITE_SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDef() {
  console.log("Fetching function definition...");
  const { data, error } = await supabase.rpc('get_table_columns_by_name', { t_name: 'delete_room_cascade' }); // This is a dummy call just to see if we can connect
  console.log(data, error);
}

checkDef();
