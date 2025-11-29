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
}: UpdateOccupantParams) => {
  if (!occupantId) {
    throw new Error("Occupant ID is required");
  }

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

  // Update occupant data
  const { error: updateError } = await supabase
    .from('occupants')
    .update(updateData)
    .eq('id', occupantId)
    .select();

  if (updateError) throw updateError;

  // Handle room assignments
  if (selectedRooms !== undefined) {
    const { error: deleteRoomsError } = await supabase
      .from('occupant_room_assignments')
      .delete()
      .eq('occupant_id', occupantId);

    if (deleteRoomsError) throw deleteRoomsError;

    if (selectedRooms.length > 0) {
      const roomAssignments = selectedRooms.map(roomId => ({
        occupant_id: occupantId,
        room_id: roomId,
        assigned_at: new Date().toISOString(),
      }));

      const { error: insertRoomsError } = await supabase
        .from('occupant_room_assignments')
        .insert(roomAssignments);

      if (insertRoomsError) throw insertRoomsError;
    }
  }

  // Handle key assignments
  if (selectedKeys !== undefined) {
    const { error: deleteKeysError } = await supabase
      .from('key_assignments')
      .delete()
      .eq('occupant_id', occupantId);

    if (deleteKeysError) throw deleteKeysError;

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
};
