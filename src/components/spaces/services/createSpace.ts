
import { supabase } from "@/integrations/supabase/client";
import { CreateSpaceFormData } from "../schemas/createSpaceSchema";

export async function createSpace(data: CreateSpaceFormData) {
  console.log('Creating space with data:', data);
  
  // Create base space record
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

  if (data.type === 'room') {
    const roomData = data as Extract<CreateSpaceFormData, { type: "room" }>;
    const roomProperties = {
      space_id: space.id,
      room_type: roomData.roomType,
      phone_number: roomData.phoneNumber,
      current_function: roomData.currentFunction,
      is_storage: roomData.isStorage || false,
      storage_type: roomData.isStorage ? roomData.storageType : null,
      storage_capacity: roomData.storageCapacity,
      parent_room_id: roomData.parentRoomId,
    };

    const { error: roomError } = await supabase
      .from('room_properties')
      .insert([roomProperties]);

    if (roomError) throw roomError;
  }

  // Create space connection if specified
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
