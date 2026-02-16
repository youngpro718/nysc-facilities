// @ts-nocheck
import { supabase } from "@/lib/supabase";
import { logger } from '@/lib/logger';

export const fetchRoomsData = async (buildingId?: string, floorId?: string) => {
  logger.debug("Fetching rooms with filters:", { buildingId, floorId });
  
  try {
    // Query directly from the rooms table instead of the new_spaces view
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
        parent_room_id
      `)

    // Apply floor filter if specified
    if (floorId && floorId !== 'all') {
      query = query.eq('floor_id', floorId);
    }
    
    // Execute the query to get rooms
    const { data: roomsData, error: roomsError } = await query;
    
    if (roomsError) {
      logger.error('Error fetching rooms:', roomsError);
      throw roomsError;
    }
    
    // Now fetch the floor and building data separately
    if (roomsData && roomsData.length > 0) {
      // Extract floor IDs from rooms, filtering out any nulls
      const floorIds = [...new Set(roomsData.map((room: Record<string, unknown>) => room.floor_id))].filter(Boolean);
      
      if (floorIds.length === 0) {
        return { data: roomsData, error: null };
      }
      
      // Fetch floor data with building information
      const { data: floorsData, error: floorsError } = await supabase
        .from('floors')
        .select(`
          id,
          name,
          buildings!floors_building_id_fkey (id, name)
        `)
        .in('id', floorIds);
        
      if (floorsError) {
        logger.error('Error fetching floors:', floorsError);
        throw floorsError;
      }
      
      // Create a map of floor data for quick lookup
      const floorMap: Record<string, unknown> = {};
      floorsData?.forEach((floor: Record<string, unknown>) => {
        floorMap[floor.id] = floor;
      });
      
      // Attach floor and building data to each room
      const enrichedRoomsData = roomsData.map((room: Record<string, unknown>) => ({
        ...room,
        floors: room.floor_id && floorMap[room.floor_id] ? floorMap[room.floor_id] : null
      }));
      
      // Filter by building if specified
      let filteredRooms = enrichedRoomsData;
      if (buildingId && buildingId !== 'all') {
        filteredRooms = enrichedRoomsData.filter((room: Record<string, unknown>) => 
          room.floors?.buildings?.id === buildingId
        );
      }
      
      return { data: filteredRooms, error: null };
    }
    
    return { data: roomsData || [], error: null };
  } catch (error) {
    logger.error('Error in fetchRoomsData:', error);
    return { data: [], error };
  }
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
  
  // First, execute the first four queries in parallel
  const [
    occupantsResult,
    issuesResult,
    historyResult,
    lightingResult
  ] = await Promise.all([
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
      .select('id, title, status, issue_type, priority, created_at, room_id')
      .in('room_id', roomIds),

    // Fetch room history
    supabase
      .from('room_history')
      .select('room_id, change_type, previous_values, new_values, created_at')
      .in('room_id', roomIds),

    // Fetch lighting fixtures
    supabase
      .from('lighting_fixtures')
      .select('*')
      .in('space_id', roomIds)
  ]);
  
  // Space connections are disabled since space_connections table doesn't exist
  const connectionsResult = { data: [], error: null };
  
  // Return all results in the same format as before
  return [
    occupantsResult,
    issuesResult,
    historyResult,
    lightingResult,
    connectionsResult
  ];
};
