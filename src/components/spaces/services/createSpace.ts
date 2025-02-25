
import { supabase } from "@/integrations/supabase/client";
import { CreateSpaceFormData } from "../schemas/createSpaceSchema";
import { RoomTypeEnum, StorageTypeEnum } from "../rooms/types/roomEnums";

export async function createSpace(data: CreateSpaceFormData) {
  console.log('Creating space with data:', data);
  
  try {
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

    console.log('Inserting space with data:', spaceData);

    const { data: space, error: spaceError } = await supabase
      .from('new_spaces')
      .insert([spaceData])
      .select()
      .single();

    if (spaceError) {
      console.error('Error creating space:', spaceError);
      throw spaceError;
    }

    console.log('Successfully created space:', space);

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

      console.log('Creating room properties for space:', space.id);

      // Check if room properties already exist for this space
      const { data: existingProps } = await supabase
        .from('room_properties')
        .select()
        .eq('space_id', space.id)
        .maybeSingle();

      // If room properties already exist, update them instead of inserting
      if (existingProps) {
        console.log('Updating existing room properties for space:', space.id);
        
        const { error: updateError } = await supabase
          .from('room_properties')
          .update({
            room_type: roomData.roomType,
            phone_number: roomData.phoneNumber,
            current_function: roomData.currentFunction,
            is_storage: roomData.isStorage || false,
            storage_type: roomData.isStorage ? roomData.storageType : null,
            storage_capacity: roomData.storageCapacity,
            parent_room_id: roomData.parentRoomId,
          })
          .eq('space_id', space.id);

        if (updateError) {
          console.error('Error updating room properties:', updateError);
          // Delete the space if room properties update fails
          await supabase.from('new_spaces').delete().match({ id: space.id });
          throw updateError;
        }
      } else {
        console.log('Creating new room properties for space:', space.id);
        
        // Insert new room properties
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

      console.log('Successfully created/updated room properties');
    }

    return space;
  } catch (error) {
    console.error('Error in createSpace:', error);
    throw error;
  }
}
