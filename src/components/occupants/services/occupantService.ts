
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
  // Start a Supabase transaction
  const { error: transactionError } = await supabase.rpc('begin');
  if (transactionError) throw transactionError;

  try {
    // Update occupant details
    const { error: occupantError } = await supabase
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
      .eq('id', occupantId);

    if (occupantError) throw occupantError;

    // Handle room assignments
    const currentRooms = new Set(currentAssignments?.rooms || []);
    const newRooms = new Set(selectedRooms);

    // Remove old room assignments
    const roomsToRemove = [...currentRooms].filter(x => !newRooms.has(x));
    if (roomsToRemove.length > 0) {
      const { error: removeRoomError } = await supabase
        .from('occupant_room_assignments')
        .delete()
        .eq('occupant_id', occupantId)
        .in('room_id', roomsToRemove);

      if (removeRoomError) throw removeRoomError;
    }

    // Add new room assignments
    const roomsToAdd = [...newRooms].filter(x => !currentRooms.has(x));
    if (roomsToAdd.length > 0) {
      const { error: addRoomError } = await supabase
        .from('occupant_room_assignments')
        .insert(roomsToAdd.map(roomId => ({
          occupant_id: occupantId,
          room_id: roomId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })));

      if (addRoomError) throw addRoomError;
    }

    // Handle key assignments
    const currentKeys = new Set(currentAssignments?.keys || []);
    const newKeys = new Set(selectedKeys);

    // Return old keys
    const keysToRemove = [...currentKeys].filter(x => !newKeys.has(x));
    if (keysToRemove.length > 0) {
      const { error: removeKeyError } = await supabase
        .from('key_assignments')
        .update({ 
          returned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('occupant_id', occupantId)
        .in('key_id', keysToRemove)
        .is('returned_at', null);

      if (removeKeyError) throw removeKeyError;

      // Update keys status
      const { error: keyUpdateError } = await supabase
        .from('keys')
        .update({ 
          status: 'available',
          updated_at: new Date().toISOString()
        })
        .in('id', keysToRemove);

      if (keyUpdateError) throw keyUpdateError;
    }

    // Assign new keys
    const keysToAdd = [...newKeys].filter(x => !currentKeys.has(x));
    if (keysToAdd.length > 0) {
      const { error: addKeyError } = await supabase
        .from('key_assignments')
        .insert(keysToAdd.map(keyId => ({
          key_id: keyId,
          occupant_id: occupantId,
          assigned_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })));

      if (addKeyError) throw addKeyError;

      // Update keys status
      const { error: keyUpdateError } = await supabase
        .from('keys')
        .update({ 
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .in('id', keysToAdd);

      if (keyUpdateError) throw keyUpdateError;
    }

    // Commit transaction
    const { error: commitError } = await supabase.rpc('commit');
    if (commitError) throw commitError;

    return { success: true };
  } catch (error) {
    // Rollback on error
    await supabase.rpc('rollback');
    throw error;
  }
}
