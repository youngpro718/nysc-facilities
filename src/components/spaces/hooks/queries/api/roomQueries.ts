
import { supabase } from "@/integrations/supabase/client";

export const fetchRoomsData = async (buildingId?: string, floorId?: string) => {
  console.log("Fetching rooms with filters:", { buildingId, floorId });
  
  let query = supabase
    .from('rooms')
    .select(`
      id,
      name,
      room_number,
      room_type,
      description,
      status,
      floor_id,

      is_storage,
      storage_capacity,
      storage_type,
      storage_notes,
      phone_number,
      created_at,
      current_function,
      function_change_date,
      previous_functions,
      courtroom_photos,
      floors!rooms_floor_id_fkey!inner (
        id,
        name,
        buildings!floors_building_id_fkey!inner (
          id,
          name
        )
      ),
      parent_room_id
    `);


  // Apply building filter if specified
  if (buildingId && buildingId !== 'all') {
    // Fetch floor IDs for the given building
    const { data: floorsData, error: floorsError } = await supabase
      .from('floors')
      .select('id')
      .eq('building_id', buildingId);
    if (floorsError) {
      console.error('Error fetching floors for building filter:', floorsError);
      throw floorsError;
    }
    const floorIds = (floorsData || []).map((floor: any) => floor.id);
    if (floorIds.length > 0) {
      query = query.in('floor_id', floorIds);
    } else {
      // No floors for this building, so no rooms will match
      return { data: [], error: null };
    }
  }

  // Apply floor filter if specified
  if (floorId && floorId !== 'all') {
    query = query.eq('floor_id', floorId);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching rooms:', error);
    throw error;
  }

  return { data, error };
};

export const fetchRelatedRoomData = async (roomIds: string[]) => {
  if (roomIds.length === 0) {
    return [
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null }
    ];
  }
  
  return Promise.all([
    // Fetch occupants
    supabase
      .from('occupant_room_assignments')
      .select(`
        room_id,
        assignment_type,
        is_primary,
        schedule,
        occupants!fk_occupant_room_assignments_occupant (
          id,
          first_name,
          last_name,
          title
        )
      `)
      .in('room_id', roomIds),

    // Fetch issues
    supabase
      .from('issues')
      .select('id, title, status, type, priority, created_at, room_id')
      .in('room_id', roomIds),

    // Fetch room history
    supabase
      .from('room_history')
      .select('room_id, change_type, previous_values, new_values, created_at')
      .in('room_id', roomIds),

    // Fetch lighting fixtures
    supabase
      .from('lighting_fixture_details')
      .select('*')
      .in('space_id', roomIds),
      
    // Space connections feature removed; return empty result to maintain tuple structure
    Promise.resolve({ data: [], error: null })
  ]);
};
