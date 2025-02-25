
import { supabase } from "@/integrations/supabase/client";
import { CreateSpaceFormData } from "../schemas/createSpaceSchema";
import { RoomTypeEnum, StorageTypeEnum } from "../rooms/types/roomEnums";

export async function createSpace(data: CreateSpaceFormData) {
  console.log('Creating space with data:', data);
  
  // Start a Supabase transaction
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to create spaces');
  }

  try {
    // Create the space first
    const { data: space, error: spaceError } = await supabase
      .from('new_spaces')
      .insert([{
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
      }])
      .select()
      .single();

    if (spaceError) {
      console.error('Error creating space:', spaceError);
      throw spaceError;
    }

    console.log('Successfully created space:', space);

    if (data.type === 'room') {
      // Check if room properties already exist
      const { data: existingProps, error: checkError } = await supabase
        .from('room_properties')
        .select()
        .eq('space_id', space.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
        console.error('Error checking room properties:', checkError);
        throw checkError;
      }

      // Prepare room properties data
      const roomData = data as {
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
        phone_number: roomData.phoneNumber || null,
        current_function: roomData.currentFunction || null,
        is_storage: roomData.isStorage || false,
        storage_type: roomData.isStorage ? roomData.storageType : null,
        storage_capacity: roomData.storageCapacity || null,
        parent_room_id: roomData.parentRoomId || null
      };

      if (existingProps) {
        // Update existing properties
        const { error: updateError } = await supabase
          .from('room_properties')
          .update(roomProperties)
          .eq('space_id', space.id);

        if (updateError) {
          console.error('Error updating room properties:', updateError);
          throw updateError;
        }
      } else {
        // Insert new properties
        const { error: insertError } = await supabase
          .from('room_properties')
          .insert([roomProperties]);

        if (insertError) {
          console.error('Error creating room properties:', insertError);
          throw insertError;
        }
      }
    }

    return space;
  } catch (error) {
    console.error('Error in createSpace:', error);
    throw error;
  }
}
