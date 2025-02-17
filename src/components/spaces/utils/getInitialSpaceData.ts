
import { EditSpaceFormData } from "../schemas/editSpaceSchema";

type SpaceType = "room" | "door" | "hallway";

type InitialData = {
  type?: SpaceType;
  name?: string;
  status?: "active" | "inactive" | "under_maintenance";
  floorId?: string;
  description?: string;
  // Snake case fields from database
  room_number?: string;
  room_type?: string;
  phone_number?: string;
  parent_room_id?: string | null;
  is_storage?: boolean;
  storage_type?: string | null;
  storage_capacity?: number | null;
  storage_notes?: string;
  current_function?: string;
  // Additional door fields
  doorType?: string;
  securityLevel?: string;
  passkeyEnabled?: boolean;
  // Additional hallway fields
  hallwayType?: string;
  section?: string;
  notes?: string;
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
      roomNumber: initialData?.room_number || "",
      roomType: initialData?.room_type || "office",
      phoneNumber: initialData?.phone_number || "",
      description: initialData?.description || "",
      isStorage: initialData?.is_storage ?? false,
      storageCapacity: initialData?.storage_capacity ?? null,
      storageType: initialData?.is_storage ? 
        (initialData?.storage_type || "general_storage") : null,
      storageNotes: initialData?.storage_notes || "",
      parentRoomId: initialData?.parent_room_id ?? null,
      currentFunction: initialData?.current_function || "",
    };
  }

  if (type === "door") {
    return {
      ...baseValues,
      type: "door" as const,
      doorType: initialData?.doorType || "standard",
      securityLevel: initialData?.securityLevel || "standard",
      passkeyEnabled: initialData?.passkeyEnabled || false,
    };
  }

  if (type === "hallway") {
    return {
      ...baseValues,
      type: "hallway" as const,
      hallwayType: initialData?.hallwayType || "public_main",
      section: initialData?.section || "left_wing",
      notes: initialData?.notes || "",
    };
  }

  return baseValues as EditSpaceFormData;
};
