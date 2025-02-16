
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
    type: room.room_type,
    status: room.status,
    position: room.position,
    size: room.size,
    parent_room_id: room.parent_room_id,
    floor_id: room.floor_id,
    object_type: 'room' as const
  }));

  // Fetch hallways
  const { data: hallways, error: hallwaysError } = await supabase
    .from('hallways')
    .select('id, name, type, status, position, size, floor_id')
    .eq('floor_id', floorId)
    .eq('status', 'active');

  if (hallwaysError) throw hallwaysError;

  const hallwayObjects = (hallways || []).map(hallway => ({
    id: hallway.id,
    name: hallway.name,
    type: hallway.type,
    status: hallway.status,
    position: hallway.position,
    size: hallway.size,
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

  // Fetch space connections
  const { data: connections, error: connectionsError } = await supabase
    .from('space_connections')
    .select('*')
    .eq('status', 'active');

  if (connectionsError) throw connectionsError;

  // Combine all objects
  const allObjects = [...roomObjects, ...hallwayObjects, ...doorObjects];
  
  return {
    objects: allObjects,
    connections: connections || []
  };
}
