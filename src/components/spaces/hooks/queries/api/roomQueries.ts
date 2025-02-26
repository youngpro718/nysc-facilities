
import { supabase } from "@/integrations/supabase/client";

export const fetchRoomsData = async (buildingId?: string, floorId?: string) => {
  console.log("Fetching rooms with filters:", { buildingId, floorId });
  
  let query = supabase
    .from('new_spaces')
    .select(`
      id,
      name,
      room_number,
      status,
      floor_id,
      type,
      position,
      size,
      room_properties (
        room_type,
        current_function,
        is_storage,
        storage_type,
        storage_capacity,
        phone_number,
        current_occupancy,
        parent_room_id
      ),
      floors!inner ( 
        id,
        name,
        buildings!inner (
          id,
          name
        )
      )
    `)
    .eq('type', 'room');

  // Apply building filter if specified
  if (buildingId && buildingId !== 'all') {
    query = query.eq('floors.buildings.id', buildingId);
  }

  // Apply floor filter if specified
  if (floorId && floorId !== 'all') {
    query = query.eq('floor_id', floorId);
  }

  const { data: rooms, error } = await query;
  
  if (error) {
    console.error('Error fetching rooms:', error);
    throw error;
  }

  // Transform the data with typed room properties
  const transformedData = rooms?.map(room => ({
    ...room,
    room_properties: room.room_properties || {
      room_type: 'office',
      current_function: null,
      is_storage: false,
      storage_type: null,
      storage_capacity: null,
      phone_number: null,
      current_occupancy: 0,
      parent_room_id: null
    }
  }));

  return { data: transformedData, error };
};

export const fetchRelatedRoomData = async (roomIds: string[]) => {
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
      .in('space_id', roomIds)
  ]);
};
