
import { supabase } from "@/integrations/supabase/client";
import { RoomRelocation, ActiveRelocation } from "../../types/relocationTypes";

export const fetchRelocations = async (): Promise<RoomRelocation[]> => {
  const { data, error } = await supabase
    .from('room_relocations')
    .select(`
      *,
      original_room:rooms!original_room_id(
        name,
        room_number,
        floors(
          name,
          buildings(name)
        )
      ),
      temporary_room:rooms!temporary_room_id(
        name,
        room_number,
        floors(
          name,
          buildings(name)
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching relocations:', error);
    throw error;
  }

  return (data || []).map(relocation => ({
    ...relocation,
    original_room_name: relocation.original_room?.name || '',
    original_room_number: relocation.original_room?.room_number || '',
    temporary_room_name: relocation.temporary_room?.name || '',
    temporary_room_number: relocation.temporary_room?.room_number || '',
    building_name: relocation.original_room?.floors?.buildings?.name || '',
    floor_name: relocation.original_room?.floors?.name || ''
  }));
};

export const fetchActiveRelocations = async (): Promise<ActiveRelocation[]> => {
  const { data, error } = await supabase
    .from('active_relocations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active relocations:', error);
    throw error;
  }

  return (data || []).map(relocation => ({
    ...relocation,
    progress_percentage: relocation.progress_percentage || 0,
    days_active: relocation.days_active || 0,
    total_days: relocation.total_days || 0
  }));
};

export const fetchRelocationById = async (id: string): Promise<RoomRelocation | null> => {
  const { data, error } = await supabase
    .from('room_relocations')
    .select(`
      *,
      original_room:rooms!original_room_id(
        name,
        room_number,
        floors(
          name,
          buildings(name)
        )
      ),
      temporary_room:rooms!temporary_room_id(
        name,
        room_number,
        floors(
          name,
          buildings(name)
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching relocation:', error);
    throw error;
  }

  if (!data) return null;

  return {
    ...data,
    original_room_name: data.original_room?.name || '',
    original_room_number: data.original_room?.room_number || '',
    temporary_room_name: data.temporary_room?.name || '',
    temporary_room_number: data.temporary_room?.room_number || '',
    building_name: data.original_room?.floors?.buildings?.name || '',
    floor_name: data.original_room?.floors?.name || ''
  };
};
