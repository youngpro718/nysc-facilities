import { supabase } from '@/lib/supabase';

interface WaterCoolerUpdate {
  count: number;
  notes: string | null;
}

export async function updateRoomWaterCoolers(roomId: string, update: WaterCoolerUpdate) {
  const { error } = await supabase
    .from('rooms')
    .update({
      has_water_cooler: update.count > 0,
      water_cooler_count: update.count,
      water_cooler_notes: update.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', roomId);
  if (error) throw error;
}

export async function updateCommonAreaWaterCoolers(commonAreaId: string, update: WaterCoolerUpdate) {
  const { error } = await supabase
    .from('common_areas')
    .update({
      water_cooler_count: update.count,
      water_cooler_notes: update.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commonAreaId);
  if (error) throw error;
}
