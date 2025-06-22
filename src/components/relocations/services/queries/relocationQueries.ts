
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
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active relocations:', error);
    throw error;
  }

  // Calculate progress and days for active relocations
  return (data || []).map(relocation => {
    const startDate = new Date(relocation.start_date);
    const endDate = new Date(relocation.end_date);
    const now = new Date();
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysActive = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const progressPercentage = Math.min(100, Math.max(0, (daysActive / totalDays) * 100));

    return {
      ...relocation,
      original_room_id: relocation.original_room_id,
      temporary_room_id: relocation.temporary_room_id,
      created_by: relocation.created_by,
      building_name: relocation.original_room?.floors?.buildings?.name || '',
      floor_name: relocation.original_room?.floors?.name || '',
      original_room_name: relocation.original_room?.name || '',
      original_room_number: relocation.original_room?.room_number || '',
      temporary_room_name: relocation.temporary_room?.name || '',
      temporary_room_number: relocation.temporary_room?.room_number || '',
      progress_percentage: progressPercentage,
      days_active: Math.max(0, daysActive),
      total_days: totalDays
    };
  });
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
