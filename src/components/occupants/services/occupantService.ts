
import { OccupantFormData } from "../schemas/occupantSchema";
import { supabase } from "@/integrations/supabase/client";
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

  try {
    // Update occupant data
    const { error: updateError } = await supabase
      .from('occupants')
      .update(updateData)
      .eq('id', occupantId);

    if (updateError) throw updateError;

    // Handle room assignments
    if (selectedRooms) {
      // Remove existing room assignments
      const { error: deleteRoomsError } = await supabase
        .from('room_assignments')
        .delete()
        .eq('occupant_id', occupantId);

      if (deleteRoomsError) throw deleteRoomsError;

      // Add new room assignments
      if (selectedRooms.length > 0) {
        const roomAssignments = selectedRooms.map(roomId => ({
          occupant_id: occupantId,
          room_id: roomId,
          assigned_at: new Date().toISOString(),
        }));

        const { error: insertRoomsError } = await supabase
          .from('room_assignments')
          .insert(roomAssignments);

        if (insertRoomsError) throw insertRoomsError;
      }
    }

    // Handle key assignments
    if (selectedKeys) {
      // Remove existing key assignments
      const { error: deleteKeysError } = await supabase
        .from('key_assignments')
        .delete()
        .eq('occupant_id', occupantId);

      if (deleteKeysError) throw deleteKeysError;

      // Add new key assignments
      if (selectedKeys.length > 0) {
        const keyAssignments = selectedKeys.map(keyId => ({
          occupant_id: occupantId,
          key_id: keyId,
          assigned_at: new Date().toISOString(),
        }));

        const { error: insertKeysError } = await supabase
          .from('key_assignments')
          .insert(keyAssignments);

        if (insertKeysError) throw insertKeysError;
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating occupant:', error);
    throw error;
  }
};
