
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
    .select('id, name, room_number, room_type, status, position, size, parent_room_id, floor_id')
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

  // Extract hallways from new_spaces and merge hallway_properties data
  const hallwayObjects = (newSpaces || [])
    .filter(space => space.type === 'hallway')
    .map(hallway => {
      // Get hallway_properties data (from the joined table)
      const hallwayProps = hallway.hallway_properties?.[0] || {};
      
      // Merge properties from both sources, with hallway_properties taking precedence
      const mergedProperties = {
        ...(typeof hallway.properties === 'object' && hallway.properties !== null ? hallway.properties : {}),
        section: hallwayProps.section || hallway.properties?.section || 'connector',
        traffic_flow: hallwayProps.traffic_flow || hallway.properties?.traffic_flow || hallway.properties?.trafficFlow || 'two_way',
        accessibility: hallwayProps.accessibility || hallway.properties?.accessibility || 'fully_accessible',
        emergency_route: hallwayProps.emergency_route || hallway.properties?.emergency_route || hallway.properties?.emergencyRoute || 'not_designated',
        maintenance_priority: hallwayProps.maintenance_priority || hallway.properties?.maintenance_priority || hallway.properties?.maintenancePriority || 'low',
        capacity_limit: hallwayProps.capacity_limit || hallway.properties?.capacity_limit || hallway.properties?.capacityLimit
      };
      
      return {
        id: hallway.id,
        name: hallway.name,
        type: hallway.type,
        status: hallway.status,
        position: hallway.position,
        size: hallway.size,
        rotation: hallway.rotation,
        properties: mergedProperties,
        floor_id: hallway.floor_id,
        object_type: 'hallway' as const
      };
    });
    
  console.log("Extracted hallways:", hallwayObjects.length);

  // Fetch doors
  const { data: doors, error: doorsError } = await supabase
    .from('doors')
    .select('id, name, type, status, floor_id')
    .eq('floor_id', floorId)
    .eq('status', 'active');

  if (doorsError) throw doorsError;

  const doorObjects = (doors || []).map(door => ({
    id: door.id,
    name: door.name,
    type: door.type,
    status: door.status,
    floor_id: door.floor_id,
    object_type: 'door' as const
  }));

  // Fetch space connections
  const { data: connections, error: connectionsError } = await supabase
    .from('space_connections')
    .select('*')
    .or(`from_space_id.in.(${hallwayObjects.map(h => h.id).join(',')}),to_space_id.in.(${hallwayObjects.map(h => h.id).join(',')})`)
    .eq('status', 'active');

  if (connectionsError) {
    console.error('Error fetching space connections:', connectionsError);
    throw connectionsError;
  }
  
  console.log("Fetched space connections:", connections?.length || 0);

  // Combine all objects
  const allObjects = [...roomObjects, ...hallwayObjects, ...doorObjects];
  
  return {
    objects: allObjects,
    connections: connections || []
  };
}
