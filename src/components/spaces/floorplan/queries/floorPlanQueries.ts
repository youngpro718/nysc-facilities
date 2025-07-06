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
    position: room.position || { x: 0, y: 0 },
    size: room.size || { width: 150, height: 100 },
    rotation: room.rotation || 0,
    parent_room_id: room.parent_room_id,
    floor_id: room.floor_id,
    object_type: 'room' as const
  }));

  // Fetch hallways
  const { data: hallways, error: hallwaysError } = await supabase
    .from('hallways')
    .select('id, name, status, position, size, rotation, floor_id')
    .eq('floor_id', floorId)
    .eq('status', 'active');

  if (hallwaysError) throw hallwaysError;

  const hallwayObjects = (hallways || []).map(hallway => ({
    id: hallway.id,
    name: hallway.name,
    type: 'hallway',
    status: hallway.status,
    position: hallway.position || { x: 0, y: 0 },
    size: hallway.size || { width: 300, height: 50 },
    rotation: hallway.rotation || 0,
    floor_id: hallway.floor_id,
    object_type: 'hallway' as const,
    properties: {
      orientation: 'horizontal'
    }
  }));

  // Fetch doors
  const { data: doors, error: doorsError } = await supabase
    .from('doors')
    .select('id, name, status, position, size, floor_id')
    .eq('floor_id', floorId)
    .eq('status', 'active');

  if (doorsError) throw doorsError;

  const doorObjects = (doors || []).map(door => ({
    id: door.id,
    name: door.name,
    type: 'door',
    status: door.status,
    position: door.position || { x: 0, y: 0 },
    size: door.size || { width: 60, height: 20 },
    rotation: 0,
    floor_id: door.floor_id,
    object_type: 'door' as const,
    properties: {
      security_level: 'standard',
      passkey_enabled: false
    }
  }));

  // Combine all objects
  const allObjects = [...roomObjects, ...hallwayObjects, ...doorObjects];
  
  return {
    objects: allObjects,
    connections: [] // No connections for now since space_connections table doesn't exist
  };
}