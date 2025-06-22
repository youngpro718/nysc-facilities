
import { supabase } from "@/integrations/supabase/client";
import { RoomRelocation, ActiveRelocation, RelocationStatus } from "../../types/relocationTypes";

export async function fetchRelocations(status?: RelocationStatus): Promise<RoomRelocation[]> {
  let query = supabase
    .from('room_relocations')
    .select(`
      *,
      original_room:rooms!original_room_id(name, room_number),
      temporary_room:rooms!temporary_room_id(name, room_number),
      building:rooms!original_room_id(floor:floors(building:buildings(name)))
    `);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching relocations:', error);
    throw error;
  }

  return (data || []).map(item => ({
    ...item,
    original_room_name: item.original_room?.name,
    original_room_number: item.original_room?.room_number,
    temporary_room_name: item.temporary_room?.name,
    temporary_room_number: item.temporary_room?.room_number,
    building_name: item.building?.floor?.building?.name,
    floor_name: item.building?.floor?.name
  })) as RoomRelocation[];
}

export async function fetchActiveRelocations(): Promise<ActiveRelocation[]> {
  const { data, error } = await supabase
    .from('active_relocations')
    .select('*');

  if (error) {
    console.error('Error fetching active relocations:', error);
    throw error;
  }

  return (data || []).map(item => ({
    ...item,
    building_name: item.original_building_name || '',
    floor_name: item.original_floor_name || '',
    original_room_id: item.original_room_id || '',
    temporary_room_id: item.temporary_room_id || '',
    created_by: item.created_by || ''
  })) as ActiveRelocation[];
}

export async function fetchRelocationById(id: string): Promise<RoomRelocation> {
  const { data, error } = await supabase
    .from('room_relocations')
    .select(`
      *,
      original_room:rooms!original_room_id(name, room_number),
      temporary_room:rooms!temporary_room_id(name, room_number),
      building:rooms!original_room_id(floor:floors(building:buildings(name)))
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching relocation with ID ${id}:`, error);
    throw error;
  }

  return {
    ...data,
    original_room_name: data.original_room?.name,
    original_room_number: data.original_room?.room_number,
    temporary_room_name: data.temporary_room?.name,
    temporary_room_number: data.temporary_room?.room_number,
    building_name: data.building?.floor?.building?.name,
    floor_name: data.building?.floor?.name
  } as RoomRelocation;
}
