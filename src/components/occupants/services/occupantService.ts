
import { supabase } from "@/integrations/supabase/client";
import { OccupantStatus } from "../schemas/occupantSchema";

interface UpdateOccupantParams {
  occupantId: string;
  formData: {
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    department: string | null;
    title: string | null;
    status?: OccupantStatus;
    access_level?: "standard" | "restricted" | "elevated";
    emergency_contact?: any;
    notes?: string | null;
  };
  selectedRooms: string[];
  selectedKeys: string[];
  currentAssignments: {
    rooms: string[];
    keys: string[];
  } | null;
}

export async function handleOccupantUpdate({
  occupantId,
  formData,
  selectedRooms,
  selectedKeys,
  currentAssignments,
}: UpdateOccupantParams) {
  console.log("Starting occupant update with:", {
    occupantId,
    formData,
    selectedRooms,
    selectedKeys,
    currentAssignments
  });

  try {
    // Update occupant details
    const { data: updatedOccupant, error: occupantError } = await supabase
      .from('occupants')
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        title: formData.title,
        status: formData.status,
        access_level: formData.access_level,
        emergency_contact: formData.emergency_contact,
        notes: formData.notes,
      })
      .eq('id', occupantId)
      .select();

    console.log("Occupant update result:", { updatedOccupant, occupantError });
    if (occupantError) throw new Error(`Error updating occupant: ${occupantError.message}`);

    // Update room assignments
    const currentRooms = new Set(currentAssignments?.rooms || []);
    const newRooms = new Set(selectedRooms);

    // Rooms to remove
    const roomsToRemove = [...currentRooms].filter(x => !newRooms.has(x));
    console.log("Rooms to remove:", roomsToRemove);
    
    if (roomsToRemove.length > 0) {
      const { error: removeRoomError } = await supabase
        .from('occupant_room_assignments')
        .delete()
        .eq('occupant_id', occupantId)
        .in('room_id', roomsToRemove);

      console.log("Remove rooms result:", { removeRoomError });
      if (removeRoomError) throw new Error(`Error removing room assignments: ${removeRoomError.message}`);
    }

    // Rooms to add
    const roomsToAdd = [...newRooms].filter(x => !currentRooms.has(x));
    console.log("Rooms to add:", roomsToAdd);
    
    if (roomsToAdd.length > 0) {
      const { error: addRoomError } = await supabase
        .from('occupant_room_assignments')
        .insert(roomsToAdd.map(roomId => ({
          occupant_id: occupantId,
          room_id: roomId,
        })));

      console.log("Add rooms result:", { addRoomError });
      if (addRoomError) throw new Error(`Error adding room assignments: ${addRoomError.message}`);
    }

    // Update key assignments
    const currentKeys = new Set(currentAssignments?.keys || []);
    const newKeys = new Set(selectedKeys);

    // Keys to remove
    const keysToRemove = [...currentKeys].filter(x => !newKeys.has(x));
    console.log("Keys to remove:", keysToRemove);
    
    if (keysToRemove.length > 0) {
      const { error: removeKeyError } = await supabase
        .from('key_assignments')
        .update({ returned_at: new Date().toISOString() })
        .eq('occupant_id', occupantId)
        .in('key_id', keysToRemove)
        .is('returned_at', null);

      console.log("Remove keys result:", { removeKeyError });
      if (removeKeyError) throw new Error(`Error removing key assignments: ${removeKeyError.message}`);

      // Update keys status to available
      const { error: keyUpdateError } = await supabase
        .from('keys')
        .update({ status: 'available' })
        .in('id', keysToRemove);

      console.log("Update removed keys status result:", { keyUpdateError });
      if (keyUpdateError) throw new Error(`Error updating key status: ${keyUpdateError.message}`);
    }

    // Keys to add
    const keysToAdd = [...newKeys].filter(x => !currentKeys.has(x));
    console.log("Keys to add:", keysToAdd);
    
    if (keysToAdd.length > 0) {
      const { error: addKeyError } = await supabase
        .from('key_assignments')
        .insert(keysToAdd.map(keyId => ({
          key_id: keyId,
          occupant_id: occupantId,
          assigned_at: new Date().toISOString(),
        })));

      console.log("Add keys result:", { addKeyError });
      if (addKeyError) throw new Error(`Error adding key assignments: ${addKeyError.message}`);

      // Update keys status to assigned
      const { error: keyUpdateError } = await supabase
        .from('keys')
        .update({ status: 'assigned' })
        .in('id', keysToAdd);

      console.log("Update added keys status result:", { keyUpdateError });
      if (keyUpdateError) throw new Error(`Error updating key status: ${keyUpdateError.message}`);
    }
  } catch (error) {
    console.error("Occupant update failed:", error);
    throw error;
  }
}
