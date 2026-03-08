import { supabase } from "@/lib/supabase";
import { logger } from '@/lib/logger';

export async function fetchFloorPlanLayers(floorId: string) {
  const { data, error } = await supabase
    .from('floorplan_layers')
    .select('*')
    .eq('floor_id', floorId)
    .order('order_index');
    
  if (error) throw error;
  return data || [];
}

export interface HallwayRoomConnection {
  id: string;
  hallway_id: string;
  room_id: string;
  position: 'start' | 'middle' | 'end';
  side: 'left' | 'right';
  sequence_order: number;
  room_number?: string;
}

export async function fetchHallwayRoomConnections(floorId: string): Promise<HallwayRoomConnection[]> {
  // Get hallway IDs for this floor first
  const { data: hallways, error: hallwayError } = await supabase
    .from('hallways')
    .select('id')
    .eq('floor_id', floorId)
    .eq('status', 'active');

  if (hallwayError) {
    logger.error("Error fetching hallways for connections:", hallwayError);
    return [];
  }

  if (!hallways || hallways.length === 0) return [];

  const hallwayIds = hallways.map(h => h.id);

  const { data, error } = await supabase
    .from('hallway_adjacent_rooms')
    .select('id, hallway_id, room_id, position, side, sequence_order, rooms!hallway_adjacent_rooms_room_id_fkey(room_number)')
    .in('hallway_id', hallwayIds)
    .order('sequence_order', { ascending: true });

  if (error) {
    logger.error("Error fetching hallway room connections:", error);
    return [];
  }

  // Flatten room_number from joined rooms data
  return (data || []).map((row: any) => ({
    id: row.id,
    hallway_id: row.hallway_id,
    room_id: row.room_id,
    position: row.position,
    side: row.side,
    sequence_order: row.sequence_order,
    room_number: row.rooms?.room_number || '',
  })) as HallwayRoomConnection[];
}

export async function fetchAttachedRoomsForHallway(hallwayId: string) {
  const { data, error } = await supabase
    .from('hallway_adjacent_rooms')
    .select('id, hallway_id, room_id, position, side, sequence_order, rooms!hallway_adjacent_rooms_room_id_fkey(id, name, room_number)')
    .eq('hallway_id', hallwayId)
    .order('sequence_order', { ascending: true });

  if (error) {
    logger.error("Error fetching attached rooms:", error);
    return [];
  }
  return (data || []).map((row: any) => ({
    id: row.id,
    hallway_id: row.hallway_id,
    room_id: row.room_id,
    position: row.position,
    side: row.side,
    sequence_order: row.sequence_order,
    room_name: row.rooms?.name || '',
    room_number: row.rooms?.room_number || '',
  }));
}

export async function fetchHallwayForRoom(roomId: string) {
  const { data, error } = await supabase
    .from('hallway_adjacent_rooms')
    .select('id, hallway_id, room_id, position, side, sequence_order, hallways!hallway_adjacent_rooms_hallway_id_fkey(id, name)')
    .eq('room_id', roomId);

  if (error) {
    logger.error("Error fetching hallway for room:", error);
    return null;
  }
  if (!data || data.length === 0) return null;
  const row = data[0] as any;
  return {
    id: row.id,
    hallway_id: row.hallway_id,
    room_id: row.room_id,
    position: row.position,
    side: row.side,
    sequence_order: row.sequence_order,
    hallway_name: row.hallways?.name || '',
  };
}

export async function attachRoomToHallway(params: {
  hallway_id: string;
  room_id: string;
  position: string;
  side: string;
  sequence_order: number;
}) {
  const { error } = await supabase
    .from('hallway_adjacent_rooms')
    .insert({
      hallway_id: params.hallway_id,
      room_id: params.room_id,
      position: params.position,
      side: params.side,
      sequence_order: params.sequence_order,
    });
  if (error) throw error;
}

export async function updateHallwayRoomAttachment(id: string, updates: {
  position?: string;
  side?: string;
  sequence_order?: number;
}) {
  const { error } = await supabase
    .from('hallway_adjacent_rooms')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function detachRoomFromHallway(id: string) {
  const { error } = await supabase
    .from('hallway_adjacent_rooms')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function fetchHallwaysForFloor(floorId: string) {
  const { data, error } = await supabase
    .from('hallways')
    .select('id, name')
    .eq('floor_id', floorId)
    .eq('status', 'active');
  if (error) {
    logger.error("Error fetching hallways for floor:", error);
    return [];
  }
  return data || [];
}

export async function fetchFloorPlanObjects(floorId: string) {
  logger.debug("Fetching floor plan objects for floor:", floorId);
  
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
    type: room.room_type || 'room', 
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

  // Fetch hallway-room connections
  const connections = await fetchHallwayRoomConnections(floorId);

  // Combine all objects
  const allObjects = [...roomObjects, ...hallwayObjects, ...doorObjects];
  
  return {
    objects: allObjects,
    connections
  };
}
