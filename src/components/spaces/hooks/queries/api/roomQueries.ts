
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
      parent_room_id,
      is_storage,
      storage_capacity,
      storage_type,
      storage_notes,
      phone_number,
      created_at,
      current_function,
      function_change_date,
      previous_functions,
      floors!inner (
        id,
        name,
        buildings!inner (
          id,
          name
        )
      ),
      parent_room:parent_room_id (
        name
      )
    `);

  // Apply building filter if specified
  if (buildingId && buildingId !== 'all') {
    query = query.eq('floors.buildings.id', buildingId);
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
      
    // Fetch space connections with detailed to_space information
    supabase
      .from('space_connections')
      .select(`
        id,
        from_space_id,
        to_space_id,
        connection_type,
        direction,
        status,
        to_space:to_space_id (
          id,
          name,
          type
        )
      `)
      .in('from_space_id', roomIds)
      .eq('status', 'active')
  ]);
};
