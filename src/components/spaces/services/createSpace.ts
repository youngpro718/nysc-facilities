
import { supabase } from "@/integrations/supabase/client";
import { CreateSpaceFormData } from "../schemas/createSpaceSchema";
import { RoomTypeEnum, StorageTypeEnum } from "../rooms/types/roomEnums";

export async function createSpace(data: CreateSpaceFormData) {
  console.log('Creating space with data:', data);
  
  try {
    // Start a Supabase transaction
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
      // Type guard to narrow down the type
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

      // Check if room properties already exist
      const { data: existingProps, error: checkError } = await supabase
        .from('room_properties')
        .select()
        .eq('space_id', space.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing room properties:', checkError);
        // Delete the space since room properties check failed
        await supabase.from('new_spaces').delete().match({ id: space.id });
        throw checkError;
      }

      // Prepare room properties data
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

      if (existingProps) {
        console.log('Updating existing room properties for space:', space.id);
        const { error: updateError } = await supabase
          .from('room_properties')
          .update(roomProperties)
          .eq('space_id', space.id);

        if (updateError) {
          console.error('Error updating room properties:', updateError);
          // Delete the space if room properties update fails
          await supabase.from('new_spaces').delete().match({ id: space.id });
          throw updateError;
        }
      } else {
        console.log('Inserting new room properties for space:', space.id);
        const { error: insertError } = await supabase
          .from('room_properties')
          .insert([roomProperties]);

        if (insertError) {
          console.error('Error creating room properties:', insertError);
          // Delete the space if room properties creation fails
          await supabase.from('new_spaces').delete().match({ id: space.id });
          throw insertError;
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
