
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

  // Fetch spaces from new_spaces table (including hallways)
  const { data: newSpaces, error: newSpacesError } = await supabase
    .from('new_spaces')
    .select('id, name, type, status, position, size, rotation, properties, room_number, floor_id')
    .eq('floor_id', floorId)
    .eq('status', 'active');

  if (newSpacesError) throw newSpacesError;

  // Extract hallways from new_spaces
  const hallwayObjects = (newSpaces || [])
    .filter(space => space.type === 'hallway')
    .map(hallway => ({
      id: hallway.id,
      name: hallway.name,
      type: hallway.type,
      status: hallway.status,
      position: hallway.position,
      size: hallway.size,
      rotation: hallway.rotation,
      properties: hallway.properties,
      floor_id: hallway.floor_id,
      object_type: 'hallway' as const
    }));

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

  // Fetch hallway properties to enrich hallway objects
  const hallwayIds = hallwayObjects.map(h => h.id);
  let hallwayProperties = [];
  
  if (hallwayIds.length > 0) {
    const { data: props, error: propsError } = await supabase
      .from('hallway_properties')
      .select('*')
      .in('space_id', hallwayIds);
      
    if (propsError) {
      console.error('Error fetching hallway properties:', propsError);
    } else {
      hallwayProperties = props || [];
    }
  }
  
  // Enrich hallway objects with their properties
  const enrichedHallways = hallwayObjects.map(hallway => {
    const props = hallwayProperties.find(p => p.space_id === hallway.id);
    if (props) {
      // Ensure hallway.properties is always treated as an object before spreading
      const baseProperties = typeof hallway.properties === 'object' && hallway.properties !== null 
        ? hallway.properties 
        : {};
        
      return {
        ...hallway,
        properties: {
          ...baseProperties,
          section: props.section,
          traffic_flow: props.traffic_flow,
          accessibility: props.accessibility,
          emergency_route: props.emergency_route,
          maintenance_priority: props.maintenance_priority,
          capacity_limit: props.capacity_limit
        }
      };
    }
    return hallway;
  });

  // Fetch space connections
  const { data: connections, error: connectionsError } = await supabase
    .from('space_connections')
    .select('*')
    .eq('status', 'active');

  if (connectionsError) throw connectionsError;

  // Combine all objects
  const allObjects = [...roomObjects, ...enrichedHallways, ...doorObjects];
  
  return {
    objects: allObjects,
    connections: connections || []
  };
}
