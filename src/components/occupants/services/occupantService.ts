
import { OccupantFormData } from "../schemas/occupantSchema";
import { supabase } from "@/lib/supabase";
import type { OccupantAssignments } from "../types/occupantTypes";

interface UpdateOccupantParams {
  occupantId: string;
  formData: OccupantFormData;
  selectedRooms: string[];
  selectedKeys: string[];
  currentAssignments?: OccupantAssignments;
}

export const handleOccupantUpdate = async ({
  occupantId,
  formData,
  selectedRooms,
  selectedKeys,
  currentAssignments,
}: UpdateOccupantParams) => {
  console.log("=== OCCUPANT SERVICE UPDATE ===");
  console.log("Service received params:", { occupantId, formData, selectedRooms, selectedKeys, currentAssignments });
  
  if (!occupantId) {
    throw new Error("Occupant ID is required");
  }

  // Prepare the occupant data for update
  const updateData = {
    first_name: formData.first_name,
    last_name: formData.last_name,
    email: formData.email,
    phone: formData.phone,
    department: formData.department,
    title: formData.title,
    status: formData.status,
    employment_type: formData.employment_type,
    supervisor_id: formData.supervisor_id,
    hire_date: formData.hire_date,
    termination_date: formData.termination_date,
    access_level: formData.access_level,
    emergency_contact: formData.emergency_contact,
    notes: formData.notes,
    updated_at: new Date().toISOString(),
  };

  console.log("Prepared update data:", updateData);

  try {
    // Update occupant data
    console.log("Updating occupant with ID:", occupantId);
    const { data: updateResult, error: updateError } = await supabase
      .from('occupants')
      .update(updateData)
      .eq('id', occupantId)
      .select();

    console.log("Occupant update result:", updateResult);
    if (updateError) {
      console.error("Occupant update error:", updateError);
      throw updateError;
    }

    // Handle room assignments
    console.log("Handling room assignments. Selected rooms:", selectedRooms);
    if (selectedRooms !== undefined) {
      // Remove existing room assignments
      console.log("Deleting existing room assignments for occupant:", occupantId);
      const { error: deleteRoomsError } = await supabase
        .from('occupant_room_assignments')
        .delete()
        .eq('occupant_id', occupantId);

      if (deleteRoomsError) {
        console.error("Error deleting room assignments:", deleteRoomsError);
        throw deleteRoomsError;
      }
      console.log("Successfully deleted existing room assignments");

      // Add new room assignments
      if (selectedRooms.length > 0) {
        const roomAssignments = selectedRooms.map(roomId => ({
          occupant_id: occupantId,
          room_id: roomId,
          assigned_at: new Date().toISOString(),
        }));

        console.log("Inserting new room assignments:", roomAssignments);
        const { data: insertResult, error: insertRoomsError } = await supabase
          .from('occupant_room_assignments')
          .insert(roomAssignments)
          .select();

        if (insertRoomsError) {
          console.error("Error inserting room assignments:", insertRoomsError);
          throw insertRoomsError;
        }
        console.log("Successfully inserted room assignments:", insertResult);
      } else {
        console.log("No rooms to assign");
      }
    }

    // Handle key assignments
    console.log("Handling key assignments. Selected keys:", selectedKeys);
    if (selectedKeys !== undefined) {
      // Remove existing key assignments
      console.log("Deleting existing key assignments for occupant:", occupantId);
      const { error: deleteKeysError } = await supabase
        .from('key_assignments')
        .delete()
        .eq('occupant_id', occupantId);

      if (deleteKeysError) {
        console.error("Error deleting key assignments:", deleteKeysError);
        throw deleteKeysError;
      }
      console.log("Successfully deleted existing key assignments");

      // Add new key assignments
      if (selectedKeys.length > 0) {
        const keyAssignments = selectedKeys.map(keyId => ({
          occupant_id: occupantId,
          key_id: keyId,
          assigned_at: new Date().toISOString(),
        }));

        console.log("Inserting new key assignments:", keyAssignments);
        const { data: insertResult, error: insertKeysError } = await supabase
          .from('key_assignments')
          .insert(keyAssignments)
          .select();

        if (insertKeysError) {
          console.error("Error inserting key assignments:", insertKeysError);
          throw insertKeysError;
        }
        console.log("Successfully inserted key assignments:", insertResult);
      } else {
        console.log("No keys to assign");
      }
    }

    console.log("=== UPDATE COMPLETE ===");
    return { success: true };
  } catch (error) {
    console.error('=== SERVICE ERROR ===', error);
    throw error;
  }
};
