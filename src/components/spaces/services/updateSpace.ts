
import { supabase } from "@/integrations/supabase/client";
import { StatusEnum } from "../rooms/types/roomEnums";

interface UpdateRoomData {
  name?: string;
  room_number?: string;
  room_type?: string;
  status?: string;
  floor_id?: string;
  description?: string | null;
  phone_number?: string | null;
  current_function?: string | null;
  is_storage?: boolean;
  storage_type?: string | null;
  storage_capacity?: number | null;
  storage_notes?: string | null;
  parent_room_id?: string | null;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  rotation?: number;
  courtroom_photos?: {
    judge_view: string | null;
    audience_view: string | null;
  } | null;
}

/**
 * Updates a room in the database
 * @param id Room ID (UUID)
 * @param data Room data to update
 * @returns Updated room object or throws error
 */
export async function updateSpace(id: string, data: UpdateRoomData) {
  if (!id) throw new Error("Room ID is required for update");

  // Remove undefined values (don't update those fields)
  const updateData: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updateData[key] = value;
    }
  });

  // Perform the update
  const { data: room, error } = await supabase
    .from("rooms")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return room;
}
