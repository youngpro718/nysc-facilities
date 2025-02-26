
import { supabase } from "@/integrations/supabase/client";
import { CreateSpaceFormData } from "../schemas/createSpaceSchema";
import { RoomTypeEnum, StorageTypeEnum } from "../rooms/types/roomEnums";

export async function createSpace(data: CreateSpaceFormData) {
  console.log('Creating space with data:', data);
  
  if (data.type === 'room') {
    const roomData = {
      name: data.name,
      room_number: data.roomNumber,
      room_type: data.roomType as RoomTypeEnum,
      status: data.status,
      floor_id: data.floorId,
      description: data.description,
      phone_number: data.phoneNumber,
      current_function: data.currentFunction,
      is_storage: data.isStorage || false,
      storage_type: data.isStorage ? data.storageType as StorageTypeEnum : null,
      storage_capacity: data.storageCapacity,
      parent_room_id: data.parentRoomId,
      position: data.position || { x: 0, y: 0 },
      size: data.size || { width: 150, height: 100 },
      rotation: data.rotation || 0
    };

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert([roomData])
      .select()
      .single();

    if (roomError) throw roomError;
    return room;
  }

  // Handle other space types (hallways, doors) using new_spaces table
  const spaceData = {
    name: data.name,
    type: data.type,
    floor_id: data.floorId,
    status: data.status,
    position: data.position || { x: 0, y: 0 },
    size: data.type === 'door' ? 
      { width: 60, height: 20 } : 
      data.size || { width: 150, height: 100 },
    rotation: data.rotation || 0
  };

  const { data: space, error: spaceError } = await supabase
    .from('new_spaces')
    .insert([spaceData])
    .select()
    .single();

  if (spaceError) throw spaceError;

  if (data.connections) {
    const { error: connectionError } = await supabase
      .from('space_connections')
      .insert([{
        from_space_id: space.id,
        to_space_id: data.connections.toSpaceId,
        space_type: data.type,
        connection_type: data.connections.connectionType,
        direction: data.connections.direction,
        status: 'active',
        connection_status: 'active'
      }]);

    if (connectionError) throw connectionError;
  }

  return space;
}
