
import { supabase } from "@/integrations/supabase/client";
import { CreateSpaceFormData } from "../schemas/createSpaceSchema";

export async function createSpace(data: CreateSpaceFormData) {
  if (data.type === "room") {
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .insert({
        name: data.name,
        floor_id: data.floorId,
        room_number: data.roomNumber,
        room_type: data.roomType,
        description: data.description,
        status: data.status,
        is_storage: data.isStorage,
        storage_capacity: data.storageCapacity,
        storage_type: data.storageType,
        storage_notes: data.storageNotes,
        current_function: data.currentFunction,
        parent_room_id: data.parentRoomId,
      })
      .select()
      .single();

    if (roomError) throw roomError;
    return room;
  }

  if (data.type === "hallway") {
    const { data: hallway, error: hallwayError } = await supabase
      .from("hallways")
      .insert({
        name: data.name,
        floor_id: data.floorId,
        type: data.hallwayType,
        section: data.section,
        status: data.status,
        notes: data.notes,
      })
      .select()
      .single();

    if (hallwayError) throw hallwayError;
    return hallway;
  }

  if (data.type === "door") {
    const { data: door, error: doorError } = await supabase
      .from("doors")
      .insert({
        name: data.name,
        floor_id: data.floorId,
        type: data.doorType,
        status: data.status,
        security_level: data.securityLevel,
        passkey_enabled: data.passkeyEnabled,
      })
      .select()
      .single();

    if (doorError) throw doorError;
    return door;
  }
}
