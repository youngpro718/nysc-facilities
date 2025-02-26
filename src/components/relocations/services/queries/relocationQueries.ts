
import { supabase } from "@/integrations/supabase/client";
import { RoomRelocation, ActiveRelocation } from "../../types/relocationTypes";

export async function fetchRelocations(
  status?: string,
  buildingId?: string,
  floorId?: string,
  startDate?: string,
  endDate?: string
) {
  let query = supabase
    .from('room_relocations')
    .select(`
      *,
      original_room:original_room_id (
        id,
        name,
        room_number,
        floor_id,
        floors!inner (
          id,
          name,
          buildings!inner (
            id,
            name
          )
        )
      ),
      temporary_room:temporary_room_id (
        id,
        name,
        room_number,
        floor_id,
        floors!inner (
          id,
          name,
          buildings!inner (
            id,
            name
          )
        )
      )
    `);

  // Apply filters
  if (status) {
    query = query.eq('status', status);
  }

  if (startDate) {
    query = query.gte('start_date', startDate);
  }

  if (endDate) {
    query = query.lte('expected_end_date', endDate);
  }

  if (buildingId) {
    query = query.or(`original_room.floors.buildings.id.eq.${buildingId},temporary_room.floors.buildings.id.eq.${buildingId}`);
  }

  if (floorId) {
    query = query.or(`original_room.floor_id.eq.${floorId},temporary_room.floor_id.eq.${floorId}`);
  }

  const { data, error } = await query.order('start_date', { ascending: false });

  if (error) {
    console.error('Error fetching relocations:', error);
    throw error;
  }

  return data as RoomRelocation[];
}

export async function fetchActiveRelocations() {
  const { data, error } = await supabase
    .from('active_relocations')
    .select('*')
    .order('start_date', { ascending: false });

  if (error) {
    console.error('Error fetching active relocations:', error);
    throw error;
  }

  return data as ActiveRelocation[];
}

export async function fetchRelocationById(id: string) {
  const { data, error } = await supabase
    .from('room_relocations')
    .select(`
      *,
      original_room:original_room_id (
        id,
        name,
        room_number,
        floor_id,
        floors!inner (
          id,
          name,
          buildings!inner (
            id,
            name
          )
        )
      ),
      temporary_room:temporary_room_id (
        id,
        name,
        room_number,
        floor_id,
        floors!inner (
          id,
          name,
          buildings!inner (
            id,
            name
          )
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching relocation with ID ${id}:`, error);
    throw error;
  }

  return data as RoomRelocation;
}
