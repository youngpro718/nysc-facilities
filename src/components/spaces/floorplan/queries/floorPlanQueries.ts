
import { supabase } from "@/integrations/supabase/client";

export async function fetchFloorPlanLayers(floorId: string) {
  const { data, error } = await supabase
    .from('floorplan_layers')
    .select('*')
    .eq('floor_id', floorId)
    .order('order_index');
    
  if (error) throw error;
  return data || [];
}

export async function fetchFloorPlanObjects(floorId: string) {
  console.log("Fetching floor plan objects for floor:", floorId);
  
  // Fetch rooms
  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select('id, name, room_number, room_type, status, position, size, rotation, parent_room_id, floor_id')
    .eq('floor_id', floorId)
    .eq('status', 'active');

  if (roomsError) throw roomsError;

  const roomObjects = (rooms || []).map(room => ({
    id: room.id,
    name: room.name,
    room_number: room.room_number,
    type: 'room', 
    room_type: room.room_type,
    status: room.status,
    position: room.position,
    size: room.size,
    rotation: room.rotation,
    parent_room_id: room.parent_room_id,
    floor_id: room.floor_id,
    object_type: 'room' as const
  }));

  // Fetch spaces from new_spaces table (including hallways) with JOIN to hallway_properties
  const { data: newSpaces, error: newSpacesError } = await supabase
    .from('new_spaces')
    .select(`
      id, 
      name, 
      type, 
      status, 
      position, 
      size, 
      rotation, 
      properties, 
      room_number, 
      floor_id,
      hallway_properties:hallway_properties(
        section,
        traffic_flow,
        accessibility,
        emergency_route,
        maintenance_priority,
        capacity_limit
      )
    `)
    .eq('floor_id', floorId)
    .eq('status', 'active');

  if (newSpacesError) throw newSpacesError;
  
  console.log("Fetched new spaces:", newSpaces?.length || 0);

  // Fetch lighting fixtures for this floor
  const { data: lightingFixtures, error: lightingError } = await supabase
    .from('lighting_fixtures')
    .select(`
      id, 
      name, 
      status, 
      space_id, 
      position, 
      sequence_number,
      type,
      technology,
      maintenance_history,
      installation_date
    `)
    .eq('floor_id', floorId);

  if (lightingError) throw lightingError;
  
  // Group fixtures by space - with null checks to prevent TypeScript errors
  const fixturesBySpace: Record<string, any[]> = {};
  
  if (lightingFixtures && Array.isArray(lightingFixtures)) {
    lightingFixtures.forEach(fixture => {
      if (!fixture || !fixture.space_id) return;
      
      if (!fixturesBySpace[fixture.space_id]) {
        fixturesBySpace[fixture.space_id] = [];
      }
      fixturesBySpace[fixture.space_id].push(fixture);
    });
  }

  // Fetch space connections to determine hallway layout
  const { data: connections, error: connectionError } = await supabase
    .from('space_connections')
    .select(`
      id,
      from_space_id,
      to_space_id,
      connection_type,
      direction,
      hallway_position,
      status,
      is_transition_point,
      is_emergency_exit
    `)
    .eq('floor_id', floorId)
    .eq('status', 'active');

  if (connectionError) throw connectionError;

  // Extract hallways from new_spaces and merge hallway_properties data
  const hallwayObjects = (newSpaces || [])
    .filter(space => space && space.type === 'hallway')
    .map(hallway => {
      // Get hallway_properties data (from the joined table)
      const hallwayProps = hallway.hallway_properties?.[0] || {};
      
      // Define a type-safe way to check and access properties
      const getProperty = <T>(
        obj: Record<string, any> | null | undefined, 
        key: string, 
        fallback: T
      ): T => {
        if (!obj) return fallback;
        if (typeof obj !== 'object') return fallback;
        return (obj[key] as T) || fallback;
      };
      
      // Handle properties from both objects with type safety
      let properties: Record<string, any> = {};
      if (hallway.properties) {
        if (typeof hallway.properties === 'string') {
          try {
            properties = JSON.parse(hallway.properties);
          } catch {
            properties = {};
          }
        } else if (typeof hallway.properties === 'object' && hallway.properties !== null) {
          properties = hallway.properties;
        }
      }
      
      // Add lighting fixtures data
      const fixtures = hallway.id && fixturesBySpace[hallway.id] ? fixturesBySpace[hallway.id] : [];
      const functionalLights = fixtures.filter(f => f.status === 'functional').length;
      const totalLights = fixtures.length;

      // Find connections to this hallway to determine its layout
      // Use null coalescing to ensure we always have an array, even if connections is null
      const safeConnections = connections || [];
      const hallwayConnections = hallway.id ? safeConnections.filter(conn => 
        conn && (conn.from_space_id === hallway.id || conn.to_space_id === hallway.id)
      ) : [];
      
      // Get connected room IDs for this hallway
      const connectedSpaceIds = hallwayConnections.map(conn => 
        conn && conn.from_space_id === hallway.id ? conn.to_space_id : conn.from_space_id
      ).filter(Boolean);
      
      // Determine if hallway should be horizontal or vertical based on connections
      let hallwayOrientation = 'horizontal';
      
      // Get width and length properties if available
      let hallwayWidth = null;
      let hallwayLength = null;
      
      // Safely access properties
      if (hallwayProps && typeof hallwayProps === 'object') {
        hallwayWidth = hallwayProps.width || null;
      }
      
      if (properties && typeof properties === 'object') {
        if (!hallwayWidth) hallwayWidth = properties.width || null;
        hallwayLength = properties.length || null;
      }
      
      let suggestedWidth = hallwayWidth;
      let suggestedLength = hallwayLength;
      
      if (hallwayConnections.length >= 2) {
        // We have multiple connections - determine layout based on direction values
        const directions = hallwayConnections
          .map(conn => conn && conn.direction)
          .filter(Boolean);
        
        if (directions.includes('north') || directions.includes('south') || 
            directions.includes('up') || directions.includes('down')) {
          hallwayOrientation = 'vertical';
        }
      }
      
      // Calculate suggested hallway dimensions based on orientation and number of connections
      if (!suggestedWidth || !suggestedLength) {
        if (hallwayOrientation === 'horizontal') {
          suggestedWidth = Math.max(connectedSpaceIds.length * 150 + 100, 300); // Base width on number of connections
          suggestedLength = 50; // Standard hallway height/width
        } else {
          suggestedWidth = 50; // Standard hallway width
          suggestedLength = Math.max(connectedSpaceIds.length * 150 + 100, 300); // Base length on number of connections
        }
      }
      
      // Safely extract properties
      const section = getProperty(hallwayProps, 'section', 'connector');
      const trafficFlow = getProperty(hallwayProps, 'traffic_flow', 
                          getProperty(properties, 'traffic_flow', 
                          getProperty(properties, 'trafficFlow', 'two_way')));
      const accessibility = getProperty(hallwayProps, 'accessibility', 
                            getProperty(properties, 'accessibility', 'fully_accessible'));
      const emergencyRoute = getProperty(hallwayProps, 'emergency_route', 
                             getProperty(properties, 'emergency_route', 
                             getProperty(properties, 'emergencyRoute', 'not_designated')));
      const maintenancePriority = getProperty(hallwayProps, 'maintenance_priority', 
                                  getProperty(properties, 'maintenance_priority', 
                                  getProperty(properties, 'maintenancePriority', 'low')));
      const capacityLimit = getProperty(hallwayProps, 'capacity_limit', 
                            getProperty(properties, 'capacity_limit', 
                            getProperty(properties, 'capacityLimit', null)));
      
      // Merge properties from both sources, with hallway_properties taking precedence
      const mergedProperties = {
        ...(typeof properties === 'object' && properties !== null ? properties : {}),
        section,
        traffic_flow: trafficFlow,
        accessibility,
        emergency_route: emergencyRoute,
        maintenance_priority: maintenancePriority,
        capacity_limit: capacityLimit,
        width: suggestedWidth,
        length: suggestedLength,
        orientation: hallwayOrientation,
        // Add lighting data
        lighting_fixtures: fixtures,
        functional_lights: functionalLights,
        total_lights: totalLights,
        lighting_status: 
          totalLights === 0 ? 'unknown' :
          functionalLights === totalLights ? 'all_functional' :
          functionalLights === 0 ? 'all_non_functional' : 
          'partial_issues',
        // Add connection data
        connected_spaces: connectedSpaceIds,
        connection_count: connectedSpaceIds.length
      };

      // Determine size based on orientation and ensure size is properly typed
      let sizeObj: { width: number, height: number } = { width: 300, height: 50 };
      
      if (hallway.size) {
        // Handle string serialized size
        if (typeof hallway.size === 'string') {
          try {
            const parsedSize = JSON.parse(hallway.size);
            if (typeof parsedSize === 'object' && parsedSize !== null && 
                'width' in parsedSize && 'height' in parsedSize &&
                typeof parsedSize.width === 'number' && typeof parsedSize.height === 'number') {
              sizeObj = parsedSize;
            }
          } catch {
            sizeObj = hallwayOrientation === 'horizontal' 
              ? { width: suggestedWidth || 300, height: suggestedLength || 50 }
              : { width: suggestedLength || 50, height: suggestedWidth || 300 };
          }
        } 
        // Handle object size with improved type checking
        else if (typeof hallway.size === 'object' && hallway.size !== null) {
          // Check if it's an object with width and height properties
          if ('width' in hallway.size && 'height' in hallway.size) {
            const sizeWidth = typeof hallway.size.width === 'number' ? hallway.size.width : (suggestedWidth || 300);
            const sizeHeight = typeof hallway.size.height === 'number' ? hallway.size.height : (suggestedLength || 50);
            sizeObj = { width: sizeWidth, height: sizeHeight };
          } else {
            sizeObj = hallwayOrientation === 'horizontal' 
              ? { width: suggestedWidth || 300, height: suggestedLength || 50 }
              : { width: suggestedLength || 50, height: suggestedWidth || 300 };
          }
        }
      } else {
        sizeObj = hallwayOrientation === 'horizontal' 
          ? { width: suggestedWidth || 300, height: suggestedLength || 50 }
          : { width: suggestedLength || 50, height: suggestedWidth || 300 };
      }
      
      // If hallway is vertical, apply rotation
      const calculatedRotation = hallwayOrientation === 'vertical' ? 90 : 0;
      
      return {
        id: hallway.id,
        name: hallway.name,
        type: hallway.type,
        status: hallway.status,
        position: hallway.position,
        size: sizeObj,
        rotation: hallway.rotation !== null ? hallway.rotation : calculatedRotation,
        properties: mergedProperties,
        floor_id: hallway.floor_id,
        object_type: 'hallway' as const
      };
    });
    
  console.log("Extracted hallways:", hallwayObjects.length);

  // Fetch doors - safely handling missing columns
  const { data: doorsData, error: doorsError } = await supabase
    .from('new_spaces')
    .select(`
      id, 
      name, 
      type, 
      status, 
      position, 
      size, 
      floor_id, 
      properties
    `)
    .eq('floor_id', floorId)
    .eq('type', 'door')
    .eq('status', 'active');

  if (doorsError) throw doorsError;

  const doors = doorsData || [];
  
  // Find door connections
  const doorConnections = connections ? connections.filter(conn => 
    conn.connection_type === 'door' || 
    doors.some(door => door.id === conn.from_space_id || door.id === conn.to_space_id)
  ) : [];
  
  // Create a map of spaces that each door connects
  const doorConnectionMap: Record<string, { from: string, to: string }> = {};
  
  doorConnections.forEach(conn => {
    const doorId = doors.find(door => 
      door.id === conn.from_space_id || door.id === conn.to_space_id
    )?.id;
    
    if (doorId) {
      if (!doorConnectionMap[doorId]) {
        doorConnectionMap[doorId] = {
          from: conn.from_space_id === doorId ? '' : conn.from_space_id,
          to: conn.to_space_id === doorId ? '' : conn.to_space_id
        };
      }
    }
  });
  
  const doorObjects = doors.map(door => {
    // Safely extract properties with type checking
    let doorProperties: Record<string, any> = {};
    
    if (door.properties) {
      if (typeof door.properties === 'string') {
        try {
          doorProperties = JSON.parse(door.properties);
        } catch {
          doorProperties = {};
        }
      } else if (typeof door.properties === 'object' && door.properties !== null) {
        doorProperties = door.properties;
      }
    }
    
    // Safely extract security properties with fallbacks
    // Using type guards to ensure we're accessing properties correctly
    const securityLevel = typeof doorProperties === 'object' && doorProperties !== null && 
      'security_level' in doorProperties ? doorProperties.security_level : 'standard';
      
    const passkeyEnabled = typeof doorProperties === 'object' && doorProperties !== null && 
      'passkey_enabled' in doorProperties ? doorProperties.passkey_enabled : false;
    
    // Find connections for this door
    const doorConnection = doorConnectionMap[door.id];
    const connectsSpaces = doorConnection ? 
      `${doorConnection.from} to ${doorConnection.to}` : undefined;
    
    // Determine if this is a transition door
    const isTransitionDoor = doorConnections.some(conn => 
      (conn.from_space_id === door.id || conn.to_space_id === door.id) && 
      conn.is_transition_point
    );
    
    return {
      id: door.id,
      name: door.name,
      type: door.type,
      status: door.status,
      position: door.position,
      size: door.size,
      rotation: 0, // Default value since rotation may not exist in the query
      floor_id: door.floor_id,
      object_type: 'door' as const,
      properties: {
        security_level: securityLevel,
        passkey_enabled: passkeyEnabled,
        is_transition_door: isTransitionDoor,
        connects: connectsSpaces
      }
    };
  });

  // Combine all objects
  const allObjects = [...roomObjects, ...hallwayObjects, ...doorObjects];
  
  // Process connections to enhance with additional data
  const enhancedConnections = (connections || []).map(conn => {
    // Determine connection type label
    let connectionLabel = conn.connection_type || "direct";
    
    // Check if this is a transition connection
    const isTransition = conn.is_transition_point;
    
    // Check if this connects to a hallway
    const connectsToHallway = hallwayObjects.some(hall => 
      hall.id === conn.from_space_id || hall.id === conn.to_space_id
    );
    
    // Check if this is an emergency exit
    const isEmergencyExit = conn.is_emergency_exit;
    
    return {
      ...conn,
      connection_label: connectionLabel,
      is_hallway_connection: connectsToHallway,
      is_transition: isTransition,
      is_emergency_exit: isEmergencyExit
    };
  });
  
  return {
    objects: allObjects,
    connections: enhancedConnections || []
  };
}
