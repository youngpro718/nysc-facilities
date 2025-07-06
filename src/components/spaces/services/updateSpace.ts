
import { supabase } from "@/integrations/supabase/client";
import { StatusEnum } from "../rooms/types/roomEnums";

interface UpdateSpaceData {
  type?: "room" | "hallway" | "door";
  name?: string;
  buildingId?: string;
  floorId?: string;
  status?: string;
  description?: string;
  position?: { x?: number; y?: number; };
  size?: { width?: number; height?: number; };
  room_number?: string;
  room_type?: string;
  is_storage?: boolean;
  storage_type?: string;
  storage_capacity?: number;
  phone_number?: string;
  current_function?: string;
  parent_room_id?: string | null;
  courtroom_photos?: {
    judge_view?: string | null;
    audience_view?: string | null;
  };
}

export const updateSpace = async (id: string, updates: Partial<UpdateSpaceData>) => {
  console.log("=== updateSpace called ===");
  console.log("Updates received:", updates);
  console.log("Parent room ID in updates:", updates.parent_room_id);
  
  const roomUpdates: any = {
    name: updates.name,
    status: updates.status,
    description: updates.description,
  };

  // Add room-specific fields if they exist in updates - FIXED: Check for camelCase interface names
  if ('room_number' in updates) roomUpdates.room_number = updates.room_number;
  if ('room_type' in updates) roomUpdates.room_type = updates.room_type;
  if ('floorId' in updates) roomUpdates.floor_id = updates.floorId;
  if ('phone_number' in updates) roomUpdates.phone_number = updates.phone_number;
  if ('current_function' in updates) roomUpdates.current_function = updates.current_function;
  if ('is_storage' in updates) roomUpdates.is_storage = updates.is_storage;
  if ('storage_type' in updates) roomUpdates.storage_type = updates.storage_type;
  if ('storage_capacity' in updates) roomUpdates.storage_capacity = updates.storage_capacity;
  if ('parent_room_id' in updates) roomUpdates.parent_room_id = updates.parent_room_id;
  if ('courtroom_photos' in updates) roomUpdates.courtroom_photos = updates.courtroom_photos;

  console.log("Final roomUpdates before database:", roomUpdates);
  console.log("Parent room ID being sent to DB:", roomUpdates.parent_room_id);

  // Remove undefined values
  Object.keys(roomUpdates).forEach(key => {
    if (roomUpdates[key] === undefined) {
      delete roomUpdates[key];
    }
  });

  const { data, error } = await supabase
    .from('rooms')
    .update(roomUpdates)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating space:', error);
    throw error;
  }

  return data;
};
