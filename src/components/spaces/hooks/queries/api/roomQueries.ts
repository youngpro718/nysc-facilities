
import { supabase } from "@/integrations/supabase/client";

export const fetchRoomsData = async (buildingId?: string, floorId?: string) => {
  console.log("Fetching rooms with filters:", { buildingId, floorId });
  
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
      console.error('Error fetching rooms:', roomsError);
      throw roomsError;
    }
    
    // Now fetch the floor and building data separately
    if (roomsData && roomsData.length > 0) {
      // Extract floor IDs from rooms, filtering out any nulls
      const floorIds = [...new Set(roomsData.map((room: any) => room.floor_id))].filter(Boolean);
      
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
        console.error('Error fetching floors:', floorsError);
        throw floorsError;
      }
      
      // Create a map of floor data for quick lookup
      const floorMap: Record<string, any> = {};
      floorsData?.forEach((floor: any) => {
        floorMap[floor.id] = floor;
      });
      
      // Attach floor and building data to each room
      const enrichedRoomsData = roomsData.map((room: any) => ({
        ...room,
        floors: room.floor_id && floorMap[room.floor_id] ? floorMap[room.floor_id] : null
      }));
      
      // Filter by building if specified
      let filteredRooms = enrichedRoomsData;
      if (buildingId && buildingId !== 'all') {
        filteredRooms = enrichedRoomsData.filter((room: any) => 
          room.floors?.buildings?.id === buildingId
        );
      }
      
      return { data: filteredRooms, error: null };
    }
    
    return { data: roomsData || [], error: null };
  } catch (error) {
    console.error('Error in fetchRoomsData:', error);
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
  
  // Now handle the space connections separately to avoid foreign key issues
  // First, fetch the basic connection data
  const { data: connections, error: connectionsError } = await supabase
    .from('space_connections')
    .select(`
      id,
      from_space_id,
      to_space_id,
      connection_type,
      direction,
      status
    `)
    .in('from_space_id', roomIds)
    .eq('status', 'active');
  
  let connectionsResult = { data: [], error: connectionsError };
  
  // If we have connections, fetch the connected spaces details
  if (!connectionsError && connections && connections.length > 0) {
    // Get all the to_space_ids to fetch their details
    const toSpaceIds = [...new Set(connections.map(conn => conn.to_space_id))].filter(Boolean);
    
    // Fetch the connected spaces from their respective tables
    // First try rooms table
    const { data: roomSpaces, error: roomsError } = await supabase
      .from('rooms')
      .select('id, name, room_number, room_type')
      .in('id', toSpaceIds);
      
    // Then try hallways table
    const { data: hallwaySpaces, error: hallwaysError } = await supabase
      .from('hallways')
      .select('id, name')
      .in('id', toSpaceIds);
      
    // Finally try doors table
    const { data: doorSpaces, error: doorsError } = await supabase
      .from('doors')
      .select('id, name')
      .in('id', toSpaceIds);
      
    // Define a type for our connected spaces
    type ConnectedSpace = {
      id: string;
      name: string;
      room_number?: string | null;
      room_type?: string | null;
      door_type?: string | null;
      type: 'room' | 'hallway' | 'door';
    };
    
    // Combine all results with type information
    const connectedSpaces: ConnectedSpace[] = [
      ...(roomSpaces || []).map(space => ({ 
        id: space.id, 
        name: space.name, 
        room_number: space.room_number, 
        room_type: space.room_type, 
        type: 'room' as const
      })),
      ...(hallwaySpaces || []).map(space => ({ 
        id: space.id, 
        name: space.name, 
        type: 'hallway' as const 
      })),
      ...(doorSpaces || []).map(space => ({ 
        id: space.id, 
        name: space.name, 
        type: 'door' as const 
      }))
    ];
    
    const spacesError = roomsError || hallwaysError || doorsError;
      
    if (!spacesError && connectedSpaces) {
      // Create a map for quick lookup
      const spacesMap: Record<string, any> = {};
      connectedSpaces.forEach((space: any) => {
        spacesMap[space.id] = space;
      });
      
      // Attach the connected space details to each connection
      const enrichedConnections = connections.map(conn => ({
        ...conn,
        to_spaces: spacesMap[conn.to_space_id] || null
      }));
      
      connectionsResult = { data: enrichedConnections, error: null };
    } else {
      console.error('Error fetching connected spaces:', spacesError);
      connectionsResult = { data: connections, error: spacesError };
    }
  }
  
  // Return all results in the same format as before
  return [
    occupantsResult,
    issuesResult,
    historyResult,
    lightingResult,
    connectionsResult
  ];
};
