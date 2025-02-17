
import { EditSpaceFormData } from "../schemas/editSpaceSchema";

type SpaceType = "room" | "door" | "hallway";

type InitialData = Partial<EditSpaceFormData> & {
  type?: SpaceType;
  room_number?: string;  // Add snake_case variants
  room_type?: string;
  phone_number?: string;
  parent_room_id?: string | null;
  is_storage?: boolean;
  storage_type?: string | null;
  storage_capacity?: number | null;
  storage_notes?: string;
  current_function?: string;
};

export const getInitialSpaceData = (
  id: string,
  type: SpaceType,
  initialData?: InitialData
): EditSpaceFormData => {
  const baseValues = {
    id,
    type,
    name: initialData?.name || "",
    status: initialData?.status || "active",
    floorId: initialData?.floorId || "",
  };

  if (type === "room") {
    return {
      ...baseValues,
      type: "room" as const,
      roomNumber: initialData?.room_number || initialData?.roomNumber || "",
      roomType: initialData?.room_type || initialData?.roomType || "office",
      phoneNumber: initialData?.phone_number || initialData?.phoneNumber || "",
      description: initialData?.description || "",
      isStorage: initialData?.is_storage ?? initialData?.isStorage ?? false,
      storageCapacity: initialData?.storage_capacity ?? initialData?.storageCapacity ?? null,
      storageType: (initialData?.is_storage || initialData?.isStorage) ? 
        (initialData?.storage_type || initialData?.storageType || "general_storage") : null,
      storageNotes: initialData?.storage_notes || initialData?.storageNotes || "",
      parentRoomId: initialData?.parent_room_id ?? initialData?.parentRoomId ?? null,
      currentFunction: initialData?.current_function || initialData?.currentFunction || "",
    };
  }

  if (type === "door") {
    return {
      ...baseValues,
      type: "door" as const,
      doorType: initialData?.type === "door" ? initialData.doorType || "standard" : "standard",
      securityLevel: initialData?.type === "door" ? initialData.securityLevel || "standard" : "standard",
      passkeyEnabled: initialData?.type === "door" ? initialData.passkeyEnabled || false : false,
    };
  }

  if (type === "hallway") {
    return {
      ...baseValues,
      type: "hallway" as const,
      hallwayType: initialData?.type === "hallway" ? initialData.hallwayType || "public_main" : "public_main",
      section: initialData?.type === "hallway" ? initialData.section || "left_wing" : "left_wing",
      notes: initialData?.type === "hallway" ? initialData.notes || "" : "",
    };
  }

  return baseValues as EditSpaceFormData;
};
