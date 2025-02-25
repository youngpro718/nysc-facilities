
import { supabase } from "@/integrations/supabase/client";
import { CreateSpaceFormData } from "../schemas/createSpaceSchema";
import { RoomTypeEnum, StorageTypeEnum } from "../rooms/types/roomEnums";

export async function createSpace(data: CreateSpaceFormData) {
  console.log('Creating space with data:', data);
  
  // Create base space record
  const spaceData = {
    name: data.name,
    type: data.type,
    floor_id: data.floorId,
    status: data.status,
    room_number: data.type === 'room' ? data.roomNumber : null,
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

  if (spaceError) {
    console.error('Error creating space:', spaceError);
    throw spaceError;
  }

  if (data.type === 'room') {
    // Type guard to narrow down the type with correct enum types
    const roomData = data as {
      type: 'room';
      roomType: RoomTypeEnum;
      phoneNumber?: string;
      currentFunction?: string;
      isStorage?: boolean;
      storageType?: StorageTypeEnum | null;
      storageCapacity?: number | null;
      parentRoomId?: string | null;
    };

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
      .insert(roomProperties);

    if (roomError) {
      console.error('Error creating room properties:', roomError);
      // Delete the space if room properties creation fails
      await supabase.from('new_spaces').delete().match({ id: space.id });
      throw roomError;
    }
  }

  return space;
}
