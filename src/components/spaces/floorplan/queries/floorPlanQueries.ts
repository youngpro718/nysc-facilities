
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
      space_type, 
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
      is_transition_point
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
      const properties = hallway.properties || {};
      const stringProperties = typeof properties === 'string' ? JSON.parse(properties) : properties;
      
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
      const hallwayWidth = getProperty(hallwayProps, 'width', null) || 
                          getProperty(stringProperties, 'width', null);
      
      const hallwayLength = getProperty(hallwayProps, 'length', null) || 
                           getProperty(stringProperties, 'length', null);
      
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
      
      // Calculate suggested hallway dimensions based on orientation
      if (!suggestedWidth || !suggestedLength) {
        if (hallwayOrientation === 'horizontal') {
          suggestedWidth = connectedSpaceIds.length * 150 + 100; // Base width on number of connections
          suggestedLength = 50; // Standard hallway height/width
        } else {
          suggestedWidth = 50; // Standard hallway width
          suggestedLength = connectedSpaceIds.length * 150 + 100; // Base length on number of connections
        }
      }
      
      // Merge properties from both sources, with hallway_properties taking precedence
      const mergedProperties = {
        ...(typeof stringProperties === 'object' && stringProperties !== null ? stringProperties : {}),
        section: getProperty(hallwayProps, 'section', 'connector'),
        traffic_flow: getProperty(hallwayProps, 'traffic_flow', getProperty(stringProperties, 'traffic_flow', getProperty(stringProperties, 'trafficFlow', 'two_way'))),
        accessibility: getProperty(hallwayProps, 'accessibility', getProperty(stringProperties, 'accessibility', 'fully_accessible')),
        emergency_route: getProperty(hallwayProps, 'emergency_route', getProperty(stringProperties, 'emergency_route', getProperty(stringProperties, 'emergencyRoute', 'not_designated'))),
        maintenance_priority: getProperty(hallwayProps, 'maintenance_priority', getProperty(stringProperties, 'maintenance_priority', getProperty(stringProperties, 'maintenancePriority', 'low'))),
        capacity_limit: getProperty(hallwayProps, 'capacity_limit', getProperty(stringProperties, 'capacity_limit', getProperty(stringProperties, 'capacityLimit', null))),
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

      // Determine size based on orientation
      let sizeObj = hallway.size;
      if (typeof sizeObj === 'string') {
        try {
          sizeObj = JSON.parse(sizeObj);
        } catch {
          sizeObj = hallwayOrientation === 'horizontal' 
            ? { width: suggestedWidth || 300, height: suggestedLength || 50 }
            : { width: suggestedLength || 50, height: suggestedWidth || 300 };
        }
      } else if (!sizeObj || typeof sizeObj !== 'object' || !sizeObj.width || !sizeObj.height) {
        sizeObj = hallwayOrientation === 'horizontal' 
          ? { width: suggestedWidth || 300, height: suggestedLength || 50 }
          : { width: suggestedLength || 50, height: suggestedWidth || 300 };
      }
      
      // Type guard to ensure size object has width and height properties
      const typedSizeObj = typeof sizeObj === 'object' && sizeObj !== null
        ? { 
            width: typeof sizeObj.width === 'number' ? sizeObj.width : (suggestedWidth || 300),
            height: typeof sizeObj.height === 'number' ? sizeObj.height : (suggestedLength || 50)
          }
        : { width: suggestedWidth || 300, height: suggestedLength || 50 };
      
      // If hallway is vertical, apply rotation
      const calculatedRotation = hallwayOrientation === 'vertical' ? 90 : 0;
      
      return {
        id: hallway.id,
        name: hallway.name,
        type: hallway.type,
        status: hallway.status,
        position: hallway.position,
        size: typedSizeObj,
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
      rotation, 
      floor_id, 
      properties
    `)
    .eq('floor_id', floorId)
    .eq('type', 'door')
    .eq('status', 'active');

  if (doorsError) throw doorsError;

  const doors = doorsData || [];
  
  const doorObjects = doors.map(door => {
    // Safely extract properties
    const properties = door.properties || {};
    const security_level = typeof properties === 'object' ? properties.security_level : undefined;
    const passkey_enabled = typeof properties === 'object' ? properties.passkey_enabled : undefined;
    
    return {
      id: door.id,
      name: door.name,
      type: door.type,
      status: door.status,
      position: door.position,
      size: door.size,
      rotation: door.rotation,
      floor_id: door.floor_id,
      object_type: 'door' as const,
      properties: {
        security_level: security_level || 'standard',
        passkey_enabled: passkey_enabled || false
      }
    };
  });

  // Combine all objects
  const allObjects = [...roomObjects, ...hallwayObjects, ...doorObjects];
  
  return {
    objects: allObjects,
    connections: connections || []
  };
}
