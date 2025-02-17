
import { EditSpaceFormData } from "../schemas/editSpaceSchema";
import { RoomType, StorageType } from "../rooms/types/RoomTypes";

type SpaceType = "room" | "door" | "hallway";
type SecurityLevel = "standard" | "restricted" | "high_security";
type DoorType = "standard" | "emergency" | "secure" | "maintenance";
type HallwayType = "public_main" | "private";
type Section = "left_wing" | "right_wing" | "connector";

type InitialData = {
  type?: SpaceType;
  name?: string;
  status?: "active" | "inactive" | "under_maintenance";
  floorId?: string;
  description?: string;
  // Snake case fields from database
  room_number?: string;
  room_type?: RoomType;
  phone_number?: string;
  parent_room_id?: string | null;
  is_storage?: boolean;
  storage_type?: StorageType | null;
  storage_capacity?: number | null;
  storage_notes?: string;
  current_function?: string;
  // Additional door fields
  doorType?: DoorType;
  securityLevel?: SecurityLevel;
  passkeyEnabled?: boolean;
  // Additional hallway fields
  hallwayType?: HallwayType;
  section?: Section;
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
      roomType: (initialData?.room_type || "office") as RoomType,
      phoneNumber: initialData?.phone_number || "",
      description: initialData?.description || "",
      isStorage: initialData?.is_storage ?? false,
      storageCapacity: initialData?.storage_capacity ?? null,
      storageType: initialData?.is_storage ? 
        (initialData?.storage_type || "general_storage" as StorageType) : null,
      storageNotes: initialData?.storage_notes || "",
      parentRoomId: initialData?.parent_room_id ?? null,
      currentFunction: initialData?.current_function || "",
    };
  }

  if (type === "door") {
    return {
      ...baseValues,
      type: "door" as const,
      doorType: (initialData?.doorType || "standard") as DoorType,
      securityLevel: (initialData?.securityLevel || "standard") as SecurityLevel,
      passkeyEnabled: initialData?.passkeyEnabled || false,
    };
  }

  if (type === "hallway") {
    return {
      ...baseValues,
      type: "hallway" as const,
      hallwayType: (initialData?.hallwayType || "public_main") as HallwayType,
      section: (initialData?.section || "left_wing") as Section,
      notes: initialData?.notes || "",
    };
  }

  return baseValues as EditSpaceFormData;
};
