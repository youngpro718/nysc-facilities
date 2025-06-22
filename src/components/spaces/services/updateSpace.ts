
import { supabase } from "@/integrations/supabase/client";
import { RoomTypeEnum, roomTypeToString, statusToString, StorageTypeEnum, storageTypeToString } from "../rooms/types/roomEnums";

// Define a specific type for room updates
interface RoomUpdateData {
  id?: string;
  name?: string;
  roomNumber?: string;
  roomType?: RoomTypeEnum;
  status?: string;
  floorId?: string;
  description?: string;
  phoneNumber?: string;
  currentFunction?: string;
  isStorage?: boolean;
  storageType?: StorageTypeEnum;
  storageCapacity?: number;
  storageNotes?: string;
  parentRoomId?: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  rotation?: number;
  courtRoomPhotos?: { judge_view?: string | null; audience_view?: string | null };
}

/**
 * Updates a room in the database, including parent_room_id and all editable fields.
 * @param id Room ID (UUID)
 * @param data Partial room data to update
 * @returns Updated room object or throws error
 */
export async function updateSpace(id: string, data: Partial<RoomUpdateData>) {
  if (!id) throw new Error("Room ID is required for update");

  // Map frontend fields to DB columns as needed
  const updateData: Record<string, any> = {
    name: data.name,
    room_number: data.roomNumber,
    room_type: data.roomType ? roomTypeToString(data.roomType as RoomTypeEnum) : undefined,
    status: data.status ? statusToString(data.status as any) : undefined,
    floor_id: data.floorId,
    description: data.description ?? null,
    phone_number: data.phoneNumber ?? null,
    current_function: data.currentFunction ?? null,
    is_storage: data.isStorage ?? false,
    storage_type: data.isStorage && data.storageType ? storageTypeToString(data.storageType as StorageTypeEnum) : null,
    storage_capacity: data.storageCapacity ?? null,
    storage_notes: data.storageNotes ?? null,
    parent_room_id: data.parentRoomId ?? null,
    position: data.position ?? { x: 0, y: 0 },
    size: data.size ?? { width: 150, height: 100 },
    rotation: data.rotation ?? 0,
    courtroom_photos: data.roomType === RoomTypeEnum.COURTROOM ? (data.courtRoomPhotos || { judge_view: null, audience_view: null }) : null
  };

  // Remove undefined values (don't update those fields)
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
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
