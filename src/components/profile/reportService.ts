import { supabase } from "@/integrations/supabase/client";

export async function generateRoomReport() {
  const { data, error } = await supabase
    .from("room_health_overview")
    .select("*");

  if (error) throw error;
  return data;
}

export async function generateKeyInventoryReport() {
  const { data: stats, error } = await supabase
    .from("key_inventory_stats")
    .select("*");

  if (error) throw error;
  return stats;
}
